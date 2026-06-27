// src/lib/oaa/lip.ts — C-355 Learning Integrity Pressure (LIP) Formula
// Mirror of IPI. Anti-farm signal for the OAA loop.
// LIP = swipe_velocity × quiz_variance × retention_decay × reflection_quality

export interface LIPComponents {
  swipe_velocity: number;    // [0,1] — normalized speed relative to expected view time
  quiz_variance: number;     // [0,1] — score inconsistency proxy
  retention_decay: number;   // [0,1] — drop from immediate vs delayed recall (Phase 2+)
  reflection_quality: number; // [0,1] — inverse of semantic depth (0 = great question)
}

export interface LIPResult {
  score: number;
  state: 'normal' | 'suspicious' | 'elevated' | 'farming';
  requires_secondary_gate: boolean;
  session_paused: boolean;
}

export function computeLIP(components: LIPComponents): LIPResult {
  const { swipe_velocity, quiz_variance, retention_decay, reflection_quality } = components;

  // Weighted combination — swipe velocity and quiz variance are the primary signals
  const score = Number(
    (
      swipe_velocity * 0.4 +
      quiz_variance * 0.35 +
      retention_decay * 0.15 +
      reflection_quality * 0.10
    ).toFixed(4)
  );

  let state: LIPResult['state'];
  if (score < 0.30) state = 'normal';
  else if (score < 0.60) state = 'suspicious';
  else if (score < 0.80) state = 'elevated';
  else state = 'farming';

  return {
    score,
    state,
    requires_secondary_gate: score >= 0.60,
    session_paused: score >= 0.80,
  };
}

// Computes swipe_velocity component from raw timing data
// swipe_velocity approaches 1.0 when user swiped much faster than content duration
export function computeSwipeVelocity(
  swipeTimestamps: number[],
  seminarDurationSeconds: number
): number {
  if (swipeTimestamps.length < 2) return 0;
  const first = swipeTimestamps[0] ?? 0;
  const last = swipeTimestamps[swipeTimestamps.length - 1] ?? 0;
  const elapsed = (last - first) / 1000;
  // Ratio of expected time to actual time — clamped to [0, 1]
  // elapsed >> expected → ratio small → velocity low (good)
  // elapsed << expected → ratio high → velocity high (suspicious)
  const ratio = seminarDurationSeconds / Math.max(elapsed, 1);
  return Math.min(ratio, 1);
}

// Proxy for quiz variance from a single session — will improve with history
export function computeQuizVariance(score: number, isPerfect: boolean): number {
  if (isPerfect) return 0.1; // perfect scores are low suspicion
  if (score === 0) return 0.9; // zero score with passing is impossible — flag high
  if (score < 0.5) return 0.7;
  if (score < 0.8) return 0.4;
  return 0.2;
}

// Phase 1: no historical retention data yet — returns 0
export function computeRetentionDecay(_userId: string, _courseId: string): number {
  return 0;
}

// Inverse of semantic depth — high quality question → low reflection_quality component
export function computeReflectionComponent(semanticDepth: number): number {
  return Math.max(0, 1 - semanticDepth);
}
