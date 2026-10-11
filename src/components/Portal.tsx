/**
 * Bloodchain — the portal.
 *
 * This is the face of the platform: the page a ministry officer, a clinician or
 * a funder sees first. The visual direction follows the portal that ran at
 * default-portal.web.app — warm off-white canvas, Source Serif 4 display type,
 * DM Sans body, JetBrains Mono for specifications and identifiers.
 *
 * ── Content rules for this page ──────────────────────────────────────────────
 * It is written to survive diligence, which means it says only what is true:
 *
 *   · No institutional partnership is implied. There is no signed agreement
 *     with any ministry, and the header used to suggest there was one.
 *   · Nothing is described as a completed pilot. Facilities are named as target
 *     sites for the pilot design — not as designated or connected nodes.
 *   · The audit log is described as what it is: a signed, hash-chained log that
 *     is a working part of the platform. A distributed ledger across
 *     institutions is designed for, and is explicitly NOT claimed to exist.
 *   · No vendor hardware is named. Temperature telemetry is described by what
 *     it does, not by a product.
 *   · No fabricated unit economics. The figures here are from published sources
 *     (WHO, UNAIDS, the national assessments cited in the concept note); where a
 *     value is modelled rather than published, it is marked as an assumption.
 *   · No AI is presented against clinical work. Compatibility and state
 *     transitions are deterministic functions with tests — see docs/CONSTITUTION.md
 *     CS-13 — and the page says so rather than implying a model in the loop.
 *
 * There is deliberately ONE status disclosure, in the footer. Stamping "demo" on
 * every surface would misrepresent a platform that is genuinely built, while
 * saying nothing at all would misrepresent what is deployed. One honest sentence
 * in the footer, plus an honest note wherever a claim could be over-read.
 */

import React from 'react';

const HERO_IMAGE = '/images/hero_audit_blood_grid_1791309472035.jpg';
const DONOR_IMAGE = '/images/donor_blood_drive_1791309652490.jpg';
const LAB_IMAGE = '/images/laboratory_fractionation_serology_1791309504388.jpg';
const LOGISTICS_IMAGE = '/images/iot_cold_chain_transit_1791309495139.jpg';
const BEDSIDE_IMAGE = '/images/bedside_clinical_transfusion_1791309482591.jpg';
const OPS_IMAGE = '/images/situation_room_ops_1791309668046.jpg';
const LEDGER_IMAGE = '/images/ledger_security_vault_1791309692752.jpg';
const CORRIDOR_IMAGE = '/images/health_corridor_hospital_1791309705818.jpg';

const CONTACT_EMAIL = 'giftjrnakedi@gmail.com';
const SITE = 'www.bloodchain.life';

