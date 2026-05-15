import { useEffect, useState } from 'react';

interface TerminalDataState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  lastUpdated: Date | null;
}

export function useTerminalData<T>(
  fetcher: () => Promise<T>,
  interval = 60_000,
  deps: unknown[] = [],
): TerminalDataState<T> {
  const [state, setState] = useState<TerminalDataState<T>>({
    data: null,
    loading: true,
    error: null,
    lastUpdated: null,
  });

  useEffect(() => {
    let mounted = true;

    async function run() {
      try {
        const data = await fetcher();

        if (!mounted) {
          return;
        }

        setState({
          data,
          loading: false,
          error: null,
          lastUpdated: new Date(),
        });
      } catch (error) {
        if (!mounted) {
          return;
        }

        setState((previous) => ({
          ...previous,
          loading: false,
          error: error instanceof Error ? error : new Error('Unknown terminal error'),
        }));
      }
    }

    void run();

    const id = window.setInterval(() => {
      void run();
    }, interval);

    return () => {
      mounted = false;
      window.clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}
