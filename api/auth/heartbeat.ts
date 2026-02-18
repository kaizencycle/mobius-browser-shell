/**
 * GET /api/auth/heartbeat
 *
 * Lightweight check that citizen session is still valid.
 * Returns 401 if revoked, 200 with flags if OK.
 * Fail-open when identity API is unreachable (client TTL will expire).
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

const IDENTITY_API_URL = process.env.MOBIUS_IDENTITY_API_URL ?? '';
const IDENTITY_API_KEY = process.env.MOBIUS_IDENTITY_API_KEY ?? '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const citizenId = typeof req.query.citizenId === 'string' ? req.query.citizenId : null;

  if (!citizenId) {
    return res.status(400).json({ error: 'Missing citizenId' });
  }

  // No identity API: client-side session only — valid until TTL
  if (!IDENTITY_API_URL || !IDENTITY_API_KEY) {
    return res.status(200).json({
      valid: true,
      citizenId,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });
  }

  try {
    const statusRes = await fetch(
      `${IDENTITY_API_URL}/citizens/${citizenId}/status`,
      {
        headers: { Authorization: `Bearer ${IDENTITY_API_KEY}` },
      },
    );

    if (statusRes.status === 404) {
      return res.status(401).json({ valid: false });
    }

    if (!statusRes.ok) {
      throw new Error(`Identity API error: ${statusRes.status}`);
    }

    const status = await statusRes.json();

    return res.status(200).json({
      valid: status.active !== false && !status.suspended,
      citizenId,
      expiresAt: status.sessionExpiresAt ?? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      flags: {
        requiresReauth: status.requiresReauth ?? false,
        passwordChanged:
          status.passwordChangedAt && status.sessionStartedAt
            ? status.passwordChangedAt > status.sessionStartedAt
            : false,
        suspiciousActivity: status.suspiciousActivityDetected ?? false,
      },
    });
  } catch (err) {
    // Fail open — don't kill session if identity API is down
    console.error('[Heartbeat] Identity API unreachable:', err);
    return res.status(200).json({
      valid: true,
      citizenId,
      degraded: true,
    });
  }
}
