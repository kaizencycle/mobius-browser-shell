/**
 * GET /api/auth/oauth/callback
 *
 * Provider redirect target. Exchanges code for profile, mints civic_id + JWT,
 * then redirects back to the shell with oauth_* query params.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { mintCitizenToken } from '../_jwt.js';
import {
  appendOAuthCallbackParams,
  clearStateCookie,
  deriveCivicId,
  exchangeCode,
  fetchProviderProfile,
  getCallbackOrigin,
  getStateSecret,
  parseCookie,
  parseStateCookie,
} from './_shared.js';

const JWT_SECRET = process.env.JWT_SECRET ?? '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secret = getStateSecret();
  if (!secret) {
    return res.status(503).json({ error: 'OAuth not configured' });
  }

  const error = req.query.error;
  if (error) {
    const description = req.query.error_description;
    const message = typeof description === 'string' ? description : String(error);
    return res.status(400).json({ error: `OAuth denied: ${message}` });
  }

  const codeRaw = req.query.code;
  const code = Array.isArray(codeRaw) ? codeRaw[0] : codeRaw;
  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Missing authorization code' });
  }

  const stateRaw = req.query.state;
  const stateParam = Array.isArray(stateRaw) ? stateRaw[0] : stateRaw;

  const cookieHeader = req.headers.cookie ?? '';
  const cookieValue = parseCookie(cookieHeader, 'mobius_oauth_state');
  if (!cookieValue) {
    return res.status(400).json({ error: 'Missing OAuth state' });
  }

  const state = parseStateCookie(
    cookieValue,
    secret,
    typeof stateParam === 'string' ? stateParam : undefined,
  );
  if (!state) {
    return res.status(400).json({ error: 'Invalid or expired OAuth state' });
  }

  clearStateCookie(res);

  const callbackUrl = `${getCallbackOrigin(req)}/api/auth/oauth/callback`;

  try {
    const accessToken = await exchangeCode(state.provider, code, callbackUrl);
    const profile = await fetchProviderProfile(state.provider, accessToken);
    const civicId = deriveCivicId(state.provider, profile.uid);

    if (!JWT_SECRET) {
      console.error('[oauth] JWT_SECRET is not set');
      return res.status(503).json({ error: 'Auth not configured' });
    }

    const token = mintCitizenToken(civicId, profile.handle, JWT_SECRET);
    const redirectTo = appendOAuthCallbackParams(state.redirectUri, {
      oauth_token: token,
      oauth_civic_id: civicId,
      oauth_handle: profile.handle ?? '',
      oauth_provider: state.provider,
      oauth_is_new: 'true',
    });

    return res.redirect(302, redirectTo);
  } catch (err) {
    console.error('[oauth] callback failed', err);
    return res.status(502).json({
      error: err instanceof Error ? err.message : 'OAuth callback failed',
    });
  }
}
