/**
 * LocalStorage Identity Cache
 *
 * When MOBIUS_IDENTITY_API_URL is unset, credentials are not persisted server-side.
 * This cache stores the credential (publicKey, counter) encrypted in localStorage
 * so citizens can restore their session on return visits.
 *
 * Security model:
 * - Data is encrypted at rest with AES-GCM
 * - Key derived from credentialId + app salt (obfuscation; credentialId is in cache)
 * - Private key stays in authenticator; we only cache public key for verification
 * - Restore still requires biometric/PIN — we verify the assertion server-side
 *
 * Note: WebAuthn signatures are non-deterministic, so we cannot derive a stable
 * device key from them. Key derivation uses credentialId for consistency.
 */

import type { CitizenIdentity } from '../contexts/AuthContext';

const CACHE_KEY = 'mobius:identity:v1';
const SALT = new TextEncoder().encode('mobius-identity-cache-v1');

export interface CachedCredential {
  credentialId: string;
  publicKey: string; // base64url
  counter: number;
}

interface CachedIdentity {
  citizenId: string;
  credentialId: string;
  encryptedPayload: string;
  iv: string;
  createdAt: string;
}

async function deriveKey(credentialId: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(credentialId.padEnd(32, '0').slice(0, 32)),
    'HKDF',
    false,
    ['deriveKey'],
  );

  return crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: SALT,
      info: encoder.encode('mobius-identity-encryption'),
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

export const IdentityCache = {
  async store(
    identity: CitizenIdentity,
    credential: CachedCredential,
  ): Promise<void> {
    try {
      const key = await deriveKey(credential.credentialId);
      const payload = JSON.stringify({
        citizenId: identity.citizenId,
        credentialId: credential.credentialId,
        publicKey: credential.publicKey,
        counter: credential.counter,
        createdAt: new Date().toISOString(),
      });

      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        new TextEncoder().encode(payload),
      );

      const cache: CachedIdentity = {
        citizenId: identity.citizenId,
        credentialId: credential.credentialId,
        encryptedPayload: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
        iv: btoa(String.fromCharCode(...iv)),
        createdAt: new Date().toISOString(),
      };

      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch (err) {
      console.warn('[IdentityCache] Store failed', err);
    }
  },

  async retrieve(): Promise<{
    identity: CitizenIdentity;
    credential: CachedCredential;
  } | null> {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;

    try {
      const cache: CachedIdentity = JSON.parse(raw);
      const key = await deriveKey(cache.credentialId);
      const iv = new Uint8Array(
        atob(cache.iv)
          .split('')
          .map((c) => c.charCodeAt(0)),
      );
      const encrypted = new Uint8Array(
        atob(cache.encryptedPayload)
          .split('')
          .map((c) => c.charCodeAt(0)),
      );

      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        encrypted,
      );

      const payload = JSON.parse(new TextDecoder().decode(decrypted));

      return {
        identity: {
          citizenId: payload.citizenId,
          handle: null,
          authenticatedAt: new Date().toISOString(),
          onboarded: false,
        },
        credential: {
          credentialId: payload.credentialId,
          publicKey: payload.publicKey,
          counter: payload.counter ?? 0,
        },
      };
    } catch {
      this.clear();
      return null;
    }
  },

  clear(): void {
    localStorage.removeItem(CACHE_KEY);
  },

  hasCache(): boolean {
    return !!localStorage.getItem(CACHE_KEY);
  },
};
