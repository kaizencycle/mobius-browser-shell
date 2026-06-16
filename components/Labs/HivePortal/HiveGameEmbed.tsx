/**
 * HiveGameEmbed — replaces the WorldZoneCard/EventCard/QuestTracker dashboard
 * with the deployed Higgsfield game, framed inside the chamber.
 *
 * Architecture:
 *   - <iframe> pointing at the deployed game URL (config-driven, falls back
 *     to the Higgsfield deploy)
 *   - ?data= param passes the shell's world-base URL so the game's live-fetch
 *     overlays the same current-world.json the shell is already reading
 *   - HivePulseBar stays as a slim ribbon above the iframe — single source of
 *     truth for the HUD, not duplicated inside the game
 *   - Fog overlay rendered by the shell (CSS, not canvas) for visual continuity
 *     with the chamber's CRT aesthetic when GI is low
 *
 * Why iframe and not inline canvas:
 *   The deployed game at solid-crystal-164.higgsfield.gg is already a complete
 *   production renderer with generated art assets, proper game loop, and
 *   keyboard/touch/gamepad input. Embedding it as an iframe gives you 4K
 *   16-bit quality immediately, with zero asset duplication in the shell repo.
 *   A future cycle can inline the game source if the dependency needs removing.
 */

import React, { useCallback, useRef, useState } from 'react';
import { getHiveWorldBaseUrl } from '../../../src/lib/meshWorldFetch';

const GAME_BASE_URL =
  (import.meta.env.VITE_HIVE_URL as string | undefined)?.trim() ||
  'https://solid-crystal-164.higgsfield.gg/';

interface HiveGameEmbedProps {
  gi: number | null;
  worldMood: string | null;
  cycle: string | null;
}

export const HiveGameEmbed: React.FC<HiveGameEmbedProps> = ({ gi, worldMood, cycle }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [muted] = useState(true);

  // Pass ?data= so the game overlays the shell's world-base URL, keeping
  // both surfaces reading the same current-world.json.
  const gameUrl = useCallback(() => {
    const base = getHiveWorldBaseUrl();
    const url = new URL(GAME_BASE_URL);
    // Only pass a full URL (not the in-shell proxy path) — the game is a
    // cross-origin iframe and can't hit /api/hive/world.
    if (base.startsWith('http')) {
      url.searchParams.set('data', base);
    }
    if (muted) url.searchParams.set('muted', '1');
    return url.toString();
  }, [muted]);

  // Fog intensity: CSS opacity layer driven by GI, matching the game's own
  // fog logic so the CRT border and the game interior feel unified.
  const fogOpacity =
    gi != null ? Math.max(0, Math.min(0.45, (0.95 - gi) * 0.7)) : 0.3;
  const isClearing = worldMood === 'clearing' || (gi != null && gi >= 0.85);

  return (
    <div className="relative w-full h-full flex flex-col min-h-0 overflow-hidden bg-[#0a0c14]">
      {/* loading shimmer while iframe paints */}
      {!loaded && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#0a0c14]">
          <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-[11px] text-stone-500 font-mono tracking-widest">
            ENTERING THE HIVE…
          </p>
          {cycle && (
            <p className="text-[10px] text-stone-600 font-mono">{cycle}</p>
          )}
        </div>
      )}

      {/* game frame — allow-scripts, allow-same-origin for localStorage (civic_id) */}
      <iframe
        ref={iframeRef}
        src={gameUrl()}
        title="HIVE 16-bit World Simulator"
        className="flex-1 w-full border-0 min-h-0"
        style={{ display: loaded ? 'block' : 'none', imageRendering: 'pixelated' }}
        allow="autoplay; fullscreen; pointer-lock; gamepad; accelerometer; clipboard-write"
        sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-popups"
        onLoad={() => setLoaded(true)}
      />

      {/* fog-of-integrity CSS layer — mirrors game's fog, applied to the frame border
          so the CRT wrapper and the game interior share the same atmospheric depth.
          The game itself handles interior fog; this layer handles the chamber chrome. */}
      {loaded && fogOpacity > 0.02 && (
        <div
          className="pointer-events-none absolute inset-0 z-20"
          style={{
            background: `radial-gradient(ellipse at center, transparent 40%, rgba(10,12,20,${fogOpacity}) 100%)`,
            transition: isClearing ? 'opacity 4s ease-out' : 'opacity 2s ease-in',
            opacity: isClearing ? 0 : 1,
          }}
          aria-hidden
        />
      )}

      {/* scanline overlay for CRT aesthetic continuity — only decorative */}
      {loaded && (
        <div
          className="pointer-events-none absolute inset-0 z-20"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)',
          }}
          aria-hidden
        />
      )}
    </div>
  );
};
