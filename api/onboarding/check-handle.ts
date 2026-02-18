/**
 * api/onboarding/check-handle.ts
 *
 * GET /api/onboarding/check-handle?handle=kaizencycle
 *
 * 200 → available
 * 400 → invalid format
 * 409 → taken (or reserved)
 * 503 → identity API unconfigured or unreachable (HandleStep degrades gracefully)
 *
 * Called debounced (400ms) from HandleStep. No auth required — handle
 * enumeration risk is low since handles are public by design.
 *
 * Rate limited: 30 checks per IP per minute (spam prevention).
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

const IDENTITY_API_URL = process.env.MOBIUS_IDENTITY_API_URL ?? '';
const IDENTITY_API_KEY = process.env.MOBIUS_IDENTITY_API_KEY ?? '';

// In-memory rate limit: 30 checks / 60 seconds per IP
const checkLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = checkLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    checkLimitMap.set(ip, { count: 1, resetAt: now + 60 * 1000 });
    return false;
  }
  if (entry.count >= 30) return true;
  entry.count++;
  return false;
}

function getClientIp(req: VercelRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  return 'unknown';
}

function isValidHandle(handle: string): boolean {
  return (
    typeof handle === 'string' &&
    handle.length >= 2 &&
    handle.length <= 32 &&
    /^[a-zA-Z0-9_-]+$/.test(handle)
  );
}

// Reserved handles — cannot be registered
const RESERVED = new Set([
  'admin', 'administrator', 'mobius', 'atlas', 'aurea', 'echo', 'zeus',
  'hermes', 'jade', 'eve', 'system', 'root', 'api', 'null', 'undefined',
  'citizen', 'anonymous', 'moderator', 'support',
]);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ip = getClientIp(req);
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  const { handle } = req.query;
  if (!handle || typeof handle !== 'string') {
    return res.status(400).json({ error: 'handle query param required' });
  }

  if (!isValidHandle(handle)) {
    return res.status(400).json({ error: 'Invalid handle format' });
  }

  if (RESERVED.has(handle.toLowerCase())) {
    return res.status(409).json({ error: 'Handle reserved' });
  }

  // ── Check against identity store ───────────────────────────────────────────
  if (!IDENTITY_API_URL || !IDENTITY_API_KEY) {
    // No identity API — degrade gracefully, let client proceed
    return res.status(200).json({ available: true, degraded: true });
  }

  try {
    const upstream = await fetch(
      `${IDENTITY_API_URL}/handles/${encodeURIComponent(handle)}`,
      {
        headers: { Authorization: `Bearer ${IDENTITY_API_KEY}` },
        signal: AbortSignal.timeout(3_000),
      },
    );

    if (upstream.status === 404) {
      return res.status(200).json({ available: true });
    }
    if (upstream.status === 200) {
      return res.status(409).json({ error: 'Handle already taken' });
    }

    console.error('[check-handle] Unexpected status', upstream.status);
    return res.status(503).json({ error: 'Check unavailable' });
  } catch (err) {
    console.error('[check-handle] Identity store unreachable', err);
    // Degrade gracefully — let user proceed, handle collision caught at complete
    return res.status(200).json({ available: true, degraded: true });
  }
}
