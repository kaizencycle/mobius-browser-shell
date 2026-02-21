#!/usr/bin/env python3
"""
ATLAS-SHELL: Browser Shell Sentinel
Peer sentinel to MobiusATLAS. Constitutional reviewer for the Mobius Substrate
browser shell. Operates via GitHub Actions — no persistent server required.

Modes:
  review     — PR constitutional review + covenant scoring
  deployment — Post-deploy health monitoring via Vercel API
  consensus  — Cross-sentinel validation with MobiusATLAS
  health     — Daily health report (deployment status, summary)
"""

import os
import sys
import json
import hashlib
import datetime
import requests
import anthropic

from checks.epicon_check import run_epicon_check
from checks.citizen_data_check import run_citizen_data_check
from checks.dependency_check import run_dependency_check
from checks.pattern_check import run_pattern_check
from consensus.covenant_score import compute_covenant_score
from consensus.peer_protocol import notify_peer_sentinel

# ── Identity ──────────────────────────────────────────────────────────────────

SENTINEL_NAME = "ATLAS-SHELL"
SENTINEL_VERSION = "1.0.0"
PEER_SENTINEL = "MobiusATLAS"
PEER_REPO = os.environ.get("MOBIUS_ATLAS_REPO", "kaizencycle/Mobius-Systems")

CONSTITUTIONAL_PROMPT = """
You are ATLAS-SHELL, a constitutional sentinel for the Mobius Substrate browser shell.

Your identity:
- You are a peer sentinel to MobiusATLAS, which guards the Mobius Substrate monorepo
- Neither sentinel has unilateral authority — you cross-validate each other
- You operate under the Three Covenants: Integrity, Ecology, Custodianship
- You are advisory, not blocking — you surface findings, stewards decide

Your constitutional role:
- Integrity: Flag any breach of trust — exposed secrets, auth boundary violations,
  deceptive patterns, data handling that violates citizen expectations
- Ecology: Flag unnecessary complexity, bloated dependencies, wasteful API patterns,
  anything that increases the cost of maintaining this as public infrastructure
- Custodianship: Flag anything that extracts from rather than contributes to the commons —
  proprietary lock-in, removing CC0 compatibility, centralizing what should be distributed

Your voice:
- Direct, clear, constitutional — not bureaucratic
- You name specific lines and files when flagging concerns
- You acknowledge good work explicitly when you see it
- You never say "I cannot" — you assess and report
- You speak as a peer to the steward, not as a gatekeeper

Format your assessment as structured markdown with:
1. A headline covenant score (0-100)
2. Dimension scores (Integrity, Ecology, Custodianship, Craft)
3. Specific findings (concerns and affirmations)
4. A cross-sentinel note if MobiusATLAS should review anything
5. A closing constitutional statement
"""

# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else "review"

    if mode == "review":
        run_pr_review()
    elif mode == "deployment":
        run_deployment_monitor()
    elif mode == "consensus":
        run_consensus_check()
    elif mode == "health":
        run_health_report()
    else:
        print(f"Unknown mode: {mode}", file=sys.stderr)
        sys.exit(1)


# ── PR Review ─────────────────────────────────────────────────────────────────

