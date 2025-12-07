#!/usr/bin/env python3
"""
Sentinel Report Generator
Generates formatted reports from sentinel outputs
"""

import os
import json
import sys
import argparse
from datetime import datetime

def load_json_file(filepath):
    """Load a JSON file"""
    try:
        with open(filepath, 'r') as f:
            return json.load(f)
    except Exception as e:
        return {'error': str(e)}

def generate_markdown_report(reports, output_type='deployment'):
    """Generate a markdown report"""
    lines = []
    timestamp = datetime.now().isoformat()
    
    if output_type == 'deployment':
        lines.append("# 🚀 Deployment Report")
        lines.append(f"")
        lines.append(f"**Generated:** {timestamp}")
        lines.append(f"")
        
        # EVE section
        if 'eve' in reports:
            eve = reports['eve']
            healthy = eve.get('overall_healthy', True)
            icon = "✅" if healthy else "❌"
            lines.append(f"## EVE - Deployment Health: {icon}")
            lines.append(f"")
            
            if 'shell' in eve:
                shell = eve['shell']
                status = shell.get('status', 'unknown')
                lines.append(f"**Shell:** {status}")
                if shell.get('http_status'):
                    lines.append(f"- HTTP Status: {shell['http_status']}")
                if shell.get('response_time_ms'):
                    lines.append(f"- Response Time: {shell['response_time_ms']:.0f}ms")
            
            if 'labs' in eve:
                lines.append(f"")
                lines.append(f"### Lab Endpoints")
                for lab in eve['labs']:
                    status_icon = "✅" if lab.get('healthy') else ("⏭️" if lab.get('status') == 'skipped' else "❌")
                    lines.append(f"- {status_icon} **{lab['name']}**: {lab.get('status', 'unknown')}")
            
            lines.append(f"")
        
        # JADE section
        if 'jade' in reports:
            jade = reports['jade']
            verdict = jade.get('verdict', 'UNKNOWN')
            icon = "✅" if verdict == "APPROVED" else "⚠️"
            lines.append(f"## JADE - UX Validation: {icon}")
            lines.append(f"")
            
            if 'summary' in jade:
                summary = jade['summary']
                lines.append(f"- Missing Components: {summary.get('missing_components', 0)}")
                lines.append(f"- Issues: {summary.get('total_issues', 0)}")
                lines.append(f"- Suggestions: {summary.get('total_suggestions', 0)}")
            
            lines.append(f"")
    
    elif output_type == 'validation':
        lines.append("# 🌀 Validation Report")
        lines.append(f"")
        lines.append(f"**Generated:** {timestamp}")
        lines.append(f"")
        
        # ATLAS section
        if 'atlas' in reports:
            atlas = reports['atlas']
            verdict = atlas.get('verdict', 'UNKNOWN')
            icon = "✅" if verdict == "APPROVED" else ("⚠️" if verdict == "NEEDS_REVISION" else "❌")
            lines.append(f"## ATLAS - Code Review: {icon} {verdict}")
            lines.append(f"")
            
            if atlas.get('concerns'):
                lines.append(f"### Concerns")
                for concern in atlas['concerns'][:5]:
                    lines.append(f"- {concern}")
                lines.append(f"")
            
            if atlas.get('recommendations'):
                lines.append(f"### Recommendations")
                for rec in atlas['recommendations'][:5]:
                    lines.append(f"- {rec}")
                lines.append(f"")
        
        # AUREA section
        if 'aurea' in reports:
            aurea = reports['aurea']
            verdict = aurea.get('verdict', 'UNKNOWN')
            icon = "✅" if verdict == "APPROVED" else ("⚠️" if verdict == "NEEDS_REVISION" else "❌")
            lines.append(f"## AUREA - Integrity Check: {icon} {verdict}")
            lines.append(f"")
            
            if 'checks' in aurea:
                for check_name, check_result in aurea['checks'].items():
                    check_icon = "✅" if check_result.get('passed') else "❌"
                    lines.append(f"- {check_icon} {check_name}")
            
            lines.append(f"")
        
        # Consensus section
        if 'consensus' in reports:
            consensus = reports['consensus']
            approved = consensus.get('approved', False)
            icon = "✅" if approved else "❌"
            lines.append(f"## Multi-Sentinel Consensus: {icon}")
            lines.append(f"")
            lines.append(f"**Score:** {consensus.get('consensus_score', 0):.2%}")
            lines.append(f"**Final Verdict:** {consensus.get('final_verdict', 'UNKNOWN')}")
            lines.append(f"")
            
            if 'sentinel_verdicts' in consensus:
                lines.append(f"### Individual Verdicts")
                for sentinel, verdict in consensus['sentinel_verdicts'].items():
                    verdict_icon = "✅" if verdict == "APPROVED" else ("⚠️" if verdict == "NEEDS_REVISION" else "❌")
                    lines.append(f"- {verdict_icon} **{sentinel}**: {verdict}")
    
    return '\n'.join(lines)

