"""
Citizen Data Check — Validates citizen data handling in the browser shell.
Flags: extractive patterns, analytics tracking, improper data transmission.
"""

import re

EXTRACTIVE_PATTERNS = [
    (r'analytics\.(track|identify|page)', "Analytics tracking — extractive pattern"),
    (r'gtag|ga\(|google-analytics|mixpanel|segment', "Third-party analytics — extractive"),
    (r'fetch\s*\([^)]*\/api\/[^)]*citizen[^)]*\)', "Citizen data transmitted without consent"),
    (r'postMessage.*(?:citizenId|covenantHash)', "Sensitive citizen data in postMessage"),
    (r'\.sendBeacon\s*\(', "Beacon API — potential data exfiltration"),
    (r'localStorage\.setItem.*(?:citizenId|credential)', "Citizen credential in localStorage"),
]

GOOD_PATTERNS = [
    (r'citizenId.*display|display.*citizenId', "Citizen ID displayed, not transmitted"),
    (r'CC0|cc0|public domain', "CC0 attribution present"),
    (r'covenant.*accept|accept.*covenant', "Covenant acceptance pattern"),
    (r'useCitizenId|useCitizenProfile', "Proper citizen hooks used"),
]


def run_citizen_data_check(diff: str) -> dict:
    concerns = []
    affirmations = []

    for pattern, message in EXTRACTIVE_PATTERNS:
        if re.search(pattern, diff, re.IGNORECASE):
            concerns.append(message)

    for pattern, message in GOOD_PATTERNS:
        if re.search(pattern, diff, re.IGNORECASE):
            affirmations.append(message)

    if concerns:
        return {
            "status": "⚠ CONCERN",
            "summary": f"{len(concerns)} citizen data concern(s): {'; '.join(concerns[:2])}",
            "concerns": concerns,
            "affirmations": affirmations,
        }

    return {
        "status": "✦ PASS",
        "summary": f"No extractive patterns detected. {len(affirmations)} good pattern(s) confirmed.",
        "concerns": [],
        "affirmations": affirmations,
    }
