/**
 * POST /api/auth/cache/verify
 *
 * Verifies WebAuthn assertion using a cached credential (when identity API is unset).
 * Client provides assertion + cached credential data; server verifies with simplewebauthn.
 *
 * Body: { assertion: {...}, credential: { credentialId, publicKey, counter } }
 * → CitizenIdentity
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHmac } from 'crypto';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';

const RP_ID = process.env.WEBAUTHN_RP_ID ?? 'mobius-browser-shell.vercel.app';
const RP_ORIGIN = process.env.WEBAUTHN_RP_ORIGIN ?? 'https://mobius-browser-shell.vercel.app';
const CHALLENGE_SECRET = process.env.CHALLENGE_SECRET ?? '';
const CITIZEN_ID_PEPPER = process.env.CITIZEN_ID_PEPPER ?? '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!CHALLENGE_SECRET) {
    return res.status(500).json({ error: 'Auth not configured' });
  }

  const body = req.body ?? {};
  const { assertion, credential: cachedCred } = body;

  if (!assertion || !cachedCred?.credentialId || !cachedCred?.publicKey) {
    return res.status(400).json({ error: 'Invalid cache verify payload' });
  }

  // ── 1. Validate challenge cookie ─────────────────────────────────────────
  const cookieHeader = req.headers.cookie ?? '';
  const cookieValue = parseCookie(cookieHeader, 'mobius_auth_challenge');
  if (!cookieValue) {
    return res.status(400).json({ error: 'Missing auth challenge' });
  }

  const parts = cookieValue.split('.');
  if (parts.length !== 3) return res.status(400).json({ error: 'Malformed challenge' });
  const [challengeB64, expiresAtStr, sig] = parts;
  const payload = `${challengeB64}.${expiresAtStr}`;
  const expectedSig = createHmac('sha256', CHALLENGE_SECRET).update(payload).digest('base64url');

  if (!timingSafeEqual(sig, expectedSig)) {
    return res.status(400).json({ error: 'Invalid challenge signature' });
  }
  if (Date.now() > parseInt(expiresAtStr, 10)) {
    return res.status(400).json({ error: 'Challenge expired' });
  }

  const authResponse = {
    id: assertion.id,
    rawId: assertion.rawId ?? assertion.id,
    type: 'public-key' as const,
    response: assertion.response,
    clientExtensionResults: assertion.clientExtensionResults ?? {},
  };

  // ── 2. Verify assertion ──────────────────────────────────────────────────
  let verification;
  try {
    verification = await verifyAuthenticationResponse({
      response: authResponse,
      expectedChallenge: challengeB64,
      expectedOrigin: RP_ORIGIN,
      expectedRPID: RP_ID,
      credential: {
        id: cachedCred.credentialId,
        publicKey: Buffer.from(cachedCred.publicKey, 'base64url'),
        counter: cachedCred.counter ?? 0,
      },
      requireUserVerification: true,
    });
  } catch (err) {
    console.error('[auth] Cache verify failed', err);
    return res.status(401).json({ error: 'Verification failed' });
  }

  if (!verification.verified) {
    return res.status(401).json({ error: 'Verification failed' });
  }

  const pepper = CITIZEN_ID_PEPPER || 'default-pepper-change-me';
  const citizenId = createHmac('sha256', pepper)
    .update(cachedCred.credentialId)
    .digest('hex')
    .slice(0, 32);

  res.setHeader(
    'Set-Cookie',
    'mobius_auth_challenge=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/api/auth',
  );

  return res.status(200).json({
    citizenId,
    handle: null,
    authenticatedAt: new Date().toISOString(),
    onboarded: false,
  });
}

function parseCookie(header: string, name: string): string | null {
  const match = header.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}
