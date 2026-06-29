/**
 * C-357 CPC API client — authenticated writes + local attestation queue.
 */

import { env } from '../../../config/env';
import { getLocal, setLocal, KEYS } from '../storage';

const CPC_BASE = env.cpcBase;

export interface LearningAttestation {
  type: 'learning_attestation';
  user_civic_id: string;
  course_id: string;
  quiz_score: number;
  lip_score: number;
  jade_reflection_hash: string;
  mic_reward: number;
  timestamp: string;
}

async function getCPCToken(civicId: string | null): Promise<string | null> {
  if (!civicId) return null;
  try {
    const res = await fetch(`${env.identityBase}/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        civic_id: civicId,
        service: 'browser-shell',
      }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data = await res.json() as { token?: string };
    return data.token ?? null;
  } catch {
    return null;
  }
}

function queueAttestationLocally(attestation: LearningAttestation): void {
  const queue = getLocal<LearningAttestation[]>(KEYS.ATTESTATION_QUEUE, []);
  queue.push(attestation);
  setLocal(KEYS.ATTESTATION_QUEUE, queue);
}

export async function mintLearningMIC(
  attestation: LearningAttestation,
): Promise<{ success: boolean; mic_minted: number; error?: string }> {
  const token = await getCPCToken(attestation.user_civic_id);
  if (!token) {
    queueAttestationLocally(attestation);
    return { success: false, mic_minted: 0, error: 'cpc_unavailable' };
  }

  try {
    const res = await fetch(`${CPC_BASE}/ledger/attest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(attestation),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { detail?: string };
      return { success: false, mic_minted: 0, error: err.detail ?? 'attest_failed' };
    }

    const data = await res.json() as { mic_minted?: number };
    return { success: true, mic_minted: data.mic_minted ?? attestation.mic_reward };
  } catch {
    queueAttestationLocally(attestation);
    return { success: false, mic_minted: 0, error: 'network_error' };
  }
}

export async function fetchWalletBalance(
  civicId: string,
): Promise<{ mic_balance: number; mic_reserved: number } | null> {
  try {
    const res = await fetch(
      `${CPC_BASE}/api/wallet/balance?civic_id=${encodeURIComponent(civicId)}`,
      { signal: AbortSignal.timeout(5000) },
    );
    if (!res.ok) return null;
    const data = await res.json() as { mic_balance: number; mic_reserved: number };
    setLocal(KEYS.MIC_BALANCE_CACHE, {
      ...data,
      civic_id: civicId,
      cached_at: new Date().toISOString(),
    });
    return data;
  } catch {
    return null;
  }
}

export function getCachedWalletBalance(
  civicId: string,
): { mic_balance: number; mic_reserved: number } | null {
  const cached = getLocal<{
    civic_id: string;
    mic_balance: number;
    mic_reserved: number;
  } | null>(KEYS.MIC_BALANCE_CACHE, null);
  if (!cached || cached.civic_id !== civicId) return null;
  return { mic_balance: cached.mic_balance, mic_reserved: cached.mic_reserved };
}

export async function fetchReserveBlockIndex(): Promise<unknown | null> {
  try {
    const res = await fetch(`${CPC_BASE}/api/reserve-blocks/index`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function retryQueuedAttestations(): Promise<void> {
  const queue = getLocal<LearningAttestation[]>(KEYS.ATTESTATION_QUEUE, []);
  if (queue.length === 0) return;

  const remaining: LearningAttestation[] = [];
  for (const attestation of queue) {
    const token = await getCPCToken(attestation.user_civic_id);
    if (!token) {
      remaining.push(attestation);
      continue;
    }
    const result = await mintLearningMIC(attestation);
    if (!result.success) remaining.push(attestation);
  }
  setLocal(KEYS.ATTESTATION_QUEUE, remaining);
}
