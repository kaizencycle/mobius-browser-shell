import { env } from '../../config/env';
import type { HiveCurrentCycle, HiveEvent, HiveQuest, HiveSentinel } from './meshWorldTypes';

const DEFAULT_REMOTE_BASE =
  'https://raw.githubusercontent.com/kaizencycle/mobius-hive/main';

function trimSlash(url: string): string {
  return url.replace(/\/+$/, '');
}

export function getHiveWorldBaseUrl(): string {
  const raw = env.labs.hiveWorldBaseUrl;
  return trimSlash((raw && raw.trim()) || DEFAULT_REMOTE_BASE);
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
