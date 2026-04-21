/**
 * Mobius Browser Shell ↔ Terminal bridge.
 *
 * Single source of truth for all shell code that needs terminal telemetry.
 * Two entry points:
 *
 *   - fetchTerminalState()      — lite-first, falls back to full, SWR-cached.
 *                                 Use this for any header, footer, or strip
 *                                 render that only needs GI / mode / cycle /
 *                                 tripwire / heartbeat.
 *   - fetchFullTerminalState()  — force the full aggregator for labs that
 *                                 need signals[], agents[], lanes[], echo[].
 *
 * Both return a `TerminalState` that is a flat, consumer-friendly projection
 * of the terminal payload. When network fails, we surface the last-known-good
 * from sessionStorage stamped with `stale: true`.
 *
 * The raw terminal schemas we parse are documented inline against real live
 * payloads (2026-04-16, cycle C-283).
 */

import { env } from '../../config/env';

function terminalOrigin(): string {
  return env.terminalOrigin.replace(/\/+$/, '');
}

function terminalSnapshotLiteUrl(): string {
  return `${terminalOrigin()}/api/terminal/snapshot-lite`;
}

function terminalSnapshotFullUrl(): string {
  return `${terminalOrigin()}/api/terminal/snapshot`;
}

// Fetch budgets. The terminal's own internal lane timeout is 5s, so the
// previous 5s hard abort raced it and silently returned null. We give lite
// a tight budget (it's fast by design), and the full aggregator enough
// headroom to actually beat the terminal's internal race.
const LITE_TIMEOUT_MS = 3_000;
const FULL_TIMEOUT_MS = 8_000;

// Retry discipline. Lite gets one cheap retry with short jitter. Full gets
// none by default — callers that want it can retry at their cadence.
const LITE_RETRIES = 1;
const RETRY_BASE_MS = 350;

// SWR cache scoped per tab.
const CACHE_KEY = 'mobius.terminalState.v2';
const STALE_AFTER_MS = 120_000;

export type TerminalMode = 'green' | 'yellow' | 'red';
export type LaneState =
  | 'healthy'
  | 'degraded'
  | 'stale'
  | 'promotable'
  | 'unknown';
export type SignalSeverity = 'nominal' | 'watch' | 'alert' | 'critical';

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

/** A single raw micro-agent signal from the terminal signals lane. */
export interface TerminalSignal {
  agentName: string;
  source: string;
  value: number;
  label: string;
  severity: SignalSeverity;
}

/** Lane summary (integrity, signals, tripwire, echo, …). */
export interface TerminalLane {
  key: string;
  ok: boolean;
  state: LaneState;
  message: string;
  lastUpdated: string;
}

/** Integrity sub-scores used to compute the Digital Hygiene score. */
export interface IntegritySignalScores {
  quality: number;
  freshness: number;
  stability: number;
  system: number;
  information: number;
  geopolitics: number;
  economy: number;
  sentiment: number;
}

/** Sentinel heartbeat entry (ATLAS, ZEUS, HERMES, ECHO, …). */
export interface TerminalAgent {
  id: string;
  name: string;
  role: string;
  tier: string;
  status: string;
  detail: string;
  heartbeatOk: boolean;
}

export interface TerminalState {
  // Header slice
  gi: number;
  mode: TerminalMode;
  cycle: string;
  degraded: boolean;
  terminalStatus: string;

  // Legacy header-strip data. Kept for backwards compatibility with
  // WorldSignalStrip consumers that predate the richer payload.
  overall_sentiment: number;
  domains: TerminalDomain[];
  anomalies: TerminalAnomaly[];

  // Rich structured projection for lab code.
  lanes: Record<string, TerminalLane>;
  integritySignals: IntegritySignalScores;
  signals: {
    composite: number;
    anomalies: number;
    healthy: boolean;
    all: TerminalSignal[];
  };
  tripwire: { elevated: boolean; count: number };
  pulse: { composite: number; instruments: number; anomalies: number };
  agents: TerminalAgent[];
  echo: { totalIngested: number; avgMii: number };
  heartbeat: { runtime: string | null; journal: string | null };

