#!/usr/bin/env python3
"""
AUREA MII Validator Sentinel
Validates Mobius Integrity Index thresholds and calculations
"""

import os
import json
import sys
from datetime import datetime

# MII Component Weights (from Mobius Constitution)
MII_WEIGHTS = {
    'git_integrity': 0.15,      # Git repo health
    'test_coverage': 0.15,      # Test coverage %
    'security_score': 0.20,     # Security scan results
    'constitutional_compliance': 0.20,  # Constitution adherence
    'deployment_health': 0.15,  # Deployment status
    'sentinel_consensus': 0.15  # Multi-sentinel agreement
}

# MII Thresholds
MII_THRESHOLDS = {
    'critical': 0.50,    # Below this = system halt
    'warning': 0.70,     # Below this = restricted operations
    'healthy': 0.85,     # Above this = all operations allowed
    'excellent': 0.95    # Above this = bonus integrity rewards
}

def calculate_local_mii():
    """Calculate MII based on local checks"""
    scores = {}
    
    # Git integrity
    try:
        import subprocess
        result = subprocess.run(['git', 'fsck', '--quiet'], capture_output=True)
        scores['git_integrity'] = 1.0 if result.returncode == 0 else 0.5
    except Exception:
        scores['git_integrity'] = 0.5
    
    # Constitutional compliance (check for constitution file)
    if os.path.exists('.mobius-constitution'):
        scores['constitutional_compliance'] = 1.0
    else:
        scores['constitutional_compliance'] = 0.7  # Missing but not critical
    
    # Security score (check for security scan results)
    if os.path.exists('reports/atlas-security.json'):
        try:
            with open('reports/atlas-security.json', 'r') as f:
                security = json.load(f)
            summary = security.get('summary', {})
            critical = summary.get('critical_count', 0)
            high = summary.get('high_count', 0)
            
            if critical > 0:
                scores['security_score'] = 0.3
            elif high > 0:
                scores['security_score'] = 0.7
            else:
                scores['security_score'] = 1.0
        except Exception:
            scores['security_score'] = 0.8  # Default if can't read
    else:
        scores['security_score'] = 0.8  # Default
    
    # Test coverage (placeholder - would integrate with actual coverage)
    scores['test_coverage'] = 0.7  # Default moderate
    
    # Deployment health (check for deployment verification)
    if os.path.exists('reports/eve-health.txt'):
        try:
            with open('reports/eve-health.txt', 'r') as f:
                health = f.read().strip()
            scores['deployment_health'] = 1.0 if health == 'true' else 0.5
        except Exception:
            scores['deployment_health'] = 0.8
    else:
        scores['deployment_health'] = 0.8  # Default
    
    # Sentinel consensus (check for consensus report)
    if os.path.exists('reports/consensus.json'):
        try:
            with open('reports/consensus.json', 'r') as f:
                consensus = json.load(f)
            scores['sentinel_consensus'] = 1.0 if consensus.get('approved') else 0.5
        except Exception:
            scores['sentinel_consensus'] = 0.8
    else:
        scores['sentinel_consensus'] = 0.8  # Default
    
    # Calculate weighted MII
    mii = sum(scores[k] * MII_WEIGHTS[k] for k in MII_WEIGHTS.keys())
    
    return {
        'mii': round(mii, 4),
        'component_scores': scores,
        'weights': MII_WEIGHTS
    }

def evaluate_mii(mii_value):
    """Evaluate MII against thresholds"""
    if mii_value < MII_THRESHOLDS['critical']:
        return {
            'level': 'CRITICAL',
            'message': 'System integrity critically low - operations should halt',
            'allowed_operations': []
        }
    elif mii_value < MII_THRESHOLDS['warning']:
        return {
            'level': 'WARNING',
            'message': 'System integrity below threshold - restricted operations',
            'allowed_operations': ['read', 'emergency_fix']
        }
    elif mii_value < MII_THRESHOLDS['healthy']:
        return {
            'level': 'CAUTION',
            'message': 'System integrity acceptable - normal operations allowed',
            'allowed_operations': ['read', 'write', 'deploy']
        }
    elif mii_value < MII_THRESHOLDS['excellent']:
        return {
            'level': 'HEALTHY',
            'message': 'System integrity healthy - all operations allowed',
            'allowed_operations': ['read', 'write', 'deploy', 'mint']
        }
    else:
        return {
            'level': 'EXCELLENT',
            'message': 'System integrity excellent - bonus rewards available',
            'allowed_operations': ['read', 'write', 'deploy', 'mint', 'bonus']
        }

def main():
    print("📊 AUREA MII Validator")
    print("=" * 50)
    
    # Calculate MII
    mii_data = calculate_local_mii()
    mii_value = mii_data['mii']
    
    # Evaluate
    evaluation = evaluate_mii(mii_value)
    
    # Determine verdict
    if evaluation['level'] == 'CRITICAL':
        verdict = 'BLOCKED'
    elif evaluation['level'] == 'WARNING':
        verdict = 'NEEDS_REVISION'
    else:
        verdict = 'APPROVED'
    
    # Create reports
    os.makedirs('reports', exist_ok=True)
    
    report = {
        'sentinel': 'AUREA-MII',
        'timestamp': datetime.now().isoformat(),
        'verdict': verdict,
        'mii': mii_value,
        'thresholds': MII_THRESHOLDS,
        'evaluation': evaluation,
        'component_scores': mii_data['component_scores'],
        'weights': mii_data['weights']
    }
    
    with open('reports/aurea-mii.json', 'w') as f:
        json.dump(report, f, indent=2)
    
    # Print results
    print(f"\n{'='*50}")
    print(f"MII Validation Results")
    print(f"{'='*50}")
    
    # MII bar visualization
    bar_width = 40
    filled = int(mii_value * bar_width)
    bar = '█' * filled + '░' * (bar_width - filled)
    print(f"\nMII: [{bar}] {mii_value:.2%}")
    print(f"Level: {evaluation['level']}")
    print(f"Message: {evaluation['message']}")
    
    print(f"\nComponent Scores:")
    for component, score in mii_data['component_scores'].items():
        weight = MII_WEIGHTS[component]
        contribution = score * weight
        print(f"  {component}: {score:.2f} (weight: {weight:.0%}, contribution: {contribution:.4f})")
    
    print(f"\nThresholds:")
    for level, threshold in MII_THRESHOLDS.items():
        marker = "◀" if mii_value >= threshold else " "
        print(f"  {level}: {threshold:.0%} {marker}")
    
    print(f"\nAllowed Operations: {', '.join(evaluation['allowed_operations'])}")
    
    # Exit codes
    if verdict == 'BLOCKED':
        print("\n❌ MII validation BLOCKED - critical integrity issues")
        sys.exit(1)
    elif verdict == 'NEEDS_REVISION':
        print("\n⚠️  MII below healthy threshold")
        sys.exit(0)
    else:
        print("\n✅ MII validation passed")
        sys.exit(0)

if __name__ == '__main__':
    main()
