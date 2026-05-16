import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs/promises';
import { OAAClient } from '../oaa/OAAClient';
import { ThoughtBroker } from '../substrate/ThoughtBroker';
import { DVA } from '../integrity/DVA';
import { SwarmOrchestrator } from '../agents/SwarmOrchestrator';

function makeOAA() {
  const dir = path.join(os.tmpdir(), `swarm-test-${Date.now()}`);
  return { dir, oaa: new OAAClient({ dir, hmacKey: 'swarm-test-key-padding!!!!!!!!' }) };
}

describe('SwarmOrchestrator', () => {
  let swarm: SwarmOrchestrator;
  let broker: ThoughtBroker;
  let dir: string;

  beforeEach(() => {
    const o = makeOAA();
    dir = o.dir;
    broker = new ThoughtBroker(o.oaa);
    const dva = new DVA(o.oaa, 'dva-key');
    swarm = new SwarmOrchestrator({ oaa: o.oaa, broker, dva });
  });

  afterEach(async () => {
    await fs.rm(dir, { recursive: true, force: true });
  });

  it('spawns an agent with correct initial state', async () => {
    const agent = await swarm.spawnAgent({ id: 'w1', domain: 'world', subtype: 0, maxEnergy: 10, cooldownMs: 0 });
    expect(agent.alive).toBe(true);
    expect(agent.domain).toBe('world');
    expect(agent.state.energy).toBe(10);
  });

  it('drains energy on executeCycle', async () => {
    await swarm.spawnAgent({ id: 'w1', domain: 'world', subtype: 0, maxEnergy: 15, cooldownMs: 0 });
    const { processed } = await swarm.executeCycle();
    expect(processed).toBe(1);
    const agent = swarm.getAgent('w1');
    expect(agent?.state.energy).toBeLessThan(15);
  });

  it('kills an agent correctly', async () => {
    await swarm.spawnAgent({ id: 'w2', domain: 'world', subtype: 1, maxEnergy: 10, cooldownMs: 0 });
    await swarm.killAgent('w2', 'test');
    const agent = swarm.getAgent('w2');
    expect(agent?.alive).toBe(false);
  });

  it('export18bitState returns array of 18-bit integers', async () => {
    await swarm.spawnAgent({ id: 'c1', domain: 'code', subtype: 0, maxEnergy: 12, cooldownMs: 0 });
    const states = swarm.export18bitState();
    expect(states.length).toBe(1);
    expect(states[0]).toBeLessThanOrEqual(0x3ffff); // 18 bits max
  });

  it('getSwarmStatus aggregates correctly', async () => {
    await swarm.spawnAgent({ id: 'e1', domain: 'economy', subtype: 0, maxEnergy: 8, cooldownMs: 0 });
    await swarm.spawnAgent({ id: 'e2', domain: 'economy', subtype: 1, maxEnergy: 8, cooldownMs: 0 });
    const status = swarm.getSwarmStatus();
    expect(status.active).toBe(2);
    expect(status.dead).toBe(0);
  });
});
