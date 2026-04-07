import React from 'react';
import type { TerminalState } from '../src/lib/terminal-bridge';

const TERMINAL_URL = 'https://mobius-civic-ai-terminal.vercel.app/terminal';

function scoreTextClass(score: number): string {
  if (score >= 0.8) return 'text-emerald-600';
  if (score >= 0.65) return 'text-amber-600';
  return 'text-rose-600';
}

interface WorldSignalStripProps {
  terminalState: TerminalState | null;
}

export const WorldSignalStrip: React.FC<WorldSignalStripProps> = ({
  terminalState,
}) => {
  const domains = terminalState?.domains ?? [];

  return (
    <div className="flex-none border-b border-stone-200/80 bg-white/90 px-3 sm:px-6 py-2">
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
