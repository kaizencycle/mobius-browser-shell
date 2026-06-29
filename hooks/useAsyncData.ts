/**
 * C-357 degraded-state data hook — API failures never crash the shell.
 */

import { useState, useEffect, useCallback } from 'react';

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

  const load = useCallback(async () => {
    try {
      const result = await fetcher();
      if (result != null) {
        setData(result);
        setStatus('live');
      } else if (data != null) {
        setStatus('degraded');
      } else {
        setStatus('degraded');
      }
    } catch {
      setStatus(data != null ? 'degraded' : 'degraded');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetcher, ...deps]);

  useEffect(() => {
    void load();
    if (intervalMs <= 0) return;
    const id = setInterval(() => void load(), intervalMs);
    return () => clearInterval(id);
  }, [load, intervalMs]);

  return { data, status, refresh: load };
}
