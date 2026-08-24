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
 * One retry; never throws. Marks target posted on success for idempotent reloads.
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
      // Network-level failure before any response — nothing was written, safe to retry.
      if (attempt === 1) return { ok: false, error: String(err) };
      continue;
    }

    if (!res.ok) {
      // Request was rejected — nothing was written, safe to retry once.
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
