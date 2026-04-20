import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  Loader2,
  MapPin,
  Radio,
  RefreshCw,
  Shield,
} from 'lucide-react';
import {
  getHiveWorldBaseUrl,
  loadBundledHiveWorld,
  loadHiveWorldBundle,
  type HiveWorldBundle,
} from '../../src/lib/meshWorldFetch';
import type { HivePlayableSave } from '../../src/lib/hive-action-types';
import { HIVE_LOCAL_STORAGE_KEY } from '../../src/lib/hive-action-types';
import { defaultSaveFromBundle, mergeQuestFromBundle, zeusDialogue } from '../../src/lib/hive-action-engine';

type LoadStatus = 'idle' | 'loading' | 'ok' | 'error';

type ActionId = 'inspect_beacon' | 'view_fallback_path' | 'acknowledge_sentinel';

interface ActionResponse {
  ok: boolean;
  save?: HivePlayableSave;
  dialogue?: string;
  questComplete?: boolean;
  error?: string;
}

function loadSaveFromStorage(seedCycleId: string, bundleQuest: HiveWorldBundle['activeQuest']): HivePlayableSave {
  try {
    const raw = localStorage.getItem(HIVE_LOCAL_STORAGE_KEY);
    if (!raw) return defaultSaveFromBundle(seedCycleId, bundleQuest);
    const parsed = JSON.parse(raw) as HivePlayableSave;
    if (parsed.version !== 1 || parsed.seed_cycle_id !== seedCycleId) {
      return defaultSaveFromBundle(seedCycleId, bundleQuest);
    }
    return {
      ...parsed,
      quest: mergeQuestFromBundle(parsed.quest, bundleQuest),
    };
  } catch {
    return defaultSaveFromBundle(seedCycleId, bundleQuest);
  }
}

function persistSave(save: HivePlayableSave): void {
  try {
    localStorage.setItem(HIVE_LOCAL_STORAGE_KEY, JSON.stringify(save));
  } catch {
    // quota or private mode
  }
}

