import { useCallback, useEffect, useRef, useState } from 'react';
import { getHiveWorldBaseUrl, hiveWorldUrl } from '../src/lib/meshWorldFetch';

export interface HiveCycleData {
  cycle_id: string;
  updated_at: string;
  rules_fired: string[];
  active_event_id: string | null;
  active_quest_id: string | null;
  active_sentinel_id: string | null;
  signals: {
    gi: number;
    kv_status: string;
    vault_progress: number;
  };
  ingest_health: {
    terminal_snapshot: boolean;
    cycle_state: boolean;
    mobius_pulse: boolean;
    oaa_kv_latest: boolean;
  };
}

export interface HiveEventData {
  id: string;
  title: string;
  description: string;
  tone: string;
  severity: string;
  ui: { overlay: string; color: string; priority: number };
  expires_at?: string | null;
  updated_at: string;
}

export interface HiveQuestStep {
  id: string;
  label: string;
  completed: boolean;
}

export interface HiveQuestData {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'completed' | 'failed';
  progress: number;
  steps: HiveQuestStep[];
  updated_at: string;
}

export interface HiveSentinelData {
  id: string;
  name: string;
  role?: string;
  lines?: string[];
}

/**
 * Chronicle entry — one citizen deed recorded back into world state.
 * Matches the C-341 Brief E spec; written by world-update.yml (C-346 FIX-6)
 * either to world/citizen-history.json or under current-world.json's
 * `citizen_history` field. The shell reads both, dedup-free, best-effort.
 */
export interface CitizenHistoryEntry {
  cycle_id: string;
  civic_id: string;
  zone: string;
  action: string;
  summary: string;
  at: string;
}

export interface HiveWorldData {
  cycle: HiveCycleData;
  event: HiveEventData | null;
  quest: HiveQuestData | null;
  sentinels: HiveSentinelData[];
  activeSentinelId: string | null;
  citizenHistory: CitizenHistoryEntry[] | null;
  sourceUrl: string;
}

// GI can change on seal events (seconds), so we poll more aggressively than the
// hourly world-update — but only while the chamber tab is visible (SHELL-9).
const POLL_MS = 30_000;
// When the tab is hidden, we skip the network call and re-check this often.
const HIDDEN_BACKOFF_MS = 5_000;

