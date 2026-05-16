import { CitizenShield } from '../security/CitizenShield';

describe('CitizenShield', () => {
  let shield: CitizenShield;

  beforeEach(() => {
    shield = new CitizenShield({ maxActionsPerMinute: 5 });
  });

  it('blocks unsafe code patterns', () => {
    const v = shield.scanCode('agent-1', 'process.exit(1)');
    expect(v).not.toBeNull();
    expect(v!.type).toBe('unsafe_code');
    expect(v!.severity).toBe('critical');
  });

  it('blocks eval()', () => {
    const v = shield.scanCode('agent-1', 'eval("bad code")');
    expect(v).not.toBeNull();
  });

  it('allows safe code', () => {
    const v = shield.scanCode('agent-1', 'const x = 1 + 2; console.warn(x);');
    expect(v).toBeNull();
  });

  it('enforces rate limiting', () => {
    for (let i = 0; i < 5; i++) shield.checkRateLimit('agent-2');
    const v = shield.checkRateLimit('agent-2'); // 6th
    expect(v).not.toBeNull();
    expect(v!.type).toBe('rate_limit');
  });

  it('allows authorized actions', () => {
    const v = shield.authorizeAction('agent-1', 'spawn_npc', ['spawn_npc', 'generate_terrain']);
    expect(v).toBeNull();
  });

  it('blocks unauthorized actions', () => {
    const v = shield.authorizeAction('agent-1', 'rm_rf', ['spawn_npc']);
    expect(v).not.toBeNull();
    expect(v!.type).toBe('unauthorized_action');
  });

  it('getViolations filters by agentId', () => {
    shield.scanCode('agent-a', 'eval()');
    shield.scanCode('agent-b', 'process.exit()');
    expect(shield.getViolations('agent-a')).toHaveLength(1);
    expect(shield.getViolations('agent-b')).toHaveLength(1);
  });
});
