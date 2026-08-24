import { env } from '../../config/env';

/** Payload for ledger event_type=hive.player_event (C-341 citizen_history lane). */
export interface HivePlayerEventPayload {
  world: string;
  zone: string;
  action: string;
  target_id: string;
  cycle_id: string;
  civic_id: string;
  client_ts: string;
}

export interface PostHivePlayerEventResult {
  ok: boolean;
  eventId?: string;
  error?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

/**
 * Fire-and-forget POST of hive.player_event to the Civic ledger pseudonymous lane.
 * Retries only on a definite HTTP rejection (never on a thrown/timed-out fetch —
 * the ledger has no idempotency key, so an ambiguous failure might have already
 * been committed server-side, and retrying it could double-write). Never throws.
 * Marks target posted on success for idempotent reloads.
 */
export async function postHivePlayerEvent(
  attestUrl: string,
  payload: HivePlayerEventPayload,
  options?: { markPosted?: (key: string) => void; cacheKey?: string },
): Promise<PostHivePlayerEventResult> {
  const body = {
    event_type: 'hive.player_event',
    civic_id: payload.civic_id,
    lab_source: 'hive',
    payload,
  };

  for (let attempt = 0; attempt < 2; attempt++) {
    let res: Response;
    try {
      res = await fetch(attestUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(8000),
      });
    } catch (err) {
      // Thrown fetch (network error, timeout, aborted signal) — we don't know
      // whether the server received and committed this write before the
      // response was lost. Fail immediately rather than risk a duplicate.
      return { ok: false, error: String(err) };
    }

    if (!res.ok) {
      // A definite HTTP response means the server validated and rejected the
      // request before writing anything (civic_id/rate-limit/payload checks
      // all run before the INSERT) — safe to retry once.
      if (attempt === 1) return { ok: false, error: `ledger_${res.status}` };
      continue;
    }

    // The write landed (2xx). Mark posted and never retry past this point —
    // a response-body parse failure here must not trigger a duplicate POST.
    if (options?.markPosted && options.cacheKey) {
      options.markPosted(options.cacheKey);
    }
    try {
      const data: unknown = await res.json();
      const eventId = isRecord(data)
        ? readString(data['event_id']) ?? readString(data['id'])
        : undefined;
      return { ok: true, eventId };
    } catch {
      return { ok: true };
    }
  }

  return { ok: false, error: 'unknown' };
}

export function defaultHiveAttestUrl(): string {
  return `${env.api.ledger.replace(/\/$/, '')}/ledger/attest`;
}
