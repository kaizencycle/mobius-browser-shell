/**
 * HiveGameEmbed — renders the deployed Higgsfield HIVE game as a full-height
 * iframe inside the chamber, with three integration layers:
 *
 *   1. ?data= passthrough — game overlays the shell's live current-world.json,
 *      so both surfaces read the same substrate state.
 *   2. postMessage listener (C-341 write-back) — game emits events on every
 *      realm seal / fountain restore; shell catches them and POSTs
 *      hive.player_event to /ledger/attest (lab_source=hive). This closes
 *      the Sweep → Seal → Ledger → citizen_history loop.
 *   3. Fog-of-integrity CSS overlay — shell-side radial gradient driven by GI,
 *      keeping the chamber chrome and the game interior atmospherically unified.
 *
 * Payload contract (from game.js emitEvent):
 *   { source: "mobius-hive-sim", type, cycle, live, gi, vault, mic,
 *     sealed, total, won, ts, realm?, realmTitle?, realmColor? }
 *
 * Types we attest as hive.player_event:
 *   "seal"          → action channel_node on realm zone
 *   "win"           → action restore_beacon on forge-of-civilization
 *   "fountain_ready"→ action fountain_ready on forge-of-civilization
 *
 * Types we silently ignore (not consequential enough to attest):
 *   "start", "ready" — game lifecycle, not player actions
 */

import React, { useEffect, useRef, useState } from 'react';
import { getHiveWorldBaseUrl } from '../../../src/lib/meshWorldFetch';
import {
  defaultHiveAttestUrl,
  postHivePlayerEvent,
  type HivePlayerEventPayload,
} from '../../../src/lib/hive-player-event';
import { env } from '../../../config/env';

export const GAME_BASE_URL =
  (import.meta.env.VITE_HIVE_URL as string | undefined)?.trim() ||
  'https://solid-crystal-164.higgsfield.gg/';

// Origin of the game iframe — used both to validate inbound postMessages and as
// the explicit targetOrigin for shell → game pushes (never '*', see SHELL-2/5).
const GAME_ORIGIN = (() => {
  try {
    return new URL(GAME_BASE_URL).origin;
  } catch {
    return '';
  }
})();

