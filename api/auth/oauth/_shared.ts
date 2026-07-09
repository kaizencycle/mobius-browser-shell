/**
 * Shared OAuth helpers for shell-side GitHub / Google login.
 * Secrets stay server-side on Vercel; provider UID is never stored.
 */

import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import type { VercelRequest } from '@vercel/node';

export type OAuthProvider = 'github' | 'google';

const STATE_COOKIE = 'mobius_oauth_state';
const STATE_TTL_MS = 10 * 60 * 1000;

const PROVIDER_CONFIG: Record<
  OAuthProvider,
  {
    authorizeUrl: string;
    tokenUrl: string;
    scopes: string;
    clientIdEnv: string;
    clientSecretEnv: string;
  }
> = {
  github: {
    authorizeUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    scopes: 'read:user user:email',
    clientIdEnv: 'GITHUB_CLIENT_ID',
    clientSecretEnv: 'GITHUB_CLIENT_SECRET',
  },
  google: {
    authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scopes: 'openid email profile',
    clientIdEnv: 'GOOGLE_CLIENT_ID',
    clientSecretEnv: 'GOOGLE_CLIENT_SECRET',
  },
};

export function isOAuthProvider(value: string): value is OAuthProvider {
  return value === 'github' || value === 'google';
}

export function getStateSecret(): string {
  return process.env.OAUTH_STATE_SECRET ?? process.env.CHALLENGE_SECRET ?? '';
}

export function getCallbackOrigin(req: VercelRequest): string {
  const configured = process.env.WEBAUTHN_RP_ORIGIN ?? process.env.OAUTH_CALLBACK_ORIGIN;
  if (configured) return configured.replace(/\/+$/, '');

  const host = req.headers['x-forwarded-host'] ?? req.headers.host;
  const proto = (req.headers['x-forwarded-proto'] as string | undefined) ?? 'https';
  if (typeof host === 'string' && host) return `${proto}://${host}`;
  return 'https://mobius-substrate.com';
}

export function getAllowedRedirectOrigins(): string[] {
  const origins = new Set<string>([
    'https://mobius-substrate.com',
    'https://www.mobius-substrate.com',
    'https://mobius-browser-shell.vercel.app',
  ]);

  for (const key of ['WEBAUTHN_RP_ORIGIN', 'OAUTH_CALLBACK_ORIGIN', 'VITE_CANONICAL_DOMAIN']) {
    const value = process.env[key];
    if (value) origins.add(value.replace(/\/+$/, ''));
  }

  return [...origins];
}

