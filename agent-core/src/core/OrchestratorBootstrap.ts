/**
 * PR-019 · OrchestratorBootstrap
 * Main application entry point. Wires all SWARM-18 subsystems together,
 * manages the 24/7 lifecycle, and provides structured health reports.
 */
import { EventEmitter } from 'events';
import { OAAClient } from '../oaa/OAAClient';
import { SwarmOrchestrator } from '../agents/SwarmOrchestrator';
import { WallClockScheduler } from '../scheduler/WallClockScheduler';
import { HiveSubstrateBridge } from '../bridge/HiveSubstrateBridge';
import { CivicDAO } from '../governance/CivicDAO';
import { SentinelCore } from '../sentinel/SentinelCore';
import { DVA } from '../integrity/DVA';
import { OperatorTruth, PHASE_A_EXPERIMENTAL } from '../integrity/OperatorTruth';
import { ThoughtBroker } from '../substrate/ThoughtBroker';
import { GIAggregator } from '../substrate/GIAggregator';
import { MICIndexer } from '../substrate/MICIndexer';
import { CitizenShield } from '../security/CitizenShield';
import { WorldArchitect } from '../agents/WorldArchitect';
import { EconomyArchitect } from '../agents/EconomyArchitect';
import { LoreWeaver } from '../agents/LoreWeaver';
import { CodeSynthetic } from '../agents/CodeSynthetic';
import { Reflections } from '../agents/Reflections';
import { JADE } from '../jade/JADE';

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'critical';
  uptime: number;
  phaseA: boolean;
  components: Record<string, { status: 'ok' | 'degraded' | 'error'; lastCheck: number }>;
  metrics: {
    agentsActive: number;
    tasksCompleted: number;
    proposalsPending: number;
    anomalies: number;
    violations: number;
    gi: number;
    deniedAttestations: number;
  };
}

export class OrchestratorBootstrap extends EventEmitter {
  // Subsystems
  readonly oaa: OAAClient;
  readonly broker: ThoughtBroker;
  readonly giAggregator: GIAggregator;
  readonly micIndexer: MICIndexer;
  readonly dva: DVA;
  readonly operatorTruth: OperatorTruth;
  readonly shield: CitizenShield;
  readonly dao: CivicDAO;
  readonly swarm: SwarmOrchestrator;
  readonly scheduler: WallClockScheduler;
  readonly bridge: HiveSubstrateBridge;
  readonly sentinel: SentinelCore;

  // Domain agents
  readonly worldArchitect: WorldArchitect;
  readonly economyArchitect: EconomyArchitect;
  readonly loreWeaver: LoreWeaver;
  readonly codeSynthetic: CodeSynthetic;
  readonly reflections: Reflections;
  readonly jade: JADE;

  private startTime = 0;
  private isActive = false;
  private healthTimer: NodeJS.Timeout | null = null;

  constructor(config: {
    oaaDir?: string;
    hmacKey: string;
    dvKey: string;
    syncIntervalMs?: number;
    sentinelIntervalMs?: number;
    schedulerTickMs?: number;
  }) {
    super();

    this.oaa          = new OAAClient({ dir: config.oaaDir, hmacKey: config.hmacKey });
    this.broker       = new ThoughtBroker(this.oaa);
    this.giAggregator = new GIAggregator(this.oaa);
    this.micIndexer   = new MICIndexer(this.oaa);
    this.dva          = new DVA(this.oaa, config.dvKey);
    this.operatorTruth = new OperatorTruth(this.oaa, config.dvKey);
    this.shield       = new CitizenShield();
    this.dao          = new CivicDAO(this.oaa);
    this.swarm        = new SwarmOrchestrator({ oaa: this.oaa, broker: this.broker, dva: this.dva });
    this.scheduler    = new WallClockScheduler({ tickMs: config.schedulerTickMs });
    this.bridge       = new HiveSubstrateBridge({
      broker: this.broker,
      giAggregator: this.giAggregator,
      micIndexer: this.micIndexer,
      syncIntervalMs: config.syncIntervalMs,
    });
    this.sentinel     = new SentinelCore({
      oaa: this.oaa,
      dao: this.dao,
      swarm: this.swarm,
      checkIntervalMs: config.sentinelIntervalMs,
    });

    // Domain agents
    const common = { oaa: this.oaa, broker: this.broker, mic: this.micIndexer };
    this.worldArchitect   = new WorldArchitect('world-1', common);
    this.economyArchitect = new EconomyArchitect('econ-1', common);
    this.loreWeaver       = new LoreWeaver('lore-1', common);
    this.codeSynthetic    = new CodeSynthetic('code-1', {
      ...common, dva: this.dva, shield: this.shield, dao: this.dao,
    });
    this.reflections = new Reflections('reflections-1', { oaa: this.oaa, broker: this.broker });
    this.jade        = new JADE('jade-1', { oaa: this.oaa, broker: this.broker });
  }

