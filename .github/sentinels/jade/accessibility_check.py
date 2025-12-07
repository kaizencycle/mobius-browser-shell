#!/usr/bin/env python3
"""
JADE Accessibility Check Sentinel
Checks for accessibility compliance (WCAG guidelines)
"""

import os
import json
import sys
import re
from datetime import datetime

# WCAG Guidelines to check
WCAG_CHECKS = {
    'perceivable': {
        'alt_text': 'Images must have alt text',
        'contrast': 'Text must have sufficient contrast',
        'labels': 'Form inputs must have labels',
    },
    'operable': {
        'keyboard': 'All functionality accessible via keyboard',
        'focus': 'Focus indicators must be visible',
        'timing': 'Users must have enough time to read content',
    },
    'understandable': {
        'language': 'Page language must be specified',
        'labels': 'Labels or instructions must be provided',
        'errors': 'Errors must be identified and described',
    },
    'robust': {
        'parsing': 'Content must be properly parsed',
        'aria': 'ARIA roles must be valid',
    }
}

def check_file_accessibility(filepath):
    """Check a single file for accessibility issues"""
    issues = []
    
    try:
        with open(filepath, 'r') as f:
            content = f.read()
    except Exception as e:
        return [{'type': 'error', 'message': str(e)}]
    
    # Check for images without alt text
    img_patterns = [
        (r'<img[^>]*(?<!alt=)[^>]*>', 'Image may be missing alt attribute'),
        (r'<Image[^>]*(?<!alt=)[^>]*>', 'Next.js Image may be missing alt attribute'),
    ]
    
    for pattern, message in img_patterns:
        matches = re.findall(pattern, content)
        for match in matches[:3]:
            if 'alt=' not in match:
                issues.append({
                    'type': 'alt_text',
                    'severity': 'error',
                    'message': message,
                    'snippet': match[:80]
                })
    
    # Check for form inputs without labels
    input_patterns = [
        (r'<input[^>]*>', 'Input element'),
        (r'<select[^>]*>', 'Select element'),
        (r'<textarea[^>]*>', 'Textarea element'),
    ]
    
    for pattern, element_type in input_patterns:
        matches = re.findall(pattern, content)
        for match in matches[:3]:
            # Check if it has aria-label or associated label
            has_label = (
                'aria-label' in match or
                'aria-labelledby' in match or
                'id=' in match  # May have associated label
            )
            if not has_label:
                issues.append({
                    'type': 'labels',
                    'severity': 'warning',
                    'message': f'{element_type} may be missing label',
                    'snippet': match[:80]
                })
    
    # Check for click handlers without keyboard support
    click_pattern = r'onClick=\{[^}]+\}'
    onkey_pattern = r'onKey(Down|Up|Press)=\{[^}]+\}'
    
    clicks = len(re.findall(click_pattern, content))
    keys = len(re.findall(onkey_pattern, content))
    
    if clicks > 0 and keys == 0:
        # Check if it's on a native button
        button_clicks = len(re.findall(r'<button[^>]*onClick', content))
        non_button_clicks = clicks - button_clicks
        
        if non_button_clicks > 0:
            issues.append({
                'type': 'keyboard',
                'severity': 'warning',
                'message': f'{non_button_clicks} click handlers may need keyboard support',
            })
    
    # Check for ARIA usage
    aria_patterns = {
        'aria-label': 'aria-label=',
        'aria-labelledby': 'aria-labelledby=',
        'aria-describedby': 'aria-describedby=',
        'aria-hidden': 'aria-hidden=',
        'role': 'role=',
    }
    
    aria_usage = {}
    for name, pattern in aria_patterns.items():
        count = content.count(pattern)
        if count > 0:
            aria_usage[name] = count
    
    # Check for focus visible
    if ':focus' not in content and 'focus:' not in content and 'tabIndex' in content:
        issues.append({
            'type': 'focus',
            'severity': 'warning',
            'message': 'Elements with tabIndex may need focus styles',
        })
    
    # Check for color-only information
    color_info_patterns = [
        r'(red|green|blue|yellow)\s+(means|indicates|shows)',
        r'(error|success|warning)\s+color',
    ]
    
    for pattern in color_info_patterns:
        if re.search(pattern, content, re.IGNORECASE):
            issues.append({
                'type': 'contrast',
                'severity': 'info',
                'message': 'Ensure color is not the only means of conveying information',
            })
            break
    
    return issues, aria_usage