async function safeFetch<T>(url: string, signal: AbortSignal): Promise<T | null> {
  try {
    const res = await fetch(url, { cache: 'no-store', signal });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/**
 * Resolve current-cycle.json with a three-tier priority:
 *  1. In-shell proxy  /api/hive/world?path=world/current-cycle.json (CDN-cached, no rate limits)
 *  2. Remote fallback  raw GitHub (if proxy fails — e.g. local dev without edge fn)
 *  3. Bundled copy     /world/current-cycle.json (public/ — always works offline)
 */
async function resolveCycle(signal: AbortSignal): Promise<{ cycle: HiveCycleData; usedProxy: boolean }> {
  const proxyUrl  = hiveWorldUrl('world/current-cycle.json');
  const remoteUrl = `https://raw.githubusercontent.com/kaizencycle/mobius-hive/main/world/current-cycle.json`;
  const localUrl  = '/world/current-cycle.json';

  for (const [url, isProxy] of [[proxyUrl, true], [remoteUrl, false], [localUrl, false]] as const) {
    try {
      const res = await fetch(url, { cache: proxyUrl === url ? 'default' : 'no-store', signal });
      if (res.ok) {
        return { cycle: (await res.json()) as HiveCycleData, usedProxy: isProxy };
      }
    } catch { /* try next */ }
  }
  throw new Error('HIVE world state unavailable — all sources failed');
}

/** Coerce an unknown payload into a CitizenHistoryEntry[] (newest first), or null. */
function normalizeHistory(raw: unknown): CitizenHistoryEntry[] | null {
  const arr = Array.isArray(raw)
    ? raw
    : isRecord(raw) && Array.isArray(raw['citizen_history'])
      ? (raw['citizen_history'] as unknown[])
      : null;
  if (!arr) return null;

  const entries = arr
    .filter(isRecord)
    .map((r): CitizenHistoryEntry => ({
      cycle_id: typeof r['cycle_id'] === 'string' ? r['cycle_id'] : '',
      civic_id: typeof r['civic_id'] === 'string' ? r['civic_id'] : '',
      zone: typeof r['zone'] === 'string' ? r['zone'] : '',
      action: typeof r['action'] === 'string' ? r['action'] : '',
      summary: typeof r['summary'] === 'string' ? r['summary'] : '',
      at: typeof r['at'] === 'string' ? r['at'] : '',
    }));
  if (entries.length === 0) return null;

  // Newest first — the panel shows the most recent deeds.
  return entries.sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Resolve the Chronicle (citizen_history) with two best-effort sources:
 *   1. world/citizen-history.json — dedicated file (preferred)
 *   2. citizen_history field inside world/current-world.json (C-346 FIX-6)
 * Returns null when neither exists — the panel renders "Chronicle empty".
 */
async function loadCitizenHistory(signal: AbortSignal): Promise<CitizenHistoryEntry[] | null> {
  const direct = await safeFetch<unknown>(hiveWorldUrl('world/citizen-history.json'), signal);
  const fromDirect = normalizeHistory(direct);
  if (fromDirect) return fromDirect;

  const world = await safeFetch<unknown>(hiveWorldUrl('world/current-world.json'), signal);
  return normalizeHistory(world);
}

async function loadWorld(signal: AbortSignal): Promise<HiveWorldData> {
  const { cycle, usedProxy } = await resolveCycle(signal);

  // Use proxy-aware URL builder for sub-resources so they also go through the edge
  const eventUrl = (id: string) => hiveWorldUrl(`world/events/${id}.json`);
  const questUrl = (id: string) => hiveWorldUrl(`world/quests/${id}.json`);
  const sentinelUrl = (id: string) => hiveWorldUrl(`world/sentinels/${id}.json`);
  const sentinelIndexUrl = hiveWorldUrl('world/sentinels/index.json');

  const [event, quest, sentinelIndex, citizenHistory] = await Promise.all([
    cycle.active_event_id
      ? safeFetch<HiveEventData>(eventUrl(cycle.active_event_id), signal)
      : Promise.resolve(null),
    cycle.active_quest_id
      ? safeFetch<HiveQuestData>(questUrl(cycle.active_quest_id), signal)
      : Promise.resolve(null),
    safeFetch<string[]>(sentinelIndexUrl, signal),
    loadCitizenHistory(signal),
  ]);

  const ids = sentinelIndex ?? (cycle.active_sentinel_id ? [cycle.active_sentinel_id] : []);
  const sentinelResults = await Promise.all(
    ids.map((id) => safeFetch<HiveSentinelData>(sentinelUrl(id), signal)),
  );
  const sentinels = sentinelResults.filter((s): s is HiveSentinelData => s !== null);

  return {
    cycle,
    event,
    quest,
    sentinels,
    activeSentinelId: cycle.active_sentinel_id,
    citizenHistory,
    sourceUrl: usedProxy ? '/api/hive/world (proxy)' : 'bundled',
  };
}

export function useHiveWorld(): {
  world: HiveWorldData | null;
  loading: boolean;
  error: string | null;
  lastFetched: Date | null;
  refresh: () => void;
} {
  const [world, setWorld] = useState<HiveWorldData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const refresh = useCallback(() => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setLoading(true);
    loadWorld(ctrl.signal)
      .then((data) => {
        if (ctrl.signal.aborted) return;
        setWorld(data);
        setLastFetched(new Date());
        setError(null);
      })
      .catch((err: unknown) => {
        if (ctrl.signal.aborted) return;
        setError(err instanceof Error ? err.message : 'HIVE world state unreachable');
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });
  }, []);

  // SHELL-9: visibilitychange-aware polling. While the HIVE chamber tab is
  // hidden we skip the network call entirely (no warm serverless functions, no
  // wasted re-renders) and re-check on a short backoff. On tab focus we refresh
  // immediately, then resume the foreground cadence.
  useEffect(() => {
    refresh();

    let timer: ReturnType<typeof setTimeout> | undefined;

    const scheduleNext = () => {
      timer = setTimeout(tick, document.hidden ? HIDDEN_BACKOFF_MS : POLL_MS);
    };
    const tick = () => {
      if (!document.hidden) refresh();
      scheduleNext();
    };
    scheduleNext();

    const onVisibility = () => {
      if (document.hidden) return;
      refresh(); // immediate refresh on tab focus
      if (timer) clearTimeout(timer);
      scheduleNext(); // reset to the foreground cadence
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      if (timer) clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisibility);
      abortRef.current?.abort();
    };
  }, [refresh]);

  return { world, loading, error, lastFetched, refresh };
}
