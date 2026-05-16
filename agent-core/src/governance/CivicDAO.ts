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
  private counter = 0;

  constructor(oaa: OAAClient, opts: { totalVoters?: number; ttlMs?: number } = {}) {
    super();
    this.oaa = oaa;
    this.totalVoters = opts.totalVoters ?? 18;
    this.ttlMs = opts.ttlMs ?? 24 * 60 * 60 * 1000; // 24h
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

    const yesVotes = Object.values(proposal.votes).filter(v => v === 'yes').length;
    const noVotes  = Object.values(proposal.votes).filter(v => v === 'no').length;
    const needed   = proposal.threshold * proposal.totalVoters;

    // Early approval: yes votes already satisfy the threshold
    if (yesVotes >= needed) {
      proposal.status = 'approved';
      await this.persistProposals();
      this.emit('proposal:approved', proposal);
    }
    // Early rejection: remaining votes (including uncast) can't reach threshold
    else if (yesVotes + (proposal.totalVoters - yesVotes - noVotes) < needed) {
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

  listProposals(status?: ProposalStatus): Proposal[] {
    const all = [...this.proposals.values()];
    return status ? all.filter(p => p.status === status) : all;
  }

  getProposal(id: string): Proposal | undefined {
    return this.proposals.get(id);
  }
}