def generate_json_report(reports, output_type='deployment'):
    """Generate a JSON report"""
    return {
        'type': output_type,
        'timestamp': datetime.now().isoformat(),
        'reports': reports
    }

def generate_webhook_payload(reports, output_type='deployment'):
    """Generate a Discord/Slack webhook payload"""
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    if output_type == 'deployment':
        # Check overall status
        eve_healthy = reports.get('eve', {}).get('overall_healthy', True)
        jade_verdict = reports.get('jade', {}).get('verdict', 'APPROVED')
        
        if eve_healthy and jade_verdict == 'APPROVED':
            status = "✅ Deployment Verified"
            color = 0x22c55e  # Green
        elif eve_healthy:
            status = "⚠️ Deployment OK, UX Issues"
            color = 0xf59e0b  # Yellow
        else:
            status = "❌ Deployment Issues"
            color = 0xef4444  # Red
        
        return {
            'content': f"🚀 **Deployment Report** - {timestamp}\n{status}",
            'embeds': [{
                'title': 'Deployment Verification',
                'color': color,
                'fields': [
                    {'name': 'EVE Health', 'value': '✅ Healthy' if eve_healthy else '❌ Issues', 'inline': True},
                    {'name': 'JADE UX', 'value': jade_verdict, 'inline': True},
                ],
                'timestamp': datetime.now().isoformat()
            }]
        }
    
    else:
        consensus = reports.get('consensus', {})
        approved = consensus.get('approved', False)
        
        if approved:
            status = "✅ Validation Passed"
            color = 0x22c55e
        else:
            status = "❌ Validation Failed"
            color = 0xef4444
        
        return {
            'content': f"🌀 **Validation Report** - {timestamp}\n{status}",
            'embeds': [{
                'title': 'Sentinel Validation',
                'color': color,
                'fields': [
                    {'name': 'Consensus Score', 'value': f"{consensus.get('consensus_score', 0):.2%}", 'inline': True},
                    {'name': 'Final Verdict', 'value': consensus.get('final_verdict', 'UNKNOWN'), 'inline': True},
                ],
                'timestamp': datetime.now().isoformat()
            }]
        }

def main():
    parser = argparse.ArgumentParser(description='Generate Sentinel Reports')
    parser.add_argument('--eve', help='Path to EVE report')
    parser.add_argument('--jade', help='Path to JADE report')
    parser.add_argument('--atlas', help='Path to ATLAS report')
    parser.add_argument('--aurea', help='Path to AUREA report')
    parser.add_argument('--consensus', help='Path to consensus report')
    parser.add_argument('--output', required=True, help='Output file path')
    parser.add_argument('--format', choices=['markdown', 'json', 'webhook'], default='markdown')
    parser.add_argument('--type', choices=['deployment', 'validation'], default='deployment')
    
    args = parser.parse_args()
    
    # Load reports
    reports = {}
    
    if args.eve:
        reports['eve'] = load_json_file(args.eve)
    if args.jade:
        reports['jade'] = load_json_file(args.jade)
    if args.atlas:
        reports['atlas'] = load_json_file(args.atlas)
    if args.aurea:
        reports['aurea'] = load_json_file(args.aurea)
    if args.consensus:
        reports['consensus'] = load_json_file(args.consensus)
    
    # Also try loading from default locations
    default_reports = {
        'eve': 'reports/eve-deployment.json',
        'jade': 'reports/jade-ux.json',
        'atlas': 'reports/atlas-review.json',
        'aurea': 'reports/aurea-integrity.json',
        'consensus': 'reports/consensus.json',
    }
    
    for key, path in default_reports.items():
        if key not in reports and os.path.exists(path):
            reports[key] = load_json_file(path)
    
    # Generate report
    if args.format == 'markdown':
        output = generate_markdown_report(reports, args.type)
    elif args.format == 'json':
        output = json.dumps(generate_json_report(reports, args.type), indent=2)
    elif args.format == 'webhook':
        output = json.dumps(generate_webhook_payload(reports, args.type), indent=2)
    
    # Write output
    os.makedirs(os.path.dirname(args.output) or '.', exist_ok=True)
    
    with open(args.output, 'w') as f:
        f.write(output)
    
    print(f"Report generated: {args.output}")
    
    # Also print preview
    if args.format == 'markdown':
        print("\n--- Report Preview ---")
        print(output[:1000])
        if len(output) > 1000:
            print("...")

if __name__ == '__main__':
    main()
