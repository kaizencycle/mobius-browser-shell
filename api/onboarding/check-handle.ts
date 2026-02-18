/**
 * GET /api/onboarding/check-handle?handle=...
 *
 * Real-time handle availability check for the onboarding flow.
 * Returns 200 if available, 409 if taken.
 * Degrades gracefully when MOBIUS_IDENTITY_API_URL is not set — returns 200.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

const IDENTITY_API_URL = process.env.MOBIUS_IDENTITY_API_URL ?? '';
const IDENTITY_API_KEY = process.env.MOBIUS_IDENTITY_API_KEY ?? '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const handle = typeof req.query.handle === 'string' ? req.query.handle.trim() : '';

  // Basic validation
  if (!handle || handle.length < 2) {
    return res.status(400).json({ error: 'Handle too short' });
  }
  if (handle.length > 32 || !/^[a-zA-Z0-9_-]+$/.test(handle)) {
    return res.status(400).json({ error: 'Invalid handle format' });
  }

  // If no identity API, assume available (local-only mode)
  if (!IDENTITY_API_URL || !IDENTITY_API_KEY) {
    return res.status(200).json({ available: true });
  }

  try {
    const upstream = await fetch(
      `${IDENTITY_API_URL}/handles/${encodeURIComponent(handle)}/available`,
      {
        method: 'GET',
        headers: { Authorization: `Bearer ${IDENTITY_API_KEY}` },
        signal: AbortSignal.timeout(3_000),
      },
    );

    if (!upstream.ok) {
      if (upstream.status === 409) {
        return res.status(409).json({ available: false, error: 'Handle taken' });
      }
      return res.status(502).json({ error: 'Identity service error' });
    }

    const data = (await upstream.json().catch(() => ({}))) as { available?: boolean };
    return res.status(200).json({ available: data.available !== false });
  } catch {
    return res.status(200).json({ available: true }); // Fail open for UX
  }
}
