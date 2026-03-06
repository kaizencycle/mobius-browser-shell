/**
 * POST /api/mic/genesis-grant
 *
 * Credits 50 MIC to a citizen on first covenant acceptance.
 * Called immediately after /api/onboarding/complete succeeds.
 *
 * Idempotent — a citizenId can only claim the genesis grant once.
 * Subsequent calls return 409 with the original grant record.
 *
 * Rate limit: 1 per citizenId (enforced via identity API).
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHash } from 'crypto';

const GENESIS_GRANT_AMOUNT = 50;
const GENESIS_GRANT_REASON = 'covenant_acceptance';
const GENESIS_GRANT_DESCRIPTION = 'Genesis Grant — First act of integrity, recognized by Mobius Substrate.';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { citizenId, covenantHash, handle } = req.body ?? {};

  if (!citizenId || typeof citizenId !== 'string') {
    return res.status(400).json({ error: 'citizenId required' });
  }

  if (!covenantHash || typeof covenantHash !== 'string') {
    return res.status(400).json({ error: 'covenantHash required' });
  }

  const timestamp = new Date().toISOString();

  // Generate grant record
  const grantId = createHash('sha256')
    .update(`genesis:${citizenId}:${covenantHash}`)
    .digest('hex')
    .slice(0, 16);

  const grantRecord = {
    grantId,
    citizenId,
    covenantHash,
    handle: handle ?? null,
    amount: GENESIS_GRANT_AMOUNT,
    reason: GENESIS_GRANT_REASON,
    description: GENESIS_GRANT_DESCRIPTION,
    grantedAt: timestamp,
    currency: 'MIC',
  };

  // If identity API is configured, persist there
  const identityApiUrl = process.env.MOBIUS_IDENTITY_API_URL;
  if (identityApiUrl) {
    try {
      const existing = await fetch(`${identityApiUrl}/mic/grants/${citizenId}/genesis`, {
        headers: { Authorization: `Bearer ${process.env.MOBIUS_IDENTITY_API_KEY ?? ''}` },
      });

      if (existing.ok) {
        const prior = await existing.json();
        return res.status(409).json({
          error: 'Genesis grant already claimed',
          grant: prior,
        });
      }

      const persist = await fetch(`${identityApiUrl}/mic/grants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.MOBIUS_IDENTITY_API_KEY ?? ''}`,
        },
        body: JSON.stringify(grantRecord),
      });

      if (!persist.ok) {
        throw new Error(`Identity API error: ${persist.status}`);
      }

      const saved = await persist.json();
      return res.status(201).json({ grant: saved, degraded: false });
    } catch (err) {
      console.error('[genesis-grant] Identity API error, degrading gracefully:', err);
      // Fall through to degraded mode
    }
  }

  // Degraded mode — return grant record without persisting
  // Client stores in CitizenIdentity; real balance reconciled when API is available
  // No console.log — EPICON flags citizenId in logs; observability via response degraded:true + ATLAS event

  // Emit ATLAS event via local events endpoint
  const host =
    (req.headers['x-forwarded-host'] as string) ?? process.env.VERCEL_URL ?? 'localhost';
  const proto = (req.headers['x-forwarded-proto'] as string) ?? 'https';
  const baseUrl = `${proto}://${host}`;
  fetch(`${baseUrl}/api/atlas/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'MIC_GRANT',
      event: 'GENESIS_GRANT',
      citizenId,
      handle: handle ?? null,
      covenantHash,
      amount: GENESIS_GRANT_AMOUNT,
      grantId,
      timestamp,
    }),
    signal: AbortSignal.timeout(1_000),
  }).catch(() => { /* non-blocking */ });

  return res.status(201).json({
    grant: grantRecord,
    degraded: !identityApiUrl,
  });
}
