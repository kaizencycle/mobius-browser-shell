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
  gi: number;
  cycle: string;
  mode: 'green' | 'yellow' | 'red';
  vault_balance?: number;
  agent_count?: number;
  mii?: number;
}

export interface IntegrityStatus {
  gi: number;
  mode: 'green' | 'yellow' | 'red';
  alert?: { id: string; title: string; severity: 'warning' | 'critical' };
  agents?: Array<{ id: string; status: 'active' | 'thinking' | 'idle' | 'warning'; last_seen: string | null }>;
}

export interface EPICONEntry {
  id: string;
  intent: string;
  cycle: string;
  status: 'pending' | 'executed' | 'failed' | 'superseded';
  agent?: string;
  ts?: string;
}

export const terminalBridge = {
  snapshotLite: () => fetchJSON<SnapshotLite>(`${BASE}/api/terminal/snapshot-lite`, 30_000),
  integrityStatus: () => fetchJSON<IntegrityStatus>(`${BASE}/api/integrity-status`, 30_000),
  epiconFeed: (limit = 20) => fetchJSON<EPICONEntry[]>(`${BASE}/api/epicon/feed?limit=${limit}`, 60_000),
  vaultStatus: () => fetchJSON<unknown>(`${BASE}/api/vault/status`, 60_000),
};
