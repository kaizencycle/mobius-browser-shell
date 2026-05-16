/**
 * PR-014 · Reflections
 * AI peer code review agent. Analyzes code patches, assigns quality scores,
 * and generates structured review reports used in the governance pipeline.
 */
import { OAAClient } from '../oaa/OAAClient';
import { ThoughtBroker } from '../substrate/ThoughtBroker';

export interface CodeReviewReport {
  id: string;
  patchId: string;
  reviewer: string;
  qualityScore: number;      // 0–100
  securityScore: number;     // 0–100
  consistencyScore: number;  // 0–100
  overallScore: number;
  issues: ReviewIssue[];
  approved: boolean;
  reviewedAt: number;
}

export interface ReviewIssue {
  severity: 'info' | 'warning' | 'error' | 'blocking';
  category: 'security' | 'performance' | 'style' | 'logic' | 'consistency';
  description: string;
  line?: number;
}

const STYLE_PATTERNS = [
  { re: /console\.log/g,   issue: 'Remove console.log before commit',        severity: 'warning' as const, category: 'style' as const },
  { re: /TODO:/g,          issue: 'Unresolved TODO found',                   severity: 'info'    as const, category: 'style' as const },
  { re: /any\b/g,          issue: 'Avoid TypeScript `any` — use proper type', severity: 'warning' as const, category: 'style' as const },
];

const LOGIC_PATTERNS = [
  { re: /== null/,         issue: 'Use `=== null` for strict null check',    severity: 'warning' as const, category: 'logic' as const },
  { re: /catch\s*\(\s*\)/, issue: 'Empty catch block swallows errors',       severity: 'error'   as const, category: 'logic' as const },
];

export class Reflections {
  private readonly oaa: OAAClient;
  private readonly broker: ThoughtBroker;
  private readonly agentId: string;
  private reviewCounter = 0;

  constructor(agentId: string, deps: { oaa: OAAClient; broker: ThoughtBroker }) {
    this.agentId = agentId;
    this.oaa = deps.oaa;
    this.broker = deps.broker;
  }

  async reviewCode(params: { patchId: string; code: string; context?: string }): Promise<CodeReviewReport> {
    const issues: ReviewIssue[] = [];

    for (const p of STYLE_PATTERNS) {
      const matches = params.code.match(p.re);
      if (matches) {
        issues.push({ severity: p.severity, category: p.category, description: p.issue });
      }
    }

    for (const p of LOGIC_PATTERNS) {
      if (p.re.test(params.code)) {
        issues.push({ severity: p.severity, category: p.category, description: p.issue });
      }
    }

    const blockingCount  = issues.filter(i => i.severity === 'blocking').length;
    const errorCount     = issues.filter(i => i.severity === 'error').length;
    const warningCount   = issues.filter(i => i.severity === 'warning').length;

    const qualityScore    = Math.max(0, 100 - blockingCount * 30 - errorCount * 15 - warningCount * 5);
    const securityScore   = issues.some(i => i.category === 'security') ? 60 : 95;
    const consistencyScore = issues.filter(i => i.category === 'consistency').length > 0 ? 70 : 90;
    const overallScore    = Math.round((qualityScore * 0.4 + securityScore * 0.4 + consistencyScore * 0.2));

    const report: CodeReviewReport = {
      id: `review-${++this.reviewCounter}`,
      patchId: params.patchId,
      reviewer: this.agentId,
      qualityScore,
      securityScore,
      consistencyScore,
      overallScore,
      issues,
      approved: overallScore >= 70 && blockingCount === 0,
      reviewedAt: Date.now(),
    };

    await this.oaa.append('code:reviews', report);
    await this.broker.publish('code.review.complete', this.agentId, {
      patchId: params.patchId,
      approved: report.approved,
      overallScore,
    });

    return report;
  }

  async generateReport(reports: CodeReviewReport[]): Promise<string> {
    const approved  = reports.filter(r => r.approved).length;
    const avgScore  = reports.reduce((s, r) => s + r.overallScore, 0) / (reports.length || 1);
    const allIssues = reports.flatMap(r => r.issues);
    const blocking  = allIssues.filter(i => i.severity === 'blocking').length;

    return [
      `# Code Review Summary — ${new Date().toISOString()}`,
      `Reviews: ${reports.length} | Approved: ${approved} | Avg score: ${avgScore.toFixed(1)}`,
      `Blocking issues: ${blocking}`,
      '',
      ...reports.map(r => `- [${r.approved ? '✓' : '✗'}] ${r.patchId} (${r.overallScore}/100) — ${r.issues.length} issues`),
    ].join('\n');
  }
}