  // Provenance
  timestamp: string;
  fetchedAt: number;
  stale: boolean;
  source: 'lite' | 'full' | 'cache';
}

// ── Primitive helpers ────────────────────────────────────────────────────────

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function readString(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback;
}

function readBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function readMode(value: unknown): TerminalMode {
  if (value === 'green' || value === 'yellow' || value === 'red') {
    return value;
  }
  return 'yellow';
}

function readLaneState(value: unknown): LaneState {
  if (
    value === 'healthy' ||
    value === 'degraded' ||
    value === 'stale' ||
    value === 'promotable'
  ) {
    return value;
  }
  return 'unknown';
}

function readSeverity(value: unknown): SignalSeverity {
  if (
    value === 'nominal' ||
    value === 'watch' ||
    value === 'alert' ||
    value === 'critical'
  ) {
    return value;
  }
  return 'nominal';
}

function readNestedRecord(
  root: unknown,
  path: string[],
): Record<string, unknown> | null {
  let cur: unknown = root;
  for (const key of path) {
    if (!isRecord(cur)) return null;
    cur = cur[key];
  }
  return isRecord(cur) ? cur : null;
}

// ── Structured parsers ───────────────────────────────────────────────────────

function parseLanes(raw: unknown): Record<string, TerminalLane> {
  const out: Record<string, TerminalLane> = {};
  if (!Array.isArray(raw)) return out;
  for (const item of raw) {
    if (!isRecord(item)) continue;
    const key = readString(item['key'], '');
    if (!key) continue;
    out[key] = {
      key,
      ok: readBoolean(item['ok'], false),
      state: readLaneState(item['state']),
      message: readString(item['message'], ''),
      lastUpdated: readString(item['lastUpdated'], ''),
    };
  }
  return out;
}

function parseLanesFromLiteShape(raw: unknown): Record<string, TerminalLane> {
  const out: Record<string, TerminalLane> = {};
  if (!isRecord(raw)) return out;
  for (const [key, rec] of Object.entries(raw)) {
    if (!isRecord(rec)) continue;
    const ok = readBoolean(rec['ok'], false);
    const healthy = readBoolean(rec['healthy'], ok);
    const freshness = readString(rec['freshness'], '');
    // Lite lane records don't carry `state`; derive one from signals.
    let state: LaneState = 'healthy';
    if (!ok) state = 'degraded';
    else if (freshness === 'stale') state = 'stale';
    else if (healthy === false) state = 'degraded';
    out[key] = {
      key,
      ok,
      state,
      message: '',
      lastUpdated: '',
    };
  }
  return out;
}

function parseIntegritySignals(data: unknown): IntegritySignalScores {
  const empty: IntegritySignalScores = {
    quality: 0,
    freshness: 0,
    stability: 0,
    system: 0,
    information: 0,
    geopolitics: 0,
    economy: 0,
    sentiment: 0,
  };
  const signals = readNestedRecord(data, ['integrity', 'data', 'signals']);
  if (!signals) return empty;
  return {
    quality: readNumber(signals['quality'], 0),
    freshness: readNumber(signals['freshness'], 0),
    stability: readNumber(signals['stability'], 0),
    system: readNumber(signals['system'], 0),
    information: readNumber(signals['information'], 0),
    geopolitics: readNumber(signals['geopolitics'], 0),
    economy: readNumber(signals['economy'], 0),
    sentiment: readNumber(signals['sentiment'], 0),
  };
}

function parseAllSignals(data: unknown): TerminalSignal[] {
  const out: TerminalSignal[] = [];
  const signalsData = readNestedRecord(data, ['signals', 'data']);
  if (!signalsData) return out;
  const list = signalsData['allSignals'];
  if (!Array.isArray(list)) return out;
  for (const item of list) {
    if (!isRecord(item)) continue;
    out.push({
      agentName: readString(item['agentName'], ''),
      source: readString(item['source'], ''),
      value: readNumber(item['value'], 0),
      label: readString(item['label'], ''),
      severity: readSeverity(item['severity']),
    });
  }
  return out;
}