def run_pr_review():
    pr_number = os.environ.get("PR_NUMBER") or "unknown"
    pr_title = os.environ.get("PR_TITLE", "")
    pr_body = os.environ.get("PR_BODY", "")
    repo = os.environ.get("REPO", "")
    sha = os.environ.get("SHA", "")

    # Read diff
    diff_content = ""
    try:
        with open("/tmp/pr.diff", "r") as f:
            diff_content = f.read()
        # Truncate if enormous — keep first 12k chars
        if len(diff_content) > 12000:
            diff_content = diff_content[:12000] + "\n\n[diff truncated — ATLAS-SHELL reviewed first 12k chars]"
    except FileNotFoundError:
        diff_content = "[no diff available]"

    # Run static checks
    epicon = run_epicon_check(diff_content)
    citizen_data = run_citizen_data_check(diff_content)
    dependency = run_dependency_check(diff_content)
    pattern = run_pattern_check(diff_content)

    static_summary = f"""
Static analysis results:
- EPICON security check: {epicon['status']} — {epicon['summary']}
- Citizen data check: {citizen_data['status']} — {citizen_data['summary']}
- Dependency check: {dependency['status']} — {dependency['summary']}
- Pattern check: {pattern['status']} — {pattern['summary']}
"""

    # Call ATLAS via Anthropic API
    api_key = os.environ.get("ANTHROPIC_API_KEY", "")
    if not api_key:
        print("No ANTHROPIC_API_KEY — using static analysis only")
        assessment = "*(AI assessment skipped — no API key. Score based on static checks only.)*"
        score = compute_covenant_score(epicon, citizen_data, dependency, pattern, assessment)
    else:
        client = anthropic.Anthropic(api_key=api_key)

        user_message = f"""
PR #{pr_number}: {pr_title}

Description:
{pr_body or '(no description provided)'}

Static analysis:
{static_summary}

Diff:
```diff
{diff_content}
```

Please provide your constitutional review. Compute a covenant score and
assess this PR across all four dimensions. Be specific about file and
line references when flagging concerns.
"""

        response = client.messages.create(
            model="claude-opus-4-6",
            max_tokens=2000,
            system=CONSTITUTIONAL_PROMPT,
            messages=[{"role": "user", "content": user_message}]
        )

        assessment = response.content[0].text

        # Compute score from static checks + AI assessment
        score = compute_covenant_score(epicon, citizen_data, dependency, pattern, assessment)

    # Generate sentinel signature
    timestamp = datetime.datetime.now(datetime.timezone.utc).isoformat().replace("+00:00", "Z")
    sig_input = f"{SENTINEL_NAME}:{pr_number}:{sha}:{timestamp}"
    sentinel_hash = hashlib.sha256(sig_input.encode()).hexdigest()[:16]

    # Build comment
    score_emoji = "✦" if score >= 80 else "◉" if score >= 60 else "⚠"
    score_label = "Ratified" if score >= 80 else "Passed with notes" if score >= 60 else "Concern flagged"

    comment = f"""## ⬡ ATLAS-SHELL Constitutional Review

**{score_emoji} Covenant Score: {score}/100 — {score_label}**

---

{assessment}

---

<details>
<summary>Static Analysis Detail</summary>

| Check | Status | Notes |
|-------|--------|-------|
| EPICON Security | {epicon['status']} | {epicon['summary']} |
| Citizen Data | {citizen_data['status']} | {citizen_data['summary']} |
| Dependency Ecology | {dependency['status']} | {dependency['summary']} |
| Pattern Consistency | {pattern['status']} | {pattern['summary']} |

</details>

<details>
<summary>Sentinel Identity</summary>

```
Sentinel:  {SENTINEL_NAME} v{SENTINEL_VERSION}
Peer:      {PEER_SENTINEL} ({PEER_REPO})
Timestamp: {timestamp}
Sig:       sha256:{sentinel_hash}
Covenant:  Integrity · Ecology · Custodianship
```

*This assessment is advisory. Steward judgment governs final decisions.*  
*Score < 60 triggers peer review request to {PEER_SENTINEL}.*

</details>
"""

    # Write outputs
    with open("/tmp/atlas_review.md", "w") as f:
        f.write(comment)

    with open("/tmp/atlas_score.txt", "w") as f:
        f.write(str(score))

    print(f"ATLAS-SHELL review complete. Score: {score}/100")

    # If score is low, notify peer sentinel
    if score < 60 and pr_number != "unknown":
        notify_peer_sentinel(
            sentinel_name=SENTINEL_NAME,
            peer_repo=PEER_REPO,
            pr_number=pr_number,
            repo=repo,
            score=score,
            sentinel_hash=sentinel_hash,
            github_token=os.environ.get("GITHUB_TOKEN", ""),
        )


