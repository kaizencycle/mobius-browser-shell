/**
 * PR-015 · JADE (Agent Development Environment)
 * Pattern oracle and agent IDE for the SWARM-18 system.
 * Analyzes agent behaviour, surfaces knowledge gaps, and proposes
 * optimizations using the same insight taxonomy as the Browser Shell.
 */
import { OAAClient } from '../oaa/OAAClient';
import { ThoughtBroker } from '../substrate/ThoughtBroker';

export type InsightType =
  | 'dominant_pattern'
  | 'neglected_domain'
  | 'emerging_cluster'
  | 'suggested_connection'
  | 'performance_gap';

export interface AgentInsight {
  id: string;
  type: InsightType;
  title: string;
  description: string;
  relatedAgents: string[];
  confidence: number; // 0–1
  actionable?: string;
  generatedAt: number;
}

export interface JADESession {
  id: string;
  question: string;
  context: Record<string, unknown>;
  response: string;
  insightIds: string[];
  sessionAt: number;
}

export class JADE {
  private readonly oaa: OAAClient;
  private readonly broker: ThoughtBroker;
  private readonly agentId: string;
  private insightCounter = 0;
  private sessionCounter = 0;

  constructor(agentId: string, deps: { oaa: OAAClient; broker: ThoughtBroker }) {
    this.agentId = agentId;
    this.oaa = deps.oaa;
    this.broker = deps.broker;
  }

  /** Analyze swarm telemetry and surface patterns. */
  async analyzeSwarm(telemetry: {
    agentStates: Record<string, string>;
    domainActivity: Record<string, number>;
    errorRates: Record<string, number>;
  }): Promise<AgentInsight[]> {
    const insights: AgentInsight[] = [];

    // Find dominant domain
    const sorted = Object.entries(telemetry.domainActivity).sort((a, b) => b[1] - a[1]);
    if (sorted[0] && sorted[0][1] > 0.5) {
      insights.push(this.makeInsight('dominant_pattern', {
        title: `Domain "${sorted[0][0]}" dominates swarm activity`,
        description: `${Math.round(sorted[0][1] * 100)}% of swarm actions are in the ${sorted[0][0]} domain. Consider balancing agent allocation.`,
        relatedAgents: [],
        confidence: 0.9,
        actionable: `Spawn 2 additional agents in under-represented domains`,
      }));
    }

    // Find high-error agents
    const highError = Object.entries(telemetry.errorRates).filter(([, rate]) => rate > 0.15);
    if (highError.length > 0) {
      insights.push(this.makeInsight('performance_gap', {
        title: `${highError.length} agents have error rates above 15%`,
        description: highError.map(([id, rate]) => `${id}: ${Math.round(rate * 100)}%`).join(', '),
        relatedAgents: highError.map(([id]) => id),
        confidence: 0.95,
        actionable: `Investigate error logs for: ${highError.map(([id]) => id).join(', ')}`,
      }));
    }

    // Find neglected domains
    const neglected = Object.entries(telemetry.domainActivity).filter(([, v]) => v < 0.1);
    if (neglected.length > 0) {
      insights.push(this.makeInsight('neglected_domain', {
        title: `${neglected.length} domain(s) have low activity`,
        description: neglected.map(([d]) => d).join(', '),
        relatedAgents: [],
        confidence: 0.8,
        actionable: `Schedule dedicated task cycles for neglected domains`,
      }));
    }

    for (const insight of insights) {
      await this.oaa.append('jade:insights', insight);
      await this.broker.publish('jade.insight.generated', this.agentId, { insightId: insight.id, type: insight.type });
    }

    return insights;
  }

  private makeInsight(type: InsightType, opts: Omit<AgentInsight, 'id' | 'type' | 'generatedAt'>): AgentInsight {
    return {
      id: `insight-${++this.insightCounter}`,
      type,
      generatedAt: Date.now(),
      ...opts,
    };
  }

  /** Accept a question about the swarm and return a structured response. */
  async query(question: string, context: Record<string, unknown> = {}): Promise<JADESession> {
    // In production this calls the JADE API endpoint; here we return a structured default.
    const response = `JADE analysis: "${question}" — context has ${Object.keys(context).length} keys. Pattern recognition requires more telemetry cycles.`;

    const session: JADESession = {
      id: `session-${++this.sessionCounter}`,
      question,
      context,
      response,
      insightIds: [],
      sessionAt: Date.now(),
    };

    await this.oaa.append('jade:sessions', session);
    return session;
  }

  async getInsights(type?: InsightType): Promise<AgentInsight[]> {
    const raw = await this.oaa.get('jade:insights');
    if (!raw) return [];
    const all = JSON.parse(raw) as AgentInsight[];
    return type ? all.filter(i => i.type === type) : all;
  }
}
