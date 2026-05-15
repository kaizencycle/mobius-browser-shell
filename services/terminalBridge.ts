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

export interface TerminalIntegrityStatus {
  gi?: number;
  alert?: {
    id?: string;
    title?: string;
    severity?: 'info' | 'warning' | 'critical' | string;
  };
  sentinels?: unknown[];
  agents?: unknown[];
  [key: string]: unknown;
}

export interface TerminalEpiconEntry {
  id?: string;
  intent?: string;
  cycle?: string;
  status?: string;
  timestamp?: string;
  [key: string]: unknown;
}

export interface TerminalVaultStatus {
  balance?: number;
  vault_balance?: number;
  current_cycle?: string;
  cycle?: string;
  last_attestation_gi?: number;
  gi_at_last_attestation?: number;
  reserved_mic?: number;
  reserve_blocks?: number;
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

  vaultStatus(ttl?: number) {
    return fetchJSON<TerminalVaultStatus>('/api/vault/status', ttl);
  },

  laneDiagnostics(ttl?: number) {
    return fetchJSON<unknown>('/api/chambers/lane-diagnostics', ttl);
  },
};

export function clearTerminalBridgeCache(): void {
  cache.clear();
}