  async initialize(): Promise<void> {
    this.emit('bootstrap:initializing');

    const integrity = await this.oaa.verifyIntegrity();
    if (!integrity.valid) {
      this.emit('bootstrap:integrity_warning', integrity.corrupted);
    }

    await this.dao.loadProposals();
    await this.spawnSwarm();
    this.registerScheduledTasks();

    this.scheduler.start();
    this.bridge.start();
    this.sentinel.start();

    this.startTime = Date.now();
    this.isActive  = true;

    if (PHASE_A_EXPERIMENTAL) {
      this.emit('bootstrap:phase_a_warning', {
        message: 'SWARM-18 running in PHASE A (experimental substrate). ' +
          'code_mutation and governance_mutation actions are blocked. ' +
          'Complete Phase B hardening before connecting live civic continuity.',
      });
    }

    // Heartbeat health check every 30s
    this.healthTimer = setInterval(() => void this.healthCheck(), 30_000);
    this.emit('bootstrap:ready', { uptime: 0 });
  }

  private async spawnSwarm(): Promise<void> {
    const agents: Parameters<typeof this.swarm.spawnAgent>[0][] = [
      { id: 'world-1', domain: 'world',   subtype: 0, maxEnergy: 15, cooldownMs: 5_000  },
      { id: 'world-2', domain: 'world',   subtype: 1, maxEnergy: 15, cooldownMs: 5_000  },
      { id: 'world-3', domain: 'world',   subtype: 2, maxEnergy: 12, cooldownMs: 7_000  },
      { id: 'world-4', domain: 'world',   subtype: 3, maxEnergy: 12, cooldownMs: 7_000  },
      { id: 'code-1',  domain: 'code',    subtype: 0, maxEnergy: 12, cooldownMs: 10_000 },
      { id: 'code-2',  domain: 'code',    subtype: 1, maxEnergy: 12, cooldownMs: 10_000 },
      { id: 'code-3',  domain: 'code',    subtype: 2, maxEnergy: 10, cooldownMs: 12_000 },
      { id: 'code-4',  domain: 'code',    subtype: 3, maxEnergy: 10, cooldownMs: 12_000 },
      { id: 'econ-1',  domain: 'economy', subtype: 0, maxEnergy: 10, cooldownMs: 15_000 },
      { id: 'econ-2',  domain: 'economy', subtype: 1, maxEnergy: 10, cooldownMs: 15_000 },
      { id: 'econ-3',  domain: 'economy', subtype: 2, maxEnergy: 8,  cooldownMs: 20_000 },
      { id: 'econ-4',  domain: 'economy', subtype: 3, maxEnergy: 8,  cooldownMs: 20_000 },
      { id: 'lore-1',  domain: 'lore',    subtype: 0, maxEnergy: 14, cooldownMs: 8_000  },
      { id: 'lore-2',  domain: 'lore',    subtype: 1, maxEnergy: 14, cooldownMs: 8_000  },
      { id: 'lore-3',  domain: 'lore',    subtype: 2, maxEnergy: 12, cooldownMs: 10_000 },
      { id: 'lore-4',  domain: 'lore',    subtype: 3, maxEnergy: 12, cooldownMs: 10_000 },
    ];
    for (const a of agents) await this.swarm.spawnAgent(a);
    this.emit('bootstrap:swarm_ready', { count: agents.length });
  }

