// src/lib/oaa/mic.ts — C-355 MIC Reward + Ledger Attestation

export interface LearningAttestation {
  type: 'learning_attestation';
  user_id: string;
  course_id: string;
  score: number;
  lip_score: number;
  jade_reflection_hash: string;
  mic_reward: number;
  timestamp: string;
}

export interface MICRewardBreakdown {
  base: number;
  highRetentionBonus: number;
  reflectionBonus: number;
  jadeDepthBonus: number;
  total: number;
}

export function computeMICReward(
  score: number,
  hasReflection: boolean,
  jadeDepth = 0
): MICRewardBreakdown {
  const base = score >= 0.8 ? 5 : 0;
  const highRetentionBonus = score >= 0.9 ? 5 : 0;
  const reflectionBonus = hasReflection ? 3 : 0;
  const jadeDepthBonus = jadeDepth >= 0.7 ? 5 : 0;
  return {
    base,
    highRetentionBonus,
    reflectionBonus,
    jadeDepthBonus,
    total: base + highRetentionBonus + reflectionBonus + jadeDepthBonus,
  };
}

// Simple deterministic hash for the reflection text (no crypto needed client-side)
export function hashReflection(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const chr = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return `jade-${Math.abs(hash).toString(16).padStart(8, '0')}`;
}

// Attests to the ledger via the existing earnMIC function from WalletContext.
// Returns the attestation object for local record-keeping.
export function buildAttestation(
  userId: string,
  courseId: string,
  score: number,
  lipScore: number,
  reflectionText: string,
  micReward: number
): LearningAttestation {
  return {
    type: 'learning_attestation',
    user_id: userId,
    course_id: courseId,
    score,
    lip_score: lipScore,
    jade_reflection_hash: hashReflection(reflectionText),
    mic_reward: micReward,
    timestamp: new Date().toISOString(),
  };
}
