/**
 * Session Heartbeat
 *
 * Polls the server every N minutes to verify:
 * 1. Citizen still exists in identity store
 * 2. Citizen hasn't been suspended/revoked
 * 3. Session hasn't been invalidated server-side
 *
 * On failure: forces signOut() and returns to AuthGate
 */

import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

const HEARTBEAT_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const HEARTBEAT_JITTER_MS = 30 * 1000; // ±30s randomization
const INITIAL_DELAY_MS = 10_000; // Allow page to settle

interface HeartbeatResponse {
  valid: boolean;
  citizenId: string;
  expiresAt?: string;
  degraded?: boolean;
  flags?: {
    requiresReauth: boolean;
    passwordChanged?: boolean;
    suspiciousActivity?: boolean;
  };
}

export function useSessionHeartbeat(): void {
  const { citizen, signOut } = useAuth();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const checkRef = useRef<() => Promise<void>>();

  const check = useCallback(async () => {
    if (!citizen) return;

    try {
      const res = await fetch(
        `/api/auth/heartbeat?citizenId=${encodeURIComponent(citizen.citizenId)}`,
        {
          credentials: 'include',
          cache: 'no-store',
        },
      );

      if (res.status === 401) {
        console.warn('[Heartbeat] Session revoked, signing out');
        signOut();
        return;
      }

      if (!res.ok) {
        console.warn('[Heartbeat] Check failed, will retry');
        return;
      }

      const data: HeartbeatResponse = await res.json();

      if (!data.valid || data.flags?.requiresReauth) {
        console.warn('[Heartbeat] Re-authentication required');
        signOut();
        return;
      }

      if (data.flags?.suspiciousActivity) {
        console.warn('[Heartbeat] Suspicious activity flagged');
      }
    } catch (err) {
      console.warn('[Heartbeat] Network error:', err);
    } finally {
      // Schedule next check
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      const jitter = Math.random() * HEARTBEAT_JITTER_MS * 2 - HEARTBEAT_JITTER_MS;
      timeoutRef.current = setTimeout(
        () => checkRef.current?.(),
        HEARTBEAT_INTERVAL_MS + jitter,
      );
    }
  }, [citizen, signOut]);

  checkRef.current = check;

  useEffect(() => {
    if (!citizen) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      return;
    }

    timeoutRef.current = setTimeout(check, INITIAL_DELAY_MS);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [citizen, check]);
}
