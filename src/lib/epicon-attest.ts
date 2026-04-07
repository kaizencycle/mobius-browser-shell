import { env } from '../../config/env';

export interface HumanAttestation {
  civic_id: string;
  event_type: 'civic-observation' | 'governance-event' | 'community-action';
  title: string;
  summary: string;
  location?: string;
  evidence?: string;
  confidence: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

export async function submitAttestation(
  a: HumanAttestation
): Promise<{ ok: boolean; entryId?: string; error?: string }> {
  const base = env.api.ledger.replace(/\/$/, '');
  try {
    const res = await fetch(`${base}/ledger/attest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agent_id: a.civic_id,
        event_type: a.event_type,
        payload: {
          title: a.title,
          summary: a.summary,
          location: a.location,
          evidence: a.evidence,
          confidence: a.confidence,
          source: 'browser-shell-human',
        },
        timestamp: new Date().toISOString(),
        civic_id: a.civic_id,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return { ok: false, error: `ledger_${res.status}` };

    const data: unknown = await res.json();
    if (!isRecord(data)) {
      return { ok: true };
    }
    const entryId = readString(data['event_id']) ?? readString(data['id']);
    return { ok: true, entryId };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}
