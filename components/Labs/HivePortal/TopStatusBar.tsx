import React from 'react';
import type { HiveCycleData } from '../../../hooks/useHiveWorld';

interface Props {
  cycle: HiveCycleData;
  lastFetched: Date | null;
}

function giColor(gi: number): string {
  if (gi >= 0.7) return 'text-emerald-400';
  if (gi >= 0.4) return 'text-amber-400';
  return 'text-rose-400';
}

function HealthDot({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span title={label} className={`inline-block w-2 h-2 rounded-full ${ok ? 'bg-emerald-500' : 'bg-rose-500'}`} />
  );
}

function age(date: Date | null): string {
  if (!date) return '—';
  const s = Math.round((Date.now() - date.getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  return `${Math.round(s / 60)}m ago`;
}

export const TopStatusBar: React.FC<Props> = ({ cycle, lastFetched }) => {
  const gi = cycle.signals.gi;
  const h = cycle.ingest_health;

  return (
    <div className="flex items-center justify-between px-3 py-2 bg-stone-900 border-b border-stone-700 flex-shrink-0 gap-4 text-[11px] font-mono">
      <div className="flex items-center gap-3">
        <span className="text-stone-400 tracking-widest uppercase">{cycle.cycle_id}</span>
        <span className={`font-semibold ${giColor(gi)}`}>GI {gi.toFixed(3)}</span>
        {cycle.rules_fired.length > 0 && (
          <span className="text-stone-500">{cycle.rules_fired[0]}</span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5" title="Ingest health">
          <HealthDot ok={h.terminal_snapshot} label="terminal snapshot" />
          <HealthDot ok={h.cycle_state} label="cycle state" />
          <HealthDot ok={h.mobius_pulse} label="mobius pulse" />
          <HealthDot ok={h.oaa_kv_latest} label="OAA KV" />
        </div>
        <span className="text-stone-600">{age(lastFetched)}</span>
      </div>
    </div>
  );
};
