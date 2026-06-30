/**
 * OAuthService — OAuth 2.0 handshake for Mobius Identity Service.
 *
 * The shell never handles passwords or tokens from the provider directly.
 * It redirects to the Identity Service, which runs the OAuth dance, mints a
 * civic_id (sha256-hashed provider UID), and redirects back with a short-lived
 * JWT. The shell reads that JWT from the URL, creates a session, and strips
 * the params from the address bar.
 *
 * Provider UID is NEVER stored. Only civic_id (hashed) hits the shell or ledger.
 */

import { env } from '../config/env';

export type OAuthProvider = 'google' | 'github';

export interface OAuthCallbackResult {
  token: string;
  civicId: string;
  handle: string | null;
  provider: OAuthProvider;
}

const CALLBACK_PARAMS = ['oauth_token', 'oauth_civic_id', 'oauth_handle', 'oauth_provider'] as const;

/** Redirect the browser to the Identity Service OAuth entry point. */
export function initiateOAuth(provider: OAuthProvider): void {
  const redirectUri = `${env.canonicalDomain}/`;
  const url = new URL(`${env.identityBase}/auth/${provider}`);
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
  };
}
