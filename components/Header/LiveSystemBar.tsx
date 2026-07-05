import React from 'react';
import { terminalBridge } from '../../services/terminalBridge';
import { useTerminalData } from '../../hooks/useTerminalData';
import { GIGauge } from '../GIDisplay/GIGauge';
import { markFirstAction } from '../../src/lib/onboarding/first-actions';
import { pulseChamber } from '../../src/lib/chambers';

export function LiveSystemBar() {
  const { data } = useTerminalData(
    () => terminalBridge.snapshotLite(),
    60_000,
  );

  const gi  = typeof data?.gi === 'number' ? data.gi : null;
  const mii = typeof data?.mii === 'number' ? data.mii : null;

  const zoneClass =
    gi == null
      ? 'border-stone-700 text-stone-400'
      : gi >= 0.7
        ? 'border-emerald-500/30 text-emerald-300'
        : gi >= 0.4
          ? 'border-amber-500/30 text-amber-300'
          : 'border-rose-500/30 text-rose-300';

  const miiClass =
    mii == null ? 'text-stone-400'
    : mii >= 0.9 ? 'text-indigo-400'
    : mii >= 0.7 ? 'text-amber-400'
    : 'text-rose-400';

  return (
    <div className={`sticky top-0 z-40 flex h-8 items-center justify-between border-b bg-stone-950/95 px-3 font-mono text-[10px] backdrop-blur ${zoneClass}`}>
      <div className="flex items-center gap-2 sm:gap-3 overflow-hidden whitespace-nowrap min-w-0">
        {/* OPT-16: live sentinel pip */}
        <span className="live-sentinel-pip shrink-0" aria-hidden="true" />
        <span className="uppercase tracking-[0.2em] text-stone-500 hidden xs:inline">Mobius Live</span>

        <span className="shrink-0">
          <span className="text-stone-500 hidden sm:inline">Cycle </span>
          <span className="font-bold text-stone-100">{data?.cycle ?? '—'}</span>
        </span>

        <div className="flex items-center gap-1 shrink-0">
          <GIGauge score={gi} size="compact" />
          <span>
            GI <span className="font-bold text-stone-100">{gi?.toFixed(2) ?? '—'}</span>
          </span>
        </div>

        <span className="shrink-0 hidden sm:inline">
          ◎ <span className="font-bold text-stone-100">{data?.vault_balance?.toFixed?.(2) ?? '—'}</span> MIC
        </span>

        <span className="shrink-0 hidden md:inline">
          <span className="font-bold text-stone-100">{data?.agent_count ?? 8}</span> sentinels
        </span>

        <span
          className={`shrink-0 hidden lg:inline font-bold ${miiClass}`}
          title={mii !== null ? `MII: ${mii.toFixed(4)}` : 'MII loading'}
        >
          MII {mii !== null ? mii.toFixed(2) : '—'}
        </span>
      </div>

      <a
        href={`${terminalBridge.baseUrl}/terminal`}
        target="_blank"
        rel="noreferrer"
        onClick={() => markFirstAction('pulse')}
        className="shrink-0 text-stone-400 transition-colors hover:text-white"
      >
        → {pulseChamber().publicName}
      </a>
    </div>
  );
}
