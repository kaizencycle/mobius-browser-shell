/**
 * HiveGameEmbed — renders the deployed Higgsfield HIVE game as a full-height
 * iframe inside the chamber, with three integration layers:
 *
 *   1. ?data= passthrough — game overlays the shell's live current-world.json,
 *      so both surfaces read the same substrate state.
 *   2. postMessage listener (C-341 write-back) — game emits events on every
 *      realm seal / fountain restore; shell catches them and POSTs to
 *      /ledger/attest via the existing submitAttestation helper. This closes
 *      the Sweep → Seal → Ledger loop the game's comment block promises.
 *   3. Fog-of-integrity CSS overlay — shell-side radial gradient driven by GI,
 *      keeping the chamber chrome and the game interior atmospherically unified.
 *
 * Payload contract (from game.js emitEvent):
 *   { source: "mobius-hive-sim", type, cycle, live, gi, vault, mic,
 *     sealed, total, won, ts, realm?, realmTitle?, realmColor? }
 *
 * Types we attest:
 *   "seal"          → citizen sealed a realm beacon
 *   "win"           → citizen restored the Forge Fountain (cycle complete)
 *   "fountain_ready"→ all realms sealed, fountain now unlockable
 *
 * Types we silently ignore (not consequential enough to attest):
 *   "start", "ready" — game lifecycle, not player actions
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { getHiveWorldBaseUrl } from '../../../src/lib/meshWorldFetch';
import { submitAttestation } from '../../../src/lib/epicon-attest';
import { env } from '../../../config/env';

const GAME_BASE_URL =
  (import.meta.env.VITE_HIVE_URL as string | undefined)?.trim() ||
  'https://solid-crystal-164.higgsfield.gg/';

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

// Map a game event to an attestation.
// Returns null for event types that don't warrant ledger writes.
function toAttestation(
  ev: HiveGameEvent,
  civicId: string,
): Parameters<typeof submitAttestation>[0] | null {
  const cycle = ev.cycle ?? 'C-?';
  const gi = ev.gi ?? 0;
  const vault = ev.vault ?? 0;

  if (ev.type === 'seal' && ev.realm) {
    return {
      civic_id: civicId,
      event_type: 'community-action',
      title: `Realm sealed: ${ev.realmTitle ?? ev.realm}`,
      summary: `A citizen swept the Signal Fog from ${ev.realmTitle ?? ev.realm} ` +
        `and lit its beacon. Cycle ${cycle}. ` +
        `Realms sealed: ${ev.sealed ?? '?'}/${ev.total ?? '?'}. ` +
        `GI after seal: ${gi.toFixed(3)}.`,
      location: ev.realm,
      evidence: JSON.stringify({ realm: ev.realm, sealed: ev.sealed, total: ev.total, gi, vault }),
      confidence: 0.95,
    };
  }

  if (ev.type === 'win') {
    return {
      civic_id: civicId,
      event_type: 'governance-event',
      title: `Forge Fountain restored — ${cycle}`,
      summary: `A citizen restored the Forge Fountain, completing the cycle. ` +
        `All ${ev.total ?? '?'} realms sealed. ` +
        `Final GI: ${gi.toFixed(3)}, vault: ${(vault * 100).toFixed(1)}%. ` +
        `Cycle: ${cycle}.`,
      location: 'forge-of-civilization',
      evidence: JSON.stringify({ cycle, gi, vault, mic: ev.mic, live: ev.live }),
      confidence: 1.0,
    };
  }

  if (ev.type === 'fountain_ready') {
    return {
      civic_id: civicId,
      event_type: 'civic-observation',
      title: `Fountain ready — all realms sealed (${cycle})`,
      summary: `All ${ev.total ?? '?'} realms sealed this session. ` +
        `The Forge Fountain is unlocked and awaiting final restoration. ` +
        `GI: ${gi.toFixed(3)}.`,
      location: 'forge-of-civilization',
      evidence: JSON.stringify({ cycle, gi, vault, total: ev.total }),
      confidence: 0.95,
    };
  }

  return null; // "start", "ready", unknown — do not attest
}

interface HiveGameEmbedProps {
  gi: number | null;
  worldMood: string | null;
  cycle: string | null;
}

// Status of the most recent ledger write — shown as a small non-blocking
// indicator so the player knows their deed was recorded.
type WriteStatus = 'idle' | 'writing' | 'ok' | 'fail';

export const HiveGameEmbed: React.FC<HiveGameEmbedProps> = ({ gi, worldMood, cycle }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [muted] = useState(true);
  const [writeStatus, setWriteStatus] = useState<WriteStatus>('idle');
  const [lastEventType, setLastEventType] = useState<string | null>(null);
  const civicId = useRef(getOrCreateCivicId());
  // Deduplicate: track which (type+realm+cycle) tuples have been attested this
  // session to prevent double-writes if the game emits twice (e.g. on remount).
  const attested = useRef(new Set<string>());

  // Pass ?data= so the game overlays the shell's live current-world.json.
  const gameUrl = useCallback(() => {
    const base = getHiveWorldBaseUrl();
    const url = new URL(GAME_BASE_URL);
    if (base.startsWith('http')) url.searchParams.set('data', base);
    if (muted) url.searchParams.set('muted', '1');
    return url.toString();
  }, [muted]);

  // C-341 write-back: listen for postMessage from the game iframe.
  useEffect(() => {
    if (!env.api.ledger) return; // ledger not configured — skip silently

    const handler = async (ev: MessageEvent) => {
      if (!isHiveEvent(ev.data)) return;
      const gameEv = ev.data;

      const attestation = toAttestation(gameEv, civicId.current);
      if (!attestation) return;

      // Dedup key: type + realm (or 'none') + cycle
      const dedupKey = `${gameEv.type}:${gameEv.realm ?? 'none'}:${gameEv.cycle ?? '?'}`;
      if (attested.current.has(dedupKey)) return;
      attested.current.add(dedupKey);

      setLastEventType(gameEv.type);
      setWriteStatus('writing');

      const result = await submitAttestation(attestation);
      setWriteStatus(result.ok ? 'ok' : 'fail');

      // Clear indicator after 4s so it doesn't clutter the screen
      setTimeout(() => setWriteStatus('idle'), 4000);
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []); // stable — civicId.current, attested.current are refs

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
        src={gameUrl()}
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
