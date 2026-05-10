import React, { useState, useMemo } from 'react';
import { useTerminal } from '../../contexts/TerminalContext';
import type { TerminalState } from '../../src/lib/terminal-bridge';

interface Signal {
  label: string;
  value: string;
  trend: 'up' | 'down' | 'flat';
}

function extractSignals(state: TerminalState | null): Signal[] {
  if (!state) return [];
  const signals: Signal[] = [];

  if (state.gi !== undefined) {
    signals.push({
      label: 'Global Integrity Index',
      value: state.gi.toFixed(3),
      trend: state.gi >= 0.7 ? 'up' : state.gi <= 0.4 ? 'down' : 'flat',
    });
  }
  if (state.mode) {
    signals.push({
      label: 'GI Mode',
      value: state.mode.toUpperCase(),
      trend: state.mode === 'green' ? 'up' : state.mode === 'red' ? 'down' : 'flat',
    });
  }
  if (state.cycle) {
    signals.push({
      label: 'Current Cycle',
      value: state.cycle,
      trend: 'flat',
    });
  }
  return signals.slice(0, 3);
}

const TREND_ICON: Record<Signal['trend'], string> = {
  up: '▲',
  down: '▼',
  flat: '◆',
};
const TREND_CLS: Record<Signal['trend'], string> = {
  up: 'text-emerald-400',
  down: 'text-rose-400',
  flat: 'text-amber-400',
};

export const EveSignalSidebar: React.FC = () => {
  const [open, setOpen] = useState(true);
  const { state } = useTerminal();
  const signals = useMemo(() => extractSignals(state), [state]);

  return (
    <div className={`flex-shrink-0 border-l border-stone-200 bg-white transition-all duration-200 ${open ? 'w-44' : 'w-8'} flex flex-col`}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-center py-2 text-stone-400 hover:text-stone-700 border-b border-stone-100 text-xs font-mono"
        title={open ? 'Collapse signals' : 'Expand signals'}
      >
        {open ? '›' : '‹'}
      </button>
      {open && (
        <div className="flex flex-col gap-3 p-3 overflow-auto">
          <p className="text-[9px] text-stone-400 font-mono uppercase tracking-widest">
            Live Signals
          </p>
          {signals.length === 0 && (
            <p className="text-[10px] text-stone-400">No data</p>
          )}
          {signals.map((sig) => (
            <div key={sig.label} className="flex flex-col gap-0.5">
              <span className="text-[9px] text-stone-400 leading-tight">{sig.label}</span>
              <span className={`text-[11px] font-semibold font-mono ${TREND_CLS[sig.trend]}`}>
                {TREND_ICON[sig.trend]} {sig.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
