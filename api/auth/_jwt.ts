/**
 * Shell-issued JWT for authenticated citizens.
 *
 * Minted by auth verify endpoints after WebAuthn success.
 * Consumed by WalletContext and any other chamber requiring a Bearer token.
 *
 * Algorithm: HS256 (HMAC-SHA256) using JWT_SECRET (server-side only).
 * Expiry: 24h, matching the sessionStorage session TTL in AuthContext.
 *
 * Intended to be replaced when mobius-identity-service gains a /token
 * endpoint — at that point swap mintCitizenToken for a redirect to that
 * service and keep the rest of the flow unchanged.
 */

import { createHmac } from 'crypto';

// 24h — must match AuthContext SESSION_KEY TTL
const JWT_EXPIRY_SECONDS = 24 * 60 * 60;

export function mintCitizenToken(
  citizenId: string,
  handle: string | null,
  secret: string,
): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(
    JSON.stringify({ sub: citizenId, handle, iat: now, exp: now + JWT_EXPIRY_SECONDS }),
  ).toString('base64url');
  const sig = createHmac('sha256', secret)
    .update(`${header}.${payload}`)
    .digest('base64url');
  return `${header}.${payload}.${sig}`;
}
