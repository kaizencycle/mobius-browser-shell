#!/usr/bin/env python3
"""
JADE UX Validation Sentinel
Validates UI/UX consistency and design patterns
"""

import os
import json
import sys
import re
from datetime import datetime

# Mobius Design System Guidelines
DESIGN_GUIDELINES = {
    'colors': {
        'primary': ['#0ea5e9', 'sky', 'blue'],  # Sky blue primary
        'integrity': ['#22c55e', 'green', 'emerald'],  # Green for integrity
        'warning': ['#f59e0b', 'amber', 'yellow'],
        'danger': ['#ef4444', 'red'],
        'background': ['#0f172a', 'slate', 'gray'],
    },
    'required_components': [
        'Omnibar',
        'TabNavigation',
        'SentinelStatus',
        'LabFrame',
    ],
    'patterns': {
        'responsive': ['sm:', 'md:', 'lg:', 'xl:'],
        'dark_mode': ['dark:'],
        'hover_states': ['hover:'],
        'transitions': ['transition', 'animate'],
    }
}

def analyze_component_file(filepath):
    """Analyze a component file for UX patterns"""
    try:
        with open(filepath, 'r') as f:
            content = f.read()
    except Exception as e:
        return {'error': str(e)}
    
    analysis = {
        'filepath': filepath,
        'patterns_found': {},
        'issues': [],
        'suggestions': []
    }
    
    # Check for responsive patterns
    responsive_count = sum(1 for p in DESIGN_GUIDELINES['patterns']['responsive'] if p in content)
    analysis['patterns_found']['responsive'] = responsive_count > 0
    if responsive_count == 0:
        analysis['suggestions'].append('Consider adding responsive breakpoints (sm:, md:, lg:)')
    
    # Check for hover states
    hover_count = sum(1 for p in DESIGN_GUIDELINES['patterns']['hover_states'] if p in content)
    analysis['patterns_found']['hover_states'] = hover_count > 0
    if hover_count == 0 and ('button' in content.lower() or 'click' in content.lower()):
        analysis['suggestions'].append('Consider adding hover states for interactive elements')
    
    # Check for transitions
    transition_count = sum(1 for p in DESIGN_GUIDELINES['patterns']['transitions'] if p in content)
    analysis['patterns_found']['transitions'] = transition_count > 0
    
    # Check for accessibility
    has_aria = 'aria-' in content
    has_role = 'role=' in content
    analysis['patterns_found']['accessibility'] = has_aria or has_role
    if not has_aria and not has_role:
        analysis['suggestions'].append('Consider adding ARIA attributes for accessibility')
    
    # Check for alt text on images
    if '<img' in content.lower() or 'Image' in content:
        has_alt = 'alt=' in content or 'alt:' in content
        if not has_alt:
            analysis['issues'].append('Images should have alt text')
    
    # Check for Tailwind consistency
    if 'className' in content:
        # Check for inline styles (discouraged with Tailwind)
        if 'style=' in content or 'style:' in content:
            analysis['suggestions'].append('Consider using Tailwind classes instead of inline styles')
    
    return analysis

def check_component_structure():
    """Check for required components"""
    results = []
    
    for component in DESIGN_GUIDELINES['required_components']:
        paths_to_check = [
            f'components/{component}.tsx',
            f'components/{component}.jsx',
            f'components/{component}/index.tsx',
        ]
        
        found = False
        for path in paths_to_check:
            if os.path.exists(path):
                found = True
                analysis = analyze_component_file(path)
                results.append({
                    'component': component,
                    'path': path,
                    'exists': True,
                    'analysis': analysis
                })
                break
        
        if not found:
            results.append({
                'component': component,
                'exists': False
            })
    
    return results

def check_app_structure():
    """Analyze main App component"""
    app_path = 'App.tsx'
    
    if not os.path.exists(app_path):
        return {'exists': False}
    
    analysis = analyze_component_file(app_path)
    
    # Additional App-specific checks
    try:
        with open(app_path, 'r') as f:
            content = f.read()
        
        # Check for proper component imports
        expected_imports = ['Omnibar', 'TabNavigation', 'SentinelStatus']
        for comp in expected_imports:
            if comp not in content:
                analysis['suggestions'].append(f'Consider including {comp} component')
        
        # Check for state management
        if 'useState' in content:
            analysis['patterns_found']['state_management'] = True
        
        # Check for effect hooks
        if 'useEffect' in content:
            analysis['patterns_found']['effects'] = True
            
    except Exception:
        pass
    
    return {
        'exists': True,
        'path': app_path,
        'analysis': analysis
    }

