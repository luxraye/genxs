/**
 * The spine API contract, exercised for real.
 *
 * The router is mounted on an ephemeral port and driven over HTTP, because the
 * contract is what the five surfaces depend on — not the store's internals. The
 * rules worth testing here are the ones a surface could otherwise get wrong:
 * an illegal transition, a stale write, a self-verifying donor, a tier that
 * outruns its evidence, and an unprovisioned sign-in.
 */

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import express from 'express';
import { canTransition, UNIT_STATUSES } from '../packages/domain/stateMachine.ts';

// Point the store at a throwaway data file BEFORE it is imported, so a test run
// never reads or writes a developer's local state.
process.env.SPINE_DATA_FILE = join(tmpdir(), `spine-test-${process.pid}-${Date.now()}.json`);

const { spineRouter } = await import('../services/spine/server.ts');

const app = express();
app.use(express.json());
app.use('/api/spine', spineRouter);

let server: any;
let base = '';

const api = async (path: string, init: RequestInit = {}) => {
  const res = await fetch(`${base}/api/spine${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', 'x-spine-client': 'test-harness', ...(init.headers || {}) }
  });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : {} };
};

const post = (path: string, payload: unknown) =>
  api(path, { method: 'POST', body: JSON.stringify(payload) });

const patch = (path: string, payload: unknown) =>
  api(path, { method: 'PATCH', body: JSON.stringify(payload) });

// Filled in by the registration tests and used by the review tests, which run
// after them (node:test runs the tests in a file in order).
let donorId = '';
let documentId = '';

before(async () => {
  server = app.listen(0);
  await once(server, 'listening');
  base = `http://127.0.0.1:${(server.address() as any).port}`;
});

after(() => {
  server?.close();
});

// ── the shared world ─────────────────────────────────────────────────────────

test('health reports every collection in the shared world', async () => {
  const { status, body } = await api('/health');
  assert.equal(status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.service, 'bloodchain-spine');
  assert.ok(body.counts.units > 0, 'seeded units');
  assert.ok(body.counts.requests > 0, 'seeded requests');
  assert.ok(body.counts.staff > 0, 'seeded staff');
  assert.ok(body.counts.donors > 0, 'seeded donors');
  assert.ok(body.counts.blocks > 0, 'seeded chain');
  assert.equal(typeof body.rev, 'number');
});

test('the snapshot carries every collection the surfaces read', async () => {
  const { status, body } = await api('/snapshot');
  assert.equal(status, 200);
  for (const key of ['units', 'requests', 'issues', 'staff', 'donors', 'blocks']) {
    assert.ok(Array.isArray(body[key]), `${key} should be an array`);
  }
});

// ── the state machine, enforced where the writes land ───────────────────────

test('an illegal unit transition is refused with 422 and not stored', async () => {
  const { body: units } = await api('/units');
  const unit = units.units.find((u: any) =>
    UNIT_STATUSES.some(t => t !== u.status && !canTransition(u.status, t))
  );
  const target = UNIT_STATUSES.find(t => t !== unit.status && !canTransition(unit.status, t));

  const { status, body } = await patch(`/units/${encodeURIComponent(unit.din)}`, { status: target });
  assert.equal(status, 422);
  assert.match(body.error, /not permitted by the state machine/i);

  const { body: after } = await api(`/units/${encodeURIComponent(unit.din)}`);
  assert.equal(after.status, unit.status, 'the refused write must not have been stored');
});

test('a write to a DIN the register does not hold is a 404, never a silent create', async () => {
  const { status } = await patch('/units/W-DOES-NOT-EXIST', { volumeMl: 1 });
  assert.equal(status, 404);
});

test('optimistic concurrency: a stale write is refused with 409', async () => {
  const { body: units } = await api('/units');
  const unit = units.units[0];

  const first = await patch(`/units/${encodeURIComponent(unit.din)}`, { volumeMl: unit.volumeMl });
  assert.equal(first.status, 200);

  const stale = await patch(`/units/${encodeURIComponent(unit.din)}`, { volumeMl: 1, expectedRev: unit.rev });
  assert.equal(stale.status, 409);
  assert.match(stale.body.error, /has changed since you loaded it/);
  assert.ok(stale.body.error.includes(`rev ${unit.rev}`), 'the error names the revision the caller held');
});

