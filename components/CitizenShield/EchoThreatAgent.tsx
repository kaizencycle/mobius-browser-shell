import React, { useState, useEffect, useCallback } from 'react';
import {
  ThreatIntelligenceFeed,
  EchoAgentState,
  EchoAgentStatus,
  ThreatDomain,
} from '../../types';
import { echoAgent } from '../../services/EchoThreatIntelligence';
import {
  Radio,
  Activity,
  Shield,
  Clock,
  Zap,
  RefreshCw,
  Wifi,
  WifiOff,
  AlertTriangle,
  CheckCircle,
  Brain,
  Server,
} from 'lucide-react';

// ============================================
// Agent Status Display
// ============================================

const getStatusColor = (status: EchoAgentStatus): string => {
  switch (status) {
    case 'scanning': return 'text-cyan-500';
    case 'processing': return 'text-amber-500';
    case 'alert': return 'text-red-500';
    case 'idle': return 'text-emerald-500';
    case 'offline': return 'text-stone-400';
    default: return 'text-stone-500';
  }
};

const getStatusBgPulse = (status: EchoAgentStatus): string => {
  switch (status) {
    case 'scanning': return 'bg-cyan-500 animate-pulse';
    case 'processing': return 'bg-amber-500 animate-pulse';
    case 'alert': return 'bg-red-500 animate-ping';
    case 'idle': return 'bg-emerald-500';
    case 'offline': return 'bg-stone-400';
    default: return 'bg-stone-400';
  }
};

const getStatusLabel = (status: EchoAgentStatus): string => {
  switch (status) {
    case 'scanning': return 'Scanning RAG sources...';
    case 'processing': return 'Processing intelligence...';
    case 'alert': return 'Active threat detected';
    case 'idle': return 'Monitoring — All clear';
    case 'offline': return 'Agent offline';
    default: return 'Unknown';
  }
};

const getDomainLabel = (domain: ThreatDomain): string => {
  switch (domain) {
    case 'cyber_threats': return 'Cyber Threats';
    case 'cyber_security': return 'Cyber Security';
    case 'digital_health': return 'Digital Health';
  }
};

const getDomainIcon = (domain: ThreatDomain): React.ReactNode => {
  const cls = 'w-3.5 h-3.5';
  switch (domain) {
    case 'cyber_threats': return <AlertTriangle className={cls} />;
    case 'cyber_security': return <Shield className={cls} />;
    case 'digital_health': return <Activity className={cls} />;
  }
};

const formatUptime = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

const formatTimeUntil = (isoString: string): string => {
  const diff = new Date(isoString).getTime() - Date.now();
  if (diff <= 0) return 'now';
  const mins = Math.ceil(diff / 60000);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
};

// ============================================
// Main ECHO Agent Component
// ============================================

interface EchoThreatAgentProps {
  onFeedUpdate?: (feed: ThreatIntelligenceFeed) => void;
  compact?: boolean;
}

