import { useState, useEffect, useCallback, useRef } from 'react';

interface TerminalDataState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  lastUpdated: Date | null;
}

export function useTerminalData<T>(
  fetcher: () => Promise<T>,
  interval = 60_000,
): TerminalDataState<T> & { refresh: () => void } {
  const [state, setState] = useState<TerminalDataState<T>>({
    data: null, loading: true, error: null, lastUpdated: null,
  });
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const run = useCallback(async () => {
    try {
      const data = await fetcherRef.current();
      setState({ data, loading: false, error: null, lastUpdated: new Date() });
    } catch (e) {
      setState(s => ({ ...s, loading: false, error: e instanceof Error ? e : new Error(String(e)) }));
    }
  }, []);

  useEffect(() => {
    void run();
    if (interval <= 0) return;
    const id = setInterval(() => void run(), interval);
    return () => clearInterval(id);
  }, [run, interval]);

  return { ...state, refresh: run };
}
