/**
 * useSessionHeartbeat
 *
 * Polls /api/auth/heartbeat every ~5 minutes to verify the citizen
 * session is still valid server-side. Forces signOut() on revocation.
 *
 * Key behaviors:
 * - Jitter (±30s) prevents thundering herd if many citizens share a deploy
 * - Soft fail on network errors: session survives transient outages
 * - Hard fail on 401: citizen revoked, immediate sign-out
 * - Stops automatically when citizen is null (signed out)
 *
 * Usage — call once in App.tsx:
 *   function App() {
 *     useSessionHeartbeat();
 *     return <shell />;
 *   }
 */

import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

const HEARTBEAT_INTERVAL_MS = 5 * 60 * 1000; // 5 min
const JITTER_MS = 30 * 1000; // ±30s
const INITIAL_DELAY_MS = 10 * 1000; // 10s after mount

export function useSessionHeartbeat() {
  const { citizen, signOut } = useAuth();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const citizenIdRef = useRef<string | null>(null);

  // Keep refs in sync so closures see latest values without dependency churn
  citizenIdRef.current = citizen?.citizenId ?? null;
  const checkRef = useRef<() => Promise<void>>(() => Promise.resolve());
  const scheduleNext = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const jitter = (Math.random() * 2 - 1) * JITTER_MS;
    timeoutRef.current = setTimeout(() => checkRef.current(), HEARTBEAT_INTERVAL_MS + jitter);
  }, []);

  checkRef.current = async () => {
    const citizenId = citizenIdRef.current;
    if (!citizenId) return;

    try {
      const res = await fetch(
        `/api/auth/heartbeat?citizenId=${citizenId}`,
        { credentials: 'include', cache: 'no-store' },
      );

      if (res.status === 401) {
        console.warn('[Heartbeat] Session revoked — signing out');
        signOut();
        return; // Don't reschedule after sign-out
      }

      if (!res.ok) {
        // Soft fail — transient error, retry next cycle
        console.warn('[Heartbeat] Check failed with', res.status, '— retrying');
        scheduleNext();
        return;
      }

      const data = await res.json();

      if (!data.valid || data.flags?.requiresReauth) {
        console.warn('[Heartbeat] Re-auth required');
        signOut();
        return;
      }

      if (data.flags?.suspiciousActivity) {
        // Forward to ATLAS — don't terminate session yet
        console.warn('[Heartbeat] Suspicious activity flagged for', citizenId);
        fetch('/api/atlas/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          keepalive: true,
          body: JSON.stringify({
            type: 'AUTH_SUSPICIOUS_ACTIVITY',
            citizenId,
            timestamp: new Date().toISOString(),
          }),
        }).catch(() => {});
      }

      scheduleNext();
    } catch {
      // Network error — soft fail, retry
      scheduleNext();
    }
  };

  useEffect(() => {
    if (!citizen) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      return;
    }

    // Short initial delay — let the shell settle before first check
    timeoutRef.current = setTimeout(() => checkRef.current(), INITIAL_DELAY_MS);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [citizen]);
}
