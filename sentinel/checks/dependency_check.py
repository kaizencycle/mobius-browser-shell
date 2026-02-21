"""
Dependency Check — Ecology / bundle impact for the browser shell.
Flags: unnecessary dependencies, heavy imports, bundle bloat.
"""

import re

BLOAT_PATTERNS = [
    (r'\+.*"lodash"|"lodash-full"', "Lodash full — use lodash-es or specific imports"),
    (r'\+.*"moment"', "Moment.js — consider date-fns or native Intl"),
    (r'\+.*"jquery"', "jQuery — unnecessary in React/Vite stack"),
    (r'import\s+\*\s+as\s+\w+\s+from', "Namespace import — may pull unused code"),
    (r'\+.*"@mui/material"', "MUI heavy — consider lighter alternatives"),
    (r'\.\.\./\.\./node_modules', "Direct node_modules reference"),
]

GOOD_PATTERNS = [
    (r'utils/time\.ts|utils/date', "Utility module for time — lightweight"),
    (r'vite\.config', "Vite config present — bundling optimized"),
    (r'tree.?shak|sideEffects', "Tree-shaking configured"),
    (r'lucide-react', "Lucide icons — tree-shakeable"),
]


def run_dependency_check(diff: str) -> dict:
    concerns = []
    affirmations = []

    for pattern, message in BLOAT_PATTERNS:
        if re.search(pattern, diff, re.IGNORECASE):
            concerns.append(message)

    for pattern, message in GOOD_PATTERNS:
        if re.search(pattern, diff, re.IGNORECASE):
            affirmations.append(message)

    if concerns:
        return {
            "status": "⚠ CONCERN",
            "summary": f"{len(concerns)} dependency concern(s): {'; '.join(concerns[:2])}",
            "concerns": concerns,
            "affirmations": affirmations,
        }

    return {
        "status": "✦ PASS",
        "summary": f"No unnecessary dependencies. {len(affirmations)} good pattern(s) confirmed.",
        "concerns": [],
        "affirmations": affirmations,
    }
