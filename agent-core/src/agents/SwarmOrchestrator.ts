/**
 * PR-001 · SwarmOrchestrator
 * Core SWARM-18 agent lifecycle manager. Maintains 16 agents across
 * 4 domains (world/code/economy/lore) with 18-bit state registers.
 */
import { EventEmitter } from 'events';
import { OAAClient } from '../oaa/OAAClient';
import { ThoughtBroker } from '../substrate/ThoughtBroker';
import { DVA } from '../integrity/DVA';

export type AgentDomain = 'world' | 'code' | 'economy' | 'lore';
export type AgentTaskState =
  | 'idle'
  | 'planning'
  | 'executing'
  | 'reviewing'
  | 'blocked'
  | 'resting';

/**
 * 18-bit state register
 * [0-3]   agent class   (0–15)
 * [4-7]   current task  (0–15)
 * [8-11]  energy level  (0–15)
 * [12-15] reputation    (0–15)
 * [16-17] priority      (0–3)
 */
export interface Agent18BitState {
  raw: number; // 18-bit integer
  agentClass: number;
  taskState: number;
  energy: number;
  reputation: number;
  priority: number;
}

export interface AgentDescriptor {
  id: string;
  domain: AgentDomain;
  subtype: number;
  maxEnergy: number;
  cooldownMs: number;
}

export interface AgentRuntime extends AgentDescriptor {
  state: Agent18BitState;
  taskState: AgentTaskState;
  lastActionAt: number;
  actionsCompleted: number;
  errors: number;
  alive: boolean;
}

const TASK_STATE_MAP: Record<AgentTaskState, number> = {
  idle: 0, planning: 1, executing: 2, reviewing: 3,
  blocked: 4, resting: 5,
};

const DOMAIN_CLASS_MAP: Record<AgentDomain, number> = {
  world: 0, code: 4, economy: 8, lore: 12,
};

function encodeState(agent: AgentRuntime): number {
  return (
    (agent.state.agentClass & 0xf) |
    ((TASK_STATE_MAP[agent.taskState] & 0xf) << 4) |
    ((agent.state.energy & 0xf) << 8) |
    ((agent.state.reputation & 0xf) << 12) |
    ((agent.state.priority & 0x3) << 16)
  );
}

function decodeState(raw: number): Agent18BitState {
  return {
    raw,
    agentClass:  raw & 0xf,
    taskState:   (raw >> 4) & 0xf,
    energy:      (raw >> 8) & 0xf,
    reputation:  (raw >> 12) & 0xf,
    priority:    (raw >> 16) & 0x3,
  };
}

export class SwarmOrchestrator extends EventEmitter {
  private readonly oaa: OAAClient;
  private readonly broker: ThoughtBroker;
  private readonly dva: DVA;
  private agents: Map<string, AgentRuntime> = new Map();
  private cycleCount = 0;

  constructor(deps: { oaa: OAAClient; broker: ThoughtBroker; dva: DVA }) {
    super();
    this.oaa = deps.oaa;
    this.broker = deps.broker;
    this.dva = deps.dva;
  }

  async spawnAgent(desc: AgentDescriptor): Promise<AgentRuntime> {
    const agentClass = DOMAIN_CLASS_MAP[desc.domain] + desc.subtype;
    const initial18bit = agentClass | (desc.maxEnergy << 8) | (0x8 << 12); // reputation=8 default
    const runtime: AgentRuntime = {
      ...desc,
      state: decodeState(initial18bit),
      taskState: 'idle',
      lastActionAt: Date.now(),
      actionsCompleted: 0,
      errors: 0,
      alive: true,
    };

    this.agents.set(desc.id, runtime);
    await this.persistAgent(runtime);
    await this.broker.publish(`swarm.agent.spawned`, 'orchestrator', { agentId: desc.id, domain: desc.domain });
    await this.dva.record('orchestrator', 'spawn_agent', { agentId: desc.id });
    this.emit('agent:spawned', runtime);
    return runtime;
  }

  async killAgent(agentId: string, reason: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) return;
    agent.alive = false;
    agent.taskState = 'idle';
    await this.persistAgent(agent);
    await this.broker.publish(`swarm.agent.killed`, 'orchestrator', { agentId, reason });
    this.emit('agent:killed', { agentId, reason });
  }

  async setTaskState(agentId: string, taskState: AgentTaskState): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) throw new Error(`Agent "${agentId}" not found`);
    agent.taskState = taskState;
    agent.state.raw = encodeState(agent);
    agent.lastActionAt = Date.now();
    await this.persistAgent(agent);
    this.emit('agent:state_changed', { agentId, taskState });
  }

  async drainEnergy(agentId: string, amount = 1): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) return;
    agent.state.energy = Math.max(0, agent.state.energy - amount);
    if (agent.state.energy === 0) {
      await this.setTaskState(agentId, 'resting');
    }
    await this.persistAgent(agent);
  }

  async restoreEnergy(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) return;
    agent.state.energy = agent.maxEnergy;
    agent.state.raw = encodeState(agent);
    await this.persistAgent(agent);
  }

  async adjustReputation(agentId: string, delta: number): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) return;
    agent.state.reputation = Math.max(0, Math.min(15, agent.state.reputation + delta));
    agent.state.raw = encodeState(agent);
    await this.persistAgent(agent);
    await this.broker.publish('swarm.reputation.changed', 'orchestrator', { agentId, reputation: agent.state.reputation });
  }

  async executeCycle(): Promise<{ processed: number; errors: number }> {
    this.cycleCount++;
    let processed = 0;
    let errors = 0;

    const eligible = [...this.agents.values()].filter(a =>
      a.alive &&
      a.taskState !== 'resting' &&
      a.state.energy > 0 &&
      Date.now() - a.lastActionAt >= a.cooldownMs
    );

    for (const agent of eligible) {
      try {
        await this.setTaskState(agent.id, 'executing');
        await this.drainEnergy(agent.id, 1);
        agent.actionsCompleted++;
        await this.setTaskState(agent.id, 'idle');
        processed++;
      } catch (err) {
        agent.errors++;
        errors++;
        await this.setTaskState(agent.id, 'idle');
        this.emit('agent:error', { agentId: agent.id, error: err });
      }
    }

    await this.broker.publish('swarm.cycle.complete', 'orchestrator', {
      cycle: this.cycleCount,
      processed,
      errors,
    });

    this.emit('cycle:complete', { cycle: this.cycleCount, processed, errors });
    return { processed, errors };
  }

  getAgent(id: string): AgentRuntime | undefined {
    return this.agents.get(id);
  }

  getAgents(domain?: AgentDomain): AgentRuntime[] {
    const all = [...this.agents.values()];
    return domain ? all.filter(a => a.domain === domain) : all;
  }

  getSwarmStatus(): { active: number; resting: number; dead: number; tasksCompleted: number } {
    const all = [...this.agents.values()];
    return {
      active:         all.filter(a => a.alive && a.taskState !== 'resting').length,
      resting:        all.filter(a => a.alive && a.taskState === 'resting').length,
      dead:           all.filter(a => !a.alive).length,
      tasksCompleted: all.reduce((s, a) => s + a.actionsCompleted, 0),
    };
  }

  export18bitState(): number[] {
    return [...this.agents.values()].map(a => a.state.raw);
  }

  private async persistAgent(agent: AgentRuntime): Promise<void> {
    await this.oaa.set(`swarm:agent:${agent.id}`, JSON.stringify(agent));
  }
}

// Re-export decoder for external use
export { decodeState, encodeState };
