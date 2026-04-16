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
import { useTerminal } from '../../contexts/TerminalContext';
import {
  computeDigitalHygieneScore,
  isCyberRelevantSignal,
  shieldSeverityFromSignal,
  type TerminalSignal,
} from '../../src/lib/terminal-bridge';
import { TerminalHeartbeat } from '../TerminalHeartbeat';

const TERMINAL_SIGNALS_URL =
  'https://mobius-civic-ai-terminal.vercel.app/signals';

/**
 * ShieldTerminalPanel — live security/hygiene read-out fed by the terminal.
 *
 * This panel is the bridge between the Mobius Civic AI Terminal and the
 * Citizen Shield surface. It does three things:
 *
 *   1. Presents the Digital Hygiene score, computed from terminal integrity
 *      signals plus local page posture (HTTPS, cookies, WebAuthn API
 *      availability). The score is conservative — missing terminal telemetry
 *      never *raises* hygiene.
 *   2. Surfaces the Tripwire and cyber-relevant signal anomalies from the
 *      terminal's signals lane as Shield alerts.
 *   3. Forwards any critical terminal anomaly to ATLAS via /api/atlas/events
 *      so the sentinel grid sees what the citizen sees.
 *
 * Render budget: the panel must remain readable in offline / stale modes —
 * when the terminal is degraded we fall back to cached values rather than
 * blanking out, mirroring the bridge's SWR policy.
 */

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
  icon: React.ReactNode;
} {
  if (score >= 0.85)
    return {
      label: 'Excellent',
      tone: 'text-emerald-600',
      icon: <Shield className="w-4 h-4" />,
    };
  if (score >= 0.65)
    return {
      label: 'Healthy',
      tone: 'text-teal-600',
      icon: <Shield className="w-4 h-4" />,
    };
  if (score >= 0.45)
    return {
      label: 'Watchful',
      tone: 'text-amber-600',
      icon: <AlertTriangle className="w-4 h-4" />,
    };
  return {
    label: 'At Risk',
    tone: 'text-red-600',
    icon: <ShieldAlert className="w-4 h-4" />,
  };
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
        // Swallow — ATLAS forwarding is best-effort; Shield stays usable even
        // if the atlas endpoint is offline or the CSP blocks the request.
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

  // Accessible announcement string for SR users when alert posture changes.
  const ariaAnnounce =
    state === null
      ? 'Connecting to terminal…'
      : state.tripwire.elevated
        ? `Tripwire elevated. ${state.tripwire.count} active.`
        : alertCount > 0
          ? `${alertCount} active terminal alerts.`
          : 'Terminal posture nominal.';

  return (
    <section
      aria-labelledby="shield-terminal-heading"
      className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
    >
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-900 text-emerald-400 rounded-md">
            <HeartPulse className="w-5 h-5" />
          </div>
          <div>
            <h2
              id="shield-terminal-heading"
              className="text-sm sm:text-base font-bold text-slate-900 tracking-tight"
            >
              Terminal Heartbeat
            </h2>
            <p className="text-xs text-slate-500">
              Live cyber &amp; digital-hygiene telemetry from Mobius Civic AI
              Terminal
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <TerminalHeartbeat compact />
          <button
            type="button"
            onClick={() => void refresh()}
            className="flex items-center gap-1 px-2 py-1 text-xs text-slate-600 border border-slate-200 rounded-md hover:bg-slate-50"
            title="Force refresh (full snapshot)"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Sync</span>
          </button>
        </div>
      </header>

      {/* SR-only live region for accessibility */}
      <span className="sr-only" aria-live="polite">
        {ariaAnnounce}
      </span>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 sm:p-5">
        {/* Digital Hygiene */}
        <div className="lg:col-span-1 bg-slate-50 rounded-lg p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-500 font-semibold">
              <Gauge className="w-3.5 h-3.5" />
              Digital Hygiene
            </div>
            <div
              className={`inline-flex items-center gap-1 text-[10px] font-semibold ${hygieneTier.tone}`}
            >
              {hygieneTier.icon}
              <span>{hygieneTier.label}</span>
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-3xl font-mono font-bold ${hygieneTier.tone}`}>
              {(hygiene * 100).toFixed(0)}
              <span className="text-base text-slate-400">/100</span>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-slate-200 overflow-hidden">
              <div
                className={`h-full ${
                  hygiene >= 0.65
                    ? 'bg-emerald-500'
                    : hygiene >= 0.45
                      ? 'bg-amber-500'
                      : 'bg-red-500'
                }`}
                style={{ width: `${Math.max(4, hygiene * 100)}%` }}
              />
            </div>
          </div>
          <dl className="mt-3 space-y-1 text-[11px] text-slate-600">
            <div className="flex items-center justify-between">
              <dt className="flex items-center gap-1">
                <Wifi className="w-3 h-3" /> Information
              </dt>
              <dd className="font-mono">
                {(integritySignals?.information ?? 0).toFixed(2)}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="flex items-center gap-1">
                <Activity className="w-3 h-3" /> System
              </dt>
              <dd className="font-mono">
                {(integritySignals?.system ?? 0).toFixed(2)}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="flex items-center gap-1">
                <Lock className="w-3 h-3" /> Stability
              </dt>
              <dd className="font-mono">
                {(integritySignals?.stability ?? 0).toFixed(2)}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="flex items-center gap-1">
                <Signal className="w-3 h-3" /> Freshness
              </dt>
              <dd className="font-mono">
                {(integritySignals?.freshness ?? 0).toFixed(2)}
              </dd>
            </div>
          </dl>
        </div>

        {/* Tripwire + GI chip */}
        <div className="lg:col-span-1 bg-slate-50 rounded-lg p-4 flex flex-col">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-500 font-semibold">
              <ShieldAlert className="w-3.5 h-3.5" />
              Civic Tripwire
            </div>
            {state?.tripwire.elevated ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-red-700 bg-red-100 border border-red-200 px-1.5 py-0.5 rounded">
                <AlertTriangle className="w-3 h-3" />
                Elevated
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase text-emerald-700 bg-emerald-100 border border-emerald-200 px-1.5 py-0.5 rounded">
                Clear
              </span>
            )}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400">
                Global Integrity
              </div>
              <div className="text-2xl font-mono font-bold text-slate-900">
                {state ? state.gi.toFixed(2) : '—'}
                <span className="ml-1 text-xs text-slate-400">
                  {state?.mode.toUpperCase() ?? ''}
                </span>
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400">
                Active anomalies
              </div>
              <div className="text-2xl font-mono font-bold text-slate-900">
                {state ? alertCount : '—'}
              </div>
            </div>
          </div>
          <div className="mt-3 text-[11px] text-slate-500 leading-relaxed">
            {state?.terminalStatus === 'stressed' ? (
              <>Terminal reports <span className="text-amber-700 font-semibold">stressed</span> posture. Caution when sharing non-public info.</>
            ) : state?.degraded ? (
              <>Terminal is serving cached data for one or more lanes. Shield posture remains active.</>
            ) : state ? (
              <>Terminal posture <span className="text-emerald-700 font-semibold">nominal</span>. Signal lanes healthy.</>
            ) : isInitialLoading ? (
              'Connecting to terminal telemetry…'
            ) : (
              'No terminal telemetry available. Showing local Shield posture only.'
            )}
          </div>
          <div className="mt-auto pt-3 text-[10px] text-slate-400">
            Last sync {sinceSyncMs === null ? '—' : `${Math.round(sinceSyncMs / 1000)}s ago`}
          </div>
        </div>

        {/* Cyber-relevant signals */}
        <div className="lg:col-span-1 bg-slate-50 rounded-lg p-4 flex flex-col">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-500 font-semibold">
              <Radio className="w-3.5 h-3.5" />
              Cyber Signals
            </div>
            <a
              href={TERMINAL_SIGNALS_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[10px] text-indigo-600 hover:text-indigo-800"
            >
              Signals
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <ul className="mt-3 space-y-2 text-[11px] flex-1">
            {cyberSignals.length === 0 ? (
              <li className="text-slate-400">
                {state
                  ? 'No cyber-relevant anomalies in the current sweep.'
                  : 'Awaiting first terminal sweep…'}
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
                      className={`mt-0.5 inline-flex px-1 py-0.5 rounded text-[9px] font-semibold uppercase border ${severityChip(shieldSev)}`}
                    >
                      {shieldSev}
                    </span>
                    <div className="min-w-0">
                      <div className="text-slate-800 truncate" title={sig.label}>
                        {sig.label}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {sig.agentName} · {sig.source}
                      </div>
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      </div>
    </section>
  );
};

export default ShieldTerminalPanel;
