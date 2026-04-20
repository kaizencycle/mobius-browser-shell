import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Loader2, MapPin, Radio, RefreshCw, Shield } from 'lucide-react';
import {
  getHiveWorldBaseUrl,
  loadBundledHiveWorld,
  loadHiveWorldBundle,
  type HiveWorldBundle,
} from '../../src/lib/meshWorldFetch';

type LoadStatus = 'idle' | 'loading' | 'ok' | 'error';

export const MeshWorldPanel: React.FC = () => {
  const [status, setStatus] = useState<LoadStatus>('idle');
  const [bundle, setBundle] = useState<HiveWorldBundle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lineIndex, setLineIndex] = useState(0);

  const refresh = useCallback(async () => {
    setStatus('loading');
    setError(null);
    const controller = new AbortController();
    try {
      const remote = await loadHiveWorldBundle(controller.signal);
      setBundle(remote);
      setStatus('ok');
      setLineIndex(0);
    } catch (primaryErr) {
      try {
        const local = await loadBundledHiveWorld(controller.signal);
        setBundle(local);
        setStatus('ok');
        setLineIndex(0);
        setError(
          primaryErr instanceof Error
            ? `Remote HIVE world unavailable (${primaryErr.message}). Showing bundled snapshot.`
            : 'Remote HIVE world unavailable. Showing bundled snapshot.',
        );
      } catch (fallbackErr) {
        setBundle(null);
        setStatus('error');
        setError(
          fallbackErr instanceof Error ? fallbackErr.message : 'Failed to load world state.',
        );
      }
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const lines = bundle?.sentinel?.lines ?? [];
    if (lines.length <= 1) return;
    const t = window.setInterval(() => {
      setLineIndex((i) => (i + 1) % lines.length);
    }, 8000);
    return () => window.clearInterval(t);
  }, [bundle?.sentinel?.lines]);

  const sentinelLine =
    bundle?.sentinel?.lines?.length && bundle.sentinel.lines.length > 0
      ? bundle.sentinel.lines[lineIndex % bundle.sentinel.lines.length]
      : null;

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

      {error && status === 'ok' && (
        <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-900">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>{error}</span>
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

      {bundle && (
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
              {bundle.currentCycle.integrity?.mic_readiness ?? '—'} · KV{' '}
              {bundle.currentCycle.kv_status ?? '—'}
            </p>
          </div>

          <div className="rounded-md border border-stone-100 p-3 space-y-1 sm:col-span-2">
            <p className="text-[11px] font-medium text-stone-600">Active event</p>
            <p className="text-sm font-semibold text-stone-900">
              {bundle.activeEvent?.title ?? 'None'}
            </p>
            {bundle.activeEvent?.summary && (
              <p className="text-xs text-stone-600 leading-relaxed">{bundle.activeEvent.summary}</p>
            )}
          </div>

          <div className="rounded-md border border-stone-100 p-3 space-y-1 sm:col-span-2">
            <p className="text-[11px] font-medium text-stone-600">Active quest</p>
            <p className="text-sm font-semibold text-stone-900">
              {bundle.activeQuest?.title ?? 'None'}
            </p>
            {bundle.activeQuest?.objective && (
              <p className="text-xs text-stone-600 leading-relaxed">{bundle.activeQuest.objective}</p>
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
        </div>
      )}
    </div>
  );
};
