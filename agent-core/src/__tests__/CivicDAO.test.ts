import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs/promises';
import { OAAClient } from '../oaa/OAAClient';
import { CivicDAO } from '../governance/CivicDAO';

function makeDAO(totalVoters = 4) {
  const dir = path.join(os.tmpdir(), `dao-test-${Date.now()}`);
  const oaa = new OAAClient({ dir, hmacKey: 'dao-test-hmac-key-padding!!!!!!' });
  return { dir, dao: new CivicDAO(oaa, { totalVoters }) };
}

describe('CivicDAO', () => {
  let dao: CivicDAO;
  let dir: string;

  beforeEach(() => {
    const o = makeDAO(4);
    dir = o.dir;
    dao = o.dao;
  });

  afterEach(async () => {
    await fs.rm(dir, { recursive: true, force: true });
  });

  it('creates a proposal and lists it as pending', async () => {
    const p = await dao.createProposal({ category: 'code', title: 'Fix bug', description: 'Fixes XYZ', proposedBy: 'code-1' });
    expect(p.status).toBe('pending');
    expect(p.threshold).toBe(0.51);
    expect(dao.listProposals('pending')).toHaveLength(1);
  });

  it('approves when threshold is reached', async () => {
    const p = await dao.createProposal({ category: 'code', title: 'T', description: 'D', proposedBy: 'code-1' });
    await dao.vote(p.id, 'agent-1', 'yes');
    await dao.vote(p.id, 'agent-2', 'yes');
    await dao.vote(p.id, 'agent-3', 'yes'); // 3/4 = 75% > 51%
    const updated = dao.getProposal(p.id);
    expect(updated?.status).toBe('approved');
  });

  it('rejects when no-votes make threshold unreachable', async () => {
    // economy threshold = 0.75 → needs ceil(0.75 × 4) = 3 yes votes.
    // After 2 no-votes: 0 yes + 2 remaining = 2 < 3 needed → early rejection.
    const p = await dao.createProposal({ category: 'economy', title: 'Mint 10k', description: 'D', proposedBy: 'econ-1' });
    await dao.vote(p.id, 'agent-1', 'no');
    await dao.vote(p.id, 'agent-2', 'no'); // 0 + 2 remaining = 2 < 3 needed
    expect(dao.getProposal(p.id)?.status).toBe('rejected');
  });

  it('executes an approved proposal', async () => {
    const p = await dao.createProposal({ category: 'code', title: 'T', description: 'D', proposedBy: 'code-1' });
    // Force approve by casting enough yes votes
    for (let i = 1; i <= 3; i++) await dao.vote(p.id, `voter-${i}`, 'yes');
    const executed = await dao.executeProposal(p.id, async () => ({ applied: true }));
    expect(executed.status).toBe('executed');
    expect(executed.result).toEqual({ applied: true });
  });

  it('applies world threshold (67%)', async () => {
    const p = await dao.createProposal({ category: 'world', title: 'New zone', description: 'D', proposedBy: 'world-1' });
    expect(p.threshold).toBe(0.67);
  });
});
