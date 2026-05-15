import { useState, useEffect, useCallback } from 'react';
import type { VaultSeal, VaultMetrics, VaultState } from '../types';
import { env } from '../config/env';

const POLL_MS = 60_000;
const LEDGER_BASE = env.api.ledger;
const TERMINAL_VAULT_URL = `${env.terminalOrigin}/api/vault/seals`;

async function fetchVaultState(): Promise<VaultState> {
  try {
    const [metricsRes, sealsRes] = await Promise.all([
      fetch(`${LEDGER_BASE}/vault/metrics`, { signal: AbortSignal.timeout(5000) }),
      fetch(`${LEDGER_BASE}/vault/seals?limit=20&sort=desc`, { signal: AbortSignal.timeout(5000) }),
    ]);
    if (metricsRes.ok && sealsRes.ok) {
      const metrics = await metricsRes.json() as VaultMetrics;
      const raw = await sealsRes.json();
      const seals = Array.isArray(raw) ? raw : ((raw as { seals?: VaultSeal[] }).seals ?? []);
      return { metrics, seals, fetched_at: new Date().toISOString(), ledger_ok: true };
    }
  } catch { /* fall through */ }

  try {
    const res = await fetch(TERMINAL_VAULT_URL, { signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      const data = await res.json() as { metrics?: VaultMetrics; seals?: VaultSeal[] };
      const seals = data.seals ?? [];
      return {
        metrics: data.metrics ?? buildMetricsFromSeals(seals),
        seals,
        fetched_at: new Date().toISOString(),
        ledger_ok: false,
      };
    }
  } catch { /* both failed */ }

  return { metrics: emptyMetrics(), seals: [], fetched_at: new Date().toISOString(), ledger_ok: false };
}

function buildMetricsFromSeals(seals: VaultSeal[]): VaultMetrics {
  const count = (s: string) => seals.filter(x => x.status === s).length;
  return {
    total_seals: seals.length,
    sealed: count('sealed'),
    quarantined: count('quarantined'),
    pending: count('pending'),
    reattestation: count('reattestation'),
    total_mic_reserved: seals.reduce((sum, s) => sum + (s.mic_reserved ?? 0), 0),
    chain_length: seals.length,
    last_seal_at: seals[0]?.sealed_at ?? null,
    chain_valid: true,
  };
}

function emptyMetrics(): VaultMetrics {
  return {
    total_seals: 0, sealed: 0, quarantined: 0, pending: 0, reattestation: 0,
    total_mic_reserved: 0, chain_length: 0, last_seal_at: null, chain_valid: false,
  };
}

export function useVaultState() {
  const [state, setState] = useState<VaultState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await fetchVaultState();
      setState(data);
      setError(null);
    } catch {
      setError('Vault state fetch failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), POLL_MS);
    return () => clearInterval(t);
  }, [load]);

  return { state, loading, error, refresh: load };
}
