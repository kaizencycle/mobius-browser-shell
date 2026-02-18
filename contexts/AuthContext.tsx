/**
 * AuthContext — Passkey / WebAuthn Identity Layer
 *
 * Owns CitizenIdentity session state. No passwords. Identity anchored to
 * device biometrics via WebAuthn. Session in sessionStorage, 24h TTL.
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { PasskeyService } from '../services/PasskeyService';

// ── Types ─────────────────────────────────────────────────────────────────────

export type AuthStatus = 'loading' | 'unauthenticated' | 'authenticated';

export interface CitizenIdentity {
  /** Stable citizen ID derived from passkey credential ID (hashed) */
  citizenId: string;
  /** Display handle — set during registration, mutable */
  handle: string | null;
  /** ISO timestamp of this session's authentication */
  authenticatedAt: string;
  /** Whether this citizen has completed onboarding */
  onboarded: boolean;
}

export interface AuthContextValue {
  status: AuthStatus;
  citizen: CitizenIdentity | null;
  /** Initiate passkey registration (new citizen) */
  register: () => Promise<void>;
  /** Initiate passkey authentication (returning citizen) */
  authenticate: () => Promise<void>;
  /** Complete onboarding flow — persists handle + consents, flips onboarded */
  completeOnboarding: (payload: {
    citizenId: string;
    handle: string | null;
    consents: { integrity: boolean; data: boolean };
  }) => Promise<void>;
  /** Clear session */
  signOut: () => void;
  error: string | null;
  clearError: () => void;
  /** @deprecated Use citizen. JWT follow-up will add token. */
  token: string | null;
  /** @deprecated Use citizen. Legacy shape for WalletContext, InquiryChat, etc. */
  user: { id: string; email: string; name?: string } | null;
}

// ── Context ───────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

// ── Provider ──────────────────────────────────────────────────────────────────

const SESSION_KEY = 'mobius_session';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [citizen, setCitizen] = useState<CitizenIdentity | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Rehydrate session from sessionStorage on mount
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (raw) {
        const parsed: CitizenIdentity = JSON.parse(raw);
        // Validate session is not stale (24h max)
        const age = Date.now() - new Date(parsed.authenticatedAt).getTime();
        if (age < 24 * 60 * 60 * 1000) {
          setCitizen(parsed);
          setStatus('authenticated');
          return;
        }
      }
    } catch {
      sessionStorage.removeItem(SESSION_KEY);
    }
    setStatus('unauthenticated');
  }, []);

  const persistSession = useCallback((identity: CitizenIdentity) => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(identity));
    setCitizen(identity);
    setStatus('authenticated');
  }, []);

  const register = useCallback(async () => {
    setError(null);
    try {
      const identity = await PasskeyService.register();
      persistSession(identity);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    }
  }, [persistSession]);

  const authenticate = useCallback(async () => {
    setError(null);
    try {
      const identity = await PasskeyService.authenticate();
      persistSession(identity);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    }
  }, [persistSession]);

  const completeOnboarding = useCallback(
    async (payload: {
      citizenId: string;
      handle: string | null;
      consents: { integrity: boolean; data: boolean };
    }) => {
      const res = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? 'Onboarding failed');
      }

      const { citizen: updatedCitizen } = await res.json();
      persistSession(updatedCitizen);

      // ATLAS audit event
      fetch('/api/atlas/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
        body: JSON.stringify({
          type: 'AUTH_LIFECYCLE',
          event: 'ONBOARDING_COMPLETE',
          citizenId: payload.citizenId,
          timestamp: new Date().toISOString(),
        }),
      }).catch(() => {});
    },
    [persistSession],
  );

  const signOut = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem('mobius:onboarding:step');
    try {
      localStorage.removeItem('mobius:onboarding:pending');
    } catch {
      /* ignore */
    }
    setCitizen(null);
    setStatus('unauthenticated');
  }, []);

  const clearError = useCallback(() => setError(null), []);

  // Legacy compat: token (null until JWT PR), user shape for WalletContext/InquiryChat
  const token: string | null = null;
  const user = citizen
    ? { id: citizen.citizenId, email: '', name: citizen.handle ?? undefined }
    : null;

  return (
    <AuthContext.Provider
      value={{ status, citizen, register, authenticate, completeOnboarding, signOut, error, clearError, token, user }}
    >
      {children}
    </AuthContext.Provider>
  );
}
