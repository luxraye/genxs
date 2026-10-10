# BLOODCHAIN — BUILD CONSTITUTION

> **Paste this once, before Phase 0. It is the standing law for the whole build.** Every phase inherits these rules. When a phase prompt and this Constitution disagree, the Constitution wins. Do not proceed past a requirement you believe is wrong by silently substituting an alternative — state the objection and your reasoning first, and wait.

---

## 0. The framing that governs everything

This is **clinical infrastructure**. A defect can release an unscreened unit or match the wrong blood to a patient.

- **Prefer refusing an action to guessing.** If the system cannot prove an action is safe, it must not allow it.
- **Every irreversible clinical action is explicit, attributable, and logged.** No silent state changes.
- **Where a requirement conflicts with convenience, the requirement wins.** Where a safety rule can be violated by a shortcut, do not take the shortcut.
- **Never claim a capability the running system does not have — in code, copy, docs, or demo.** If it is not built, it is not shown.

---

## 1. What is being built

**Bloodchain** — a national blood resilience platform: one governed system for the vein-to-vein blood supply chain (donor recruitment, laboratory clearance, cold-chain assurance, inventory optimisation, bedside verification, haemovigilance). Every unit visible, every handover provable, every avoidable loss caught before it costs a life.

**Delivery context.** A multi-surface web and mobile suite sold as software to national blood services and ministries of health. First market: Republic of Botswana. Expansion: SADC, then WHO AFRO. B2G infrastructure software, not a consumer product.

**The users are professionals under time pressure** — phlebotomists, lab technologists, couriers, ward nurses, haematologists, national operations staff, ministry auditors, volunteer donors. Design for the person doing the work, not the person approving the invoice.

---

## 2. The naming system (use these names; codenames are retired)

The previous generation used codenames (Scyther, Rubric, Aegis, Crucible, Torrent, Voyager, Mars Lab, High Command, Azure). **Retired.** A ministry officer, a clinician, and a funder must each understand the product in one sentence. **Never use a codename in anything a buyer, clinician, or donor sees** — not in the UI, API, docs, or pitch.

**Platform:** `Bloodchain`

**Spine (shared services):**

| Component | Package | Responsibility |
|---|---|---|
| **Core** | `@bloodchain/core` | The API, the domain model, the database. One schema, one source of truth. |
| **Seal** | `@bloodchain/seal` | Assurance layer — signed, append-only, hash-chained custody log. |
| **Bus** | `@bloodchain/bus` | Event bus. Cross-surface state, durable, replayable. |

**Surfaces:**

| Surface | Package | Serves |
|---|---|---|
| **Beacon** | `@bloodchain/beacon` | Public, donors, all roles (suite entry point) |
| **Donor** | `@bloodchain/donor` | Donors |
| **Collect** | `@bloodchain/collect` | Phlebotomists, collection staff |
| **Lab** | `@bloodchain/lab` | Laboratory technologists |
| **Cold** | `@bloodchain/cold` | Couriers, transit staff |
| **Ward** | `@bloodchain/ward` | Clinicians, nurses |
| **Command** | `@bloodchain/command` | National operations, ministry |

**Services:**

| Service | Package | Responsibility |
|---|---|---|
| **Vigil** | `@bloodchain/vigil` | Haemovigilance — adverse events, aggregation, trends, corrective actions |
| **Continuity** | `@bloodchain/continuity` | Assay continuity — reagent forecasting, stockout warning, reference-lab fallback |

**Rules:** surface names are capitalised proper nouns in prose. Packages are lowercase kebab. Database tables, API paths and event names use the **functional domain word** (`/api/v1/clinical/*`), not the brand name. One optional Setswana signature — **"Madi. Botshelo."** (blood; life) — appears once, on the cover/splash/print footer only. No other Setswana without native-speaker review.

---

## 3. The stack — pinned. Do not substitute.

