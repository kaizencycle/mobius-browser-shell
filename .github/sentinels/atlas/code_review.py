#!/usr/bin/env python3
"""
ATLAS Code Review Sentinel
Reviews architectural patterns and security in PRs
"""

import os
import json
import subprocess
import sys

def get_changed_files():
    """Get list of changed files in PR"""
    try:
        result = subprocess.run(
            ['git', 'diff', '--name-only', 'origin/main...HEAD'],
            capture_output=True,
            text=True
        )
        if result.returncode != 0:
            # Fallback for non-PR contexts
            result = subprocess.run(
                ['git', 'diff', '--name-only', 'HEAD~1', 'HEAD'],
                capture_output=True,
                text=True
            )
        return [f for f in result.stdout.strip().split('\n') if f]
    except Exception as e:
        print(f"Warning: Could not get changed files: {e}")
        return []

def get_diff():
    """Get diff content"""
    try:
        result = subprocess.run(
            ['git', 'diff', 'origin/main...HEAD'],
            capture_output=True,
            text=True
        )
        if result.returncode != 0:
            result = subprocess.run(
                ['git', 'diff', 'HEAD~1', 'HEAD'],
                capture_output=True,
                text=True
            )
        return result.stdout[:50000]  # Limit to 50k chars
    except Exception:
        return ""

def review_with_claude(files, diff):
    """Use Claude to review code changes"""
    api_key = os.environ.get('ANTHROPIC_API_KEY')
    
    if not api_key:
        print("Warning: ANTHROPIC_API_KEY not set, using basic review")
        return basic_review(files, diff)
    
    try:
        from anthropic import Anthropic
        client = Anthropic(api_key=api_key)
        
        prompt = f"""You are ATLAS, the architectural sentinel for Mobius Systems.

Review these code changes for:
1. Architectural consistency with heart/shell/organs separation
2. Security vulnerabilities (hardcoded secrets, XSS, injection)
3. Performance implications
4. Integration risks with Labs (OAA, Reflections, Citizen Shield)
5. TypeScript/React best practices

Changed files:
{chr(10).join(files[:20])}

Diff (truncated):
{diff[:30000]}

Provide a JSON response with:
{{
    "verdict": "APPROVED" | "NEEDS_REVISION" | "BLOCKED",
    "concerns": ["list of specific concerns"],
    "recommendations": ["list of recommendations"],
    "summary": "brief summary"
}}

Be constructive but vigilant. Block only for security issues or major architectural violations."""
        
        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=2000,
            messages=[{"role": "user", "content": prompt}]
        )
        
        response_text = message.content[0].text
        
        # Try to parse JSON from response
        try:
            # Find JSON in response
            import re
            json_match = re.search(r'\{[\s\S]*\}', response_text)
            if json_match:
                return json.loads(json_match.group())
        except json.JSONDecodeError:
            pass
        
        # Fallback: determine verdict from text
        verdict = "APPROVED"
        if "BLOCKED" in response_text.upper():
            verdict = "BLOCKED"
        elif "NEEDS_REVISION" in response_text.upper() or "REVISION" in response_text.upper():
            verdict = "NEEDS_REVISION"
        
        return {
            "verdict": verdict,
            "concerns": [],
            "recommendations": [],
            "summary": response_text[:500]
        }
        
    except ImportError:
        print("Warning: anthropic package not installed")
        return basic_review(files, diff)
    except Exception as e:
        print(f"Warning: Claude review failed: {e}")
        return basic_review(files, diff)

def basic_review(files, diff):
    """Basic review without AI"""
    concerns = []
    verdict = "APPROVED"
    
    # Check for potential issues
    dangerous_patterns = [
        ('eval(', 'eval() usage detected - potential security risk'),
        ('innerHTML', 'innerHTML usage - consider using textContent or React'),
        ('dangerouslySetInnerHTML', 'dangerouslySetInnerHTML - ensure content is sanitized'),
        ('api_key', 'Potential hardcoded API key'),
        ('password', 'Potential hardcoded password'),
        ('secret', 'Potential hardcoded secret'),
    ]
    
    diff_lower = diff.lower()
    for pattern, message in dangerous_patterns:
        if pattern.lower() in diff_lower:
            concerns.append(message)
    
    # Check file types
    suspicious_extensions = ['.exe', '.dll', '.so', '.bin']
    for f in files:
        if any(f.endswith(ext) for ext in suspicious_extensions):
            concerns.append(f"Binary file detected: {f}")
            verdict = "NEEDS_REVISION"
    
    if concerns:
        verdict = "NEEDS_REVISION"
    
    return {
        "verdict": verdict,
        "concerns": concerns,
        "recommendations": ["Review flagged items before merging"],
        "summary": f"Basic review complete. {len(concerns)} potential concerns found."
    }

def main():
    files = get_changed_files()
    diff = get_diff()
    
    if not files:
        print("No changed files detected")
        review = {
            "verdict": "APPROVED",
            "concerns": [],
            "recommendations": [],
            "summary": "No changes to review"
        }
    else:
        print(f"Reviewing {len(files)} changed files...")
        review = review_with_claude(files, diff)
    
    # Create reports directory
    os.makedirs('reports', exist_ok=True)
    
    # Save full report
    report = {
        'sentinel': 'ATLAS',
        'verdict': review['verdict'],
        'concerns': review.get('concerns', []),
        'recommendations': review.get('recommendations', []),
        'summary': review.get('summary', ''),
        'files_reviewed': files[:50]
    }
    
    with open('reports/atlas-review.json', 'w') as f:
        json.dump(report, f, indent=2)
    
    # Save verdict for workflow
    with open('reports/atlas-verdict.txt', 'w') as f:
        f.write(review['verdict'])
    
    # Print summary
    print(f"\n{'='*50}")
    print(f"ATLAS Review Complete")
    print(f"{'='*50}")
    print(f"Verdict: {review['verdict']}")
    print(f"Files reviewed: {len(files)}")
    
    if review.get('concerns'):
        print(f"\nConcerns:")
        for concern in review['concerns'][:10]:
            print(f"  - {concern}")
    
    if review.get('recommendations'):
        print(f"\nRecommendations:")
        for rec in review['recommendations'][:5]:
            print(f"  - {rec}")
    
    # Exit codes
    if review['verdict'] == "BLOCKED":
        sys.exit(1)
    elif review['verdict'] == "NEEDS_REVISION":
        sys.exit(0)  # Don't block, but flag
    else:
        sys.exit(0)

if __name__ == '__main__':
    main()
