/**
 * PR-012 · DVA (Distributed Verification Authority)
 * Cryptographically signs and verifies agent actions, maintaining an
 * append-only hash chain for audit and rollback.
 */
import * as crypto from 'crypto';
import { OAAClient } from '../oaa/OAAClient';

export interface DVARecord {
  id: string;
  agentId: string;
  action: string;
  payload: unknown;
  timestamp: number;
  prevHash: string;
  hash: string;
  signature: string;
}

export interface DVAVerifyResult {
  valid: boolean;
  reason?: string;
}

export class DVA {
  private readonly oaa: OAAClient;
  private readonly signingKey: string;

  constructor(oaa: OAAClient, signingKey: string) {
    this.oaa = oaa;
    this.signingKey = signingKey;
  }

  private computeHash(data: object): string {
    return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
  }

  private sign(hash: string): string {
    return crypto.createHmac('sha256', this.signingKey).update(hash).digest('hex');
  }

  async record(agentId: string, action: string, payload: unknown): Promise<DVARecord> {
    const chainRaw = await this.oaa.get(`dva:chain:${agentId}`);
    const prevHash = chainRaw ? (JSON.parse(chainRaw) as { hash: string }).hash : '0'.repeat(64);

    const partial = {
      id: `dva:${agentId}:${Date.now()}`,
      agentId,
      action,
      payload,
      timestamp: Date.now(),
      prevHash,
    };

    const hash = this.computeHash(partial);
    const signature = this.sign(hash);
    const record: DVARecord = { ...partial, hash, signature };

    await this.oaa.append(`dva:log:${agentId}`, record);
    await this.oaa.set(`dva:chain:${agentId}`, JSON.stringify({ hash }));

    return record;
  }

  verify(record: DVARecord): DVAVerifyResult {
    // Recompute hash from fields excluding hash + signature
    const { hash: _h, signature: _s, ...rest } = record;
    const expected = this.computeHash(rest);
    if (expected !== record.hash) {
      return { valid: false, reason: 'hash mismatch' };
    }
    const expectedSig = this.sign(record.hash);
    if (expectedSig !== record.signature) {
      return { valid: false, reason: 'signature mismatch' };
    }
    return { valid: true };
  }

  async verifyChain(agentId: string): Promise<DVAVerifyResult> {
    const raw = await this.oaa.get(`dva:log:${agentId}`);
    if (!raw) return { valid: true };

    const records = JSON.parse(raw) as DVARecord[];
    for (let i = 0; i < records.length; i++) {
      const rec = records[i]!;
      const result = this.verify(rec);
      if (!result.valid) return { valid: false, reason: `entry ${i}: ${result.reason}` };
      if (i > 0) {
        const prev = records[i - 1]!;
        if (rec.prevHash !== prev.hash) {
          return { valid: false, reason: `chain break at entry ${i}` };
        }
      }
    }
    return { valid: true };
  }
}
