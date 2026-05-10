import React, { useEffect, useMemo, useRef } from 'react';
import {
  Activity,
  AlertTriangle,
  ExternalLink,
  Gauge,
  HeartPulse,
  Lock,
  Radio,
  Shield,
  ShieldAlert,
  Signal,
  Wifi,
} from 'lucide-react';
import { env } from '../../config/env';
import { useTerminal } from '../../contexts/TerminalContext';
import {
  computeDigitalHygieneScore,
  isCyberRelevantSignal,
  shieldSeverityFromSignal,
  type TerminalSignal,
} from '../../src/lib/terminal-bridge';
import { TerminalHeartbeat } from '../TerminalHeartbeat';

const TERMINAL_BASE = env.terminalOrigin.replace(/\/+$/, '');
const TERMINAL_SIGNALS_URL = `${TERMINAL_BASE}/signals`;
const TERMINAL_APP = `${TERMINAL_BASE}/terminal`;

function severityChip(sev: string): string {
  switch (sev) {
    case 'critical':
      return 'bg-red-500/10 text-red-700 border-red-500/30';
    case 'high':
      return 'bg-orange-500/10 text-orange-700 border-orange-500/30';
    case 'medium':
      return 'bg-amber-500/10 text-amber-700 border-amber-500/30';
    case 'low':
      return 'bg-blue-500/10 text-blue-700 border-blue-500/30';
    default:
      return 'bg-stone-500/10 text-stone-700 border-stone-500/30';
  }
}

function hygieneTone(score: number): {
  label: string;
  tone: string;
  bar: string;
  icon: React.ReactNode;
} {
  if (score >= 0.85)
    return {
      label: 'Excellent',
      tone: 'text-emerald-600',
      bar: 'bg-emerald-500',
      icon: <Shield className="w-4 h-4" />,
    };
  if (score >= 0.65)
    return {
      label: 'Healthy',
      tone: 'text-teal-600',
      bar: 'bg-teal-500',
      icon: <Shield className="w-4 h-4" />,
    };
  if (score >= 0.45)
    return {
      label: 'Watchful',
      tone: 'text-amber-600',
      bar: 'bg-amber-500',
      icon: <AlertTriangle className="w-4 h-4" />,
    };
  return {
    label: 'At Risk',
    tone: 'text-red-600',
    bar: 'bg-red-500',
    icon: <ShieldAlert className="w-4 h-4" />,
  };
}

function modeBadge(mode: string, stale: boolean): { cls: string; label: string } {
  if (stale) {
    return {
      cls: 'bg-stone-200 text-stone-700 border-stone-300',
      label: 'Cached',
    };
  }
  switch (mode) {
    case 'green':
      return { cls: 'bg-emerald-100 text-emerald-800 border-emerald-200', label: 'Green' };
    case 'red':
      return { cls: 'bg-rose-100 text-rose-800 border-rose-200', label: 'Red' };
    default:
      return { cls: 'bg-amber-100 text-amber-900 border-amber-200', label: 'Yellow' };
  }
}

function sourceBadge(source: 'lite' | 'full' | 'cache'): { cls: string; label: string } {
  switch (source) {
    case 'lite':
      return { cls: 'bg-sky-100 text-sky-900 border-sky-200', label: 'Lite' };
    case 'full':
      return { cls: 'bg-violet-100 text-violet-900 border-violet-200', label: 'Full' };
    default:
      return { cls: 'bg-stone-200 text-stone-700 border-stone-300', label: 'Cache' };
  }
}

function useForwardCriticalAnomalies(
  signals: TerminalSignal[],
  tripwireElevated: boolean,
): void {
  const seenRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const critical = signals.filter(
      (s) => s.severity === 'alert' || s.severity === 'critical',
    );
    const events = critical.map((s) => ({
      key: `${s.agentName}|${s.source}|${s.label}`,
      signal: s,
    }));
    if (tripwireElevated) {
      events.push({
        key: 'tripwire|elevated',
        signal: {
          agentName: 'ATLAS',
          source: 'terminal.tripwire',
          value: 1,
          label: 'Tripwire elevated',
          severity: 'alert',
        },
      });
    }

    const fresh = events.filter((e) => !seenRef.current.has(e.key));
    if (fresh.length === 0) return;

    fresh.forEach((e) => seenRef.current.add(e.key));
    fresh.forEach(({ signal }) => {
      try {
        fetch('/api/atlas/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          keepalive: true,
          body: JSON.stringify({
            type: 'SHIELD_TERMINAL_ANOMALY',
            severity: shieldSeverityFromSignal(signal.severity),
            source: signal.source,
            agent: signal.agentName,
            label: signal.label,
            value: signal.value,
            timestamp: new Date().toISOString(),
          }),
        }).catch(() => {});
      } catch {
        // best-effort
      }
    });
  }, [signals, tripwireElevated]);
}