// Pseudonymous civic_id for this browser session (C-341 anon pattern).
// Persisted in localStorage so a returning citizen keeps one identity in
// the chronicle without any account system.
function getOrCreateCivicId(): string {
  const KEY = 'hive_civic_id';
  try {
    const existing = localStorage.getItem(KEY);
    if (existing && existing.startsWith('mobius-anon-')) return existing;
    const fresh = `mobius-anon-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(KEY, fresh);
    return fresh;
  } catch {
    return `mobius-anon-${Math.random().toString(36).slice(2, 10)}`;
  }
}

// SHELL-7: persist the per-session dedup set in sessionStorage, keyed by
// civic_id. This survives HiveGameEmbed unmount/remount (chamber tab switches)
// so a realm sealed in one mount can't be re-attested in the next — but clears
// on tab close, so it never persists forever.
function attestedStorageKey(civicId: string): string {
  return `hive_attested_${civicId}`;
}

function loadAttested(civicId: string): Set<string> {
  try {
    const raw = sessionStorage.getItem(attestedStorageKey(civicId));
    if (!raw) return new Set();
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((x): x is string => typeof x === 'string'));
  } catch {
    return new Set();
  }
}

function saveAttested(civicId: string, set: Set<string>): void {
  try {
    sessionStorage.setItem(attestedStorageKey(civicId), JSON.stringify([...set]));
  } catch {
    /* sessionStorage unavailable (private mode / quota) — dedup degrades to in-memory */
  }
}

// Shape of the postMessage payload emitted by game.js emitEvent()
interface HiveGameEvent {
  source: 'mobius-hive-sim';
  type: string;
  cycle?: string;
  live?: boolean;
  gi?: number;
  vault?: number;
  mic?: number;
  sealed?: number;
  total?: number;
  won?: boolean;
  ts?: number;
  realm?: string;
  realmTitle?: string;
  realmColor?: string;
}

function isHiveEvent(data: unknown): data is HiveGameEvent {
  return (
    typeof data === 'object' &&
    data !== null &&
    (data as Record<string, unknown>)['source'] === 'mobius-hive-sim'
  );
}

// Map a game event to a hive.player_event payload.
// Returns null for event types that don't warrant ledger writes.
function toPlayerEvent(ev: HiveGameEvent, civicId: string): HivePlayerEventPayload | null {
  const cycleId = ev.cycle ?? 'C-?';
  const clientTs = new Date().toISOString();

  if (ev.type === 'seal' && ev.realm) {
    return {
      world: 'hive-citadel',
      zone: ev.realm,
      action: 'channel_node',
      target_id: `realm-${ev.realm}`,
      cycle_id: cycleId,
      civic_id: civicId,
      client_ts: clientTs,
    };
  }

  if (ev.type === 'win') {
    return {
      world: 'hive-citadel',
      zone: 'forge-of-civilization',
      action: 'restore_beacon',
      target_id: 'forge-fountain',
      cycle_id: cycleId,
      civic_id: civicId,
      client_ts: clientTs,
    };
  }

  if (ev.type === 'fountain_ready') {
    return {
      world: 'hive-citadel',
      zone: 'forge-of-civilization',
      action: 'fountain_ready',
      target_id: 'forge-fountain',
      cycle_id: cycleId,
      civic_id: civicId,
      client_ts: clientTs,
    };
  }

  return null; // "start", "ready", unknown — do not attest
}

// Status of the most recent ledger write — shown as a small non-blocking
// indicator so the player knows their deed was recorded.
export type WriteStatus = 'idle' | 'writing' | 'ok' | 'fail';

interface HiveGameEmbedProps {
  gi: number | null;
  worldMood: string | null;
  cycle: string | null;
  /** Shared ref so HivePulseBar can drive fullscreen on the same iframe (SHELL-3). */
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  /** Lifted into HivePortal so HivePulseBar can mirror the unmute state (SHELL-5). */
  muted: boolean;
  /** Lifted write status — rendered here and in HivePulseBar (SHELL-6). */
  writeStatus: WriteStatus;
  lastEventType: string | null;
  onWriteStatus: (status: WriteStatus) => void;
  onEventType: (type: string) => void;
}

export const HiveGameEmbed: React.FC<HiveGameEmbedProps> = ({
  gi,
  worldMood,
  cycle,
  iframeRef,
  muted,
  writeStatus,
  lastEventType,
  onWriteStatus,
  onEventType,
}) => {
  const [loaded, setLoaded] = useState(false);
  const civicId = useRef(getOrCreateCivicId());
  // SHELL-7: dedup set hydrated from sessionStorage (survives remounts within
  // the session). Lazy-init so we read storage once, not on every render.
  const attested = useRef<Set<string> | null>(null);
  if (attested.current === null) attested.current = loadAttested(civicId.current);
  // Avoid stale-closure status churn: refs hold the latest setters for the
  // mount-stable message handler below.
  const onWriteStatusRef = useRef(onWriteStatus);
  const onEventTypeRef = useRef(onEventType);
  onWriteStatusRef.current = onWriteStatus;
  onEventTypeRef.current = onEventType;

  // Build the iframe src ONCE (captured initial muted state). Mute toggles after
  // mount go via postMessage (SHELL-5), so the src never changes and the iframe
  // is never reloaded mid-session.
  const srcRef = useRef<string>('');
  if (!srcRef.current) {
    const base = getHiveWorldBaseUrl();
    const url = new URL(GAME_BASE_URL);
    if (base.startsWith('http')) url.searchParams.set('data', base);
    if (muted) url.searchParams.set('muted', '1');
    srcRef.current = url.toString();
  }

  // C-341 write-back: listen for postMessage from the game iframe.
  useEffect(() => {
    if (!env.api.ledger) return; // ledger not configured — skip silently

    const attestUrl = defaultHiveAttestUrl();

    const handler = async (ev: MessageEvent) => {
      // P1: validate sender — must be our iframe's window at the expected origin.
      // Rejects forged postMessages from any other frame or extension.
      if (ev.source !== iframeRef.current?.contentWindow) return;
      if (ev.origin !== GAME_ORIGIN) return;
      if (!isHiveEvent(ev.data)) return;
      const gameEv = ev.data;

      const playerEvent = toPlayerEvent(gameEv, civicId.current);
      if (!playerEvent) return;

      // Dedup key: type + realm (or 'none') + cycle
      const dedupKey = `${gameEv.type}:${gameEv.realm ?? 'none'}:${gameEv.cycle ?? '?'}`;
      if (attested.current?.has(dedupKey)) return;
      onEventTypeRef.current(gameEv.type);
      onWriteStatusRef.current('writing');

      const result = await postHivePlayerEvent(attestUrl, playerEvent, {
        cacheKey: dedupKey,
        markPosted: (key) => {
          attested.current?.add(key);
          saveAttested(civicId.current, attested.current ?? new Set([key]));
        },
      });
      onWriteStatusRef.current(result.ok ? 'ok' : 'fail');

      // Clear indicator after 4s so it doesn't clutter the screen
      setTimeout(() => onWriteStatusRef.current('idle'), 4000);
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [iframeRef]); // stable — civicId/attested are refs, setters via refs

  // SHELL-2: push GI updates into the game so its internal fog layer stays in
  // sync with the shell's CSS fog (no full re-render — postMessage only).
  useEffect(() => {
    if (!loaded || gi == null || !GAME_ORIGIN) return;
    iframeRef.current?.contentWindow?.postMessage(
      { source: 'mobius-shell', type: 'gi-update', gi },
      GAME_ORIGIN,
    );
  }, [gi, loaded, iframeRef]);

  // SHELL-5: push mute/unmute without remounting the iframe.
  useEffect(() => {
    if (!loaded || !GAME_ORIGIN) return;
    iframeRef.current?.contentWindow?.postMessage(
      { source: 'mobius-shell', type: muted ? 'mute' : 'unmute' },
      GAME_ORIGIN,
    );
  }, [muted, loaded, iframeRef]);

  const fogOpacity =
    gi != null ? Math.max(0, Math.min(0.45, (0.95 - gi) * 0.7)) : 0.3;
  const isClearing = worldMood === 'clearing' || (gi != null && gi >= 0.85);

  const statusLabel: Record<WriteStatus, string> = {
    idle: '',
    writing: '⟳ recording deed…',
    ok: '✦ deed recorded',
    fail: '⚠ chronicle write pending',
  };
  const statusColor: Record<WriteStatus, string> = {
    idle: '',
    writing: 'text-stone-400',
    ok: 'text-teal-400',
    fail: 'text-amber-400',
  };

  return (
    <div className="relative w-full h-full flex flex-col min-h-0 overflow-hidden bg-[#0a0c14]">
      {/* loading shimmer */}
      {!loaded && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#0a0c14]">
          <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-[11px] text-stone-500 font-mono tracking-widest">
            ENTERING THE HIVE…
          </p>
          {cycle && <p className="text-[10px] text-stone-600 font-mono">{cycle}</p>}
        </div>
      )}

      {/* game iframe */}
      <iframe
        ref={iframeRef}
        src={srcRef.current}
        title="HIVE 16-bit World Simulator"
        className="flex-1 w-full border-0 min-h-0"
        style={{ display: loaded ? 'block' : 'none', imageRendering: 'pixelated' }}
        allow="autoplay; fullscreen; pointer-lock; gamepad; accelerometer; clipboard-write"
        sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-popups"
        onLoad={() => setLoaded(true)}
      />

      {/* C-341 ledger write indicator — non-blocking, bottom-right, auto-fades */}
      {loaded && writeStatus !== 'idle' && (
        <div
          className={`pointer-events-none absolute bottom-3 right-3 z-30 font-mono text-[10px] tracking-wider px-2 py-1 rounded bg-black/60 transition-opacity duration-500 ${statusColor[writeStatus]}`}
          aria-live="polite"
        >
          {statusLabel[writeStatus]}
          {writeStatus === 'ok' && lastEventType === 'win' && (
            <span className="ml-1 text-amber-400">— cycle sealed</span>
          )}
        </div>
      )}

      {/* fog-of-integrity CSS overlay */}
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

      {/* CRT scanline overlay */}
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
