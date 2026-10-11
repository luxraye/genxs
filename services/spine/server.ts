/**
 * The spine API.
 *
 * Mounted by server.ts at /api/spine. Every surface talks to this instead of
 * keeping its own copy of the world. See services/spine/store.ts for the rules
 * and packages/domain for the state machine it enforces.
 *
 * Design notes
 *  - Reads are cheap and always allowed.
 *  - Writes are validated; an illegal transition is refused with 422, not stored.
 *  - Concurrency is optimistic: send `expectedRev` and a stale write gets 409.
 *  - /events is a Server-Sent Events stream so a change made in one surface is
 *    pushed to every other surface within a frame.
 */

import { Router, type Request, type Response } from 'express';
import { randomUUID } from 'node:crypto';
import { store, type SpineEvent } from './store.js';
import { isUnitStatus } from '../../packages/domain/stateMachine.js';
import { isDocumentType, isDonorTier, isReviewDecision } from '../../packages/domain/donor.js';
import type { BloodUnit, UserRole } from '../../src/types/bloodchain.js';

export const spineRouter = Router();

const nowIso = () => new Date().toISOString();
const clientId = (req: Request): string => (req.header('x-spine-client') || 'unknown').slice(0, 40);

// ── health ───────────────────────────────────────────────────────────────────

spineRouter.get('/health', (_req, res) => {
  const s = store.snapshot();
  res.json({
    ok: true,
    service: 'bloodchain-spine',
    rev: s.rev,
    counts: {
      units: s.units.length,
      requests: s.requests.length,
      issues: s.issues.length,
      staff: s.staff.length,
      donors: s.donors.length,
      blocks: s.blocks.length
    },
    at: nowIso()
  });
});

// ── snapshot ─────────────────────────────────────────────────────────────────

spineRouter.get('/snapshot', (_req, res) => {
  res.json(store.snapshot());
});

spineRouter.get('/units', (_req, res) => {
  res.json({ units: store.snapshot().units });
});

spineRouter.get('/units/:din', (req, res) => {
  const unit = store.getUnit(req.params.din);
  if (!unit) return res.status(404).json({ error: `No unit with DIN ${req.params.din}.` });
  res.json(unit);
});

// ── unit writes ──────────────────────────────────────────────────────────────

spineRouter.patch('/units/:din', (req, res) => {
  const { expectedRev, ...patch } = (req.body || {}) as Partial<BloodUnit> & { expectedRev?: number };
  const result = store.patchUnit(req.params.din, patch, { expectedRev, source: clientId(req) });

  if (!result.ok) {
    return res.status(result.status).json({ error: result.error, unit: result.unit });
  }
  res.json({ unit: result.unit });
});

/** Record a temperature reading. The excursion verdict is applied server-side. */
spineRouter.post('/units/:din/telemetry', (req, res) => {
  const { temperatureCelsius, locationName, timestamp } = (req.body || {}) as {
    temperatureCelsius?: number;
    locationName?: string;
    timestamp?: string;
  };

  if (typeof temperatureCelsius !== 'number' || Number.isNaN(temperatureCelsius)) {
    return res.status(422).json({ error: 'temperatureCelsius must be a number.' });
  }

  const result = store.recordTelemetry(
    req.params.din,
    { temperatureCelsius, locationName, timestamp },
    { source: clientId(req) }
  );

  if (!result.ok) return res.status(404).json({ error: result.error });
  res.json({
    unit: result.unit,
    breachDetected: result.breach,
    unitCompromised: result.compromised,
    quarantined: result.quarantined
  });
});

/** Append an audit entry. The digest is computed by the service, not the client. */
spineRouter.post('/units/:din/events', (req, res) => {
  const { eventType, actor, payload } = (req.body || {}) as {
    eventType?: string;
    actor?: any;
    payload?: Record<string, unknown>;
  };

  if (!eventType || !actor?.id) {
    return res.status(422).json({ error: 'eventType and actor.id are required.' });
  }

  const block = store.appendBlock(
    req.params.din,
    eventType as any,
    {
      id: String(actor.id).slice(0, 80),
      role: String(actor.role || 'UNKNOWN').slice(0, 40) as UserRole,
      facility: String(actor.facility || 'unspecified').slice(0, 120),
      signature: String(actor.signature || '0x0').slice(0, 130)
    },
    payload || {}
  );

  res.status(201).json({ block });
});

// ── requests ─────────────────────────────────────────────────────────────────

spineRouter.get('/requests', (_req, res) => res.json({ requests: store.snapshot().requests }));

