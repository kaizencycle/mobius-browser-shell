/**
 * PR-017 · GIAggregator
 * Global Intelligence Aggregator: computes a world-wide integrity/sentiment
 * score from agent health, economic stability, lore consistency, and code quality.
 */
import { OAAClient } from '../oaa/OAAClient';

export interface GISignal {
  domain: 'world' | 'economy' | 'lore' | 'code' | 'governance';
  score: number;   // 0–1
  weight: number;  // relative importance
  timestamp: number;
  agentId: string;
}

export interface GISnapshot {
  gi: number;               // 0–1, weighted average
  mode: 'green' | 'yellow' | 'red';
  signals: GISignal[];
  cycle: string;
  computedAt: number;
}

const DOMAIN_WEIGHTS: Record<GISignal['domain'], number> = {
  world:      0.25,
  economy:    0.25,
  lore:       0.15,
  code:       0.25,
  governance: 0.10,
};

export class GIAggregator {
  private readonly oaa: OAAClient;
  private signals: GISignal[] = [];

  constructor(oaa: OAAClient) {
    this.oaa = oaa;
  }

  ingestSignal(signal: GISignal): void {
    // Keep latest signal per domain
    this.signals = this.signals.filter(s => s.domain !== signal.domain);
    this.signals.push(signal);
  }

  computeGI(): GISnapshot {
    if (this.signals.length === 0) {
      return { gi: 1.0, mode: 'green', signals: [], cycle: 'C-313', computedAt: Date.now() };
    }

    let weightedSum = 0;
    let totalWeight = 0;

    for (const sig of this.signals) {
      const w = DOMAIN_WEIGHTS[sig.domain] ?? 0.1;
      weightedSum += sig.score * w;
      totalWeight += w;
    }

    const gi = totalWeight > 0 ? Math.max(0, Math.min(1, weightedSum / totalWeight)) : 1.0;
    const mode: GISnapshot['mode'] = gi >= 0.7 ? 'green' : gi >= 0.4 ? 'yellow' : 'red';

    return {
      gi,
      mode,
      signals: [...this.signals],
      cycle: 'C-313',
      computedAt: Date.now(),
    };
  }

  async persistSnapshot(): Promise<GISnapshot> {
    const snapshot = this.computeGI();
    await this.oaa.set('gi:latest', JSON.stringify(snapshot));
    await this.oaa.append('gi:history', snapshot);
    return snapshot;
  }

  async loadLatest(): Promise<GISnapshot | null> {
    const raw = await this.oaa.get('gi:latest');
    return raw ? (JSON.parse(raw) as GISnapshot) : null;
  }
}
