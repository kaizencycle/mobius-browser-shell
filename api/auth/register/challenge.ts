/**
 * GET /api/auth/register/challenge
 *
 * Generates a WebAuthn registration challenge.
 * Stores challenge in a signed, httpOnly cookie (30s TTL) for verification.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHmac, randomBytes } from 'crypto';
import { checkChallengeRateLimit } from '../_rateLimit';

const RP_ID = process.env.WEBAUTHN_RP_ID ?? 'mobius-browser-shell.vercel.app';
const RP_NAME = process.env.WEBAUTHN_RP_NAME ?? 'Mobius Substrate';
const CHALLENGE_SECRET = process.env.CHALLENGE_SECRET ?? '';

function getClientIp(req: VercelRequest): string {
  return (req.headers['x-real-ip'] as string) ?? (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ?? 'unknown';
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const rateLimit = checkChallengeRateLimit(getClientIp(req));
  if (!rateLimit.ok) {
    res.setHeader('Retry-After', String(rateLimit.retryAfter ?? 60));
    return res.status(429).json({ error: 'Rate limited' });
  }

  if (!CHALLENGE_SECRET) {
    console.error('[auth] CHALLENGE_SECRET is not set');
    return res.status(500).json({ error: 'Auth not configured' });
  }

  const challenge = randomBytes(32);
  const userId = randomBytes(16);
  const expiresAt = Date.now() + 30_000;

  const challengeB64 = challenge.toString('base64url');
  const userIdB64 = userId.toString('base64url');

  const payload = `${challengeB64}.${userIdB64}.${expiresAt}`;
  const sig = createHmac('sha256', CHALLENGE_SECRET).update(payload).digest('base64url');
  const cookieValue = `${payload}.${sig}`;

  res.setHeader(
    'Set-Cookie',
    `mobius_reg_challenge=${cookieValue}; HttpOnly; Secure; SameSite=Strict; Max-Age=30; Path=/api/auth`,
  );

  return res.status(200).json({
    challenge: challengeB64,
    userId: userIdB64,
    rpId: RP_ID,
    rpName: RP_NAME,
  });
}
