import { useCallback, useEffect, useRef, useState } from 'react';
import { getHiveWorldBaseUrl } from '../src/lib/meshWorldFetch';

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

export interface HiveWorldData {
  cycle: HiveCycleData;
  event: HiveEventData | null;
  quest: HiveQuestData | null;
  sentinels: HiveSentinelData[];
  activeSentinelId: string | null;
  sourceUrl: string;
}

const POLL_MS = 60_000;

async function safeFetch<T>(url: string, signal: AbortSignal): Promise<T | null> {
  try {
    const res = await fetch(url, { cache: 'no-store', signal });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/** Try remote base first; fall back to bundled /world/ files served by the shell. */
async function resolveCycle(signal: AbortSignal): Promise<{ cycle: HiveCycleData; base: string }> {
  const remoteBase = getHiveWorldBaseUrl();
  const remoteUrl  = `${remoteBase}/world/current-cycle.json`;
  const localBase  = '';          // relative — Vite serves public/world/ at /world/
  const localUrl   = '/world/current-cycle.json';

  // Try remote
  try {
    const res = await fetch(remoteUrl, { cache: 'no-store', signal });
    if (res.ok) {
      return { cycle: (await res.json()) as HiveCycleData, base: remoteBase };
    }
  } catch { /* fall through to bundled copy */ }

  // Fall back to bundled public/world/ files
  const res = await fetch(localUrl, { cache: 'no-store', signal });
  if (!res.ok) throw new Error(`HIVE world state unavailable (HTTP ${res.status})`);
  return { cycle: (await res.json()) as HiveCycleData, base: localBase };
}

async function loadWorld(signal: AbortSignal): Promise<HiveWorldData> {
  const { cycle, base } = await resolveCycle(signal);

  const [event, quest, sentinelIndex] = await Promise.all([
    cycle.active_event_id
      ? safeFetch<HiveEventData>(`${base}/world/events/${cycle.active_event_id}.json`, signal)
      : Promise.resolve(null),
    cycle.active_quest_id
      ? safeFetch<HiveQuestData>(`${base}/world/quests/${cycle.active_quest_id}.json`, signal)
      : Promise.resolve(null),
    safeFetch<string[]>(`${base}/world/sentinels/index.json`, signal),
  ]);

  const ids = sentinelIndex ?? (cycle.active_sentinel_id ? [cycle.active_sentinel_id] : []);
  const sentinelResults = await Promise.all(
    ids.map((id) => safeFetch<HiveSentinelData>(`${base}/world/sentinels/${id}.json`, signal)),
  );
  const sentinels = sentinelResults.filter((s): s is HiveSentinelData => s !== null);

  return {
    cycle,
    event,
    quest,
    sentinels,
    activeSentinelId: cycle.active_sentinel_id,
    sourceUrl: `${base}/world/current-cycle.json`,
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

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, POLL_MS);
    return () => {
      clearInterval(interval);
      abortRef.current?.abort();
    };
  }, [refresh]);

  return { world, loading, error, lastFetched, refresh };
}
