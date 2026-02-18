/**
 * api/ai.ts — Mobius AI Proxy (Edge Function)
 *
 * EPICON Guard: Keeps GEMINI_API_KEY server-side.
 * All Gemini requests from the browser shell route through here.
 *
 * Rate limiting is handled at the Vercel platform level.
 * Add per-user rate limiting when Mobius identity auth is wired up.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

// Allowed origins — tighten this when custom domain is set
const ALLOWED_ORIGINS = [
  'https://mobius-browser-shell.vercel.app',
  'https://shell.mobius.systems', // future custom domain
  'http://localhost:5173', // local dev
  'http://localhost:3000', // Vite dev server
];

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com';

// Maximum request body size (bytes) — prevent abuse
const MAX_BODY_SIZE = 50_000;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // ── CORS ──────────────────────────────────────────────────────────────────
  const origin = req.headers.origin ?? '';
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // ── Method guard ──────────────────────────────────────────────────────────
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ── API key guard ─────────────────────────────────────────────────────────
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('[EPICON] GEMINI_API_KEY is not set');
    return res.status(500).json({ error: 'AI service not configured' });
  }

  // ── Body size guard ───────────────────────────────────────────────────────
  const body = req.body;
  const bodyStr = JSON.stringify(body);
  if (bodyStr.length > MAX_BODY_SIZE) {
    return res.status(413).json({ error: 'Request too large' });
  }

  // ── Resolve upstream Gemini endpoint ─────────────────────────────────────
  // Clients pass ?model=gemini-2.0-flash and ?action=generateContent etc.
  const model = sanitizeModel(String(req.query.model ?? 'gemini-2.0-flash'));
  const action = sanitizeAction(String(req.query.action ?? 'generateContent'));

  const upstreamUrl =
    `${GEMINI_API_BASE}/v1beta/models/${model}:${action}?key=${apiKey}`;

  // ── Proxy to Gemini ───────────────────────────────────────────────────────
  try {
    const upstream = await fetch(upstreamUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: bodyStr,
    });

    const data = await upstream.json();

    if (!upstream.ok) {
      console.error('[EPICON] Gemini upstream error', upstream.status, data);
      return res.status(upstream.status).json({
        error: 'AI service error',
        detail: data?.error?.message ?? 'Unknown error',
      });
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error('[EPICON] Proxy fetch failed', err);
    return res.status(502).json({ error: 'AI service unreachable' });
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Allowlist of permitted Gemini models */
function sanitizeModel(model: string): string {
  const ALLOWED_MODELS = new Set([
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite',
    'gemini-1.5-pro',
    'gemini-1.5-flash',
  ]);
  return ALLOWED_MODELS.has(model) ? model : 'gemini-2.0-flash';
}

/** Allowlist of permitted Gemini actions */
function sanitizeAction(action: string): string {
  const ALLOWED_ACTIONS = new Set([
    'generateContent',
    'streamGenerateContent',
    'countTokens',
  ]);
  return ALLOWED_ACTIONS.has(action) ? action : 'generateContent';
}
