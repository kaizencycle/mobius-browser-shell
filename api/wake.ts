/**
 * api/wake.ts — Mobius Shell: Lab wake-up fan-out
 *
 * Pre-warms the Render-hosted lab + API services so the citizen doesn't eat
 * the cold-start latency on their own bandwidth + battery. The client sends
 * a single GET and this handler fans out server-side with Promise.allSettled.
 *
 * Runs on Vercel's Node runtime (same as the rest of api/*). Individual upstream
 * timeouts are short — the point is to wake them, not to wait for a full
 * response. Anything slower than WAKE_TIMEOUT_MS is still woken by the TCP
 * handshake even though we abort the fetch.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

const WAKE_TIMEOUT_MS = 4_000;
const OVERALL_BUDGET_MS = 9_000;

const LAB_URLS = [
  'https://lab7-proof.onrender.com',
  'https://hive-api-2le8.onrender.com',
  'https://lab6-proof-api.onrender.com',
  'https://oaa-api-library.onrender.com',
  'https://civic-protocol-core-ledger.onrender.com',
  'https://gic-indexer.onrender.com',
  'https://mobius-systems.onrender.com',
  'https://mobius-identity-service.onrender.com',
  'https://mobius-mic-wallet-service.onrender.com',
] as const;

interface WakeResult {
  url: string;
  ok: boolean;
  status: number | null;
  ms: number;
}

async function pingOne(url: string): Promise<WakeResult> {
  const started = Date.now();
  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'manual',
      signal: AbortSignal.timeout(WAKE_TIMEOUT_MS),
    });
    return {
      url,
      ok: res.ok || res.status < 500,
      status: res.status,
      ms: Date.now() - started,
    };
  } catch {
    return {
      url,
      ok: false,
      status: null,
      ms: Date.now() - started,
    };
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only GET — this endpoint has no side-effects on the shell itself.
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Serverless invocation budget cap; we never want a pending lab to hold
  // up the citizen's UI thread waiting for our response.
  const deadline = Promise.race([
    Promise.allSettled(LAB_URLS.map(pingOne)),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('wake-budget-exceeded')), OVERALL_BUDGET_MS),
    ),
  ]);

  let results: WakeResult[] = [];
  try {
    const settled = (await deadline) as PromiseSettledResult<WakeResult>[];
    results = settled.map((r) =>
      r.status === 'fulfilled'
        ? r.value
        : { url: 'unknown', ok: false, status: null, ms: OVERALL_BUDGET_MS },
    );
  } catch {
    // Budget exceeded — we still treat it as best-effort success. The wake
    // pings themselves are fire-and-forget from the citizen's perspective.
    results = LAB_URLS.map((url) => ({ url, ok: false, status: null, ms: OVERALL_BUDGET_MS }));
  }

  const ok = results.filter((r) => r.ok).length;
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({
    woken: ok,
    total: results.length,
    results,
    budgetMs: OVERALL_BUDGET_MS,
  });
}
