import React from 'react';

const HERO_IMAGE = '/images/hero_audit_blood_grid_1791309472035.jpg';
const DONOR_IMAGE = '/images/donor_blood_drive_1791309652490.jpg';
const LAB_IMAGE = '/images/laboratory_fractionation_serology_1791309504388.jpg';
const LOGISTICS_IMAGE = '/images/iot_cold_chain_transit_1791309495139.jpg';
const BEDSIDE_IMAGE = '/images/bedside_clinical_transfusion_1791309482591.jpg';
const OPS_IMAGE = '/images/situation_room_ops_1791309668046.jpg';
const LEDGER_IMAGE = '/images/ledger_security_vault_1791309692752.jpg';

const CONTACT_EMAIL = 'giftjrnakedi@gmail.com';

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
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  .bcp-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 28px -10px hsl(203 21.6% 19% / 0.08);
  }
  .bcp-line { border-color: hsl(var(--line)); }
  .bcp-crimson { color: hsl(var(--crimson)); }
  .bcp-btn-primary {
    background: hsl(var(--crimson));
    color: #fff;
    box-shadow: 0 2px 4px hsl(351 68.2% 39.4% / 0.25), 0 8px 24px -6px hsl(351 68.2% 39.4% / 0.45);
    transition: background 0.18s ease, transform 0.18s ease;
  }
  .bcp-btn-primary:hover {
    background: hsl(351 68.2% 34%);
    transform: translateY(-1px);
  }
  .bcp-btn-ghost {
    background: hsl(var(--card));
    color: hsl(var(--ink));
    border: 1px solid hsl(var(--line));
    transition: border-color 0.18s ease, color 0.18s ease;
  }
  .bcp-btn-ghost:hover {
    border-color: hsl(var(--crimson) / 0.45);
    color: hsl(var(--crimson));
  }
  .bcp-chip {
    border: 1px solid hsl(var(--line));
    background: hsl(var(--card));
    color: hsl(var(--ink-soft));
  }
  .bcp-hair { border-top: 1px solid hsl(var(--line)); }
  .bcp-anchor { scroll-margin-top: 84px; }
  .bcp-hairline-grid {
    background-image:
      repeating-linear-gradient(0deg, hsl(var(--ink) / 0.04) 0 1px, transparent 1px 64px),
      repeating-linear-gradient(90deg, hsl(var(--ink) / 0.04) 0 1px, transparent 1px 64px);
  }
  @media (max-width: 640px) {
    .bcp-hide-sm { display: none; }
  }
