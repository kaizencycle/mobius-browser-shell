import React from 'react';

interface Props {
  cycle: string;
  startedAt?: string | null;
  vaultBalance?: number | null;
  intentCount?: number;
}

export const CycleTimeline: React.FC<Props> = ({ cycle, startedAt, vaultBalance, intentCount }) => {
  const elapsed = startedAt
    ? Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 86_400_000))
    : null;

  return (
    <div className="flex items-center gap-2 font-mono">
      <span
        className="text-[11px] font-bold text-stone-700 bg-stone-100 border border-stone-200 px-2 py-0.5 rounded"
        title="Current Mobius cycle — a bounded epoch of coordinated civic action"
      >
        {cycle}
      </span>
      <span className="text-[10px] text-stone-400 hidden sm:inline">
        {elapsed !== null ? `Day ${elapsed}` : ''}
        {vaultBalance != null ? ` · ◎ ${vaultBalance.toFixed(1)} MIC` : ''}
        {intentCount != null ? ` · ${intentCount} intents` : ''}
      </span>
    </div>
  );
};
