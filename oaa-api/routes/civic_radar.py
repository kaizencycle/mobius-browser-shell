# oaa-api/routes/civic_radar.py
"""
Civic Radar API - Real-time Security Intelligence for Citizen Shield
Constitutional Principle: Inform and protect, don't alarm or engage-bait.

This service aggregates security alerts from trusted sources and delivers
them in a curated, actionable format for the Citizen Shield dashboard.

Guardrails:
- No infinite scroll (max 5 high-signal alerts)
- No engagement optimization (ranked by integrity impact)
- Transparent sources (always show where it came from)
- Opt-in locality (geo-filtering requires explicit consent)
"""

import os
from datetime import datetime, timedelta
from typing import Optional
from flask import Blueprint, request, jsonify
import hashlib

civic_radar_bp = Blueprint('civic_radar', __name__)

# ============================================
# Alert Categories & Severity Levels
# ============================================

SEVERITY_LEVELS = ['low', 'medium', 'high', 'critical']
CATEGORIES = ['security', 'breach', 'policy', 'misinformation', 'privacy']

# ============================================
# Demo/Fallback Alerts
# These are shown when no live feed is configured
# In production, replace with real feed aggregation
# ============================================

DEMO_ALERTS = [
    {
        "id": "cve-2025-chrome-001",
        "timestamp": (datetime.utcnow() - timedelta(hours=2)).isoformat() + "Z",
        "severity": "critical",
        "category": "security",
        "title": "Chrome Zero-Day Actively Exploited",
        "summary": "Google Chrome versions below 131.0.6778.85 contain a critical vulnerability being actively exploited. Update immediately.",
        "impact": "Remote code execution possible via malicious website",
        "tags": ["browser", "device-hygiene", "critical-update"],
        "actions": [
            {"text": "Update Chrome immediately", "url": "chrome://settings/help", "module": "device-hygiene"},
            {"text": "Enable automatic updates", "module": "device-hygiene"}
        ],
        "sources": [
            {"name": "CISA", "url": "https://www.cisa.gov/known-exploited-vulnerabilities"},
            {"name": "Google Security", "url": "https://security.googleblog.com/"}
        ]
    },
    {
        "id": "breach-2025-healthcare-001",
        "timestamp": (datetime.utcnow() - timedelta(hours=18)).isoformat() + "Z",
        "severity": "high",
        "category": "breach",
        "title": "Major Healthcare Provider Data Breach",
        "summary": "Ascension Health reports unauthorized access to patient records affecting 5.6 million individuals.",
        "impact": "Potential exposure of medical records, SSN, and insurance information",
        "tags": ["healthcare", "data-breach", "identity-protection"],
        "actions": [
            {"text": "Check if you're affected", "url": "https://haveibeenpwned.com/", "module": "identity-protection"},
            {"text": "Consider credit freeze", "module": "identity-protection"},
            {"text": "Monitor bank statements", "module": "financial-hygiene"}
        ],
        "sources": [
            {"name": "HHS Breach Portal", "url": "https://ocrportal.hhs.gov/ocr/breach/breach_report.jsf"}
        ]
    },
    {
        "id": "misinfo-2025-deepfake-001",
        "timestamp": (datetime.utcnow() - timedelta(hours=6)).isoformat() + "Z",
        "severity": "medium",
        "category": "misinformation",
        "title": "Deepfake Campaign Detected",
        "summary": "AI-generated videos impersonating public officials circulating on social media. Multiple fact-checkers have flagged synthetic content.",
        "impact": "Verify video sources before sharing; potential voter confusion",
        "tags": ["deepfake", "media-literacy", "election-integrity"],
        "actions": [
            {"text": "Learn to spot deepfakes", "module": "media-literacy"},
            {"text": "Check fact-checkers before sharing", "url": "https://www.snopes.com/", "module": "info-hygiene"}
        ],
        "sources": [
            {"name": "NewsGuard", "url": "https://www.newsguardtech.com/"},
            {"name": "EUvsDisinfo", "url": "https://euvsdisinfo.eu/"}
        ]
    },
    {
        "id": "policy-2025-ai-act-001",
        "timestamp": (datetime.utcnow() - timedelta(days=3)).isoformat() + "Z",
        "severity": "low",
        "category": "policy",
        "title": "EU AI Act Takes Effect",
        "summary": "New regulations on AI systems now in force. Prohibits certain AI uses and requires transparency for high-risk applications.",
        "impact": "Companies must disclose AI usage; consumers gain new rights",
        "tags": ["ai-regulation", "privacy-rights", "digital-rights"],
        "actions": [
            {"text": "Learn about your new rights", "url": "https://artificialintelligenceact.eu/", "module": "privacy-rights"},
            {"text": "Check AI disclosure notices", "module": "digital-literacy"}
        ],
        "sources": [
            {"name": "European Commission", "url": "https://ec.europa.eu/digital-strategy/"}
        ]
    },
    {
        "id": "privacy-2025-data-broker-001",
        "timestamp": (datetime.utcnow() - timedelta(days=1)).isoformat() + "Z",
        "severity": "medium",
        "category": "privacy",
        "title": "Data Broker Selling Location History",
        "summary": "Investigation reveals major data broker selling precise location data from mobile apps without proper consent.",
        "impact": "Your location history may be available for purchase by third parties",
        "tags": ["location-privacy", "data-broker", "opt-out"],
        "actions": [
            {"text": "Review app permissions", "module": "device-hygiene"},
            {"text": "Opt out of data collection", "url": "https://www.optoutprescreen.com/", "module": "privacy-rights"}
        ],
        "sources": [
            {"name": "EFF", "url": "https://www.eff.org/"},
            {"name": "404 Media", "url": "https://www.404media.co/"}
        ]
    }
]


