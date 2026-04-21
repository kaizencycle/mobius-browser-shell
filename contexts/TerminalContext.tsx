/**
 * TerminalContext — single source of truth for shell-wide terminal telemetry.
 *
 * Before this context, every consumer (GI chip, WorldSignalStrip, Citizen
 * Shield) that wanted terminal data fetched `/api/terminal/snapshot-lite`
 * on its own cadence. That meant N polling loops, N AbortControllers, and
 * no shared staleness signal.
 *
 * Now a single subscription lives at the root of the tree and every
 * consumer reads from the same slice. Consumers that care about heartbeat
 * freshness use `lastSyncAt` + `sinceSyncMs` rather than running their own
 * clocks.
 *
 * Still uses the same bridge internals — this is purely a top-level
 * wiring + de-duplication pass.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  fetchFullTerminalState,
  fetchTerminalState,
  subscribeTerminalState,
  type TerminalState,
} from '../src/lib/terminal-bridge';

interface TerminalContextValue {
  state: TerminalState | null;
  /** True while the very first fetch is in flight (no state yet, no cache). */
  isInitialLoading: boolean;
  /** Epoch ms when the most recent successful fetch completed. */
  lastSyncAt: number | null;
  /** ms since the most recent successful fetch (updates on a 1 s tick). */
  sinceSyncMs: number | null;
  /** True while a heartbeat tick is animating (used by live indicators). */
  pulseTick: number;
  /** Force-refresh using the full aggregator. */
  refresh: () => Promise<void>;
}

const TerminalContext = createContext<TerminalContextValue | null>(null);

interface TerminalProviderProps {
  children: ReactNode;
  /** Override the polling cadence (default 60 s). */
  intervalMs?: number;
}

export function TerminalProvider({
  children,
  /** Default 30s: Terminal is live — keep GI / lanes reasonably fresh without hammering. */
  intervalMs = 30_000,
}: TerminalProviderProps) {
  const [state, setState] = useState<TerminalState | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [pulseTick, setPulseTick] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const subRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeTerminalState(
      (next) => {
        setState(next);
        setIsInitialLoading(false);
        if (next) setPulseTick((t) => t + 1);
      },
      { intervalMs, immediate: true, full: true },
    );
    subRef.current = unsubscribe;
    return () => {
      unsubscribe();
      subRef.current = null;
    };
  }, [intervalMs]);

  // Drive `sinceSyncMs` without rerendering every millisecond.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(id);
  }, []);

  const refresh = useCallback(async () => {
    const full = await fetchFullTerminalState();
    if (full) {
      setState(full);
      setPulseTick((t) => t + 1);
      return;
    }
    // Fall back to lite if full fails — caller still gets *something*.
    const lite = await fetchTerminalState();
    if (lite) {
      setState(lite);
      setPulseTick((t) => t + 1);
    }
  }, []);

  const lastSyncAt = state?.fetchedAt ?? null;
  const sinceSyncMs = lastSyncAt !== null ? Math.max(0, now - lastSyncAt) : null;

  const value = useMemo<TerminalContextValue>(
    () => ({
      state,
      isInitialLoading,
      lastSyncAt,
      sinceSyncMs,
      pulseTick,
      refresh,
    }),
    [state, isInitialLoading, lastSyncAt, sinceSyncMs, pulseTick, refresh],
  );

  return (
    <TerminalContext.Provider value={value}>{children}</TerminalContext.Provider>
  );
}

export function useTerminal(): TerminalContextValue {
  const ctx = useContext(TerminalContext);
  if (!ctx) {
    // Safe no-op default so components rendered outside the provider still
    // compile — useful during incremental rollouts.
    return {
      state: null,
      isInitialLoading: true,
      lastSyncAt: null,
      sinceSyncMs: null,
      pulseTick: 0,
      refresh: async () => {},
    };
  }
  return ctx;
}
