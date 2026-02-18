/**
 * PasskeyService
 *
 * Wraps the WebAuthn browser API for passkey registration and authentication.
 * Coordinates with the Vercel API routes at /api/auth/* for challenge
 * generation and verification.
 *
 * Flow:
 *   Registration:
 *     1. GET /api/auth/register/challenge  → server generates challenge + user ID
 *     2. navigator.credentials.create()    → browser creates credential
 *     3. POST /api/auth/register/verify    → server verifies + issues session
 *
 *   Authentication:
 *     1. GET /api/auth/login/challenge     → server generates assertion challenge
 *     2. navigator.credentials.get()       → browser signs challenge
 *     3. POST /api/auth/login/verify        → server verifies + issues session
 */

import type { CitizenIdentity } from '../contexts/AuthContext';
import type { CachedCredential } from './IdentityCache';

export interface RegisterResult {
  identity: CitizenIdentity;
  credentialId: string;
  credential?: CachedCredential;
}

export const PasskeyService = {
  /**
   * Check if the current browser supports WebAuthn passkeys.
   */
  isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      !!window.PublicKeyCredential &&
      typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable ===
        'function'
    );
  },

  async isPlatformAuthenticatorAvailable(): Promise<boolean> {
    if (!this.isSupported()) return false;
    try {
      return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    } catch {
      return false;
    }
  },

  // ── Registration ────────────────────────────────────────────────────────────

  async register(): Promise<RegisterResult> {
    const challengeRes = await fetch('/api/auth/register/challenge', {
      method: 'GET',
      credentials: 'include',
    });
    if (!challengeRes.ok) throw new Error('Could not start registration');
    const { challenge, userId, rpId, rpName } = await challengeRes.json();

    const credential = await navigator.credentials.create({
      publicKey: {
        challenge: base64urlDecode(challenge),
        rp: { id: rpId, name: rpName },
        user: {
          id: base64urlDecode(userId),
          name: `citizen-${userId.slice(0, 8)}`,
          displayName: 'Mobius Citizen',
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' },
          { alg: -257, type: 'public-key' },
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          residentKey: 'required',
          userVerification: 'required',
        },
        attestation: 'none',
        timeout: 60_000,
      },
    }) as PublicKeyCredential | null;

    if (!credential) throw new Error('Registration cancelled');

    const response = credential.response as AuthenticatorAttestationResponse;
    const verifyRes = await fetch('/api/auth/register/verify', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: credential.id,
        rawId: base64urlEncode(credential.rawId),
        type: credential.type,
        response: {
          clientDataJSON: base64urlEncode(response.clientDataJSON),
          attestationObject: base64urlEncode(response.attestationObject),
        },
      }),
    });

    if (!verifyRes.ok) {
      const err = await verifyRes.json().catch(() => ({}));
      throw new Error(err.error ?? 'Registration verification failed');
    }

    const data = await verifyRes.json();
    const identity = data as CitizenIdentity;
    return {
      identity,
      credentialId: credential.id,
      credential: data.credential ?? undefined,
    };
  },

  /**
   * Authenticate using cached credential (session-only mode).
   * Requires WebAuthn assertion for device possession proof.
   */
  async authenticateFromCache(
    credentialId: string,
    credential: CachedCredential
  ): Promise<CitizenIdentity> {
    const challengeRes = await fetch('/api/auth/login/challenge', {
      method: 'GET',
      credentials: 'include',
    });
    if (!challengeRes.ok) throw new Error('Could not start authentication');
    const { challenge, rpId } = await challengeRes.json();

    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: base64urlDecode(challenge),
        rpId,
        allowCredentials: [{ id: base64urlDecode(credentialId), type: 'public-key' }],
        userVerification: 'required',
        timeout: 60_000,
      },
    }) as PublicKeyCredential | null;

    if (!assertion) throw new Error('Authentication cancelled');

    const response = assertion.response as AuthenticatorAssertionResponse;
    const verifyRes = await fetch('/api/auth/cache/verify', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assertion: {
          id: assertion.id,
          rawId: base64urlEncode(assertion.rawId),
          type: assertion.type,
          response: {
            clientDataJSON: base64urlEncode(response.clientDataJSON),
            authenticatorData: base64urlEncode(response.authenticatorData),
            signature: base64urlEncode(response.signature),
            userHandle: response.userHandle
              ? base64urlEncode(response.userHandle)
              : null,
          },
        },
        credential: {
          id: credential.id,
          publicKey: credential.publicKey,
          counter: credential.counter,
        },
      }),
    });

    if (!verifyRes.ok) {
      const err = await verifyRes.json().catch(() => ({}));
      throw new Error(err.error ?? 'Authentication failed');
    }

    return verifyRes.json() as Promise<CitizenIdentity>;
  },

  // ── Authentication ──────────────────────────────────────────────────────────

  async authenticate(): Promise<CitizenIdentity> {
    const challengeRes = await fetch('/api/auth/login/challenge', {
      method: 'GET',
      credentials: 'include',
    });
    if (!challengeRes.ok) throw new Error('Could not start authentication');
    const { challenge, rpId } = await challengeRes.json();

    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: base64urlDecode(challenge),
        rpId,
        userVerification: 'required',
        timeout: 60_000,
      },
    }) as PublicKeyCredential | null;

    if (!assertion) throw new Error('Authentication cancelled');

    const response = assertion.response as AuthenticatorAssertionResponse;
    const verifyRes = await fetch('/api/auth/login/verify', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: assertion.id,
        rawId: base64urlEncode(assertion.rawId),
        type: assertion.type,
        response: {
          clientDataJSON: base64urlEncode(response.clientDataJSON),
          authenticatorData: base64urlEncode(response.authenticatorData),
          signature: base64urlEncode(response.signature),
          userHandle: response.userHandle
            ? base64urlEncode(response.userHandle)
            : null,
        },
      }),
    });

    if (!verifyRes.ok) {
      const err = await verifyRes.json().catch(() => ({}));
      throw new Error(err.error ?? 'Authentication failed');
    }

    return verifyRes.json() as Promise<CitizenIdentity>;
  },
};

// ── Base64url helpers ─────────────────────────────────────────────────────────

function base64urlDecode(str: string): ArrayBuffer {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

function base64urlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}
