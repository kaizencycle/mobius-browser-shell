import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs/promises';
import { OAAClient } from '../oaa/OAAClient';

function tmpDir() {
  return path.join(os.tmpdir(), `oaa-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
}

describe('OAAClient', () => {
  let oaa: OAAClient;
  let dir: string;

  beforeEach(() => {
    dir = tmpDir();
    oaa = new OAAClient({ dir, hmacKey: 'test-hmac-key-32bytes-padding!!' });
  });

  afterEach(async () => {
    await fs.rm(dir, { recursive: true, force: true });
  });

  it('set and get a value', async () => {
    await oaa.set('key1', 'hello');
    const val = await oaa.get('key1');
    expect(val).toBe('hello');
  });

  it('returns null for missing key', async () => {
    const val = await oaa.get('nonexistent');
    expect(val).toBeNull();
  });

  it('detects tampering via HMAC', async () => {
    await oaa.set('tampered', 'original');
    // Manually corrupt the store
    const storePath = path.join(dir, 'OAA_MEMORY.json');
    const raw = JSON.parse(await fs.readFile(storePath, 'utf8'));
    raw['tampered'].value = 'corrupted';
    await fs.writeFile(storePath, JSON.stringify(raw));
    oaa.invalidateCache();
    await expect(oaa.get('tampered')).rejects.toThrow('integrity violation');
  });

  it('verifyIntegrity reports valid on clean store', async () => {
    await oaa.set('a', '1');
    await oaa.set('b', '2');
    const report = await oaa.verifyIntegrity();
    expect(report.valid).toBe(true);
    expect(report.totalKeys).toBe(2);
  });

  it('appends items and preserves order', async () => {
    await oaa.append('list', 'first');
    await oaa.append('list', 'second');
    const raw = await oaa.get('list');
    expect(JSON.parse(raw!)).toEqual(['first', 'second']);
  });

  it('deletes a key', async () => {
    await oaa.set('to-delete', 'value');
    await oaa.delete('to-delete');
    expect(await oaa.get('to-delete')).toBeNull();
  });

  it('lists keys with prefix', async () => {
    await oaa.set('agent:1', 'x');
    await oaa.set('agent:2', 'y');
    await oaa.set('other:3', 'z');
    const agentKeys = await oaa.keys('agent:');
    expect(agentKeys.sort()).toEqual(['agent:1', 'agent:2']);
  });
});
