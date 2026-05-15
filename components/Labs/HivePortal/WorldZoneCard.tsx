import React from 'react';
import type { HiveCycleData, HiveEventData } from '../../../hooks/useHiveWorld';

interface Props {
  cycle: HiveCycleData;
  event: HiveEventData | null;
}

function overlayClass(overlay: string | undefined): string {
  if (overlay === 'shimmer') return 'bg-amber-900/20 border-amber-700/40';
  if (overlay === 'fog') return 'bg-blue-900/20 border-blue-700/40';
  return 'bg-stone-800/60 border-stone-700/40';
}

export const WorldZoneCard: React.FC<Props> = ({ cycle, event }) => {
  const vaultPct = Math.round((cycle.signals.vault_progress ?? 0) * 100);
  const giPct = Math.round((cycle.signals.gi ?? 0) * 100);
  const overlay = event?.ui.overlay;

  return (
    <div className={`rounded-lg border p-3 space-y-3 ${overlayClass(overlay)}`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] text-stone-500 uppercase tracking-widest">Zone</div>
          <div className="text-sm font-semibold text-stone-100">The Castle</div>
        </div>
        {event && (
          <span
            className="text-[10px] px-2 py-0.5 rounded-full border font-mono"
            style={{
              borderColor: event.ui.color === 'warm' ? '#d97706' : event.ui.color === 'neutral' ? '#57534e' : '#3b82f6',
              color: event.ui.color === 'warm' ? '#fbbf24' : event.ui.color === 'neutral' ? '#a8a29e' : '#93c5fd',
            }}
          >
            {event.tone}
          </span>
        )}
      </div>

      <div className="space-y-1.5">
        <div>
          <div className="flex justify-between text-[10px] text-stone-500 mb-0.5">
            <span>Vault</span>
            <span>{vaultPct}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-stone-700 overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${vaultPct}%` }}
            />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-[10px] text-stone-500 mb-0.5">
            <span>Integrity</span>
            <span>{giPct}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-stone-700 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${giPct >= 70 ? 'bg-emerald-500' : giPct >= 40 ? 'bg-amber-500' : 'bg-rose-500'}`}
              style={{ width: `${giPct}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-between text-[10px] text-stone-500">
        <span>KV: <span className={cycle.signals.kv_status === 'ok' ? 'text-emerald-400' : 'text-amber-400'}>{cycle.signals.kv_status}</span></span>
        <span>{new Date(cycle.updated_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
    </div>
  );
};
