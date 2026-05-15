import { env } from '../config/env';

const BASE = env.terminalOrigin;

interface CacheEntry { data: unknown; ts: number }
const cache = new Map<string, CacheEntry>();

async function fetchJSON<T>(url: string, ttl = 30_000): Promise<T> {
  const cached = cache.get(url);
  if (cached && Date.now() - cached.ts < ttl) return cached.data as T;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  const data = await res.json() as T;
  cache.set(url, { data, ts: Date.now() });
  return data;
}

export interface SnapshotLite {
  gi: number | null;
  cycle: string;
  mode: 'green' | 'yellow' | 'red' | null;
  degraded?: boolean;
  vault_balance?: number;
  agent_count?: number;
  mii?: number;
}

export interface SentinelEntry {
  id?: string;
  name?: string;
  active?: boolean;
  heartbeatOk?: boolean;
  confidence?: number;
  score?: number;
}

export interface IntegrityStatus {
  global_integrity: number | null;
  mode: 'green' | 'yellow' | 'red' | null;
  degraded?: boolean;
  gi_age_seconds?: number;
  terminal_status?: string;
  agents?: SentinelEntry[];
  sentinels?: SentinelEntry[];
}

export interface EPICONEntry {
  id: string;
  intent?: string;
  action?: string;
  cycle?: string;
  status?: string;
  agent?: string;
  timestamp?: string;
  ts?: string;
  type?: string;
}

interface EPICONFeedResponse {
  ok: boolean;
  items: EPICONEntry[];
  count: number;
  total: number;
  hasMore: boolean;
  degraded?: boolean;
}

export const terminalBridge = {
  baseUrl: BASE,
  snapshotLite: () => fetchJSON<SnapshotLite>(`${BASE}/api/terminal/snapshot-lite`, 30_000),
  integrityStatus: () => fetchJSON<IntegrityStatus>(`${BASE}/api/integrity-status`, 30_000),
  epiconFeed: async (limit = 20): Promise<EPICONEntry[]> => {
    const res = await fetchJSON<EPICONFeedResponse>(
      `${BASE}/api/epicon/feed?limit=${limit}`,
      60_000,
    );
    return res.items ?? [];
  },
  vaultStatus: () => fetchJSON<unknown>(`${BASE}/api/vault/status`, 60_000),
};
