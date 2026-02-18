/**
 * POST /api/atlas/events
 *
 * Receives ATLAS integrity events (SHELL_ERROR, AUTH_LIFECYCLE, etc.).
 * Placeholder for Mobius audit log — accepts and acknowledges events.
 * When ATLAS sentinel is wired up, forward to the real audit store.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body ?? {};
    const eventType = body.type ?? 'UNKNOWN';
    // Placeholder: log in dev, accept in prod
    if (process.env.NODE_ENV === 'development') {
      console.log('[ATLAS] Event:', eventType, body);
    }
    return res.status(200).json({ ok: true });
  } catch {
    return res.status(500).json({ error: 'Event processing failed' });
  }
}