function parseAgents(data: unknown): TerminalAgent[] {
  const out: TerminalAgent[] = [];
  const agents = readNestedRecord(data, ['agents', 'data']);
  if (!agents) return out;
  const list = agents['agents'];
  if (!Array.isArray(list)) return out;
  for (const item of list) {
    if (!isRecord(item)) continue;
    out.push({
      id: readString(item['id'], ''),
      name: readString(item['name'], ''),
      role: readString(item['role'], ''),
      tier: readString(item['tier'], ''),
      status: readString(item['status'], ''),
      detail: readString(item['detail'], ''),
      heartbeatOk: readBoolean(item['heartbeat_ok'], false),
    });
  }
  return out;
}

function parseDomains(data: unknown): TerminalDomain[] {
  // Legacy path — the current terminal exposes sentiment as a lane summary
  // rather than a keyed `sentiment.data.domains`. We still try the older
  // shape so the shell degrades cleanly when it appears.
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

function parseTerminalPayload(
  data: unknown,
  source: 'lite' | 'full',
): TerminalState | null {
  if (!isRecord(data)) return null;

  // `/snapshot-lite` is flat: gi, mode, cycle, degraded at root.
  // `/snapshot` puts those under integrity.data.{global_integrity,mode,cycle}.
  const integrityData = readNestedRecord(data, ['integrity', 'data']);

  const gi = readNumber(
    integrityData?.['global_integrity'],
    readNumber(data['gi'], 0),
  );
  const mode = readMode(
    integrityData?.['mode'] ?? data['mode'] ?? 'yellow',
  );
  const cycle = readString(
    (integrityData?.['cycle'] as unknown) ?? data['cycle'] ?? '',
    'C-?',
  );
  const terminalStatus = readString(
    integrityData?.['terminal_status'],
    readString(data['terminal_status'], 'unknown'),
  );
  const degraded = readBoolean(
    data['degraded'],
    readBoolean(integrityData?.['degraded'], false),
  );

  // Lanes: full uses an array under data.lanes, lite uses a flat object under data.lanes.
  let lanes: Record<string, TerminalLane>;
  if (Array.isArray(data['lanes'])) {
    lanes = parseLanes(data['lanes']);
  } else if (isRecord(data['lanes'])) {
    lanes = parseLanesFromLiteShape(data['lanes']);
  } else {
    lanes = {};
  }

  // Tripwire — lite exposes it under lanes.tripwire.
  const tripwireRec = isRecord(data['lanes'])
    ? (data['lanes'] as Record<string, unknown>)['tripwire']
    : null;
  const tripwire = {
    elevated: isRecord(tripwireRec)
      ? readBoolean(tripwireRec['elevated'], false)
      : false,
    count: isRecord(tripwireRec)
      ? readNumber(tripwireRec['count'], 0)
      : 0,
  };

  // Signals summary — lite has lanes.signals, full has signals.data.
  const signalsLite = isRecord(data['lanes'])
    ? (data['lanes'] as Record<string, unknown>)['signals']
    : null;
  const signalsData = readNestedRecord(data, ['signals', 'data']);
  const signals = {
    composite: isRecord(signalsLite)
      ? readNumber(signalsLite['composite'], 0)
      : readNumber(signalsData?.['composite'], 0),
    anomalies: isRecord(signalsLite)
      ? readNumber(signalsLite['anomalies'], 0)
      : readNumber(signalsData?.['anomalies'], 0),
    healthy: isRecord(signalsLite)
      ? readBoolean(signalsLite['healthy'], true)
      : readBoolean(signalsData?.['healthy'], true),
    all: parseAllSignals(data),
  };

  // Pulse — only present in lite at the top level.
  const pulseRec = isRecord(data['lanes'])
    ? (data['lanes'] as Record<string, unknown>)['pulse']
    : null;
  const pulse = {
    composite: isRecord(pulseRec) ? readNumber(pulseRec['composite'], 0) : 0,
    instruments: isRecord(pulseRec)
      ? readNumber(pulseRec['instruments'], 0)
      : 0,
    anomalies: isRecord(pulseRec) ? readNumber(pulseRec['anomalies'], 0) : 0,
  };

  const heartbeatRec = isRecord(data['heartbeat'])
    ? (data['heartbeat'] as Record<string, unknown>)
    : null;
  const heartbeat = {
    runtime: heartbeatRec
      ? readString(heartbeatRec['runtime'], '') || null
      : null,
    journal: heartbeatRec
      ? readString(heartbeatRec['journal'], '') || null
      : null,
  };

  const timestamp =
    readString(data['timestamp'], '') || new Date().toISOString();

  return {
    gi,
    mode,
    cycle,
    degraded,
    terminalStatus,

    overall_sentiment: readNumber(
      readNestedRecord(data, ['sentiment', 'data'])?.['overall_sentiment'],
      0,
    ),
    domains: parseDomains(data),
    anomalies: parseAnomalies(data),

    lanes,
    integritySignals: parseIntegritySignals(data),
    signals,
    tripwire,
    pulse,
    agents: parseAgents(data),
    echo: parseEcho(data),
    heartbeat,

    timestamp,
    fetchedAt: Date.now(),
    stale: false,
    source,
  };
}

// ── SWR cache ────────────────────────────────────────────────────────────────

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
    // Storage quota / disabled — non-fatal.
  }
}