def check_color_consistency():
    """Check for consistent color usage"""
    issues = []
    
    # Scan TSX files for hardcoded colors
    color_pattern = re.compile(r'#[0-9a-fA-F]{3,6}')
    
    for root, dirs, files in os.walk('.'):
        # Skip node_modules and other non-source dirs
        dirs[:] = [d for d in dirs if d not in ['node_modules', '.git', 'dist', 'build']]
        
        for file in files:
            if file.endswith(('.tsx', '.jsx')):
                filepath = os.path.join(root, file)
                try:
                    with open(filepath, 'r') as f:
                        content = f.read()
                    
                    # Find hardcoded colors
                    colors = color_pattern.findall(content)
                    if colors:
                        # Check if they're documented design system colors
                        unknown_colors = []
                        for color in colors:
                            is_known = any(
                                color.lower() in [c.lower() for c in palette]
                                for palette in DESIGN_GUIDELINES['colors'].values()
                                if isinstance(palette[0], str) and palette[0].startswith('#')
                            )
                            if not is_known:
                                unknown_colors.append(color)
                        
                        if unknown_colors:
                            issues.append({
                                'file': filepath,
                                'colors': list(set(unknown_colors))[:5],
                                'message': 'Consider using Tailwind color classes'
                            })
                except Exception:
                    pass
    
    return issues[:10]  # Limit to 10 issues

def main():
    print("🎨 JADE UX Validation")
    print("=" * 50)
    
    # Run checks
    components = check_component_structure()
    app = check_app_structure()
    color_issues = check_color_consistency()
    
    # Count results
    missing_components = sum(1 for c in components if not c.get('exists'))
    total_issues = sum(len(c.get('analysis', {}).get('issues', [])) for c in components if c.get('analysis'))
    total_suggestions = sum(len(c.get('analysis', {}).get('suggestions', [])) for c in components if c.get('analysis'))
    
    # Determine verdict
    if missing_components > 2:
        verdict = 'NEEDS_REVISION'
    elif total_issues > 5:
        verdict = 'NEEDS_REVISION'
    else:
        verdict = 'APPROVED'
    
    # Create reports
    os.makedirs('reports', exist_ok=True)
    
    report = {
        'sentinel': 'JADE',
        'timestamp': datetime.now().isoformat(),
        'verdict': verdict,
        'summary': {
            'missing_components': missing_components,
            'total_issues': total_issues,
            'total_suggestions': total_suggestions,
            'color_issues': len(color_issues)
        },
        'components': components,
        'app': app,
        'color_issues': color_issues
    }
    
    with open('reports/jade-ux.json', 'w') as f:
        json.dump(report, f, indent=2)
    
    # Print results
    print(f"\n{'='*50}")
    print(f"UX Validation Results")
    print(f"{'='*50}")
    print(f"Verdict: {verdict}")
    
    print(f"\nRequired Components:")
    for comp in components:
        status_icon = "✅" if comp.get('exists') else "❌"
        print(f"  {status_icon} {comp['component']}")
        
        if comp.get('analysis'):
            analysis = comp['analysis']
            if analysis.get('issues'):
                for issue in analysis['issues'][:2]:
                    print(f"      ❌ {issue}")
            if analysis.get('suggestions'):
                for suggestion in analysis['suggestions'][:2]:
                    print(f"      💡 {suggestion}")
    
    if app.get('exists'):
        print(f"\nApp Structure:")
        print(f"  ✅ App.tsx found")
        if app.get('analysis', {}).get('patterns_found'):
            patterns = app['analysis']['patterns_found']
            for pattern, found in patterns.items():
                icon = "✅" if found else "⚪"
                print(f"    {icon} {pattern}")
    
    if color_issues:
        print(f"\nColor Consistency:")
        print(f"  ⚠️ {len(color_issues)} files with hardcoded colors")
        for issue in color_issues[:3]:
            print(f"    - {issue['file']}: {', '.join(issue['colors'][:3])}")
    
    print(f"\nSummary:")
    print(f"  Issues: {total_issues}")
    print(f"  Suggestions: {total_suggestions}")
    
    # Exit codes
    if verdict == 'NEEDS_REVISION':
        print("\n⚠️ UX validation found issues to address")
        sys.exit(0)  # Don't block, just warn
    else:
        print("\n✅ UX validation passed")
        sys.exit(0)

if __name__ == '__main__':
    main()
