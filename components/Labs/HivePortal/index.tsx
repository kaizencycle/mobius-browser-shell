import React from 'react';
import { useHiveWorld } from '../../../hooks/useHiveWorld';
import { HivePulseBar } from './HivePulseBar';
import { HiveGameEmbed } from './HiveGameEmbed';

export const HivePortal: React.FC = () => {
  const { world, loading, error, lastFetched, refresh } = useHiveWorld();

  if (loading && !world) return <HiveLoadingScreen />;
  if (error && !world) return <HiveErrorScreen message={error} onRetry={refresh} />;
  if (!world) return <HiveErrorScreen message="World state unavailable" onRetry={refresh} />;

  const gi = world.cycle.signals?.gi ?? null;
  const worldMood = world.event?.ui.overlay === 'fog' ? 'fogged' : 'clearing';
  const cycle = world.cycle.cycle_id ?? null;

  return (
    <div className="flex flex-col h-full bg-[#0a0c14] overflow-hidden">
      {/* slim world-state HUD ribbon — single source of truth, not duplicated in game */}
      <HivePulseBar world={world} lastFetched={lastFetched} onRefresh={refresh} />
      {/* game renderer — full remaining height */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <HiveGameEmbed gi={gi} worldMood={worldMood} cycle={cycle} />
      </div>
    </div>
  );
};

const HiveLoadingScreen: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-full bg-gray-950 gap-3">
    <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
    <p className="text-[11px] text-stone-500 font-mono">Entering HIVE world state…</p>
  </div>
);

const HiveErrorScreen: React.FC<{ message: string | null; onRetry: () => void }> = ({
  message,
  onRetry,
}) => (
  <div className="flex flex-col items-center justify-center h-full bg-gray-950 gap-4">
    <p className="text-[11px] text-rose-400 font-mono">{message ?? 'World state offline'}</p>
    <button
      type="button"
      onClick={onRetry}
      className="text-[10px] font-mono px-3 py-1.5 rounded border border-stone-700 text-stone-400 hover:border-stone-500 hover:text-stone-200 transition-colors"
    >
      Retry
    </button>
  </div>
);
