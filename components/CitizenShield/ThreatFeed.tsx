import React, { useState } from 'react';
import {
  ThreatIntelligenceEntry,
  ThreatIntelligenceFeed,
  ThreatDomain,
  ThreatSeverity,
} from '../../types';
import {
  AlertTriangle,
  Shield,
  Activity,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  Clock,
  BookOpen,
  Database,
  Tag,
  Crosshair,
  Heart,
  Fingerprint,
  Flag,
} from 'lucide-react';
import { GuestLock } from '../GuestMode/GuestLock';

// ============================================
// Helpers
// ============================================

const getSeverityConfig = (severity: ThreatSeverity) => {
  switch (severity) {
    case 'critical':
      return { bg: 'bg-red-50', border: 'border-red-500', text: 'text-red-800', badge: 'bg-red-500 text-white', label: 'CRITICAL' };
    case 'high':
      return { bg: 'bg-orange-50', border: 'border-orange-500', text: 'text-orange-800', badge: 'bg-orange-500 text-white', label: 'HIGH' };
    case 'medium':
      return { bg: 'bg-amber-50', border: 'border-amber-500', text: 'text-amber-800', badge: 'bg-amber-500 text-white', label: 'MEDIUM' };
    case 'low':
      return { bg: 'bg-blue-50', border: 'border-blue-500', text: 'text-blue-800', badge: 'bg-blue-500 text-white', label: 'LOW' };
    case 'info':
      return { bg: 'bg-slate-50', border: 'border-slate-400', text: 'text-slate-700', badge: 'bg-slate-500 text-white', label: 'INFO' };
  }
};

const getDomainConfig = (domain: ThreatDomain) => {
  switch (domain) {
    case 'cyber_threats':
      return { icon: <Crosshair className="w-3.5 h-3.5" />, label: 'Cyber Threats', color: 'text-red-600 bg-red-50' };
    case 'cyber_security':
      return { icon: <Fingerprint className="w-3.5 h-3.5" />, label: 'Cyber Security', color: 'text-purple-600 bg-purple-50' };
    case 'digital_health':
      return { icon: <Heart className="w-3.5 h-3.5" />, label: 'Digital Health', color: 'text-emerald-600 bg-emerald-50' };
  }
};

