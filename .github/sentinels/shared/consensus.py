#!/usr/bin/env python3
"""
Multi-Sentinel Consensus Engine
Aggregates verdicts from all sentinels and determines final decision
"""

import os
import json
import sys
import argparse
from datetime import datetime

# Sentinel weights for consensus
SENTINEL_WEIGHTS = {
    'ATLAS': 0.30,      # Architecture & Security
    'AUREA': 0.30,      # Integrity & Constitution
    'EVE': 0.20,        # Deployment & Integration
    'JADE': 0.20,       # UX & Accessibility
}

# Verdict scoring
VERDICT_SCORES = {
    'APPROVED': 1.0,
    'NEEDS_REVISION': 0.5,
    'BLOCKED': 0.0,
}

def load_sentinel_reports():
    """Load all sentinel reports from the reports directory"""
    reports = {}
    reports_dir = 'reports'
    
    if not os.path.exists(reports_dir):
        return reports
    
    # Map of report files to sentinels
    report_files = {
        'atlas-review.json': 'ATLAS',
        'atlas-security.json': 'ATLAS-SECURITY',
        'aurea-integrity.json': 'AUREA',
        'aurea-tokenomics.json': 'AUREA-TOKENOMICS',
        'aurea-mii.json': 'AUREA-MII',
        'eve-deployment.json': 'EVE',
        'eve-integration.json': 'EVE-INTEGRATION',
        'jade-ux.json': 'JADE',
        'jade-accessibility.json': 'JADE-A11Y',
    }
    
    for filename, sentinel in report_files.items():
        filepath = os.path.join(reports_dir, filename)
        if os.path.exists(filepath):
            try:
                with open(filepath, 'r') as f:
                    reports[sentinel] = json.load(f)
            except Exception as e:
                reports[sentinel] = {'error': str(e)}
    
    return reports

def extract_verdict(report):
    """Extract verdict from a report"""
    if isinstance(report, dict):
        # Check various verdict fields
        for key in ['verdict', 'final_verdict', 'status']:
            if key in report:
                return report[key].upper() if isinstance(report[key], str) else 'APPROVED'
        
        # Check for healthy/ok boolean
        for key in ['healthy', 'overall_healthy', 'overall_ok', 'passed']:
            if key in report:
                return 'APPROVED' if report[key] else 'NEEDS_REVISION'
    
    return 'APPROVED'  # Default if can't determine

def calculate_consensus(reports):
    """Calculate consensus from all sentinel reports"""
    # Group reports by sentinel type
    sentinel_verdicts = {
        'ATLAS': [],
        'AUREA': [],
        'EVE': [],
        'JADE': [],
    }
    
    for report_name, report in reports.items():
        verdict = extract_verdict(report)
        
        # Map sub-sentinels to main sentinel
        if report_name.startswith('ATLAS'):
            sentinel_verdicts['ATLAS'].append(verdict)
        elif report_name.startswith('AUREA'):
            sentinel_verdicts['AUREA'].append(verdict)
        elif report_name.startswith('EVE'):
            sentinel_verdicts['EVE'].append(verdict)
        elif report_name.startswith('JADE'):
            sentinel_verdicts['JADE'].append(verdict)
    
    # Calculate final verdict per sentinel (worst verdict wins)
    final_sentinel_verdicts = {}
    for sentinel, verdicts in sentinel_verdicts.items():
        if not verdicts:
            final_sentinel_verdicts[sentinel] = 'APPROVED'
        elif 'BLOCKED' in verdicts:
            final_sentinel_verdicts[sentinel] = 'BLOCKED'
        elif 'NEEDS_REVISION' in verdicts:
            final_sentinel_verdicts[sentinel] = 'NEEDS_REVISION'
        else:
            final_sentinel_verdicts[sentinel] = 'APPROVED'
    
    # Calculate weighted score
    total_score = 0
    for sentinel, weight in SENTINEL_WEIGHTS.items():
        verdict = final_sentinel_verdicts.get(sentinel, 'APPROVED')
        score = VERDICT_SCORES.get(verdict, 1.0)
        total_score += score * weight
    
    # Determine final verdict
    if total_score < 0.5:
        final_verdict = 'BLOCKED'
    elif total_score < 0.8:
        final_verdict = 'NEEDS_REVISION'
    else:
        final_verdict = 'APPROVED'
    
    # Check for any BLOCKED - that overrides
    if any(v == 'BLOCKED' for v in final_sentinel_verdicts.values()):
        final_verdict = 'BLOCKED'
    
    return {
        'final_verdict': final_verdict,
        'consensus_score': round(total_score, 4),
        'sentinel_verdicts': final_sentinel_verdicts,
        'approved': final_verdict == 'APPROVED'
    }