// ── Fetch core ───────────────────────────────────────────────────────────────

function jitter(base: number, attempt: number): number {
  const exp = base * Math.pow(2, attempt);
  return Math.floor(exp * (0.75 + Math.random() * 0.5));
}

async function fetchSnapshotOnce(
  url: string,
  timeoutMs: number,
  source: 'lite' | 'full',
): Promise<{ state: TerminalState | null; retryAfterMs: number | null }> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(timeoutMs),
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      let retryAfterMs: number | null = null;
      const ra = res.headers.get('Retry-After');
      if (ra) {
        const secs = Number(ra);
        if (Number.isFinite(secs)) retryAfterMs = Math.min(secs * 1000, 10_000);
      }
      return { state: null, retryAfterMs };
    }
    const data: unknown = await res.json();
    return { state: parseTerminalPayload(data, source), retryAfterMs: null };
  } catch {
    return { state: null, retryAfterMs: null };
  }
}

async function fetchSnapshotWithRetry(
  url: string,
  timeoutMs: number,
  source: 'lite' | 'full',
  retries: number,
): Promise<TerminalState | null> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const { state, retryAfterMs } = await fetchSnapshotOnce(url, timeoutMs, source);
    if (state) return state;
    if (attempt >= retries) return null;
    const wait = retryAfterMs ?? jitter(RETRY_BASE_MS, attempt);
    await new Promise((r) => setTimeout(r, wait));
  }
  return null;
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Fetch the terminal state for header + WorldSignalStrip consumption.
 *
 * Strategy:
 *   1. `/snapshot-lite` (3 s budget, one retry with jitter).
 *   2. Fall through to `/snapshot` (8 s budget, no retry).
 *   3. On total failure, surface last-known-good from sessionStorage stamped
 *      with `stale: true` so the UI degrades to grayed-out rather than blank.
 */
