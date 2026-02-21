"""
EPICON Check — Security boundary validation for the browser shell.
Flags: exposed secrets, trust boundary violations, unsafe origins.
"""

import re

DANGER_PATTERNS = [
    (r'ANTHROPIC_API_KEY\s*[=:]\s*["\']?[A-Za-z0-9\-_]{20,}', "Anthropic API key exposed in diff"),
    (r'GEMINI_API_KEY\s*[=:]\s*["\']?[A-Za-z0-9\-_]{20,}', "Gemini API key exposed in diff"),
    (r'process\.env\.[A-Z_]+\s*(?:in|to)\s*(?:client|vite\.define|import\.meta)', "Server env var leaked to client"),
    (r'Access-Control-Allow-Origin["\s:]*\*', "Wildcard CORS origin — trust boundary breach"),
    (r'localStorage\.(setItem|getItem).*(?:key|secret|token|passkey)', "Sensitive data in localStorage"),
    (r'console\.log.*(?:citizenId|covenantHash|credential|token)', "Sensitive field logged to console"),
    (r'dangerouslySetInnerHTML', "XSS vector: dangerouslySetInnerHTML"),
    (r'eval\s*\(', "eval() usage — code injection risk"),
]

GOOD_PATTERNS = [
    (r'process\.env\.WEBAUTHN_RP_ID', "WebAuthn RP ID read from env"),
    (r'ALLOWED_ORIGINS', "Origin allowlist present"),
    (r'rate.?limit', "Rate limiting present"),
    (r'sanitize|DOMPurify', "Input sanitization present"),
]


def run_epicon_check(diff: str) -> dict:
    concerns = []
    affirmations = []

    for pattern, message in DANGER_PATTERNS:
        if re.search(pattern, diff, re.IGNORECASE):
            concerns.append(message)

    for pattern, message in GOOD_PATTERNS:
        if re.search(pattern, diff, re.IGNORECASE):
            affirmations.append(message)

    if concerns:
        return {
            "status": "⚠ CONCERN",
            "summary": f"{len(concerns)} security concern(s): {'; '.join(concerns[:2])}",
            "concerns": concerns,
            "affirmations": affirmations,
        }

    return {
        "status": "✦ PASS",
        "summary": f"No security boundary violations detected. {len(affirmations)} good pattern(s) confirmed.",
        "concerns": [],
        "affirmations": affirmations,
    }
