"""
Covenant Score — Scoring engine for ATLAS-SHELL constitutional review.
Combines static checks (60% weight) with AI assessment (40% weight).
"""

import re


def compute_covenant_score(
    epicon: dict,
    citizen_data: dict,
    dependency: dict,
    pattern: dict,
    assessment: str,
) -> int:
    """
    Compute covenant score 0-100.
    Static checks: 60% (15 points each for PASS)
    AI assessment: 40% (parsed from assessment text)
    """
    checks = [epicon, citizen_data, dependency, pattern]
    static_points = 0
    for check in checks:
        if check.get("status") == "✦ PASS":
            static_points += 25
        elif check.get("status") == "⚠ CONCERN":
            # Partial credit for concerns — 5 points if some affirmations
            if check.get("affirmations"):
                static_points += 5
            # else 0

    static_score = min(100, static_points)  # 0-100 scale

    # Parse AI score from assessment
    ai_score = _parse_ai_score(assessment)

    # Weighted combination: 60% static, 40% AI
    final = round(static_score * 0.6 + ai_score * 0.4)
    return max(0, min(100, final))


def _parse_ai_score(assessment: str) -> int:
    """Extract covenant score from AI assessment text."""
    if not assessment:
        return 75  # Default

    # Try "Covenant Score: 84/100" or "84/100" or "Score: 84"
    patterns = [
        r'[Cc]ovenant\s+[Ss]core[:\s]+(\d+)\s*/\s*100',
        r'[Ss]core[:\s]+(\d+)\s*/\s*100',
        r'\*\*(\d+)\s*/\s*100\*\*',
        r'(\d{2,3})\s*/\s*100',
        r'[Ss]core[:\s]+(\d+)',
    ]

    for pat in patterns:
        match = re.search(pat, assessment)
        if match:
            score = int(match.group(1))
            return max(0, min(100, score))

    # Fallback: look for dimension scores like "Integrity (28/30)"
    dim_scores = re.findall(r'\((\d+)\s*/\s*(\d+)\)', assessment)
    if dim_scores:
        total = sum(int(n) for n, _ in dim_scores)
        max_possible = sum(int(d) for _, d in dim_scores)
        if max_possible > 0:
            return int(100 * total / max_possible)

    return 75  # Default when unparseable