# ── Deployment Monitor ────────────────────────────────────────────────────────

def run_deployment_monitor():
    vercel_token = os.environ.get("VERCEL_TOKEN", "")
    team_id = os.environ.get("VERCEL_TEAM_ID", "")
    project_id = os.environ.get("VERCEL_PROJECT_ID", "")
    sha = os.environ.get("SHA", "")
    commit_message = os.environ.get("COMMIT_MESSAGE", "")
    repo = os.environ.get("REPO", "")

    if not vercel_token:
        print("No VERCEL_TOKEN — skipping deployment monitor")
        return

    # Poll Vercel for latest deployment
    headers = {"Authorization": f"Bearer {vercel_token}"}
    params = {"projectId": project_id, "teamId": team_id, "limit": 5}

    try:
        resp = requests.get(
            "https://api.vercel.com/v6/deployments",
            headers=headers,
            params=params,
            timeout=15
        )
        deployments = resp.json().get("deployments", [])
    except Exception as e:
        print(f"Vercel API error: {e}")
        return

    if not deployments:
        print("No deployments found")
        return

    latest = deployments[0]
    state = latest.get("state", "UNKNOWN")
    deploy_url = latest.get("url", "")
    deploy_id = latest.get("uid", "")

    # Get runtime logs if available
    log_summary = ""
    try:
        log_resp = requests.get(
            f"https://api.vercel.com/v2/deployments/{deploy_id}/events",
            headers=headers,
            params={"teamId": team_id, "limit": 50},
            timeout=15
        )
        logs = log_resp.json()
        errors = [
            e.get("text", "") for e in logs
            if isinstance(e, dict) and e.get("type") == "stderr"
        ]
        if errors:
            log_summary = "\n".join(errors[:10])
    except Exception:
        log_summary = "(logs unavailable)"

    # Build deployment summary as a commit comment
    timestamp = datetime.datetime.now(datetime.timezone.utc).isoformat().replace("+00:00", "Z")
    state_emoji = "✦" if state == "READY" else "⚠" if state == "ERROR" else "◉"

    summary = f"""## ⬡ ATLAS-SHELL Deployment Monitor

**{state_emoji} Deployment {state}**

| Field | Value |
|-------|-------|
| Commit | `{sha[:8]}` |
| Message | {commit_message[:80]} |
| Deploy ID | `{deploy_id[:16]}` |
| URL | https://{deploy_url} |
| State | **{state}** |
| Timestamp | {timestamp} |

{"**⚠ Runtime errors detected:**" + chr(10) + "```" + chr(10) + log_summary + chr(10) + "```" if log_summary else "No runtime errors detected."}

*ATLAS-SHELL deployment sentinel · Mobius Substrate*
"""

    print(summary)
    print(f"Deployment state: {state}")

    # If deployment failed, open a GitHub issue
    if state == "ERROR" and repo:
        try:
            gh_headers = {
                "Authorization": f"Bearer {os.environ.get('GITHUB_TOKEN', '')}",
                "Accept": "application/vnd.github+json"
            }
            issue_body = {
                "title": f"⬡ ATLAS-SHELL: Deployment failure detected ({sha[:8]})",
                "body": summary,
                "labels": ["deployment", "atlas-shell"]
            }
            owner, repo_name = repo.split("/")
            requests.post(
                f"https://api.github.com/repos/{owner}/{repo_name}/issues",
                headers=gh_headers,
                json=issue_body,
                timeout=15
            )
            print("Opened GitHub issue for deployment failure")
        except Exception as e:
            print(f"Could not open issue: {e}")


# ── Consensus Check ───────────────────────────────────────────────────────────

