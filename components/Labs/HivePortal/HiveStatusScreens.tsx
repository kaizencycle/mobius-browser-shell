/**
 * HiveStatusScreens — loading / error states for the HIVE chamber.
 *
 * Extracted from HivePortal/index.tsx (SHELL-8). Backgrounds use the C-344
 * chamber tone (#0a0c14) so the loading → game transition has no color flash.
 */
import React from 'react';

export const HiveLoadingScreen: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-full bg-[#0a0c14] gap-3">
    <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
    <p className="text-[11px] text-stone-500 font-mono">Entering HIVE world state…</p>
  </div>
);

export const HiveErrorScreen: React.FC<{ message: string | null; onRetry: () => void }> = ({
  message,
  onRetry,
}) => (
  <div className="flex flex-col items-center justify-center h-full bg-[#0a0c14] gap-4">
    <p className="text-[11px] text-rose-400 font-mono text-center max-w-xs px-4">
      {message ?? 'World state offline'}
    </p>
    <button
      type="button"
      onClick={onRetry}
      className="text-[10px] font-mono px-3 py-1.5 rounded border border-stone-700 text-stone-400 hover:border-stone-500 hover:text-stone-200 transition-colors"
    >
      Retry
    </button>
  </div>
);
