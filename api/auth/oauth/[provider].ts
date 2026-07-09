/**
 * GET /api/auth/oauth/github|google
 *
 * Starts the OAuth dance. Redirects to the provider authorize URL.
 * Query: redirect_uri — where to send the citizen after success (must be allowlisted).
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  buildAuthorizeUrl,
  buildStateCookie,
  getCallbackOrigin,
  getStateSecret,
  isOAuthProvider,
  normalizeRedirectUri,
  providerIsConfigured,
  setStateCookie,
} from './_shared.js';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const providerRaw = req.query.provider;
  const provider = Array.isArray(providerRaw) ? providerRaw[0] : providerRaw;
  if (!provider || !isOAuthProvider(provider)) {
    return res.status(400).json({ error: 'Invalid OAuth provider' });
  }

  const secret = getStateSecret();
  if (!secret) {
    console.error('[oauth] OAUTH_STATE_SECRET / CHALLENGE_SECRET is not set');
    return res.status(503).json({ error: 'OAuth not configured' });
  }

  if (!providerIsConfigured(provider)) {
    return res.status(503).json({ error: `${provider} OAuth is not configured` });
  }

  const redirectRaw = req.query.redirect_uri;
  const redirectParam = Array.isArray(redirectRaw) ? redirectRaw[0] : redirectRaw;
  const origin = getCallbackOrigin(req);
  const redirectUri = normalizeRedirectUri(
    typeof redirectParam === 'string' ? redirectParam : undefined,
    origin,
  );
  if (!redirectUri) {
    return res.status(400).json({ error: 'Invalid redirect_uri' });
  }

  const callbackUrl = `${origin}/api/auth/oauth/callback`;
  const { cookie, state } = buildStateCookie(provider, redirectUri, secret);
  setStateCookie(res, cookie);

  const authorizeUrl = buildAuthorizeUrl(provider, callbackUrl, state);
  return res.redirect(302, authorizeUrl);
}
