/**
 * C-357 Terminal API client — read-only, graceful degradation.
 */

import { env } from '../../../config/env';

const TERMINAL_BASE = env.terminalBase;

export interface SnapshotLite {
  gi: number;
  mode: 'green' | 'yellow' | 'degraded' | 'critical' | 'red';
  cycle: string;
  gi_verified?: boolean;
  gi_conflict?: boolean;
  ipi?: {
    score: number;
    state: string;
    fountain_status: 'confirmed' | 'conditional' | 'suspended';
    human_required: boolean;
    triggered_sentinels: string[];
  };
  echo_count?: number;
  tripwire_elevated?: number;
  kv_latency_ms?: number;
  pulse_age_seconds?: number;
  timestamp?: string;
  mii?: number;
  vault_balance?: number;
  agent_count?: number;
}

export interface JournalEntry {
  id?: string;
  agent?: string;
  message?: string;
  timestamp?: string;
  cycle?: string;
}

export async function fetchSnapshot(): Promise<SnapshotLite | null> {
  try {
    const res = await fetch(`${TERMINAL_BASE}/api/terminal/snapshot-lite`, {
      signal: AbortSignal.timeout(4000),
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    return res.json() as Promise<SnapshotLite>;
  } catch {
    return null;
  }
}

export async function fetchJournalFeed(limit = 20): Promise<JournalEntry[]> {
  try {
    const res = await fetch(
      `${TERMINAL_BASE}/api/agents/journal?limit=${limit}`,
      { signal: AbortSignal.timeout(5000) },
    );
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : data.items ?? [];
  } catch {
    return [];
  }
}

export async function fetchEchoDigest(): Promise<unknown | null> {
  try {
    const res = await fetch(`${TERMINAL_BASE}/api/echo/digest`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function fetchTripwireState(): Promise<unknown | null> {
  try {
    const res = await fetch(`${TERMINAL_BASE}/api/tripwires/state`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}