const formatTimeAgo = (timestamp: string): string => {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays}d ago`;
};

const getSourceIcon = (type: string) => {
  const cls = 'w-3 h-3';
  switch (type) {
    case 'cve_db': return <Database className={cls} />;
    case 'threat_feed': return <Activity className={cls} />;
    case 'advisory': return <Shield className={cls} />;
    case 'news': return <BookOpen className={cls} />;
    case 'research': return <Search className={cls} />;
    case 'health_advisory': return <Heart className={cls} />;
    default: return <Database className={cls} />;
  }
};

// ============================================
// Single Threat Entry Card
// ============================================

interface ThreatCardProps {
  entry: ThreatIntelligenceEntry;
}

const ThreatCard: React.FC<ThreatCardProps> = ({ entry }) => {
  const [expanded, setExpanded] = useState(false);
  const severity = getSeverityConfig(entry.severity);
  const domain = getDomainConfig(entry.domain);

  return (
    <div className={`${severity.bg} border-l-4 ${severity.border} rounded-lg overflow-hidden transition-all duration-200`}>
      <div className="p-4">
        {/* Top Row: Severity + Domain + Time */}
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider ${severity.badge}`}>
            {severity.label}
          </span>
          <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${domain.color}`}>
            {domain.icon}
            {domain.label}
          </span>
          <span className="flex items-center gap-1 text-[10px] text-slate-400">
            <Clock className="w-3 h-3" />
            {formatTimeAgo(entry.timestamp)}
          </span>
          {entry.echoConfidence >= 0.9 && (
            <span className="px-1.5 py-0.5 bg-cyan-100 text-cyan-700 rounded text-[9px] font-semibold">
              {Math.round(entry.echoConfidence * 100)}% confidence
            </span>
          )}
        </div>

        {/* Title */}
        <h4 className={`font-semibold text-sm ${severity.text} mb-1.5`}>{entry.title}</h4>

        {/* Summary */}
        <p className="text-xs leading-relaxed text-slate-600 mb-3">{entry.summary}</p>

        {/* Recommendations (top 2 visible, rest in expand) */}
        <div className="space-y-1.5 mb-2">
          {entry.recommendations.slice(0, expanded ? undefined : 2).map((rec, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2 px-3 py-2 bg-white/70 rounded text-xs text-slate-700"
            >
              <span className="text-emerald-500 font-bold mt-0.5">→</span>
              <span>{rec}</span>
            </div>
          ))}
        </div>

        {/* Expanded Details */}
        {expanded && (
          <div className="mt-3 space-y-3">
            {/* Details */}
            <div className="p-3 bg-black/5 rounded text-xs leading-relaxed text-slate-600">
              <div className="font-semibold text-slate-700 mb-1">Details</div>
              {entry.details}
            </div>

            {/* Indicators */}
            {entry.indicators.length > 0 && (
              <div>
                <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  <Tag className="w-3 h-3" />
                  Indicators
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {entry.indicators.map((indicator, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-white/80 border border-slate-200 rounded text-[10px] font-mono text-slate-600">
                      {indicator}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* RAG Sources */}
            {entry.ragSources.length > 0 && (
              <div>
                <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  <Database className="w-3 h-3" />
                  RAG Intelligence Sources
                </div>
                <div className="space-y-1">
                  {entry.ragSources.map((source, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-[10px] text-slate-500">
                      {getSourceIcon(source.type)}
                      {source.url ? (
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline hover:text-slate-700 flex items-center gap-1"
                        >
                          {source.name}
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      ) : (
                        <span>{source.name}</span>
                      )}
                      <span className="font-mono text-[9px] text-slate-400">
                        relevance: {(source.relevanceScore * 100).toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            <div className="flex flex-wrap gap-1 pt-1">
              {entry.tags.map((tag, idx) => (
                <span key={idx} className="px-1.5 py-0.5 bg-slate-200/60 text-slate-500 rounded text-[9px]">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Actions Row */}
        <div className="mt-2 flex items-center gap-2">
          <GuestLock action="flag_threat">
            <button
              onClick={() => {}}
              className="flex items-center gap-1 text-[10px] font-medium text-slate-600 hover:text-slate-800 transition-colors"
            >
              <Flag className="w-3 h-3" />
              Flag threat
            </button>
          </GuestLock>
          <button
            onClick={() => setExpanded(!expanded)}
            className={`flex items-center gap-1 text-[10px] font-medium ${severity.text} opacity-60 hover:opacity-100 transition-opacity`}
          >
            {expanded ? (
              <>
                <ChevronUp className="w-3 h-3" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3" />
                Show details & {entry.recommendations.length - 2 > 0 ? `${entry.recommendations.length - 2} more actions` : 'sources'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// Domain Summary Stats
// ============================================

interface DomainStatsProps {
  feed: ThreatIntelligenceFeed;
}

const DomainStats: React.FC<DomainStatsProps> = ({ feed }) => {
  const domains: ThreatDomain[] = ['cyber_threats', 'cyber_security', 'digital_health'];

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3">
      {domains.map((domain) => {
        const config = getDomainConfig(domain);
        const count = feed.metadata.domainBreakdown[domain] || 0;

        return (
          <div key={domain} className="bg-white rounded-lg border border-slate-200 p-3 text-center">
            <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${config.color} mb-1.5`}>
              {config.icon}
            </div>
            <div className="font-mono text-lg font-bold text-slate-800">{count}</div>
            <div className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">{config.label}</div>
          </div>
        );
      })}
    </div>
  );
};

// ============================================
// Main Threat Feed Component
// ============================================

type FilterDomain = ThreatDomain | 'all';
type FilterSeverity = ThreatSeverity | 'all';

interface ThreatFeedProps {
  feed: ThreatIntelligenceFeed | null;
  maxEntries?: number;
}

