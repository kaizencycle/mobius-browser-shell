/**
 * C-357 degraded-state data hook — API failures never crash the shell.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export type DataStatus = 'loading' | 'live' | 'degraded';

export interface AsyncDataState<T> {
  data: T | null;
  status: DataStatus;
  refresh: () => void;
}

export function useAsyncData<T>(
  fetcher: () => Promise<T | null>,
  deps: unknown[] = [],
  intervalMs = 0,
): AsyncDataState<T> {
  const [data, setData] = useState<T | null>(null);
  const [status, setStatus] = useState<DataStatus>('loading');
  const fetcherRef = useRef(fetcher);
  const dataRef = useRef<T | null>(null);
  fetcherRef.current = fetcher;

  const load = useCallback(async () => {
    try {
      const result = await fetcherRef.current();
      if (result != null) {
        dataRef.current = result;
        setData(result);
        setStatus('live');
      } else {
        setStatus(dataRef.current != null ? 'degraded' : 'degraded');
      }
    } catch {
      setStatus(dataRef.current != null ? 'degraded' : 'degraded');
    }
  // Key effect only off explicit dependency list — fetcher stays in ref
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    void load();
    if (intervalMs <= 0) return;
    const id = setInterval(() => void load(), intervalMs);
    return () => clearInterval(id);
  }, [load, intervalMs]);

  return { data, status, refresh: load };
}
