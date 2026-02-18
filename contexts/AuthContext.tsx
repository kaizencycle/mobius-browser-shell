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
import { IdentityCache } from '../services/IdentityCache';

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
  /** Restore session from localStorage cache (when identity API unset) */
  restoreFromCache: () => Promise<void>;
  /** Whether a cached identity exists for restore */
  hasIdentityCache: boolean;
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
  const [hasIdentityCache, setHasIdentityCache] = useState(false);

  // Check for identity cache on mount
  useEffect(() => {
    setHasIdentityCache(IdentityCache.hasCache());
  }, []);

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
      const result = await PasskeyService.register();
      persistSession(result.identity);
      if (result.credentialForCache) {
        await IdentityCache.store(result.identity, result.credentialForCache);
        setHasIdentityCache(true);
      }
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

  const restoreFromCache = useCallback(async () => {
    setError(null);
    try {
      const cached = await IdentityCache.retrieve();
      if (!cached) {
        setHasIdentityCache(false);
        setError('Cache expired or invalid');
        return;
      }
      const identity = await PasskeyService.authenticateFromCache(cached.credential);
      persistSession(identity);
    } catch (err) {
      IdentityCache.clear();
      setHasIdentityCache(false);
      setError(err instanceof Error ? err.message : 'Cache restore failed');
    }
  }, [persistSession]);

  const signOut = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setCitizen(null);
    setStatus('unauthenticated');
    // Note: we do NOT clear IdentityCache on signOut — citizen may want to restore later
  }, []);

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
        hasIdentityCache,
        signOut,
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
