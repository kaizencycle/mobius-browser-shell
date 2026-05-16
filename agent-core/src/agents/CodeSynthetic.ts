/**
 * PR-010 · CodeSynthetic
 * Autonomous code generation and bug-patching agent.
 * Detects anomalies, generates patches, submits them through the DVA
 * and CivicDAO governance pipeline before any code change is applied.
 */
import { OAAClient } from '../oaa/OAAClient';
import { ThoughtBroker } from '../substrate/ThoughtBroker';
import { DVA } from '../integrity/DVA';
import { CitizenShield } from '../security/CitizenShield';
import { CivicDAO } from '../governance/CivicDAO';
import { MICIndexer } from '../substrate/MICIndexer';

export type BugSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface BugReport {
  id: string;
  severity: BugSeverity;
  file: string;
  line?: number;
  description: string;
  detectedAt: number;
  patch?: CodePatch;
}

export interface CodePatch {
  id: string;
  bugId: string;
  diff: string;       // unified diff string
  rationale: string;
  proposalId?: string;
  status: 'draft' | 'proposed' | 'approved' | 'rejected' | 'applied';
  createdAt: number;
}

export interface FeatureProposal {
  id: string;
  title: string;
  description: string;
  estimatedComplexity: 'low' | 'medium' | 'high';
  proposalId?: string;
  createdAt: number;
}

export class CodeSynthetic {
  private readonly oaa: OAAClient;
  private readonly broker: ThoughtBroker;
  private readonly dva: DVA;
  private readonly shield: CitizenShield;
  private readonly dao: CivicDAO;
  private readonly mic: MICIndexer;
  private readonly agentId: string;
  private bugCounter = 0;
  private patchCounter = 0;
  private featureCounter = 0;

  constructor(agentId: string, deps: {
    oaa: OAAClient;
    broker: ThoughtBroker;
    dva: DVA;
    shield: CitizenShield;
    dao: CivicDAO;
    mic: MICIndexer;
  }) {
    this.agentId = agentId;
    this.oaa = deps.oaa;
    this.broker = deps.broker;
    this.dva = deps.dva;
    this.shield = deps.shield;
    this.dao = deps.dao;
    this.mic = deps.mic;
  }

  /** Detect anomalies in provided code or from OAA error log. */
  async detectBugs(source: { file: string; code?: string; errorLog?: string }): Promise<BugReport[]> {
    const reports: BugReport[] = [];

    // Scan code for unsafe patterns
    if (source.code) {
      const violation = this.shield.scanCode(this.agentId, source.code);
      if (violation) {
        reports.push({
          id: `bug-${++this.bugCounter}`,
          severity: 'critical',
          file: source.file,
          description: `Security violation: ${violation.detail}`,
          detectedAt: Date.now(),
        });
      }
    }

    // Scan error logs for known patterns
    if (source.errorLog) {
      const patterns = [
        { re: /TypeError/,     severity: 'high'   as BugSeverity, desc: 'Uncaught TypeError' },
        { re: /ReferenceError/,severity: 'high'   as BugSeverity, desc: 'ReferenceError' },
        { re: /memory leak/i,  severity: 'medium' as BugSeverity, desc: 'Potential memory leak' },
        { re: /timeout/i,      severity: 'low'    as BugSeverity, desc: 'Operation timeout' },
      ];
      for (const p of patterns) {
        if (p.re.test(source.errorLog)) {
          reports.push({
            id: `bug-${++this.bugCounter}`,
            severity: p.severity,
            file: source.file,
            description: p.desc,
            detectedAt: Date.now(),
          });
        }
      }
    }

    for (const report of reports) {
      await this.oaa.append('code:bugs', report);
      await this.broker.publish('code.bug.detected', this.agentId, { bugId: report.id, severity: report.severity });
    }

    return reports;
  }

  async generatePatch(bug: BugReport): Promise<CodePatch> {
    const patch: CodePatch = {
      id: `patch-${++this.patchCounter}`,
      bugId: bug.id,
      diff: `--- a/${bug.file}\n+++ b/${bug.file}\n@@ -0,0 +1,3 @@\n// AUTO-PATCH by ${this.agentId}\n// Bug: ${bug.description}\n// Severity: ${bug.severity}`,
      rationale: `Automated patch for ${bug.severity} bug in ${bug.file}: ${bug.description}`,
      status: 'draft',
      createdAt: Date.now(),
    };

    // All code changes require DVA sign-off
    await this.dva.record(this.agentId, 'generate_patch', { patchId: patch.id, bugId: bug.id });

    // Submit as governance proposal
    const proposal = await this.dao.createProposal({
      category: 'code',
      title: `Auto-patch: ${bug.description.slice(0, 60)}`,
      description: `Patch ${patch.id} generated for ${bug.severity} bug in ${bug.file}.\n\nRationale: ${patch.rationale}`,
      proposedBy: this.agentId,
    });

    patch.proposalId = proposal.id;
    patch.status = 'proposed';
    bug.patch = patch;

    await this.oaa.append('code:patches', patch);
    await this.broker.publish('code.patch.proposed', this.agentId, { patchId: patch.id, proposalId: proposal.id });
    await this.mic.record({ type: 'earn', agentId: this.agentId, amount: 0.5, reason: 'patch_generated' });

    return patch;
  }

  async proposeFeature(title: string, description: string, complexity: FeatureProposal['estimatedComplexity']): Promise<FeatureProposal> {
    const feature: FeatureProposal = {
      id: `feature-${++this.featureCounter}`,
      title,
      description,
      estimatedComplexity: complexity,
      createdAt: Date.now(),
    };

    const proposal = await this.dao.createProposal({
      category: 'code',
      title: `Feature: ${title}`,
      description,
      proposedBy: this.agentId,
    });

    feature.proposalId = proposal.id;
    await this.oaa.append('code:features', feature);
    await this.broker.publish('code.feature.proposed', this.agentId, { featureId: feature.id });

    return feature;
  }

  async getOpenBugs(severity?: BugSeverity): Promise<BugReport[]> {
    const raw = await this.oaa.get('code:bugs');
    if (!raw) return [];
    const all = JSON.parse(raw) as BugReport[];
    return severity ? all.filter(b => b.severity === severity) : all;
  }
}
