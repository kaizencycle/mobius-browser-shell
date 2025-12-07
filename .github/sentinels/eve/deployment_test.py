#!/usr/bin/env python3
"""
EVE Deployment Test Sentinel
Tests deployment health and endpoint availability
"""

import os
import json
import sys
import requests
from datetime import datetime
from urllib.parse import urlparse

def check_endpoint(url, name, timeout=30):
    """Check a single endpoint"""
    if not url:
        return {
            'name': name,
            'status': 'skipped',
            'message': 'URL not configured'
        }
    
    try:
        response = requests.get(url, timeout=timeout, allow_redirects=True)
        
        return {
            'name': name,
            'url': url,
            'status': 'checked',
            'http_status': response.status_code,
            'healthy': response.status_code in [200, 301, 302, 304],
            'response_time_ms': response.elapsed.total_seconds() * 1000,
            'content_length': len(response.content)
        }
        
    except requests.exceptions.Timeout:
        return {
            'name': name,
            'url': url,
            'status': 'error',
            'message': 'Request timeout',
            'healthy': False
        }
    except requests.exceptions.SSLError as e:
        return {
            'name': name,
            'url': url,
            'status': 'error',
            'message': f'SSL error: {str(e)[:100]}',
            'healthy': False
        }
    except requests.exceptions.ConnectionError:
        return {
            'name': name,
            'url': url,
            'status': 'error',
            'message': 'Connection failed',
            'healthy': False
        }
    except Exception as e:
        return {
            'name': name,
            'url': url,
            'status': 'error',
            'message': str(e)[:100],
            'healthy': False
        }

def check_shell_deployment():
    """Check main shell deployment"""
    shell_url = os.environ.get('SHELL_URL', '')
    return check_endpoint(shell_url, 'Shell')

def check_lab_endpoints():
    """Check all Lab endpoints"""
    labs = {
        'OAA': os.environ.get('OAA_URL', os.environ.get('VITE_OAA_URL', '')),
        'Reflections': os.environ.get('REFLECTIONS_URL', os.environ.get('VITE_REFLECTIONS_URL', '')),
        'Citizen Shield': os.environ.get('SHIELD_URL', os.environ.get('VITE_CITIZEN_SHIELD_URL', '')),
        'Wallet': os.environ.get('WALLET_URL', os.environ.get('VITE_WALLET_URL', '')),
        'Hive': os.environ.get('HIVE_URL', os.environ.get('VITE_HIVE_URL', '')),
    }
    
    results = []
    for name, url in labs.items():
        result = check_endpoint(url, name, timeout=15)
        results.append(result)
    
    return results

def check_api_endpoints():
    """Check API endpoints"""
    apis = {
        'MIC API': os.environ.get('MIC_API_BASE', os.environ.get('VITE_MIC_API_BASE', '')),
    }
    
    results = []
    for name, base_url in apis.items():
        if base_url:
            # Check health endpoint
            url = f"{base_url.rstrip('/')}/health"
            result = check_endpoint(url, f"{name} Health", timeout=15)
            results.append(result)
    
    return results

def main():
    print("🌐 EVE Deployment Test")
    print("=" * 50)
    
    # Run checks
    shell_check = check_shell_deployment()
    lab_checks = check_lab_endpoints()
    api_checks = check_api_endpoints()
    
    all_checks = [shell_check] + lab_checks + api_checks
    
    # Count results
    healthy_count = sum(1 for c in all_checks if c.get('healthy', False))
    checked_count = sum(1 for c in all_checks if c.get('status') == 'checked')
    skipped_count = sum(1 for c in all_checks if c.get('status') == 'skipped')
    error_count = sum(1 for c in all_checks if c.get('status') == 'error')
    
    # Determine overall health
    # Shell is critical, labs are optional
    shell_healthy = shell_check.get('healthy', False) or shell_check.get('status') == 'skipped'
    overall_healthy = shell_healthy and error_count == 0
    
    # Create reports
    os.makedirs('reports', exist_ok=True)
    
    report = {
        'sentinel': 'EVE',
        'timestamp': datetime.now().isoformat(),
        'overall_healthy': overall_healthy,
        'summary': {
            'total_endpoints': len(all_checks),
            'healthy': healthy_count,
            'checked': checked_count,
            'skipped': skipped_count,
            'errors': error_count
        },
        'shell': shell_check,
        'labs': lab_checks,
        'apis': api_checks
    }
    
    with open('reports/eve-deployment.json', 'w') as f:
        json.dump(report, f, indent=2)
    
    # Save health status
    with open('reports/eve-health.txt', 'w') as f:
        f.write('true' if overall_healthy else 'false')
    
    # Print results
    print(f"\n{'='*50}")
    print(f"Deployment Test Results")
    print(f"{'='*50}")
    print(f"Overall Healthy: {'✅' if overall_healthy else '❌'}")
    print(f"\nSummary:")
    print(f"  Endpoints checked: {checked_count}")
    print(f"  Healthy: {healthy_count}")
    print(f"  Skipped: {skipped_count}")
    print(f"  Errors: {error_count}")
    
    print(f"\nShell Deployment:")
    status_icon = "✅" if shell_check.get('healthy') else ("⏭️" if shell_check.get('status') == 'skipped' else "❌")
    print(f"  {status_icon} {shell_check['name']}: {shell_check.get('status', 'unknown')}")
    if shell_check.get('http_status'):
        print(f"      HTTP {shell_check['http_status']} ({shell_check.get('response_time_ms', 0):.0f}ms)")
    if shell_check.get('message'):
        print(f"      {shell_check['message']}")
    
    print(f"\nLab Endpoints:")
    for check in lab_checks:
        status_icon = "✅" if check.get('healthy') else ("⏭️" if check.get('status') == 'skipped' else "❌")
        print(f"  {status_icon} {check['name']}: {check.get('status', 'unknown')}")
        if check.get('http_status'):
            print(f"      HTTP {check['http_status']} ({check.get('response_time_ms', 0):.0f}ms)")
        if check.get('message'):
            print(f"      {check['message']}")
    
    if api_checks:
        print(f"\nAPI Endpoints:")
        for check in api_checks:
            status_icon = "✅" if check.get('healthy') else ("⏭️" if check.get('status') == 'skipped' else "❌")
            print(f"  {status_icon} {check['name']}: {check.get('status', 'unknown')}")
    
    # Exit codes
    if not overall_healthy and shell_check.get('status') == 'checked':
        print("\n❌ Deployment health check failed")
        sys.exit(1)
    else:
        print("\n✅ Deployment health check passed")
        sys.exit(0)

if __name__ == '__main__':
    main()
