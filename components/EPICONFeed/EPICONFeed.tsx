import React from 'react';
import { useTerminalData } from '../../hooks/useTerminalData';
import { terminalBridge } from '../../services/terminalBridge';
import type { EPICONEntry } from '../../services/terminalBridge';

const STATUS_COLOR: Record<EPICONEntry['status'], string> = {
  pending:    'text-amber-600 bg-amber-50 border-amber-200',
  executed:   'text-emerald-700 bg-emerald-50 border-emerald-200',
  failed:     'text-rose-700 bg-rose-50 border-rose-200',
  superseded: 'text-stone-500 bg-stone-50 border-stone-200',
};

export const EPICONFeed: React.FC = () => {
  const { data: entries, loading, error, refresh } = useTerminalData(
    () => terminalBridge.epiconFeed(20),
    60_000,
  );

  return (
    <div className="flex flex-col h-full bg-stone-50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 bg-stone-50 border-b border-stone-200">
        <div>
          <span className="text-sm font-semibold text-stone-900">Intent Record</span>
          <span className="ml-2 text-[10px] font-mono px-1.5 py-0.5 rounded bg-stone-100 text-stone-500 border border-stone-200 uppercase tracking-widest">
            EPICON
          </span>
        </div>
        <button onClick={() => void refresh()}
          className="text-[10px] font-mono text-stone-400 hover:text-stone-600 transition-colors">
          ↻ refresh
        </button>
      </div>

      <div className="px-4 py-2 border-b border-stone-100 bg-white">
        <p className="text-xs text-stone-400 leading-relaxed">
          Every action in Mobius is declared before it's executed. These are the live intent records from the current cycle.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2">
        {loading && !entries && (
          <div className="flex items-center justify-center py-12">
            <div className="w-4 h-4 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin" />
          </div>
        )}
        {error && !entries && (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <p className="text-xs text-rose-500 font-mono">EPICON feed unavailable</p>
            <button onClick={() => void refresh()}
              className="text-[10px] font-mono px-3 py-1.5 rounded border border-stone-300 text-stone-500 hover:border-stone-400 transition-colors">
              Retry
            </button>
          </div>
        )}
        {entries && entries.length === 0 && (
          <p className="text-xs text-stone-400 font-mono text-center py-12">No intents found</p>
        )}
        {(entries ?? []).map(e => (
          <div key={e.id} className="bg-white rounded-lg border border-stone-200 px-3 py-2.5 flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono text-stone-500">{e.id}</span>
                {e.agent && (
                  <span className="text-[9px] font-mono text-stone-400 bg-stone-50 border border-stone-100 px-1 rounded">
                    {e.agent}
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-700 mt-0.5 leading-snug">{e.intent}</p>
              {e.cycle && (
                <p className="text-[10px] text-stone-400 font-mono mt-0.5">{e.cycle}</p>
              )}
            </div>
            <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase tracking-wide shrink-0 ${STATUS_COLOR[e.status] ?? STATUS_COLOR.pending}`}>
              {e.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
