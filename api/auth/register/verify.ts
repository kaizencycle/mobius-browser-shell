/**
 * POST /api/auth/register/verify
 *
 * Verifies WebAuthn attestation, derives citizenId, returns CitizenIdentity.
 * Uses @simplewebauthn/server for verification.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHmac } from 'crypto';
import { verifyRegistrationResponse } from '@simplewebauthn/server';

const RP_ID = process.env.WEBAUTHN_RP_ID ?? 'mobius-browser-shell.vercel.app';
const RP_ORIGIN = process.env.WEBAUTHN_RP_ORIGIN ?? 'https://mobius-browser-shell.vercel.app';
const CHALLENGE_SECRET = process.env.CHALLENGE_SECRET ?? '';
const CITIZEN_ID_PEPPER = process.env.CITIZEN_ID_PEPPER ?? '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ── 1. Validate challenge cookie ─────────────────────────────────────────
  const cookieHeader = req.headers.cookie ?? '';
  const cookieValue = parseCookie(cookieHeader, 'mobius_reg_challenge');
  if (!cookieValue) {
    return res.status(400).json({ error: 'Missing registration challenge' });
  }

  const parts = cookieValue.split('.');
  if (parts.length !== 4) return res.status(400).json({ error: 'Malformed challenge' });
  const [challengeB64, userIdB64, expiresAtStr, sig] = parts;
  const payload = `${challengeB64}.${userIdB64}.${expiresAtStr}`;
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
    return res.status(400).json({ error: 'Invalid registration payload' });
  }

  // Ensure response format matches simplewebauthn (clientExtensionResults)
  const registrationResponse = {
    id,
    rawId: body.rawId ?? id,
    type: type as 'public-key',
    response: credResponse,
    clientExtensionResults: body.clientExtensionResults ?? {},
  };

  // ── 3. Verify attestation with @simplewebauthn/server ──────────────────────
  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response: registrationResponse,
      expectedChallenge: challengeB64,
      expectedOrigin: RP_ORIGIN,
      expectedRPID: RP_ID,
      requireUserVerification: true,
    });
  } catch (err) {
    console.error('[auth] Registration verification failed', err);
    return res.status(401).json({ error: 'Verification failed' });
  }

  if (!verification.verified || !verification.registrationInfo) {
    return res.status(401).json({ error: 'Verification failed' });
  }

  const { credential } = verification.registrationInfo;
  const credentialIdB64 = credential.id;

  // Derive citizenId (SHA-256 of credential ID, peppered for rainbow table defense)
  const pepper = CITIZEN_ID_PEPPER || 'default-pepper-change-me';
  const citizenId = createHmac('sha256', pepper)
    .update(credentialIdB64)
    .digest('hex')
    .slice(0, 32);

  // ── 4. Persist credential to identity store (if configured) ──────────────
  const IDENTITY_API_URL = process.env.MOBIUS_IDENTITY_API_URL ?? '';
  const IDENTITY_API_KEY = process.env.MOBIUS_IDENTITY_API_KEY ?? '';

  if (IDENTITY_API_URL && IDENTITY_API_KEY) {
    try {
      await fetch(`${IDENTITY_API_URL}/credentials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${IDENTITY_API_KEY}`,
        },
        body: JSON.stringify({
          citizenId,
          credentialId: credentialIdB64,
          publicKey: Buffer.from(credential.publicKey).toString('base64url'),
          counter: credential.counter,
        }),
      });
    } catch (err) {
      console.error('[auth] Failed to persist credential', err);
    }
  }

  // ── 5. Clear challenge cookie & return identity ──────────────────────────
  res.setHeader(
    'Set-Cookie',
    'mobius_reg_challenge=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/api/auth',
  );

  const identity = {
    citizenId,
    handle: null,
    authenticatedAt: new Date().toISOString(),
    onboarded: false,
  };

  // When identity API is not configured, return credential for client-side cache
  // so session-only restore can verify assertions without the identity store
  const response: Record<string, unknown> = { ...identity };
  if (!IDENTITY_API_URL || !IDENTITY_API_KEY) {
    response.credential = {
      id: credentialIdB64,
      publicKey: Buffer.from(credential.publicKey).toString('base64url'),
      counter: credential.counter,
    };
  }

  return res.status(200).json(response);
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
