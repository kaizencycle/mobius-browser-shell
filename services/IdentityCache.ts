/**
 * services/IdentityCache.ts
 *
 * Encrypted localStorage persistence for citizen identity.
 * Graceful degradation when MOBIUS_IDENTITY_API_URL is not configured.
 *
 * Security model:
 *   - AES-GCM-256 encryption at rest
 *   - Key is stored in IndexedDB, bound to this browser origin
 *   - Key is keyed by credentialId so each passkey gets its own key
 *   - Without this browser's IndexedDB, the localStorage data is useless
 *
 * ⚠ CORRECTION from Cursor draft:
 *   The previous implementation derived the AES key from a WebAuthn
 *   ECDSA signature. ECDSA signatures use a random nonce per signing
 *   operation — they are NON-DETERMINISTIC. Deriving a key from them
 *   produces a different key on every call, making stored ciphertext
 *   permanently unreadable. This version uses IndexedDB-persisted
 *   key material instead (extractable key, stored as raw bytes).
 */

import type { CitizenIdentity } from '../contexts/AuthContext';

const DB_NAME = 'mobius_identity_db';
const DB_VERSION = 1;
const KEY_STORE = 'device_keys';
const CACHE_KEY = 'mobius:identity:v1';

interface CachedIdentityRecord {
  citizenId: string;
  credentialId: string;
  encryptedPayload: string; // base64 AES-GCM ciphertext
  iv: string; // base64 IV
  createdAt: string;
}

/** Credential info needed for cache-verify flow (session-only mode) */
export interface CachedCredential {
  id: string;
  publicKey: string; // base64url
  counter: number;
}

export class IdentityCache {
  private db: IDBDatabase | null = null;

  // ── IndexedDB setup ────────────────────────────────────────────────────────

  private async openDb(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        req.result.createObjectStore(KEY_STORE, { keyPath: 'credentialId' });
      };
      req.onsuccess = () => {
        this.db = req.result;
        resolve(req.result);
      };
      req.onerror = () =>
        reject(req.error ?? new Error('IndexedDB open failed'));
    });
  }

  // ── Device key management ──────────────────────────────────────────────────

  /**
   * Get or create the AES-GCM key for a given credentialId.
   * Key material is stored in IndexedDB (extractable for persistence).
   */
  private async getOrCreateDeviceKey(
    credentialId: string
  ): Promise<CryptoKey> {
    const db = await this.openDb();

    // Try to load existing key material
    const stored = await new Promise<{ keyMaterial?: string } | undefined>(
      (resolve, reject) => {
        const tx = db.transaction(KEY_STORE, 'readonly');
        const req = tx.objectStore(KEY_STORE).get(credentialId);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      }
    );
    const existingBuf = stored?.keyMaterial ? base64ToBuf(stored.keyMaterial) : null;

    if (existingBuf) {
      return crypto.subtle.importKey(
        'raw',
        existingBuf,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );
    }

    // Generate and persist a fresh key (extractable for IndexedDB storage)
    const key = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true, // extractable for persistence
      ['encrypt', 'decrypt']
    );

    const rawKey = await crypto.subtle.exportKey('raw', key);
    const keyMaterial = bufToBase64(rawKey);

    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(KEY_STORE, 'readwrite');
      tx.objectStore(KEY_STORE).put({ credentialId, keyMaterial });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

    return key;
  }

  private async deleteDeviceKey(credentialId: string): Promise<void> {
    const db = await this.openDb();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(KEY_STORE, 'readwrite');
      tx.objectStore(KEY_STORE).delete(credentialId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => {
        /* silent — we're clearing anyway */
      };
    });
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /** Returns true if a cache record exists (without decrypting). */
  hasCache(): boolean {
    return !!localStorage.getItem(CACHE_KEY);
  }

  /**
   * Encrypt and persist citizen identity + credential.
   * Call after a successful registration (session-only mode).
   */
  async store(
    identity: CitizenIdentity,
    credentialId: string,
    credential?: CachedCredential
  ): Promise<void> {
    try {
      const key = await this.getOrCreateDeviceKey(credentialId);
      const payload = JSON.stringify({
        identity,
        credentialId,
        credential: credential ?? null,
      });
      const iv = crypto.getRandomValues(new Uint8Array(12));

      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        new TextEncoder().encode(payload)
      );

      const record: CachedIdentityRecord = {
        citizenId: identity.citizenId,
        credentialId,
        encryptedPayload: bufToBase64(encrypted),
        iv: bufToBase64(iv.buffer),
        createdAt: new Date().toISOString(),
      };

      localStorage.setItem(CACHE_KEY, JSON.stringify(record));
    } catch (err) {
      console.warn('[IdentityCache] store failed:', err);
    }
  }

  /**
   * Retrieve and decrypt cached identity.
   * Returns null if not cached, decryption fails, or key is missing.
   */
  async retrieve(): Promise<{
    identity: CitizenIdentity;
    credentialId: string;
    credential: CachedCredential | null;
  } | null> {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;

    try {
      const record: CachedIdentityRecord = JSON.parse(raw);
      const ivBytes = base64ToBuf(record.iv);
      if (!ivBytes) {
        this.clear();
        return null;
      }
      const cipherBytes = base64ToBuf(record.encryptedPayload);
      if (!cipherBytes) {
        this.clear();
        return null;
      }

      const key = await this.getOrCreateDeviceKey(record.credentialId);
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: new Uint8Array(ivBytes) },
        key,
        cipherBytes
      );

      const { identity, credentialId, credential } = JSON.parse(
        new TextDecoder().decode(decrypted)
      );
      return {
        identity: {
          ...identity,
          authenticatedAt: new Date().toISOString(),
        },
        credentialId,
        credential: credential ?? null,
      };
    } catch (err) {
      console.warn('[IdentityCache] retrieve failed (clearing):', err);
      this.clear();
      return null;
    }
  }

  /** Clear localStorage record and IndexedDB key for this cache entry. */
  async clear(): Promise<void> {
    const raw = localStorage.getItem(CACHE_KEY);
    localStorage.removeItem(CACHE_KEY);
    if (raw) {
      try {
        const { credentialId } = JSON.parse(raw) as CachedIdentityRecord;
        await this.deleteDeviceKey(credentialId);
      } catch {
        /* best-effort */
      }
    }
  }
}

export const identityCache = new IdentityCache();

// ── Base64 helpers ────────────────────────────────────────────────────────────

function bufToBase64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

function base64ToBuf(b64: string): ArrayBuffer | null {
  try {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes.buffer;
  } catch {
    return null;
  }
}
