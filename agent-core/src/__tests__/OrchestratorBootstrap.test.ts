import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs/promises';
import { OrchestratorBootstrap } from '../core/OrchestratorBootstrap';

describe('OrchestratorBootstrap', () => {
  let bootstrap: OrchestratorBootstrap;
  let dir: string;

  beforeEach(() => {
    dir = path.join(os.tmpdir(), `bootstrap-test-${Date.now()}`);
    bootstrap = new OrchestratorBootstrap({
      oaaDir:  dir,
      hmacKey: 'bootstrap-hmac-key-padding!!!!!!',
      dvKey:   'bootstrap-dva-key-padding!!!!!!!',
      schedulerTickMs: 10_000, // don't tick during tests
    });
  });

  afterEach(async () => {
    if (bootstrap.isHealthy()) await bootstrap.shutdown();
    await fs.rm(dir, { recursive: true, force: true });
  });

  it('initializes and reports healthy', async () => {
    await bootstrap.initialize();
    expect(bootstrap.isHealthy()).toBe(true);
    const health = await bootstrap.healthCheck();
    expect(health.status).toBe('healthy');
  });

  it('spawns 16 agents in the swarm', async () => {
    await bootstrap.initialize();
    const agents = bootstrap.swarm.getAgents();
    expect(agents).toHaveLength(16);
  });

  it('spawns agents across all 4 domains', async () => {
    await bootstrap.initialize();
    const domains = ['world', 'code', 'economy', 'lore'] as const;
    for (const domain of domains) {
      expect(bootstrap.swarm.getAgents(domain)).toHaveLength(4);
    }
  });

  it('shuts down cleanly', async () => {
    await bootstrap.initialize();
    await bootstrap.shutdown();
    expect(bootstrap.isHealthy()).toBe(false);
  });

  it('health metrics include agent count', async () => {
    await bootstrap.initialize();
    const health = await bootstrap.healthCheck();
    expect(health.metrics.agentsActive).toBeGreaterThan(0);
  });
});