const MAILTO = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
  'Bloodchain — partner briefing request'
)}&body=${encodeURIComponent(
  'Organisation:\nRole:\nCountry / mandate:\n\nWhat I would like to discuss:\n'
)}`;

export type PortalView =
  | 'DONOR'
  | 'LAB'
  | 'TRANSIT'
  | 'CLINICAL'
  | 'OPERATIONS'
  | 'LEDGER';

interface PortalProps {
  /** Enter one of the working surfaces. */
  onLaunch?: (view: PortalView, role: string) => void;
}

/* ── design tokens ───────────────────────────────────────────────────────── */
/* Values lifted from the portal that ran at default-portal.web.app:
   primary 351 68.2% 39.4% · background 36 45.5% 97.8% · card 40 100% 99.4%
   border 192 16.7% 88.2% · ink 203 21.6% 19%                                 */

const css = `
  .bcp {
    --ink: 203 21.6% 19%;
    --ink-soft: 202 15.5% 38%;
    --ink-faint: 202 14% 42%;
    --paper: 36 45.5% 97.8%;
    --card: 40 100% 99.4%;
    --line: 192 16.7% 88.2%;
    --crimson: 351 68.2% 39.4%;
    --crimson-deep: 351 70% 22%;
    --crimson-wash: 351 60% 96.5%;
    --emerald: 160 55% 33%;
    --amber: 35 85% 40%;
    background: hsl(var(--paper));
    color: hsl(var(--ink));
    font-family: "DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  .bcp-serif { font-family: "Source Serif 4", Georgia, Cambria, "Times New Roman", serif; }
  .bcp-mono {
    font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-variant-ligatures: none;
  }
  .bcp-card {
    background: hsl(var(--card));
    border: 1px solid hsl(var(--line));
  }
  .bcp-line { border-color: hsl(var(--line)); }
  .bcp-crimson { color: hsl(var(--crimson)); }
  .bcp-btn-primary {
    background: hsl(var(--crimson));
    color: #fff;
    box-shadow: 0 1px 2px hsl(351 68.2% 39.4% / 0.28), 0 6px 18px -6px hsl(351 68.2% 39.4% / 0.45);
  }
  .bcp-btn-primary:hover { background: hsl(351 68.2% 34%); }
  .bcp-btn-ghost {
    background: hsl(var(--card));
    color: hsl(var(--ink));
    border: 1px solid hsl(var(--line));
  }
  .bcp-btn-ghost:hover { border-color: hsl(var(--crimson) / 0.45); color: hsl(var(--crimson)); }
  .bcp-chip {
    border: 1px solid hsl(var(--line));
    background: hsl(var(--card));
    color: hsl(var(--ink-soft));
  }
  .bcp-rule { background: hsl(var(--line)); }
  .bcp-hair { border-top: 1px solid hsl(var(--line)); }
  .bcp-anchor { scroll-margin-top: 96px; }
  .bcp-hairline-grid {
    background-image:
      repeating-linear-gradient(0deg, hsl(var(--ink) / 0.045) 0 1px, transparent 1px 64px),
      repeating-linear-gradient(90deg, hsl(var(--ink) / 0.045) 0 1px, transparent 1px 64px);
  }
  .bcp-row:hover { background: hsl(var(--paper)); }
  @media (max-width: 640px) {
    .bcp-hide-sm { display: none; }
  }
`;

export const Portal: React.FC<PortalProps> = ({ onLaunch }) => {
  const launch = (view: PortalView, role: string) => onLaunch?.(view, role);

  const nav = [
    { id: 'overview', label: 'Overview' },
    { id: 'suite', label: 'The suite' },
    { id: 'trust', label: 'Trust layer' },
    { id: 'market', label: 'First market' },
    { id: 'architecture', label: 'Architecture' },
    { id: 'briefing', label: 'Briefing' }
  ];

  const suite = [
    {
      n: 'Scyther',
      fn: 'Donor Engine',
      tag: 'Donor',
      image: DONOR_IMAGE,
      alt: 'A blood donor giving blood in a modern clinic',
      tone: 'hsl(351 68.2% 39.4%)',
      desc: 'Donor identity, eligibility clock and appointments — and verified feedback when a gift is actually transfused, which is what brings a donor back.',
      points: ['Digital donor card and lifetime donation record', 'Self-service eligibility and deferral screening']
    },
    {
      n: 'Crucible',
      fn: 'Collection & Testing',
      tag: 'Laboratory',
      image: LAB_IMAGE,
      alt: 'A laboratory technologist inspecting blood components',
      tone: 'hsl(215 70% 42%)',
      desc: 'Quarantine is the default. Sample-to-result tracking, five-panel infectious screening, component fractionation and signed release.',
      points: ['A unit cannot be released until screening clears', 'Fractionation into red cells, platelets and plasma']
    },
    {
      n: 'Torrent',
      fn: 'Cold Chain',
      tag: 'Logistics',
      image: LOGISTICS_IMAGE,
      alt: 'A monitored blood transport cooler in transit',
      tone: 'hsl(35 85% 40%)',
      desc: 'Continuous temperature telemetry from collection to ward, with excursion alarms and a signed custody handover at every step.',
      points: ['A breach quarantines the unit and raises an incident', 'Custody handover with counter-signature']
    },
    {
      n: 'Aegis',
      fn: 'Bedside Safety',
      tag: 'Bedside',
      image: BEDSIDE_IMAGE,
      alt: 'A nurse scanning a blood unit at a patient bedside',
      tone: 'hsl(160 55% 33%)',
      desc: 'Two authenticated clinicians verify the patient wristband against the unit before release, with ABO/Rh compatibility checked independently.',
      points: ['Independent dual-clinician verification', 'Adverse reaction reporting closes the loop']
    },
    {
      n: 'Rubric',
      fn: 'National Inventory & Operations',
      tag: 'Operations',
      image: OPS_IMAGE,
      alt: 'An operations room monitoring national supply data',
      tone: 'hsl(280 45% 42%)',
      desc: 'Supply position by group and district, deficit alerts before stock runs out, and rebalancing between facilities.',
      points: ['Days-of-supply position by blood group', 'Staff provisioning and issue resolution']
    },
    {
      n: 'Ledger Explorer',
      fn: 'Trust Layer',
      tag: 'Audit',
      image: LEDGER_IMAGE,
      alt: 'Secure data storage infrastructure',
      tone: 'hsl(203 21.6% 32%)',
      desc: 'A signed, hash-chained record of every custody event — and a tamper check you can demonstrate rather than assert.',
      points: ['Every state change is chained to the previous one', 'An altered record fails verification']
    }
  ];

  const ledgerRows = [
    {
      stage: 'Collection',
      event: 'Phlebotomy intake & DIN assignment',
      payload: 'din + donor pseudonym hash',
      guard: 'ISBT 128 DIN',
      stageTone: 'hsl(351 68.2% 39.4%)'
    },
    {
      stage: 'Laboratory',
      event: 'Five-panel serology clearance',
      payload: 'panel results + lab reference',
      guard: 'Release blocked until clear',
      stageTone: 'hsl(215 70% 42%)'
    },
    {
      stage: 'Cold chain',
      event: 'Telemetry handover',
      payload: 'temperature + sensor + location',
      guard: 'Stored range check, 2–6 °C',
      stageTone: 'hsl(35 85% 40%)'
    },
    {
      stage: 'Bedside',
      event: 'Dual-clinician verification',
      payload: 'two clinician ids + wristband + DIN',
      guard: 'Compatibility + two signatures',
      stageTone: 'hsl(160 55% 33%)'
    },
    {
      stage: 'Depository',
      event: 'Component fractionation',
      payload: 'parent din + component dins',
      guard: 'Lineage preserved',
      stageTone: 'hsl(280 45% 42%)'
    },
    {
      stage: 'Haemovigilance',
      event: 'Post-transfusion follow-up',
      payload: 'observation + outcome code',
      guard: 'WHO-aligned reporting',
      stageTone: 'hsl(203 21.6% 32%)'
    }
  ];

  const facilities = [
    {
      name: 'Princess Marina Hospital',
      place: 'Gaborone',
      role: 'National referral hospital & central depository'
    },
    {
      name: 'Nyangabgwe Referral Hospital',
      place: 'Francistown',
      role: 'Northern regional trauma & transfusion centre'
    },
    {
      name: 'Sekgoma Memorial Hospital',
      place: 'Serowe',
      role: 'Central district hospital & transfusion depot'
    },
    {
      name: 'Maun General Hospital',
      place: 'Maun · Ngamiland',
      role: 'North-west regional transit outpost'
    }
  ];

  const gates = [
    { k: 'G1', t: 'Legal entity', d: 'An incorporation and a bank account — a ministry cannot sign with an individual.' },
    { k: 'G2', t: 'Lawful data handling', d: 'A DPIA, a named data protection officer and a processing agreement.' },
    { k: 'G3', t: 'Ethics & research approval', d: 'Health research review before any record is touched.' },
    { k: 'G4', t: 'A willing clinical site', d: 'A named facility, a named clinical lead, a data-sharing agreement.' },
    { k: 'G5', t: 'A place to run it', d: 'Pilot hosting that is lawful, funded and operable.' },
    { k: 'G6', t: 'A way to be trusted', d: 'Insurance, a security posture and a written incident path.' }
  ];

  return (
    <div className="bcp min-h-screen">
      <style>{css}</style>

      {/* ── header ─────────────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-50 backdrop-blur-md"
        style={{ background: 'hsl(36 45.5% 97.8% / 0.88)', borderBottom: '1px solid hsl(192 16.7% 88.2%)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[68px] flex items-center justify-between gap-4">
          <a href="#overview" className="flex items-center gap-3 shrink-0">
            <span
              className="w-9 h-9 rounded-full grid place-items-center shrink-0"
              style={{ background: 'hsl(351 68.2% 39.4%)' }}
              aria-hidden="true"
            >
              <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="none" stroke="#fff" strokeWidth="1.9">
                <path d="M12 3.4c3.2 3.6 5.6 6.6 5.6 9.6a5.6 5.6 0 1 1-11.2 0c0-3 2.4-6 5.6-9.6Z" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="leading-none">
              <span className="block bcp-serif text-[19.0px] font-semibold tracking-tight" style={{ color: 'hsl(203 21.6% 19%)' }}>
                Bloodchain
              </span>
              <span className="block bcp-mono text-[10.5px] uppercase tracking-[0.14em] mt-1" style={{ color: 'hsl(202 15.5% 38%)' }}>
                Vein-to-vein blood supply
              </span>
            </span>
          </a>

          <nav className="hidden lg:flex items-center gap-1 bcp-hide-sm">
            {nav.map(item => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="px-3 py-2 text-[13.0px] rounded-md transition-colors"
                style={{ color: 'hsl(202 15.5% 38%)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'hsl(351 68.2% 39.4%)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'hsl(202 15.5% 38%)')}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <a
            href={MAILTO}
            className="bcp-btn-primary px-4 py-2.5 rounded-lg text-[13.0px] font-semibold whitespace-nowrap transition-colors"
          >
            Request a briefing
          </a>
        </div>
      </header>

      {/* ── hero ───────────────────────────────────────────────────────────── */}
      <section id="overview" className="bcp-anchor relative overflow-hidden">
        <div className="absolute inset-0 bcp-hairline-grid pointer-events-none opacity-70" />
        <div
          className="absolute -top-40 right-0 w-[46rem] h-[46rem] rounded-full blur-[120px] pointer-events-none"
          style={{ background: 'hsl(351 68.2% 39.4% / 0.07)' }}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative pt-14 pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-7">
              <p className="bcp-mono text-[11.5px] uppercase tracking-[0.16em]" style={{ color: 'hsl(202 15.5% 38%)' }}>
                Vein-to-vein blood supply
                <span className="mx-2" style={{ color: 'hsl(192 16.7% 78%)' }}>·</span>
                Botswana first market
              </p>

              <h1 className="bcp-serif text-[42.0px] sm:text-[54.0px] lg:text-[60.0px] font-semibold leading-[1.03] tracking-[-0.02em]">
                A clearer view of
                <br />
                every handoff.
                <span className="block bcp-crimson mt-2">Every drop accounted for.</span>
              </h1>

              <p className="text-[16.5px] leading-relaxed max-w-xl" style={{ color: 'hsl(202 15.5% 38%)' }}>
                Bloodchain is the operating system for the vein-to-vein blood supply chain. One governed
                platform connects donor recruitment, laboratory clearance, cold-chain assurance, inventory,
                bedside verification and haemovigilance — so more of what is collected reaches the patients
                who need it.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
                {[
                  {
                    t: 'Dual-clinician verification',
                    d: 'Two authenticated clinicians check the patient wristband against the unit before release.'
                  },
                  {
                    t: 'Cold-chain range guard',
                    d: 'Continuous telemetry; a breach quarantines the unit and raises an incident.'
                  }
                ].map(c => (
                  <div key={c.t} className="bcp-card rounded-xl p-4">
                    <p className="text-[13.0px] font-semibold mb-1.5">{c.t}</p>
                    <p className="text-[12.5px] leading-relaxed" style={{ color: 'hsl(202 15.5% 38%)' }}>
                      {c.d}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <a
                  href={MAILTO}
                  className="bcp-btn-primary inline-flex items-center gap-2 px-5 py-3 rounded-lg text-[13.5px] font-semibold transition-colors"
                >
                  Request a partner briefing
                  <span aria-hidden="true">→</span>
                </a>
                <a
                  href="#suite"
                  className="bcp-btn-ghost inline-flex items-center gap-2 px-5 py-3 rounded-lg text-[13.5px] font-semibold transition-colors"
                >
                  Explore the platform
                </a>
              </div>

              <div
                className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-4 text-[12.0px] bcp-hair"
                style={{ color: 'hsl(202 15.5% 38%)' }}
              >
                {['ISBT 128 DIN standard', 'WHO-aligned transfusion safety practice', 'No donor PII in the audit log'].map(s => (
                  <span key={s} className="inline-flex items-center gap-2">
                    <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 shrink-0" style={{ color: 'hsl(160 55% 33%)' }} fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="m3 8.5 3.2 3.2L13 5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="relative rounded-2xl p-2.5" style={{ background: 'hsl(40 100% 99.4%)', border: '1px solid hsl(192 16.7% 88.2%)' }}>
                <div className="absolute top-5 left-5 z-20 bcp-mono text-[11.5px] font-medium px-3 py-1.5 rounded-full" style={{ background: 'hsl(203 21.6% 19% / 0.88)', color: '#fff' }}>
                  Range spec · 2–6 °C
                </div>
                <div className="absolute top-5 right-5 z-20 bcp-mono text-[11.5px] font-medium px-3 py-1.5 rounded-full inline-flex items-center gap-1.5" style={{ background: 'hsl(40 100% 99.4% / 0.94)', border: '1px solid hsl(192 16.7% 88.2%)', color: 'hsl(160 55% 33%)' }}>
                  <svg viewBox="0 0 16 16" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="3" y="7" width="10" height="7" rx="1.4" />
                    <path d="M5.6 7V5.2a2.4 2.4 0 0 1 4.8 0V7" />
                  </svg>
                  Audit log sealed
                </div>
                <div className="overflow-hidden rounded-xl aspect-[16/11] relative">
                  <img
                    src={HERO_IMAGE}
                    alt="A blood bank cold storage vault with ambient monitoring"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, hsl(203 21.6% 19% / 0.62), transparent 55%)' }} />
                  <div
                    className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11.5px] px-3.5 py-2 rounded-lg bcp-mono"
                    style={{ background: 'hsl(40 100% 99.4% / 0.94)', color: 'hsl(203 21.6% 19%)' }}
                  >
                    <span className="inline-flex items-center gap-2">
                      <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" style={{ color: 'hsl(351 68.2% 39.4%)' }} fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M3 3v5.5a5 5 0 0 0 10 0V3" strokeLinecap="round" />
                      </svg>
                      Dual-clinician check
                    </span>
                    <span className="font-semibold" style={{ color: 'hsl(160 55% 33%)' }}>Active</span>
                  </div>
                </div>
                <div className="pt-2.5 px-1 flex items-center justify-between bcp-mono text-[11.5px]" style={{ color: 'hsl(202 14% 42%)' }}>
                  <span>National referral network</span>
                  <span>Illustrative facility view</span>
                </div>
              </div>
            </div>
          </div>

          {/* the figures: published anchors, not projections */}
          <div className="mt-16 bcp-card rounded-2xl grid grid-cols-2 lg:grid-cols-4 overflow-hidden">
            {[
              { k: 'Units collected · Botswana', v: '24–28k', d: 'a year, against a 40–45k requirement' },
              { k: 'Of requirement unmet', v: '~40%', d: 'donor volume is the binding constraint' },
              { k: 'Identification standard', v: 'ISBT 128', d: 'universal DIN barcode tracking' },
              { k: 'Red-cell storage window', v: '2–6 °C', d: '35–42 days of shelf life' }
            ].map((m, i) => (
              <div
                key={m.k}
                className="p-5 lg:p-6"
                style={{
                  borderLeft: i === 0 ? 'none' : '1px solid hsl(192 16.7% 88.2%)',
                  borderTop: undefined
                }}
              >
                <p className="bcp-mono text-[10.5px] uppercase tracking-[0.13em] mb-2" style={{ color: 'hsl(202 14% 42%)' }}>
                  {m.k}
                </p>
                <p className="bcp-serif text-[30.0px] lg:text-[34.0px] font-semibold leading-none tabular-nums">{m.v}</p>
                <p className="text-[12px] mt-2 leading-snug" style={{ color: 'hsl(202 15.5% 38%)' }}>
                  {m.d}
                </p>
              </div>
            ))}
          </div>
          <p className="bcp-mono text-[11px] mt-3" style={{ color: 'hsl(202 14% 42%)' }}>
            Published figures, cited in the concept note. Not projections.
          </p>
        </div>
      </section>

      {/* ── the suite ──────────────────────────────────────────────────────── */}
      <section id="suite" className="bcp-anchor bcp-hair">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-3xl mb-12">
            <p className="bcp-mono text-[11.5px] uppercase tracking-[0.16em] bcp-crimson mb-3">One governed system</p>
            <h2 className="bcp-serif text-[34.0px] sm:text-[42.0px] font-semibold leading-tight tracking-[-0.015em]">
              Six surfaces, one spine.
            </h2>
            <p className="mt-4 text-[16.0px] leading-relaxed" style={{ color: 'hsl(202 15.5% 38%)' }}>
              Each role works in an interface built around its own mandate. Every surface reads and writes the
              same source of truth, so no two consoles can disagree about the same unit — which is the failure
              the paper-and-phone process cannot avoid.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {suite.map(s => (
              <article key={s.n} className="bcp-card rounded-2xl overflow-hidden flex flex-col">
                <div className="aspect-[16/9] relative overflow-hidden">
                  <img src={s.image} alt={s.alt} className="w-full h-full object-cover" referrerPolicy="no-referrer" loading="lazy" />
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, hsl(203 21.6% 19% / 0.72), transparent 60%)' }} />
                  <span
                    className="absolute top-3 right-3 bcp-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] px-2 py-1 rounded"
                    style={{ background: 'hsl(40 100% 99.4% / 0.93)', color: s.tone }}
                  >
                    {s.tag}
                  </span>
                  <div className="absolute bottom-2.5 left-3.5 right-3.5 text-white">
                    <p className="bcp-mono text-[11px] uppercase tracking-[0.1em]" style={{ color: 'hsl(0 0% 100% / 0.72)' }}>
                      {s.fn}
                    </p>
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="bcp-serif text-[21.0px] font-semibold leading-tight">{s.n}</h3>
                  <p className="bcp-mono text-[11.5px] mt-1.5 uppercase tracking-[0.09em]" style={{ color: s.tone }}>
                    {s.fn}
                  </p>
                  <p className="text-[13.0px] leading-relaxed mt-3" style={{ color: 'hsl(202 15.5% 38%)' }}>
                    {s.desc}
                  </p>
                  <ul className="mt-4 pt-4 space-y-2 bcp-hair mt-auto">
                    {s.points.map(p => (
                      <li key={p} className="flex items-start gap-2 text-[12.5px]" style={{ color: 'hsl(202 15.5% 38%)' }}>
                        <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: s.tone }} fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="m3 8.5 3.2 3.2L13 5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="px-6 pb-6">
                  <button
                    type="button"
                    onClick={() => {
                      const map: Record<string, [PortalView, string]> = {
                        Scyther: ['DONOR', 'DONOR'],
                        Crucible: ['LAB', 'LAB_TECH'],
                        Torrent: ['TRANSIT', 'LOGISTICS_COURIER'],
                        Aegis: ['CLINICAL', 'CLINICAL_STAFF'],
                        Rubric: ['OPERATIONS', 'NATIONAL_OPERATOR'],
                        'Ledger Explorer': ['LEDGER', 'AUDITOR']
                      };
                      const [view, role] = map[s.n];
                      launch(view, role);
                    }}
                    className="w-full py-2.5 rounded-lg text-[12.5px] font-semibold transition-colors inline-flex items-center justify-center gap-2"
                    style={{ background: 'hsl(36 45.5% 97.8%)', border: '1px solid hsl(192 16.7% 88.2%)', color: 'hsl(203 21.6% 19%)' }}
                  >
                    Open {s.n}
                    <span aria-hidden="true">→</span>
                  </button>
                </div>
              </article>
            ))}
          </div>

          <p className="bcp-mono text-[11.5px] mt-8" style={{ color: 'hsl(202 14% 42%)' }}>
            Codenames are ours. Customers see the function, not the name — donor engine, collection and
            testing, cold chain, bedside safety, inventory, trust layer.
          </p>
        </div>
      </section>

      {/* ── trust layer ────────────────────────────────────────────────────── */}
      <section id="trust" className="bcp-anchor" style={{ background: 'hsl(40 100% 99.4%)', borderTop: '1px solid hsl(192 16.7% 88.2%)', borderBottom: '1px solid hsl(192 16.7% 88.2%)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-3xl mb-10">
            <p className="bcp-mono text-[11.5px] uppercase tracking-[0.16em] bcp-crimson mb-3">Transparent audit</p>
            <h2 className="bcp-serif text-[34.0px] sm:text-[42.0px] font-semibold leading-tight tracking-[-0.015em]">
              The trust layer.
            </h2>
            <p className="mt-4 text-[16.0px] leading-relaxed" style={{ color: 'hsl(202 15.5% 38%)' }}>
              A non-identifying record of custody that can be put in front of a regulator. It demonstrates an
              unbroken chain of custody without exposing a donor's or a patient's identity.
            </p>
          </div>

          <div
            className="rounded-2xl p-5 sm:p-6 mb-10 flex gap-4"
            style={{ background: 'hsl(351 60% 96.5%)', border: '1px solid hsl(351 68.2% 39.4% / 0.22)' }}
          >
            <svg viewBox="0 0 20 20" className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'hsl(351 68.2% 39.4%)' }} fill="none" stroke="currentColor" strokeWidth="1.7">
              <circle cx="10" cy="10" r="7.4" />
              <path d="M10 6.6v4.2M10 13.4h.01" strokeLinecap="round" />
            </svg>
            <div>
              <p className="text-[13.5px] font-semibold mb-1.5">What this is today.</p>
              <p className="text-[13.0px] leading-relaxed" style={{ color: 'hsl(202 15.5% 38%)' }}>
                The audit log is a working part of the platform: every custody event is written to a
                hash-chained log, and altering a past record breaks verification. A distributed ledger spanning
                separate institutions is designed for, and is <strong style={{ color: 'hsl(203 21.6% 19%)' }}>not part of the current build</strong> —
                which is why we call it an audit log, not a blockchain.
              </p>
            </div>
          </div>

          <div className="bcp-card rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr style={{ background: 'hsl(36 45.5% 97.8%)' }}>
                    {['Stage', 'Event', 'What is recorded', 'Guard'].map(h => (
                      <th key={h} className="bcp-mono text-[10.5px] uppercase tracking-[0.12em] px-5 py-3.5 font-medium" style={{ color: 'hsl(202 14% 42%)', borderBottom: '1px solid hsl(192 16.7% 88.2%)' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ledgerRows.map(r => (
                    <tr key={r.stage} className="bcp-row transition-colors">
                      <td className="px-5 py-4 whitespace-nowrap" style={{ borderBottom: '1px solid hsl(192 16.7% 88.2%)' }}>
                        <span className="inline-flex items-center gap-2 text-[13.0px] font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: r.stageTone }} />
                          {r.stage}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-[13.0px] font-medium" style={{ borderBottom: '1px solid hsl(192 16.7% 88.2%)' }}>
                        {r.event}
                      </td>
                      <td className="px-5 py-4 bcp-mono text-[11.5px]" style={{ color: 'hsl(202 15.5% 38%)', borderBottom: '1px solid hsl(192 16.7% 88.2%)' }}>
                        {r.payload}
                      </td>
                      <td className="px-5 py-4 text-[12.5px]" style={{ color: 'hsl(202 15.5% 38%)', borderBottom: '1px solid hsl(192 16.7% 88.2%)' }}>
                        {r.guard}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p className="bcp-mono text-[11.5px] mt-4" style={{ color: 'hsl(202 14% 42%)' }}>
            Event schema across the vein-to-vein lifecycle. No donor or patient identifier is written here.
          </p>
        </div>
      </section>

      {/* ── first market ───────────────────────────────────────────────────── */}
      <section id="market" className="bcp-anchor">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-3xl mb-10">
            <p className="bcp-mono text-[11.5px] uppercase tracking-[0.16em] bcp-crimson mb-3">First market</p>
            <h2 className="bcp-serif text-[34.0px] sm:text-[42.0px] font-semibold leading-tight tracking-[-0.015em]">
              Designed for Botswana's referral network.
            </h2>
            <p className="mt-4 text-[16.0px] leading-relaxed" style={{ color: 'hsl(202 15.5% 38%)' }}>
              Botswana collects roughly 24,000–28,000 units a year against a 40,000–45,000 requirement. A 2025
              WHO assessment documented fragmented coordination and no national haemovigilance system. The need
              is published, the system is centralised enough to digitise, and the country has the connectivity
              and governance to lead — which is why we start here rather than somewhere easier.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7">
              <div className="bcp-card rounded-2xl overflow-hidden">
                {facilities.map((f, i) => (
                  <div
                    key={f.name}
                    className="bcp-row transition-colors px-5 py-4 flex items-center justify-between gap-4"
                    style={{ borderTop: i === 0 ? 'none' : '1px solid hsl(192 16.7% 88.2%)' }}
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      <svg viewBox="0 0 20 20" className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'hsl(351 68.2% 39.4%)' }} fill="none" stroke="currentColor" strokeWidth="1.7">
                        <path d="M10 17s6-5.1 6-9.2A6 6 0 0 0 4 7.8C4 11.9 10 17 10 17Z" strokeLinejoin="round" />
                        <circle cx="10" cy="7.6" r="1.9" />
                      </svg>
                      <div className="min-w-0">
                        <p className="text-[14.0px] font-semibold truncate">{f.name}</p>
                        <p className="text-[12.0px] mt-0.5" style={{ color: 'hsl(202 15.5% 38%)' }}>
                          {f.place} · {f.role}
                        </p>
                      </div>
                    </div>
                    <span className="bcp-chip bcp-mono text-[10.5px] px-2.5 py-1 rounded whitespace-nowrap shrink-0" style={{ borderRadius: 6 }}>
                      Target site
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-[12.5px] mt-4 leading-relaxed" style={{ color: 'hsl(202 15.5% 38%)' }}>
                <strong style={{ color: 'hsl(203 21.6% 19%)' }}>These are target sites for the pilot design.</strong>{' '}
                No facility agreement, ministry endorsement or connection is claimed — the gates below are the
                work that stands between this design and a real pilot.
              </p>
            </div>

            <div className="lg:col-span-5 flex flex-col gap-4">
              <div className="bcp-card rounded-2xl p-2.5">
                <div className="overflow-hidden rounded-xl aspect-[16/9] relative">
                  <img src={CORRIDOR_IMAGE} alt="A hospital emergency and trauma wing" className="w-full h-full object-cover" referrerPolicy="no-referrer" loading="lazy" />
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, hsl(203 21.6% 19% / 0.62), transparent 58%)' }} />
                  <span className="absolute bottom-3 left-3.5 bcp-mono text-[11.5px] text-white">
                    Illustrative — national referral corridor
                  </span>
                </div>
              </div>
              <div className="bcp-card rounded-2xl p-5">
                <p className="bcp-mono text-[10.5px] uppercase tracking-[0.13em] mb-2" style={{ color: 'hsl(202 14% 42%)' }}>
                  Storage specification
                </p>
                <p className="bcp-serif text-[30.0px] font-semibold leading-none">2.0 – 6.0 °C</p>
                <p className="text-[12.5px] mt-2 leading-relaxed" style={{ color: 'hsl(202 15.5% 38%)' }}>
                  The red-cell storage window. Telemetry is checked against each unit's own stored range rather
                  than one global constant, so a unit with a tighter spec is held to its own.
                </p>
              </div>
              <div className="bcp-card rounded-2xl p-5">
                <p className="bcp-mono text-[10.5px] uppercase tracking-[0.13em] mb-2" style={{ color: 'hsl(202 14% 42%)' }}>
                  Corridor footprint
                </p>
                <p className="bcp-serif text-[30.0px] font-semibold leading-none">4 sites · 4 districts</p>
                <p className="text-[12.5px] mt-2 leading-relaxed" style={{ color: 'hsl(202 15.5% 38%)' }}>
                  A national referral hospital, a northern trauma centre, a district depot and a north-west
                  transit outpost — the shape of corridor the design is built to hold.
                </p>
              </div>
            </div>
          </div>

          {/* pilot readiness — the gates, stated plainly */}
          <div className="mt-14">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
              <div>
                <p className="bcp-mono text-[11.5px] uppercase tracking-[0.16em] mb-2" style={{ color: 'hsl(202 15.5% 38%)' }}>
                  Pilot readiness
                </p>
                <h3 className="bcp-serif text-[24.0px] font-semibold leading-tight">A pilot is not a demo.</h3>
              </div>
              <p className="text-[12.5px] max-w-md" style={{ color: 'hsl(202 15.5% 38%)' }}>
                Six gates must close before a single real record is processed. We work them in order, and we do
                not claim any of them as complete.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {gates.map(g => (
                <div key={g.k} className="bcp-card rounded-xl p-4">
                  <p className="bcp-mono text-[11.5px] font-semibold bcp-crimson mb-1.5">{g.k}</p>
                  <p className="text-[13.5px] font-semibold mb-1">{g.t}</p>
                  <p className="text-[12.0px] leading-relaxed" style={{ color: 'hsl(202 15.5% 38%)' }}>
                    {g.d}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── why now ────────────────────────────────────────────────────────── */}
      <section style={{ background: 'hsl(40 100% 99.4%)', borderTop: '1px solid hsl(192 16.7% 88.2%)', borderBottom: '1px solid hsl(192 16.7% 88.2%)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-3xl mb-10">
            <p className="bcp-mono text-[11.5px] uppercase tracking-[0.16em] bcp-crimson mb-3">The problem & the window</p>
            <h2 className="bcp-serif text-[34.0px] sm:text-[42.0px] font-semibold leading-tight tracking-[-0.015em]">
              Why this, why now.
            </h2>
            <p className="mt-4 text-[16.0px] leading-relaxed" style={{ color: 'hsl(202 15.5% 38%)' }}>
              Blood cannot be manufactured. It must be given by a person, kept inside a narrow temperature
              window, used before it expires and matched exactly to the patient — yet much of the world still
              runs it on paper, phone calls and guesswork. Units expire in over-stocked urban cold rooms while
              rural mothers bleed because the right unit was not where it was needed. That is a coordination
              failure, and it is solvable.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { v: '~1 in 5', k: 'Adult HIV prevalence', d: 'Residual window-period risk makes screening a first-order blood-safety issue.' },
              { v: '630 km', k: 'The A1 corridor', d: "Botswana's deadliest traffic route — and its standing trauma demand." },
              { v: '1% of population', k: 'Donation benchmark', d: 'The widely-cited target; most systems in the region collect far below it.' },
              { v: '3×', k: 'Rwanda, 2000–2018', d: 'Donations tripled on a centralised, electronically monitored service (WHO).' }
            ].map(c => (
              <div key={c.k} className="bcp-card rounded-xl p-5">
                <p className="bcp-serif text-[27.0px] font-semibold leading-none mb-2">{c.v}</p>
                <p className="text-[12.5px] font-semibold mb-1.5">{c.k}</p>
                <p className="text-[12.0px] leading-relaxed" style={{ color: 'hsl(202 15.5% 38%)' }}>
                  {c.d}
                </p>
              </div>
            ))}
          </div>

          <p className="text-[12.5px] mt-6 max-w-3xl leading-relaxed" style={{ color: 'hsl(202 15.5% 38%)' }}>
            Figures are from published sources cited in the concept note. Rwanda is cited as a validated
            analogue for the components — centralised storage, electronic monitoring, on-demand fulfilment —
            not for mortality outcomes, which are observational and coincide with wider health-system
            investment. Where no reliable figure exists we mark a value as an assumption rather than present it
            as fact. We would rather be trusted than impressive.
          </p>
        </div>
      </section>

      {/* ── architecture ───────────────────────────────────────────────────── */}
      <section id="architecture" className="bcp-anchor">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-3xl mb-12">
            <p className="bcp-mono text-[11.5px] uppercase tracking-[0.16em] bcp-crimson mb-3">Foundations</p>
            <h2 className="bcp-serif text-[34.0px] sm:text-[42.0px] font-semibold leading-tight tracking-[-0.015em]">
              Architecture & security.
            </h2>
            <p className="mt-4 text-[16.0px] leading-relaxed" style={{ color: 'hsl(202 15.5% 38%)' }}>
              Built for sovereign health governance: one source of truth, deterministic clinical rules, and no
              personal data in the audit log.
            </p>
          </div>

          {/* the journey */}
          <div className="bcp-card rounded-2xl p-6 sm:p-8 mb-10">
            <p className="bcp-mono text-[11px] uppercase tracking-[0.14em] mb-6" style={{ color: 'hsl(202 14% 42%)' }}>
              Vein to vein
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 sm:gap-4">
              {[
                { n: '01', t: 'Citizen donation', d: 'Donor intake and DIN assignment' },
                { n: '02', t: 'Five-panel screening', d: 'Infectious clearance and fractionation' },
                { n: '03', t: 'Cold-chain transit', d: 'Continuous temperature monitoring' },
                { n: '04', t: 'Bedside verification', d: 'Dual-clinician check and transfusion' }
              ].map((s, i) => (
                <div key={s.n} className="relative">
                  <div className="flex items-center gap-3 mb-3">
                    <span
                      className="bcp-mono text-[11px] font-semibold w-7 h-7 rounded-full grid place-items-center shrink-0"
                      style={{ background: 'hsl(351 60% 96.5%)', color: 'hsl(351 68.2% 39.4%)', border: '1px solid hsl(351 68.2% 39.4% / 0.25)' }}
                    >
                      {s.n}
                    </span>
                    {i < 3 && <span className="hidden sm:block flex-1 h-px" style={{ background: 'hsl(192 16.7% 88.2%)' }} />}
                  </div>
                  <p className="text-[13.5px] font-semibold">{s.t}</p>
                  <p className="text-[12.0px] mt-1 leading-snug" style={{ color: 'hsl(202 15.5% 38%)' }}>
                    {s.d}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[
              {
                t: 'No donor PII in the audit log',
                d: 'Donors are held as irreversible pseudonymous hashes. Real identities stay inside the operator’s own systems and are never written to the log.'
              },
              {
                t: 'Hash-chained audit log',
                d: 'Every custody event is chained to the one before it. Altering any past record breaks verification, and the platform can demonstrate that rather than assert it.'
              },
              {
                t: 'Cold-chain range guard',
                d: 'Telemetry is checked against the unit’s own stored range. A breach quarantines the unit and raises an incident automatically — the platform applies the consequence, not just reports it.'
              },
              {
                t: 'Deterministic clinical rules',
                d: 'Compatibility and state transitions are pure functions with tests behind them. No model output enters the clinical decision path, by design and by policy.'
              }
            ].map(c => (
              <div key={c.t} className="bcp-card rounded-2xl p-6">
                <div
                  className="w-9 h-9 rounded-lg grid place-items-center mb-4"
                  style={{ background: 'hsl(351 60% 96.5%)', border: '1px solid hsl(351 68.2% 39.4% / 0.2)' }}
                >
                  <svg viewBox="0 0 20 20" className="w-[18px] h-[18px]" style={{ color: 'hsl(351 68.2% 39.4%)' }} fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M10 2.8 16 5v5c0 4-2.6 6.3-6 7.4-3.4-1.1-6-3.4-6-7.4V5l6-2.2Z" strokeLinejoin="round" />
                  </svg>
                </div>
                <h3 className="bcp-serif text-[19.0px] font-semibold mb-2">{c.t}</h3>
                <p className="text-[13.0px] leading-relaxed" style={{ color: 'hsl(202 15.5% 38%)' }}>
                  {c.d}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── briefing ───────────────────────────────────────────────────────── */}
      <section id="briefing" className="bcp-anchor" style={{ background: 'hsl(203 21.6% 19%)', color: '#fff' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-5">
              <p className="bcp-mono text-[11.5px] uppercase tracking-[0.16em] mb-3" style={{ color: 'hsl(351 75% 68%)' }}>
                Executive briefing
              </p>
              <h2 className="bcp-serif text-[34.0px] sm:text-[40.0px] font-semibold leading-tight tracking-[-0.015em]">
                For national blood services, ministries and funders.
              </h2>
              <p className="mt-5 text-[15.0px] leading-relaxed" style={{ color: 'hsl(40 21.4% 82%)' }}>
                Bloodchain sells one country at a time and is built to replicate across a bloc. The concept note
                sets out the problem, the seven modules, the market anchors and the ask — with every uncertainty
                marked rather than smoothed over.
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-8">
                <a
                  href={MAILTO}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-lg text-[13.5px] font-semibold transition-colors"
                  style={{ background: '#fff', color: 'hsl(203 21.6% 19%)' }}
                >
                  Request the briefing pack
                  <span aria-hidden="true">→</span>
                </a>
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-lg text-[13.5px] font-semibold transition-colors"
                  style={{ border: '1px solid hsl(40 21.4% 94.5% / 0.28)', color: '#fff' }}
                >
                  Email the founder
                </a>
              </div>
              <p className="bcp-mono text-[11.5px] mt-5" style={{ color: 'hsl(40 21.4% 94.5% / 0.6)' }}>
                Concept note and pilot readiness pack available on request.
              </p>
            </div>

            <div className="lg:col-span-7">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { v: '2–6 °C', t: 'Range guard', d: 'Continuous temperature telemetry across every transit leg, checked against each unit’s stored range.' },
                  { v: 'Dual-scan', t: 'Bedside check', d: 'Two authenticated clinicians verify patient wristband against unit DIN before release.' },
                  { v: 'ISBT 128', t: 'Standardised identity', d: 'Universal DIN labelling for unambiguous vein-to-vein tracking across depots.' },
                  { v: 'No PII', t: 'Privacy by design', d: 'No donor or patient identifier is written to the audit log. Identities stay in the operator’s own systems.' }
                ].map(c => (
                  <div
                    key={c.t}
                    className="rounded-xl p-5"
                    style={{ background: 'hsl(40 21.4% 94.5% / 0.06)', border: '1px solid hsl(40 21.4% 94.5% / 0.14)' }}
                  >
                    <p className="bcp-serif text-[24.0px] font-semibold leading-none mb-2">{c.v}</p>
                    <p className="bcp-mono text-[11px] uppercase tracking-[0.12em] mb-2.5" style={{ color: 'hsl(351 75% 68%)' }}>
                      {c.t}
                    </p>
                    <p className="text-[12.5px] leading-relaxed" style={{ color: 'hsl(40 21.4% 88%)' }}>
                      {c.d}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── footer ─────────────────────────────────────────────────────────── */}
      <footer className="bcp-hair" style={{ background: 'hsl(36 45.5% 97.8%)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
            <div className="md:col-span-5">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-9 h-9 rounded-full grid place-items-center shrink-0" style={{ background: 'hsl(351 68.2% 39.4%)' }} aria-hidden="true">
                  <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="none" stroke="#fff" strokeWidth="1.9">
                    <path d="M12 3.4c3.2 3.6 5.6 6.6 5.6 9.6a5.6 5.6 0 1 1-11.2 0c0-3 2.4-6 5.6-9.6Z" strokeLinejoin="round" />
                  </svg>
                </span>
                <span>
                  <span className="block bcp-serif text-[18.0px] font-semibold leading-none">Bloodchain</span>
                  <span className="block bcp-mono text-[10.5px] uppercase tracking-[0.13em] mt-1.5" style={{ color: 'hsl(202 15.5% 38%)' }}>
                    A national blood resilience platform
                  </span>
                </span>
              </div>
              <p className="text-[12.5px] leading-relaxed max-w-md" style={{ color: 'hsl(202 15.5% 38%)' }}>
                One governed platform for the vein-to-vein blood supply chain: donor growth, cold-chain
                assurance, bedside safety, haemovigilance and national analytics.
              </p>
            </div>

            <div className="md:col-span-3">
              <p className="bcp-mono text-[11px] uppercase tracking-[0.13em] mb-4" style={{ color: 'hsl(202 14% 42%)' }}>
                Platform
              </p>
              <ul className="space-y-2.5 text-[13.0px]">
                {nav.map(n => (
                  <li key={n.id}>
                    <a href={`#${n.id}`} className="transition-colors hover:opacity-70" style={{ color: 'hsl(202 15.5% 38%)' }}>
                      {n.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="md:col-span-4">
              <p className="bcp-mono text-[11px] uppercase tracking-[0.13em] mb-4" style={{ color: 'hsl(202 14% 42%)' }}>
                Contact
              </p>
              <ul className="space-y-2.5 text-[13.0px]" style={{ color: 'hsl(202 15.5% 38%)' }}>
                <li>Gift Jr Letso Nakedi, Founder</li>
                <li>
                  <a href={`mailto:${CONTACT_EMAIL}`} className="hover:opacity-70" style={{ color: 'hsl(351 68.2% 39.4%)' }}>
                    {CONTACT_EMAIL}
                  </a>
                </li>
                <li>{SITE}</li>
                <li>Gaborone, Botswana</li>
              </ul>
            </div>
          </div>

          {/* the one status disclosure */}
          <div className="mt-12 bcp-hair pt-6">
            <p className="text-[12.0px] leading-relaxed max-w-4xl" style={{ color: 'hsl(202 15.5% 38%)' }}>
              <strong style={{ color: 'hsl(203 21.6% 19%)' }}>Status.</strong> Bloodchain is in build. The
              platform is demonstrated on illustrative data, and no pilot deployment, institutional partnership
              or facility agreement is claimed. Figures are from published sources; modelled values are marked
              as assumptions. A distributed ledger is designed for but is not part of the current build.
            </p>
          </div>

          <div className="mt-8 bcp-hair pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 bcp-mono text-[11.5px]" style={{ color: 'hsl(202 14% 42%)' }}>
              <span>ISBT 128 DIN standard</span>
              <span aria-hidden="true" style={{ color: 'hsl(192 16.7% 80%)' }}>·</span>
              <span>WHO-aligned transfusion safety practice</span>
              <span aria-hidden="true" style={{ color: 'hsl(192 16.7% 80%)' }}>·</span>
              <span>No donor PII in the audit log</span>
            </div>
            <p className="bcp-mono text-[11.5px]" style={{ color: 'hsl(202 14% 42%)' }}>
              © 2026 Bloodchain · Gaborone
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Portal;
