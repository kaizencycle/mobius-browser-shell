import { useCallback, useRef, useEffect } from 'react';
import { ErrorInfo } from 'react';
import { atlasCircuitBreaker, withCircuitBreaker } from '../services/atlasCircuitBreaker';
import {
  type ErrorCode,
  generateErrorId,
  inferErrorCode,
} from '../errors/errorCodes';
import { useCitizenId } from '../hooks/useCitizenId';

const ATLAS_ENDPOINT =
  (import.meta.env.VITE_ATLAS_URL as string | undefined) || '/api/atlas/events';
const ERROR_QUEUE_KEY = 'atlas_error_queue';
const ERROR_COOLDOWN = 5000;
const MAX_QUEUE_SIZE = 50;

interface AtlasErrorEvent {
  type: 'SHELL_ERROR';
  errorId: string;
  code: ErrorCode;
  appName: string;
  message: string;
  stack?: string | null;
  componentStack?: string | null;
  timestamp: string;
  userAgent: string;
  url: string;
  citizenId?: string;
  circuitState?: string;
}

/** Sanitize component stack to prevent prop leakage (tokens, sensitive data) */
function sanitizeComponentStack(stack?: string | null): string | undefined {
  if (!stack) return undefined;
  return stack
    .replace(/=\{[^}]+\}/g, '={...}')
    .replace(/="[^"]+"/g, '="..."')
    .substring(0, 5000);
}

/**
 * useAtlasErrorLog
 *
 * Returns an onError handler compatible with ShellErrorBoundary's onError prop.
 * Formats caught errors into the ATLAS integrity event schema and posts them
 * to the Mobius audit log endpoint.
 *
 * When ATLAS auth is wired up (next PR), swap the placeholder endpoint for
 * the real ATLAS sentinel API and include the citizen identity token.
 *
 * Usage:
 *   const logToAtlas = useAtlasErrorLog();
 *   <ShellErrorBoundary appName="Citizen Shield" onError={logToAtlas} />
 */
export function useAtlasErrorLog() {
  const citizenId = useCitizenId();
  const recentErrors = useRef<Set<string>>(new Set());

  const queueError = useCallback((event: AtlasErrorEvent) => {
    try {
      const queue = JSON.parse(
        localStorage.getItem(ERROR_QUEUE_KEY) || '[]'
      ) as AtlasErrorEvent[];
      queue.push(event);
      if (queue.length > MAX_QUEUE_SIZE) queue.shift();
      localStorage.setItem(ERROR_QUEUE_KEY, JSON.stringify(queue));
    } catch {
      // localStorage might be full — drop silently
    }
  }, []);

  const sendToAtlas = useCallback(
    async (event: AtlasErrorEvent, fromQueue = false): Promise<void> => {
      const eventWithMeta: AtlasErrorEvent = {
        ...event,
        circuitState: atlasCircuitBreaker.getState(),
      };

      const execute = async () => {
        const response = await fetch(ATLAS_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(eventWithMeta),
          keepalive: true,
        });

        if (!response.ok) throw new Error(`ATLAS returned ${response.status}`);
      };

      try {
        await withCircuitBreaker(execute);
      } catch {
        if (!fromQueue) {
          queueError(eventWithMeta);
        }
        // Silently swallow — logging must never crash the app
      }
    },
    [queueError]
  );

  const flushQueuedErrors = useCallback(async () => {
    try {
      const queue = JSON.parse(
        localStorage.getItem(ERROR_QUEUE_KEY) || '[]'
      ) as AtlasErrorEvent[];
      if (queue.length === 0) return;

      localStorage.removeItem(ERROR_QUEUE_KEY);

      for (const event of queue) {
        await sendToAtlas(event, true);
      }
    } catch {
      // Ignore
    }
  }, [sendToAtlas]);

  useEffect(() => {
    const handleOnline = () => {
      flushQueuedErrors();
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [flushQueuedErrors]);

  return useCallback(
    (
      error: Error,
      info: ErrorInfo,
      appName: string,
      errorCode?: ErrorCode
    ) => {
      // Deduplication
      const signature = `${appName}:${error.message}:${error.stack?.split('\n')[0] ?? ''}`;
      if (recentErrors.current.has(signature)) return;

      recentErrors.current.add(signature);
      setTimeout(
        () => recentErrors.current.delete(signature),
        ERROR_COOLDOWN
      );

      const code = errorCode ?? inferErrorCode(error);
      const errorId = generateErrorId(code);

      const event: AtlasErrorEvent = {
        type: 'SHELL_ERROR',
        errorId,
        code,
        appName,
        message: error.message,
        stack: error.stack ?? null,
        componentStack: sanitizeComponentStack(info.componentStack),
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        citizenId: citizenId ?? undefined,
      };

      // Dev mode: log to console
      if (import.meta.env.DEV) {
        console.group(`🚨 [${errorId}] ${appName} (citizen: ${citizenId ?? 'anon'})`);
        console.error(error);
        console.log('Component stack:', info.componentStack);
        console.groupEnd();
        return;
      }

      // Prod mode: send to ATLAS
      sendToAtlas(event);
    },
    [sendToAtlas, citizenId]
  );
}
