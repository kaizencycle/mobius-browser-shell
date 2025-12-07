#!/usr/bin/env python3
"""
AUREA Tokenomics Verification Sentinel
Validates MIC tokenomics rules and parameters
"""

import os
import json
import sys
import re

# MIC Constitutional Tokenomics Rules
MIC_RULES = {
    'total_supply': 1_000_000_000,  # 1 billion MIC
    'founder_reserve_ratio': 0.1,   # 10% founder reserve
    'integrity_pool_min': 0.3,      # Minimum 30% to integrity pool
    'max_single_mint': 0.01,        # Max 1% per single mint
    'min_mii_for_mint': 0.70,       # Minimum MII to allow minting
    'cooling_period_hours': 24,     # Hours between large mints
}

def scan_for_tokenomics_changes(diff_content=None):
    """Scan for changes related to tokenomics"""
    keywords = [
        'totalSupply', 'total_supply',
        'mint', 'burn',
        'founder', 'reserve',
        'integrity_pool', 'integrityPool',
        'MIC', 'mic_',
        'tokenomics', 'token',
    ]
    
    findings = []
    
    # Check relevant files
    tokenomics_files = [
        'config/env.ts',
        'constants.ts',
        'types.ts',
    ]
    
    for filepath in tokenomics_files:
        if os.path.exists(filepath):
            try:
                with open(filepath, 'r') as f:
                    content = f.read()
                
                for keyword in keywords:
                    if keyword.lower() in content.lower():
                        findings.append({
                            'file': filepath,
                            'keyword': keyword,
                            'type': 'reference'
                        })
            except Exception as e:
                findings.append({
                    'file': filepath,
                    'error': str(e)
                })
    
    return findings

def validate_mic_constants():
    """Validate MIC constants if defined"""
    issues = []
    warnings = []
    
    files_to_check = ['constants.ts', 'config/env.ts']
    
    for filepath in files_to_check:
        if not os.path.exists(filepath):
            continue
        
        try:
            with open(filepath, 'r') as f:
                content = f.read()
            
            # Check for total supply definition
            supply_match = re.search(r'(TOTAL_SUPPLY|totalSupply)\s*[:=]\s*(\d+)', content)
            if supply_match:
                defined_supply = int(supply_match.group(2))
                if defined_supply != MIC_RULES['total_supply']:
                    issues.append(f"Total supply mismatch: {defined_supply} != {MIC_RULES['total_supply']}")
            
            # Check for suspicious patterns
            if re.search(r'mint.*unlimited|unlimited.*mint', content, re.IGNORECASE):
                issues.append("Detected 'unlimited mint' pattern - constitutional violation")
            
            if re.search(r'bypass.*integrity|integrity.*bypass', content, re.IGNORECASE):
                issues.append("Detected integrity bypass pattern - constitutional violation")
            
            # Warnings for common issues
            if re.search(r'TODO.*tokenomics|FIXME.*MIC', content, re.IGNORECASE):
                warnings.append(f"Found TODO/FIXME related to tokenomics in {filepath}")
            
        except Exception as e:
            warnings.append(f"Could not analyze {filepath}: {e}")
    
    return {
        'issues': issues,
        'warnings': warnings,
        'passed': len(issues) == 0
    }

def validate_api_endpoints():
    """Check for proper API endpoint configurations"""
    issues = []
    
    # Check env config
    env_files = ['config/env.ts', '.env.local.example']
    
    required_endpoints = [
        'MIC_API_BASE',
        'OAA_URL',
    ]
    
    for env_file in env_files:
        if os.path.exists(env_file):
            try:
                with open(env_file, 'r') as f:
                    content = f.read()
                
                for endpoint in required_endpoints:
                    if endpoint in content:
                        # Check if it's properly defined
                        if re.search(rf'{endpoint}\s*[:=]\s*["\'][^"\']+["\']', content):
                            continue
                        elif re.search(rf'{endpoint}\s*[:=]\s*process\.env', content):
                            continue
                        elif re.search(rf'{endpoint}', content):
                            # Mentioned but may not be properly configured
                            pass
            except Exception:
                pass
    
    return {
        'issues': issues,
        'passed': len(issues) == 0
    }

def main():
    print("💰 AUREA Tokenomics Verification")
    print("=" * 50)
    
    # Run checks
    findings = scan_for_tokenomics_changes()
    constants_check = validate_mic_constants()
    endpoints_check = validate_api_endpoints()
    
    # Determine verdict
    if constants_check['issues']:
        verdict = "BLOCKED"
    elif constants_check['warnings'] or not endpoints_check['passed']:
        verdict = "NEEDS_REVISION"
    else:
        verdict = "APPROVED"
    
    # Create reports
    os.makedirs('reports', exist_ok=True)
    
    report = {
        'sentinel': 'AUREA-TOKENOMICS',
        'verdict': verdict,
        'mic_rules': MIC_RULES,
        'findings': findings,
        'constants_validation': constants_check,
        'endpoints_validation': endpoints_check,
    }
    
    with open('reports/aurea-tokenomics.json', 'w') as f:
        json.dump(report, f, indent=2)
    
    # Print results
    print(f"\n{'='*50}")
    print(f"Tokenomics Verification Results")
    print(f"{'='*50}")
    print(f"Verdict: {verdict}\n")
    
    print("MIC Constitutional Rules Applied:")
    for rule, value in MIC_RULES.items():
        print(f"  {rule}: {value}")
    
    if findings:
        print(f"\nTokenomics references found in {len(findings)} locations")
    
    if constants_check['issues']:
        print("\n❌ ISSUES:")
        for issue in constants_check['issues']:
            print(f"  - {issue}")
    
    if constants_check['warnings']:
        print("\n⚠️  WARNINGS:")
        for warning in constants_check['warnings']:
            print(f"  - {warning}")
    
    # Exit codes
    if verdict == "BLOCKED":
        print("\n❌ Tokenomics verification BLOCKED")
        sys.exit(1)
    elif verdict == "NEEDS_REVISION":
        print("\n⚠️  Tokenomics verification flagged issues")
        sys.exit(0)
    else:
        print("\n✅ Tokenomics verification passed")
        sys.exit(0)

if __name__ == '__main__':
    main()
