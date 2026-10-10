/**
 * The spine — single source of truth for the demonstration platform.
 *
 * Every surface reads and writes units, requests, issues and staff through this
 * store. It is deliberately NOT a distributed system: one process, one copy of
 * state, one place where the state machine is enforced.
 *
 * The store validates every transition against packages/domain. A surface can
 * therefore not invent a status the state machine does not permit, which is what
 * makes the five consoles agree.
 */

import { createHash, randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { canTransition, isUnitStatus, type UnitStatus } from '../../packages/domain/stateMachine.js';
import { summariseExcursions } from '../../packages/domain/telemetry.js';
import {
  INITIAL_UNITS,
  INITIAL_HOSPITAL_REQUESTS,
  INITIAL_SYSTEM_ISSUES,
  INITIAL_STAFF_ACCOUNTS,
  INITIAL_BLOCKS,
  INITIAL_DONORS
} from '../../src/data/seedData.js';
import type { BloodUnit, BlockchainBlock, HospitalRequest, StaffAccount, SystemIssue, DonorProfile } from '../../src/types/bloodchain';

export type SpineEventType =
  | 'unit.updated'
  | 'unit.created'
  | 'request.created'
  | 'request.updated'
  | 'issue.created'
  | 'issue.updated'
  | 'staff.updated'
  | 'block.appended'
  | 'snapshot';

export interface SpineEvent {
  id: string;
  type: SpineEventType;
  din?: string;
  at: string;
  source?: string;
  summary?: string;
}

export interface UnitRecord extends BloodUnit {
  /** Monotonic revision for optimistic concurrency. */
  rev: number;
  updatedAt: string;
}

export interface SpineState {
  units: UnitRecord[];
  requests: HospitalRequest[];
  issues: SystemIssue[];
  staff: StaffAccount[];
  blocks: BlockchainBlock[];
  donors: DonorProfile[];
  rev: number;
}

export type PatchResult =
  | { ok: true; unit: UnitRecord }
  | { ok: false; status: 404 | 409 | 422; error: string; unit?: UnitRecord };

const sha256Hex = (message: string): string => createHash('sha256').update(message, 'utf8').digest('hex');

const DATA_FILE = process.env.SPINE_DATA_FILE || join(process.cwd(), '.spine-data', 'state.json');

/**
 * Re-apply the chain digests to a block list so that it actually chains.
 *
 * The seeded demonstration blocks ship with illustrative digests that do not
 * correspond to their content, so a freshly seeded chain would (correctly) fail
 * integrity. Sealing them at load makes the chain genuine, which is what makes
 * tamper detection meaningful: every later change breaks the digest, and the
 * ledger view can prove it.
 */
function sealChain(blocks: BlockchainBlock[]): BlockchainBlock[] {
  const out: BlockchainBlock[] = [];
  for (const b of blocks) {
    const prev = out[out.length - 1];
    const body = {
      index: b.index,
      timestamp: b.timestamp,
      unitDIN: b.unitDIN,
      eventType: b.eventType,
      actor: b.actor,
      payload: b.payload,
      previousHash: prev ? prev.hash : '0'.repeat(64)
    };
    out.push({ ...body, hash: sha256Hex(JSON.stringify(body)) } as BlockchainBlock);
  }
  return out;
}

export class SpineStore {
  private state: SpineState;
  private listeners = new Set<(e: SpineEvent) => void>();
  private saveTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.state = this.load();
  }

  // ── persistence ────────────────────────────────────────────────────────────

  private seed(): SpineState {
    return {
      units: INITIAL_UNITS.map(u => ({ ...u, rev: 1, updatedAt: new Date().toISOString() })),
      requests: [...INITIAL_HOSPITAL_REQUESTS],
      issues: [...INITIAL_SYSTEM_ISSUES],
      staff: [...INITIAL_STAFF_ACCOUNTS],
      blocks: sealChain(INITIAL_BLOCKS),
      donors: [...INITIAL_DONORS],
      rev: 1
    };
  }

  private load(): SpineState {
    try {
      if (existsSync(DATA_FILE)) {
        const parsed = JSON.parse(readFileSync(DATA_FILE, 'utf8')) as SpineState;
        if (parsed && Array.isArray(parsed.units) && parsed.units.length > 0) {
          console.log(`[spine] loaded ${parsed.units.length} units from ${DATA_FILE}`);
          return parsed;
        }
      }
    } catch (err: any) {
      console.warn('[spine] could not read data file, seeding fresh:', err.message);
    }
    return this.seed();
  }

  private save(): void {
    if (this.saveTimer) return;
    this.saveTimer = setTimeout(() => {
      this.saveTimer = null;
      try {
        mkdirSync(dirname(DATA_FILE), { recursive: true });
        writeFileSync(DATA_FILE, JSON.stringify(this.state, null, 2), 'utf8');
      } catch (err: any) {
        // Persistence is best-effort; the service stays correct in memory.
        console.warn('[spine] could not persist state:', err.message);
      }
    }, 250);
  }

  // ── events ─────────────────────────────────────────────────────────────────

  subscribe(fn: (e: SpineEvent) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit(event: Omit<SpineEvent, 'id' | 'at'>): void {
    const full: SpineEvent = { ...event, id: randomUUID(), at: new Date().toISOString() };
    for (const fn of this.listeners) {
      try {
        fn(full);
      } catch {
        /* a broken subscriber must not stop the others */
      }
    }
  }

  // ── reads ──────────────────────────────────────────────────────────────────

  snapshot(): SpineState {
    return this.state;
  }

  getUnit(din: string): UnitRecord | undefined {
    return this.state.units.find(u => u.din === din);
  }

  // ── writes ─────────────────────────────────────────────────────────────────

  /**
   * Patch a unit. Refuses any status change the state machine does not permit,
   * and any write against a stale revision.
   */
  patchUnit(din: string, patch: Partial<BloodUnit>, opts: { expectedRev?: number; source?: string } = {}): PatchResult {
    const unit = this.getUnit(din);
    if (!unit) return { ok: false, status: 404, error: `No unit with DIN ${din}.` };

    if (opts.expectedRev !== undefined && opts.expectedRev !== unit.rev) {
      return {
        ok: false,
        status: 409,
        error: `Unit ${din} has changed since you loaded it (you had rev ${opts.expectedRev}, current is ${unit.rev}).`,
        unit
      };
    }

    if (patch.status !== undefined) {
      if (!isUnitStatus(patch.status)) {
        return { ok: false, status: 422, error: `"${patch.status}" is not a known unit status.` };
      }
      if (!canTransition(unit.status, patch.status)) {
        return {
          ok: false,
          status: 422,
          error: `A unit cannot move from ${unit.status} to ${patch.status}. This transition is not permitted by the state machine.`,
          unit
        };
      }
    }

    const updated: UnitRecord = {
      ...unit,
      ...patch,
      din: unit.din,
      rev: unit.rev + 1,
      updatedAt: new Date().toISOString()
    };

    this.state.units = this.state.units.map(u => (u.din === din ? updated : u));
    this.state.rev += 1;
    this.save();
    this.emit({
      type: 'unit.updated',
      din,
      source: opts.source,
      summary: patch.status && patch.status !== unit.status ? `${unit.status} → ${patch.status}` : `rev ${unit.rev} → ${updated.rev}`
    });

    return { ok: true, unit: updated };
  }

  /** Record a telemetry reading and apply the deterministic excursion verdict. */
  recordTelemetry(
    din: string,
    reading: { temperatureCelsius: number; locationName?: string; timestamp?: string },
    opts: { source?: string } = {}
  ): { ok: boolean; error?: string; breach?: boolean; unit?: UnitRecord } {
    const unit = this.getUnit(din);
    if (!unit) return { ok: false, error: `No unit with DIN ${din}.` };

    const point = {
      timestamp: reading.timestamp || new Date().toISOString(),
      temperatureCelsius: reading.temperatureCelsius,
      locationName: reading.locationName || 'unspecified',
      breachDetected: false
    };

    const verdict = summariseExcursions([...unit.telemetryLogs, point], unit.storageTempRange);
    point.breachDetected =
      reading.temperatureCelsius < unit.storageTempRange.min || reading.temperatureCelsius > unit.storageTempRange.max;

    const logs = [...unit.telemetryLogs, point];
    let status = unit.status;

    // A breach moves a released unit into quarantine, if the state machine allows it.
    if (verdict.compromised && canTransition(unit.status, 'QUARANTINED')) status = 'QUARANTINED';

    const updated: UnitRecord = { ...unit, telemetryLogs: logs, status, rev: unit.rev + 1, updatedAt: new Date().toISOString() };
    this.state.units = this.state.units.map(u => (u.din === din ? updated : u));
    this.state.rev += 1;

    if (verdict.compromised) {
      const issue: SystemIssue = {
        id: `INC-TEMP-${Date.now().toString(36).toUpperCase()}`,
        title: `Cold-chain excursion: ${reading.temperatureCelsius}°C on ${din}`,
        category: 'COLD_CHAIN_ALERT',
        severity: 'CRITICAL',
        status: 'OPEN',
        facility: `${unit.destinationHospital || unit.currentFacility} (in transit)`,
        affectedEntity: `Unit DIN: ${din}`,
        description: `Telemetry recorded ${reading.temperatureCelsius}°C, outside the stored range of ${unit.storageTempRange.min}–${unit.storageTempRange.max}°C. Worst reading ${verdict.worstCelsius}°C. Flagged for review before issue.`,
        timestamp: point.timestamp
      };
      this.state.issues = [issue, ...this.state.issues];
      this.emit({ type: 'issue.created', din, source: opts.source, summary: issue.title });
    }

    this.save();
    this.emit({ type: 'unit.updated', din, source: opts.source, summary: `telemetry ${reading.temperatureCelsius}°C` });
    return { ok: true, breach: verdict.compromised, unit: updated };
  }

  /** Append to the audit chain, computing the digest server-side. */
  appendBlock(
    din: string,
    eventType: BlockchainBlock['eventType'],
    actor: BlockchainBlock['actor'],
    payload: Record<string, unknown>
  ): BlockchainBlock {
    const prev = this.state.blocks[this.state.blocks.length - 1];
    const index = prev ? prev.index + 1 : 0;
    const timestamp = new Date().toISOString();
    const previousHash = prev ? prev.hash : '0'.repeat(64);

    const body = { index, timestamp, unitDIN: din, eventType, actor, payload, previousHash };
    const hash = sha256Hex(JSON.stringify(body));

    const block = { ...body, hash } as BlockchainBlock;
    this.state.blocks = [...this.state.blocks, block];
    this.state.rev += 1;
    this.save();
    this.emit({ type: 'block.appended', din, summary: `#${index} ${eventType}` });
    return block;
  }

  createRequest(req: HospitalRequest): HospitalRequest {
    this.state.requests = [req, ...this.state.requests];
    this.state.rev += 1;
    this.save();
    this.emit({ type: 'request.created', summary: req.id });
    return req;
  }

  updateRequest(id: string, patch: Partial<HospitalRequest>): HospitalRequest | undefined {
    const existing = this.state.requests.find(r => r.id === id);
    if (!existing) return undefined;
    const updated = { ...existing, ...patch, id: existing.id };
    this.state.requests = this.state.requests.map(r => (r.id === id ? updated : r));
    this.state.rev += 1;
    this.save();
    this.emit({ type: 'request.updated', summary: id });
    return updated;
  }

  createIssue(issue: SystemIssue): SystemIssue {
    this.state.issues = [issue, ...this.state.issues];
    this.state.rev += 1;
    this.save();
    this.emit({ type: 'issue.created', summary: issue.id });
    return issue;
  }

  updateIssue(id: string, patch: Partial<SystemIssue>): SystemIssue | undefined {
    const existing = this.state.issues.find(i => i.id === id);
    if (!existing) return undefined;
    const updated = { ...existing, ...patch, id: existing.id };
    this.state.issues = this.state.issues.map(i => (i.id === id ? updated : i));
    this.state.rev += 1;
    this.save();
    this.emit({ type: 'issue.updated', summary: id });
    return updated;
  }

  addStaff(account: StaffAccount): StaffAccount {
    this.state.staff = [...this.state.staff, account];
    this.state.rev += 1;
    this.save();
    this.emit({ type: 'staff.updated', summary: account.id });
    return account;
  }

  updateStaff(id: string, patch: Partial<StaffAccount>): StaffAccount | undefined {
    const existing = this.state.staff.find(s => s.id === id);
    if (!existing) return undefined;
    const updated = { ...existing, ...patch, id: existing.id };
    this.state.staff = this.state.staff.map(s => (s.id === id ? updated : s));
    this.state.rev += 1;
    this.save();
    this.emit({ type: 'staff.updated', summary: id });
    return updated;
  }

  /** Verify every digest and link in the audit chain. */
  verifyChain() {
    for (let i = 0; i < this.state.blocks.length; i++) {
      const b = this.state.blocks[i];
      const prev = this.state.blocks[i - 1];
      const expectedPrev = prev ? prev.hash : '0'.repeat(64);
      if (b.previousHash !== expectedPrev) {
        return { isValid: false, brokenIndex: i, reason: `Link broken at block #${b.index}.`, blocks: this.state.blocks.length };
      }
      const { hash, ...body } = b;
      const recomputed = sha256Hex(JSON.stringify(body));
      if (recomputed !== hash) {
        return { isValid: false, brokenIndex: i, reason: `Digest mismatch at block #${b.index}.`, blocks: this.state.blocks.length };
      }
    }
    return { isValid: true as const, blocks: this.state.blocks.length };
  }

  reset(): void {
    this.state = this.seed();
    this.save();
    this.emit({ type: 'snapshot', summary: 'state reset' });
  }
}

export const store = new SpineStore();
export { sha256Hex, isUnitStatus, type UnitStatus };
