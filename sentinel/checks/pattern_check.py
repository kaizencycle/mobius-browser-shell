"""
Pattern Check — Architectural consistency for the browser shell.
Flags: deviations from established patterns, missing error handling.
"""

import re

CONSISTENCY_PATTERNS = [
    (r'throw\s+new\s+Error\s*\([^)]*\)', "Explicit error throwing — good"),
    (r'ErrorBoundary|error.?boundary', "Error boundary present"),
    (r'ShellErrorBoundary|RootErrorBoundary', "Shell error boundaries used"),
    (r'api/.*\.ts', "API route follows .ts pattern"),
    (r'components/.*\.tsx', "Component follows .tsx pattern"),
    (r'hooks/use[A-Z]\w+', "Hook follows useX naming"),
]

CONCERN_PATTERNS = [
    (r'catch\s*\(\s*\)\s*\{\s*\}', "Empty catch block — swallows errors"),
    (r'//\s*todo|//\s*fixme|//\s*hack', "TODO/FIXME/HACK left in code"),
    (r'@ts-ignore|@ts-expect-error', "TypeScript suppressions — review needed"),
    (r'console\.(log|debug|info)\s*\(', "Console logging in production path"),
    (r'debugger\s*;', "Debugger statement left in"),
]


def run_pattern_check(diff: str) -> dict:
    concerns = []
    affirmations = []

    for pattern, message in CONCERN_PATTERNS:
        if re.search(pattern, diff, re.IGNORECASE):
            concerns.append(message)

    for pattern, message in CONSISTENCY_PATTERNS:
        if re.search(pattern, diff, re.IGNORECASE):
            affirmations.append(message)

    if concerns:
        return {
            "status": "⚠ CONCERN",
            "summary": f"{len(concerns)} pattern concern(s): {'; '.join(concerns[:2])}",
            "concerns": concerns,
            "affirmations": affirmations,
        }

    return {
        "status": "✦ PASS",
        "summary": f"Architectural consistency maintained. {len(affirmations)} good pattern(s) confirmed.",
        "concerns": [],
        "affirmations": affirmations,
    }
