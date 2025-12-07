#!/usr/bin/env python3
"""
ATLAS Security Scan Sentinel
Scans for security vulnerabilities and sensitive data exposure
"""

import os
import json
import re
import subprocess
import sys
from pathlib import Path

# Patterns that might indicate security issues
SECURITY_PATTERNS = [
    # Hardcoded secrets
    (r'api[_-]?key\s*[:=]\s*["\'][^"\']{8,}["\']', 'Potential hardcoded API key', 'HIGH'),
    (r'secret\s*[:=]\s*["\'][^"\']{8,}["\']', 'Potential hardcoded secret', 'HIGH'),
    (r'password\s*[:=]\s*["\'][^"\']{4,}["\']', 'Potential hardcoded password', 'HIGH'),
    (r'private[_-]?key\s*[:=]', 'Potential private key reference', 'HIGH'),
    (r'-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----', 'Private key detected', 'CRITICAL'),
    (r'-----BEGIN\s+CERTIFICATE-----', 'Certificate detected', 'MEDIUM'),
    
    # AWS
    (r'AKIA[0-9A-Z]{16}', 'AWS Access Key ID pattern', 'CRITICAL'),
    (r'aws_secret_access_key\s*[:=]', 'AWS Secret Key reference', 'HIGH'),
    
    # Dangerous code patterns
    (r'eval\s*\(', 'eval() usage - code injection risk', 'HIGH'),
    (r'new\s+Function\s*\(', 'Dynamic function creation', 'MEDIUM'),
    (r'innerHTML\s*=', 'innerHTML assignment - XSS risk', 'MEDIUM'),
    (r'dangerouslySetInnerHTML', 'React dangerous HTML insertion', 'MEDIUM'),
    (r'document\.write\s*\(', 'document.write() usage', 'MEDIUM'),
    
    # SQL Injection patterns
    (r'execute\s*\(\s*["\'].*\+', 'Potential SQL injection', 'HIGH'),
    (r'query\s*\(\s*["\'].*\$\{', 'Template literal in query - SQL injection risk', 'HIGH'),
    
    # Command injection
    (r'exec\s*\(\s*["\'].*\+', 'Potential command injection', 'HIGH'),
    (r'spawn\s*\(\s*["\'].*\+', 'Potential command injection in spawn', 'HIGH'),
    
    # Path traversal
    (r'\.\./\.\./\.\./', 'Path traversal pattern', 'MEDIUM'),
    
    # Insecure protocols
    (r'http://(?!localhost|127\.0\.0\.1)', 'Insecure HTTP URL', 'LOW'),
]

# Files/directories to skip
SKIP_PATTERNS = [
    r'node_modules/',
    r'\.git/',
    r'dist/',
    r'build/',
    r'\.env\.example',
    r'\.env\.local\.example',
    r'package-lock\.json',
    r'\.md$',
    r'\.test\.',
    r'__tests__/',
]

# File extensions to scan
SCAN_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.json', '.yaml', '.yml', '.env']

def should_skip(filepath):
    """Check if file should be skipped"""
    for pattern in SKIP_PATTERNS:
        if re.search(pattern, filepath):
            return True
    return False

def get_files_to_scan():
    """Get all files to scan"""
    files = []
    
    for ext in SCAN_EXTENSIONS:
        try:
            result = subprocess.run(
                ['git', 'ls-files', f'*{ext}'],
                capture_output=True,
                text=True
            )
            files.extend(result.stdout.strip().split('\n'))
        except Exception:
            pass
    
    # Filter and dedupe
    files = [f for f in files if f and not should_skip(f)]
    return list(set(files))

def scan_file(filepath):
    """Scan a single file for security issues"""
    findings = []
    
    try:
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
            lines = content.split('\n')
    except Exception as e:
        return [{'file': filepath, 'error': str(e)}]
    
    for line_num, line in enumerate(lines, 1):
        for pattern, description, severity in SECURITY_PATTERNS:
            if re.search(pattern, line, re.IGNORECASE):
                findings.append({
                    'file': filepath,
                    'line': line_num,
                    'pattern': pattern,
                    'description': description,
                    'severity': severity,
                    'snippet': line[:100] + ('...' if len(line) > 100 else '')
                })
    
    return findings

def main():
    print("🔍 ATLAS Security Scan")
    print("=" * 50)
    
    files = get_files_to_scan()
    print(f"Scanning {len(files)} files...")
    
    all_findings = []
    
    for filepath in files:
        if os.path.exists(filepath):
            findings = scan_file(filepath)
            all_findings.extend(findings)
    
    # Create reports directory
    os.makedirs('reports', exist_ok=True)
    
    # Categorize by severity
    critical = [f for f in all_findings if f.get('severity') == 'CRITICAL']
    high = [f for f in all_findings if f.get('severity') == 'HIGH']
    medium = [f for f in all_findings if f.get('severity') == 'MEDIUM']
    low = [f for f in all_findings if f.get('severity') == 'LOW']
    
    # Determine verdict
    if critical:
        verdict = "BLOCKED"
    elif high:
        verdict = "NEEDS_REVISION"
    elif medium:
        verdict = "APPROVED"  # Medium issues are warnings
    else:
        verdict = "APPROVED"
    
    # Save report
    report = {
        'sentinel': 'ATLAS-SECURITY',
        'verdict': verdict,
        'files_scanned': len(files),
        'findings': {
            'critical': critical,
            'high': high,
            'medium': medium,
            'low': low
        },
        'summary': {
            'critical_count': len(critical),
            'high_count': len(high),
            'medium_count': len(medium),
            'low_count': len(low),
            'total': len(all_findings)
        }
    }
    
    with open('reports/atlas-security.json', 'w') as f:
        json.dump(report, f, indent=2)
    
    # Print summary
    print(f"\n{'='*50}")
    print(f"Security Scan Complete")
    print(f"{'='*50}")
    print(f"Verdict: {verdict}")
    print(f"Files scanned: {len(files)}")
    print(f"\nFindings:")
    print(f"  CRITICAL: {len(critical)}")
    print(f"  HIGH:     {len(high)}")
    print(f"  MEDIUM:   {len(medium)}")
    print(f"  LOW:      {len(low)}")
    
    if critical:
        print(f"\n🚨 CRITICAL ISSUES:")
        for f in critical[:5]:
            print(f"  {f['file']}:{f.get('line', '?')} - {f['description']}")
    
    if high:
        print(f"\n⚠️  HIGH SEVERITY ISSUES:")
        for f in high[:5]:
            print(f"  {f['file']}:{f.get('line', '?')} - {f['description']}")
    
    # Exit codes
    if verdict == "BLOCKED":
        print("\n❌ Security scan BLOCKED - critical issues found")
        sys.exit(1)
    elif verdict == "NEEDS_REVISION":
        print("\n⚠️  Security scan flagged high-severity issues")
        sys.exit(0)  # Don't block but warn
    else:
        print("\n✅ Security scan passed")
        sys.exit(0)

if __name__ == '__main__':
    main()
