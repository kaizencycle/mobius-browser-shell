"""
Peer Protocol — Cross-sentinel communication between ATLAS-SHELL and MobiusATLAS.

When ATLAS-SHELL scores a PR below 60, it opens a cross-reference issue in
the MobiusATLAS repo requesting peer review. MobiusATLAS can then trigger
a consensus check via workflow_dispatch.

This implements DVA (Distributed Validation Architecture) in practice.
Neither sentinel has unilateral authority on contested findings.
"""

import requests
import datetime


def notify_peer_sentinel(
    sentinel_name: str,
    peer_repo: str,
    pr_number: str,
    repo: str,
    score: int,
    sentinel_hash: str,
    github_token: str,
) -> bool:
    """
    Open a cross-reference issue in the peer sentinel's repo requesting review.
    Returns True if notification succeeded.
    """

    if not github_token:
        print("No GITHUB_TOKEN — cannot notify peer sentinel")
        return False

    timestamp = datetime.datetime.now(datetime.timezone.utc).isoformat().replace("+00:00", "Z")
    owner, repo_name = peer_repo.split("/")

    shell_pr_url = f"https://github.com/{repo}/pull/{pr_number}"

    issue_title = f"⬡ Peer Review Request: {sentinel_name} flagged concern (score {score}/100)"

    issue_body = f"""## Cross-Sentinel Review Request

**From:** {sentinel_name}  
**To:** MobiusATLAS  
**Protocol:** DVA Peer Consensus  
**Timestamp:** {timestamp}  

---

**{sentinel_name}** has assessed a browser shell PR with a covenant score below threshold:

- **Shell PR:** {shell_pr_url}
- **Score:** {score}/100 (threshold: 60)
- **Sentinel sig:** `sha256:{sentinel_hash}`

### Request

MobiusATLAS is requested to review this finding and respond with:
- **AGREE** — finding is valid, monorepo implications exist
- **CONTEST** — finding is disputed (with reasoning)
- **NOT APPLICABLE** — no monorepo implications

### Consensus Protocol

| Outcome | Result |
|---------|--------|
| Both AGREE | Finding RATIFIED — steward notified |
| ATLAS-SHELL concern + MobiusATLAS contests | Finding CONTESTED — steward decides |
| MobiusATLAS silent > 24h | Finding PROVISIONAL — steward notified |

To respond, trigger the `atlas-shell` workflow in the browser shell repo
with `mode: consensus` and `PEER_FINDING` set to your assessment.

---

*This issue was opened automatically by {sentinel_name}.*  
*Peer sentinel cross-validation is a constitutional requirement of DVA.*  
*Neither sentinel has unilateral authority on contested findings.*
"""

    headers = {
        "Authorization": f"Bearer {github_token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }

    try:
        resp = requests.post(
            f"https://api.github.com/repos/{owner}/{repo_name}/issues",
            headers=headers,
            json={
                "title": issue_title,
                "body": issue_body,
                "labels": ["atlas-consensus", "peer-review", "dva"],
            },
            timeout=15,
        )

        if resp.status_code == 201:
            issue_url = resp.json().get("html_url", "")
            print(f"Peer sentinel notified: {issue_url}")
            return True
        else:
            print(f"Failed to notify peer: {resp.status_code} {resp.text[:200]}")
            return False

    except Exception as e:
        print(f"Peer notification error: {e}")
        return False
