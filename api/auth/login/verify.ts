/**
 * POST /api/auth/login/verify
 *
 * Verifies WebAuthn authentication assertion.
 * Requires MOBIUS_IDENTITY_API_URL to fetch stored credential for verification.
 * Without identity API, login is unavailable (citizens must register).
 *
 * POST /api/auth/login/verify
 * Body: { id, rawId, type, response: { clientDataJSON, authenticatorData, signature, userHandle } }
 * → CitizenIdentity
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHmac } from 'crypto';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';

const RP_ID = process.env.WEBAUTHN_RP_ID ?? 'mobius-browser-shell.vercel.app';
const RP_ORIGIN = process.env.WEBAUTHN_RP_ORIGIN ?? 'https://mobius-browser-shell.vercel.app';
const CHALLENGE_SECRET = process.env.CHALLENGE_SECRET ?? '';
const CITIZEN_ID_PEPPER = process.env.CITIZEN_ID_PEPPER ?? '';
const IDENTITY_API_URL = process.env.MOBIUS_IDENTITY_API_URL ?? '';
const IDENTITY_API_KEY = process.env.MOBIUS_IDENTITY_API_KEY ?? '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!CHALLENGE_SECRET) {
    console.error('[auth] CHALLENGE_SECRET is not set');
    return res.status(500).json({ error: 'Auth not configured' });
  }

  // Without identity API we cannot verify (no stored credential)
  if (!IDENTITY_API_URL || !IDENTITY_API_KEY) {
    return res.status(503).json({
      error: 'Identity service not configured. Please register to create a new citizen identity.',
    });
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

  // ── 2. Parse body ─────────────────────────────────────────────────────────
  const body = req.body ?? {};
  const { id, type, response: credResponse } = body;
  if (!id || type !== 'public-key' || !credResponse) {
    return res.status(400).json({ error: 'Invalid assertion payload' });
  }

  const authResponse = {
    id,
    rawId: body.rawId ?? id,
    type: type as 'public-key',
    response: credResponse,
    clientExtensionResults: body.clientExtensionResults ?? {},
  };

  // ── 3. Fetch stored credential from identity store ─────────────────────────
  const pepper = CITIZEN_ID_PEPPER || 'default-pepper-change-me';
  const citizenId = createHmac('sha256', pepper).update(id).digest('hex').slice(0, 32);

  let storedCredential: { credentialId: string; publicKey: string; counter: number };
  try {
    const credRes = await fetch(`${IDENTITY_API_URL}/credentials/${encodeURIComponent(id)}`, {
      headers: { Authorization: `Bearer ${IDENTITY_API_KEY}` },
    });
    if (!credRes.ok) {
      return res.status(401).json({ error: 'Credential not found. Please register first.' });
    }
    const data = await credRes.json();
    storedCredential = {
      credentialId: data.credentialId ?? id,
      publicKey: data.publicKey,
      counter: data.counter ?? 0,
    };
  } catch (err) {
    console.error('[auth] Failed to fetch credential', err);
    return res.status(503).json({ error: 'Identity service unavailable' });
  }

  // ── 4. Verify assertion with @simplewebauthn/server ───────────────────────
  let verification;
  try {
    verification = await verifyAuthenticationResponse({
      response: authResponse,
      expectedChallenge: challengeB64,
      expectedOrigin: RP_ORIGIN,
      expectedRPID: RP_ID,
      credential: {
        id: storedCredential.credentialId,
        publicKey: Buffer.from(storedCredential.publicKey, 'base64url'),
        counter: storedCredential.counter,
      },
      requireUserVerification: true,
    });
  } catch (err) {
    console.error('[auth] Authentication verification failed', err);
    return res.status(401).json({ error: 'Verification failed' });
  }

  if (!verification.verified) {
    return res.status(401).json({ error: 'Verification failed' });
  }

  // TODO: Update counter in identity store (verification.authenticationInfo.newCounter)

  // ── 5. Fetch citizen record from identity store ──────────────────────────
  let handle: string | null = null;
  let onboarded = false;

  try {
    const citizenRes = await fetch(`${IDENTITY_API_URL}/citizens/${citizenId}`, {
      headers: { Authorization: `Bearer ${IDENTITY_API_KEY}` },
    });
    if (citizenRes.ok) {
      const data = await citizenRes.json();
      handle = data.handle ?? null;
      onboarded = data.onboarded ?? false;
    }
  } catch (err) {
    console.error('[auth] Failed to fetch citizen record', err);
  }

  // ── 6. Clear challenge cookie & return identity ───────────────────────────
  res.setHeader(
    'Set-Cookie',
    'mobius_auth_challenge=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/api/auth',
  );

  const identity = {
    citizenId,
    handle,
    authenticatedAt: new Date().toISOString(),
    onboarded,
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
