# Bloodchain — blood supply provenance & safety suite

A connected set of web applications for a national blood service: donor engagement, laboratory
screening and release, cold-chain logistics, hospital transfusion safety, and operations oversight.

> **Demonstration build.** Every record shown anywhere in these applications is illustrative sample
> data. The suite is **not** connected to any live national system, and no claim is made of regulatory
> approval, ministry endorsement, or integration with any named institution. Figures that are not
> sourced are marked as assumptions in the accompanying documents.

---

## Surfaces

Five standalone Vite applications, each behind its own sign-in, plus a small gateway that serves the
project portal. They share one design system ("Vessel") and one data layer.

| Surface | Role | Dev port | What it does |
| :--- | :--- | :--- | :--- |
| **Donor** (`beacon`) | Donor-facing | `3002` | Eligibility quiz, appointment booking, centre locator (map), donation history, digital blood card. |
| **Command** (`rubric`) | Operations oversight | `3003` | Supply/deficit view, hospital requisitions, staff provisioning, donor verification desk, incident registry. |
| **Laboratory** (`crucible`) | Screening & release | `3005` | Screening-panel entry, blood-group confirmation, component preparation, safety-gated quality release. |
| **Ward** (`aegis`) | Bedside transfusion | `3004` | Two-clinician bedside verification, ABO/Rh compatibility rule, infusion observations, reaction reporting. |
| **Cold** (`torrent`) | Cold-chain logistics | `3006` | Dispatch, in-transit temperature telemetry with excursion flagging, hospital handover. |

The gateway (`server.ts`) serves the project portal and the small set of internal endpoints the
surfaces call. Each surface keeps a local, **hash-chained audit log** — a self-consistent record of
events for demonstration purposes. It is not a distributed ledger, and nothing is written to an
external network.

---

## Status of claims

Two rules apply throughout this repository:

1. **No unsourced figures.** Numbers that are not attributable to a published source are labelled as
   assumptions, not presented as fact.
2. **No unverified capability.** A surface states only what its own code does. Where a real-world
   number would be needed (facility names, staff names, temperatures, GPS positions), the build uses
   clearly illustrative sample values.

---

## Quickstart

```bash
git clone https://github.com/luxraye/genxs.git
cd genxs
npm install
cp .env.example .env      # set your own values
```

Run the gateway, then any surface in a separate terminal:

```bash
npm run dev               # gateway / portal (port 3000)
npm run dev:scyther       # Donor       (3002)
npm run dev:rubric       # Command     (3003)
npm run dev:aegis         # Ward        (3004)
npm run dev:crucible      # Laboratory  (3005)
npm run dev:torrent       # Cold        (3006)
```

### Environment

| Variable | Purpose |
| :--- | :--- |
| `PORT` | Gateway port (default `3000`). |
| `VITE_DEMO_ACCOUNTS` | Set to `false` to **hide the sample-account buttons** on every sign-in page. Leave unset to show them for a demonstration. |

### Build

```bash
npm run build:scyther  && npm run build:rubric   && npm run build:aegis \
  && npm run build:crucible && npm run build:torrent
```

---

## Data & privacy

- The applications use Firebase Authentication and Firestore. Point them at your own project.
- The demonstration build ships with **sample records only**. Do not enter real patient or donor data
  into this build.
- Before any real use, review the Botswana Data Protection Act, 2024 (in force 14 January 2025) and
  the requirements of the Information and Data Protection Commission.

---

## Project documents

Design, assumptions, partnerships and pilot planning live alongside the build brief and phase prompts
in the project workspace. Those documents carry the assumptions register and the correction log.

## License

No license is granted by this repository. All rights reserved by the project owner.
