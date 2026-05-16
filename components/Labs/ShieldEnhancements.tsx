/**
 * ShieldEnhancements
 *
 * 20 UI/UX optimisation components for the Citizen Shield lab.
 * SHD-01 … SHD-20
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Shield,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Clock,
  AlertTriangle,
  Info,
  Activity,
  Clipboard,
  BookOpen,
  Wifi,
  Lock,
  Database,
  FileText,
  X,
  Download,
  Zap,
} from 'lucide-react';
import {
  ThreatIntelligenceFeed,
  ThreatIntelligenceEntry,
  ThreatRAGSource,
  EchoAgentState,
  CivicRadarAlert,
  CivicAlertSeverity,
  ThreatDomain,
  ThreatSeverity,
  ThreatStatus,
} from '../../types';

// ─────────────────────────────────────────────────────────────────────────────
// SHD-01  CivicHealthScore
// SVG ring gauge computed from ThreatIntelligenceFeed.metadata
// ─────────────────────────────────────────────────────────────────────────────
interface CivicHealthScoreProps {
  feed: ThreatIntelligenceFeed | null;
  size?: number;
}

export const CivicHealthScore: React.FC<CivicHealthScoreProps> = ({ feed, size = 80 }) => {
  const criticalCount = feed?.metadata.criticalCount ?? 0;
  const highCount = feed?.metadata.highCount ?? 0;
  const score = Math.max(0, 100 - criticalCount * 20 - highCount * 8);

  const color = score >= 65 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444';
  const r = size / 2 - 8;
  const circumference = 2 * Math.PI * r;
  const strokeDash = (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#1e293b"
          strokeWidth={8}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={8}
          strokeDasharray={`${strokeDash} ${circumference}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
        <text
          x={size / 2}
          y={size / 2 + 5}
          textAnchor="middle"
          fill={color}
          fontSize={size * 0.22}
          fontWeight="bold"
          fontFamily="monospace"
        >
          {score}
        </text>
      </svg>
      <span className="text-[10px] text-slate-400 uppercase tracking-wider">Civic Health</span>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SHD-02  EchoAgentPanel
// ─────────────────────────────────────────────────────────────────────────────
interface EchoAgentPanelProps {
  agentState: EchoAgentState | null | undefined;
}

export const EchoAgentPanel: React.FC<EchoAgentPanelProps> = ({ agentState }) => {
  const [countdown, setCountdown] = useState<number>(0);

  useEffect(() => {
    if (!agentState?.nextScanAt) return;
    const tick = () => {
      const ms = new Date(agentState.nextScanAt).getTime() - Date.now();
      setCountdown(Math.max(0, Math.floor(ms / 1000)));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [agentState?.nextScanAt]);

  const statusColors: Record<string, string> = {
    scanning: 'bg-cyan-400',
    processing: 'bg-amber-400',
    alert: 'bg-red-400',
    idle: 'bg-emerald-400',
    offline: 'bg-slate-500',
  };

  const dotColor = statusColors[agentState?.status ?? 'offline'] ?? 'bg-slate-500';
  const isActive = agentState?.status === 'scanning' || agentState?.status === 'processing';
  const integrity = agentState?.integrity ?? 0;
  const mins = Math.floor(countdown / 60);
  const secs = countdown % 60;

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`h-2.5 w-2.5 rounded-full ${dotColor} ${isActive ? 'animate-pulse' : ''}`}
          />
          <span className="text-sm font-semibold text-slate-100">ECHO Sentinel</span>
        </div>
        <span className="text-[10px] text-slate-400 uppercase tracking-wider">
          {agentState?.status ?? 'offline'}
        </span>
      </div>

      {/* Integrity */}
      <div>
        <div className="flex justify-between text-[10px] text-slate-400 mb-1">
          <span>Agent Integrity</span>
          <span>{Math.round(integrity * 100)}%</span>
        </div>
        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${integrity * 100}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="bg-slate-800/60 rounded-lg p-2">
          <div className="text-lg font-bold text-cyan-400">
            {agentState?.activeThreatCount ?? 0}
          </div>
          <div className="text-[10px] text-slate-500">Active Threats</div>
        </div>
        <div className="bg-slate-800/60 rounded-lg p-2">
          <div className="text-lg font-bold text-slate-200 font-mono">
            {agentState ? `${mins}:${String(secs).padStart(2, '0')}` : '—'}
          </div>
          <div className="text-[10px] text-slate-500">Next Scan</div>
        </div>
      </div>

      <div className="text-[10px] text-slate-500 flex items-center gap-1">
        <Activity className="w-3 h-3" />
        {agentState?.totalScansCompleted ?? 0} total scans completed
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SHD-03  AlertCard
// ─────────────────────────────────────────────────────────────────────────────
interface AlertCardProps {
  alert: CivicRadarAlert;
  onDismiss?: (id: string) => void;
}

