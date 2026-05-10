import React from 'react';
import type { HiveSentinelData } from '../../../hooks/useHiveWorld';

interface Props {
  sentinels: HiveSentinelData[];
  activeSentinelId: string | null;
}

function roleColor(role: string | undefined): string {
  if (role?.includes('governance')) return 'text-violet-400';
  if (role?.includes('surface')) return 'text-amber-400';
  if (role?.includes('canon')) return 'text-emerald-400';
  if (role?.includes('routing')) return 'text-sky-400';
  return 'text-stone-400';
}

export const SentinelRail: React.FC<Props> = ({ sentinels, activeSentinelId }) => {
  if (sentinels.length === 0) return null;

  return (
    <aside className="w-32 flex-shrink-0 border-l border-stone-700 bg-stone-900/60 flex flex-col py-3 gap-2 overflow-y-auto">
      <div className="px-2 text-[9px] text-stone-600 uppercase tracking-widest mb-1">Sentinels</div>
      {sentinels.map((s) => {
        const isActive = s.id === activeSentinelId;
        return (
          <div
            key={s.id}
            className={`mx-2 rounded px-2 py-2 flex flex-col gap-1 border transition-colors ${
              isActive
                ? 'border-amber-600/50 bg-amber-900/20 shadow-[0_0_8px_rgba(180,83,9,0.3)]'
                : 'border-stone-700/50 bg-stone-800/40'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span
                className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isActive ? 'bg-amber-400 animate-pulse' : 'bg-stone-600'}`}
              />
              <span className={`text-[10px] font-mono font-semibold ${isActive ? 'text-amber-300' : 'text-stone-300'}`}>
                {s.name}
              </span>
            </div>
            {s.role && (
              <span className={`text-[9px] font-mono leading-tight ${roleColor(s.role)}`}>
                {s.role.replace(/_/g, ' ')}
              </span>
            )}
          </div>
        );
      })}
    </aside>
  );
};
