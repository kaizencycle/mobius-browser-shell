/**
 * POST /api/hive/action
 *
 * C-289: Player ↔ Sentinel ↔ Quest loop. Applies a validated action to the
 * client-local playable save (returned to the browser for persistence).
 * Optionally forwards a telemetry envelope to OAA / ATLAS-style endpoints.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { HivePlayableSave } from '../../src/lib/hive-action-types';
import { applyHiveAction, zeusDialogue } from '../../src/lib/hive-action-engine';

const ALLOWED_ORIGINS = [
  'https://mobius-browser-shell.vercel.app',
  'https://shell.mobius.systems',
  'http://localhost:5173',
  'http://localhost:3000',
];

const OAA_BASE = (process.env.OAA_API_BASE ?? 'https://oaa-api-library.onrender.com').replace(/\/+$/, '');

function setCors(res: VercelResponse, origin: string): void {
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');
}

async function forwardMemoryEnvelope(payload: Record<string, unknown>): Promise<void> {
  if (process.env.HIVE_ACTION_SKIP_EXTERNAL === 'true') return;
  const path = process.env.OAA_HIVE_MEMORY_PATH ?? '/api/oaa/memory/append';
  try {
    const res = await fetch(`${OAA_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok && process.env.NODE_ENV === 'development') {
      console.warn('[hive/action] OAA forward:', res.status, await res.text().catch(() => ''));
    }
  } catch (e) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[hive/action] OAA forward skipped:', e);
    }
  }
}

async function forwardAtlasHiveEvent(payload: Record<string, unknown>): Promise<void> {
  if (process.env.HIVE_ACTION_SKIP_EXTERNAL === 'true') return;
  const vercelUrl = process.env.VERCEL_URL;
  const base = vercelUrl ? `https://${vercelUrl}` : '';
  if (!base) return;
  try {
    await fetch(`${base}/api/atlas/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'HIVE_PLAYER_ACTION', ...payload }),
      signal: AbortSignal.timeout(4000),
    }).catch(() => {});
  } catch {
    // non-fatal
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = String(req.headers.origin ?? '');
  setCors(res, origin);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) as {
    action?: string;
    cycle?: string;
    actor?: string;
    save?: HivePlayableSave;
  };

  const action = String(body.action ?? '').trim();
  const cycle = String(body.cycle ?? '').trim();
  const actor = String(body.actor ?? 'user').trim().slice(0, 64);
  const save = body.save;

  if (!action || !cycle) {
    return res.status(400).json({ error: 'Missing action or cycle' });
  }

  if (!save || save.version !== 1) {
    return res.status(400).json({ error: 'Missing or invalid save' });
  }

  const applied = applyHiveAction(save, action, cycle, actor);
  if (applied.ok === false) {
    return res.status(400).json({ error: applied.error });
  }

  const { result } = applied;
  const dialogue = zeusDialogue(result.save);

  void forwardMemoryEnvelope({
    source: 'mobius-browser-shell',
    action: result.logEntry.action,
    cycle: result.logEntry.cycle,
    actor: result.logEntry.actor,
    at: result.logEntry.at,
    quest_id: result.save.quest.id,
    quest_complete: result.questComplete,
  });

  void forwardAtlasHiveEvent({
    action: result.logEntry.action,
    cycle: result.logEntry.cycle,
    quest_id: result.save.quest.id,
  });

  return res.status(200).json({
    ok: true,
    save: result.save,
    dialogue,
    questComplete: result.questComplete,
    logEntry: result.logEntry,
  });
}
