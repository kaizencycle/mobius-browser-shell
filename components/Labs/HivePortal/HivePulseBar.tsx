/**
 * HivePulseBar — compact world-state status ribbon
 *
 * Bridges mobius-hive world JSON data into the HiveChamber header.
 * Shows: cycle ID, GI, vault progress, active event/quest, ingest health.
 * Stays compact — designed to sit above the portal content without crowding.
 */
import React from 'react';
import type { HiveWorldData } from '../../../hooks/useHiveWorld';

interface HivePulseBarProps {
  world: HiveWorldData;
  lastFetched: Date | null;
  onRefresh: () => void;
}

function IngestDot({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-mono"
      title={`${label}: ${ok ? 'healthy' : 'degraded'}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full inline-block ${ok ? 'bg-emerald-400' : 'bg-rose-400'}`}
        aria-hidden
      />
      <span className={ok ? 'text-emerald-400' : 'text-rose-400'}>{label}</span>
    </span>
  );
}

export const HivePulseBar: React.FC<HivePulseBarProps> = ({ world, lastFetched, onRefresh }) => {
  const { cycle } = world;
  const gi = cycle.signals?.gi ?? null;
  const vaultPct = cycle.signals?.vault_progress != null
    ? Math.round(cycle.signals.vault_progress * 100)
    : null;

  const giColor =
    gi == null ? 'text-stone-400'
    : gi >= 0.8 ? 'text-emerald-400'
    : gi >= 0.6 ? 'text-amber-400'
    : 'text-rose-400';

  const ingest = cycle.ingest_health;
  const staleSec = lastFetched ? Math.floor((Date.now() - lastFetched.getTime()) / 1000) : null;

  return (
    <div className="flex items-center gap-3 px-3 py-1.5 bg-gray-900/80 border-b border-gray-800/60 font-mono text-[10px] overflow-x-auto no-scrollbar">
      {/* Cycle */}
      <span className="shrink-0 font-bold text-amber-400">{cycle.cycle_id}</span>

      {/* GI */}
      {gi !== null && (
        <span className={`shrink-0 ${giColor}`}>GI {gi.toFixed(2)}</span>
      )}

      {/* Vault */}
      {vaultPct !== null && (
        <span className="shrink-0 text-stone-400">
          Vault <span className="text-stone-200">{vaultPct}%</span>
        </span>
      )}

      {/* Active event */}
      {world.event && (
        <span className="shrink-0 text-cyan-400 truncate max-w-[140px]" title={world.event.title}>
          ⚡ {world.event.title}
        </span>
      )}

      {/* Active quest */}
      {world.quest && (
        <span className="shrink-0 text-purple-400 truncate max-w-[140px]" title={world.quest.title}>
          ⬡ {world.quest.title}
        </span>
      )}

      {/* Ingest health indicators */}
      {ingest && (
        <span className="shrink-0 flex items-center gap-2 ml-auto">
          <IngestDot ok={ingest.terminal_snapshot} label="terminal" />
          <IngestDot ok={ingest.cycle_state}       label="cycle" />
          <IngestDot ok={ingest.mobius_pulse}      label="pulse" />
        </span>
      )}

      {/* Stale indicator + refresh */}
      <span className="shrink-0 flex items-center gap-1 text-stone-600">
        {staleSec !== null && staleSec > 60 && (
          <span className="text-amber-600">stale {staleSec}s</span>
        )}
        <button
          type="button"
          onClick={onRefresh}
          className="text-stone-600 hover:text-stone-300 transition-colors"
          title="Refresh world state"
          aria-label="Refresh HIVE world state"
        >
          ↻
        </button>
      </span>
    </div>
  );
};
