import { env } from '../../config/env';
import type { HiveCurrentCycle, HiveEvent, HiveQuest, HiveSentinel } from './meshWorldTypes';

/**
 * Default world base hierarchy (in priority order):
 *
 *  1. VITE_HIVE_WORLD_BASE_URL env var — explicit override (e.g. staging hive host)
 *  2. /api/hive/world — in-shell Vercel edge proxy (no GitHub Raw rate limits,
 *     adds 30s CDN cache, proper CORS; see api/hive/world.ts)
 *  3. Raw GitHub fallback — direct, no proxy (development / offline fallback)
 */
const IN_SHELL_PROXY_BASE = '/api/hive/world';
const DEFAULT_REMOTE_BASE = 'https://raw.githubusercontent.com/kaizencycle/mobius-hive/main';

function trimSlash(url: string): string {
  return url.replace(/\/+$/, '');
}

export function getHiveWorldBaseUrl(): string {
  const override = env.labs.hiveWorldBaseUrl;
  if (override && override.trim()) return trimSlash(override.trim());
  // In browser context: prefer the in-shell proxy (avoids raw GitHub rate limits).
  // In non-browser (CI, SSR) or when window is absent: fall back to direct GitHub.
  if (typeof window !== 'undefined') return IN_SHELL_PROXY_BASE;
  return DEFAULT_REMOTE_BASE;
}

/** Resolve a world-relative path to a full URL under the chosen base. */
export function hiveWorldUrl(path: string): string {
  const base = getHiveWorldBaseUrl();
  const clean = path.replace(/^\/+/, '');
  // The proxy expects paths rooted at 'world/' — strip it if using proxy.
  if (base === IN_SHELL_PROXY_BASE) {
    // Proxy path: /api/hive/world?path=world/current-cycle.json
    return `${base}?path=${encodeURIComponent(clean.startsWith('world/') ? clean : `world/${clean}`)}`;
  }
  // Remote base: append path directly
  return `${base}/${clean}`;
}

async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, {
    method: 'GET',
    cache: 'no-store',
    signal,
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }
  return (await res.json()) as T;
}

export interface HiveWorldBundle {
  currentCycle: HiveCurrentCycle;
  activeEvent: HiveEvent | null;
  activeQuest: HiveQuest | null;
  sentinel: HiveSentinel | null;
  sourceUrl: string;
}

export async function loadHiveWorldBundle(signal?: AbortSignal): Promise<HiveWorldBundle> {
  const base = getHiveWorldBaseUrl();
  const cycleUrl = `${base}/world/current-cycle.json`;

  const currentCycle = await fetchJson<HiveCurrentCycle>(cycleUrl, signal);

  const eventId = currentCycle.active_event_id;
  const questId = currentCycle.active_quest_id;
  const sentinelId = currentCycle.assigned_sentinel_id;

  const [activeEvent, activeQuest, sentinel] = await Promise.all([
    eventId
      ? fetchJson<HiveEvent>(`${base}/world/events/${eventId}.json`, signal).catch(() => null)
      : Promise.resolve(null),
    questId
      ? fetchJson<HiveQuest>(`${base}/world/quests/${questId}.json`, signal).catch(() => null)
      : Promise.resolve(null),
    sentinelId
      ? fetchJson<HiveSentinel>(`${base}/world/sentinels/${sentinelId}.json`, signal).catch(() => null)
      : Promise.resolve(null),
  ]);

  return {
    currentCycle,
    activeEvent,
    activeQuest,
    sentinel,
    sourceUrl: cycleUrl,
  };
}

export async function loadBundledHiveWorld(signal?: AbortSignal): Promise<HiveWorldBundle> {
  const cycleUrl = '/world/current-cycle.json';
  const currentCycle = await fetchJson<HiveCurrentCycle>(cycleUrl, signal);

  const eventId = currentCycle.active_event_id;
  const questId = currentCycle.active_quest_id;
  const sentinelId = currentCycle.assigned_sentinel_id;

  const [activeEvent, activeQuest, sentinel] = await Promise.all([
    eventId
      ? fetchJson<HiveEvent>(`/world/events/${eventId}.json`, signal).catch(() => null)
      : Promise.resolve(null),
    questId
      ? fetchJson<HiveQuest>(`/world/quests/${questId}.json`, signal).catch(() => null)
      : Promise.resolve(null),
    sentinelId
      ? fetchJson<HiveSentinel>(`/world/sentinels/${sentinelId}.json`, signal).catch(() => null)
      : Promise.resolve(null),
  ]);

  return {
    currentCycle,
    activeEvent,
    activeQuest,
    sentinel,
    sourceUrl: cycleUrl,
  };
}