export function normalizeRedirectUri(raw: string | undefined, fallbackOrigin: string): string | null {
  const candidate = (raw ?? `${fallbackOrigin}/`).trim();
  try {
    const url = new URL(candidate);
    const origin = url.origin;
    if (!getAllowedRedirectOrigins().includes(origin)) return null;
    if (url.protocol !== 'https:' && url.hostname !== 'localhost') return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function providerIsConfigured(provider: OAuthProvider): boolean {
  const cfg = PROVIDER_CONFIG[provider];
  return Boolean(process.env[cfg.clientIdEnv] && process.env[cfg.clientSecretEnv]);
}

export function getConfiguredProviders(): OAuthProvider[] {
  return (['github', 'google'] as const).filter(providerIsConfigured);
}

export function deriveCivicId(provider: OAuthProvider, providerUid: string): string {
  const pepper = process.env.CITIZEN_ID_PEPPER || 'default-pepper-change-me';
  return createHmac('sha256', pepper)
    .update(`${provider}:${providerUid}`)
    .digest('hex')
    .slice(0, 32);
}

export function signState(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

export function buildStateCookie(
  provider: OAuthProvider,
  redirectUri: string,
  secret: string,
): { cookie: string; state: string } {
  const nonce = randomBytes(16).toString('base64url');
  const expiresAt = Date.now() + STATE_TTL_MS;
  const payload = `${provider}|${redirectUri}|${nonce}|${expiresAt}`;
  const sig = signState(payload, secret);
  const cookie = `${Buffer.from(payload, 'utf8').toString('base64url')}.${sig}`;
  return { cookie, state: nonce };
}

export function parseStateCookie(
  cookieValue: string,
  secret: string,
  stateParam: string | undefined,
): { provider: OAuthProvider; redirectUri: string } | null {
  const dot = cookieValue.indexOf('.');
  if (dot < 0) return null;

  const payloadB64 = cookieValue.slice(0, dot);
  const sig = cookieValue.slice(dot + 1);
  const payload = Buffer.from(payloadB64, 'base64url').toString('utf8');
  const expected = signState(payload, secret);

  try {
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  } catch {
    return null;
  }

  const [providerRaw, redirectUri, nonce, expiresAtStr] = payload.split('|');
  if (!providerRaw || !redirectUri || !nonce || !expiresAtStr) return null;
  if (stateParam && stateParam !== nonce) return null;
  if (Date.now() > parseInt(expiresAtStr, 10)) return null;
  if (!isOAuthProvider(providerRaw)) return null;

  if (!normalizeRedirectUri(redirectUri, getAllowedRedirectOrigins()[0] ?? 'https://mobius-substrate.com')) {
    return null;
  }

  return { provider: providerRaw, redirectUri };
}

export function setStateCookie(res: { setHeader: (name: string, value: string) => void }, value: string): void {
  res.setHeader(
    'Set-Cookie',
    `${STATE_COOKIE}=${value}; HttpOnly; Secure; SameSite=Lax; Max-Age=600; Path=/api/auth/oauth`,
  );
}

export function clearStateCookie(res: { setHeader: (name: string, value: string) => void }): void {
  res.setHeader(
    'Set-Cookie',
    `${STATE_COOKIE}=; HttpOnly; Secure; SameSite=Lax; Max-Age=0; Path=/api/auth/oauth`,
  );
}

export function parseCookie(header: string, name: string): string | null {
  const match = header.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

export function buildAuthorizeUrl(
  provider: OAuthProvider,
  callbackUrl: string,
  state: string,
): string {
  const cfg = PROVIDER_CONFIG[provider];
  const clientId = process.env[cfg.clientIdEnv] ?? '';
  const url = new URL(cfg.authorizeUrl);
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', callbackUrl);
  url.searchParams.set('state', state);
  url.searchParams.set('scope', cfg.scopes);

  if (provider === 'google') {
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('access_type', 'online');
    url.searchParams.set('prompt', 'select_account');
  }

  return url.toString();
}

export async function exchangeCode(
  provider: OAuthProvider,
  code: string,
  callbackUrl: string,
): Promise<string> {
  const cfg = PROVIDER_CONFIG[provider];
  const clientId = process.env[cfg.clientIdEnv] ?? '';
  const clientSecret = process.env[cfg.clientSecretEnv] ?? '';

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code,
    redirect_uri: callbackUrl,
    grant_type: 'authorization_code',
  });

  const headers: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded',
    Accept: 'application/json',
  };

  if (provider === 'github') {
    headers.Accept = 'application/json';
  }

  const tokenRes = await fetch(cfg.tokenUrl, {
    method: 'POST',
    headers,
    body,
  });

  if (!tokenRes.ok) {
    const detail = await tokenRes.text();
    throw new Error(`Token exchange failed (${tokenRes.status}): ${detail.slice(0, 200)}`);
  }

  const tokenJson = (await tokenRes.json()) as { access_token?: string; error?: string };
  if (!tokenJson.access_token) {
    throw new Error(tokenJson.error ?? 'Token exchange returned no access_token');
  }

  return tokenJson.access_token;
}

export async function fetchProviderProfile(
  provider: OAuthProvider,
  accessToken: string,
): Promise<{ uid: string; handle: string | null }> {
  if (provider === 'github') {
    const userRes = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'mobius-browser-shell',
      },
    });
    if (!userRes.ok) throw new Error(`GitHub profile fetch failed (${userRes.status})`);
    const user = (await userRes.json()) as { id?: number; login?: string };
    if (!user.id) throw new Error('GitHub profile missing id');
    return { uid: String(user.id), handle: user.login ?? null };
  }

  const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!userRes.ok) throw new Error(`Google profile fetch failed (${userRes.status})`);
  const user = (await userRes.json()) as { id?: string; email?: string; name?: string };
  if (!user.id) throw new Error('Google profile missing id');
  return { uid: user.id, handle: user.email ?? user.name ?? null };
}

export function appendOAuthCallbackParams(
  redirectUri: string,
  params: Record<string, string>,
): string {
  const url = new URL(redirectUri);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return url.toString();
}
