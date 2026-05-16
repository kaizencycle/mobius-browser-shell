/**
 * PR-008 · EconomyArchitect
 * Autonomous market rebalancing using a PID controller to maintain
 * the 2% inflation target and stable MIC circulation.
 */
import { OAAClient } from '../oaa/OAAClient';
import { ThoughtBroker } from '../substrate/ThoughtBroker';
import { MICIndexer } from '../substrate/MICIndexer';

export interface MarketSnapshot {
  totalSupply: number;
  circulatingSupply: number;
  priceIndex: number;       // relative price level (1.0 = baseline)
  inflationRate: number;    // annualized %
  timestamp: number;
}

export interface RebalanceAction {
  type: 'mint' | 'burn' | 'adjust_rate' | 'no_op';
  amount: number;
  reason: string;
  timestamp: number;
}

export class EconomyArchitect {
  private readonly oaa: OAAClient;
  private readonly broker: ThoughtBroker;
  private readonly mic: MICIndexer;
  private readonly agentId: string;

  // PID controller state
  private pidIntegral = 0;
  private pidPrevError = 0;
  private readonly target = 2.0;   // 2% inflation target
  private readonly kP = 0.5;
  private readonly kI = 0.1;
  private readonly kD = 0.2;

  constructor(agentId: string, deps: { oaa: OAAClient; broker: ThoughtBroker; mic: MICIndexer }) {
    this.agentId = agentId;
    this.oaa = deps.oaa;
    this.broker = deps.broker;
    this.mic = deps.mic;
  }

  async rebalance(): Promise<RebalanceAction> {
    const snapshot = await this.getMarketSnapshot();
    const action = this.computePIDAction(snapshot);

    await this.applyAction(action);
    await this.oaa.append('economy:rebalance:log', { snapshot, action });
    await this.broker.publish('economy.rebalanced', this.agentId, action);

    return action;
  }

  private computePIDAction(snapshot: MarketSnapshot): RebalanceAction {
    const error = snapshot.inflationRate - this.target;
    this.pidIntegral += error;
    const derivative = error - this.pidPrevError;
    this.pidPrevError = error;

    const output = this.kP * error + this.kI * this.pidIntegral + this.kD * derivative;

    if (Math.abs(output) < 0.1) {
      return { type: 'no_op', amount: 0, reason: 'within tolerance', timestamp: Date.now() };
    }

    if (output > 0) {
      // Inflation too high → burn MIC to reduce supply
      const amount = Math.min(output * 10, snapshot.circulatingSupply * 0.05);
      return { type: 'burn', amount, reason: `PID output=${output.toFixed(3)}, inflation=${snapshot.inflationRate.toFixed(2)}%`, timestamp: Date.now() };
    } else {
      // Inflation too low → mint MIC to stimulate
      const amount = Math.min(Math.abs(output) * 10, snapshot.totalSupply * 0.02);
      return { type: 'mint', amount, reason: `PID output=${output.toFixed(3)}, inflation=${snapshot.inflationRate.toFixed(2)}%`, timestamp: Date.now() };
    }
  }

  private async applyAction(action: RebalanceAction): Promise<void> {
    if (action.type === 'no_op') return;
    await this.mic.record({
      type: action.type === 'mint' ? 'earn' : 'burn',
      agentId: this.agentId,
      amount: action.amount,
      reason: action.reason,
    });
  }

  private async getMarketSnapshot(): Promise<MarketSnapshot> {
    const raw = await this.oaa.get('economy:market:snapshot');
    if (raw) return JSON.parse(raw) as MarketSnapshot;

    // Bootstrap with defaults
    return {
      totalSupply: 1_000_000,
      circulatingSupply: 750_000,
      priceIndex: 1.0,
      inflationRate: 2.0,
      timestamp: Date.now(),
    };
  }

  async updateMarketSnapshot(snapshot: MarketSnapshot): Promise<void> {
    await this.oaa.set('economy:market:snapshot', JSON.stringify(snapshot));
  }

  async getRebalanceHistory(limit = 20): Promise<{ snapshot: MarketSnapshot; action: RebalanceAction }[]> {
    const raw = await this.oaa.get('economy:rebalance:log');
    if (!raw) return [];
    const all = JSON.parse(raw) as { snapshot: MarketSnapshot; action: RebalanceAction }[];
    return all.slice(-limit);
  }
}
