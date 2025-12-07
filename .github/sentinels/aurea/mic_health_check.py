#!/usr/bin/env python3
"""
AUREA MIC Health Check Sentinel
Monitors MIC API health and integrity
"""

import os
import json
import sys
import requests
from datetime import datetime

def check_mic_api():
    """Check MIC API health"""
    mic_api_base = os.environ.get('MIC_API_BASE', '')
    
    if not mic_api_base:
        return {
            'status': 'skipped',
            'message': 'MIC_API_BASE not configured',
            'healthy': True  # Don't fail if not configured
        }
    
    try:
        # Health endpoint
        response = requests.get(
            f"{mic_api_base}/health",
            timeout=30
        )
        
        health_status = response.status_code == 200
        
        return {
            'status': 'checked',
            'http_status': response.status_code,
            'healthy': health_status,
            'response_time_ms': response.elapsed.total_seconds() * 1000,
            'endpoint': f"{mic_api_base}/health"
        }
        
    except requests.exceptions.Timeout:
        return {
            'status': 'error',
            'message': 'Request timeout',
            'healthy': False
        }
    except requests.exceptions.ConnectionError:
        return {
            'status': 'error',
            'message': 'Connection failed',
            'healthy': False
        }
    except Exception as e:
        return {
            'status': 'error',
            'message': str(e),
            'healthy': False
        }

def check_mic_integrity_stats():
    """Check MIC integrity statistics"""
    mic_api_base = os.environ.get('MIC_API_BASE', '')
    
    if not mic_api_base:
        return {
            'status': 'skipped',
            'message': 'MIC_API_BASE not configured'
        }
    
    try:
        response = requests.get(
            f"{mic_api_base}/stats",
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            return {
                'status': 'available',
                'data': data
            }
        else:
            return {
                'status': 'unavailable',
                'http_status': response.status_code
            }
            
    except Exception as e:
        return {
            'status': 'error',
            'message': str(e)
        }

def check_mii_threshold():
    """Check current MII against threshold"""
    mic_api_base = os.environ.get('MIC_API_BASE', '')
    min_mii = float(os.environ.get('MIN_MII_THRESHOLD', '0.70'))
    
    if not mic_api_base:
        return {
            'status': 'skipped',
            'threshold': min_mii
        }
    
    try:
        response = requests.get(
            f"{mic_api_base}/mii",
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            current_mii = data.get('mii', data.get('value', 0))
            
            return {
                'status': 'checked',
                'current_mii': current_mii,
                'threshold': min_mii,
                'above_threshold': current_mii >= min_mii
            }
        else:
            return {
                'status': 'unavailable',
                'threshold': min_mii
            }
            
    except Exception as e:
        return {
            'status': 'error',
            'message': str(e),
            'threshold': min_mii
        }

def main():
    print("💎 AUREA MIC Health Check")
    print("=" * 50)
    
    # Run checks
    api_health = check_mic_api()
    integrity_stats = check_mic_integrity_stats()
    mii_check = check_mii_threshold()
    
    # Determine overall health
    all_healthy = True
    if api_health['status'] == 'checked' and not api_health.get('healthy', False):
        all_healthy = False
    if mii_check['status'] == 'checked' and not mii_check.get('above_threshold', True):
        all_healthy = False
    
    # Create reports
    os.makedirs('reports', exist_ok=True)
    
    report = {
        'sentinel': 'AUREA-MIC-HEALTH',
        'timestamp': datetime.now().isoformat(),
        'overall_healthy': all_healthy,
        'checks': {
            'api_health': api_health,
            'integrity_stats': integrity_stats,
            'mii_threshold': mii_check
        }
    }
    
    with open('reports/aurea-mic-health.json', 'w') as f:
        json.dump(report, f, indent=2)
    
    # Print results
    print(f"\n{'='*50}")
    print(f"MIC Health Check Results")
    print(f"{'='*50}")
    print(f"Overall Healthy: {all_healthy}\n")
    
    print("API Health:")
    print(f"  Status: {api_health['status']}")
    if api_health.get('healthy') is not None:
        print(f"  Healthy: {'✅' if api_health['healthy'] else '❌'}")
    if api_health.get('response_time_ms'):
        print(f"  Response Time: {api_health['response_time_ms']:.0f}ms")
    if api_health.get('message'):
        print(f"  Message: {api_health['message']}")
    
    print("\nMII Threshold:")
    print(f"  Status: {mii_check['status']}")
    print(f"  Threshold: {mii_check.get('threshold', 'N/A')}")
    if mii_check.get('current_mii') is not None:
        print(f"  Current MII: {mii_check['current_mii']}")
        print(f"  Above Threshold: {'✅' if mii_check.get('above_threshold') else '❌'}")
    
    # Exit codes
    if not all_healthy and api_health['status'] != 'skipped':
        print("\n⚠️  MIC health issues detected")
        sys.exit(1)
    else:
        print("\n✅ MIC health check passed")
        sys.exit(0)

if __name__ == '__main__':
    main()
