import React, { useEffect, useRef, useState } from 'react';
import { useTerminal } from '../contexts/TerminalContext';

/**
 * Heartbeat indicator — the shell's visible "live" pulse.
 *
 * Design goals:
 *   - Pulse exactly once per successful terminal sync (tied to pulseTick,
 *     not an always-on CSS animation). That way the dot actually conveys
 *     "data just arrived" instead of decorative animation-as-liveness.
 *   - Show age-of-last-sync so operators know at a glance whether telemetry
 *     is fresh. "45s ago" reads unambiguously; a still dot reads "dead".
 *   - Honor `prefers-reduced-motion`: show a static "ok" dot instead of a
 *     flash, but keep the age label readable.
 *   - Fall into a muted/stale state after 2 min without a refresh, mirroring
 *     the bridge's SWR policy.
 */

function formatAge(ms: number | null): string {
  if (ms === null) return '—';
  if (ms < 2_000) return 'now';
  if (ms < 60_000) return `${Math.floor(ms / 1000)}s ago`;
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
  return `${Math.floor(ms / 3_600_000)}h ago`;
}

function dotColor(stale: boolean, degraded: boolean): string {
  if (stale) return 'bg-stone-400';
  if (degraded) return 'bg-amber-500';
  return 'bg-emerald-500';
}

export interface TerminalHeartbeatProps {
  /** Compact variant for the shell header. */
  compact?: boolean;
  /** Custom className passthrough. */
  className?: string;
}

export const TerminalHeartbeat: React.FC<TerminalHeartbeatProps> = ({
  compact = false,
  className = '',
}) => {
  const { state, sinceSyncMs, pulseTick, isInitialLoading } = useTerminal();
  const [flash, setFlash] = useState(false);
  const prefersReduced = useReducedMotion();
  const lastPulseRef = useRef(0);

  useEffect(() => {
    if (pulseTick === 0 || prefersReduced) return;
    if (pulseTick === lastPulseRef.current) return;
    lastPulseRef.current = pulseTick;
    setFlash(true);
    const id = setTimeout(() => setFlash(false), 700);
    return () => clearTimeout(id);
  }, [pulseTick, prefersReduced]);

  const stale = !!state?.stale;
  const degraded = !!state?.degraded;

  const dot = (
    <span className="relative inline-flex h-2 w-2" aria-hidden>
      <span
        className={`absolute inset-0 rounded-full ${dotColor(stale, degraded)} ${
          flash ? 'opacity-100' : 'opacity-80'
        }`}
      />
      {flash && !prefersReduced && (
        <span
          className={`absolute inset-0 rounded-full ${dotColor(stale, degraded)} animate-ping opacity-75`}
        />
      )}
    </span>
  );

  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-mono text-[10px] text-stone-500 ${className}`}
        aria-label={`Terminal heartbeat — ${formatAge(sinceSyncMs)}${stale ? ' (stale)' : ''}`}
        title={
          stale
            ? 'Terminal telemetry is stale — showing last-known-good.'
            : degraded
              ? 'Terminal is reporting a degraded lane.'
              : 'Terminal heartbeat healthy.'
        }
      >
        {dot}
        <span>
          {isInitialLoading && !state ? 'syncing…' : formatAge(sinceSyncMs)}
        </span>
      </span>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-md border border-stone-200 bg-white/70 px-2 py-1 font-mono text-xs text-stone-600 ${className}`}
      role="status"
      aria-live="polite"
      aria-label={`Terminal heartbeat · ${formatAge(sinceSyncMs)}${stale ? ' stale' : ''}`}
    >
      {dot}
      <span className="tracking-wide uppercase text-[9px] text-stone-500">
        Terminal
      </span>
      <span>{isInitialLoading && !state ? 'syncing…' : formatAge(sinceSyncMs)}</span>
      {state?.cycle && (
        <span className="ml-1 rounded bg-stone-100 px-1 text-[9px] text-stone-500">
          {state.cycle}
        </span>
      )}
    </div>
  );
};

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mql.matches);
    const listener = (e: MediaQueryListEvent) => setReduced(e.matches);
    mql.addEventListener('change', listener);
    return () => mql.removeEventListener('change', listener);
  }, []);
  return reduced;
}
