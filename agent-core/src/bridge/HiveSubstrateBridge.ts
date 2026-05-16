/**
 * PR-004 · HiveSubstrateBridge
 * Real-time world state synchronization between the HIVE game world
 * and the Mobius Substrate (GI Aggregator, MIC Indexer, Thought Broker).
 */
import { EventEmitter } from 'events';
import { ThoughtBroker } from '../substrate/ThoughtBroker';
import { GIAggregator, GISignal } from '../substrate/GIAggregator';
import { MICIndexer } from '../substrate/MICIndexer';

export interface HiveWorldState {
  cycle: string;
  npcCount: number;
  activeZones: string[];
  fogActive: boolean;
  fogSeverity: number;  // 0–1
  economicPressure: number; // 0–1
  playerCount: number;
  gi: number;
  vaultBalance: number;
  timestamp: number;
}

export class HiveSubstrateBridge extends EventEmitter {
  private readonly broker: ThoughtBroker;
  private readonly giAggregator: GIAggregator;
  private readonly micIndexer: MICIndexer;
  private timer: NodeJS.Timeout | null = null;
  private readonly syncIntervalMs: number;
  private lastState: HiveWorldState | null = null;
  private syncCount = 0;

  constructor(deps: {
    broker: ThoughtBroker;
    giAggregator: GIAggregator;
    micIndexer: MICIndexer;
    syncIntervalMs?: number;
  }) {
    super();
    this.broker = deps.broker;
    this.giAggregator = deps.giAggregator;
    this.micIndexer = deps.micIndexer;
    this.syncIntervalMs = deps.syncIntervalMs ?? 5000;
  }

  start(): void {
    if (this.timer) return;
    this.timer = setInterval(() => void this.syncCycle(), this.syncIntervalMs);
    this.emit('bridge:started');
  }

  stop(): void {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
    this.emit('bridge:stopped');
  }

  async syncCycle(): Promise<void> {
    const state = await this.fetchWorldState();
    if (!state) return;

    this.syncCount++;
    const changed = this.hasChanged(state);

    // Always ingest GI signal from world state
    const signal: GISignal = {
      domain: 'world',
      score: state.gi,
      weight: 0.25,
      timestamp: state.timestamp,
      agentId: 'hive-bridge',
    };
    this.giAggregator.ingestSignal(signal);

    if (changed) {
      // Economic signal
      this.giAggregator.ingestSignal({
        domain: 'economy',
        score: 1 - state.economicPressure,
        weight: 0.25,
        timestamp: state.timestamp,
        agentId: 'hive-bridge',
      });

      await this.broker.publish('hive.world.state', 'bridge', state);
      await this.micIndexer.index('hive.world.state', state);
      this.emit('bridge:state_synced', state);
    }

    this.lastState = state;
  }

  /** Fetch world state — in production this calls the HIVE HTTP API. */
  private async fetchWorldState(): Promise<HiveWorldState | null> {
    // Stub: returns a realistic default. In production, fetch from HIVE endpoint.
    return {
      cycle: 'C-313',
      npcCount: 8,
      activeZones: ['Citadel', 'Signal Obelisk', 'Echo Chamber'],
      fogActive: false,
      fogSeverity: 0.2,
      economicPressure: 0.15,
      playerCount: 0,
      gi: 0.95,
      vaultBalance: 24500,
      timestamp: Date.now(),
    };
  }

  private hasChanged(next: HiveWorldState): boolean {
    if (!this.lastState) return true;
    return (
      next.gi !== this.lastState.gi ||
      next.fogActive !== this.lastState.fogActive ||
      next.economicPressure !== this.lastState.economicPressure
    );
  }

  getLastState(): HiveWorldState | null {
    return this.lastState;
  }

  getSyncCount(): number {
    return this.syncCount;
  }
}
