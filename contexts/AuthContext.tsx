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
import { identityCache } from '../services/IdentityCache';

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
  /** Restore session from IdentityCache (requires WebAuthn assertion) */
  restoreFromCache: () => Promise<void>;
  /** Clear session */
  signOut: () => void;
  /** True when IdentityCache has a stored identity (device has saved session) */
  hasIdentityCache: boolean;
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

const ATLAS_EVENTS_URL = (import.meta.env.VITE_ATLAS_URL as string) || '/api/atlas/events';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [citizen, setCitizen] = useState<CitizenIdentity | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasIdentityCache, setHasIdentityCache] = useState(false);

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
          setHasIdentityCache(identityCache.hasCache());
          return;
        }
      }
    } catch {
      sessionStorage.removeItem(SESSION_KEY);
    }
    setHasIdentityCache(identityCache.hasCache());
    setStatus('unauthenticated');
  }, []);

  const persistSession = useCallback((identity: CitizenIdentity) => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(identity));
    setCitizen(identity);
    setStatus('authenticated');
  }, []);

  const logAuthEvent = useCallback(
    (type: 'REGISTER' | 'AUTHENTICATE' | 'SIGN_OUT' | 'CACHE_RESTORE', id?: string) => {
      const citizenId = id ?? citizen?.citizenId ?? null;
      fetch(ATLAS_EVENTS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
        body: JSON.stringify({
          type: 'AUTH_LIFECYCLE',
          event: type,
          citizenId,
          timestamp: new Date().toISOString(),
        }),
      }).catch(() => {});
    },
    [citizen]
  );

  const register = useCallback(async () => {
    setError(null);
    try {
      const { identity, credentialId, credential } = await PasskeyService.register();
      persistSession(identity);
      // Store in cache when we have credential (session-only mode)
      if (credential) {
        await identityCache.store(identity, credentialId, credential);
        setHasIdentityCache(true);
      }
      logAuthEvent('REGISTER', identity.citizenId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    }
  }, [persistSession, logAuthEvent]);

  const authenticate = useCallback(async () => {
    setError(null);
    try {
      const identity = await PasskeyService.authenticate();
      persistSession(identity);
      logAuthEvent('AUTHENTICATE', identity.citizenId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    }
  }, [persistSession, logAuthEvent]);

  const restoreFromCache = useCallback(async () => {
    setError(null);
    const cached = await identityCache.retrieve();
    if (!cached) {
      setHasIdentityCache(false);
      return;
    }
    if (!cached.credential) {
      // Old cache format without credential — clear and require fresh auth
      await identityCache.clear();
      setHasIdentityCache(false);
      setError('Saved session expired. Please register or sign in again.');
      return;
    }
    try {
      const identity = await PasskeyService.authenticateFromCache(
        cached.credentialId,
        cached.credential
      );
      persistSession(identity);
      setHasIdentityCache(true);
      logAuthEvent('CACHE_RESTORE', identity.citizenId);
    } catch (err) {
      await identityCache.clear();
      setHasIdentityCache(false);
      setError(err instanceof Error ? err.message : 'Restore failed');
    }
  }, [persistSession, logAuthEvent]);

  const signOut = useCallback(() => {
    const id = citizen?.citizenId ?? null;
    sessionStorage.removeItem(SESSION_KEY);
    identityCache.clear();
    setCitizen(null);
    setHasIdentityCache(false);
    setStatus('unauthenticated');
    logAuthEvent('SIGN_OUT', id ?? undefined);
  }, [citizen, logAuthEvent]);

  const clearError = useCallback(() => setError(null), []);

  // Legacy compat: token (null until JWT PR), user shape for WalletContext/InquiryChat
  const token: string | null = null;
  const user = citizen
    ? { id: citizen.citizenId, email: '', name: citizen.handle ?? undefined }
    : null;

  return (
    <AuthContext.Provider
      value={{
        status,
        citizen,
        register,
        authenticate,
        restoreFromCache,
        signOut,
        hasIdentityCache,
        error,
        clearError,
        token,
        user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