`;

export const Portal: React.FC = () => {
  const nav = [
    { id: 'overview', label: 'Overview' },
    { id: 'platform', label: 'Platform' },
    { id: 'impact', label: 'Impact' },
    { id: 'roadmap', label: 'Roadmap' },
    { id: 'contact', label: 'Contact' }
  ];

  const pillars = [
    {
      title: 'Donor Engagement & Registry',
      badge: 'Donors',
      image: DONOR_IMAGE,
      alt: 'A blood donor giving blood in a modern clinic',
      tone: 'hsl(351 68.2% 39.4%)',
      summary: 'Empowering voluntary citizens with frictionless appointment booking, digital health cards, and verified notifications when their gift saves a life.',
      highlights: [
        'Instant digital bloodcard & donation history',
        'Transparent donor impact tracking'
      ]
    },
    {
      title: 'Intelligent Lab & Testing',
      badge: 'Testing',
      image: LAB_IMAGE,
      alt: 'A laboratory technologist inspecting blood components',
      tone: 'hsl(215 70% 42%)',
      summary: 'Digital quarantine by default. Complete end-to-end sample screening, multi-panel clearance, component fractionation, and cryptographic release gates.',
      highlights: [
        'Automated multi-panel infectious disease clearance',
        'Guaranteed release locks preventing unsafe issuance'
      ]
    },
    {
      title: 'Smart Cold-Chain Logistics',
      badge: 'Transit',
      image: LOGISTICS_IMAGE,
      alt: 'A monitored blood transport cooler in transit',
      tone: 'hsl(35 85% 40%)',
      summary: 'Real-time transit monitoring with intelligent thermal excursion alarms and cryptographic custody handovers between dispatchers, couriers, and hospital wards.',
      highlights: [
        'Active temperature & GPS telemetry tracking',
        'Signed chain-of-custody handovers at every transit leg'
      ]
    },
    {
      title: 'Bedside Transfusion Safety',
      badge: 'Clinical',
      image: BEDSIDE_IMAGE,
      alt: 'A nurse scanning a blood unit at a patient bedside',
      tone: 'hsl(160 55% 33%)',
      summary: 'Preventing adverse clinical events with dual-clinician bedside verification, instant wristband-to-bag barcode crossmatching, and real-time hemovigilance.',
      highlights: [
        'Dual-clinician digital crossmatch confirmation',
        'Closed-loop hemovigilance & adverse reaction alerts'
      ]
    },
    {
      title: 'National Operations Command',
      badge: 'Operations',
      image: OPS_IMAGE,
      alt: 'An operations room monitoring national supply data',
      tone: 'hsl(280 45% 42%)',
      summary: 'A unified executive operations console tracking nationwide stock levels, automated deficit alerts, and algorithmic rebalancing across hospitals.',
      highlights: [
        'Predictive shortage warnings & inventory forecasting',
        'Inter-hospital rapid requisition conductor'
      ]
    },
    {
      title: 'Immutable Trust Layer',
      badge: 'Trust Layer',
      image: LEDGER_IMAGE,
      alt: 'Secure data storage infrastructure',
      tone: 'hsl(203 21.6% 32%)',
      summary: 'Cryptographically sealed audit trail proving the provenance and unbroken custody of every unit from donation to transfusion, completely free of patient PII.',
      highlights: [
        'Tamper-evident SHA-256 hash-chained audit trail',
        'Strict zero-PII privacy architecture'
      ]
    }
  ];

  const stakeholders = [
    {
      role: 'For Citizens & Donors',
      icon: (
        <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" strokeLinejoin="round" />
        </svg>
      ),
      tagline: 'Transparency, pride, and life-saving empowerment.',
      points: [
        'Effortless appointment booking and digital bloodcard credentials.',
        'Follow your blood journey: know when your donation is utilized.',
        'Privacy-first citizen data protection and consent.'
      ]
    },
    {
      role: 'For Hospitals & Clinicians',
      icon: (
        <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      tagline: 'Zero-mistake transfusion safety and instant fulfillment.',
      points: [
        'Fast emergency requisitions fulfilled in minutes, not hours.',
        'Bedside barcode scanning to eliminate transfusion mismatches.',
        'Guaranteed blood viability and certified lab testing history.'
      ]
    },
    {
      role: 'For Health Authorities & Ministries',
      icon: (
        <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" strokeLinejoin="round" />
        </svg>
      ),
      tagline: 'Sovereign resilience, eliminated waste, and total oversight.',
      points: [
        'Real-time national inventory intelligence across all districts.',
        'Eliminate expensive discard rates and cold-chain spoilage.',
        'Unbroken regulatory audit trail aligned to international standards.'
      ]
    },
    {
      role: 'For Investors & Partners',
      icon: (
        <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      tagline: 'A defensible, scalable healthcare infrastructure asset.',
      points: [
        'High-barrier-to-entry digital health operating system.',
        'Massive pan-African and emerging-market expansion potential.',
        'Mission-driven venture delivering high social impact and institutional stickiness.'
      ]
    }
  ];

  const timelineSteps = [
    {
      num: '01',
      phase: 'Phase 1',
      status: 'Pilot',
      title: 'Pilot in 4 Flagship Institutions',
      desc: 'Initial clinical deployment across 4 premier referral and trauma hospitals to validate end-to-end cold chain, digital crossmatching, and donor mobilization.',
      focus: 'Clinical safety verification & workflow calibration'
    },
    {
      num: '02',
      phase: 'Phase 2',
      status: 'National',
      title: 'National Corridor Rollout',
      desc: 'Full countrywide expansion linking regional blood banks, district trauma depots, and courier transport routes into one synchronized operating network.',
      focus: 'Nationwide inventory balancing & zero cold-chain waste'
    },
    {
      num: '03',
      phase: 'Phase 3',
      status: 'Regional',
      title: 'Regional Corridor Integration',
      desc: 'Harmonizing cross-border medical supply corridors across SADC to enable mutual aid, emergency deficit sharing, and standardized ISBT 128 provenance.',
      focus: 'Inter-state emergency resilience & shared stockpiles'
    },
    {
      num: '04',
      phase: 'Phase 4',
      status: 'Scale',
      title: 'Continental Health Infrastructure',
      desc: 'Scaling the proven operating blueprint across emerging healthcare markets to establish an open, sovereign digital standard for national blood safety.',
      focus: 'Eliminating maternal & trauma mortality from shortages'
    }
  ];

  return (
    <div className="bcp min-h-screen">
      <style>{css}</style>

      {/* ── Navigation Bar ─────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-50 backdrop-blur-md"
        style={{ background: 'hsl(36 45.5% 97.8% / 0.92)', borderBottom: '1px solid hsl(192 16.7% 88.2%)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[72px] flex items-center justify-between gap-4">
          <a href="#overview" className="flex items-center gap-3 shrink-0">
            <span
              className="w-10 h-10 rounded-full grid place-items-center shrink-0 shadow-sm"
              style={{ background: 'hsl(351 68.2% 39.4%)' }}
              aria-hidden="true"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="#fff" strokeWidth="2">
                <path d="M12 3.4c3.2 3.6 5.6 6.6 5.6 9.6a5.6 5.6 0 1 1-11.2 0c0-3 2.4-6 5.6-9.6Z" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="leading-none">
              <span className="block bcp-serif text-[21.0px] font-semibold tracking-tight" style={{ color: 'hsl(203 21.6% 19%)' }}>
                Bloodchain
              </span>
              <span className="block bcp-mono text-[10.5px] uppercase tracking-[0.15em] mt-1" style={{ color: 'hsl(351 68.2% 39.4%)' }}>
                Vein-to-Vein Infrastructure
              </span>
            </span>
          </a>

          <nav className="hidden md:flex items-center gap-2 bcp-hide-sm">
            {nav.map(item => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="px-3.5 py-2 text-[13.5px] font-medium rounded-lg transition-colors"
                style={{ color: 'hsl(202 15.5% 38%)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'hsl(351 68.2% 39.4%)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'hsl(202 15.5% 38%)')}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <a
              href="#contact"
              className="bcp-btn-primary px-5 py-2.5 rounded-lg text-[13.5px] font-semibold whitespace-nowrap"
            >
              Get in Touch
            </a>
          </div>
        </div>
      </header>

      {/* ── Hero Section ───────────────────────────────────────────────────── */}
      <section id="overview" className="bcp-anchor relative overflow-hidden pt-16 pb-24">
        <div className="absolute inset-0 bcp-hairline-grid pointer-events-none opacity-60" />
        <div
          className="absolute -top-36 right-0 w-[50rem] h-[50rem] rounded-full blur-[140px] pointer-events-none"
          style={{ background: 'hsl(351 68.2% 39.4% / 0.08)' }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-7">
              <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bcp-chip text-[12.0px] font-medium">
                <span className="w-2 h-2 rounded-full" style={{ background: 'hsl(351 68.2% 39.4%)' }} />
                <span>Next-Generation National Blood Operating System</span>
              </div>

              <h1 className="bcp-serif text-[44.0px] sm:text-[56.0px] lg:text-[64.0px] font-semibold leading-[1.04] tracking-[-0.025em]">
                Every drop tracked.
                <br />
                <span className="bcp-crimson">Every life protected.</span>
              </h1>

              <p className="text-[17.5px] leading-relaxed max-w-xl" style={{ color: 'hsl(202 15.5% 38%)' }}>
                Bloodchain replaces opaque, fragmented blood supply chains with a unified digital infrastructure. Connecting donors, laboratories, cold-chain couriers, and hospital bedsides into one verified vein-to-vein network.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <a
                  href="#platform"
                  className="bcp-btn-primary px-6 py-3.5 rounded-xl text-[14.0px] font-semibold inline-flex items-center gap-2"
                >
                  Explore the Platform
                  <svg viewBox="0 0 20 20" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 10h12m-6-6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
                <a
                  href="#roadmap"
                  className="bcp-btn-ghost px-6 py-3.5 rounded-xl text-[14.0px] font-semibold"
                >
                  View Strategic Roadmap
                </a>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="relative rounded-3xl overflow-hidden bcp-card shadow-2xl p-2.5">
                <div className="overflow-hidden rounded-2xl aspect-[4/3] relative">
                  <img
                    src={HERO_IMAGE}
                    alt="Bloodchain intelligent vein-to-vein control network"
                    className="w-full h-full object-cover"
                    loading="eager"
                  />
                  <div
                    className="absolute inset-0"
                    style={{ background: 'linear-gradient(to top, hsl(203 21.6% 19% / 0.82) 0%, transparent 60%)' }}
                  />
                  <div className="absolute bottom-4 left-5 right-5 text-white">
                    <p className="bcp-mono text-[11.0px] uppercase tracking-[0.14em]" style={{ color: 'hsl(351 75% 72%)' }}>
                      Vein-to-Vein Architecture
                    </p>
                    <p className="bcp-serif text-[19.0px] font-semibold mt-1">
                      Complete visibility across donors, transit, and hospital care.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Key Metrics Strip */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { val: '100%', label: 'Traceability', desc: 'Continuous chain of custody from donation to infusion' },
              { val: 'Zero', label: 'Transfusion Errors', desc: 'Bedside dual-clinician digital crossmatch validation' },
              { val: '< 15 min', label: 'Emergency Dispatch', desc: 'Automated requisition fulfillment across trauma nodes' },
              { val: 'Real-Time', label: 'Deficit Forecasting', desc: 'Algorithmic inventory rebalancing before shortages hit' }
            ].map(m => (
              <div key={m.label} className="bcp-card rounded-2xl p-6">
                <p className="bcp-serif text-[32.0px] font-semibold leading-none bcp-crimson tabular-nums">{m.val}</p>
                <p className="text-[14.0px] font-semibold mt-2.5 text-slate-900">{m.label}</p>
                <p className="text-[12.5px] mt-1" style={{ color: 'hsl(202 15.5% 38%)' }}>{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Platform Showcase ──────────────────────────────────────────────── */}
      <section id="platform" className="bcp-anchor bcp-hair py-24" style={{ background: 'hsl(40 100% 99.4%)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-14">
            <p className="bcp-mono text-[11.5px] uppercase tracking-[0.16em] bcp-crimson mb-3 font-semibold">Unified Operating System</p>
            <h2 className="bcp-serif text-[36.0px] sm:text-[44.0px] font-semibold leading-tight tracking-[-0.015em]">
              Built for every link in the chain.
            </h2>
            <p className="mt-4 text-[16.5px] leading-relaxed" style={{ color: 'hsl(202 15.5% 38%)' }}>
              Bloodchain equips each healthcare role with dedicated tools, synchronized in real time through an intelligent shared spine. No more lost logs, spoiled bags, or delayed emergencies.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {pillars.map(p => (
              <article key={p.title} className="bcp-card rounded-2xl overflow-hidden flex flex-col">
                <div className="aspect-[16/9] relative overflow-hidden">
                  <img src={p.image} alt={p.alt} className="w-full h-full object-cover" loading="lazy" />
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, hsl(203 21.6% 19% / 0.65), transparent 55%)' }} />
                  <span
                    className="absolute top-3.5 right-3.5 bcp-mono text-[11.0px] font-semibold uppercase tracking-[0.1em] px-2.5 py-1 rounded-md shadow-sm"
                    style={{ background: 'hsl(40 100% 99.4%)', color: p.tone }}
                  >
                    {p.badge}
                  </span>
                </div>

                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="bcp-serif text-[22.0px] font-semibold leading-tight">{p.title}</h3>
                  <p className="text-[13.5px] leading-relaxed mt-3" style={{ color: 'hsl(202 15.5% 38%)' }}>
                    {p.summary}
                  </p>
                  <ul className="mt-5 pt-4 space-y-2.5 bcp-hair mt-auto">
                    {p.highlights.map(h => (
                      <li key={h} className="flex items-start gap-2.5 text-[12.8px]" style={{ color: 'hsl(202 15.5% 38%)' }}>
                        <svg viewBox="0 0 16 16" className="w-4 h-4 mt-0.5 shrink-0" style={{ color: p.tone }} fill="none" stroke="currentColor" strokeWidth="2.2">
                          <path d="m3 8.5 3.2 3.2L13 5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stakeholder Value Proposition (Sell to Users & Investors) ──────── */}
      <section id="impact" className="bcp-anchor bcp-hair py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-14">
            <p className="bcp-mono text-[11.5px] uppercase tracking-[0.16em] bcp-crimson mb-3 font-semibold">Transformative Value</p>
            <h2 className="bcp-serif text-[36.0px] sm:text-[44.0px] font-semibold leading-tight tracking-[-0.015em]">
              Designed to create value for every participant.
            </h2>
            <p className="mt-4 text-[16.5px] leading-relaxed" style={{ color: 'hsl(202 15.5% 38%)' }}>
              Whether you are a voluntary donor giving for the first time, a surgeon in the trauma bay, or an institutional investor backing national health infrastructure, Bloodchain delivers clear outcomes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {stakeholders.map(s => (
              <div key={s.role} className="bcp-card rounded-2xl p-7">
                <div className="flex items-center gap-3.5 mb-4">
                  <div
                    className="w-11 h-11 rounded-xl grid place-items-center shrink-0"
                    style={{ background: 'hsl(351 60% 96.5%)', color: 'hsl(351 68.2% 39.4%)', border: '1px solid hsl(351 68.2% 39.4% / 0.2)' }}
                  >
                    {s.icon}
                  </div>
                  <div>
                    <h3 className="bcp-serif text-[21.0px] font-semibold">{s.role}</h3>
                    <p className="text-[13.0px] font-medium" style={{ color: 'hsl(351 68.2% 39.4%)' }}>
                      {s.tagline}
                    </p>
                  </div>
                </div>

                <ul className="mt-4 space-y-2.5">
                  {s.points.map(pt => (
                    <li key={pt} className="flex items-start gap-2.5 text-[13.2px]" style={{ color: 'hsl(202 15.5% 38%)' }}>
                      <span className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" style={{ background: 'hsl(351 68.2% 39.4%)' }} />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Horizontal Checkpoint Timeline Roadmap ─────────────────────────── */}
      <section id="roadmap" className="bcp-anchor bcp-hair py-24" style={{ background: 'hsl(40 100% 99.4%)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-16">
            <p className="bcp-mono text-[11.5px] uppercase tracking-[0.16em] bcp-crimson font-semibold mb-3">Strategic Roadmap</p>
            <h2 className="bcp-serif text-[36.0px] sm:text-[44.0px] font-semibold leading-tight tracking-[-0.015em]">
              Our Rollout Plan
            </h2>
            <p className="mt-4 text-[16.5px] leading-relaxed" style={{ color: 'hsl(202 15.5% 38%)' }}>
              A disciplined, phased deployment strategy scaling from verified clinical pilot validation to national and continental health infrastructure.
            </p>
          </div>

          {/* Horizontal Checkpoint Timeline */}
          <div className="relative">
            {/* Horizontal timeline bar for desktop */}
            <div
              className="hidden lg:block absolute top-[28px] left-[5%] right-[5%] h-[2px]"
              style={{ background: 'hsl(192 16.7% 85%)', zIndex: 0 }}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
              {timelineSteps.map((step, idx) => (
                <div key={step.phase} className="bcp-card rounded-2xl p-6 flex flex-col justify-between">
                  <div>
                    {/* Checkpoint Badge & Number */}
                    <div className="flex items-center justify-between mb-5">
                      <span
                        className="w-12 h-12 rounded-full grid place-items-center bcp-serif text-[18px] font-bold shadow-sm"
                        style={{
                          background: idx === 0 ? 'hsl(351 68.2% 39.4%)' : 'hsl(40 100% 99.4%)',
                          color: idx === 0 ? '#fff' : 'hsl(351 68.2% 39.4%)',
                          border: '2px solid hsl(351 68.2% 39.4%)'
                        }}
                      >
                        {step.num}
                      </span>
                      <span
                        className="bcp-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] px-2.5 py-1 rounded"
                        style={{
                          background: idx === 0 ? 'hsl(351 60% 96.5%)' : 'hsl(192 16.7% 92%)',
                          color: idx === 0 ? 'hsl(351 68.2% 39.4%)' : 'hsl(202 15.5% 38%)'
                        }}
                      >
                        {step.status}
                      </span>
                    </div>

                    <p className="bcp-mono text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: 'hsl(351 68.2% 39.4%)' }}>
                      {step.phase}
                    </p>
                    <h3 className="bcp-serif text-[20px] font-semibold mt-1 mb-2.5 leading-snug">
                      {step.title}
                    </h3>
                    <p className="text-[13.0px] leading-relaxed" style={{ color: 'hsl(202 15.5% 38%)' }}>
                      {step.desc}
                    </p>
                  </div>

                  <div className="mt-5 pt-4 bcp-hair text-[12.0px] font-medium" style={{ color: 'hsl(202 15.5% 38%)' }}>
                    <span className="font-semibold text-slate-800">Target Focus:</span> {step.focus}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Closing Call to Action ─────────────────────────────────────────── */}
      <section id="contact" className="bcp-anchor py-24" style={{ background: 'hsl(203 21.6% 19%)', color: '#fff' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-3xl mx-auto space-y-6">
            <span
              className="inline-block px-3.5 py-1 rounded-full bcp-mono text-[11.5px] font-semibold uppercase tracking-[0.14em]"
              style={{ background: 'hsl(351 68.2% 39.4% / 0.25)', color: 'hsl(351 75% 68%)', border: '1px solid hsl(351 68.2% 39.4% / 0.4)' }}
            >
              Get in Touch
            </span>

            <h2 className="bcp-serif text-[40.0px] sm:text-[50.0px] font-semibold leading-tight tracking-[-0.02em]">
              Partner with Bloodchain.
            </h2>

            <p className="text-[16.5px] leading-relaxed max-w-2xl mx-auto" style={{ color: 'hsl(40 21.4% 85%)' }}>
              We are actively collaborating with national healthcare leaders, hospital administrators, and healthcare investors to revolutionize blood safety and availability.
            </p>

            <div className="pt-4 flex justify-center items-center">
              <a
                href={`mailto:${CONTACT_EMAIL}?subject=Bloodchain%20Inquiry`}
                className="px-9 py-4 rounded-xl text-[14.5px] font-semibold transition-all shadow-lg hover:opacity-95"
                style={{ background: 'hsl(351 68.2% 39.4%)', color: '#fff' }}
              >
                Contact the Leadership Team
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="bcp-hair py-12" style={{ background: 'hsl(36 45.5% 97.8%)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <span
              className="w-8 h-8 rounded-full grid place-items-center shrink-0"
              style={{ background: 'hsl(351 68.2% 39.4%)' }}
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="#fff" strokeWidth="2">
                <path d="M12 3.4c3.2 3.6 5.6 6.6 5.6 9.6a5.6 5.6 0 1 1-11.2 0c0-3 2.4-6 5.6-9.6Z" strokeLinejoin="round" />
              </svg>
            </span>
            <div>
              <p className="bcp-serif text-[17.0px] font-semibold leading-none">Bloodchain</p>
              <p className="text-[11.5px] mt-1" style={{ color: 'hsl(202 15.5% 38%)' }}>
                National Vein-to-Vein Blood Supply Platform
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-[13.0px]" style={{ color: 'hsl(202 15.5% 38%)' }}>
            <a href="#overview" className="hover:underline">Overview</a>
            <a href="#platform" className="hover:underline">Platform</a>
            <a href="#impact" className="hover:underline">Impact</a>
            <a href="#roadmap" className="hover:underline">Roadmap</a>
            <a href="#contact" className="hover:underline">Contact</a>
          </div>

          <p className="text-[12.0px]" style={{ color: 'hsl(202 14% 42%)' }}>
            &copy; {new Date().getFullYear()} Bloodchain. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};
