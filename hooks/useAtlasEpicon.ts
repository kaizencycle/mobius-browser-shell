// hooks/useAtlasEpicon.ts
// C-307 · ATLAS · lesson completion → EPICON substrate write
import { env } from '../config/env';

interface LessonPayload {
  citizenId: string;
  lessonId: string;
  xpEarned: number;
  cycle: string;
  gi: number;
}

export async function emitLessonEpicon(payload: LessonPayload): Promise<void> {
  const ledgerUrl = env.api.ledger;
  if (!ledgerUrl) {
    console.warn('[ATLAS] EPICON emit skipped — ledger not configured');
    return;
  }

  const body = {
    type: 'EPICON',
    agent: 'ATLAS',
    intent: 'lesson-completion',
    cycle: payload.cycle,
    gi: payload.gi,
    citizenId: payload.citizenId,
    lessonId: payload.lessonId,
    xpEarned: payload.xpEarned,
    timestamp: new Date().toISOString(),
  };

  try {
    await fetch(`${ledgerUrl}/epicon`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (err) {
    // Non-fatal — citizen XP is already awarded locally
    console.error('[ATLAS] EPICON emit failed', err);
  }
}
