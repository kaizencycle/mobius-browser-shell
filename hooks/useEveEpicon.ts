// hooks/useEveEpicon.ts
// C-307 · EVE · reflection completion → EPICON substrate write (body-hash, no PII)
import { env } from '../config/env';

interface ReflectionPayload {
  citizenId: string;
  entryId: string;
  bodyHash: string;
  wordCount: number;
  completedPhases: number;
  rewardTier: string;
  mic: number;
  cycle: string | null;
  gi: number | null;
}

async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function hashReflectionBody(body: string): Promise<string> {
  return sha256Hex(body);
}

export async function emitReflectionEpicon(payload: ReflectionPayload): Promise<void> {
  const ledgerUrl = env.api.ledger;
  if (!ledgerUrl) {
    console.warn('[EVE] EPICON emit skipped — ledger not configured');
    return;
  }

  const body = {
    type: 'EPICON',
    agent: 'EVE',
    intent: 'reflection-completion',
    cycle: payload.cycle,
    gi: payload.gi,
    citizenId: payload.citizenId,
    entryId: payload.entryId,
    bodyHash: payload.bodyHash,
    wordCount: payload.wordCount,
    completedPhases: payload.completedPhases,
    rewardTier: payload.rewardTier,
    mic: payload.mic,
    timestamp: new Date().toISOString(),
  };

  try {
    await fetch(`${ledgerUrl}/epicon`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (err) {
    // Non-fatal — citizen MIC is already awarded locally
    console.error('[EVE] EPICON emit failed', err);
  }
}
