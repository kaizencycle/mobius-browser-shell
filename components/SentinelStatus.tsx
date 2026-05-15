import React from 'react';
import { Sentinel } from '../types';
import { ShieldCheck } from 'lucide-react';

interface SentinelStatusProps {
  sentinels: Sentinel[];
  compact?: boolean;
  mii?: number | null;
}

export const SentinelStatus: React.FC<SentinelStatusProps> = ({ sentinels, compact = false, mii }) => {
  const miiDisplay = mii != null ? mii.toFixed(3) : null;
  const miiColor = mii == null ? 'text-stone-400'
    : mii >= 0.9 ? 'text-stone-700'
    : mii >= 0.7 ? 'text-amber-700'
    : 'text-rose-700';

  return (
    <div className="flex items-center space-x-2 sm:space-x-4 text-xs font-mono text-stone-500 select-none">
      <div className={`flex items-center space-x-1 sm:space-x-1.5 px-1.5 sm:px-2 py-1 bg-stone-200/50 rounded-md ${compact ? '' : 'hidden sm:flex'}`}>
        <ShieldCheck className="w-3 h-3 text-emerald-600" />
        <span className={`font-semibold text-[10px] sm:text-xs ${miiColor}`}>
          MII {miiDisplay ?? '—'}
        </span>
      </div>

      <div className="h-4 w-px bg-stone-300 hidden sm:block" />

      <div className="flex items-center space-x-2 sm:space-x-3">
        {sentinels.map((s) => (
          <div key={s.id} className="group relative flex items-center cursor-help">
            <div className={`w-2 h-2 rounded-full transition-all duration-500 ${
              s.status === 'active'   ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' :
              s.status === 'thinking' ? 'bg-amber-400 animate-pulse' :
              s.status === 'warning'  ? 'bg-amber-500' :
              s.status === 'error'    ? 'bg-rose-500 animate-pulse' :
              s.status === 'offline'  ? 'bg-stone-300' :
              'bg-stone-400'
            }`} />
            <span className="ml-1.5 hidden group-hover:inline-block transition-opacity opacity-0 group-hover:opacity-100 uppercase tracking-wider text-[10px]">
              {s.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};