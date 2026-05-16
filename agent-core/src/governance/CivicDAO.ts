/**
 * PR-006 · CivicDAO
 * Agent governance layer. Proposals require threshold-based agent consensus
 * before execution. Thresholds: code=51%, world=67%, economy=75%, emergency=90%.
 */
import { EventEmitter } from 'events';
import { OAAClient } from '../oaa/OAAClient';

export type ProposalCategory = 'code' | 'world' | 'economy' | 'governance' | 'emergency';
export type ProposalStatus = 'pending' | 'approved' | 'rejected' | 'expired' | 'executed';

export interface Proposal {
  id: string;
  category: ProposalCategory;
  title: string;
  description: string;
  proposedBy: string;
  createdAt: number;
  expiresAt: number;
  status: ProposalStatus;
  votes: Record<string, 'yes' | 'no' | 'abstain'>;
  threshold: number;   // required approval fraction (0–1)
  totalVoters: number; // expected voters at proposal time
  executedAt?: number;
  result?: unknown;
}

const THRESHOLDS: Record<ProposalCategory, number> = {
  code:       0.51,
  world:      0.67,
  economy:    0.75,
  governance: 0.67,
  emergency:  0.90,
};

export class CivicDAO extends EventEmitter {
  private readonly oaa: OAAClient;
  private proposals: Map<string, Proposal> = new Map();
  private readonly totalVoters: number;
  private readonly ttlMs: number;
  // Quorum decay: if fewer than quorumDecayFraction × totalVoters have voted
  // within quorumDecayMs, lower the effective threshold to quorumDecayFloor
  // so governance cannot freeze on low-participation cycles.
  private readonly quorumDecayMs: number;
  private readonly quorumDecayFloor: number;
  private counter = 0;

  constructor(oaa: OAAClient, opts: {
    totalVoters?: number;
    ttlMs?: number;
    quorumDecayMs?: number;
    quorumDecayFloor?: number;
  } = {}) {
    super();
    this.oaa = oaa;
    this.totalVoters = opts.totalVoters ?? 18;
    this.ttlMs = opts.ttlMs ?? 24 * 60 * 60 * 1000; // 24h
    this.quorumDecayMs = opts.quorumDecayMs ?? 12 * 60 * 60 * 1000; // 12h
    this.quorumDecayFloor = opts.quorumDecayFloor ?? 0.34; // 34% floor after decay
  }

  async loadProposals(): Promise<void> {
    const raw = await this.oaa.get('dao:proposals');
    if (!raw) return;
    const stored = JSON.parse(raw) as Proposal[];
    for (const p of stored) {
      this.proposals.set(p.id, p);
    }
  }

  private async persistProposals(): Promise<void> {
    await this.oaa.set('dao:proposals', JSON.stringify([...this.proposals.values()]));
  }

  async createProposal(params: {
    category: ProposalCategory;
    title: string;
    description: string;
    proposedBy: string;
  }): Promise<Proposal> {
    const proposal: Proposal = {
      id: `prop-${++this.counter}-${Date.now()}`,
      category: params.category,
      title: params.title,
      description: params.description,
      proposedBy: params.proposedBy,
      createdAt: Date.now(),
      expiresAt: Date.now() + this.ttlMs,
      status: 'pending',
      votes: {},
      threshold: THRESHOLDS[params.category],
      totalVoters: this.totalVoters,
    };

    this.proposals.set(proposal.id, proposal);
    await this.persistProposals();
    this.emit('proposal:created', proposal);
    return proposal;
  }

  async vote(proposalId: string, agentId: string, vote: 'yes' | 'no' | 'abstain'): Promise<Proposal> {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) throw new Error(`Proposal "${proposalId}" not found`);
    if (proposal.status !== 'pending') throw new Error(`Proposal "${proposalId}" is ${proposal.status}`);
    if (Date.now() > proposal.expiresAt) {
      proposal.status = 'expired';
      await this.persistProposals();
      throw new Error(`Proposal "${proposalId}" has expired`);
    }

    proposal.votes[agentId] = vote;
    await this.persistProposals();
    this.emit('proposal:voted', { proposalId, agentId, vote });

    const yesVotes  = Object.values(proposal.votes).filter(v => v === 'yes').length;
    const noVotes   = Object.values(proposal.votes).filter(v => v === 'no').length;
    const castVotes = yesVotes + noVotes;

    // Quorum decay: if the proposal is old and participation is low, reduce
    // the effective threshold to quorumDecayFloor to prevent governance freeze.
    const ageMs          = Date.now() - proposal.createdAt;
    const effectiveThreshold = ageMs >= this.quorumDecayMs
      ? Math.min(proposal.threshold, this.quorumDecayFloor)
      : proposal.threshold;
    const needed = effectiveThreshold * proposal.totalVoters;

    // Early approval
    if (yesVotes >= needed) {
      proposal.status = 'approved';
      await this.persistProposals();
      this.emit('proposal:approved', proposal);
    }
    // Early rejection: remaining votes cannot reach effective threshold
    else if (yesVotes + (proposal.totalVoters - castVotes) < needed) {
      proposal.status = 'rejected';
      await this.persistProposals();
      this.emit('proposal:rejected', proposal);
    }

    return proposal;
  }

  async executeProposal(proposalId: string, executor: (p: Proposal) => Promise<unknown>): Promise<Proposal> {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) throw new Error(`Proposal "${proposalId}" not found`);
    if (proposal.status !== 'approved') throw new Error(`Proposal "${proposalId}" is not approved`);

    proposal.result = await executor(proposal);
    proposal.status = 'executed';
    proposal.executedAt = Date.now();
    await this.persistProposals();
    this.emit('proposal:executed', proposal);
    return proposal;
  }

  /**
   * Reap stale pending proposals whose TTL has passed.
   * Call on a regular schedule (e.g. hourly) to prevent governance freeze.
   * Returns the list of proposals that were expired this pass.
   */
  async reapExpired(): Promise<Proposal[]> {
    const now = Date.now();
    const reaped: Proposal[] = [];
    for (const proposal of this.proposals.values()) {
      if (proposal.status === 'pending' && now > proposal.expiresAt) {
        proposal.status = 'expired';
        reaped.push(proposal);
        this.emit('proposal:expired', proposal);
      }
    }
    if (reaped.length > 0) await this.persistProposals();
    return reaped;
  }

  /**
   * Emergency override: immediately set a proposal to approved/rejected
   * regardless of vote count. Requires a signed reason for audit purposes.
   * Use only for critical system interventions — all overrides are logged.
   */
  async emergencyOverride(
    proposalId: string,
    outcome: 'approved' | 'rejected',
    operatorId: string,
    reason: string,
  ): Promise<Proposal> {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) throw new Error(`Proposal "${proposalId}" not found`);
    if (proposal.status !== 'pending') {
      throw new Error(`Proposal "${proposalId}" is already ${proposal.status}`);
    }

    proposal.status = outcome;
    // Record override in votes under a sentinel key for auditability
    proposal.votes[`__override:${operatorId}`] = outcome === 'approved' ? 'yes' : 'no';

    await this.oaa.append('dao:emergency_overrides', {
      proposalId,
      outcome,
      operatorId,
      reason,
      timestamp: Date.now(),
    });

    await this.persistProposals();
    this.emit('proposal:emergency_override', { proposal, operatorId, reason, outcome });
    return proposal;
  }

  listProposals(status?: ProposalStatus): Proposal[] {
    const all = [...this.proposals.values()];
    return status ? all.filter(p => p.status === status) : all;
  }

  getProposal(id: string): Proposal | undefined {
    return this.proposals.get(id);
  }
}