const SEVERITY_BORDER: Record<CivicAlertSeverity, string> = {
  critical: 'border-red-500',
  high: 'border-orange-500',
  medium: 'border-amber-400',
  low: 'border-slate-400',
};

const SEVERITY_BAR: Record<CivicAlertSeverity, string> = {
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-amber-400',
  low: 'bg-slate-400',
};

export const AlertCard: React.FC<AlertCardProps> = ({ alert, onDismiss }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`relative bg-white rounded-xl border-l-4 ${SEVERITY_BORDER[alert.severity]} shadow-sm overflow-hidden`}
    >
      <div className={`h-0.5 w-full ${SEVERITY_BAR[alert.severity]}`} />
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <button
            onClick={() => setExpanded(v => !v)}
            className="flex-1 text-left"
          >
            <div className="font-semibold text-slate-800 text-sm leading-snug">{alert.title}</div>
            <div className="text-xs text-slate-500 mt-0.5 line-clamp-2">{alert.summary}</div>
          </button>
          <div className="flex items-center gap-1 flex-none">
            {onDismiss && (
              <button
                onClick={() => onDismiss(alert.id)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
                aria-label="Dismiss alert"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={() => setExpanded(v => !v)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded"
              aria-label={expanded ? 'Collapse' : 'Expand'}
            >
              {expanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {expanded && (
          <div className="mt-3 space-y-3 border-t border-slate-100 pt-3">
            <p className="text-xs text-slate-600">{alert.impact}</p>
            {alert.actions.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {alert.actions.map((action, i) => (
                  <a
                    key={i}
                    href={action.url ?? '#'}
                    target={action.url ? '_blank' : undefined}
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium hover:bg-slate-200 transition-colors"
                  >
                    {action.text}
                    {action.url && <ExternalLink className="w-3 h-3" />}
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SHD-04  DomainFilter
// ─────────────────────────────────────────────────────────────────────────────
interface DomainFilterProps {
  selected: ThreatDomain | 'all';
  onChange: (domain: ThreatDomain | 'all') => void;
}

const DOMAIN_META: { domain: ThreatDomain | 'all'; label: string; Icon: React.FC<{ className?: string }> }[] = [
  { domain: 'all', label: 'All', Icon: ({ className }) => <Shield className={className} /> },
  { domain: 'cyber_threats', label: 'Cyber Threats', Icon: ({ className }) => <AlertTriangle className={className} /> },
  { domain: 'cyber_security', label: 'Cyber Security', Icon: ({ className }) => <Lock className={className} /> },
  { domain: 'digital_health', label: 'Digital Health', Icon: ({ className }) => <Activity className={className} /> },
];

export const DomainFilter: React.FC<DomainFilterProps> = ({ selected, onChange }) => (
  <div className="flex flex-wrap gap-2">
    {DOMAIN_META.map(({ domain, label, Icon }) => {
      const active = selected === domain;
      return (
        <button
          key={domain}
          onClick={() => onChange(domain)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
            active
              ? 'bg-slate-900 text-white border-slate-900'
              : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400'
          }`}
        >
          <Icon className="w-3 h-3" />
          {label}
        </button>
      );
    })}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// SHD-05  SeveritySummary
// ─────────────────────────────────────────────────────────────────────────────
interface SeveritySummaryProps {
  feed: ThreatIntelligenceFeed | null;
}

const SEV_ORDER: ThreatSeverity[] = ['critical', 'high', 'medium', 'low', 'info'];
const SEV_COLORS: Record<ThreatSeverity, string> = {
  critical: 'bg-red-100 text-red-700 border-red-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  low: 'bg-slate-100 text-slate-600 border-slate-200',
  info: 'bg-blue-50 text-blue-600 border-blue-100',
};

export const SeveritySummary: React.FC<SeveritySummaryProps> = ({ feed }) => {
  const counts = SEV_ORDER.reduce<Record<ThreatSeverity, number>>(
    (acc, s) => ({ ...acc, [s]: 0 }),
    {} as Record<ThreatSeverity, number>,
  );

  feed?.entries.forEach(e => {
    counts[e.severity] = (counts[e.severity] ?? 0) + 1;
  });

  return (
    <div className="flex flex-wrap gap-2">
      {SEV_ORDER.map(sev => (
        <div
          key={sev}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium ${SEV_COLORS[sev]}`}
        >
          <span className="capitalize">{sev}</span>
          <span className="font-bold">{counts[sev]}</span>
        </div>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SHD-06  ScanTimer
// ─────────────────────────────────────────────────────────────────────────────
interface ScanTimerProps {
  nextScanAt: string | undefined;
}

export const ScanTimer: React.FC<ScanTimerProps> = ({ nextScanAt }) => {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!nextScanAt) return;
    const tick = () => {
      const ms = new Date(nextScanAt).getTime() - Date.now();
      setSeconds(Math.max(0, Math.floor(ms / 1000)));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [nextScanAt]);

  const m = Math.floor(seconds / 60);
  const s = seconds % 60;

  return (
    <div className="flex items-center gap-1.5 text-xs text-slate-500">
      <Clock className="w-3 h-3" />
      <span>
        Next scan in{' '}
        <span className="font-mono font-semibold text-slate-700">
          {m}:{String(s).padStart(2, '0')}
        </span>
      </span>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SHD-07  useActionTracker hook
// ─────────────────────────────────────────────────────────────────────────────
const ACTIONS_KEY = 'shield_completed_actions_v1';

export function useActionTracker(): {
  completed: Set<string>;
  markDone: (id: string) => void;
  unmark: (id: string) => void;
} {
  const [completed, setCompleted] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(ACTIONS_KEY);
      return raw ? new Set<string>(JSON.parse(raw) as string[]) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  });

  const persist = useCallback((next: Set<string>) => {
    setCompleted(next);
    try {
      localStorage.setItem(ACTIONS_KEY, JSON.stringify(Array.from(next)));
    } catch { /* storage quota */ }
  }, []);

  const markDone = useCallback(
    (id: string) => persist(new Set([...completed, id])),
    [completed, persist],
  );

  const unmark = useCallback(
    (id: string) => {
      const next = new Set(completed);
      next.delete(id);
      persist(next);
    },
    [completed, persist],
  );

  return { completed, markDone, unmark };
}

// ─────────────────────────────────────────────────────────────────────────────
// SHD-08  IOCPanel
// ─────────────────────────────────────────────────────────────────────────────
interface IOCPanelProps {
  entry: ThreatIntelligenceEntry;
}

export const IOCPanel: React.FC<IOCPanelProps> = ({ entry }) => {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const copyIOC = (ioc: string, idx: number) => {
    navigator.clipboard.writeText(ioc).then(() => {
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 1500);
    });
  };

  if (entry.indicators.length === 0) return null;

  return (
    <div className="space-y-1">
      <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
        <Clipboard className="w-3 h-3" />
        Indicators of Compromise
      </p>
      {entry.indicators.map((ioc, i) => (
        <div
          key={i}
          className="flex items-center justify-between gap-2 bg-slate-50 border border-slate-200 rounded px-2 py-1"
        >
          <code className="text-xs text-slate-700 font-mono truncate">{ioc}</code>
          <button
            onClick={() => copyIOC(ioc, i)}
            className="p-1 text-slate-400 hover:text-slate-700 rounded flex-none"
            aria-label="Copy IOC"
          >
            {copiedIdx === i ? (
              <Check className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SHD-09  ConfidenceMeter
// ─────────────────────────────────────────────────────────────────────────────
interface ConfidenceMeterProps {
  value: number;
  label?: string;
}

export const ConfidenceMeter: React.FC<ConfidenceMeterProps> = ({ value, label = 'ECHO Confidence' }) => {
  const pct = Math.round(value * 100);
  const color = pct >= 65 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <div>
      <div className="flex justify-between text-[10px] text-slate-400 mb-1">
        <span>{label}</span>
        <span className="font-mono">{pct}%</span>
      </div>
      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SHD-10  Resolved archive toggle
// ─────────────────────────────────────────────────────────────────────────────
interface ResolvedToggleProps {
  showResolved: boolean;
  onToggle: () => void;
  resolvedCount: number;
}

export const ResolvedToggle: React.FC<ResolvedToggleProps> = ({
  showResolved,
  onToggle,
  resolvedCount,
}) => (
  <button
    onClick={onToggle}
    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
      showResolved
        ? 'bg-slate-800 text-slate-100 border-slate-600'
        : 'bg-white text-slate-500 border-slate-300 hover:border-slate-400'
    }`}
  >
    <Check className="w-3 h-3" />
    {showResolved ? 'Hide' : 'Show'} Resolved ({resolvedCount})
  </button>
);

// ─────────────────────────────────────────────────────────────────────────────
// SHD-11  ThreatDonut
// ─────────────────────────────────────────────────────────────────────────────
interface ThreatDonutProps {
  breakdown: Record<ThreatDomain, number> | undefined;
  size?: number;
}

const DOMAIN_COLORS: Record<ThreatDomain, string> = {
  cyber_threats: '#ef4444',
  cyber_security: '#3b82f6',
  digital_health: '#10b981',
};

export const ThreatDonut: React.FC<ThreatDonutProps> = ({ breakdown, size = 100 }) => {
  const total = breakdown
    ? Object.values(breakdown).reduce((a, b) => a + b, 0)
    : 0;

  if (!breakdown || total === 0) {
    return (
      <div
        style={{ width: size, height: size }}
        className="rounded-full bg-slate-100 border-4 border-slate-200 flex items-center justify-center"
      >
        <span className="text-[10px] text-slate-400">No data</span>
      </div>
    );
  }

  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 10;
  const domains = Object.keys(breakdown) as ThreatDomain[];

  let cumulativeAngle = -Math.PI / 2;
  const slices = domains.map(domain => {
    const frac = breakdown[domain] / total;
    const angle = frac * 2 * Math.PI;
    const x1 = cx + r * Math.cos(cumulativeAngle);
    const y1 = cy + r * Math.sin(cumulativeAngle);
    cumulativeAngle += angle;
    const x2 = cx + r * Math.cos(cumulativeAngle);
    const y2 = cy + r * Math.sin(cumulativeAngle);
    const largeArc = angle > Math.PI ? 1 : 0;
    return { domain, d: `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${largeArc},1 ${x2},${y2} Z`, frac };
  });

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size}>
        {slices.map(s => (
          <path key={s.domain} d={s.d} fill={DOMAIN_COLORS[s.domain]} opacity={0.85} />
        ))}
        <circle cx={cx} cy={cy} r={r * 0.55} fill="white" />
        <text x={cx} y={cy + 4} textAnchor="middle" fontSize={size * 0.13} fill="#475569" fontWeight="bold">
          {total}
        </text>
      </svg>
      <div className="flex flex-wrap gap-2 justify-center">
        {domains.map(d => (
          <div key={d} className="flex items-center gap-1 text-[10px] text-slate-500">
            <span
              className="w-2 h-2 rounded-full inline-block"
              style={{ backgroundColor: DOMAIN_COLORS[d] }}
            />
            {d.replace('_', ' ')}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SHD-12  HygieneChecklist
// ─────────────────────────────────────────────────────────────────────────────
const HYGIENE_ITEMS = [
  { id: 'pw-manager', label: 'Password Manager', description: 'Using a dedicated password manager' },
  { id: '2fa', label: '2FA Enabled', description: 'Two-factor authentication on critical accounts' },
  { id: 'vpn', label: 'VPN Active', description: 'VPN in use on public networks' },
  { id: 'updates', label: 'System Updates', description: 'OS and apps are up to date' },
  { id: 'backup', label: 'Backups', description: 'Regular encrypted backups in place' },
  { id: 'permissions', label: 'App Permissions', description: 'Reviewed app permissions recently' },
] as const;

const HYGIENE_KEY = 'shield_hygiene_checklist_v1';

export const HygieneChecklist: React.FC = () => {
  const [checked, setChecked] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(HYGIENE_KEY);
      return raw ? new Set<string>(JSON.parse(raw) as string[]) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  });

  const toggle = (id: string) => {
    setChecked(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      try {
        localStorage.setItem(HYGIENE_KEY, JSON.stringify(Array.from(next)));
      } catch { /* quota */ }
      return next;
    });
  };

  const score = Math.round((checked.size / HYGIENE_ITEMS.length) * 100);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-800 text-sm">Hygiene Checklist</h3>
        <span
          className={`text-xs font-bold px-2 py-0.5 rounded-full ${
            score === 100 ? 'bg-emerald-100 text-emerald-700' : score >= 60 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
          }`}
        >
          {score}%
        </span>
      </div>

      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            score === 100 ? 'bg-emerald-500' : score >= 60 ? 'bg-amber-500' : 'bg-red-500'
          }`}
          style={{ width: `${score}%` }}
        />
      </div>

      <div className="space-y-2">
        {HYGIENE_ITEMS.map(item => (
          <label key={item.id} className="flex items-center gap-3 cursor-pointer group">
            <div
              className={`w-4 h-4 rounded border-2 flex-none flex items-center justify-center transition-colors ${
                checked.has(item.id)
                  ? 'bg-emerald-500 border-emerald-500'
                  : 'border-slate-300 group-hover:border-slate-400'
              }`}
              onClick={() => toggle(item.id)}
            >
              {checked.has(item.id) && <Check className="w-2.5 h-2.5 text-white" />}
            </div>
            <div className="min-w-0">
              <div
                className={`text-sm font-medium ${checked.has(item.id) ? 'text-slate-400 line-through' : 'text-slate-700'}`}
              >
                {item.label}
              </div>
              <div className="text-[10px] text-slate-400">{item.description}</div>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SHD-13  SeverityBadge
// ─────────────────────────────────────────────────────────────────────────────
interface SeverityBadgeProps {
  severity: CivicAlertSeverity | ThreatSeverity;
}

const BADGE_STYLES: Record<string, string> = {
  critical: 'bg-red-100 text-red-700 border-red-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  low: 'bg-slate-100 text-slate-600 border-slate-200',
  info: 'bg-blue-50 text-blue-600 border-blue-100',
};

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity }) => (
  <span
    className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-semibold uppercase tracking-wider ${BADGE_STYLES[severity] ?? BADGE_STYLES.low}`}
  >
    {severity}
  </span>
);

// ─────────────────────────────────────────────────────────────────────────────
// SHD-14  PracticeMode
// ─────────────────────────────────────────────────────────────────────────────
interface PracticeScenario {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const PRACTICE_SCENARIOS: PracticeScenario[] = [
  {
    question: 'You receive an email asking you to "verify your account" via a link. What should you do?',
    options: [
      'Click the link immediately',
      'Forward it to a friend to check',
      'Navigate directly to the site yourself',
      'Reply asking for more information',
    ],
    correctIndex: 2,
    explanation: 'Always navigate directly to the website instead of clicking email links — this avoids phishing attempts.',
  },
  {
    question: 'Which password is strongest?',
    options: ['Password123!', 'p@$$w0rd', 'correct-horse-battery-staple', 'abc123'],
    correctIndex: 2,
    explanation: 'Long passphrases (4+ random words) offer more entropy than short complex strings and are easier to remember.',
  },
  {
    question: 'Public Wi-Fi risk — what mitigates it best?',
    options: ['Staying on HTTPS sites only', 'Using a VPN', 'Logging out afterwards', 'Using incognito mode'],
    correctIndex: 1,
    explanation: 'A VPN encrypts all traffic end-to-end, protecting you even on untrusted networks.',
  },
];

export const PracticeMode: React.FC = () => {
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const scenario = PRACTICE_SCENARIOS[scenarioIdx % PRACTICE_SCENARIOS.length]!;

  const next = () => {
    setScenarioIdx(i => i + 1);
    setSelected(null);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
          <BookOpen className="w-4 h-4 text-violet-500" />
          Practice Scenario
        </h3>
        <span className="text-[10px] text-slate-400">
          {(scenarioIdx % PRACTICE_SCENARIOS.length) + 1}/{PRACTICE_SCENARIOS.length}
        </span>
      </div>
      <p className="text-sm text-slate-700">{scenario.question}</p>
      <div className="space-y-2">
        {scenario.options.map((opt, i) => {
          let style = 'border-slate-200 text-slate-700 hover:border-slate-300';
          if (selected !== null) {
            if (i === scenario.correctIndex) style = 'border-emerald-400 bg-emerald-50 text-emerald-800';
            else if (i === selected) style = 'border-red-400 bg-red-50 text-red-700';
            else style = 'border-slate-100 text-slate-400';
          }
          return (
            <button
              key={i}
              disabled={selected !== null}
              onClick={() => setSelected(i)}
              className={`w-full text-left px-3 py-2 rounded-lg border text-sm transition-colors ${style}`}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {selected !== null && (
        <div className="mt-2 p-3 bg-slate-50 rounded-lg text-xs text-slate-600">
          {scenario.explanation}
        </div>
      )}
      {selected !== null && (
        <button
          onClick={next}
          className="w-full mt-1 py-2 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition-colors"
        >
          Next Scenario →
        </button>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SHD-15  SourceCredibility
// ─────────────────────────────────────────────────────────────────────────────
interface SourceCredibilityProps {
  sources: ThreatRAGSource[];
}

const SOURCE_TYPE_ICONS: Record<ThreatRAGSource['type'], React.ReactNode> = {
  cve_db: <Database className="w-3 h-3" />,
  threat_feed: <Wifi className="w-3 h-3" />,
  advisory: <FileText className="w-3 h-3" />,
  news: <BookOpen className="w-3 h-3" />,
  research: <Info className="w-3 h-3" />,
  health_advisory: <Activity className="w-3 h-3" />,
};

export const SourceCredibility: React.FC<SourceCredibilityProps> = ({ sources }) => (
  <div className="space-y-2">
    {sources.map((src, i) => (
      <div key={i} className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
            <span className="text-slate-400">{SOURCE_TYPE_ICONS[src.type]}</span>
            {src.url ? (
              <a
                href={src.url}
                target="_blank"
                rel="noreferrer"
                className="hover:underline flex items-center gap-0.5"
              >
                {src.name}
                <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
              </a>
            ) : (
              src.name
            )}
          </div>
          <span className="text-[10px] text-slate-400 capitalize">{src.type.replace('_', ' ')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full"
              style={{ width: `${Math.round(src.relevanceScore * 100)}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            {Math.round(src.relevanceScore * 100)}%
          </span>
        </div>
      </div>
    ))}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// SHD-16  ThreatTimeline
// ─────────────────────────────────────────────────────────────────────────────
interface ThreatTimelineProps {
  entries: ThreatIntelligenceEntry[];
  maxItems?: number;
}

const TIMELINE_DOT: Record<ThreatSeverity, string> = {
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-amber-400',
  low: 'bg-slate-400',
  info: 'bg-blue-400',
};

export const ThreatTimeline: React.FC<ThreatTimelineProps> = ({ entries, maxItems = 8 }) => {
  const sorted = [...entries]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, maxItems);

  if (sorted.length === 0)
    return <p className="text-xs text-slate-400">No timeline entries.</p>;

  return (
    <div className="relative pl-5 space-y-4">
      {/* Vertical line */}
      <div className="absolute left-2 top-2 bottom-2 w-px bg-slate-200" />
      {sorted.map(entry => (
        <div key={entry.id} className="relative flex gap-3 items-start">
          <div
            className={`absolute -left-3 top-1.5 w-2.5 h-2.5 rounded-full border-2 border-white ${TIMELINE_DOT[entry.severity]}`}
          />
          <div className="min-w-0">
            <div className="text-xs font-medium text-slate-800 leading-snug">{entry.title}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {new Date(entry.timestamp).toLocaleDateString()} · {entry.domain.replace('_', ' ')}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SHD-17  ThreatFreshness
// ─────────────────────────────────────────────────────────────────────────────
interface ThreatFreshnessProps {
  entry: ThreatIntelligenceEntry;
}

export const ThreatFreshness: React.FC<ThreatFreshnessProps> = ({ entry }) => {
  const ageHours = (Date.now() - new Date(entry.timestamp).getTime()) / 3_600_000;
  const stale = ageHours > entry.ttl;

  return stale ? (
    <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 font-medium">
      <AlertTriangle className="w-3 h-3" />
      Stale
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
      <span className="text-emerald-500">●</span>
      Fresh
    </span>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SHD-18  ShieldClearState
// ─────────────────────────────────────────────────────────────────────────────
export const ShieldClearState: React.FC = () => (
  <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
    <div className="text-5xl select-none">🛡️</div>
    <h3 className="text-base font-semibold text-emerald-700">All Clear</h3>
    <p className="text-sm text-slate-500 max-w-xs">
      No active threats detected. ECHO Sentinel is monitoring your digital environment.
    </p>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// SHD-19  exportAlert
// ─────────────────────────────────────────────────────────────────────────────
export async function exportAlert(alert: CivicRadarAlert): Promise<void> {
  const md = [
    `# ${alert.title}`,
    `**Severity:** ${alert.severity}  **Category:** ${alert.category}`,
    `**Timestamp:** ${alert.timestamp}`,
    '',
    `## Summary`,
    alert.summary,
    '',
    `## Impact`,
    alert.impact,
    '',
    alert.actions.length > 0
      ? `## Actions\n${alert.actions.map(a => `- [${a.text}](${a.url ?? '#'})`).join('\n')}`
      : '',
    '',
    alert.sources.length > 0
      ? `## Sources\n${alert.sources.map(s => `- [${s.name}](${s.url})`).join('\n')}`
      : '',
  ]
    .filter(Boolean)
    .join('\n');

  await navigator.clipboard.writeText(md);
}

// ─────────────────────────────────────────────────────────────────────────────
// SHD-20  ShieldSkeleton
// ─────────────────────────────────────────────────────────────────────────────
export const ShieldSkeleton: React.FC = () => (
  <div className="animate-pulse space-y-4 p-4">
    {/* Ring placeholder */}
    <div className="flex justify-center">
      <div className="w-20 h-20 rounded-full bg-slate-200" />
    </div>
    {/* List items */}
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="space-y-2">
        <div className="h-3 bg-slate-200 rounded w-3/4" />
        <div className="h-2 bg-slate-100 rounded w-1/2" />
      </div>
    ))}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Re-export helpers used in CitizenShieldLab
// ─────────────────────────────────────────────────────────────────────────────
export { DOMAIN_COLORS as THREAT_DOMAIN_COLORS };
