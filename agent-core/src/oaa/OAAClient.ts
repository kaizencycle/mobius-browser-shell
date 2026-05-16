/**
 * PR-002 · OAAClient
 * HMAC-authenticated file-based key-value store with file-locking.
 * Acts as the persistent memory layer for all SWARM-18 agents.
 */
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import * as lockfile from 'proper-lockfile';

export interface KVEntry {
  value: string;
  writtenAt: number;
  signature: string;
  prevHash: string;
}

export interface IntegrityReport {
  valid: boolean;
  corrupted: string[];
  totalKeys: number;
}

type KVStore = Record<string, KVEntry>;

export class OAAClient {
  private readonly storePath: string;
  private readonly hmacKey: string;
  private cache: KVStore | null = null;

  constructor(opts: { dir?: string; hmacKey: string }) {
    this.storePath = path.resolve(opts.dir ?? './data', 'OAA_MEMORY.json');
    this.hmacKey = opts.hmacKey;
  }

  // ── Internal ──────────────────────────────────────────────────────────────

  private hmac(data: string): string {
    return crypto.createHmac('sha256', this.hmacKey).update(data).digest('hex');
  }

  private async ensureFile(): Promise<void> {
    const dir = path.dirname(this.storePath);
    await fs.mkdir(dir, { recursive: true });
    try {
      await fs.access(this.storePath);
    } catch {
      await fs.writeFile(this.storePath, '{}', 'utf8');
    }
  }

  private async readStore(): Promise<KVStore> {
    if (this.cache) return this.cache;
    await this.ensureFile();
    const raw = await fs.readFile(this.storePath, 'utf8');
    this.cache = JSON.parse(raw) as KVStore;
    return this.cache;
  }

  private async writeStore(store: KVStore): Promise<void> {
    this.cache = store;
    await fs.writeFile(this.storePath, JSON.stringify(store, null, 2), 'utf8');
  }

  private async withLock<T>(fn: () => Promise<T>): Promise<T> {
    await this.ensureFile();
    let release: (() => Promise<void>) | null = null;
    try {
      release = await lockfile.lock(this.storePath, { retries: { retries: 5, minTimeout: 50 } });
      return await fn();
    } finally {
      if (release) await release();
    }
  }

  // ── Public API ────────────────────────────────────────────────────────────

  async get(key: string): Promise<string | null> {
    const store = await this.readStore();
    const entry = store[key];
    if (!entry) return null;
    const expected = this.hmac(`${key}:${entry.value}:${entry.writtenAt}`);
    if (expected !== entry.signature) {
      throw new Error(`OAAClient: integrity violation on key "${key}"`);
    }
    return entry.value;
  }

  async set(key: string, value: string): Promise<void> {
    return this.withLock(async () => {
      const store = await this.readStore();
      const prevHash = store[key]?.signature ?? '0'.repeat(64);
      const writtenAt = Date.now();
      const signature = this.hmac(`${key}:${value}:${writtenAt}`);
      store[key] = { value, writtenAt, signature, prevHash };
      await this.writeStore(store);
    });
  }

  async delete(key: string): Promise<void> {
    return this.withLock(async () => {
      const store = await this.readStore();
      delete store[key];
      await this.writeStore(store);
    });
  }

  async append(key: string, item: unknown): Promise<void> {
    return this.withLock(async () => {
      const store = await this.readStore();
      const existing = store[key];
      let arr: unknown[] = [];
      if (existing) {
        const expected = this.hmac(`${key}:${existing.value}:${existing.writtenAt}`);
        if (expected !== existing.signature) throw new Error(`OAAClient: integrity violation on key "${key}"`);
        arr = JSON.parse(existing.value) as unknown[];
      }
      arr.push(item);
      const value = JSON.stringify(arr);
      const writtenAt = Date.now();
      const signature = this.hmac(`${key}:${value}:${writtenAt}`);
      const prevHash = existing?.signature ?? '0'.repeat(64);
      store[key] = { value, writtenAt, signature, prevHash };
      await this.writeStore(store);
    });
  }

  async keys(prefix?: string): Promise<string[]> {
    const store = await this.readStore();
    const all = Object.keys(store);
    return prefix ? all.filter(k => k.startsWith(prefix)) : all;
  }

  async verifyIntegrity(): Promise<IntegrityReport> {
    const store = await this.readStore();
    const corrupted: string[] = [];
    for (const [key, entry] of Object.entries(store)) {
      const expected = this.hmac(`${key}:${entry.value}:${entry.writtenAt}`);
      if (expected !== entry.signature) corrupted.push(key);
    }
    return { valid: corrupted.length === 0, corrupted, totalKeys: Object.keys(store).length };
  }

  /** Invalidate in-memory cache (call after external writes). */
  invalidateCache(): void {
    this.cache = null;
  }
}
