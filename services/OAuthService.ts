/**
 * OAuthService — OAuth 2.0 handshake via shell API routes.
 *
 * The shell never handles passwords or tokens from the provider directly.
 * /api/auth/oauth/* runs the OAuth dance server-side, mints a civic_id
 * (HMAC of provider UID), issues a short-lived JWT, and redirects back
 * with oauth_* query params. The client strips those params after session
 * creation.
 *
 * Provider UID is NEVER stored. Only civic_id (hashed) hits the shell session.
 */

import { env } from '../config/env';

export type OAuthProvider = 'google' | 'github';

export interface OAuthCallbackResult {
  token: string;
  civicId: string;
  handle: string | null;
  provider: OAuthProvider;
  /** True only when the Identity Service minted a brand-new civic_id. */
  isNewCitizen: boolean;
}

export interface OAuthStatus {
  ready: boolean;
  providers: OAuthProvider[];
  github: boolean;
  google: boolean;
}

const CALLBACK_PARAMS = [
  'oauth_token',
  'oauth_civic_id',
  'oauth_handle',
  'oauth_provider',
  'oauth_is_new',
] as const;

/** Fetch which OAuth providers are configured on the server. */
export async function fetchOAuthStatus(): Promise<OAuthStatus> {
  try {
    const res = await fetch('/api/auth/oauth/status', { cache: 'no-store' });
    if (!res.ok) {
      return { ready: false, providers: [], github: false, google: false };
    }
    return (await res.json()) as OAuthStatus;
  } catch {
    return { ready: false, providers: [], github: false, google: false };
  }
}

/** Start OAuth via shell API — browser navigates to provider authorize URL. */
export function initiateOAuth(provider: OAuthProvider): void {
  const redirectUri = `${env.canonicalDomain}/`;
  const url = new URL(`/api/auth/oauth/${provider}`, window.location.origin);
  url.searchParams.set('redirect_uri', redirectUri);
  window.location.href = url.toString();
}

/**
 * Check the current URL for OAuth callback params injected by the Identity
 * Service after a successful handshake. Returns the result and strips the
 * params from the URL, or returns null if no callback is present.
 */
export function consumeOAuthCallback(): OAuthCallbackResult | null {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('oauth_token');
  const civicId = params.get('oauth_civic_id');
  const provider = params.get('oauth_provider') as OAuthProvider | null;

  if (!token || !civicId || !provider) return null;

  // Strip params from the address bar immediately so they can't be bookmarked
  const clean = new URL(window.location.href);
  CALLBACK_PARAMS.forEach(p => clean.searchParams.delete(p));
  window.history.replaceState(null, '', clean.pathname + (clean.hash || ''));

  return {
    token,
    civicId,
    handle: params.get('oauth_handle'),
    provider,
    // Default false (returning citizen) — Identity Service sets oauth_is_new=true only on first mint
    isNewCitizen: params.get('oauth_is_new') === 'true',
  };
}