test('telemetry: an excursion is decided by the service and raises one critical incident', async () => {
  const { body: units } = await api('/units');
  const unit = units.units[units.units.length - 2];
  const { body: before } = await api('/issues');

  const res = await post(`/units/${encodeURIComponent(unit.din)}/telemetry`, {
    temperatureCelsius: 12.5,
    locationName: 'test harness'
  });
  assert.equal(res.status, 200);
  assert.equal(res.body.breachDetected, true, 'this reading breached the stored range');
  assert.equal(res.body.unitCompromised, true, 'and the unit is compromised as a result');

  if (canTransition(unit.status, 'QUARANTINED')) {
    assert.equal(res.body.unit.status, 'QUARANTINED', 'a compromised unit is quarantined');
  }
  assert.equal(res.body.unit.telemetryLogs.length, unit.telemetryLogs.length + 1);

  const { body: after } = await api('/issues');
  assert.equal(after.issues.length, before.issues.length + 1, 'exactly one incident is raised');
  assert.equal(after.issues[0].severity, 'CRITICAL');
  assert.match(after.issues[0].affectedEntity, new RegExp(unit.din));
});

test('telemetry: a reading inside the stored range breaches nothing', async () => {
  const { body: units } = await api('/units');
  // A different unit from the excursion test: a unit that already logged a
  // breach stays compromised, and that must not be confused with this reading.
  const unit = units.units[units.units.length - 3];
  const { body: before } = await api('/issues');

  const res = await post(`/units/${encodeURIComponent(unit.din)}/telemetry`, {
    temperatureCelsius: (unit.storageTempRange.min + unit.storageTempRange.max) / 2
  });
  assert.equal(res.status, 200);
  assert.equal(res.body.breachDetected, false, 'a reading inside the stored range is not a breach');
  assert.equal(res.body.unitCompromised, false, 'and the unit is not compromised by it');

  const { body: after } = await api('/issues');
  assert.equal(after.issues.length, before.issues.length, 'no incident for a normal reading');
});

test('telemetry: a non-numeric reading is refused with 422', async () => {
  const { body: units } = await api('/units');
  const { status } = await post(`/units/${encodeURIComponent(units.units[0].din)}/telemetry`, {
    temperatureCelsius: 'cold'
  });
  assert.equal(status, 422);
});

// ── the donor register ───────────────────────────────────────────────────────

test('donors are readable, and the register is non-empty', async () => {
  const { status, body } = await api('/donors');
  assert.equal(status, 200);
  assert.ok(Array.isArray(body.donors));
  assert.ok(body.donors.length > 0);
  assert.ok(body.donors.every((d: any) => typeof d.tier === 'number'));
});

test('registration: a malformed form is refused field by field', async () => {
  const res = await post('/donors', {
    fullName: '   ',
    email: 'not-an-email',
    bloodType: 'AA+',
    nationalIdNumber: ''
  });

  assert.equal(res.status, 422);
  assert.match(res.body.error, /fullName is required/);
  assert.match(res.body.error, /email must be a valid address/);
  assert.match(res.body.error, /bloodType must be one of/);
  assert.match(res.body.error, /nationalIdNumber is required/);
});

test('registration: a new donor is stored at tier 1 with a service-computed hash', async () => {
  const res = await post('/donors', {
    fullName: 'Harness Donor',
    email: `harness-${Date.now()}@example.bw`,
    bloodType: 'O+',
    nationalIdNumber: 'HARNESS-0001',
    cityDistrict: 'Gaborone',
    phone: '+267 000 0000'
  });

  assert.equal(res.status, 201);
  donorId = res.body.donor.id;
  assert.equal(res.body.donor.tier, 1);
  assert.match(res.body.donor.anonymizedHash, /^[0-9a-f]{64}$/, 'a sha-256 digest, not a client value');
  assert.equal(res.body.donor.uploadedDocuments.length, 0);
  assert.equal(res.body.donor.eligibilityStatus, 'ELIGIBLE');
});

test('registration: a caller cannot self-verify by sending a tier or a hash', async () => {
  const res = await post('/donors', {
    fullName: 'Impatient Donor',
    email: `harness-selfverify-${Date.now()}@example.bw`,
    bloodType: 'A-',
    nationalIdNumber: 'HARNESS-0002',
    tier: 4,
    anonymizedHash: 'i-am-already-verified',
    totalDonations: 99,
    linkedUnitDins: ['W-FAKE']
  });

  assert.equal(res.status, 201);
  assert.equal(res.body.donor.tier, 1, 'the tier is the service\'s to decide');
  assert.notEqual(res.body.donor.anonymizedHash, 'i-am-already-verified');
  assert.equal(res.body.donor.totalDonations, 0);
  assert.deepEqual(res.body.donor.linkedUnitDins, []);
});