export const MeshWorldPanel: React.FC = () => {
  const [status, setStatus] = useState<LoadStatus>('idle');
  const [bundle, setBundle] = useState<HiveWorldBundle | null>(null);
  const [save, setSave] = useState<HivePlayableSave | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fetchWarning, setFetchWarning] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [lineIndex, setLineIndex] = useState(0);

  const refresh = useCallback(async () => {
    setStatus('loading');
    setError(null);
    setFetchWarning(null);
    const controller = new AbortController();
    let nextBundle: HiveWorldBundle;
    try {
      nextBundle = await loadHiveWorldBundle(controller.signal);
    } catch (primaryErr) {
      try {
        nextBundle = await loadBundledHiveWorld(controller.signal);
        setFetchWarning(
          primaryErr instanceof Error
            ? `Remote HIVE world unavailable (${primaryErr.message}). Showing bundled snapshot.`
            : 'Remote HIVE world unavailable. Showing bundled snapshot.',
        );
      } catch (fallbackErr) {
        setBundle(null);
        setSave(null);
        setStatus('error');
        setError(
          fallbackErr instanceof Error ? fallbackErr.message : 'Failed to load world state.',
        );
        return;
      }
    }

    setBundle(nextBundle);
    const seedId = nextBundle.currentCycle.cycle.id;
    const merged = loadSaveFromStorage(seedId, nextBundle.activeQuest);
    setSave(merged);
    persistSave(merged);
    setStatus('ok');
    setLineIndex(0);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const questComplete = save?.quest.status === 'completed';

  const effectiveEventId = useMemo(() => {
    if (!bundle || !save) return null;
    if (save.active_event_id !== null) return save.active_event_id;
    return bundle.currentCycle.active_event_id;
  }, [bundle, save]);

  const effectiveEvent = useMemo(() => {
    if (questComplete) return null;
    if (!bundle?.activeEvent) return null;
    if (effectiveEventId === null) return null;
    if (effectiveEventId && bundle.activeEvent.id !== effectiveEventId) return null;
    return bundle.activeEvent;
  }, [bundle, effectiveEventId, questComplete]);

  const kvDisplay = save?.kv_status ?? bundle?.currentCycle.kv_status;

  const sentinelLine = useMemo(() => {
    if (!bundle?.sentinel || !save) return null;
    const sid = bundle.sentinel.id?.toLowerCase();
    if (sid === 'zeus') {
      return zeusDialogue(save);
    }
    const lines = bundle.sentinel.lines ?? [];
    if (lines.length === 0) return null;
    return lines[lineIndex % lines.length];
  }, [bundle?.sentinel, save, lineIndex]);

  useEffect(() => {
    const lines = bundle?.sentinel?.lines ?? [];
    if (!lines.length || bundle?.sentinel?.id?.toLowerCase() === 'zeus') return;
    const t = window.setInterval(() => {
      setLineIndex((i) => (i + 1) % lines.length);
    }, 8000);
    return () => window.clearInterval(t);
  }, [bundle?.sentinel?.lines, bundle?.sentinel?.id]);

  const showSignalBanner =
    !questComplete &&
    (kvDisplay === 'degraded' || effectiveEventId === 'signal-fog' || bundle?.currentCycle.active_event_id === 'signal-fog');

  const steps = save?.quest.steps ?? [];
  const progressPct = Math.round(((save?.quest.progress ?? 0) as number) * 100);

  const runAction = async (action: ActionId) => {
    if (!save || !bundle) return;
    setActionBusy(true);
    setActionError(null);
    const cycle = bundle.currentCycle.cycle.id;
    try {
      const res = await fetch('/api/hive/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          cycle,
          actor: 'user',
          save,
        }),
      });
      const data = (await res.json()) as ActionResponse;
      if (!res.ok || !data.ok || !data.save) {
        setActionError(data.error ?? `Request failed (${res.status})`);
        return;
      }
      setSave(data.save);
      persistSave(data.save);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setActionBusy(false);
    }
  };

  const resetProgress = () => {
    if (!bundle) return;
    const fresh = defaultSaveFromBundle(bundle.currentCycle.cycle.id, bundle.activeQuest);
    setSave(fresh);
    persistSave(fresh);
    setActionError(null);
  };

  return (
    <div className="border border-stone-200 rounded-lg bg-white p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Radio className="w-4 h-4 text-indigo-600 shrink-0" />
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-stone-800">Mesh world (HIVE)</h3>
            <p className="text-[11px] text-stone-500 truncate" title={getHiveWorldBaseUrl()}>
              Source: {bundle?.sourceUrl ?? getHiveWorldBaseUrl()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={resetProgress}
            disabled={!bundle || status === 'loading'}
            className="text-[11px] px-2 py-1 rounded border border-stone-200 text-stone-600 hover:bg-stone-50 disabled:opacity-50"
          >
            Reset loop
          </button>
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={status === 'loading'}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md border border-stone-200 bg-stone-50 hover:bg-stone-100 disabled:opacity-50"
          >
            {status === 'loading' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            Refresh
          </button>
        </div>
      </div>

      {fetchWarning && status === 'ok' && (
        <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-900">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>{fetchWarning}</span>
        </div>
      )}

      {status === 'error' && (
        <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-900">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>{error ?? 'Unknown error'}</span>
        </div>
      )}

      {status === 'loading' && !bundle && (
        <div className="flex items-center gap-2 text-xs text-stone-500 py-6 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading world state…
        </div>
      )}

      {bundle && save && (
        <>
          {showSignalBanner && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-100/90 px-3 py-2 text-[12px] text-amber-950"
            >
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-700" />
              <div>
                <p className="font-semibold">Signal Fog</p>
                <p className="text-[11px] text-amber-900/90 mt-0.5">
                  Operator KV is degraded. Complete the quest to stabilize the beacon.
                </p>
              </div>
            </div>
          )}

          {questComplete && (
            <div className="flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12px] text-emerald-950">
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600" />
              <div>
                <p className="font-semibold">Beacon restored</p>
                <p className="text-[11px] text-emerald-900/90 mt-0.5">
                  The signal stabilizes. The fog recedes.
                </p>
              </div>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-stone-100 bg-stone-50 p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-stone-600">
                <MapPin className="w-3.5 h-3.5" />
                Current cycle
              </div>
              <p className="text-sm font-semibold text-stone-900">
                {bundle.currentCycle.cycle.id}
                {bundle.currentCycle.cycle.label ? ` — ${bundle.currentCycle.cycle.label}` : ''}
              </p>
              {bundle.currentCycle.updated_at && (
                <p className="text-[10px] text-stone-500">
                  Updated {new Date(bundle.currentCycle.updated_at).toLocaleString()}
                </p>
              )}
            </div>

            <div className="rounded-md border border-stone-100 bg-stone-50 p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-stone-600">
                <Shield className="w-3.5 h-3.5" />
                Vault / integrity
              </div>
              <p className="text-sm text-stone-900">
                {bundle.currentCycle.vault?.label ?? 'Vault'}{' '}
                {typeof bundle.currentCycle.vault?.progress === 'number'
                  ? `— ${Math.round(bundle.currentCycle.vault.progress * 100)}%`
                  : ''}
              </p>
              <p className="text-xs text-stone-600">
                GI {bundle.currentCycle.integrity?.gi ?? '—'} · MIC{' '}
                {bundle.currentCycle.integrity?.mic_readiness ?? '—'} · KV {kvDisplay ?? '—'}
              </p>
            </div>

            <div className="rounded-md border border-stone-100 p-3 space-y-2 sm:col-span-2">
              <p className="text-[11px] font-medium text-stone-600">Quest progress</p>
              <p className="text-sm font-semibold text-stone-900">{save.quest.title}</p>
              <div className="h-2 rounded-full bg-stone-200 overflow-hidden">
                <div
                  className="h-full bg-indigo-600 transition-all duration-300"
                  style={{ width: `${Math.min(100, progressPct)}%` }}
                />
              </div>
              <p className="text-[11px] text-stone-500">{progressPct}% complete</p>
              <ul className="space-y-1.5">
                {steps.map((s) => (
                  <li key={s.id} className="flex items-center gap-2 text-xs text-stone-700">
                    {s.completed ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <Circle className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    )}
                    <span>
                      {s.id === 'inspect' ? 'Inspect Beacon' : s.id === 'fallback' ? 'Stabilize fallback path' : s.id}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-md border border-stone-100 p-3 space-y-1 sm:col-span-2">
              <p className="text-[11px] font-medium text-stone-600">Active event</p>
              <p className="text-sm font-semibold text-stone-900">
                {effectiveEvent?.title ?? (questComplete ? 'Resolved' : 'None')}
              </p>
              {effectiveEvent?.summary && !questComplete && (
                <p className="text-xs text-stone-600 leading-relaxed">{effectiveEvent.summary}</p>
              )}
            </div>

            {sentinelLine && (
              <div className="rounded-md border border-indigo-100 bg-indigo-50/60 p-3 sm:col-span-2">
                <p className="text-[11px] font-medium text-indigo-900">
                  {bundle.sentinel?.name ?? 'Sentinel'}
                </p>
                <p className="text-sm text-indigo-950 leading-relaxed mt-1">{sentinelLine}</p>
              </div>
            )}

            <div className="rounded-md border border-stone-200 bg-stone-50/80 p-3 space-y-2 sm:col-span-2">
              <p className="text-[11px] font-medium text-stone-700">Actions</p>
              {actionError && (
                <p className="text-[11px] text-red-600">{actionError}</p>
              )}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={actionBusy || questComplete || steps.find((x) => x.id === 'inspect')?.completed}
                  onClick={() => void runAction('inspect_beacon')}
                  className="px-3 py-1.5 text-xs font-medium rounded-md bg-stone-900 text-white hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Inspect Beacon
                </button>
                <button
                  type="button"
                  disabled={actionBusy || questComplete || !steps.find((x) => x.id === 'inspect')?.completed}
                  onClick={() => void runAction('view_fallback_path')}
                  className="px-3 py-1.5 text-xs font-medium rounded-md border border-stone-300 bg-white hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  View Fallback Path
                </button>
                <button
                  type="button"
                  disabled={actionBusy || save.dialogue_acknowledged}
                  onClick={() => void runAction('acknowledge_sentinel')}
                  className="px-3 py-1.5 text-xs font-medium rounded-md border border-indigo-200 text-indigo-900 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Acknowledge Sentinel
                </button>
              </div>
              {save.interaction_log.events.length > 0 && (
                <p className="text-[10px] text-stone-500 pt-1">
                  Logged {save.interaction_log.events.length} interaction
                  {save.interaction_log.events.length === 1 ? '' : 's'} (local + server when API available).
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
