// hooks/useAutoSave.ts
// 1200ms debounce auto-save hook with status indicator
import { useCallback, useEffect, useRef, useState } from 'react';

export type AutoSaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error';

interface UseAutoSaveOptions<T> {
  value: T;
  onSave: (value: T) => Promise<void> | void;
  debounceMs?: number;
  enabled?: boolean;
}

export function useAutoSave<T>({
  value,
  onSave,
  debounceMs = 1200,
  enabled = true,
}: UseAutoSaveOptions<T>): AutoSaveStatus {
  const [status, setStatus] = useState<AutoSaveStatus>('idle');
  const timerRef = useRef<number | null>(null);
  const savedRef = useRef<string>('');
  const onSaveRef = useRef(onSave);

  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  const serialized = JSON.stringify(value);

  useEffect(() => {
    if (!enabled) return;
    if (serialized === savedRef.current) return;

    setStatus('pending');

    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
    }

    timerRef.current = window.setTimeout(async () => {
      setStatus('saving');
      try {
        await onSaveRef.current(value);
        savedRef.current = serialized;
        setStatus('saved');
        timerRef.current = window.setTimeout(() => setStatus('idle'), 2000);
      } catch {
        setStatus('error');
      }
    }, debounceMs);

    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, [serialized, debounceMs, enabled]);

  return status;
}
