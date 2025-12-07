#!/usr/bin/env python3
"""
AUREA Integrity Check Sentinel
Validates constitutional compliance and structural integrity
"""

import os
import json
import subprocess
import sys
from pathlib import Path

# Constitutional requirements for Mobius Browser Shell
CONSTITUTIONAL_REQUIREMENTS = {
    'critical_files': [
        'package.json',
        'README.md',
        'App.tsx',
        'index.tsx',
        'index.html',
    ],
    'protected_patterns': [
        '.github/workflows/anti-nuke-',
        '.mobius-constitution',
    ],
    'required_structure': {
        'components': ['Omnibar.tsx', 'TabNavigation.tsx', 'SentinelStatus.tsx'],
        'components/Labs': ['OAALab.tsx', 'ReflectionsLab.tsx', 'CitizenShieldLab.tsx'],
        'config': ['env.ts'],
    }
}

def check_critical_files():
    """Verify critical files exist"""
    missing = []
    present = []
    
    for filepath in CONSTITUTIONAL_REQUIREMENTS['critical_files']:
        if os.path.exists(filepath):
            present.append(filepath)
        else:
            missing.append(filepath)
    
    return {
        'present': present,
        'missing': missing,
        'passed': len(missing) == 0
    }

def check_protected_files():
    """Verify protected files haven't been tampered with"""
    issues = []
    
    for pattern in CONSTITUTIONAL_REQUIREMENTS['protected_patterns']:
        if pattern.endswith('-'):
            # Check for any file matching pattern
            import glob
            matches = glob.glob(f'{pattern}*')
            if not matches:
                issues.append(f"No files matching {pattern}* found")
        else:
            if not os.path.exists(pattern):
                issues.append(f"Protected file missing: {pattern}")
    
    return {
        'issues': issues,
        'passed': len(issues) == 0
    }

def check_structure():
    """Verify required directory structure"""
    issues = []
    
    for directory, required_files in CONSTITUTIONAL_REQUIREMENTS['required_structure'].items():
        if not os.path.isdir(directory):
            issues.append(f"Directory missing: {directory}")
            continue
        
        for required_file in required_files:
            filepath = os.path.join(directory, required_file)
            if not os.path.exists(filepath):
                issues.append(f"Required file missing: {filepath}")
    
    return {
        'issues': issues,
        'passed': len(issues) == 0
    }

def check_git_integrity():
    """Verify git repository integrity"""
    try:
        result = subprocess.run(
            ['git', 'fsck', '--quiet'],
            capture_output=True,
            text=True
        )
        return {
            'passed': result.returncode == 0,
            'issues': result.stderr.strip().split('\n') if result.stderr else []
        }
    except Exception as e:
        return {
            'passed': False,
            'issues': [str(e)]
        }

def check_package_json():
    """Validate package.json structure"""
    issues = []
    
    try:
        with open('package.json', 'r') as f:
            pkg = json.load(f)
        
        # Check required fields
        required_fields = ['name', 'version', 'scripts']
        for field in required_fields:
            if field not in pkg:
                issues.append(f"package.json missing field: {field}")
        
        # Check scripts
        if 'scripts' in pkg:
            recommended_scripts = ['build', 'dev']
            for script in recommended_scripts:
                if script not in pkg['scripts']:
                    issues.append(f"Recommended script missing: {script}")
        
        # Check dependencies
        if 'dependencies' not in pkg and 'devDependencies' not in pkg:
            issues.append("No dependencies defined")
        
    except json.JSONDecodeError as e:
        issues.append(f"package.json is invalid JSON: {e}")
    except FileNotFoundError:
        issues.append("package.json not found")
    except Exception as e:
        issues.append(f"Error reading package.json: {e}")
    
    return {
        'issues': issues,
        'passed': len(issues) == 0
    }

def check_constitution():
    """Check for .mobius-constitution file"""
    constitution_path = '.mobius-constitution'
    
    if os.path.exists(constitution_path):
        try:
            with open(constitution_path, 'r') as f:
                content = f.read()
            
            # Verify it has content
            if len(content.strip()) < 100:
                return {
                    'passed': False,
                    'issues': ['Constitution file exists but appears incomplete']
                }
            
            return {
                'passed': True,
                'issues': []
            }
        except Exception as e:
            return {
                'passed': False,
                'issues': [f'Error reading constitution: {e}']
            }
    else:
        return {
            'passed': False,
            'issues': ['Constitution file not found (non-critical)'],
            'warning': True
        }

def main():
    print("🌟 AUREA Integrity Check")
    print("=" * 50)
    
    checks = {
        'critical_files': check_critical_files(),
        'protected_files': check_protected_files(),
        'structure': check_structure(),
        'git_integrity': check_git_integrity(),
        'package_json': check_package_json(),
        'constitution': check_constitution()
    }
    
    # Determine verdict
    critical_passed = checks['critical_files']['passed']
    structure_passed = checks['structure']['passed']
    git_passed = checks['git_integrity']['passed']
    
    # Constitution is a warning, not blocking
    constitution_warning = not checks['constitution']['passed'] and checks['constitution'].get('warning')
    
    if not critical_passed:
        verdict = "BLOCKED"
    elif not structure_passed or not git_passed:
        verdict = "NEEDS_REVISION"
    else:
        verdict = "APPROVED"
    
    # Create reports directory
    os.makedirs('reports', exist_ok=True)
    
    # Save report
    report = {
        'sentinel': 'AUREA',
        'verdict': verdict,
        'checks': checks,
        'summary': {
            'total_checks': len(checks),
            'passed': sum(1 for c in checks.values() if c['passed']),
            'failed': sum(1 for c in checks.values() if not c['passed'] and not c.get('warning')),
            'warnings': sum(1 for c in checks.values() if c.get('warning'))
        }
    }
    
    with open('reports/aurea-integrity.json', 'w') as f:
        json.dump(report, f, indent=2)
    
    # Save verdict for workflow
    with open('reports/aurea-verdict.txt', 'w') as f:
        f.write(verdict)
    
    # Print results
    print(f"\n{'='*50}")
    print(f"Integrity Check Results")
    print(f"{'='*50}")
    print(f"Verdict: {verdict}\n")
    
    for check_name, result in checks.items():
        status = "✅" if result['passed'] else ("⚠️ " if result.get('warning') else "❌")
        print(f"{status} {check_name}")
        
        if not result['passed']:
            issues = result.get('issues', result.get('missing', []))
            for issue in issues[:5]:
                print(f"    - {issue}")
    
    # Exit codes
    if verdict == "BLOCKED":
        print("\n❌ Integrity check BLOCKED")
        sys.exit(1)
    elif verdict == "NEEDS_REVISION":
        print("\n⚠️  Integrity issues detected")
        sys.exit(0)
    else:
        print("\n✅ Integrity check passed")
        sys.exit(0)

if __name__ == '__main__':
    main()