export const ShieldTerminalPanel: React.FC = () => {
  const { state, isInitialLoading, refresh, sinceSyncMs } = useTerminal();

  const hygiene = computeDigitalHygieneScore(state);
  const hygieneTier = hygieneTone(hygiene);

  const cyberSignals = useMemo(() => {
    if (!state) return [] as TerminalSignal[];
    return state.signals.all
      .filter(isCyberRelevantSignal)
      .filter((s) => s.severity !== 'nominal' || s.value < 0.5)
      .sort((a, b) => {
        const order = { critical: 0, alert: 1, watch: 2, nominal: 3 } as const;
        return order[a.severity] - order[b.severity];
      })
      .slice(0, 6);
  }, [state]);

  useForwardCriticalAnomalies(
    state?.signals.all ?? [],
    !!state?.tripwire.elevated,
  );

  const alertCount =
    (state?.signals.anomalies ?? 0) + (state?.tripwire.count ?? 0);
  const integritySignals = state?.integritySignals;

  const laneKeys = useMemo(() => {
    if (!state?.lanes) return [] as string[];
    return Object.keys(state.lanes).sort();
  }, [state?.lanes]);

  const ariaAnnounce =
    state === null
      ? 'Connecting to terminal…'
      : state.tripwire.elevated
        ? `Tripwire elevated. ${state.tripwire.count} active.`
        : alertCount > 0
          ? `${alertCount} active terminal alerts.`
          : 'Terminal posture nominal.';

  const mode = state ? modeBadge(state.mode, state.stale) : null;
  const src = state ? sourceBadge(state.source) : null;

  return (
    <section
      aria-labelledby="shield-terminal-heading"
      className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
    >
      <header className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3 min-w-0">
          <div className="p-2.5 bg-slate-900 text-emerald-400 rounded-lg shrink-0">
            <HeartPulse className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2
                id="shield-terminal-heading"
                className="text-sm sm:text-base font-bold text-slate-900 tracking-tight"
              >
                Terminal bridge
              </h2>
              {state && mode && (
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${mode.cls}`}
                >
                  {mode.label}
                </span>
              )}
              {state && src && (
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${src.cls}`}
                >
                  {src.label}
                </span>
              )}
              {state?.degraded && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border border-amber-300 bg-amber-50 text-amber-900">
                  Degraded
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Live telemetry from{' '}
              <span className="font-mono text-slate-600">mobius-civic-ai-terminal</span>
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <TerminalHeartbeat compact />
          <a
            href={TERMINAL_APP}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-indigo-700 border border-indigo-200 rounded-md hover:bg-indigo-50"
          >
            Open Terminal
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            type="button"
            onClick={() => void refresh()}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 border border-slate-200 rounded-md hover:bg-slate-50"
            title="Pull full snapshot now"
          >
            <Activity className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      </header>

      <span className="sr-only" aria-live="polite">
        {ariaAnnounce}
      </span>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 p-4 sm:p-5">
        {/* Hygiene */}
        <div className="lg:col-span-4 bg-slate-50 rounded-lg p-4 border border-slate-100">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
              <Gauge className="w-3.5 h-3.5" />
              Digital hygiene
            </div>
            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold ${hygieneTier.tone}`}>
              {hygieneTier.icon}
              {hygieneTier.label}
            </span>
          </div>
          <div className={`mt-3 text-3xl font-mono font-bold tabular-nums ${hygieneTier.tone}`}>
            {(hygiene * 100).toFixed(0)}
            <span className="text-base text-slate-400 font-normal">/100</span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-slate-200 overflow-hidden">
            <div
              className={`h-full ${hygieneTier.bar} transition-all duration-300`}
              style={{ width: `${Math.max(4, hygiene * 100)}%` }}
            />
          </div>
          <dl className="mt-3 space-y-1.5 text-[11px] text-slate-600">
            <div className="flex items-center justify-between gap-2">
              <dt className="flex items-center gap-1.5 text-slate-500">
                <Wifi className="w-3 h-3" />
                Information
              </dt>
              <dd className="font-mono text-slate-800">
                {(integritySignals?.information ?? 0).toFixed(2)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="flex items-center gap-1.5 text-slate-500">
                <Activity className="w-3 h-3" />
                System
              </dt>
              <dd className="font-mono text-slate-800">
                {(integritySignals?.system ?? 0).toFixed(2)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="flex items-center gap-1.5 text-slate-500">
                <Lock className="w-3 h-3" />
                Stability
              </dt>
              <dd className="font-mono text-slate-800">
                {(integritySignals?.stability ?? 0).toFixed(2)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="flex items-center gap-1.5 text-slate-500">
                <Signal className="w-3 h-3" />
                Freshness
              </dt>
              <dd className="font-mono text-slate-800">
                {(integritySignals?.freshness ?? 0).toFixed(2)}
              </dd>
            </div>
          </dl>
        </div>

        {/* Tripwire + GI */}
        <div className="lg:col-span-4 bg-slate-50 rounded-lg p-4 border border-slate-100 flex flex-col">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
              <ShieldAlert className="w-3.5 h-3.5" />
              Civic tripwire
            </div>
            {state?.tripwire.elevated ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-red-800 bg-red-100 border border-red-200 px-2 py-0.5 rounded-full">
                <AlertTriangle className="w-3 h-3" />
                Elevated
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase text-emerald-800 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full">
                Clear
              </span>
            )}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400">Global integrity</div>
              <div className="text-2xl font-mono font-bold text-slate-900 tabular-nums">
                {state ? state.gi.toFixed(2) : '—'}
              </div>
              {state && (
                <div className="mt-1 flex flex-wrap gap-1">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600">
                    {state.cycle}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600">
                    {state.terminalStatus}
                  </span>
                </div>
              )}
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400">Anomaly index</div>
              <div className="text-2xl font-mono font-bold text-slate-900 tabular-nums">
                {state ? alertCount : '—'}
              </div>
            </div>
          </div>
          <p className="mt-3 text-[11px] text-slate-600 leading-relaxed flex-1">
            {state?.terminalStatus === 'stressed' ? (
              <>
                Terminal reports <span className="text-amber-800 font-semibold">stressed</span> posture.
              </>
            ) : state?.degraded ? (
              <>Lanes may be cached; values remain conservative for hygiene scoring.</>
            ) : state ? (
              <>Posture nominal. Signals lane composite {(state.signals.composite * 100).toFixed(0)}%.</>
            ) : isInitialLoading ? (
              <>Pulling full snapshot…</>
            ) : (
              <>No telemetry yet — check network or open the Terminal.</>
            )}
          </p>
          <div className="mt-auto pt-3 flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
            <span>
              Synced {sinceSyncMs === null ? '—' : `${Math.round(sinceSyncMs / 1000)}s ago`}
            </span>
            {state?.timestamp && (
              <span className="font-mono text-slate-400 truncate max-w-full" title={state.timestamp}>
                payload {new Date(state.timestamp).toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        {/* Cyber signals */}
        <div className="lg:col-span-4 bg-slate-50 rounded-lg p-4 border border-slate-100 flex flex-col">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
              <Radio className="w-3.5 h-3.5" />
              Live signals
            </div>
            <a
              href={TERMINAL_SIGNALS_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[10px] text-indigo-600 hover:text-indigo-800 font-medium"
            >
              View all
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <ul className="mt-3 space-y-2 text-[11px] flex-1 min-h-[120px]">
            {cyberSignals.length === 0 ? (
              <li className="text-slate-400">
                {state ? 'No cyber-scoped anomalies in this sweep.' : 'Awaiting terminal…'}
              </li>
            ) : (
              cyberSignals.map((sig) => {
                const shieldSev = shieldSeverityFromSignal(sig.severity);
                return (
                  <li
                    key={`${sig.agentName}-${sig.source}-${sig.label}`}
                    className="flex items-start gap-2"
                  >
                    <span
                      className={`mt-0.5 inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border ${severityChip(shieldSev)}`}
                    >
                      {shieldSev}
                    </span>
                    <div className="min-w-0">
                      <div className="text-slate-800 truncate font-medium" title={sig.label}>
                        {sig.label}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">
                        {sig.agentName} · {sig.source}
                      </div>
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        </div>

        {/* Lane matrix */}
        <div className="lg:col-span-12 border-t border-slate-100 pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
              Lanes
            </span>
            {state && (
              <span className="text-[10px] text-slate-400 font-mono">
                pulse {(state.pulse.composite * 100).toFixed(0)}% · echo MII {state.echo.avgMii.toFixed(2)}
              </span>
            )}
          </div>
          {laneKeys.length === 0 ? (
            <p className="text-xs text-slate-400">No lane summary in this snapshot.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {laneKeys.map((key) => {
                const lane = state!.lanes[key]!;
                const ok = lane.ok;
                return (
                  <span
                    key={key}
                    title={lane.message || `${key} lane`}
                    className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-mono border ${
                      ok
                        ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                        : 'bg-amber-50 text-amber-900 border-amber-200'
                    }`}
                  >
                    <span className="uppercase tracking-tight">{key}</span>
                    <span className="opacity-70">{lane.state}</span>
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default ShieldTerminalPanel;
