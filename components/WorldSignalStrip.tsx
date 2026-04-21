import React from 'react';
import { env } from '../config/env';
import type { TerminalState } from '../src/lib/terminal-bridge';

const TERMINAL_URL = `${env.terminalOrigin.replace(/\/+$/, '')}/terminal`;

function scoreTextClass(score: number): string {
  if (score >= 0.8) return 'text-emerald-600';
  if (score >= 0.65) return 'text-amber-600';
  return 'text-rose-600';
}

interface WorldSignalStripProps {
  terminalState: TerminalState | null;
}

/** Derive a light strip of domain scores from richer terminal state when the
 * legacy `sentiment.data.domains` slice is absent. */
function derivedDomainsFromIntegrity(state: TerminalState): Array<{
  key: string;
  label: string;
  score: number;
  agent: string;
}> {
  const s = state.integritySignals;
  return [
    { key: 'information', label: 'Info', score: s.information, agent: '' },
    { key: 'system', label: 'Sys', score: s.system, agent: '' },
    { key: 'stability', label: 'Stab', score: s.stability, agent: '' },
    { key: 'freshness', label: 'Fresh', score: s.freshness, agent: '' },
    { key: 'geopolitics', label: 'Geo', score: s.geopolitics, agent: '' },
    { key: 'economy', label: 'Econ', score: s.economy, agent: '' },
  ];
}

export const WorldSignalStrip: React.FC<WorldSignalStripProps> = ({
  terminalState,
}) => {
  const rawDomains = terminalState?.domains ?? [];
  const domains =
    rawDomains.length > 0
      ? rawDomains
      : terminalState
        ? derivedDomainsFromIntegrity(terminalState)
        : [];

  const mode = terminalState?.mode;
  const modeCls =
    mode === 'green'
      ? 'bg-emerald-100 text-emerald-900 border-emerald-200'
      : mode === 'red'
        ? 'bg-rose-100 text-rose-900 border-rose-200'
        : 'bg-amber-100 text-amber-950 border-amber-200';

  return (
    <div className="flex-none border-b border-stone-200/80 bg-white/90 px-3 sm:px-6 py-2">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 mb-1.5">
        {terminalState && (
          <>
            <span
              className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide border ${modeCls}`}
            >
              {terminalState.mode}
            </span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide border border-slate-200 bg-slate-100 text-slate-700">
              {terminalState.cycle}
            </span>
            <span
              className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide border ${
                terminalState.stale
                  ? 'border-stone-300 bg-stone-200 text-stone-800'
                  : 'border-sky-200 bg-sky-50 text-sky-900'
              }`}
            >
              {terminalState.stale ? 'Cached' : 'Live'}
            </span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide border border-violet-200 bg-violet-50 text-violet-900">
              {terminalState.source}
            </span>
          </>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[10px] sm:text-xs text-stone-600">
        {domains.length === 0 ? (
          <span className="text-stone-400">World signal …</span>
        ) : (
          domains.map((d, index) => {
            const score = d.score;
            const hasScore = Number.isFinite(score);
            const pct = hasScore ? (score * 100).toFixed(0) : '—';
            const colorClass = hasScore ? scoreTextClass(score) : 'text-stone-400';

            return (
              <React.Fragment key={d.key}>
                {index > 0 && (
                  <span className="text-stone-300 select-none" aria-hidden>
                    ·
                  </span>
                )}
                <span className="whitespace-nowrap">
                  <span className="text-stone-500">{d.label}</span>{' '}
                  <span className={colorClass}>{pct}</span>
                </span>
              </React.Fragment>
            );
          })
        )}
      </div>
      <a
        href={TERMINAL_URL}
        target="_blank"
        rel="noreferrer"
        className="mt-1.5 inline-block text-xs font-mono text-indigo-600 hover:text-indigo-800 hover:underline"
      >
        Live world signal · Mobius Terminal
      </a>
    </div>
  );
};