| Layer | Choice |
|---|---|
| Runtime | Node 24 LTS |
| Language | TypeScript 5.9, `strict: true`, `noUncheckedIndexedAccess: true` — one TS version across the monorepo |
| Package manager | pnpm workspaces |
| API | Express 5, schema-first via OpenAPI |
| Validation | Zod v4 — validate at every trust boundary |
| API spec | OpenAPI 3.1; clients generated with Orval. No hand-written fetch calls. |
| Database | PostgreSQL 16 |
| ORM | **Drizzle only.** No Prisma. No Firestore. No second data store. |
| Auth | **One** provider, self-hosted (Supabase Auth self-hosted or another OIDC provider — decided at Gate 0). Replaces four previous systems. |
| Web | React 19 + Vite 8 + Tailwind 4 over a CSS-variable token layer |
| Mobile | Expo SDK 57 (Donor, Cold). Ship a PWA fallback for Donor. |
| Offline | IndexedDB (web) · expo-sqlite (native), one shared sync queue |
| Events | SSE + Postgres `LISTEN/NOTIFY` |
| Charts | One library, configured once in `packages/ui` |
| Testing | Vitest · Testcontainers + real Postgres · Playwright |
| CI | GitHub Actions |
| Deployment | Render (`render.yaml`) + Docker Compose locally |

**One pnpm monorepo. Nothing outside it. No parallel implementation for any reason.**

```
bloodchain/
├── apps/       beacon/ donor/ collect/ lab/ cold/ ward/ command/
├── services/   core/ seal/ bus/ vigil/ continuity/
├── packages/   db/ domain/ api-spec/ api-client/ ui/ offline/ config/
├── infra/      docker-compose.yml  render.yaml
└── docs/       RUNBOOK.md  DECISIONS.md  OPEN-ISSUES.md  PILOT-CHECKLIST.md
```

---

## 4. The spine

**Core** owns the domain. Every clinical rule lives in `packages/domain` as a pure function with tests — **no rule may exist only inside a React component or an API route.** All writes are transactional and append to the audit log in the same transaction.

**Seal** is the assurance layer:
- Every state change to a unit, test, custody event, or transfusion appends an entry.
- Entries are **hash-chained** (each stores the previous hash + its own canonical payload) and **signed** at batch checkpoints.
- Entries contain **only** unit identifiers, state, timestamps, actor references, and hashes. **No personal data, ever.**
- **Append-only** — no update or delete path in the application layer; enforce with database privileges too.
- An auditor verifies the chain from any checkpoint without access to personal data.
- `AssuranceProvider` is an interface. The default implementation is the hash-chained Postgres log. A distributed ledger may be added later **behind the same interface** — it is **not** part of this build. **Never lead with blockchain.**

**Bus** carries cross-surface state: typed, versioned, persisted, replayable. Subscribers are idempotent. Every event carries a correlation ID.

**Offline-first** (Ward, Cold, Lab, Collect): local write-ahead queue; clinical observations are append-only (no conflicts); unit state transitions are ordered by server receipt and an illegal one is rejected and surfaced as an exception, never dropped; non-clinical fields last-write-wins with history retained. A **persistent sync indicator** (`Synced` · `N pending` · `Offline — working locally`) is always visible. Time is stored in UTC with device offset recorded; clinical timestamps are never silently corrected.

**Security.** Botswana's **Data Protection Act 18 of 2024** (in force 14 January 2025) governs this system — design to it from the first commit. The ministry is the data controller; Bloodchain is the processor. Personal data stays in-country unless explicitly configured otherwise; the architecture must support a fully self-hosted deployment. Pseudonymise at source — a separate, access-controlled mapping table holds identifying data; destroying the mapping key satisfies an erasure request without rewriting history. Every clinical action is attributable to a person, a time, and a device. Secrets never in the repository — CI greps for credential patterns and fails the build.

**RBAC matrix (define and test in CI):**

| Role | Read | Write | Notes |
|---|---|---|---|
| `donor` | own record | own preferences | No access to any other record. |
| `collector` | own centre | intake, samples | Cannot release a unit. |
| `lab_technician` | assigned worklist | test results | Cannot authorise release. |
| `lab_supervisor` | lab scope | release, discard | **Requires a real, verified second factor.** |
| `transit` | assigned consignments | telemetry, handover | Cannot alter unit state beyond custody. |
| `clinician` | ward scope | transfusion record | Cannot alter lab results. |
| `operator` | national read | configuration | Cannot create clinical results. |
| `moh_auditor` | national read + audit log | none | Read-only, including Seal verification. |
| `admin` | all | user/role management | **No clinical write.** Separation of duties. |

---

## 5. Clinical safety rules — CS-1 … CS-12

Requirements, not guidelines. **Each has a test.** Every phase that touches a rule must leave its test passing.