export const EchoThreatAgent: React.FC<EchoThreatAgentProps> = ({
  onFeedUpdate,
  compact = false,
}) => {
  const [agentState, setAgentState] = useState<EchoAgentState | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Initialize ECHO agent
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const init = async () => {
      unsubscribe = echoAgent.subscribe((feed) => {
        setAgentState(feed.agentState);
        onFeedUpdate?.(feed);
      });

      await echoAgent.initialize();
      setAgentState(echoAgent.getAgentState());
      setInitialized(true);

      // Deliver initial feed
      onFeedUpdate?.(echoAgent.getFeed());
    };

    init();

    return () => {
      unsubscribe?.();
    };
  }, []);

  // Refresh uptime every 30s
  useEffect(() => {
    if (!initialized) return;
    const interval = setInterval(() => {
      setAgentState(echoAgent.getAgentState());
    }, 30000);
    return () => clearInterval(interval);
  }, [initialized]);

  const handleForceScan = useCallback(async () => {
    setIsScanning(true);
    try {
      const feed = await echoAgent.forceScan();
      setAgentState(feed.agentState);
      onFeedUpdate?.(feed);
    } finally {
      setIsScanning(false);
    }
  }, [onFeedUpdate]);

  // Loading
  if (!agentState) {
    return (
      <div className="flex items-center gap-2 p-4 text-slate-500">
        <Radio className="w-4 h-4 animate-pulse" />
        <span className="text-sm">Initializing ECHO agent...</span>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-3 px-3 py-2 bg-slate-900 rounded-lg text-white">
        <div className="relative">
          <Radio className={`w-4 h-4 ${getStatusColor(agentState.status)}`} />
          <div className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${getStatusBgPulse(agentState.status)}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-wider opacity-70">ECHO Agent</div>
          <div className="text-xs truncate">{getStatusLabel(agentState.status)}</div>
        </div>
        <div className="text-[10px] text-slate-400 font-mono">
          {agentState.activeThreatCount} active
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl border border-slate-700 text-white overflow-hidden">
      {/* Agent Header */}
      <div className="p-4 sm:p-5 border-b border-slate-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                <Radio className={`w-5 h-5 ${getStatusColor(agentState.status)}`} />
              </div>
              <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-slate-900 ${getStatusBgPulse(agentState.status)}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm tracking-wide">ECHO</h3>
                <span className="text-[9px] font-mono px-1.5 py-0.5 bg-cyan-500/10 text-cyan-400 rounded border border-cyan-500/20">
                  SENTINEL
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Threat Intelligence Agent • RAG-Powered
              </p>
            </div>
          </div>

          <button
            onClick={handleForceScan}
            disabled={isScanning || agentState.status === 'scanning'}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            title="Force immediate scan"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'Scanning...' : 'Scan Now'}</span>
          </button>
        </div>

        {/* Status Bar */}
        <div className="mt-3 flex items-center gap-2 text-[10px]">
          <div className={`flex items-center gap-1 ${getStatusColor(agentState.status)}`}>
            {agentState.status === 'scanning' || agentState.status === 'processing' ? (
              <Zap className="w-3 h-3" />
            ) : agentState.status === 'idle' ? (
              <CheckCircle className="w-3 h-3" />
            ) : agentState.status === 'offline' ? (
              <WifiOff className="w-3 h-3" />
            ) : (
              <Wifi className="w-3 h-3" />
            )}
            <span className="font-medium uppercase tracking-wider">
              {getStatusLabel(agentState.status)}
            </span>
          </div>
        </div>
      </div>

      {/* Agent Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-slate-700/50">
        {/* Uptime */}
        <div className="p-3 sm:p-4 text-center">
          <div className="flex items-center justify-center gap-1 text-slate-400 mb-1">
            <Clock className="w-3 h-3" />
            <span className="text-[9px] uppercase tracking-wider font-semibold">Uptime</span>
          </div>
          <div className="font-mono text-sm font-bold text-emerald-400">
            {formatUptime(agentState.uptime)}
          </div>
        </div>

        {/* Scans Completed */}
        <div className="p-3 sm:p-4 text-center">
          <div className="flex items-center justify-center gap-1 text-slate-400 mb-1">
            <Brain className="w-3 h-3" />
            <span className="text-[9px] uppercase tracking-wider font-semibold">Scans</span>
          </div>
          <div className="font-mono text-sm font-bold text-cyan-400">
            {agentState.totalScansCompleted}
          </div>
        </div>

        {/* Threats Found */}
        <div className="p-3 sm:p-4 text-center">
          <div className="flex items-center justify-center gap-1 text-slate-400 mb-1">
            <AlertTriangle className="w-3 h-3" />
            <span className="text-[9px] uppercase tracking-wider font-semibold">Threats</span>
          </div>
          <div className={`font-mono text-sm font-bold ${agentState.activeThreatCount > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
            {agentState.activeThreatCount}
          </div>
        </div>

        {/* Next Scan */}
        <div className="p-3 sm:p-4 text-center">
          <div className="flex items-center justify-center gap-1 text-slate-400 mb-1">
            <Server className="w-3 h-3" />
            <span className="text-[9px] uppercase tracking-wider font-semibold">Next Scan</span>
          </div>
          <div className="font-mono text-sm font-bold text-amber-400">
            {formatTimeUntil(agentState.nextScanAt)}
          </div>
        </div>
      </div>

      {/* Domain Coverage */}
      <div className="px-4 sm:px-5 py-3 border-t border-slate-700/50">
        <div className="text-[9px] uppercase tracking-wider font-semibold text-slate-400 mb-2">
          Domain Coverage
        </div>
        <div className="space-y-2">
          {(Object.entries(agentState.domainCoverage) as [ThreatDomain, EchoAgentState['domainCoverage'][ThreatDomain]][]).map(([domain, coverage]) => (
            <div key={domain} className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 w-28 sm:w-32 text-xs text-slate-300">
                {getDomainIcon(domain)}
                <span className="truncate">{getDomainLabel(domain)}</span>
              </div>
              <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    coverage.healthScore >= 0.8
                      ? 'bg-emerald-500'
                      : coverage.healthScore >= 0.5
                      ? 'bg-amber-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${coverage.healthScore * 100}%` }}
                />
              </div>
              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono w-20 justify-end">
                <span>{coverage.threatCount} found</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cron Schedule Info */}
      <div className="px-4 sm:px-5 py-2.5 bg-slate-800/50 border-t border-slate-700/30">
        <div className="flex items-center justify-between text-[10px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <Activity className="w-3 h-3" />
            <span>Cron: <span className="font-mono text-slate-400">{agentState.cronSchedule}</span></span>
          </div>
          <div className="flex items-center gap-1.5">
            <Shield className="w-3 h-3" />
            <span>Integrity: <span className="font-mono text-emerald-400">{agentState.integrity.toFixed(2)}</span></span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EchoThreatAgent;
