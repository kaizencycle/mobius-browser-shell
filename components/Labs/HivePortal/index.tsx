import React from 'react';
import { useHiveWorld } from '../../../hooks/useHiveWorld';
import { TopStatusBar } from './TopStatusBar';
import { WorldZoneCard } from './WorldZoneCard';
import { SentinelRail } from './SentinelRail';
import { EventCard } from './EventCard';
import { QuestTracker } from './QuestTracker';
import { ActionRibbon } from './ActionRibbon';

export const HivePortal: React.FC = () => {
  const { world, loading, error, lastFetched, refresh } = useHiveWorld();

  if (loading && !world) return <HiveLoadingScreen />;
  if (error && !world) return <HiveErrorScreen message={error} onRetry={refresh} />;
  if (!world) return <HiveErrorScreen message="World state unavailable" onRetry={refresh} />;

  return (
    <div className="flex flex-col h-full bg-gray-950 text-gray-100 overflow-hidden font-mono">
      <TopStatusBar cycle={world.cycle} lastFetched={lastFetched} />
      <div className="flex flex-1 overflow-hidden min-h-0">
        <div className="flex flex-col flex-1 overflow-y-auto p-3 gap-3">
          <WorldZoneCard cycle={world.cycle} event={world.event} />
          {world.event && <EventCard event={world.event} />}
          {world.quest && <QuestTracker quest={world.quest} />}
          {!world.event && !world.quest && (
            <div className="text-[11px] text-stone-600 font-mono text-center py-8">
              No active event or quest this cycle.
            </div>
          )}
        </div>
        <SentinelRail sentinels={world.sentinels} activeSentinelId={world.activeSentinelId} />
      </div>
      <ActionRibbon cycle={world.cycle} onActionComplete={refresh} />
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