def generate_summary(consensus, reports):
    """Generate human-readable summary"""
    lines = []
    
    lines.append(f"# Multi-Sentinel Consensus Report")
    lines.append(f"")
    lines.append(f"**Final Verdict:** {consensus['final_verdict']}")
    lines.append(f"**Consensus Score:** {consensus['consensus_score']:.2%}")
    lines.append(f"")
    lines.append(f"## Sentinel Verdicts")
    lines.append(f"")
    
    for sentinel, verdict in consensus['sentinel_verdicts'].items():
        icon = "✅" if verdict == "APPROVED" else ("⚠️" if verdict == "NEEDS_REVISION" else "❌")
        weight = SENTINEL_WEIGHTS.get(sentinel, 0)
        lines.append(f"- **{sentinel}** ({weight:.0%}): {icon} {verdict}")
    
    lines.append(f"")
    lines.append(f"## Details")
    lines.append(f"")
    
    for report_name, report in reports.items():
        if isinstance(report, dict):
            verdict = extract_verdict(report)
            icon = "✅" if verdict == "APPROVED" else ("⚠️" if verdict == "NEEDS_REVISION" else "❌")
            lines.append(f"### {report_name}: {icon} {verdict}")
            
            # Add summary if available
            if 'summary' in report:
                summary = report['summary']
                if isinstance(summary, dict):
                    for k, v in list(summary.items())[:5]:
                        lines.append(f"- {k}: {v}")
                elif isinstance(summary, str):
                    lines.append(f"{summary[:200]}")
            
            lines.append(f"")
    
    return '\n'.join(lines)

def main():
    parser = argparse.ArgumentParser(description='Multi-Sentinel Consensus Engine')
    parser.add_argument('--atlas', help='Path to ATLAS report(s)')
    parser.add_argument('--aurea', help='Path to AUREA report(s)')
    parser.add_argument('--eve', help='Path to EVE report(s)')
    parser.add_argument('--jade', help='Path to JADE report(s)')
    parser.add_argument('--output', default='reports/consensus.json', help='Output file')
    
    args = parser.parse_args()
    
    print("🌀 Multi-Sentinel Consensus Engine")
    print("=" * 50)
    
    # Load all available reports
    reports = load_sentinel_reports()
    
    if not reports:
        print("No sentinel reports found, defaulting to APPROVED")
        consensus = {
            'final_verdict': 'APPROVED',
            'consensus_score': 1.0,
            'sentinel_verdicts': {s: 'APPROVED' for s in SENTINEL_WEIGHTS},
            'approved': True
        }
    else:
        # Calculate consensus
        consensus = calculate_consensus(reports)
    
    # Generate summary
    summary = generate_summary(consensus, reports)
    
    # Create full report
    os.makedirs('reports', exist_ok=True)
    
    full_report = {
        **consensus,
        'timestamp': datetime.now().isoformat(),
        'weights': SENTINEL_WEIGHTS,
        'reports_analyzed': list(reports.keys()),
        'summary': summary
    }
    
    with open(args.output, 'w') as f:
        json.dump(full_report, f, indent=2)
    
    # Print results
    print(f"\n{'='*50}")
    print(f"Consensus Results")
    print(f"{'='*50}")
    print(f"Final Verdict: {consensus['final_verdict']}")
    print(f"Consensus Score: {consensus['consensus_score']:.2%}")
    print(f"Approved: {'Yes' if consensus['approved'] else 'No'}")
    print(f"\nSentinel Verdicts:")
    
    for sentinel, verdict in consensus['sentinel_verdicts'].items():
        icon = "✅" if verdict == "APPROVED" else ("⚠️" if verdict == "NEEDS_REVISION" else "❌")
        weight = SENTINEL_WEIGHTS.get(sentinel, 0)
        print(f"  {icon} {sentinel} ({weight:.0%}): {verdict}")
    
    print(f"\nReports analyzed: {len(reports)}")
    
    # Exit codes
    if consensus['final_verdict'] == 'BLOCKED':
        print("\n❌ Consensus: BLOCKED")
        sys.exit(1)
    elif consensus['final_verdict'] == 'NEEDS_REVISION':
        print("\n⚠️  Consensus: NEEDS_REVISION")
        sys.exit(0)
    else:
        print("\n✅ Consensus: APPROVED")
        sys.exit(0)

if __name__ == '__main__':
    main()
