/**
 * api/onboarding/complete.ts
 *
 * POST /api/onboarding/complete
 * Body: { citizenId, handle, consents: { integrity, data } }
 * → { success: true, citizen: CitizenIdentity }
 *
 * Persists onboarding completion to Mobius identity store (if available)
 * and returns an updated CitizenIdentity with onboarded: true.
 *
 * Degrades gracefully if MOBIUS_IDENTITY_API_URL is not set —
 * returns success and the caller updates state client-side.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHash } from 'crypto';

const IDENTITY_API_URL = process.env.MOBIUS_IDENTITY_API_URL ?? '';
const IDENTITY_API_KEY = process.env.MOBIUS_IDENTITY_API_KEY ?? '';

// Simple in-memory rate limit: 5 completions per citizenId per hour
// (prevents handle-cycling abuse)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
// Per-IP rate limit: 10 completions per hour (prevents handle-squatting)
const ipRateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const IP_RATE_LIMIT = 10;

function isRateLimited(citizenId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(citizenId);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(citizenId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  if (entry.count >= 5) return true;
  entry.count++;
  return false;
}

function isIpRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = ipRateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    ipRateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  if (entry.count >= IP_RATE_LIMIT) return true;
  entry.count++;
  return false;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { citizenId, handle, consents } = req.body ?? {};

  // ── Validate ───────────────────────────────────────────────────────────────
  if (!citizenId || typeof citizenId !== 'string' || citizenId.length !== 32 || !/^[0-9a-f]+$/.test(citizenId)) {
    return res.status(400).json({ error: 'Invalid citizenId' });
  }
  if (!consents?.integrity || !consents?.data) {
    return res.status(400).json({ error: 'Covenant consent required' });
  }
  if (handle !== null && handle !== undefined && handle !== '') {
    if (typeof handle !== 'string' || handle.length > 32 || !/^[a-zA-Z0-9_-]+$/.test(handle)) {
      return res.status(400).json({ error: 'Invalid handle format' });
    }
  }
  const ip = (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ?? 'unknown';
  if (isIpRateLimited(ip)) {
    return res.status(429).json({ error: 'Too many requests' });
  }
  if (isRateLimited(citizenId)) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  const handleValue = handle && typeof handle === 'string' ? handle.trim() || null : null;

  // ── Handle uniqueness (if identity API available) ───────────────────────────
  if (handleValue && IDENTITY_API_URL && IDENTITY_API_KEY) {
    try {
      const availRes = await fetch(
        `${IDENTITY_API_URL}/handles/${encodeURIComponent(handleValue)}/available`,
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${IDENTITY_API_KEY}` },
          signal: AbortSignal.timeout(3_000),
        },
      );
      if (availRes.status === 409) {
        return res.status(409).json({ error: 'Handle taken', field: 'handle' });
      }
      if (availRes.ok) {
        const availData = (await availRes.json().catch(() => ({}))) as { available?: boolean };
        if (availData.available === false) {
          return res.status(409).json({ error: 'Handle taken', field: 'handle' });
        }
      }
    } catch {
      // Fail open — don't block onboarding if identity API is flaky
    }
  }

  // ── Covenant hash for audit trail ─────────────────────────────────────────
  const covenantPayload = {
    citizenId,
    consents: { integrity: true, data: true },
    timestamp: new Date().toISOString(),
  };
  const covenantHash = createHash('sha256')
    .update(JSON.stringify(covenantPayload))
    .digest('hex');

  // ── Persist to identity store (if configured) ──────────────────────────────
  if (IDENTITY_API_URL && IDENTITY_API_KEY) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const upstream = await fetch(
        `${IDENTITY_API_URL}/citizens/${citizenId}/onboarding`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${IDENTITY_API_KEY}`,
          },
          body: JSON.stringify({
            handle: handleValue,
            consents: {
              integrity: { accepted: true, timestamp: new Date().toISOString() },
              data: { accepted: true, timestamp: new Date().toISOString() },
            },
            covenantHash,
            onboardedAt: new Date().toISOString(),
          }),
          signal: controller.signal,
        },
      );
      clearTimeout(timeout);

      if (!upstream.ok) {
        const err = await upstream.json().catch(() => ({}));
        console.error('[onboarding] Identity store error:', upstream.status, err);
        return res.status(502).json({ error: 'Identity service error' });
      }
    } catch (err) {
      console.error('[onboarding] Identity store unreachable:', err);
      return res.status(502).json({ error: 'Identity service unreachable' });
    }
  }

  // ── Handle quality metrics (anonymized, for spam detection) ──────────────────
  const host = (req.headers['x-forwarded-host'] as string) ?? process.env.VERCEL_URL ?? 'localhost';
  const proto = (req.headers['x-forwarded-proto'] as string) ?? 'https';
  const baseUrl = `${proto}://${host}`;
  fetch(`${baseUrl}/api/atlas/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'HANDLE_CREATED',
      pattern: handleValue ? 'custom' : 'skipped',
      length: handleValue?.length ?? 0,
      timestamp: new Date().toISOString(),
    }),
    signal: AbortSignal.timeout(1_000),
  }).catch(() => {});

  // ── Return updated identity ────────────────────────────────────────────────
  return res.status(200).json({
    success: true,
    citizen: {
      citizenId,
      handle: handleValue,
      authenticatedAt: new Date().toISOString(),
      onboarded: true,
    },
  });
}
