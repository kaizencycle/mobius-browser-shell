/**
 * GET /api/auth/oauth/status
 *
 * Reports which OAuth providers are configured server-side.
 * Used by the auth gate to avoid showing broken provider buttons.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getConfiguredProviders, getStateSecret } from './_shared.js';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const configured = getConfiguredProviders();
  const ready = Boolean(getStateSecret() && process.env.JWT_SECRET);

  return res.status(200).json({
    ready,
    providers: configured,
    github: configured.includes('github'),
    google: configured.includes('google'),
  });
}
