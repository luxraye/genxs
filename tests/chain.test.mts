import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { verifyChain, blockContent, GENESIS_PREVIOUS_HASH, type ChainBlock, type Sha256 } from '../packages/domain/chain.ts';

const sha256: Sha256 = (m: string) => createHash('sha256').update(m, 'utf8').digest('hex');

function makeChain(): ChainBlock[] {
  const blocks: ChainBlock[] = [];
  const events = ['GENESIS', 'DONATION_ACCEPTED', 'SEROLOGY_COMPLETED', 'QC_RELEASE'];
  for (let i = 0; i < events.length; i++) {
    const previousHash = i === 0 ? GENESIS_PREVIOUS_HASH : blocks[i - 1].hash;
    const body = {
      index: i, timestamp: `2026-01-0${i + 1}T00:00:00Z`, unitDIN: i === 0 ? 'GENESIS' : `W0423-26-89410${i}`,
      eventType: events[i],
      actor: { id: 'actor', role: 'LAB_TECH', facility: 'Example Lab', signature: '0xabc' },
      payload: { step: i }, previousHash
    };
    blocks.push({ ...body, hash: createHash('sha256').update(blockContent(body as any), 'utf8').digest('hex') });
  }
  return blocks;
}

test('chain: a well-formed chain verifies', async () => {
  const v = await verifyChain(makeChain(), sha256);
  assert.equal(v.isValid, true);
  assert.equal(v.blocks, 4);
});

test('chain: a tampered payload is detected', async () => {
  const c = makeChain();
  c[2] = { ...c[2], payload: { step: 999 } };
  const v = await verifyChain(c, sha256);
  assert.equal(v.isValid, false);
  assert.equal(v.brokenIndex, 2);
});

test('chain: a broken link is detected', async () => {
  const c = makeChain();
  c[3] = { ...c[3], previousHash: 'deadbeef' };
  const v = await verifyChain(c, sha256);
  assert.equal(v.isValid, false);
  assert.equal(v.brokenIndex, 3);
});

test('chain: a bad genesis is detected', async () => {
  const c = makeChain();
  c[0] = { ...c[0], previousHash: 'nope' };
  const v = await verifyChain(c, sha256);
  assert.equal(v.isValid, false);
  assert.equal(v.brokenIndex, 0);
});

test('chain: an empty chain is trivially valid', async () => {
  assert.equal((await verifyChain([], sha256)).isValid, true);
});