def run_consensus_check():
    """
    Called when MobiusATLAS has flagged something in the monorepo that
    touches the browser shell. ATLAS-SHELL confirms or contests.
    """
    finding = os.environ.get("PEER_FINDING", "")
    peer_score = int(os.environ.get("PEER_SCORE", "75"))
    pr_ref = os.environ.get("PEER_PR_REF", "")

    if not finding:
        print("No peer finding to evaluate")
        return

    api_key = os.environ.get("ANTHROPIC_API_KEY", "")
    if not api_key:
        print("No ANTHROPIC_API_KEY — cannot run consensus check")
        return

    client = anthropic.Anthropic(api_key=api_key)

    response = client.messages.create(
        model="claude-opus-4-6",
        max_tokens=800,
        system=CONSTITUTIONAL_PROMPT,
        messages=[{
            "role": "user",
            "content": f"""MobiusATLAS (your peer sentinel) has flagged the following concern
in the Mobius Substrate monorepo (score: {peer_score}/100):

{finding}

Reference: {pr_ref}

As ATLAS-SHELL, you are responsible for the browser shell layer.
Does this finding affect the shell? Do you AGREE, CONTEST, or find it
NOT APPLICABLE to the shell?

Be specific. If you contest, explain why. If you agree, confirm what
shell-side changes would address it. If not applicable, briefly explain.
Your response becomes part of the permanent sentinel consensus record.
"""
        }]
    )

    consensus_response = response.content[0].text
    timestamp = datetime.datetime.now(datetime.timezone.utc).isoformat().replace("+00:00", "Z")

    print(f"ATLAS-SHELL consensus response ({timestamp}):")
    print(consensus_response)

    with open("/tmp/atlas_consensus.md", "w") as f:
        f.write(f"## ⬡ ATLAS-SHELL Consensus Response\n\n")
        f.write(f"**Peer finding score:** {peer_score}/100\n\n")
        f.write(consensus_response)
        f.write(f"\n\n*{SENTINEL_NAME} · {timestamp}*")


# ── Health Report ─────────────────────────────────────────────────────────────

def run_health_report():
    """
    Daily health report: deployment status, summary.
    Runs on schedule (08:00 UTC) or workflow_dispatch.
    """
    vercel_token = os.environ.get("VERCEL_TOKEN", "")
    team_id = os.environ.get("VERCEL_TEAM_ID", "")
    project_id = os.environ.get("VERCEL_PROJECT_ID", "")
    repo = os.environ.get("REPO", "")

    timestamp = datetime.datetime.now(datetime.timezone.utc).isoformat().replace("+00:00", "Z")

    report = f"""## ⬡ ATLAS-SHELL Daily Health Report

**Timestamp:** {timestamp}

"""

    if vercel_token and project_id:
        headers = {"Authorization": f"Bearer {vercel_token}"}
        params = {"projectId": project_id, "teamId": team_id, "limit": 5}

        try:
            resp = requests.get(
                "https://api.vercel.com/v6/deployments",
                headers=headers,
                params=params,
                timeout=15
            )
            deployments = resp.json().get("deployments", [])

            if deployments:
                latest = deployments[0]
                state = latest.get("state", "UNKNOWN")
                deploy_url = latest.get("url", "")
                state_emoji = "✦" if state == "READY" else "⚠" if state == "ERROR" else "◉"
                report += f"""### Deployment Status
**{state_emoji} Latest: {state}**
- URL: https://{deploy_url}
- Deployments in last 24h: {len(deployments)}

"""
            else:
                report += "### Deployment Status\nNo recent deployments found.\n\n"
        except Exception as e:
            report += f"### Deployment Status\nVercel API error: {e}\n\n"
    else:
        report += "### Deployment Status\nNo Vercel credentials — skipping.\n\n"

    report += f"""---
*{SENTINEL_NAME} v{SENTINEL_VERSION} · Mobius Substrate · Advisory only*
"""

    print(report)


if __name__ == "__main__":
    main()
