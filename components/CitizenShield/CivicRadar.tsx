import React, { useState, useEffect } from 'react';
import { 
  CivicRadarAlert, 
  CivicRadarResponse,
  CivicAlertSeverity 
} from '../../types';
import { env } from '../../config/env';
import { 
  AlertTriangle, 
  Shield, 
  Radio, 
  ExternalLink, 
  RefreshCw,
  Bell,
  Lock,
  FileWarning,
  Scale,
  Eye
} from 'lucide-react';

// ============================================
// Mock Data for Demo Mode
// In production, this comes from /api/civic-radar
// ============================================

const MOCK_CIVIC_ALERTS: CivicRadarAlert[] = [
  {
    id: 'cve-2025-chrome-001',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    severity: 'critical',
    category: 'security',
    title: 'Chrome Zero-Day Actively Exploited',
    summary: 'Google Chrome versions below 131.0.6778.85 contain a critical vulnerability being actively exploited in the wild. Immediate update recommended.',
    impact: 'Remote code execution possible via malicious website',
    tags: ['browser', 'device-hygiene', 'critical-update'],
    actions: [
      { text: 'Update Chrome immediately', url: 'chrome://settings/help', module: 'device-hygiene' },
      { text: 'Enable automatic updates', module: 'device-hygiene' }
    ],
    sources: [
      { name: 'CISA', url: 'https://www.cisa.gov/known-exploited-vulnerabilities' },
      { name: 'Google Security Blog', url: 'https://security.googleblog.com/' }
    ]
  },
  {
    id: 'breach-2025-healthcare-001',
    timestamp: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(), // 18 hours ago
    severity: 'high',
    category: 'breach',
    title: 'Major Healthcare Provider Data Breach',
    summary: 'Ascension Health reports unauthorized access to patient records affecting 5.6 million individuals. Personal health information may have been exposed.',
    impact: 'Potential exposure of medical records, SSN, and insurance information',
    tags: ['healthcare', 'data-breach', 'identity-protection'],
    actions: [
      { text: 'Check if you\'re affected', url: 'https://haveibeenpwned.com/', module: 'identity-protection' },
      { text: 'Consider credit freeze', module: 'identity-protection' },
      { text: 'Monitor bank statements', module: 'financial-hygiene' }
    ],
    sources: [
      { name: 'HHS Breach Portal', url: 'https://ocrportal.hhs.gov/ocr/breach/breach_report.jsf' }
    ]
  },
  {
    id: 'policy-2025-ai-act-001',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    severity: 'low',
    category: 'policy',
    title: 'EU AI Act Takes Effect',
    summary: 'New regulations on AI systems now in force. Prohibits certain AI uses and requires transparency for high-risk applications.',
    impact: 'Companies must disclose AI usage; consumers gain new rights',
    tags: ['ai-regulation', 'privacy-rights', 'digital-rights'],
    actions: [
      { text: 'Learn about your new rights', url: 'https://artificialintelligenceact.eu/', module: 'privacy-rights' },
      { text: 'Check AI disclosure notices', module: 'digital-literacy' }
    ],
    sources: [
      { name: 'European Commission', url: 'https://ec.europa.eu/digital-strategy/' }
    ]
  },
  {
    id: 'misinfo-2025-election-001',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
    severity: 'medium',
    category: 'misinformation',
    title: 'Deepfake Campaign Detected',
    summary: 'AI-generated videos impersonating public officials circulating on social media. Multiple fact-check organizations have flagged synthetic content.',
    impact: 'Potential voter confusion; verify video sources before sharing',
    tags: ['deepfake', 'media-literacy', 'election-integrity'],
    actions: [
      { text: 'Learn to spot deepfakes', module: 'media-literacy' },
      { text: 'Check fact-checkers before sharing', url: 'https://www.snopes.com/', module: 'info-hygiene' }
    ],
    sources: [
      { name: 'NewsGuard', url: 'https://www.newsguardtech.com/' },
      { name: 'EUvsDisinfo', url: 'https://euvsdisinfo.eu/' }
    ]
  }
];

// ============================================
// Helper Functions
// ============================================

