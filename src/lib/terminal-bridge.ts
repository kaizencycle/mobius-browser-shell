const TERMINAL_ORIGIN = 'https://mobius-civic-ai-terminal.vercel.app';
const TERMINAL_SNAPSHOT_LITE = `${TERMINAL_ORIGIN}/api/terminal/snapshot-lite`;
const TERMINAL_SNAPSHOT_FULL = `${TERMINAL_ORIGIN}/api/terminal/snapshot`;

// Bridge timeouts
// Lite is meant to be fast (sub-second); give it a tight budget.
// Full aggregator hits multiple lanes; give it enough headroom to beat the
// terminal's own internal 5s lane timeout without racing.
const LITE_TIMEOUT_MS = 3_000;
const FULL_TIMEOUT_MS = 8_000;

// SWR cache key — sessionStorage scoped per tab.
const CACHE_KEY = 'mobius.terminalState.v1';
// Anything older than this is presented to consumers as `stale`.
const STALE_AFTER_MS = 120_000;

export type TerminalMode = 'green' | 'yellow' | 'red';

export interface TerminalDomain {
  key: string;
  label: string;
  score: number;
  agent: string;
}

export interface TerminalAnomaly {
  label: string;
  severity: string;
  agentName: string;
}

export interface TerminalState {
  gi: number;
  mode: TerminalMode;
  cycle: string;
  overall_sentiment: number;
  domains: TerminalDomain[];
  anomalies: TerminalAnomaly[];
  echo: {
    totalIngested: number;
    avgMii: number;
  };
  timestamp: string;
  /** When this snapshot was fetched (epoch ms). */
  fetchedAt: number;
  /** True when this value came from cache and is older than STALE_AFTER_MS. */
  stale: boolean;
  /** Source lane — 'lite' is the fast header slice, 'full' is the heavy aggregator. */
  source: 'lite' | 'full' | 'cache';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function readString(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback;
}

function readMode(value: unknown): TerminalMode {
  if (value === 'green' || value === 'yellow' || value === 'red') {
    return value;
  }
  return 'yellow';
}

function readNestedRecord(root: unknown, path: string[]): Record<string, unknown> | null {
  let cur: unknown = root;
  for (const key of path) {
    if (!isRecord(cur)) return null;
    cur = cur[key];
  }
  return isRecord(cur) ? cur : null;
}

function parseDomains(data: unknown): TerminalDomain[] {
  const sentimentRoot = readNestedRecord(data, ['sentiment']);
  if (!sentimentRoot) return [];
  const dataBlock = sentimentRoot['data'];
  if (!isRecord(dataBlock)) return [];
  const raw = dataBlock['domains'];
  if (!Array.isArray(raw)) return [];

  const out: TerminalDomain[] = [];
  for (const item of raw) {
    if (!isRecord(item)) continue;
    const key = readString(item['key'], '');
    if (!key) continue;
    const label = readString(item['label'], '') || key;
    out.push({
      key,
      label,
      score: readNumber(item['score'], 0),
      agent: readString(item['agent'], ''),
    });
  }
  return out;
}

function parseAnomalies(data: unknown): TerminalAnomaly[] {
  const signalsRoot = readNestedRecord(data, ['signals']);
  if (!signalsRoot) return [];
  const dataBlock = signalsRoot['data'];
  if (!isRecord(dataBlock)) return [];
  const raw = dataBlock['anomalies'];
  if (!Array.isArray(raw)) return [];

  const out: TerminalAnomaly[] = [];
  for (const item of raw) {
    if (!isRecord(item)) continue;
    const agentName =
      readString(item['agentName'], '') ||
      readString(item['agent'], '');
    out.push({
      label: readString(item['label'], ''),
      severity: readString(item['severity'], ''),
      agentName,
    });
  }
  return out;
}

function parseEcho(data: unknown): { totalIngested: number; avgMii: number } {
  const echoRoot = readNestedRecord(data, ['echo']);
  if (!echoRoot) return { totalIngested: 0, avgMii: 0 };
  const dataBlock = echoRoot['data'];
  if (!isRecord(dataBlock)) return { totalIngested: 0, avgMii: 0 };

  const status = dataBlock['status'];
  const integrity = dataBlock['integrity'];
  const statusRec = isRecord(status) ? status : null;
  const integrityRec = isRecord(integrity) ? integrity : null;

  return {
    totalIngested: readNumber(statusRec?.['totalIngested'], 0),
    avgMii: readNumber(integrityRec?.['avgMii'], 0),
  };
}

function parseIntegritySlice(data: unknown): {
  gi: number;
  mode: TerminalMode;
  cycle: string;
} {
  const integrityRoot = readNestedRecord(data, ['integrity']);
  if (!integrityRoot) {
    return { gi: 0, mode: 'yellow', cycle: 'C-?' };
  }
  const dataBlock = integrityRoot['data'];
  if (!isRecord(dataBlock)) {
    return { gi: 0, mode: 'yellow', cycle: 'C-?' };
  }
  return {
    gi: readNumber(dataBlock['global_integrity'], 0),
    mode: readMode(dataBlock['mode']),
    cycle: readString(dataBlock['cycle'], 'C-?'),
  };
}

function parseOverallSentiment(data: unknown): number {
  const sentimentRoot = readNestedRecord(data, ['sentiment']);
  if (!sentimentRoot) return 0;
  const dataBlock = sentimentRoot['data'];
  if (!isRecord(dataBlock)) return 0;
  return readNumber(dataBlock['overall_sentiment'], 0);
}

/**
 * Parse either the `snapshot` (full aggregator) or `snapshot-lite` payload.
 *
 * The lite payload is expected to expose a flat header slice plus a small
 * domain list — we accept a handful of shapes here so the bridge is resilient
 * to minor schema churn on the terminal side.
 */
function parseTerminalPayload(
  data: unknown,
  source: 'lite' | 'full',
): TerminalState | null {
  if (!isRecord(data)) return null;

  const flat = isRecord(data) ? data : {};

  // Try the full structured payload first.
  const integrity = parseIntegritySlice(data);
  const domains = parseDomains(data);
  const anomalies = parseAnomalies(data);
  const echo = parseEcho(data);
  const overall_sentiment = parseOverallSentiment(data);

  // Fall back to flat lite fields when the structured slices are empty.
  const gi = integrity.gi || readNumber(flat['gi'], readNumber(flat['global_integrity'], 0));
  const mode = integrity.mode !== 'yellow'
    ? integrity.mode
    : readMode(flat['mode']);
  const cycle = integrity.cycle !== 'C-?'
    ? integrity.cycle
    : readString(flat['cycle'], 'C-?');

  let liteDomains = domains;
  if (liteDomains.length === 0 && Array.isArray(flat['domains'])) {
    liteDomains = [];
    for (const item of flat['domains'] as unknown[]) {
      if (!isRecord(item)) continue;
      const key = readString(item['key'], '');
      if (!key) continue;
      liteDomains.push({
        key,
        label: readString(item['label'], '') || key,
        score: readNumber(item['score'], 0),
        agent: readString(item['agent'], ''),
      });
    }
  }

  const liteOverall = overall_sentiment || readNumber(flat['overall_sentiment'], 0);

  const timestamp =
    readString(flat['timestamp'], '') || new Date().toISOString();

  return {
    gi,
    mode,
    cycle,
    overall_sentiment: liteOverall,
    domains: liteDomains,
    anomalies,
    echo,
    timestamp,
    fetchedAt: Date.now(),
    stale: false,
    source,
  };
}

function readCache(): TerminalState | null {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TerminalState;
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(state: TerminalState): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(state));
  } catch {
    // Quota or disabled storage — non-fatal.
  }
}