def scan_all_components():
    """Scan all component files"""
    results = []
    
    for root, dirs, files in os.walk('.'):
        # Skip non-source directories
        dirs[:] = [d for d in dirs if d not in ['node_modules', '.git', 'dist', 'build']]
        
        for file in files:
            if file.endswith(('.tsx', '.jsx')):
                filepath = os.path.join(root, file)
                issues, aria = check_file_accessibility(filepath)
                
                if issues or aria:
                    results.append({
                        'file': filepath,
                        'issues': issues,
                        'aria_usage': aria
                    })
    
    return results

def check_html_accessibility():
    """Check index.html for accessibility"""
    html_path = 'index.html'
    issues = []
    
    if not os.path.exists(html_path):
        return issues
    
    try:
        with open(html_path, 'r') as f:
            content = f.read()
        
        # Check for lang attribute
        if 'lang=' not in content:
            issues.append({
                'type': 'language',
                'severity': 'error',
                'message': 'HTML should have lang attribute'
            })
        
        # Check for viewport meta
        if 'viewport' not in content:
            issues.append({
                'type': 'viewport',
                'severity': 'warning',
                'message': 'Consider adding viewport meta for mobile accessibility'
            })
        
        # Check for title
        if '<title>' not in content:
            issues.append({
                'type': 'title',
                'severity': 'error',
                'message': 'Page should have a title'
            })
            
    except Exception as e:
        issues.append({
            'type': 'error',
            'message': str(e)
        })
    
    return issues

def main():
    print("♿ JADE Accessibility Check")
    print("=" * 50)
    
    # Run checks
    component_results = scan_all_components()
    html_issues = check_html_accessibility()
    
    # Aggregate issues
    total_errors = sum(
        len([i for i in r['issues'] if i.get('severity') == 'error'])
        for r in component_results
    ) + len([i for i in html_issues if i.get('severity') == 'error'])
    
    total_warnings = sum(
        len([i for i in r['issues'] if i.get('severity') == 'warning'])
        for r in component_results
    ) + len([i for i in html_issues if i.get('severity') == 'warning'])
    
    # Count ARIA usage
    total_aria = {}
    for result in component_results:
        for attr, count in result.get('aria_usage', {}).items():
            total_aria[attr] = total_aria.get(attr, 0) + count
    
    # Determine verdict
    if total_errors > 3:
        verdict = 'NEEDS_REVISION'
    else:
        verdict = 'APPROVED'
    
    # Create reports
    os.makedirs('reports', exist_ok=True)
    
    report = {
        'sentinel': 'JADE-A11Y',
        'timestamp': datetime.now().isoformat(),
        'verdict': verdict,
        'summary': {
            'files_scanned': len(component_results),
            'total_errors': total_errors,
            'total_warnings': total_warnings,
            'aria_usage': total_aria
        },
        'component_results': component_results[:20],  # Limit to 20
        'html_issues': html_issues
    }
    
    with open('reports/jade-accessibility.json', 'w') as f:
        json.dump(report, f, indent=2)
    
    # Print results
    print(f"\n{'='*50}")
    print(f"Accessibility Check Results")
    print(f"{'='*50}")
    print(f"Verdict: {verdict}")
    
    print(f"\nSummary:")
    print(f"  Files scanned: {len(component_results)}")
    print(f"  Errors: {total_errors}")
    print(f"  Warnings: {total_warnings}")
    
    if total_aria:
        print(f"\nARIA Usage:")
        for attr, count in sorted(total_aria.items(), key=lambda x: -x[1])[:5]:
            print(f"  {attr}: {count}")
    
    if html_issues:
        print(f"\nHTML Issues:")
        for issue in html_issues:
            severity_icon = "❌" if issue.get('severity') == 'error' else "⚠️"
            print(f"  {severity_icon} {issue['message']}")
    
    # Show top issues by file
    files_with_issues = [r for r in component_results if r['issues']]
    if files_with_issues:
        print(f"\nTop Files with Issues:")
        for result in files_with_issues[:5]:
            error_count = len([i for i in result['issues'] if i.get('severity') == 'error'])
            warning_count = len([i for i in result['issues'] if i.get('severity') == 'warning'])
            print(f"  {result['file']}: {error_count} errors, {warning_count} warnings")
            for issue in result['issues'][:2]:
                severity_icon = "❌" if issue.get('severity') == 'error' else "⚠️"
                print(f"    {severity_icon} {issue['message']}")
    
    # Exit codes
    if verdict == 'NEEDS_REVISION':
        print("\n⚠️ Accessibility check found issues to address")
        sys.exit(0)  # Don't block, just warn
    else:
        print("\n✅ Accessibility check passed")
        sys.exit(0)

if __name__ == '__main__':
    main()