  private registerScheduledTasks(): void {
    // World evolution — every 15 minutes
    this.scheduler.schedule({
      id: 'world-evolution',
      cron: '*/15 * * * *',
      agentType: 'world',
      handler: async () => { await this.swarm.executeCycle(); },
      enabled: true,
    });

    // Economy rebalance — every 30 minutes
    this.scheduler.schedule({
      id: 'economy-rebalance',
      cron: '*/30 * * * *',
      agentType: 'economy',
      handler: async () => { await this.economyArchitect.rebalance(); },
      enabled: true,
    });

    // Lore generation — every hour (0 */1 * * *)
    this.scheduler.schedule({
      id: 'lore-generation',
      cron: '0 */1 * * *',
      agentType: 'lore',
      handler: async () => { await this.loreWeaver.generateQuestChain('governance'); },
      enabled: true,
    });

    // GI snapshot — every 5 seconds
    this.scheduler.schedule({
      id: 'gi-snapshot',
      cron: '*/5 * * * * *',
      agentType: 'system',
      handler: async () => { await this.giAggregator.persistSnapshot(); },
      enabled: true,
    });

    // Sentinel checks — every minute
    this.scheduler.schedule({
      id: 'sentinel-check',
      cron: '* * * * *',
      agentType: 'sentinel',
      handler: async () => { await this.sentinel.runChecks(); },
      enabled: true,
    });

    // Governance expiry reaper — every 30 minutes
    this.scheduler.schedule({
      id: 'governance-reap',
      cron: '*/30 * * * *',
      agentType: 'sentinel',
      handler: async () => {
        const reaped = await this.dao.reapExpired();
        if (reaped.length > 0) {
          this.emit('bootstrap:proposals_expired', { count: reaped.length });
        }
      },
      enabled: true,
    });
  }

  async healthCheck(): Promise<SystemHealth> {
    const components: SystemHealth['components'] = {};
    let degraded = false;

    // OAA
    try {
      const r = await this.oaa.verifyIntegrity();
      components['oaa'] = { status: r.valid ? 'ok' : 'error', lastCheck: Date.now() };
      if (!r.valid) degraded = true;
    } catch { components['oaa'] = { status: 'error', lastCheck: Date.now() }; degraded = true; }

    // Swarm
    const swarmStatus = this.swarm.getSwarmStatus();
    const swarmOk = swarmStatus.dead <= 2;
    components['swarm'] = { status: swarmOk ? 'ok' : 'degraded', lastCheck: Date.now() };
    if (!swarmOk) degraded = true;

    // Scheduler
    const schedulerOk = this.scheduler.isRunning();
    components['scheduler'] = { status: schedulerOk ? 'ok' : 'error', lastCheck: Date.now() };
    if (!schedulerOk) degraded = true;

    // Bridge
    components['bridge'] = { status: 'ok', lastCheck: Date.now() };

    const gi = this.giAggregator.computeGI().gi;
    const deniedAttestations = await this.operatorTruth.getDeniedCount();
    const health: SystemHealth = {
      status: degraded ? (gi < 0.4 ? 'critical' : 'degraded') : 'healthy',
      uptime: Date.now() - this.startTime,
      phaseA: PHASE_A_EXPERIMENTAL,
      components,
      metrics: {
        agentsActive:       swarmStatus.active,
        tasksCompleted:     swarmStatus.tasksCompleted,
        proposalsPending:   this.dao.listProposals('pending').length,
        anomalies:          this.sentinel.getAnomalies().length,
        violations:         this.shield.getViolations().length,
        gi,
        deniedAttestations,
      },
    };

    if (health.status !== 'healthy') this.emit('bootstrap:degraded', health);
    return health;
  }

  async shutdown(): Promise<void> {
    this.emit('bootstrap:shutting_down');
    this.isActive = false;
    if (this.healthTimer) { clearInterval(this.healthTimer); this.healthTimer = null; }
    this.scheduler.stop();
    this.bridge.stop();
    this.sentinel.stop();
    await this.oaa.set('system:last_shutdown', JSON.stringify({ timestamp: Date.now(), uptime: Date.now() - this.startTime }));
    this.emit('bootstrap:shutdown_complete', { uptime: Date.now() - this.startTime });
  }

  isHealthy(): boolean {
    return this.isActive;
  }
}
