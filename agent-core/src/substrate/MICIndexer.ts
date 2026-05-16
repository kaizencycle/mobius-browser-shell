/**
 * PR-018 · MICIndexer
 * Indexes MIC (Mobius Integrity Coin) transactions with provenance chains.
 * Every agent action that earns or burns MIC is recorded with a hash chain.
 */
import { OAAClient } from '../oaa/OAAClient';
import * as crypto from 'crypto';

export type MICEventType = 'earn' | 'burn' | 'transfer' | 'stake' | 'slash';

export interface MICEvent {
  id: string;
  type: MICEventType;
  agentId: string;
  amount: number;
  reason: string;
  prevHash: string;
  hash: string;
  timestamp: number;
}

export interface MICBalance {
  agentId: string;
  balance: number;
  lastEventId: string;
  updatedAt: number;
}

export class MICIndexer {
  private readonly oaa: OAAClient;

  constructor(oaa: OAAClient) {
    this.oaa = oaa;
  }

  private hashEvent(event: Omit<MICEvent, 'hash'>): string {
    return crypto
      .createHash('sha256')
      .update(JSON.stringify(event))
      .digest('hex');
  }

  async record(params: {
    type: MICEventType;
    agentId: string;
    amount: number;
    reason: string;
  }): Promise<MICEvent> {
    const chainRaw = await this.oaa.get(`mic:chain:${params.agentId}`);
    const prevHash = chainRaw
      ? (JSON.parse(chainRaw) as { hash: string }).hash
      : '0'.repeat(64);

    const partial: Omit<MICEvent, 'hash'> = {
      id: `${params.agentId}-${Date.now()}`,
      type: params.type,
      agentId: params.agentId,
      amount: params.amount,
      reason: params.reason,
      prevHash,
      timestamp: Date.now(),
    };

    const event: MICEvent = { ...partial, hash: this.hashEvent(partial) };

    // Persist event and update chain head
    await this.oaa.append(`mic:events:${params.agentId}`, event);
    await this.oaa.set(`mic:chain:${params.agentId}`, JSON.stringify({ hash: event.hash }));

    // Update balance
    await this.updateBalance(params.agentId, params.type === 'burn' || params.type === 'slash'
      ? -params.amount
      : params.amount, event.id);

    return event;
  }

  private async updateBalance(agentId: string, delta: number, eventId: string): Promise<void> {
    const raw = await this.oaa.get(`mic:balance:${agentId}`);
    const current = raw ? (JSON.parse(raw) as MICBalance) : { agentId, balance: 0, lastEventId: '', updatedAt: 0 };
    const updated: MICBalance = {
      agentId,
      balance: Math.max(0, current.balance + delta),
      lastEventId: eventId,
      updatedAt: Date.now(),
    };
    await this.oaa.set(`mic:balance:${agentId}`, JSON.stringify(updated));
  }

  async getBalance(agentId: string): Promise<number> {
    const raw = await this.oaa.get(`mic:balance:${agentId}`);
    if (!raw) return 0;
    return (JSON.parse(raw) as MICBalance).balance;
  }

  async index(namespace: string, data: unknown): Promise<void> {
    await this.oaa.append(`mic:index:${namespace}`, { data, timestamp: Date.now() });
  }

  async getProvenance(agentId: string, limit = 50): Promise<MICEvent[]> {
    const raw = await this.oaa.get(`mic:events:${agentId}`);
    if (!raw) return [];
    const events = JSON.parse(raw) as MICEvent[];
    return events.slice(-limit);
  }
}
