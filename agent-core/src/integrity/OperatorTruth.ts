/**
 * OperatorTruth — Canonical Attestation Layer
 *
 * Mobius canon principle: operator truth is always superior to autonomous
 * agent truth. No autonomous action may modify world state, governance, or
 * the ledger without a DVA-attested record that is visible to the operator.
 *
 * This module provides:
 *  1. A sealed ledger of every autonomous action (append-only, hash-chained).
 *  2. An attestation gate: agents MUST call attest() before acting; the
 *     action is rejected if it violates constitutional constraints.
 *  3. A Phase A experimental flag that surfaces warnings when the system
 *     is not yet connected to live civic continuity.
 *
 * Phase guidance:
 *  Phase A (current): experimental substrate — autonomous actions are
 *    recorded and validated but the live Browser Shell is NOT connected.
 *    PHASE_A_EXPERIMENTAL must be true until Phase B hardening is complete.
 *
 *  Phase B: replay safety, scheduler guards, quorum decay, lock recovery,
 *    event isolation. Required before Phase C.
 *
 *  Phase C: connect HIVE world state to live orchestration. PHASE_A_EXPERIMENTAL
 *    becomes false only after sentinel review of Phase B.
 */
import * as crypto from 'crypto';
import { OAAClient } from '../oaa/OAAClient';

export const PHASE_A_EXPERIMENTAL = true;

export type ActionCategory =
  | 'world_mutation'
  | 'economy_mutation'
  | 'lore_mutation'
  | 'code_mutation'
  | 'governance_mutation'
  | 'agent_lifecycle'
  | 'system_query';

export interface AttestationRequest {
  agentId: string;
  action: string;
  category: ActionCategory;
  payload: unknown;
  proposalId?: string;   // Required for governance and code mutations
}

export interface AttestationRecord {
  id: string;
  agentId: string;
  action: string;
  category: ActionCategory;
  payload: unknown;
  proposalId?: string;
  attestedAt: number;
  prevHash: string;
  hash: string;
  /** true if the action was allowed to proceed */
  allowed: boolean;
  /** reason for denial, if any */
  denyReason?: string;
}

// Mutations that are BLOCKED in Phase A (live civic continuity not connected).
const BLOCKED_IN_PHASE_A: Set<ActionCategory> = new Set([
  'code_mutation',
  'governance_mutation',
]);

// Mutations that REQUIRE a proposalId (governance gate).
const REQUIRES_PROPOSAL: Set<ActionCategory> = new Set([
  'code_mutation',
  'governance_mutation',
  'economy_mutation',
]);

export class OperatorTruth {
  private readonly oaa: OAAClient;
  private readonly signingKey: string;
  private recordCount = 0;

  constructor(oaa: OAAClient, signingKey: string) {
    this.oaa = oaa;
    this.signingKey = signingKey;
  }

  /**
   * Gate for all autonomous agent actions.
   * Returns the attestation record — check record.allowed before proceeding.
   * If PHASE_A_EXPERIMENTAL is true, certain action categories are blocked.
   */
  async attest(req: AttestationRequest): Promise<AttestationRecord> {
    const { action, category, payload, proposalId } = req;

    // Phase A gate: block categories that would modify live civic state
    if (PHASE_A_EXPERIMENTAL && BLOCKED_IN_PHASE_A.has(category)) {
      return this.deny(req, `Phase A experimental mode: "${category}" actions are blocked until Phase B hardening is complete`);
    }

    // Governance gate: mutations that affect shared state require a proposal
    if (REQUIRES_PROPOSAL.has(category) && !proposalId) {
      return this.deny(req, `Action "${action}" in category "${category}" requires an approved proposalId`);
    }

    // Payload safety: reject prototype pollution
    const payloadStr = JSON.stringify(payload);
    if (payloadStr.includes('__proto__') || (payloadStr.includes('constructor') && payloadStr.includes('prototype'))) {
      return this.deny(req, 'Payload contains prototype pollution keys');
    }

    return this.allow(req);
  }

  private async allow(req: AttestationRequest): Promise<AttestationRecord> {
    return this.writeRecord({ ...req, allowed: true });
  }

  private async deny(req: AttestationRequest, denyReason: string): Promise<AttestationRecord> {
    return this.writeRecord({ ...req, allowed: false, denyReason });
  }

  private async writeRecord(data: AttestationRequest & { allowed: boolean; denyReason?: string }): Promise<AttestationRecord> {
    const chainRaw = await this.oaa.get('operator_truth:chain_head');
    const prevHash = chainRaw ? (JSON.parse(chainRaw) as { hash: string }).hash : '0'.repeat(64);

    const partial = {
      id:          `otr-${++this.recordCount}-${Date.now()}`,
      agentId:     data.agentId,
      action:      data.action,
      category:    data.category,
      payload:     data.payload,
      proposalId:  data.proposalId as string | undefined,
      attestedAt:  Date.now(),
      prevHash,
      allowed:     data.allowed,
      denyReason:  data.denyReason as string | undefined,
    };

    const hash = crypto
      .createHmac('sha256', this.signingKey)
      .update(JSON.stringify(partial))
      .digest('hex');

    const record: AttestationRecord = { ...partial, hash };

    await this.oaa.append('operator_truth:ledger', record);
    await this.oaa.set('operator_truth:chain_head', JSON.stringify({ hash }));

    return record;
  }

  /** Retrieve the full immutable attestation ledger. */
  async getLedger(limit = 100): Promise<AttestationRecord[]> {
    const raw = await this.oaa.get('operator_truth:ledger');
    if (!raw) return [];
    const all = JSON.parse(raw) as AttestationRecord[];
    return all.slice(-limit);
  }

  /** Count blocked (denied) attestation attempts — a key integrity signal. */
  async getDeniedCount(): Promise<number> {
    const ledger = await this.getLedger(1000);
    return ledger.filter(r => !r.allowed).length;
  }
}
