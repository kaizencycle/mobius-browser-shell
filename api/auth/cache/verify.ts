/**
 * POST /api/auth/cache/verify
 *
 * Verifies WebAuthn assertion using credential from client (session-only mode).
 * Used when MOBIUS_IDENTITY_API_URL is not configured — the client stores
 * the credential in IdentityCache after registration and sends it here for
 * verification. Cache restore still requires WebAuthn assertion (device possession).
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

  // ── 1. Validate challenge cookie (same as login) ───────────────────────────
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

  // ── 2. Parse body: assertion + credential from cache ───────────────────────
  const body = req.body ?? {};
  const { assertion, credential } = body;
  if (!assertion?.id || !assertion?.response || !credential?.id || !credential?.publicKey) {
    return res.status(400).json({ error: 'Invalid cache verify payload' });
  }

  const authResponse = {
    id: assertion.id,
    rawId: assertion.rawId ?? assertion.id,
    type: 'public-key' as const,
    response: assertion.response,
    clientExtensionResults: assertion.clientExtensionResults ?? {},
  };

  // ── 3. Verify assertion against credential from client ────────────────────
  let verification;
  try {
    verification = await verifyAuthenticationResponse({
      response: authResponse,
      expectedChallenge: challengeB64,
      expectedOrigin: RP_ORIGIN,
      expectedRPID: RP_ID,
      credential: {
        id: credential.id,
        publicKey: Buffer.from(credential.publicKey, 'base64url'),
        counter: credential.counter ?? 0,
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

  // ── 4. Derive citizenId and return identity ────────────────────────────────
  const pepper = CITIZEN_ID_PEPPER || 'default-pepper-change-me';
  const citizenId = createHmac('sha256', pepper)
    .update(credential.id)
    .digest('hex')
    .slice(0, 32);

  res.setHeader(
    'Set-Cookie',
    'mobius_auth_challenge=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/api/auth',
  );

  const identity = {
    citizenId,
    handle: null,
    authenticatedAt: new Date().toISOString(),
    onboarded: false,
  };

  return res.status(200).json(identity);
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
