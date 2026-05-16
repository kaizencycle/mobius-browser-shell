/**
 * PR-007 · SentinelCore
 * Multi-layer agent health monitoring. Watches swarm health, OAA integrity,
 * and governance metrics. Triggers automated responses for anomalies.
 */
import { EventEmitter } from 'events';
import { OAAClient } from '../oaa/OAAClient';
import { CivicDAO } from '../governance/CivicDAO';
import { SwarmOrchestrator } from '../agents/SwarmOrchestrator';

export type AnomalyType =
  | 'agent_dead'
  | 'integrity_violation'
  | 'governance_stall'
  | 'low_energy_swarm'
  | 'excessive_errors';

export interface Anomaly {
  id: string;
  type: AnomalyType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  detectedAt: number;
  resolved: boolean;
}

export class SentinelCore extends EventEmitter {
  private readonly oaa: OAAClient;
  private readonly dao: CivicDAO;
  private readonly swarm: SwarmOrchestrator;
  private anomalies: Anomaly[] = [];
  private timer: NodeJS.Timeout | null = null;
  private counter = 0;
  private readonly checkIntervalMs: number;

  constructor(deps: {
    oaa: OAAClient;
    dao: CivicDAO;
    swarm: SwarmOrchestrator;
    checkIntervalMs?: number;
  }) {
    super();
    this.oaa = deps.oaa;
    this.dao = deps.dao;
    this.swarm = deps.swarm;
    this.checkIntervalMs = deps.checkIntervalMs ?? 60_000;
  }

  start(): void {
    if (this.timer) return;
    this.timer = setInterval(() => void this.runChecks(), this.checkIntervalMs);
    this.emit('sentinel:started');
  }

  stop(): void {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
    this.emit('sentinel:stopped');
  }

  async runChecks(): Promise<Anomaly[]> {
    const detected: Anomaly[] = [];

    // 1. Check swarm health
    const status = this.swarm.getSwarmStatus();
    if (status.dead > 2) {
      detected.push(this.flag('agent_dead', 'critical',
        `${status.dead} agents are dead — swarm critically understaffed`));
    }
    if (status.active < 4) {
      detected.push(this.flag('low_energy_swarm', 'high',
        `Only ${status.active} active agents — consider energy restore`));
    }

    // 2. Check OAA integrity
    const integrity = await this.oaa.verifyIntegrity();
    if (!integrity.valid) {
      detected.push(this.flag('integrity_violation', 'critical',
        `OAA integrity violation on ${integrity.corrupted.length} key(s): ${integrity.corrupted.join(', ')}`));
    }

    // 3. Check governance health
    const pending = this.dao.listProposals('pending');
    const staleThresholdMs = 6 * 60 * 60 * 1000; // 6h
    const stale = pending.filter(p => Date.now() - p.createdAt > staleThresholdMs);
    if (stale.length > 3) {
      detected.push(this.flag('governance_stall', 'medium',
        `${stale.length} proposals stalled for over 6 hours — governance participation low`));
    }

    for (const anomaly of detected) {
      this.anomalies.push(anomaly);
      await this.oaa.append('sentinel:anomalies', anomaly);
      this.emit('sentinel:anomaly', anomaly);
    }

    return detected;
  }

  private flag(type: AnomalyType, severity: Anomaly['severity'], description: string): Anomaly {
    return {
      id: `anom-${++this.counter}`,
      type,
      severity,
      description,
      detectedAt: Date.now(),
      resolved: false,
    };
  }

  resolveAnomaly(id: string): void {
    const anomaly = this.anomalies.find(a => a.id === id);
    if (anomaly) {
      anomaly.resolved = true;
      this.emit('sentinel:resolved', anomaly);
    }
  }

  getAnomalies(resolved = false): Anomaly[] {
    return this.anomalies.filter(a => resolved || !a.resolved);
  }
}