spineRouter.post('/requests', (req, res) => {
  const body = req.body || {};
  if (!body.hospitalName || !body.bloodType) {
    return res.status(422).json({ error: 'hospitalName and bloodType are required.' });
  }
  const created = store.createRequest({
    id: body.id || `REQ-${Date.now().toString(36).toUpperCase()}`,
    hospitalName: body.hospitalName,
    department: body.department || 'unspecified',
    urgency: body.urgency || 'ROUTINE',
    bloodType: body.bloodType,
    componentType: body.componentType || 'PACKED_RED_CELLS',
    unitsNeeded: Number(body.unitsNeeded) || 1,
    status: 'PENDING',
    requestedAt: nowIso(),
    fulfilledUnitDins: []
  });
  res.status(201).json({ request: created });
});

spineRouter.patch('/requests/:id', (req, res) => {
  const updated = store.updateRequest(req.params.id, req.body || {});
  if (!updated) return res.status(404).json({ error: `No request ${req.params.id}.` });
  res.json({ request: updated });
});

// ── issues ───────────────────────────────────────────────────────────────────

spineRouter.get('/issues', (_req, res) => res.json({ issues: store.snapshot().issues }));

spineRouter.post('/issues', (req, res) => {
  const body = req.body || {};
  if (!body.title) return res.status(422).json({ error: 'title is required.' });
  const created = store.createIssue({
    id: body.id || `INC-${Date.now().toString(36).toUpperCase()}`,
    title: body.title,
    category: body.category || 'COLD_CHAIN_ALERT',
    severity: body.severity || 'MEDIUM',
    status: body.status || 'OPEN',
    facility: body.facility || 'unspecified',
    affectedEntity: body.affectedEntity || '',
    description: body.description || '',
    timestamp: nowIso()
  });
  res.status(201).json({ issue: created });
});

spineRouter.patch('/issues/:id', (req, res) => {
  const updated = store.updateIssue(req.params.id, req.body || {});
  if (!updated) return res.status(404).json({ error: `No issue ${req.params.id}.` });
  res.json({ issue: updated });
});

// ── staff (read + provision; there is no self-registration) ──────────────────

spineRouter.get('/staff', (_req, res) => res.json({ staff: store.snapshot().staff }));

spineRouter.post('/staff', (req, res) => {
  const body = req.body || {};
  if (!body.email || !body.role) return res.status(422).json({ error: 'email and role are required.' });
  const exists = store.snapshot().staff.some(s => s.email.toLowerCase() === String(body.email).toLowerCase());
  if (exists) return res.status(409).json({ error: 'An account with that email already exists.' });

  const account = store.addStaff({
    id: body.id || `STF-${Date.now().toString(36).toUpperCase()}`,
    email: String(body.email).toLowerCase(),
    fullName: body.fullName || String(body.email).split('@')[0],
    role: body.role as UserRole,
    facility: body.facility || 'unspecified',
    badgeNumber: body.badgeNumber || 'Not assigned',
    mustChangePassword: true,
    status: 'ACTIVE',
    createdAt: nowIso(),
    provisionedBy: body.provisionedBy || 'operations'
  } as any);

  res.status(201).json({ staff: account });
});

spineRouter.patch('/staff/:id', (req, res) => {
  const updated = store.updateStaff(req.params.id, req.body || {});
  if (!updated) return res.status(404).json({ error: `No account ${req.params.id}.` });
  res.json({ staff: updated });
});

/**
 * Sign-in. There is deliberately NO account creation here — an account exists
 * only if the operations console provisioned it. Self-registration into a
 * clinical console is an access-control defect.
 */
spineRouter.post('/auth/login', (req, res) => {
  const { email } = (req.body || {}) as { email?: string };
  if (!email) return res.status(422).json({ error: 'email is required.' });

  const account = store.snapshot().staff.find(s => s.email.toLowerCase() === String(email).toLowerCase());
  if (!account) {
    return res.status(403).json({
      error: 'No account is provisioned for that address. Ask an administrator to provision one.'
    });
  }
  if (account.status === 'SUSPENDED') {
    return res.status(403).json({ error: 'That account is suspended.' });
  }
  res.json({ staff: account, session: { id: randomUUID(), at: nowIso() } });
});

// ── donors ───────────────────────────────────────────────────────────────────
//
// The donor surface registers; only an operations role adjudicates. Registration
// and review are separate verbs for a reason: submitting evidence is not
// verification, and the endpoint that records a document never advances a tier.

spineRouter.get('/donors', (_req, res) => res.json({ donors: store.snapshot().donors }));