const getSeverityStyles = (severity: CivicAlertSeverity): string => {
  switch (severity) {
    case 'critical':
      return 'bg-red-50 border-l-4 border-red-500 text-red-900';
    case 'high':
      return 'bg-orange-50 border-l-4 border-orange-500 text-orange-900';
    case 'medium':
      return 'bg-amber-50 border-l-4 border-amber-500 text-amber-900';
    default:
      return 'bg-blue-50 border-l-4 border-blue-500 text-blue-900';
  }
};

const getSeverityIcon = (severity: CivicAlertSeverity): React.ReactNode => {
  const iconClass = 'w-5 h-5';
  switch (severity) {
    case 'critical':
      return <AlertTriangle className={`${iconClass} text-red-600`} />;
    case 'high':
      return <Bell className={`${iconClass} text-orange-600`} />;
    case 'medium':
      return <FileWarning className={`${iconClass} text-amber-600`} />;
    default:
      return <Shield className={`${iconClass} text-blue-600`} />;
  }
};

const getCategoryIcon = (category: string): React.ReactNode => {
  const iconClass = 'w-4 h-4 opacity-60';
  switch (category) {
    case 'security':
      return <Lock className={iconClass} />;
    case 'breach':
      return <AlertTriangle className={iconClass} />;
    case 'policy':
      return <Scale className={iconClass} />;
    case 'misinformation':
      return <Eye className={iconClass} />;
    case 'privacy':
      return <Shield className={iconClass} />;
    default:
      return <Radio className={iconClass} />;
  }
};

