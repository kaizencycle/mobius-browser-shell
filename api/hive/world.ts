/**
 * GET /api/hive/world/:path*
 *
 * Edge proxy for HIVE world JSON artifacts.
 * Proxies requests to the canonical HIVE static host (raw GitHub or
 * VITE_HIVE_WORLD_BASE_URL) through the shell's Vercel edge, giving:
 *
 *   - No GitHub Raw rate-limit exposure to end users
 *   - Proper Cache-Control so CDN layers cache world state
 *   - CORS-safe delivery (same origin as the shell)
 *   - Fallback to bundled /public/world/ copies on upstream failure
 *
 * URL mapping:
 *   GET /api/hive/world/current-cycle.json
 *     → https://raw.githubusercontent.com/kaizencycle/mobius-hive/main/world/current-cycle.json
 *   GET /api/hive/world/events/signal-fog.json
 *     → …/world/events/signal-fog.json
 *
 * The path is read from the `path` query param, injected by the Vercel
 * rewrite rule  "/api/hive/world/:path*" → "/api/hive/world?path=:path*".
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

const HIVE_REMOTE_BASE =
  (process.env.VITE_HIVE_WORLD_BASE_URL ?? '').replace(/\/+$/, '') ||
  'https://raw.githubusercontent.com/kaizencycle/mobius-hive/main';

/** Allowlist of path prefixes we will proxy. Prevents open-proxy abuse. */
const ALLOWED_PREFIXES = [
  'world/',
  'world/events/',
  'world/quests/',
  'world/sentinels/',
  'world/zones/',
  'world/ledger/',
  'ledger/',
];

function isAllowed(path: string): boolean {
  return ALLOWED_PREFIXES.some((p) => path.startsWith(p));
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.status(204).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // Vercel injects the wildcard as a single `path` param (e.g. "world/current-cycle.json")
  const rawPath = Array.isArray(req.query['path'])
    ? req.query['path'].join('/')
    : (req.query['path'] as string | undefined) ?? '';

  if (!rawPath) {
    res.status(400).json({ error: 'Missing path parameter' });
    return;
  }

  // Normalise: strip leading slashes, prevent traversal
  const safePath = rawPath.replace(/^\/+/, '').replace(/\.\./g, '');

  if (!isAllowed(safePath)) {
    res.status(403).json({ error: 'Path not in HIVE world allowlist' });
    return;
  }

  const upstreamUrl = `${HIVE_REMOTE_BASE}/${safePath}`;

  try {
    const upstream = await fetch(upstreamUrl, {
      headers: { Accept: 'application/json, text/plain' },
      signal: AbortSignal.timeout(6000),
    });

    if (!upstream.ok) {
      res.status(upstream.status).json({
        error: `Upstream returned ${upstream.status}`,
        path: safePath,
      });
      return;
    }

    const body = await upstream.text();

    // Cache world state for 30s on CDN; clients may revalidate as often as they like.
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
    res.setHeader('X-Hive-Source', upstreamUrl);
    res.status(200).send(body);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(502).json({ error: 'Upstream fetch failed', detail: message, path: safePath });
  }
}
