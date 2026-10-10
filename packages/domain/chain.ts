/**
 * The audit chain. Pure, with the hash function injected.
 *
 * The chain is a local, hash-linked record of events. It is NOT a distributed
 * ledger and nothing leaves the deployment boundary. `verifyChain` is the
 * function that makes the UI's integrity claim true rather than asserted — it
 * recomputes every digest and checks every link.
 */

export interface ChainBlock {
  index: number;
  timestamp: string;
  unitDIN: string;
  eventType: string;
  actor: { id: string; role: string; facility: string; signature: string };
  payload: Record<string, unknown>;
  previousHash: string;
  hash: string;
}

export const GENESIS_PREVIOUS_HASH = '0'.repeat(64);

export type Sha256 = (message: string) => string | Promise<string>;

/**
 * Canonical serialisation. Key order is fixed by construction so that a hash is
 * reproducible across runtimes — sorting keys on the original object would do
 * the same, but this makes the contract explicit.
 */
export function blockContent(block: Omit<ChainBlock, 'hash'>): string {
  return JSON.stringify({
    index: block.index,
    timestamp: block.timestamp,
    unitDIN: block.unitDIN,
    eventType: block.eventType,
    actor: {
      id: block.actor.id,
      role: block.actor.role,
      facility: block.actor.facility,
      signature: block.actor.signature
    },
    payload: block.payload,
    previousHash: block.previousHash
  });
}

export function computeBlockHash(block: Omit<ChainBlock, 'hash'>, sha256: Sha256): string | Promise<string> {
  return sha256(blockContent(block));
}

export function verifyBlock(block: ChainBlock, sha256: Sha256): Promise<boolean> {
  return Promise.resolve(computeBlockHash(block, sha256)).then(h => h === block.hash);
}

export interface ChainVerdict {
  isValid: boolean;
  brokenIndex?: number;
  reason?: string;
  blocks: number;
}

/**
 * Recompute the whole chain. Returns the first fault found, or validity.
 * Used by the ledger view and by the test suite.
 */
export async function verifyChain(chain: ChainBlock[], sha256: Sha256): Promise<ChainVerdict> {
  for (let i = 0; i < chain.length; i++) {
    const current = chain[i];

    if (i === 0) {
      if (current.previousHash !== GENESIS_PREVIOUS_HASH) {
        return { isValid: false, brokenIndex: 0, reason: 'Genesis block does not start from the zero hash.', blocks: chain.length };
      }
    } else if (current.previousHash !== chain[i - 1].hash) {
      return {
        isValid: false,
        brokenIndex: i,
        reason: `Link broken at block #${current.index}: its previous hash does not match block #${chain[i - 1].index}.`,
        blocks: chain.length
      };
    }

    if (!(await verifyBlock(current, sha256))) {
      return {
        isValid: false,
        brokenIndex: i,
        reason: `Digest mismatch at block #${current.index}: the recorded content does not produce the recorded hash.`,
        blocks: chain.length
      };
    }
  }

  return { isValid: true, blocks: chain.length };
}

/** SHA-256 via Web Crypto (browser and Node 18+). */
export const webSha256: Sha256 = async (message: string): Promise<string> => {
  const data = new TextEncoder().encode(message);
  const digest = await globalThis.crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};
