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

export const terminalBridge = {
  baseUrl: TERMINAL_BASE,

  snapshotLite(ttl?: number) {
    return fetchJSON<TerminalSnapshotLite>('/api/terminal/snapshot-lite', ttl);
  },
};

export function clearTerminalBridgeCache(): void {
  cache.clear();
}
