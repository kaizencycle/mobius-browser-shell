/**
 * In-memory rate limit for challenge endpoints.
 * Prevents challenge spam. Resets per serverless instance (cold start).
 * For production at scale, use Redis or Vercel KV.
 */

const challengeLimits = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 5;

export function checkChallengeRateLimit(ip: string): { ok: boolean; retryAfter?: number } {
  const now = Date.now();
  const current = challengeLimits.get(ip);

  if (current && current.resetAt > now) {
    if (current.count >= MAX_REQUESTS) {
      return { ok: false, retryAfter: Math.ceil((current.resetAt - now) / 1000) };
    }
    current.count++;
    return { ok: true };
  }

  challengeLimits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
  return { ok: true };
}
