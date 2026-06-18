import React, { useCallback, useRef, useState } from 'react';
import { useHiveWorld } from '../../../hooks/useHiveWorld';
import { HivePulseBar } from './HivePulseBar';
import { HiveGameEmbed, GAME_BASE_URL, type WriteStatus } from './HiveGameEmbed';
import { HiveLoadingScreen, HiveErrorScreen } from './HiveStatusScreens';

export const HivePortal: React.FC = () => {
  const { world, loading, error, lastFetched, refresh } = useHiveWorld();

  // Shared ref: the iframe lives in HiveGameEmbed but HivePulseBar drives
  // fullscreen on it (SHELL-3), so the ref is owned here at the boundary.
  const iframeRef = useRef<HTMLIFrameElement>(null);
  // Lifted so both the game indicator and the HUD win-flash see the same write
  // state (SHELL-6), and so the HUD mute toggle mirrors the embed (SHELL-5).
  const [muted, setMuted] = useState(true);
  const [writeStatus, setWriteStatus] = useState<WriteStatus>('idle');
  const [lastEventType, setLastEventType] = useState<string | null>(null);

  const toggleMute = useCallback(() => setMuted((m) => !m), []);

  // SHELL-8: surface a clear error when no game URL is configured anywhere
  // (env var empty and no fallback) rather than rendering a broken iframe.
  if (!GAME_BASE_URL) {
    return (
      <HiveErrorScreen
        message="VITE_HIVE_URL not configured — set it in the Vercel dashboard"
        onRetry={refresh}
      />
    );
  }

  if (loading && !world) return <HiveLoadingScreen />;
  if (error && !world) return <HiveErrorScreen message={error} onRetry={refresh} />;
  if (!world) return <HiveErrorScreen message="World state unavailable" onRetry={refresh} />;

  const gi = world.cycle.signals?.gi ?? null;
  const worldMood = world.event?.ui.overlay === 'fog' ? 'fogged' : 'clearing';
  const cycle = world.cycle.cycle_id ?? null;

  return (
    <div className="flex flex-col h-full bg-[#0a0c14] overflow-hidden">
      {/* slim world-state HUD ribbon — single source of truth, not duplicated in game */}
      <HivePulseBar
        world={world}
        lastFetched={lastFetched}
        onRefresh={refresh}
        iframeRef={iframeRef}
        muted={muted}
        onToggleMute={toggleMute}
        writeStatus={writeStatus}
        lastEventType={lastEventType}
      />
      {/* game renderer — full remaining height */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <HiveGameEmbed
          gi={gi}
          worldMood={worldMood}
          cycle={cycle}
          iframeRef={iframeRef}
          muted={muted}
          writeStatus={writeStatus}
          lastEventType={lastEventType}
          onWriteStatus={setWriteStatus}
          onEventType={setLastEventType}
        />
      </div>
    </div>
  );
};
