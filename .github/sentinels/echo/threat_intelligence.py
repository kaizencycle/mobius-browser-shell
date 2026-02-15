#!/usr/bin/env python3
"""
ECHO - Threat Intelligence Sentinel
=====================================

Automated RAG-based threat intelligence scanning across three domains:
  1. Cyber Threats   — CVEs, exploits, malware, APT campaigns
  2. Cyber Security  — Best practices, advisories, supply chain risks
  3. Digital Health   — Healthcare breaches, medical device security, health data governance

ECHO runs on a cron schedule (default: every 30 minutes) and feeds results
to the Citizen Shield dashboard. In CI, it validates that the threat
intelligence service code and types are intact.

"ECHO listens, so citizens stay prepared." — Mobius Doctrine
"""

import os
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

# ============================================
# Configuration
# ============================================

SENTINEL_NAME = "ECHO"
SENTINEL_ROLE = "Threat Intelligence Sentinel"
VERSION = "1.0.0"

DOMAINS = ["cyber_threats", "cyber_security", "digital_health"]

REQUIRED_FILES = [
    "services/EchoThreatIntelligence.ts",
    "components/CitizenShield/EchoThreatAgent.tsx",
    "components/CitizenShield/ThreatFeed.tsx",
    "components/CitizenShield/index.ts",
    "components/Labs/CitizenShieldLab.tsx",
]

REQUIRED_TYPE_EXPORTS = [
    "ThreatDomain",
    "ThreatSeverity",
    "ThreatStatus",
    "EchoAgentStatus",
    "ThreatIntelligenceEntry",
    "ThreatRAGSource",
    "EchoScanCycle",
    "EchoAgentState",
    "ThreatIntelligenceFeed",
]

RAG_SOURCE_KEYWORDS = [
    "CISA",
    "MITRE",
    "NVD",
    "OWASP",
    "HHS",
    "FDA",
    "WHO",
    "Health-ISAC",
]


# ============================================
# Checks
# ============================================

def check_required_files(workspace: str) -> list:
    """Verify all ECHO-related source files exist."""
    issues = []
    for filepath in REQUIRED_FILES:
        full_path = os.path.join(workspace, filepath)
        if not os.path.exists(full_path):
            issues.append(f"Missing required file: {filepath}")
        else:
            # Check file is not empty
            if os.path.getsize(full_path) == 0:
                issues.append(f"File is empty: {filepath}")
    return issues


def check_type_definitions(workspace: str) -> list:
    """Verify threat intelligence types are defined in types.ts."""
    issues = []
    types_path = os.path.join(workspace, "types.ts")

    if not os.path.exists(types_path):
        issues.append("types.ts not found — cannot verify ECHO type exports")
        return issues

    with open(types_path, "r") as f:
        content = f.read()

    for type_name in REQUIRED_TYPE_EXPORTS:
        if type_name not in content:
            issues.append(f"Missing type export: {type_name} in types.ts")

    return issues


def check_rag_sources(workspace: str) -> list:
    """Verify RAG source registries are configured in the service."""
    issues = []
    service_path = os.path.join(workspace, "services/EchoThreatIntelligence.ts")

    if not os.path.exists(service_path):
        issues.append("EchoThreatIntelligence.ts not found — cannot verify RAG sources")
        return issues

    with open(service_path, "r") as f:
        content = f.read()

    for keyword in RAG_SOURCE_KEYWORDS:
        if keyword not in content:
            issues.append(f"RAG source registry missing reference: {keyword}")

    # Check for cron/interval mechanism
    if "setInterval" not in content and "cron" not in content.lower():
        issues.append("No cron/interval mechanism found in ECHO service")

    # Check all three domains are covered
    for domain in DOMAINS:
        if domain not in content:
            issues.append(f"Domain '{domain}' not referenced in ECHO service")

    return issues


def check_citizen_shield_integration(workspace: str) -> list:
    """Verify ECHO is integrated into the Citizen Shield lab."""
    issues = []
    lab_path = os.path.join(workspace, "components/Labs/CitizenShieldLab.tsx")

    if not os.path.exists(lab_path):
        issues.append("CitizenShieldLab.tsx not found")
        return issues

    with open(lab_path, "r") as f:
        content = f.read()

    required_imports = ["EchoThreatAgent", "ThreatFeed"]
    for imp in required_imports:
        if imp not in content:
            issues.append(f"CitizenShieldLab missing import/usage: {imp}")

    return issues


