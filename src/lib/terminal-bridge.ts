const TERMINAL_SNAPSHOT =
  'https://mobius-civic-ai-terminal.vercel.app/api/terminal/snapshot';

type TerminalMode = 'green' | 'yellow' | 'red';

export interface TerminalState {
  gi: number;
  mode: TerminalMode;
  cycle: string;
  sentiment: Record<string, { score: number; agent: string }>;
  anomalies: Array<{ label: string; severity: string }>;
  echo: {
    totalIngested: number;
    avgMii: number;
  };
  timestamp: string;
}

/** Display order for the Shell world signal strip (terminal sentiment domains). */
export const WORLD_SIGNAL_DOMAIN_KEYS = [
  'CIVIC',
  'ENVIRON',
  'FINANCIAL',
  'NARRATIVE',
  'INFRASTR',
  'INSTITUTIONAL',
] as const;

export type WorldSignalDomainKey = (typeof WORLD_SIGNAL_DOMAIN_KEYS)[number];

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

function parseSentimentDomains(data: unknown): Record<string, { score: number; agent: string }> {
  const sentimentRoot = readNestedRecord(data, ['sentiment']);
  if (!sentimentRoot) return {};
  const dataBlock = sentimentRoot['data'];
  if (!isRecord(dataBlock)) return {};
  const domains = dataBlock['domains'];
  if (!Array.isArray(domains)) return {};

  const out: Record<string, { score: number; agent: string }> = {};
  for (const item of domains) {
    if (!isRecord(item)) continue;
    const key = readString(item['key'], '');
    if (!key) continue;
    out[key] = {
      score: readNumber(item['score'], 0),
      agent: readString(item['agent'], ''),
    };
  }
  return out;
}

function parseAnomalies(data: unknown): Array<{ label: string; severity: string }> {
  const signalsRoot = readNestedRecord(data, ['signals']);
  if (!signalsRoot) return [];
  const dataBlock = signalsRoot['data'];
  if (!isRecord(dataBlock)) return [];
  const raw = dataBlock['anomalies'];
  if (!Array.isArray(raw)) return [];

  const out: Array<{ label: string; severity: string }> = [];
  for (const item of raw) {
    if (!isRecord(item)) continue;
    out.push({
      label: readString(item['label'], ''),
      severity: readString(item['severity'], ''),
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

function parseTerminalPayload(data: unknown): TerminalState | null {
  if (!isRecord(data)) return null;

  const { gi, mode, cycle } = parseIntegritySlice(data);
  const sentiment = parseSentimentDomains(data);
  const anomalies = parseAnomalies(data);
  const echo = parseEcho(data);
  const timestamp =
    readString(data['timestamp'], '') || new Date().toISOString();

  return {
    gi,
    mode,
    cycle,
    sentiment,
    anomalies,
    echo,
    timestamp,
  };
}

export async function fetchTerminalState(): Promise<TerminalState | null> {
  try {
    const res = await fetch(TERMINAL_SNAPSHOT, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data: unknown = await res.json();
    return parseTerminalPayload(data);
  } catch {
    return null;
  }
}