| # | Rule |
|---|---|
| CS-1 | A quarantined or in-testing unit can never be issued. |
| CS-2 | A thermally compromised unit can never be released. |
| CS-3 | Two distinct accounts must authorise a transfusion. |
| CS-4 | An incompatible match produces a hard stop, not a dismissible warning. |
| CS-5 | Supervisor authorisation requires a real second factor — **never a PIN.** (Closes a known defect: the previous generation's supervisor PIN accepted any four digits.) |
| CS-6 | Discard requires a controlled reason code and supervisor authorisation. |
| CS-7 | Every state transition writes exactly one Seal entry, in the same transaction. |
| CS-8 | Fractionation lineage is preserved; condemning a parent condemns every child. |
| CS-9 | An adverse event can never be deleted — only superseded by an amendment record. |
| CS-10 | Offline verification revalidates on sync and degrades safely with stale reference data. |
| CS-11 | No personal data appears in the Seal log. |
| CS-12 | An ISBT 128 DIN is immutable once assigned. |
| CS-13 | **No AI output may enter the clinical decision path.** Compatibility, typing, state transitions, release and discard are computed by deterministic domain functions. *Test:* scan the clinical route handlers for AI-client imports — expect none; assert the verification path has no model dependency. |
| CS-14 | **No AI output may be written to the assurance log.** The log holds facts, never inferences. *Test:* attempt to append a model-generated record — expect rejection; scan the log schema for an inference or confidence field. |
| CS-15 | **No personal or patient-identifiable data may be sent to any inference endpoint outside the deployment boundary.** Inference for anything personal is self-hosted and in-country. *Test:* network-level assertion of no egress of identifying fields; the prompt-assembly layer has no access to PII columns. |
| CS-16 | **Every AI output shown to a user is grounded, cited, and — where it concerns clinical work — explicitly unconfirmed until a human accepts it.** *Test:* attempt to render a Tier 2 proposal as a committed value — expect it to require an explicit confirmation action. |

---

## 6. The kill list — do not do these

- **Do not put AI in the clinical path** — not the compatibility matrix, not the state machine, not release or discard.
- **Do not send patient data to a third-party model** — inference is self-hosted and in-country for anything personal.
- **Do not ship an AI feature that cannot be evaluated** — no golden dataset, no measured error rate, no ship.

1. Do not build a second codebase. One monorepo.
2. Do not add a second identity provider. Do not add a second ORM or a document store.
3. Do not lead with blockchain. Seal is the assurance layer; a ledger sits behind `AssuranceProvider`, later, only if a named buyer requires it.
4. Do not build a screen that returns mock data in a production path. Unbuilt = absent from the UI, or explicitly labelled unavailable.
5. Do not use codenames in anything a user or buyer sees.
6. Do not gamify donation. No streaks, leaderboards, or badges that pressure unsafe donation frequency.
7. Do not build a dismissible warning for a clinical hazard. Hazards are hard stops.
8. Do not build a feature at the expense of convergence. If the choice is a new feature or a green test suite, choose the test suite.
9. Do not write clinical logic in a component. Domain rules live in `packages/domain`.
10. Do not hard-code a colour, spacing value, or clinical string literal. Tokens and controlled vocabularies only.
11. Do not use emoji, illustration, or photography inside any clinical surface.
12. Do not show a metric without its definition.
13. Do not claim a capability the system does not have.

---

## 7. Design system essentials — "Vessel"

One system shared by every surface. Harmony comes from shared **structure, scale, and signal language**; surfaces differ only in a controlled accent. Full specification is in the phase prompts where it is used; these are the laws that never change.

**Seven principles.** Calm is a clinical feature — nothing flashes, bounces, or celebrates. **Status is never colour alone** — every status carries an icon, a label, and a colour, in that order. Density follows the task, not the brand. **Identifiers are sacred** — every serial, DIN, lot number and date is rendered in tabular monospace. Show the window, not the reading. No decoration in the clinical path. **The critical action is the largest thing on the screen** — one primary action per screen.

**Colour (CSS variables; mirror in the Tailwind preset; never hard-code a hex in a component):**

| Token | Light | Dark | Use |
|---|---|---|---|
| `--brand` | `#8E1B2E` | `#C4384F` | Primary action, brand |
| `--brand-strong` | `#6E1122` | `#D9556A` | Hover/active |
| `--brand-soft` | `#F7E9EC` | `#2A1620` | Tinted fills |
| `--chrome` | `#1B2A4A` | `#0B1220` | Header rails, Command chrome |
| `--chrome-soft` | `#2C3E63` | `#141F33` | Secondary chrome |
| `--canvas` | `#FBF9F7` | `#0B1220` | Page background |
| `--surface` | `#FFFFFF` | `#121B2C` | Cards, panels |
| `--surface-sunken` | `#F3EFEB` | `#0E1626` | Wells, table zebra |
| `--border` | `#E2DED9` | `#263248` | Hairlines |
| `--border-strong` | `#C9C3BC` | `#38455F` | Emphasis borders |
| `--ink` | `#14181F` | `#E8ECF2` | Primary text |
| `--ink-muted` | `#5C6470` | `#9BA6B8` | Secondary text |
| `--ink-subtle` | `#8A9099` | `#6B7A91` | Tertiary, captions |

**Signal palette — the clinical status language. Identical on every surface.**

| Token | Light | Dark | Meaning | Icon | Required label |
|---|---|---|---|---|---|
| `--signal-safe` | `#1B7A4B` | `#3FAF74` | Cleared, in-date, compatible | check-shield | `Safe` |
| `--signal-watch` | `#A96B00` | `#D9A13B` | Pending, near-expiry, unresolved | clock | `Watch` |
| `--signal-stop` | `#B3261E` | `#E8625A` | Compromised, reactive, incompatible | octagon | `Stop` |
| `--signal-hold` | `#4A5568` | `#7C8AA0` | Quarantine, awaiting release | lock | `Hold` |
| `--signal-info` | `#1E5A8A` | `#5FA3D4` | In transit, neutral information | arrow | `In transit` |

**Rule:** status = `icon + label + colour`, always. A status dot without an icon and a text label has failed review.

**Surface accents** (header rail, active-nav indicator, chart series, focus rings, empty-state line art only — never body text, never status, never a large background wash):

| Surface | Token | Light | Dark |
|---|---|---|---|
| Donor | `--accent-donor` | `#8E1B2E` | `#C4384F` |
| Collect | `--accent-collect` | `#7A2947` | `#B05A7C` |
| Lab | `--accent-lab` | `#3E3A73` | `#8A83C4` |
| Cold | `--accent-cold` | `#2A6B8E` | `#63AECD` |
| Ward | `--accent-ward` | `#1B3A6B` | `#7BA0D6` |
| Command | `--accent-command` | `#2B2F38` | `#8A93A5` |

**Typography.** Display `"Instrument Sans"` · UI `"Inter"` · Mono `"IBM Plex Mono"` (every identifier, serial, DIN, lot number, and every tabular figure) · Doc `Georgia` (exported/printed clinical documents only, never in the app UI). Type scale (rem) `0.6875 · 0.75 · 0.8125 · 0.875 · 1.0 · 1.125 · 1.375 · 1.75 · 2.25`. Weights 400 body · 500 UI emphasis · 600 headings · 700 brand wordmark only — **never 800+ in the clinical path**. Line height 1.5 body · 1.25 headings · 1.35 tables. `tabular-nums` on every table and numeric field. All-caps only for micro-labels ≤11px, never for sentences or status labels.

**Space/shape.** Spacing `2·4·8·12·16·24·32·48·64·96` (all multiples of 4). Radius 2px status chips · 6px buttons/inputs · 10px cards · 16px sheets/modals. Elevation: 0 flat (default) · 1 raised (card, 1px border + soft shadow) · 2 overlay (shadow only, never a colour glow). Borders 1px hairline · 2px focus/selected · 3px left status rail. Focus: visible 2px ring in the surface accent, 2px offset — **never remove focus outlines**.

**Density modes.** Comfortable 56px row / 48px target (Donor, Ward) · Standard 44px / 40px (Collect, Lab, Cold) · Dense 32px / keyboard-first (Command).

**Primitives** (build once in `packages/ui`; no surface defines its own button): Button (`primary` brand, one per screen · `secondary` outline · `danger` for destructive clinical actions with a confirmation pattern · `ghost`), StatusChip (icon+label+colour, never renderable without a label), UnitRow (DIN mono, component type, blood group, expiry with relative warning, status chip, left status rail — one component, every surface), NumberField (mono, tabular, units shown), ScanField (large, high-contrast, camera + visibly-slower manual fallback), ConfirmDanger (type the unit's DIN to confirm), DataTable (sortable, keyboard-navigable, tabular figures, sticky header), EmptyState (a sentence, an icon, one next action), SyncIndicator, Callout (`info`/`watch`/`stop`; the `stop` variant is a hard block and cannot be dismissed), TrendSpark (always with a text summary).

**Data visualisation.** One library. Series colours from the signal palette + surface accent — never a rainbow, max four series. **Every chart has a table-view toggle.** Thresholds drawn as explicit marker lines. Days of Supply is always a horizontal bar, worst-first, with the threshold marked. The deficit matrix is a grid. **Any pie chart is a defect.** The national map colours districts by days-of-supply band using the signal palette. Axis labels never truncated.

**Iconography.** One line-icon set, 1.5px stroke, 20px and 24px only. No filled icons. **No emoji anywhere in this product.** Status icons distinguishable **by silhouette alone**: check-shield, clock, octagon, lock, arrow.

**Motion.** Purpose only, 120–180ms ease-out. Successful clinical action = a brief, quiet state change — **never confetti, never a bounce, never a celebratory animation on a safety action.** Optimistic updates show a pending state; they never fake success. Respect `prefers-reduced-motion`. No parallax, no scroll-jacking, no autoplay.

**Accessibility — WCAG 2.2 AA, enforced.** Text ≥4.5:1, UI/focus ≥3:1. Full keyboard on Command/Lab/Collect, no trap. 48px targets on Ward/Donor, 40px elsewhere. Usable at 200% zoom. Persistent visible field labels — **placeholder text is never a label.** Errors announced and specific ("DIN checksum failed", not "invalid input"). One manual screen-reader run per surface on a critical flow (Ward verification mandatory).

**Content and tone.** Voice: calm, precise, unhurried — a competent colleague, not a salesperson and not an alarm. Correct clinical terms (*transfusion*, *screening*, *unit*/*component*). Never blame the user. Errors state what happened, why, the next action — three sentences max. No exclamation marks in clinical surfaces, no marketing superlatives anywhere. Never imply certainty the system lacks ("cleared for release per protocol", not "safe blood"). Donor copy is warm but factual — no fear appeals, no shaming, no gamified pressure. Numbers always carry units and, where non-obvious, a definition. Dates absolute with the year.

---

## 8. Domain spine

**Core entities:** `donor`, `donor_identity` (separated encrypted PII), `unit`, `donation`, `sample`, `test`, `custody_event`, `consignment`, `telemetry_reading`, `excursion`, `requisition`, `transfusion`, `adverse_event`, `reagent`, `facility`/`centre`.

**Unit state machine** — implement once in `packages/domain`, exhaustively tested. **No surface implements its own state logic.**

```
donation ─► QUARANTINE ─(submit for testing)─► TESTING
                                                 │ cleared ─► CLEARED ─(fractionate)─► FRACTIONATED ─► children enter AVAILABLE
                                                 │ inconclusive ─► (stays TESTING)
                                                 │ reactive ─► REACTIVE ─► DISPOSED
CLEARED / AVAILABLE ─(reserve)─► RESERVED ─(dispatch)─► IN_TRANSIT ─(receive)─► DELIVERED ─(issue)─► ISSUED ─(transfuse)─► TRANSFUSED (terminal)
AVAILABLE ─► EXPIRED (terminal, by elapsed time)
AVAILABLE ─► DISPOSED  (terminal, by authorised discard)
```

**Cross-cutting flag:** `THERMALLY_COMPROMISED` may be applied to any non-terminal unit by Cold. Effect is a **hard stop** — the unit cannot progress to `AVAILABLE` or `ISSUED`, and can only resolve to `DISPOSED` by authorised discard. Cleared only by an explicit, attributed supervisor decision with clinical justification — never automatically.

**Invariants** (enforce in the domain layer *and* in database constraints):
1. A unit in `QUARANTINE` or `TESTING` can never be issued, reserved, or shown as available.
2. A unit with `THERMALLY_COMPROMISED` can never reach `ISSUED`.
3. A unit cannot be transfused unless `ISSUED` (or explicitly emergency-released with a recorded override).
4. A unit cannot be issued before screening is complete and its blood group is confirmed by a second determination.
5. Fractionation sets `parentAssetId` on every child; condemning a parent condemns all children.
6. Every state transition appends a Seal entry in the same transaction.
7. Every state transition records the actor.
8. A `transfusion` requires two distinct verifying accounts.
9. An `adverse_event` may never be deleted — only superseded with an amendment record.
10. An ISBT 128 DIN is globally unique and immutable once assigned.

**Controlled vocabularies** (define once in `packages/domain`; never inline a clinical string literal):
- **Discard reasons:** `EXPIRED` · `THERMAL_EXCURSION` · `REACTIVE_SCREEN` · `LEAKAGE` · `CONTAMINATION` · `BROKEN_SEAL` · `OTHER` (requires supervisor note)
- **Adverse event types:** `TACO` · `TRALI` · `FEBRILE_NON_HAEMOLYTIC` · `ALLERGIC` · `DELAYED_HAEMOLYSIS` · `BACTERIAL_CONTAMINATION` · `NEAR_MISS`
- **Severity:** `NEAR_MISS` · `NON_SEVERE` · `SEVERE` · `LIFE_THREATENING` · `FATAL`
- **Imputability:** `EXCLUDED` · `POSSIBLE` · `PROBABLE` · `DEFINITE` · `NOT_ASSESSED`
- **Component types:** `WHOLE_BLOOD` · `RED_CELLS` · `PLASMA` · `PLATELETS`
- **Urgency:** `ROUTINE` · `URGENT` · `EMERGENCY`

---

## 9. API conventions

Base path `/api/v1`. Breaking changes need a new version. OpenAPI 3.1 in `packages/api-spec` is the **source of truth**; clients generated with Orval. Every request/response validated with Zod, unknown fields rejected. **Error envelope every time:**

```json
{ "error": { "code": "UNIT_THERMALLY_COMPROMISED", "message": "…", "details": {}, "correlationId": "…" } }
```

Codes machine-readable and stable; messages human-readable; never a raw stack trace. **Correlation IDs** on every request, propagated through the bus into logs. Cursor-based pagination — no offset pagination on clinical lists. Every mutation accepts an `Idempotency-Key`.

**Event namespace** `bloodchain.<domain>.<event>`, versioned. Every event carries `id`, `type`, `version`, `occurredAt`, `correlationId`, `actor` (reference only), `subject`, `payload`. Subscribers idempotent; tolerate replay.

**FHIR (Phase 5):** map to R4/R5. A blood component → **`BiologicallyDerivedProduct`**, NOT `Specimen`. Also `Specimen`, `Observation`, `AdverseEvent`, `Provenance`, `AuditEvent`, `ServiceRequest`, `Procedure`, `Patient`, `Practitioner`/`PractitionerRole`, `Location`/`Organization`. Expose as a **read-only facade** in this build; any inbound write path needs a separate design pass.

---

## 10. Testing and definition of done

**Integration-first** — the value is end-to-end clinical flows.

| Layer | Requirement |
|---|---|
| Unit | Every function in `packages/domain` — state machine, invariants, ISBT 128 handling, validity windows, excursion evaluation |
| Integration | Against a **real Postgres** (Testcontainers). Every route group. Every invariant enforced at the database layer. |
| RBAC matrix | Automated: every role × every protected route, asserting allow/deny |
| e2e | Playwright on the critical flows (collection → release → transport → verification → transfusion; reaction reporting) |
| Offline | A deterministic offline test per offline-capable surface, including a conflict scenario |
| Accessibility | Automated axe pass + one manual screen-reader run on Ward verification |
| Visual | Review each surface against the design system before it is called done |

**A feature is done when** it works offline where required; is validated by Zod at the boundary; enforces its domain rules server-side; writes exactly one Seal entry on any state change; has unit and integration tests; is keyboard- and screen-reader-accessible; uses only design-system tokens; and no claim in the UI exceeds what the system can do.

**CI gates, all blocking:** typecheck · lint · unit · integration · RBAC matrix · secret scan · build.

---

## 11. Gate protocol

- **Gate 0** (before Phase 0): identity provider decided (L1); ISBT 128 configuration answered in writing (L3); validated excursion windows answered in writing (L4). If unanswered, build interfaces and tests with a clearly-labelled configuration placeholder — **never a guessed default.**
- **Gate 1** (after Phase 1, end of Beacon): the founder reviews the running public application before any further surface is built.
- Never start a phase before its predecessor's acceptance criteria pass.
- At the end of every phase: **stop, state which acceptance criteria pass and any that do not, and wait.** Do not begin the next phase unprompted.

*Madi. Botshelo.*
