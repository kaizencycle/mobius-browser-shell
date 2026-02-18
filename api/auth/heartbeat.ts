/**
 * api/auth/heartbeat.ts
 *
 * Lightweight session validity check. Called every ~5 minutes by
 * useSessionHeartbeat to confirm the citizen hasn't been revoked.
 *
 * ⚠ CORRECTION from Cursor draft:
 *   The previous version used Next.js NextRequest/NextResponse.
 *   This codebase uses @vercel/node (VercelRequest/VercelResponse)
 *   as established in PR #26 (api/ai.ts). Using the wrong runtime
 *   causes a build failure. This version matches the existing pattern.
 *
 * GET /api/auth/heartbeat?citizenId=<id>
 * → { valid, citizenId, expiresAt, flags?, degraded? }
 * → 401 if citizen is revoked/deleted
 *
 * Security: This endpoint is unauthenticated by citizenId alone —
 * it's rate-limited and returns only a boolean validity signal.
 * No citizen data is returned. The real auth token is the passkey
 * session in sessionStorage.
 *
 * NOTE: session-only mode trusts client-side TTL. For server-enforced
 * revocation, configure MOBIUS_IDENTITY_API_URL.
 *
 * Cache: vercel.json already applies Cache-Control: no-store to all
 * /api/* routes (PR #26) — no additional config needed here.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

const IDENTITY_API_URL = process.env.MOBIUS_IDENTITY_API_URL ?? '';
const IDENTITY_API_KEY = process.env.MOBIUS_IDENTITY_API_KEY ?? '';

// Simple in-memory rate limit: max 20 req/min per citizenId
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 10000;

function isRateLimited(citizenId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(citizenId);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(citizenId, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  if (entry.count >= 20) return true;
  entry.count++;
  return false;
}

function evictRateLimitIfNeeded(): void {
  if (rateLimitMap.size > RATE_LIMIT_MAX) {
    const firstKey = rateLimitMap.keys().next().value;
    if (firstKey) rateLimitMap.delete(firstKey);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const citizenId = String(req.query.citizenId ?? '').trim();
  if (!citizenId || citizenId.length !== 32 || !/^[0-9a-f]+$/.test(citizenId)) {
    return res.status(400).json({ error: 'Invalid citizenId' });
  }

  evictRateLimitIfNeeded();
  if (isRateLimited(citizenId)) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  // ── No identity API: session-only mode ────────────────────────────────────
  if (!IDENTITY_API_URL) {
    // Client-side TTL (24h) is the only gate — report valid until expiry.
    return res.status(200).json({
      valid: true,
      citizenId,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      mode: 'session-only',
    });
  }

  // ── Identity API available: verify with Mobius identity store ─────────────
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const upstream = await fetch(
      `${IDENTITY_API_URL}/citizens/${citizenId}/status`,
      {
        headers: { Authorization: `Bearer ${IDENTITY_API_KEY}` },
        signal: controller.signal,
      },
    );
    clearTimeout(timeout);

    if (upstream.status === 404) {
      // Citizen deleted — hard revoke
      return res.status(401).json({ valid: false, citizenId });
    }

    if (!upstream.ok) {
      throw new Error(`Identity API error: ${upstream.status}`);
    }

    const status = await upstream.json();

    return res.status(200).json({
      valid: status.active === true && status.suspended !== true,
      citizenId,
      expiresAt: status.sessionExpiresAt ?? null,
      flags: {
        requiresReauth: status.requiresReauth ?? false,
        suspiciousActivity: status.suspiciousActivityDetected ?? false,
      },
    });
  } catch (err) {
    // Fail open — don't kill session if identity API is temporarily down.
    // Client-side TTL remains the safety net.
    console.error('[heartbeat] Identity API unreachable:', err);
    return res.status(200).json({
      valid: true,
      citizenId,
      degraded: true,
    });
  }
}
