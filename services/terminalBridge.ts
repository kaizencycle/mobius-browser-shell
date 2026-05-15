import { env } from '../config/env';

const DEFAULT_TTL_MS = 30_000;
const TERMINAL_BASE = env.terminalOrigin.replace(/\/+$/, '');

type CacheEntry<T> = {
  data: T;
  ts: number;
};

const cache = new Map<string, CacheEntry<unknown>>();

async function fetchJSON<T>(path: string, ttl = DEFAULT_TTL_MS): Promise<T> {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${TERMINAL_BASE}${normalizedPath}`;
  const cached = cache.get(url) as CacheEntry<T> | undefined;

  if (cached && Date.now() - cached.ts < ttl) {
    return cached.data;
  }

  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
    signal: AbortSignal.timeout(8_000),
  });

  if (!response.ok) {
    throw new Error(`Terminal request failed: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as T;
  cache.set(url, { data, ts: Date.now() });
  return data;
}

export interface TerminalSnapshotLite {
  cycle?: string;
  gi?: number;
  mode?: 'green' | 'yellow' | 'red' | string;
  vault_balance?: number;
  agent_count?: number;
  heartbeat?: unknown;
  [key: string]: unknown;
}

export interface TerminalSentinelStatus {
  id?: string;
  name?: string;
  status?: string;
  active?: boolean;
  heartbeatOk?: boolean;
  last_seen?: string;
  lastSeen?: string;
  confidence?: number;
  score?: number;
  role?: string;
  [key: string]: unknown;
}

export interface TerminalIntegrityStatus {
  gi?: number;
  mode?: string;
  alert?: {
    id?: string;
    title?: string;
    severity?: string;
  };
  sentinels?: TerminalSentinelStatus[];
  agents?: TerminalSentinelStatus[];
  [key: string]: unknown;
}

export interface TerminalEpiconEntry {
  id?: string;
  intent?: string;
  cycle?: string;
  status?: string;
  agent?: string;
  timestamp?: string;
  created_at?: string;
  [key: string]: unknown;
}

export const terminalBridge = {
  baseUrl: TERMINAL_BASE,

  snapshotLite(ttl?: number) {
    return fetchJSON<TerminalSnapshotLite>('/api/terminal/snapshot-lite', ttl);
  },

  integrityStatus(ttl?: number) {
    return fetchJSON<TerminalIntegrityStatus>('/api/integrity-status', ttl);
  },

  epiconFeed(limit = 20, ttl?: number) {
    return fetchJSON<TerminalEpiconEntry[]>(`/api/epicon/feed?limit=${limit}`, ttl);
  },
};

export function clearTerminalBridgeCache(): void {
  cache.clear();
}