const formatTimeAgo = (timestamp: string): string => {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays}d ago`;
};

// ============================================
// Alert Card Component
// ============================================

interface AlertCardProps {
  alert: CivicRadarAlert;
  onActionClick?: (action: { text: string; url?: string; module?: string }) => void;
}

const AlertCard: React.FC<AlertCardProps> = ({ alert, onActionClick }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`rounded-lg p-4 ${getSeverityStyles(alert.severity)} transition-all duration-200`}>
      <div className="flex items-start gap-3">
        {/* Severity Icon */}
        <div className="flex-shrink-0 mt-0.5">
          {getSeverityIcon(alert.severity)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-1">
            {getCategoryIcon(alert.category)}
            <span className="text-[10px] uppercase tracking-wider font-semibold opacity-70">
              {alert.category}
            </span>
            <span className="text-[10px] opacity-50">•</span>
            <span className="text-[10px] opacity-50">
              {formatTimeAgo(alert.timestamp)}
            </span>
          </div>

          {/* Title */}
          <h4 className="font-semibold text-sm mb-1">{alert.title}</h4>

          {/* Summary */}
          <p className="text-xs leading-relaxed opacity-80 mb-2">{alert.summary}</p>

          {/* Impact (expandable) */}
          {expanded && (
            <div className="text-xs mb-3 p-2 bg-black/5 rounded">
              <strong>Impact:</strong> {alert.impact}
            </div>
          )}

          {/* Actions */}
          <div className="space-y-1.5">
            {alert.actions.slice(0, expanded ? undefined : 2).map((action, idx) => (
              <button
                key={idx}
                onClick={() => {
                  if (action.url) {
                    window.open(action.url, '_blank', 'noopener,noreferrer');
                  }
                  onActionClick?.(action);
                }}
                className="w-full text-left px-3 py-2 bg-white/60 hover:bg-white rounded text-xs font-medium transition-colors flex items-center gap-2"
              >
                <span className="text-current">→</span>
                <span className="flex-1">{action.text}</span>
                {action.url && <ExternalLink className="w-3 h-3 opacity-40" />}
              </button>
            ))}
          </div>

          {/* Expand/Collapse */}
          {(alert.actions.length > 2 || alert.impact) && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-[10px] font-medium mt-2 opacity-60 hover:opacity-100 transition-opacity"
            >
              {expanded ? '− Show less' : `+ Show more`}
            </button>
          )}

          {/* Sources */}
          {expanded && (
            <div className="mt-3 pt-3 border-t border-current/10">
              <div className="flex flex-wrap items-center gap-2 text-[10px] opacity-60">
                <span>Sources:</span>
                {alert.sources.map((source, idx) => (
                  <a
                    key={idx}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:opacity-100"
                  >
                    {source.name}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================
// Main Civic Radar Component
// ============================================

interface CivicRadarProps {
  /** Callback when user clicks an action that links to a Shield module */
  onModuleNavigate?: (moduleId: string) => void;
  /** Max number of alerts to display (default: 5) */
  maxAlerts?: number;
  /** Whether to show in compact mode */
  compact?: boolean;
}

export const CivicRadar: React.FC<CivicRadarProps> = ({ 
  onModuleNavigate,
  maxAlerts = 5,
  compact = false
}) => {
  const [data, setData] = useState<CivicRadarResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Fetch alerts
  const fetchAlerts = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch from Civic Radar API (served from OAA API backend)
      const apiUrl = `${env.api.civicRadar}/api/civic-radar`;
      const response = await fetch(apiUrl, {
        headers: { 'Accept': 'application/json' }
      });

      if (response.ok) {
        const result = await response.json();
        setData(result);
      } else {
        throw new Error('API unavailable');
      }
    } catch {
      // Fallback to mock data in demo mode
      console.log('📡 Civic Radar: Using demo data');
      setData({
        alerts: MOCK_CIVIC_ALERTS.slice(0, maxAlerts),
        metadata: {
          lastUpdated: new Date().toISOString(),
          alertCount: MOCK_CIVIC_ALERTS.length,
          criticalCount: MOCK_CIVIC_ALERTS.filter(a => a.severity === 'critical').length
        }
      });
    } finally {
      setLoading(false);
      setLastRefresh(new Date());
    }
  };

  useEffect(() => {
    fetchAlerts();
    // Refresh every 15 minutes
    const interval = setInterval(fetchAlerts, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [maxAlerts]);

  const handleActionClick = (action: { text: string; url?: string; module?: string }) => {
    if (action.module && onModuleNavigate) {
      onModuleNavigate(action.module);
    }
  };

  // Loading state
  if (loading && !data) {
    return (
      <div className="p-6 text-center">
        <div className="flex items-center justify-center gap-2 text-slate-500">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span className="text-sm">Scanning civic signals...</span>
        </div>
      </div>
    );
  }

  // Error state with no data
  if (error && !data) {
    return (
      <div className="p-6 text-center">
        <div className="text-amber-600 mb-2">
          <Radio className="w-8 h-8 mx-auto opacity-50" />
        </div>
        <p className="text-sm text-slate-600">{error}</p>
        <button
          onClick={fetchAlerts}
          className="mt-2 text-xs text-indigo-600 hover:text-indigo-800"
        >
          Try again
        </button>
      </div>
    );
  }

  // All clear state
  if (!data || data.alerts.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="text-emerald-500 mb-2">
          <Shield className="w-10 h-10 mx-auto" />
        </div>
        <p className="text-sm text-slate-700 font-medium">All clear</p>
        <p className="text-xs text-slate-500 mt-1">
          No urgent signals at this time.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${compact ? 'p-3' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-indigo-500" />
          <h3 className="font-semibold text-slate-800 text-sm">Civic Radar</h3>
          {data.metadata.criticalCount > 0 && (
            <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] font-semibold rounded-full animate-pulse">
              {data.metadata.criticalCount} critical
            </span>
          )}
        </div>
        <button
          onClick={fetchAlerts}
          disabled={loading}
          className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Subtitle */}
      <p className="text-xs text-slate-500 px-1 -mt-2">
        {data.metadata.alertCount} signal{data.metadata.alertCount !== 1 ? 's' : ''} worth your attention
      </p>

      {/* Alerts List */}
      <div className="space-y-3">
        {data.alerts.slice(0, maxAlerts).map((alert) => (
          <AlertCard
            key={alert.id}
            alert={alert}
            onActionClick={handleActionClick}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="text-[10px] text-slate-400 text-center pt-2 border-t border-slate-100">
        Last scanned: {lastRefresh.toLocaleTimeString()} • Curated for integrity, not engagement
      </div>
    </div>
  );
};

export default CivicRadar;
