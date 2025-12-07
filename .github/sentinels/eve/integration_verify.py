#!/usr/bin/env python3
"""
EVE Integration Verification Sentinel
Verifies Lab iframe integration and cross-origin communication
"""

import os
import json
import sys
import requests
from datetime import datetime

def check_cors_headers(url, name):
    """Check CORS headers for iframe compatibility"""
    if not url:
        return {
            'name': name,
            'status': 'skipped',
            'message': 'URL not configured'
        }
    
    try:
        # Use HEAD to check headers without downloading content
        response = requests.head(url, timeout=15, allow_redirects=True)
        
        headers = dict(response.headers)
        
        # Check for iframe-blocking headers
        x_frame_options = headers.get('X-Frame-Options', '').upper()
        csp = headers.get('Content-Security-Policy', '')
        
        iframe_allowed = True
        issues = []
        
        if x_frame_options == 'DENY':
            iframe_allowed = False
            issues.append('X-Frame-Options: DENY blocks iframe embedding')
        elif x_frame_options == 'SAMEORIGIN':
            issues.append('X-Frame-Options: SAMEORIGIN may block cross-origin embedding')
        
        if 'frame-ancestors' in csp:
            if "'none'" in csp:
                iframe_allowed = False
                issues.append('CSP frame-ancestors: none blocks iframe embedding')
            elif "'self'" in csp and 'mobius' not in csp.lower():
                issues.append('CSP frame-ancestors may block cross-origin embedding')
        
        return {
            'name': name,
            'url': url,
            'status': 'checked',
            'http_status': response.status_code,
            'iframe_allowed': iframe_allowed,
            'x_frame_options': x_frame_options or 'Not set',
            'has_csp': bool(csp),
            'issues': issues
        }
        
    except requests.exceptions.Timeout:
        return {
            'name': name,
            'url': url,
            'status': 'error',
            'message': 'Request timeout'
        }
    except Exception as e:
        return {
            'name': name,
            'url': url,
            'status': 'error',
            'message': str(e)[:100]
        }

def check_lab_integration():
    """Check all Lab endpoints for iframe compatibility"""
    labs = {
        'OAA': os.environ.get('OAA_URL', os.environ.get('VITE_OAA_URL', '')),
        'Reflections': os.environ.get('REFLECTIONS_URL', os.environ.get('VITE_REFLECTIONS_URL', '')),
        'Citizen Shield': os.environ.get('SHIELD_URL', os.environ.get('VITE_CITIZEN_SHIELD_URL', '')),
        'Wallet': os.environ.get('WALLET_URL', os.environ.get('VITE_WALLET_URL', '')),
        'Hive': os.environ.get('HIVE_URL', os.environ.get('VITE_HIVE_URL', '')),
    }
    
    results = []
    for name, url in labs.items():
        result = check_cors_headers(url, name)
        results.append(result)
    
    return results

def verify_local_components():
    """Verify local Lab components exist"""
    lab_components = {
        'OAALab': 'components/Labs/OAALab.tsx',
        'ReflectionsLab': 'components/Labs/ReflectionsLab.tsx',
        'CitizenShieldLab': 'components/Labs/CitizenShieldLab.tsx',
        'WalletLab': 'components/Labs/WalletLab.tsx',
        'HiveLab': 'components/Labs/HiveLab.tsx',
        'LabFrame': 'components/LabFrame.tsx',
    }
    
    results = []
    for name, path in lab_components.items():
        exists = os.path.exists(path)
        results.append({
            'name': name,
            'path': path,
            'exists': exists
        })
    
    return results

def verify_env_config():
    """Verify environment configuration"""
    env_file = 'config/env.ts'
    
    if not os.path.exists(env_file):
        return {
            'status': 'missing',
            'message': 'config/env.ts not found'
        }
    
    try:
        with open(env_file, 'r') as f:
            content = f.read()
        
        expected_vars = [
            'OAA_URL',
            'REFLECTIONS_URL',
            'CITIZEN_SHIELD_URL',
        ]
        
        found_vars = []
        for var in expected_vars:
            if var in content:
                found_vars.append(var)
        
        return {
            'status': 'checked',
            'found_vars': found_vars,
            'expected_vars': expected_vars,
            'all_found': len(found_vars) == len(expected_vars)
        }
        
    except Exception as e:
        return {
            'status': 'error',
            'message': str(e)
        }

def main():
    print("🔗 EVE Integration Verification")
    print("=" * 50)
    
    # Run checks
    lab_cors = check_lab_integration()
    local_components = verify_local_components()
    env_config = verify_env_config()
    
    # Count results
    cors_issues = sum(1 for c in lab_cors if c.get('issues'))
    components_missing = sum(1 for c in local_components if not c.get('exists'))
    
    # Determine overall status
    # Missing local components is an issue
    # CORS issues are warnings (external services)
    overall_ok = components_missing == 0
    
    # Create reports
    os.makedirs('reports', exist_ok=True)
    
    report = {
        'sentinel': 'EVE-INTEGRATION',
        'timestamp': datetime.now().isoformat(),
        'overall_ok': overall_ok,
        'summary': {
            'cors_issues': cors_issues,
            'components_missing': components_missing
        },
        'lab_cors': lab_cors,
        'local_components': local_components,
        'env_config': env_config
    }
    
    with open('reports/eve-integration.json', 'w') as f:
        json.dump(report, f, indent=2)
    
    # Print results
    print(f"\n{'='*50}")
    print(f"Integration Verification Results")
    print(f"{'='*50}")
    print(f"Overall OK: {'✅' if overall_ok else '❌'}")
    
    print(f"\nLocal Components:")
    for comp in local_components:
        status_icon = "✅" if comp['exists'] else "❌"
        print(f"  {status_icon} {comp['name']}: {comp['path']}")
    
    print(f"\nLab CORS/Iframe Compatibility:")
    for check in lab_cors:
        if check.get('status') == 'skipped':
            print(f"  ⏭️ {check['name']}: Not configured")
        elif check.get('status') == 'checked':
            status_icon = "✅" if check.get('iframe_allowed', True) else "⚠️"
            print(f"  {status_icon} {check['name']}: X-Frame-Options: {check.get('x_frame_options', 'N/A')}")
            for issue in check.get('issues', []):
                print(f"      ⚠️ {issue}")
        else:
            print(f"  ❌ {check['name']}: {check.get('message', 'Error')}")
    
    print(f"\nEnvironment Config:")
    if env_config.get('status') == 'checked':
        print(f"  Found: {', '.join(env_config.get('found_vars', []))}")
        if not env_config.get('all_found'):
            missing = set(env_config['expected_vars']) - set(env_config['found_vars'])
            print(f"  ⚠️ Missing: {', '.join(missing)}")
    else:
        print(f"  {env_config.get('message', 'Unknown status')}")
    
    # Exit codes
    if not overall_ok:
        print("\n⚠️ Integration verification found issues")
        sys.exit(1)
    else:
        print("\n✅ Integration verification passed")
        sys.exit(0)

if __name__ == '__main__':
    main()
