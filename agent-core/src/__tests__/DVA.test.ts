import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs/promises';
import { OAAClient } from '../oaa/OAAClient';
import { DVA } from '../integrity/DVA';

describe('DVA', () => {
  let dva: DVA;
  let dir: string;

  beforeEach(() => {
    dir = path.join(os.tmpdir(), `dva-test-${Date.now()}`);
    const oaa = new OAAClient({ dir, hmacKey: 'dva-hmac-key-32bytes-padding!!!' });
    dva = new DVA(oaa, 'dva-signing-key');
  });

  afterEach(async () => {
    await fs.rm(dir, { recursive: true, force: true });
  });

  it('records and verifies a valid record', async () => {
    const record = await dva.record('agent-1', 'spawn_npc', { zone: 'Citadel' });
    expect(record.agentId).toBe('agent-1');
    expect(dva.verify(record).valid).toBe(true);
  });

  it('detects tampering of payload', async () => {
    const record = await dva.record('agent-1', 'spawn_npc', { zone: 'Citadel' });
    const tampered = { ...record, payload: { zone: 'Echo Chamber' } };
    expect(dva.verify(tampered).valid).toBe(false);
  });

  it('detects signature mismatch', async () => {
    const record = await dva.record('agent-1', 'action', {});
    const corrupted = { ...record, signature: 'bad-sig' };
    expect(dva.verify(corrupted).valid).toBe(false);
  });

  it('verifyChain passes for sequential records', async () => {
    await dva.record('agent-chain', 'step-1', {});
    await dva.record('agent-chain', 'step-2', {});
    await dva.record('agent-chain', 'step-3', {});
    const result = await dva.verifyChain('agent-chain');
    expect(result.valid).toBe(true);
  });
});