def generate_alert_id(title: str, timestamp: str) -> str:
    """Generate a stable ID for an alert based on title and timestamp"""
    content = f"{title}:{timestamp}"
    return hashlib.md5(content.encode()).hexdigest()[:12]


def filter_alerts_by_severity(alerts: list, min_severity: Optional[str] = None) -> list:
    """Filter alerts to only include those at or above min_severity"""
    if not min_severity:
        return alerts
    
    min_idx = SEVERITY_LEVELS.index(min_severity) if min_severity in SEVERITY_LEVELS else 0
    return [
        alert for alert in alerts 
        if SEVERITY_LEVELS.index(alert.get('severity', 'low')) >= min_idx
    ]


def filter_alerts_by_category(alerts: list, categories: Optional[list] = None) -> list:
    """Filter alerts to only include specified categories"""
    if not categories:
        return alerts
    return [alert for alert in alerts if alert.get('category') in categories]


# ============================================
# API Routes
# ============================================

@civic_radar_bp.route('/civic-radar', methods=['GET', 'OPTIONS'])
def get_civic_radar():
    """
    Get curated security intelligence alerts.
    
    Query Parameters:
        limit (int): Max alerts to return (default: 5, max: 10)
        min_severity (str): Minimum severity level (low/medium/high/critical)
        categories (str): Comma-separated categories to include
    
    Returns:
        {
            "alerts": [...],
            "metadata": {
                "lastUpdated": "2025-12-07T15:00:00Z",
                "alertCount": 5,
                "criticalCount": 1
            }
        }
    """
    # Handle preflight
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        # Parse query parameters
        limit = min(int(request.args.get('limit', 5)), 10)  # Cap at 10
        min_severity = request.args.get('min_severity')
        categories_param = request.args.get('categories')
        categories = categories_param.split(',') if categories_param else None
        
        # Get alerts (in production, this would fetch from real feeds)
        # For now, use demo alerts
        alerts = DEMO_ALERTS.copy()
        
        # Apply filters
        if min_severity:
            alerts = filter_alerts_by_severity(alerts, min_severity)
        if categories:
            alerts = filter_alerts_by_category(alerts, categories)
        
        # Sort by severity (critical first) then by timestamp (newest first)
        severity_order = {s: i for i, s in enumerate(reversed(SEVERITY_LEVELS))}
        alerts.sort(key=lambda a: (
            severity_order.get(a.get('severity', 'low'), 0),
            a.get('timestamp', '')
        ), reverse=True)
        
        # Limit results
        alerts = alerts[:limit]
        
        # Calculate metadata
        critical_count = len([a for a in alerts if a.get('severity') == 'critical'])
        
        return jsonify({
            "alerts": alerts,
            "metadata": {
                "lastUpdated": datetime.utcnow().isoformat() + "Z",
                "alertCount": len(alerts),
                "criticalCount": critical_count
            }
        })
    
    except Exception as e:
        print(f"Civic Radar error: {str(e)}")
        return jsonify({
            "error": "Failed to fetch civic radar data",
            "details": str(e)
        }), 500


@civic_radar_bp.route('/civic-radar/categories', methods=['GET'])
def get_categories():
    """Return available alert categories"""
    return jsonify({
        "categories": CATEGORIES,
        "severities": SEVERITY_LEVELS
    })


@civic_radar_bp.route('/civic-radar/health', methods=['GET'])
def health_check():
    """Health check for civic radar service"""
    return jsonify({
        "status": "healthy",
        "service": "civic-radar",
        "demo_mode": True,  # Will be False when live feeds are configured
        "alert_count": len(DEMO_ALERTS)
    })


# ============================================
# Future: Feed Aggregation (Placeholder)
# ============================================

# In production, you would:
# 1. Set up scheduled jobs to poll trusted feeds:
#    - CISA alerts: https://www.cisa.gov/cybersecurity-advisories/rss.xml
#    - US-CERT: https://www.us-cert.gov/ncas/current-activity.xml
#    - EFF: https://www.eff.org/rss/updates.xml
#    - NIST CVE: https://nvd.nist.gov/vuln/data-feeds
#
# 2. Classify incoming alerts:
#    - Use NLP/rules to categorize
#    - Assign severity based on CVSS scores, impact
#    - Tag with relevant Shield modules
#
# 3. Store in a lightweight database (Redis/SQLite)
#
# 4. Serve cached results with TTL
#
# Example feed parser (commented out, for future use):
#
# import feedparser
#
# TRUSTED_FEEDS = {
#     'cisa': 'https://www.cisa.gov/cybersecurity-advisories/rss.xml',
#     'us-cert': 'https://www.us-cert.gov/ncas/current-activity.xml',
# }
#
# def fetch_feed_alerts(feed_url: str, source_name: str) -> list:
#     """Parse an RSS/Atom feed and convert to our alert format"""
#     feed = feedparser.parse(feed_url)
#     alerts = []
#     for entry in feed.entries[:5]:
#         alerts.append({
#             'id': generate_alert_id(entry.title, entry.published),
#             'timestamp': entry.published,
#             'severity': 'high',  # Would need NLP to classify
#             'category': 'security',
#             'title': entry.title,
#             'summary': entry.summary[:200] + '...',
#             'impact': 'See source for details',
#             'tags': ['security'],
#             'actions': [{'text': 'Read full advisory', 'url': entry.link}],
#             'sources': [{'name': source_name, 'url': entry.link}]
#         })
#     return alerts
