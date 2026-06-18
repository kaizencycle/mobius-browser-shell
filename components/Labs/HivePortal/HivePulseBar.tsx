/**
 * HivePulseBar — compact world-state status ribbon
 *
 * Bridges mobius-hive world JSON data into the HiveChamber header.
 * Shows: cycle ID, GI, vault progress, active event/quest, ingest health,
 * plus shell controls (mute, fullscreen) and a collapsible Chronicle row.
 * Stays compact — designed to sit above the portal content without crowding.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Maximize2, Minimize2, Volume2, VolumeX, ScrollText } from 'lucide-react';
import type { HiveWorldData } from '../../../hooks/useHiveWorld';
import type { WriteStatus } from './HiveGameEmbed';

interface HivePulseBarProps {
  world: HiveWorldData;
  lastFetched: Date | null;
  onRefresh: () => void;
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  muted: boolean;
  onToggleMute: () => void;
  writeStatus: WriteStatus;
  lastEventType: string | null;
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

export const HivePulseBar: React.FC<HivePulseBarProps> = ({
  world,
  lastFetched,
  onRefresh,
  iframeRef,
  muted,
  onToggleMute,
  writeStatus,
  lastEventType,
}) => {
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

  // SHELL-3: fullscreen the game iframe from the HUD.
  const [isFullscreen, setIsFullscreen] = useState(false);
  useEffect(() => {
    const onChange = () => setIsFullscreen(document.fullscreenElement === iframeRef.current);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, [iframeRef]);

  const toggleFullscreen = useCallback(() => {
    const el = iframeRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen?.();
    } else {
      void el.requestFullscreen?.();
    }
  }, [iframeRef]);

  // SHELL-6: flash the cycle ID + a celebratory line for 8s when a win lands.
  // The timer lives in a ref (not effect cleanup) so the unrelated writeStatus
  // → 'idle' reset that happens 4s later doesn't cut the 8s flash short.
  const [winFlash, setWinFlash] = useState(false);
  const winShownRef = useRef(false);
  const winTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    const isWin = writeStatus === 'ok' && lastEventType === 'win';
    if (isWin && !winShownRef.current) {
      winShownRef.current = true;
      setWinFlash(true);
      if (winTimerRef.current) clearTimeout(winTimerRef.current);
      winTimerRef.current = setTimeout(() => setWinFlash(false), 8000);
    } else if (!isWin) {
      // Re-arm so the next distinct win can flash again.
      winShownRef.current = false;
    }
  }, [writeStatus, lastEventType]);
  useEffect(() => () => {
    if (winTimerRef.current) clearTimeout(winTimerRef.current);
  }, []);

  // SHELL-1: collapsible Chronicle of recent citizen deeds.
  const history = world.citizenHistory;
  const [chronicleOpen, setChronicleOpen] = useState(false);
  const shown = history ? history.slice(0, chronicleOpen ? 10 : 3) : [];

  return (
    <div className="bg-gray-900/80 border-b border-gray-800/60">
      <div className="flex items-center gap-3 px-3 py-1.5 font-mono text-[10px] overflow-x-auto no-scrollbar">
        {/* Cycle */}
        <span
          className={`shrink-0 font-bold text-amber-400 ${winFlash ? 'animate-pulse' : ''}`}
        >
          {cycle.cycle_id}
        </span>

        {/* SHELL-6 win celebration */}
        {winFlash && (
          <span className="shrink-0 text-amber-300" title="Forge Fountain restored">
            ✦ Forge Fountain restored — {cycle.cycle_id} sealed
          </span>
        )}

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

        {/* Shell controls + stale indicator + refresh */}
        <span className={`shrink-0 flex items-center gap-2 text-stone-600 ${ingest ? '' : 'ml-auto'}`}>
          {staleSec !== null && staleSec > 60 && (
            <span className="text-amber-600">stale {staleSec}s</span>
          )}

          {/* SHELL-5 mute toggle */}
          <button
            type="button"
            onClick={onToggleMute}
            className="text-stone-500 hover:text-stone-200 transition-colors"
            title={muted ? 'Unmute game audio' : 'Mute game audio'}
            aria-label={muted ? 'Unmute HIVE game audio' : 'Mute HIVE game audio'}
            aria-pressed={!muted}
          >
            {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          {/* SHELL-3 fullscreen toggle */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="text-stone-500 hover:text-stone-200 transition-colors"
            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

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

      {/* SHELL-1 Chronicle row — collapsible, shows recent citizen deeds */}
      <div className="px-3 pb-1">
        <button
          type="button"
          onClick={() => setChronicleOpen((o) => !o)}
          className="flex items-center gap-1.5 text-[9px] font-mono text-stone-500 hover:text-stone-300 transition-colors"
          aria-expanded={chronicleOpen}
          title="Chronicle of recent citizen deeds"
        >
          <ScrollText className="w-3 h-3" aria-hidden />
          <span className="uppercase tracking-wider">Chronicle</span>
          {history && history.length > 0 && (
            <span className="text-stone-600">({chronicleOpen ? history.length : Math.min(3, history.length)}{chronicleOpen ? '' : `/${history.length}`})</span>
          )}
          <span className="text-stone-600">{chronicleOpen ? '▾' : '▸'}</span>
        </button>

        {(chronicleOpen || shown.length > 0) && (
          <ul className="mt-0.5 space-y-0.5">
            {shown.length === 0 ? (
              <li className="text-[9px] text-stone-600 font-mono italic">Chronicle empty this cycle</li>
            ) : (
              shown.map((entry, i) => (
                <li
                  key={`${entry.cycle_id}-${entry.civic_id}-${entry.at}-${i}`}
                  className="text-[9px] text-stone-500 font-mono truncate"
                  title={`${entry.zone} · ${entry.action} · ${entry.summary} (${entry.at})`}
                >
                  <span className="text-stone-600">{entry.cycle_id}</span>
                  {entry.zone && <span className="text-cyan-700"> {entry.zone}</span>}
                  {' · '}
                  <span className="text-stone-400">{entry.summary || entry.action}</span>
                </li>
              ))
            )}
          </ul>
        )}
      </div>
    </div>
  );
};
