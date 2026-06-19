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
  /** ISO timestamp when covenants were accepted (set on onboarding complete) */
  covenantsAcceptedAt?: string;
  /** SHA256 hash of consents+timestamp for audit trail */
  covenantHash?: string;
  /** Future: blockchain anchor for covenant proof (deferred) */
  covenantAnchor?: {
    chain: 'celestia' | 'solana' | 'ethereum';
    txHash: string;
    height: number;
  };
  /** Current MIC balance */
  micBalance?: number;
  /** Prevents double-claim of genesis grant */
  genesisGrantClaimed?: boolean;
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
  /** Complete onboarding (covenants + optional handle) */
  completeOnboarding: (payload: {
    citizenId: string;
    consents: { integrity: boolean; ecology: boolean; custodianship: boolean };
    handle: string | null;
  }) => Promise<CitizenIdentity>;
  /** Clear session */
  signOut: () => void;
  /** Claim genesis grant (50 MIC) after covenants signed. Idempotent. */
  claimGenesisGrant: () => Promise<number>;
  /** True when IdentityCache has a stored identity (device has saved session) */
  hasIdentityCache: boolean;
  error: string | null;
  clearError: () => void;
  /** Session JWT — issued by auth verify endpoints on passkey success. Null until first login after JWT_SECRET is set. */
  token: string | null;
  /** Legacy shape for WalletContext and InquiryChat. Mirrors citizen fields. */
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

const SESSION_TOKEN_KEY = 'mobius_session_token';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [citizen, setCitizen] = useState<CitizenIdentity | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
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
          setSessionToken(sessionStorage.getItem(SESSION_TOKEN_KEY));
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

  const persistSession = useCallback((identity: CitizenIdentity, token: string | null = null) => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(identity));
    if (token) {
      sessionStorage.setItem(SESSION_TOKEN_KEY, token);
    } else {
      sessionStorage.removeItem(SESSION_TOKEN_KEY);
    }
    setCitizen(identity);
    setSessionToken(token);
    setStatus('authenticated');
  }, []);

  const logAuthEvent = useCallback(
    (
      type:
        | 'REGISTER'
        | 'AUTHENTICATE'
        | 'SIGN_OUT'
        | 'CACHE_RESTORE'
        | 'ONBOARDING_COMPLETE',
      payload?: { citizenId?: string; handle?: string | null; covenantHash?: string }
    ) => {
      const citizenId = payload?.citizenId ?? citizen?.citizenId ?? null;
      fetch(ATLAS_EVENTS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
        body: JSON.stringify({
          type: 'AUTH_LIFECYCLE',
          event: type,
          citizenId,
          handle: payload?.handle,
          covenantHash: payload?.covenantHash,
          timestamp: new Date().toISOString(),
        }),
      }).catch(() => {});
    },
    [citizen]
  );

  const register = useCallback(async () => {
    setError(null);
    try {
      const { identity, credentialId, credential, token } = await PasskeyService.register();
      persistSession(identity, token);
      // Store in cache when we have credential (session-only mode)
      if (credential) {
        await identityCache.store(identity, credentialId, credential);
        setHasIdentityCache(true);
      }
      logAuthEvent('REGISTER', { citizenId: identity.citizenId });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    }
  }, [persistSession, logAuthEvent]);

  const authenticate = useCallback(async () => {
    setError(null);
    try {
      const { identity, token } = await PasskeyService.authenticate();
      persistSession(identity, token);
      logAuthEvent('AUTHENTICATE', { citizenId: identity.citizenId });
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
      const { identity, token } = await PasskeyService.authenticateFromCache(
        cached.credentialId,
        cached.credential
      );
      persistSession(identity, token);
      setHasIdentityCache(true);
      logAuthEvent('CACHE_RESTORE', { citizenId: identity.citizenId });
    } catch (err) {
      await identityCache.clear();
      setHasIdentityCache(false);
      setError(err instanceof Error ? err.message : 'Restore failed');
    }
  }, [persistSession, logAuthEvent]);

  const completeOnboarding = useCallback(
    async (payload: {
      citizenId: string;
      consents: { integrity: boolean; ecology: boolean; custodianship: boolean };
      handle: string | null;
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

      logAuthEvent('ONBOARDING_COMPLETE', {
        citizenId: payload.citizenId,
        handle: payload.handle,
        covenantHash: updatedCitizen.covenantHash,
      });

      return updatedCitizen;
    },
    [persistSession, logAuthEvent]
  );

  const claimGenesisGrant = useCallback(async (): Promise<number> => {
    if (!citizen || citizen.genesisGrantClaimed || !citizen.covenantHash) return 0;

    const res = await fetch('/api/mic/genesis-grant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        citizenId: citizen.citizenId,
        covenantHash: citizen.covenantHash,
        handle: citizen.handle,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (res.status === 201) {
      const { grant } = data;
      setCitizen((prev) =>
        prev
          ? {
              ...prev,
              micBalance: (prev.micBalance ?? 0) + (grant?.amount ?? 50),
              genesisGrantClaimed: true,
            }
          : prev
      );
      return grant?.amount ?? 50;
    }

    if (res.status === 409) {
      const { grant } = data;
      setCitizen((prev) =>
        prev
          ? {
              ...prev,
              micBalance: prev.micBalance ?? (grant?.amount ?? 50),
              genesisGrantClaimed: true,
            }
          : prev
      );
      return grant?.amount ?? 50;
    }
    return 0;
  }, [citizen]);

  const signOut = useCallback(() => {
    const id = citizen?.citizenId ?? null;
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_TOKEN_KEY);
    sessionStorage.removeItem('mobius_has_entered');
    identityCache.clear();
    setCitizen(null);
    setSessionToken(null);
    setHasIdentityCache(false);
    setStatus('unauthenticated');
    logAuthEvent('SIGN_OUT', { citizenId: id ?? undefined });
  }, [citizen, logAuthEvent]);

  const clearError = useCallback(() => setError(null), []);

  const token = sessionToken;
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
        completeOnboarding,
        signOut,
        claimGenesisGrant,
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
