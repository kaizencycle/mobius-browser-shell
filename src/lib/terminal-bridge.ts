const TERMINAL_SNAPSHOT =
  'https://mobius-civic-ai-terminal.vercel.app/api/terminal/snapshot';

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

function parseTerminalPayload(data: unknown): TerminalState | null {
  if (!isRecord(data)) return null;

  const { gi, mode, cycle } = parseIntegritySlice(data);
  const domains = parseDomains(data);
  const anomalies = parseAnomalies(data);
  const echo = parseEcho(data);
  const overall_sentiment = parseOverallSentiment(data);
  const timestamp =
    readString(data['timestamp'], '') || new Date().toISOString();

  return {
    gi,
    mode,
    cycle,
    overall_sentiment,
    domains,
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