spineRouter.get('/donors/:id', (req, res) => {
  const donor = store.getDonor(req.params.id);
  if (!donor) return res.status(404).json({ error: `No donor ${req.params.id}.` });
  res.json({ donor });
});

spineRouter.post('/donors', (req, res) => {
  const body = req.body || {};
  const result = store.registerDonor(
    {
      fullName: body.fullName,
      email: body.email,
      bloodType: body.bloodType,
      nationalIdNumber: body.nationalIdNumber,
      phone: body.phone,
      cityDistrict: body.cityDistrict
    },
    { source: clientId(req) }
  );

  if (!result.ok) return res.status(result.status).json({ error: result.error });
  res.status(201).json({ donor: result.donor });
});

/** Profile fields only. Tier, hash and eligibility are not on this route. */
spineRouter.patch('/donors/:id', (req, res) => {
  const result = store.updateDonor(req.params.id, req.body || {}, { source: clientId(req) });
  if (!result.ok) return res.status(result.status).json({ error: result.error });
  res.json({ donor: result.donor });
});

/** A donor submits evidence. Submission is not verification. */
spineRouter.post('/donors/:id/documents', (req, res) => {
  const body = req.body || {};
  if (!body.name || !isDocumentType(body.type)) {
    return res.status(422).json({ error: 'name and a known document type are required.' });
  }

  const result = store.submitDonorDocument(
    req.params.id,
    {
      id: String(body.id || `DOC-${Date.now().toString(36).toUpperCase()}`).slice(0, 60),
      name: String(body.name).slice(0, 120),
      type: body.type,
      sizeKb: Number(body.sizeKb) || 0,
      uploadedAt: nowIso(),
      fileDataUrl: body.fileDataUrl ? String(body.fileDataUrl).slice(0, 500) : undefined,
      status: 'PENDING'
    } as any,
    { source: clientId(req) }
  );

  if (!result.ok) return res.status(result.status).json({ error: result.error });
  res.status(201).json({ donor: result.donor, document: result.document });
});

/** Adjudication. Refused unless the actor holds a reviewing role. */
spineRouter.post('/donors/:id/review', (req, res) => {
  const { docId, decision, notes, actor } = (req.body || {}) as {
    docId?: string;
    decision?: string;
    notes?: string;
    actor?: { id?: string; role?: string };
  };

  if (!docId) return res.status(422).json({ error: 'docId is required.' });
  if (!isReviewDecision(decision)) {
    return res.status(422).json({ error: 'decision must be APPROVED or REJECTED.' });
  }
  if (!actor?.id) return res.status(422).json({ error: 'actor.id is required.' });

  const result = store.reviewDonorDocument(
    req.params.id,
    docId,
    decision,
    {
      notes,
      actor: { id: String(actor.id).slice(0, 80), role: String(actor.role || 'UNKNOWN').slice(0, 40) }
    },
    { source: clientId(req) }
  );

  if (!result.ok) return res.status(result.status).json({ error: result.error });
  res.json({ donor: result.donor, document: result.document });
});

spineRouter.patch('/donors/:id/tier', (req, res) => {
  const { tier, actor } = (req.body || {}) as { tier?: unknown; actor?: { id?: string; role?: string } };

  if (!isDonorTier(tier)) return res.status(422).json({ error: 'tier must be 1, 2, 3 or 4.' });
  if (!actor?.id) return res.status(422).json({ error: 'actor.id is required.' });

  const result = store.setDonorTier(
    req.params.id,
    tier,
    { id: String(actor.id).slice(0, 80), role: String(actor.role || 'UNKNOWN').slice(0, 40) },
    { source: clientId(req) }
  );

  if (!result.ok) return res.status(result.status).json({ error: result.error });
  res.json({ donor: result.donor });
});

// ── audit chain ──────────────────────────────────────────────────────────────

spineRouter.get('/chain', (_req, res) => {
  res.json({ blocks: store.snapshot().blocks, verdict: store.verifyChain() });
});

// ── events (SSE) ─────────────────────────────────────────────────────────────

spineRouter.get('/events', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  const who = clientId(req);
  const send = (event: SpineEvent) => {
    if (res.writableEnded) return;
    res.write(`event: ${event.type}\n`);
    res.write(`data: ${JSON.stringify({ ...event, source: event.source || who })}\n\n`);
  };

  send({ id: 'hello', type: 'snapshot', at: nowIso(), summary: 'connected' });

  const unsubscribe = store.subscribe(send);
  const keepAlive = setInterval(() => res.write(': keep-alive\n\n'), 20_000);

  req.on('close', () => {
    clearInterval(keepAlive);
    unsubscribe();
    res.end();
  });
});
