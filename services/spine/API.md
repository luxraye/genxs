# The spine API

One service owns the world. Every surface reads and writes through it, so no two
consoles can disagree about the same unit, request, issue, account or donor.

Mounted by the gateway (`server.ts`) at **`/api/spine`**; the same router is
mountable on its own (`services/spine/smoke.mts`) for tests and local work.

Run the contract tests with `npm test` — they drive the router over HTTP on an
ephemeral port, not the store's internals.

## What it owns

| Collection | Written by | Why it is shared |
|---|---|---|
| `units` | collection, laboratory, logistics, hospital, bedside | the state machine is enforced in one place |
| `requests` | hospitals, operations | dispatch is a shared fact, not a local one |
| `issues` | any surface, telemetry | one incident list, not five |
| `staff` | operations only | an account exists only if it was provisioned |
| `donors` | the donor surface registers; operations adjudicates | the register is the origin of the chain |
| `blocks` | the service | the assurance log is appended by the service, never by a client |

## Routes

```
GET    /health                       liveness + revision + counts
GET    /snapshot                     every collection, one revision
GET    /units                        all units
GET    /units/:din                   one unit
PATCH  /units/:din                   patch a unit (validated, optimistic)
POST   /units/:din/telemetry         record a reading; the verdict is the service's
POST   /units/:din/events            append an audit block; the digest is the service's

GET    /requests                     POST /requests     PATCH /requests/:id
GET    /issues                       POST /issues       PATCH /issues/:id

GET    /staff                        POST /staff        PATCH /staff/:id
POST   /auth/login                   sign-in — there is deliberately no registration

GET    /donors                       the register
GET    /donors/:id                   one donor
POST   /donors                       register (422 malformed, 409 duplicate)
PATCH  /donors/:id                   profile fields only
POST   /donors/:id/documents         submit evidence — never verifies it
POST   /donors/:id/review            adjudicate (operations role only)
PATCH  /donors/:id/tier              set a tier, capped by the evidence

GET    /chain                        the audit log + an integrity verdict
GET    /events                       Server-Sent Events stream of every change
```

## The invariants a surface cannot talk its way around

These live in the service and in `packages/domain`, not in a component, and each
one has a test in `tests/spine-api.test.mts`.

1. **An illegal transition is refused, not stored.** A caller cannot invent a
   status the state machine does not permit (`422`).
2. **A stale write is refused.** Send `expectedRev`; if the unit moved on, the
   write is `409` and the error names both revisions.
3. **The audit digest is computed here.** A caller may not supply a hash, so a
   client cannot make the log say something the facts do not.
4. **Consequences are applied, not reported.** A telemetry excursion quarantines
   the unit and raises the incident server-side, against the unit's own stored
   range.
5. **Nobody self-registers into a console.** `POST /auth/login` authenticates; it
   never creates. An account exists only because operations provisioned it.
6. **A donor never verifies themselves.** Registration decides the identity hash,
   the tier and the eligibility defaults; submitting a document moves nothing; and
   only an operations role may adjudicate (`403` otherwise).
7. **A tier never outruns its evidence.** Tiers are capped by the approved
   documents that justify them, whether the request came from a review or from an
   operator setting a tier directly.

## Error envelope

Every refusal is a status code plus one sentence a person can act on:

```json
{ "error": "A unit cannot move from RELEASED to TRANSFUSED. This transition is not permitted by the state machine." }
```

`403` not permitted · `404` not found · `409` conflict or duplicate · `422` unacceptable input.

## Notes

- **Client.** `src/lib/spine/client.ts` (framework-free) and
  `src/lib/spine/react.tsx` (provider + status chip). Surfaces degrade to bundled
  sample data when the service is absent, and the status chip says which mode is
  in force — a surface must never imply shared state it does not have.
- **Persistence.** A single JSON file at `SPINE_DATA_FILE` (default
  `.spine-data/state.json`), written best-effort and debounced. This is a
  single-process store by design; it is not a distributed system and does not
  claim to be one.
- **Still open.** The legacy routes in the gateway (`/api/telemetry/*`,
  `/api/alerts/*`, `/api/clinical/*`, `/api/fabric/*`) predate the spine. The
  telemetry route now hands unit state to the spine and keeps only a transport
  ping log; the rest still hold their own state and should be moved onto, or
  retired in favour of, the routes above.