test('registration: the same address cannot register twice', async () => {
  const email = `harness-dupe-${Date.now()}@example.bw`;
  const payload = { fullName: 'First Donor', email, bloodType: 'B+', nationalIdNumber: 'HARNESS-0003' };

  const first = await post('/donors', payload);
  assert.equal(first.status, 201);

  const second = await post('/donors', { ...payload, fullName: 'Second Donor', nationalIdNumber: 'HARNESS-0004' });
  assert.equal(second.status, 409);
  assert.match(second.body.error, /already registered/);
});

test('a profile patch cannot reach the fields the service owns', async () => {
  const res = await patch(`/donors/${encodeURIComponent(donorId)}`, {
    fullName: 'Harness Donor (renamed)',
    tier: 4,
    anonymizedHash: 'overwritten',
    eligibilityStatus: 'DEFERRED',
    totalDonations: 42
  });

  assert.equal(res.status, 200);
  assert.equal(res.body.donor.fullName, 'Harness Donor (renamed)', 'an allowed field is applied');
  assert.equal(res.body.donor.tier, 1, 'tier is untouched');
  assert.notEqual(res.body.donor.anonymizedHash, 'overwritten');
  assert.equal(res.body.donor.eligibilityStatus, 'ELIGIBLE', 'eligibility is the national service\'s call');
  assert.equal(res.body.donor.totalDonations, 0);
});

test('submitting a document records PENDING and advances nothing', async () => {
  const res = await post(`/donors/${encodeURIComponent(donorId)}/documents`, {
    name: 'National ID card',
    type: 'NATIONAL_ID',
    sizeKb: 240,
    status: 'APPROVED'
  });

  assert.equal(res.status, 201);
  documentId = res.body.document.id;
  assert.equal(res.body.document.status, 'PENDING', 'a submission is not a decision');
  assert.equal(res.body.donor.tier, 1, 'the tier does not move on submission');
});

test('submitting an unknown document type is refused with 422', async () => {
  const { status } = await post(`/donors/${encodeURIComponent(donorId)}/documents`, {
    name: 'A note from a friend',
    type: 'HANDWRITTEN_LETTER'
  });
  assert.equal(status, 422);
});

test('adjudication: a non-operations role is refused with 403', async () => {
  const res = await post(`/donors/${encodeURIComponent(donorId)}/review`, {
    docId: documentId,
    decision: 'APPROVED',
    notes: 'looks fine to me',
    actor: { id: 'HARNESS-LAB', role: 'LAB_TECH' }
  });

  assert.equal(res.status, 403);
  assert.match(res.body.error, /operations decision/);
});

test('adjudication: a donor may not adjudicate even their own document', async () => {
  const res = await post(`/donors/${encodeURIComponent(donorId)}/review`, {
    docId: documentId,
    decision: 'APPROVED',
    actor: { id: donorId, role: 'DONOR' }
  });

  assert.equal(res.status, 403);
});

test('adjudication: PENDING is a state, not a decision', async () => {
  const { status, body } = await post(`/donors/${encodeURIComponent(donorId)}/review`, {
    docId: documentId,
    decision: 'PENDING',
    actor: { id: 'OPS-1', role: 'NATIONAL_OPERATOR' }
  });

  assert.equal(status, 422);
  assert.match(body.error, /APPROVED or REJECTED/);
});

test('adjudication: an unknown document is a 404', async () => {
  const { status } = await post(`/donors/${encodeURIComponent(donorId)}/review`, {
    docId: 'DOC-NOT-A-DOCUMENT',
    decision: 'APPROVED',
    actor: { id: 'OPS-1', role: 'NATIONAL_OPERATOR' }
  });
  assert.equal(status, 404);
});

test('adjudication: approval records the reviewer and moves the tier to the evidence', async () => {
  const approved = await post(`/donors/${encodeURIComponent(donorId)}/review`, {
    docId: documentId,
    decision: 'APPROVED',
    notes: 'Identity confirmed against the presented card.',
    actor: { id: 'OPS-1', role: 'NATIONAL_OPERATOR' }
  });

  assert.equal(approved.status, 200);
  assert.equal(approved.body.document.status, 'APPROVED');
  assert.equal(approved.body.document.reviewedBy, 'OPS-1');
  assert.equal(approved.body.donor.tier, 2, 'a reviewed national ID is tier 2');

  // One clinical record on top is tier 3; both are tier 4.
  for (const [type, expectedTier] of [['MEDICAL_CLEARANCE', 3], ['SEROLOGY_RECORD', 4]] as const) {
    const submitted = await post(`/donors/${encodeURIComponent(donorId)}/documents`, {
      name: `${type} record`,
      type,
      sizeKb: 90
    });
    assert.equal(submitted.status, 201);

    const reviewed = await post(`/donors/${encodeURIComponent(donorId)}/review`, {
      docId: submitted.body.document.id,
      decision: 'APPROVED',
      notes: 'Reviewed.',
      actor: { id: 'OPS-1', role: 'NATIONAL_OPERATOR' }
    });
    assert.equal(reviewed.status, 200);
    assert.equal(reviewed.body.donor.tier, expectedTier, `${type} approved → tier ${expectedTier}`);
  }
});