def check_sentinel_config(workspace: str) -> list:
    """Verify ECHO is registered in sentinel config."""
    issues = []
    config_path = os.path.join(workspace, ".github/sentinels/shared/config.yaml")

    if not os.path.exists(config_path):
        issues.append("Sentinel config.yaml not found")
        return issues

    with open(config_path, "r") as f:
        content = f.read()

    if "echo:" not in content:
        issues.append("ECHO sentinel not registered in config.yaml")

    if "threat_intelligence" not in content:
        issues.append("Threat intelligence role not configured for ECHO in config.yaml")

    return issues


def check_constants_update(workspace: str) -> list:
    """Verify ECHO role has been updated in constants."""
    issues = []
    constants_path = os.path.join(workspace, "constants.ts")

    if not os.path.exists(constants_path):
        issues.append("constants.ts not found")
        return issues

    with open(constants_path, "r") as f:
        content = f.read()

    if "Threat Intelligence" not in content:
        issues.append("ECHO role not updated to 'Threat Intelligence' in constants.ts")

    return issues


# ============================================
# Main
# ============================================

def run_all_checks(workspace: str) -> dict:
    """Run all ECHO sentinel checks and produce a report."""
    all_issues = []
    checks_passed = 0
    checks_total = 0

    checks = [
        ("Required Files", check_required_files),
        ("Type Definitions", check_type_definitions),
        ("RAG Source Registry", check_rag_sources),
        ("Citizen Shield Integration", check_citizen_shield_integration),
        ("Sentinel Configuration", check_sentinel_config),
        ("Constants Update", check_constants_update),
    ]

    check_results = []
    for check_name, check_fn in checks:
        checks_total += 1
        issues = check_fn(workspace)
        passed = len(issues) == 0
        if passed:
            checks_passed += 1

        check_results.append({
            "name": check_name,
            "passed": passed,
            "issues": issues,
        })
        all_issues.extend(issues)

    # Determine verdict
    if len(all_issues) == 0:
        verdict = "APPROVED"
    elif any("Missing required file" in i for i in all_issues):
        verdict = "BLOCKED"
    else:
        verdict = "NEEDS_REVISION"

    report = {
        "sentinel": SENTINEL_NAME,
        "role": SENTINEL_ROLE,
        "version": VERSION,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "verdict": verdict,
        "score": checks_passed / checks_total if checks_total > 0 else 0,
        "checks_passed": checks_passed,
        "checks_total": checks_total,
        "issues": all_issues,
        "check_details": check_results,
        "domains_monitored": DOMAINS,
        "summary": (
            f"ECHO Threat Intelligence: {checks_passed}/{checks_total} checks passed. "
            f"{'All systems operational.' if verdict == 'APPROVED' else f'{len(all_issues)} issue(s) found.'}"
        ),
    }

    return report


def main():
    workspace = os.environ.get("GITHUB_WORKSPACE", os.getcwd())
    report = run_all_checks(workspace)

    # Save report
    reports_dir = os.path.join(workspace, "reports")
    os.makedirs(reports_dir, exist_ok=True)
    report_path = os.path.join(reports_dir, "echo-threat-intelligence.json")

    with open(report_path, "w") as f:
        json.dump(report, f, indent=2)

    # Print summary
    print(f"\n{'='*60}")
    print(f"  ECHO Threat Intelligence Sentinel Report")
    print(f"{'='*60}")
    print(f"  Verdict:  {report['verdict']}")
    print(f"  Score:    {report['score']:.2f}")
    print(f"  Checks:   {report['checks_passed']}/{report['checks_total']} passed")
    print(f"  Issues:   {len(report['issues'])}")
    print(f"  Domains:  {', '.join(report['domains_monitored'])}")
    print(f"{'='*60}")

    if report["issues"]:
        print("\n  Issues:")
        for i, issue in enumerate(report["issues"], 1):
            print(f"    {i}. {issue}")
        print()

    # Exit code
    if report["verdict"] == "BLOCKED":
        sys.exit(1)
    elif report["verdict"] == "NEEDS_REVISION":
        sys.exit(0)  # Warn but don't block
    else:
        sys.exit(0)


if __name__ == "__main__":
    main()