export async function fetchTerminalState(): Promise<TerminalState | null> {
  const lite = await fetchSnapshotWithRetry(
    terminalSnapshotLiteUrl(),
    LITE_TIMEOUT_MS,
    'lite',
    LITE_RETRIES,
  );
  if (lite) {
    writeCache(lite);
    return lite;
  }

  const full = await fetchSnapshotWithRetry(
    terminalSnapshotFullUrl(),
    FULL_TIMEOUT_MS,
    'full',
    0,
  );
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

/**
 * Explicit hook for labs needing the full aggregator payload
 * (echo[], agents[], anomalies[]).
 */
export async function fetchFullTerminalState(): Promise<TerminalState | null> {
  const full = await fetchSnapshotWithRetry(
    terminalSnapshotFullUrl(),
    FULL_TIMEOUT_MS,
    'full',
    0,
  );
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

// ── Subscription API (for future SSE upgrade) ───────────────────────────────

/**
 * Subscribe to terminal state updates. Returns an unsubscribe function.
 *
 * Today this is a thin polling wrapper so call sites do not have to manage
 * intervals, visibility gating, or leak-safe state updates themselves.
 * When the terminal ships a Server-Sent Events endpoint, only this
 * implementation changes — callers stay on the same subscribe() API.
 */
export interface SubscribeOptions {
  /** Polling interval when the tab is visible. Default 60 s. */
  intervalMs?: number;
  /** Whether to fire an immediate fetch on subscribe. Default true. */
  immediate?: boolean;
  /** Use the full aggregator instead of lite-first. */
  full?: boolean;
}

export type TerminalSubscriber = (state: TerminalState | null) => void;

export function subscribeTerminalState(
  onUpdate: TerminalSubscriber,
  options: SubscribeOptions = {},
): () => void {
  const intervalMs = options.intervalMs ?? 60_000;
  const runFetch = options.full ? fetchFullTerminalState : fetchTerminalState;

  let cancelled = false;
  let timer: ReturnType<typeof setInterval> | null = null;

  const tick = () => {
    void runFetch().then((state) => {
      if (!cancelled) onUpdate(state);
    });
  };

  const start = () => {
    if (timer !== null) return;
    tick();
    timer = setInterval(tick, intervalMs);
  };

  const stop = () => {
    if (timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  };

  const onVisibility = () => {
    if (typeof document === 'undefined') return;
    if (document.visibilityState === 'visible') start();
    else stop();
  };

  if (options.immediate !== false) tick();
  if (typeof document !== 'undefined') {
    if (document.visibilityState === 'visible') start();
    document.addEventListener('visibilitychange', onVisibility);
  } else {
    start();
  }

  return () => {
    cancelled = true;
    stop();
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', onVisibility);
    }
  };
}

// ── Severity helpers (reused by Shield + Strip) ─────────────────────────────

/** Map terminal signal severity → a Shield severity bucket. */
export function shieldSeverityFromSignal(
  severity: SignalSeverity,
): 'info' | 'low' | 'medium' | 'high' | 'critical' {
  switch (severity) {
    case 'critical':
      return 'critical';
    case 'alert':
      return 'high';
    case 'watch':
      return 'medium';
    case 'nominal':
    default:
      return 'info';
  }
}

/**
 * Determine if a terminal signal relates to the cyber security / digital
 * hygiene space. This is a heuristic over the signal source names — the
 * terminal does not yet tag signals with a Shield-facing taxonomy.
 */
export function isCyberRelevantSignal(sig: TerminalSignal): boolean {
  const source = sig.source.toLowerCase();
  const label = sig.label.toLowerCase();
  const hay = `${source} ${label}`;
  return (
    hay.includes('github') ||
    hay.includes('npm') ||
    hay.includes('hacker news') ||
    hay.includes('self-ping') ||
    hay.includes('cve') ||
    hay.includes('security') ||
    hay.includes('tripwire') ||
    hay.includes('identity') ||
    hay.includes('daedalus') ||
    hay.includes('hermes')
  );
}

/**
 * Compute a 0-1 "Digital Hygiene" score blending terminal telemetry with
 * locally observable page posture. This is purposefully conservative: if a
 * terminal signal is missing we weight it at zero rather than assuming
 * "all good", so the score can only rise with positive evidence.
 */
export function computeDigitalHygieneScore(state: TerminalState | null): number {
  if (!state) return 0;
  const s = state.integritySignals;

  // Terminal-derived (0-1). Information + system + stability are the direct
  // hygiene proxies; freshness shows whether the signal stream itself is
  // healthy.
  const terminalScore =
    0.35 * s.information +
    0.25 * s.system +
    0.2 * s.stability +
    0.2 * s.freshness;

  // Tripwire penalty — any elevated tripwire drops hygiene by up to 0.25.
  const tripwirePenalty = state.tripwire.elevated ? 0.25 : 0;

  // Local page posture (0-1), heuristic.
  let local = 0.5;
  if (typeof window !== 'undefined') {
    if (window.location.protocol === 'https:') local += 0.25;
    if (navigator.cookieEnabled) local += 0.15;
    if ('credentials' in navigator) local += 0.1;
  }
  local = Math.min(1, local);

  const composite = 0.7 * Math.max(0, terminalScore - tripwirePenalty) + 0.3 * local;
  return Math.max(0, Math.min(1, composite));
}