test('a tier may never be raised past the evidence', async () => {
  const fresh = await post('/donors', {
    fullName: 'Unverified Donor',
    email: `harness-ceiling-${Date.now()}@example.bw`,
    bloodType: 'AB+',
    nationalIdNumber: 'HARNESS-0005'
  });
  assert.equal(fresh.status, 201);
  const id = fresh.body.donor.id;

  const inflated = await patch(`/donors/${encodeURIComponent(id)}/tier`, {
    tier: 4,
    actor: { id: 'OPS-1', role: 'NATIONAL_OPERATOR' }
  });

  assert.equal(inflated.status, 200);
  assert.equal(inflated.body.donor.tier, 1, 'no approved document justifies anything above tier 1');
});

test('a non-operations role cannot set a tier at all', async () => {
  const { status } = await patch(`/donors/${encodeURIComponent(donorId)}/tier`, {
    tier: 2,
    actor: { id: 'HARNESS-AUDIT', role: 'AUDITOR' }
  });
  assert.equal(status, 403);
});

test('a tier value outside 1-4 is refused with 422', async () => {
  const { status } = await patch(`/donors/${encodeURIComponent(donorId)}/tier`, {
    tier: 9,
    actor: { id: 'OPS-1', role: 'NATIONAL_OPERATOR' }
  });
  assert.equal(status, 422);
});

test('a donor write to an unknown id is a 404', async () => {
  const { status } = await post('/donors/DONOR-NOT-REAL/documents', { name: 'x', type: 'NATIONAL_ID' });
  assert.equal(status, 404);
});

// ── staff and sign-in ────────────────────────────────────────────────────────

test('sign-in refuses an address that was never provisioned', async () => {
  const { status, body } = await post('/auth/login', { email: 'nobody@example.bw' });
  assert.equal(status, 403);
  assert.match(body.error, /provisioned/);
});

test('sign-in issues a session for a provisioned account', async () => {
  const { body: staff } = await api('/staff');
  const account = staff.staff.find((s: any) => s.status !== 'SUSPENDED');

  const { status, body } = await post('/auth/login', { email: account.email });
  assert.equal(status, 200);
  assert.equal(body.staff.id, account.id);
  assert.ok(body.session.id, 'a session id is issued');
});

test('provisioning refuses a duplicate address', async () => {
  const { body: staff } = await api('/staff');
  const existing = staff.staff[0];

  const { status, body } = await post('/staff', {
    fullName: 'Duplicate Operator',
    email: existing.email,
    role: 'NATIONAL_OPERATOR',
    facility: 'Test'
  });

  assert.equal(status, 409);
  assert.match(body.error, /already exists/);
});

// ── the assurance log ────────────────────────────────────────────────────────

test('the sealed chain verifies, and an appended block keeps it valid', async () => {
  const before = await api('/chain');
  assert.equal(before.body.verdict.isValid, true, 'a freshly seeded chain must be genuine, not illustrative');
  assert.ok(before.body.blocks.length > 0);

  const { body: units } = await api('/units');
  const appended = await post(`/units/${encodeURIComponent(units.units[0].din)}/events`, {
    eventType: 'COLD_CHAIN_BREACH_DETECTED',
    actor: { id: 'Harness Technician', role: 'LAB_TECH', facility: 'Test bench' },
    payload: { note: 'appended by the API contract test', hash: 'client-supplied-hash' }
  });

  assert.equal(appended.status, 201);
  assert.notEqual(appended.body.block.hash, 'client-supplied-hash', 'the digest is computed by the service');

  const after = await api('/chain');
  assert.equal(after.body.blocks.length, before.body.blocks.length + 1);
  assert.equal(after.body.verdict.isValid, true, 'appending must not break the chain');
});

test('an event without an actor is refused with 422', async () => {
  const { body: units } = await api('/units');
  const { status } = await post(`/units/${encodeURIComponent(units.units[0].din)}/events`, {
    eventType: 'COLD_CHAIN_BREACH_DETECTED'
  });
  assert.equal(status, 422);
});