async function fetchSnapshot(
  url: string,
  timeoutMs: number,
  source: 'lite' | 'full',
): Promise<TerminalState | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return null;
    const data: unknown = await res.json();
    return parseTerminalPayload(data, source);
  } catch {
    return null;
  }
}

/**
 * Fetch the terminal state for header chip + WorldSignalStrip consumption.
 *
 * Strategy:
 *   1. Try the lightweight `/snapshot-lite` endpoint (3s budget).
 *      This is the only call most shell renders need — it carries
 *      `integrity.*` + `sentiment.domains/overall_sentiment`.
 *   2. If lite is unavailable (older terminal deploys without the route, 404,
 *      network error, or timeout), fall through to the heavy
 *      `/snapshot` aggregator with a generous 8s budget. The previous 5s
 *      abort raced the terminal's own lane timeout and was the root cause of
 *      the chip silently never appearing.
 *   3. On total failure, surface the last-known-good value from
 *      sessionStorage stamped with `stale: true` so the UI can degrade
 *      gracefully (grayed-out GI chip) instead of blanking.
 */
export async function fetchTerminalState(): Promise<TerminalState | null> {
  const lite = await fetchSnapshot(TERMINAL_SNAPSHOT_LITE, LITE_TIMEOUT_MS, 'lite');
  if (lite) {
    writeCache(lite);
    return lite;
  }

  const full = await fetchSnapshot(TERMINAL_SNAPSHOT_FULL, FULL_TIMEOUT_MS, 'full');
  if (full) {
    writeCache(full);
    return full;
  }

  const cached = readCache();
  if (cached) {
    const age = Date.now() - (cached.fetchedAt ?? 0);
    return {
      ...cached,
      stale: age > STALE_AFTER_MS,
      source: 'cache',
    };
  }
  return null;
}

/**
 * Explicit hook for lab code that needs the full aggregator payload
 * (e.g. Reflections with `echo.*` or ATLAS sentinels consuming anomalies).
 * Normal header consumers should just call `fetchTerminalState()`.
 */
export async function fetchFullTerminalState(): Promise<TerminalState | null> {
  const full = await fetchSnapshot(TERMINAL_SNAPSHOT_FULL, FULL_TIMEOUT_MS, 'full');
  if (full) {
    writeCache(full);
    return full;
  }
  const cached = readCache();
  if (cached) {
    const age = Date.now() - (cached.fetchedAt ?? 0);
    return { ...cached, stale: age > STALE_AFTER_MS, source: 'cache' };
  }
  return null;
}