export const ThreatFeed: React.FC<ThreatFeedProps> = ({
  feed,
  maxEntries = 10,
}) => {
  const [domainFilter, setDomainFilter] = useState<FilterDomain>('all');
  const [severityFilter, setSeverityFilter] = useState<FilterSeverity>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  if (!feed || feed.entries.length === 0) {
    return (
      <div className="p-6 text-center">
        <Shield className="w-10 h-10 mx-auto text-emerald-500 mb-2" />
        <p className="text-sm text-slate-700 font-medium">No threats detected</p>
        <p className="text-xs text-slate-500 mt-1">
          ECHO is actively monitoring. All domains are clear.
        </p>
      </div>
    );
  }

  // Apply filters
  let filtered = [...feed.entries];

  if (domainFilter !== 'all') {
    filtered = filtered.filter(e => e.domain === domainFilter);
  }
  if (severityFilter !== 'all') {
    filtered = filtered.filter(e => e.severity === severityFilter);
  }
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(e =>
      e.title.toLowerCase().includes(q) ||
      e.summary.toLowerCase().includes(q) ||
      e.tags.some(t => t.toLowerCase().includes(q)) ||
      e.indicators.some(i => i.toLowerCase().includes(q))
    );
  }

  const displayed = filtered.slice(0, maxEntries);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <h3 className="font-semibold text-slate-800 text-sm">Threat Intelligence Feed</h3>
          {feed.metadata.criticalCount > 0 && (
            <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] font-semibold rounded-full animate-pulse">
              {feed.metadata.criticalCount} critical
            </span>
          )}
          {feed.metadata.highCount > 0 && (
            <span className="px-2 py-0.5 bg-orange-500 text-white text-[10px] font-semibold rounded-full">
              {feed.metadata.highCount} high
            </span>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-1 px-2 py-1 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
        >
          <Filter className="w-3.5 h-3.5" />
          <span>Filter</span>
        </button>
      </div>

      {/* Domain Stats */}
      <DomainStats feed={feed} />

      {/* Filters Panel */}
      {showFilters && (
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search threats, CVEs, tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
            />
          </div>

          {/* Domain Filter */}
          <div className="flex flex-wrap gap-1.5">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider self-center mr-1">Domain:</span>
            {(['all', 'cyber_threats', 'cyber_security', 'digital_health'] as FilterDomain[]).map((d) => (
              <button
                key={d}
                onClick={() => setDomainFilter(d)}
                className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                  domainFilter === d
                    ? 'bg-cyan-100 text-cyan-700 border border-cyan-300'
                    : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {d === 'all' ? 'All' : getDomainConfig(d).label}
              </button>
            ))}
          </div>

          {/* Severity Filter */}
          <div className="flex flex-wrap gap-1.5">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider self-center mr-1">Severity:</span>
            {(['all', 'critical', 'high', 'medium', 'low', 'info'] as FilterSeverity[]).map((s) => (
              <button
                key={s}
                onClick={() => setSeverityFilter(s)}
                className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                  severityFilter === s
                    ? 'bg-cyan-100 text-cyan-700 border border-cyan-300'
                    : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results Count */}
      <p className="text-xs text-slate-500 px-1">
        {filtered.length} intelligence entr{filtered.length !== 1 ? 'ies' : 'y'}
        {domainFilter !== 'all' || severityFilter !== 'all' || searchQuery ? ' (filtered)' : ''} from ECHO RAG scan
      </p>

      {/* Threat List */}
      <div className="space-y-3">
        {displayed.map((entry) => (
          <ThreatCard key={entry.id} entry={entry} />
        ))}
      </div>

      {/* Show More Indicator */}
      {filtered.length > maxEntries && (
        <div className="text-center text-xs text-slate-400 pt-2">
          Showing {maxEntries} of {filtered.length} entries
        </div>
      )}

      {/* Footer */}
      <div className="text-[10px] text-slate-400 text-center pt-2 border-t border-slate-100">
        Powered by ECHO Sentinel • RAG intelligence across {Object.keys(feed.metadata.domainBreakdown).length} domains • Updated {formatTimeAgo(feed.metadata.lastUpdated)}
      </div>
    </div>
  );
};

export default ThreatFeed;
