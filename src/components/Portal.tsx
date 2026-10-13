import React, { useState } from 'react';

const HERO_IMAGE = '/images/hero_botswana_trauma_centre.jpg';
const DONOR_IMAGE = '/images/donor_blood_drive_botswana.jpg';
const LAB_IMAGE = '/images/laboratory_fractionation_botswana.jpg';
const LOGISTICS_IMAGE = '/images/iot_cold_chain_botswana.jpg';
const BEDSIDE_IMAGE = '/images/bedside_clinical_transfusion_botswana.jpg';
const OPS_IMAGE = '/images/situation_room_ops_botswana.jpg';
const LEDGER_IMAGE = '/images/ledger_security_botswana.jpg';
const LOGO_IMAGE = '/images/logo.png';

const CONTACT_EMAIL_PRIMARY = 'gnakedi@bloodchain.life';
const CONTACT_EMAIL_DIRECT = 'giftjrnakedi@gmail.com';
const WHATSAPP_NUMBER = '+267 76891059';
const WHATSAPP_LINK = 'https://wa.me/26776891059?text=Hello%20Gift,%20I%20am%20reaching%20out%20regarding%20Bloodchain.';
const TEL_LINK = 'tel:+26776891059';

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
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    phone: '',
    organization: '',
    topic: 'Hospital / Clinical Facility Pilot',
    message: ''
  });
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (key: string, text: string) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
    }
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.name || !formState.email || !formState.message) return;
    setSubmitStatus('submitting');
    try {
      const res = await fetch('https://formsubmit.co/ajax/giftjrnakedi@gmail.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          name: formState.name,
          email: formState.email,
          phone: formState.phone || 'Not provided',
          organization: formState.organization || 'Not provided',
          topic: formState.topic,
          message: formState.message,
          _subject: `New Bloodchain Inquiry from ${formState.name} (${formState.topic})`,
          _template: 'table'
        })
      });
      if (res.ok) {
        setSubmitStatus('success');
      } else {
        setSubmitStatus('error');
      }
    } catch {
      setSubmitStatus('error');
    }
  };

  const nav = [
    { id: 'overview', label: 'Overview' },
    { id: 'platform', label: 'Platform' },
    { id: 'impact', label: 'Impact' },
    { id: 'sdgs', label: 'SDGs' },
    { id: 'roadmap', label: 'Roadmap' },
    { id: 'team', label: 'Team' },
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

  const sdgs = [
    {
      goal: 'SDG 03',
      title: 'Good Health & Well-Being',
      tagline: 'Target 3.1, 3.6 & 3.8',
      color: '#4C9F38',
      bg: 'hsl(108 45% 96%)',
      summary: 'Combats maternal mortality from postpartum hemorrhage and trauma deaths by ensuring rapid, verified blood availability across regional referral hospitals.'
    },
    {
      goal: 'SDG 09',
      title: 'Industry, Innovation & Infrastructure',
      tagline: 'Target 9.1 & 9.5',
      color: '#FD6925',
      bg: 'hsl(20 85% 96.5%)',
      summary: 'Upgrades legacy paper systems to sovereign, cloud-resilient digital infrastructure with continuous IoT cold-chain telemetry and cryptographic provenance.'
    },
    {
      goal: 'SDG 12',
      title: 'Responsible Consumption & Production',
      tagline: 'Target 12.5',
      color: '#BF8B2E',
      bg: 'hsl(42 65% 95.5%)',
      summary: 'Eliminates preventable cold-chain spoilage and reduces blood discard rates toward zero through algorithmic inventory balancing and predictive demand dispatch.'
    },
    {
      goal: 'SDG 17',
      title: 'Partnerships for the Goals',
      tagline: 'Target 17.6 & 17.16',
      color: '#19486A',
      bg: 'hsl(205 60% 96%)',
      summary: 'Catalyzes multi-sector collaboration across national health ministries, regional cross-border medical corridors, hospitals, and voluntary donor networks.'
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
            <div
              className="w-11 h-11 rounded-xl overflow-hidden shadow-sm shrink-0 bg-white grid place-items-center p-0.5 border border-black/10"
              aria-hidden="true"
            >
              <img
                src={LOGO_IMAGE}
                alt="Bloodchain Botswana Logo"
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
            <span className="leading-none">
              <span className="block bcp-serif text-[21.0px] font-semibold tracking-tight" style={{ color: 'hsl(203 21.6% 19%)' }}>
                Bloodchain
              </span>
              <span className="block bcp-mono text-[10.5px] uppercase tracking-[0.15em] mt-1" style={{ color: 'hsl(351 68.2% 39.4%)' }}>
                Botswana Vein-to-Vein
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

      {/* ── UNDP Sustainable Development Goals ──────────────────────────────── */}
      <section id="sdgs" className="bcp-anchor bcp-hair py-24" style={{ background: 'hsl(38 42% 98%)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-14">
            <p className="bcp-mono text-[11.5px] uppercase tracking-[0.16em] bcp-crimson font-semibold mb-3">
              Global Impact Alignment
            </p>
            <h2 className="bcp-serif text-[36.0px] sm:text-[44.0px] font-semibold leading-tight tracking-[-0.015em]">
              Advancing the UN Sustainable Development Goals.
            </h2>
            <p className="mt-4 text-[16.5px] leading-relaxed" style={{ color: 'hsl(202 15.5% 38%)' }}>
              Bloodchain directly contributes to the United Nations 2030 Agenda by transforming fragile, fragmented blood supply lines into resilient, equitable, and transparent health infrastructure.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {sdgs.map(item => (
              <div key={item.goal} className="bcp-card rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className="px-2.5 py-1 rounded bcp-mono text-[11.5px] font-bold tracking-wider"
                      style={{ background: item.bg, color: item.color, border: `1px solid ${item.color}33` }}
                    >
                      {item.goal}
                    </span>
                    <span className="bcp-mono text-[10.5px] font-medium" style={{ color: 'hsl(202 15.5% 38%)' }}>
                      {item.tagline}
                    </span>
                  </div>

                  <h3 className="bcp-serif text-[19.0px] font-semibold mb-2.5 leading-snug">
                    {item.title}
                  </h3>

                  <p className="text-[13.0px] leading-relaxed" style={{ color: 'hsl(202 15.5% 38%)' }}>
                    {item.summary}
                  </p>
                </div>

                <div
                  className="mt-6 pt-3.5 bcp-hair flex items-center gap-2 text-[11.5px] font-medium"
                  style={{ color: item.color }}
                >
                  <span className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                  <span>UNDP 2030 Target Aligned</span>
                </div>
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

      {/* ── Team & Leadership Section ───────────────────────────────────────── */}
      <section id="team" className="bcp-anchor bcp-hair py-24" style={{ background: 'hsl(40 100% 99.4%)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-14">
            <p className="bcp-mono text-[11.5px] uppercase tracking-[0.16em] bcp-crimson font-semibold mb-3">
              Leadership &amp; Talent
            </p>
            <h2 className="bcp-serif text-[36.0px] sm:text-[44.0px] font-semibold leading-tight tracking-[-0.015em]">
              The team building Africa's blood resilience.
            </h2>
            <p className="mt-4 text-[16.5px] leading-relaxed" style={{ color: 'hsl(202 15.5% 38%)' }}>
              Headquartered in Botswana, Bloodchain combines systems engineering with clinical expertise. We are actively expanding our founding core with mission-driven leaders across clinical, legal, and growth disciplines.
            </p>
          </div>

          {/* 4 Profile Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1: Gift Jr Nakedi */}
            <div className="bcp-card rounded-2xl p-6 flex flex-col justify-between border-2 border-slate-900/10 shadow-sm relative">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <span
                    className="bcp-mono text-[10.5px] font-bold uppercase tracking-[0.14em] px-2.5 py-1 rounded"
                    style={{ background: 'hsl(351 60% 96.5%)', color: 'hsl(351 68.2% 39.4%)' }}
                  >
                    Founder
                  </span>
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                    Active Lead
                  </span>
                </div>

                <div
                  className="w-16 h-16 rounded-2xl grid place-items-center bcp-serif text-2xl font-bold mb-4 shadow-sm"
                  style={{ background: 'hsl(351 68.2% 39.4%)', color: '#fff' }}
                >
                  GN
                </div>

                <h3 className="bcp-serif text-[21.0px] font-semibold leading-tight text-slate-900">
                  Gift Jr Nakedi
                </h3>
                <p className="bcp-mono text-[11.5px] font-semibold uppercase tracking-[0.12em] mt-1" style={{ color: 'hsl(351 68.2% 39.4%)' }}>
                  Founder &amp; Technical Lead
                </p>
                <p className="text-[12.8px] leading-relaxed mt-3" style={{ color: 'hsl(202 15.5% 38%)' }}>
                  Software engineer and distributed systems architect leading Bloodchain's sovereign data architecture, vein-to-vein synchronization spine, and national health infrastructure deployment.
                </p>
              </div>

              <div className="mt-5 pt-4 bcp-hair space-y-2 text-[12.0px]">
                <a
                  href={`mailto:${CONTACT_EMAIL_PRIMARY}`}
                  className="flex items-center gap-2 hover:underline font-medium truncate"
                  style={{ color: 'hsl(351 68.2% 39.4%)' }}
                >
                  <svg viewBox="0 0 20 20" className="w-3.5 h-3.5 shrink-0" fill="currentColor">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  {CONTACT_EMAIL_PRIMARY}
                </a>
                <p className="text-slate-500 font-medium">Gaborone, Botswana</p>
              </div>
            </div>

            {/* Card 2: Clinical Operations (Unfilled / Greyed Out) */}
            <div className="rounded-2xl p-6 flex flex-col justify-between border-2 border-dashed border-slate-300 bg-slate-50/70 opacity-90 transition-all hover:opacity-100 hover:border-slate-400">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <span className="bcp-mono text-[10.5px] font-bold uppercase tracking-[0.14em] px-2.5 py-1 rounded bg-amber-100/90 text-amber-900 border border-amber-300/70">
                    Recruiting
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500">Unfilled Role</span>
                </div>

                <div className="w-16 h-16 rounded-2xl grid place-items-center mb-4 bg-slate-200/80 text-slate-400 border border-slate-300">
                  <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <line x1="19" y1="8" x2="19" y2="14" />
                    <line x1="22" y1="11" x2="16" y2="11" />
                  </svg>
                </div>

                <h3 className="bcp-serif text-[20.0px] font-semibold leading-tight text-slate-700">
                  Clinical Operations
                </h3>
                <p className="bcp-mono text-[11.5px] font-semibold uppercase tracking-[0.12em] mt-1 text-slate-500">
                  Clinical Protocols &amp; Medical Affairs
                </p>
                <p className="text-[12.8px] leading-relaxed mt-3 text-slate-600">
                  Overseeing bedside transfusion safety protocols, trauma bay integration, clinical pilot validation, and doctor/nurse workflow training across Botswana hospitals.
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-dashed border-slate-300">
                <a
                  href="#contact"
                  className="inline-flex items-center gap-1.5 text-[12.0px] font-semibold text-slate-800 hover:underline"
                >
                  <span>Think this is you? Apply below</span>
                  <span>&rarr;</span>
                </a>
              </div>
            </div>

            {/* Card 3: Legal & Compliance (Unfilled / Greyed Out) */}
            <div className="rounded-2xl p-6 flex flex-col justify-between border-2 border-dashed border-slate-300 bg-slate-50/70 opacity-90 transition-all hover:opacity-100 hover:border-slate-400">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <span className="bcp-mono text-[10.5px] font-bold uppercase tracking-[0.14em] px-2.5 py-1 rounded bg-amber-100/90 text-amber-900 border border-amber-300/70">
                    Recruiting
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500">Unfilled Role</span>
                </div>

                <div className="w-16 h-16 rounded-2xl grid place-items-center mb-4 bg-slate-200/80 text-slate-400 border border-slate-300">
                  <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
                    <line x1="9" y1="12" x2="15" y2="12" />
                    <line x1="12" y1="9" x2="12" y2="15" />
                  </svg>
                </div>

                <h3 className="bcp-serif text-[20.0px] font-semibold leading-tight text-slate-700">
                  Legal &amp; Compliance
                </h3>
                <p className="bcp-mono text-[11.5px] font-semibold uppercase tracking-[0.12em] mt-1 text-slate-500">
                  Regulatory &amp; Health Governance
                </p>
                <p className="text-[12.8px] leading-relaxed mt-3 text-slate-600">
                  Directing sovereign health data compliance, national privacy frameworks, medical software certification, and regional cross-border SADC healthcare legal compacts.
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-dashed border-slate-300">
                <a
                  href="#contact"
                  className="inline-flex items-center gap-1.5 text-[12.0px] font-semibold text-slate-800 hover:underline"
                >
                  <span>Think this is you? Apply below</span>
                  <span>&rarr;</span>
                </a>
              </div>
            </div>

            {/* Card 4: Marketing & Business (Unfilled / Greyed Out) */}
            <div className="rounded-2xl p-6 flex flex-col justify-between border-2 border-dashed border-slate-300 bg-slate-50/70 opacity-90 transition-all hover:opacity-100 hover:border-slate-400">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <span className="bcp-mono text-[10.5px] font-bold uppercase tracking-[0.14em] px-2.5 py-1 rounded bg-amber-100/90 text-amber-900 border border-amber-300/70">
                    Recruiting
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500">Unfilled Role</span>
                </div>

                <div className="w-16 h-16 rounded-2xl grid place-items-center mb-4 bg-slate-200/80 text-slate-400 border border-slate-300">
                  <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <line x1="18" y1="20" x2="18" y2="10" />
                    <line x1="12" y1="20" x2="12" y2="4" />
                    <line x1="6" y1="20" x2="6" y2="14" />
                    <circle cx="12" cy="4" r="2" />
                  </svg>
                </div>

                <h3 className="bcp-serif text-[20.0px] font-semibold leading-tight text-slate-700">
                  Marketing &amp; Business
                </h3>
                <p className="bcp-mono text-[11.5px] font-semibold uppercase tracking-[0.12em] mt-1 text-slate-500">
                  Growth &amp; Ecosystem Partnerships
                </p>
                <p className="text-[12.8px] leading-relaxed mt-3 text-slate-600">
                  Leading voluntary donor recruitment drives, university and corporate blood partnerships, institutional investor relations, and continental health expansion.
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-dashed border-slate-300">
                <a
                  href="#contact"
                  className="inline-flex items-center gap-1.5 text-[12.0px] font-semibold text-slate-800 hover:underline"
                >
                  <span>Think this is you? Apply below</span>
                  <span>&rarr;</span>
                </a>
              </div>
            </div>
          </div>

          {/* Short Callout Banner */}
          <div className="mt-10 rounded-2xl p-6 sm:p-8 bcp-card flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
            <div className="space-y-1 text-center md:text-left">
              <p className="bcp-serif text-[21.0px] font-semibold text-slate-900">
                Think this is you? Give us a call or reach out.
              </p>
              <p className="text-[14.0px]" style={{ color: 'hsl(202 15.5% 38%)' }}>
                We are actively looking for exceptional collaborators passionate about eliminating blood stockouts and building durable public health infrastructure.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noreferrer"
                className="px-5 py-3 rounded-xl text-[13.5px] font-semibold flex items-center gap-2 text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-all"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                  <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.82L4.43 19.64L5.26 16.6L5.06 16.29C4.24 14.99 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67M9.53 7.33C9.33 7.33 9.02 7.41 8.76 7.69C8.5 7.97 7.76 8.66 7.76 10.08C7.76 11.5 8.79 12.87 8.94 13.06C9.09 13.25 11.08 16.33 14.13 17.65C14.86 17.96 15.43 18.15 15.87 18.29C16.6 18.52 17.27 18.49 17.8 18.41C18.39 18.32 19.62 17.66 19.87 16.95C20.13 16.24 20.13 15.63 20.05 15.5C19.97 15.37 19.77 15.3 19.46 15.15C19.16 15 17.67 14.26 17.39 14.16C17.11 14.06 16.91 14.01 16.71 14.31C16.5 14.62 15.93 15.3 15.75 15.5C15.58 15.7 15.4 15.73 15.1 15.58C14.79 15.42 13.82 15.11 12.67 14.08C11.78 13.28 11.17 12.3 11 12C10.82 11.7 10.98 11.53 11.13 11.38C11.27 11.25 11.44 11.03 11.6 10.85C11.75 10.67 11.8 10.55 11.9 10.34C12 10.14 11.95 9.96 11.88 9.81C11.8 9.66 11.2 8.18 10.95 7.57C10.7 6.97 10.45 7.05 10.27 7.05C10.09 7.05 9.89 7.03 9.69 7.03L9.53 7.33Z" />
                </svg>
                <span>WhatsApp: {WHATSAPP_NUMBER}</span>
              </a>
              <a
                href="#contact"
                className="px-5 py-3 rounded-xl text-[13.5px] font-semibold bcp-btn-primary"
              >
                Send Us an Application
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Comprehensive Contact Section (Options + Form) ────────────────── */}
      <section id="contact" className="bcp-anchor py-24" style={{ background: 'hsl(203 21.6% 19%)', color: '#fff' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-16 text-center md:text-left">
            <span
              className="inline-block px-3.5 py-1 rounded-full bcp-mono text-[11.5px] font-semibold uppercase tracking-[0.14em]"
              style={{ background: 'hsl(351 68.2% 39.4% / 0.25)', color: 'hsl(351 75% 68%)', border: '1px solid hsl(351 68.2% 39.4% / 0.4)' }}
            >
              Get in Touch
            </span>

            <h2 className="bcp-serif text-[40.0px] sm:text-[50.0px] font-semibold leading-tight tracking-[-0.02em] mt-3">
              Direct Contact &amp; Inquiry.
            </h2>

            <p className="text-[16.5px] leading-relaxed max-w-2xl mt-3" style={{ color: 'hsl(40 21.4% 85%)' }}>
              Connect directly with our team. Use any of our verified direct channels or submit the message form below — all inquiries are routed straight to our founder.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Direct Contact Options Column */}
            <div className="lg:col-span-5 space-y-4">
              <h3 className="bcp-serif text-[22.0px] font-semibold mb-2" style={{ color: '#fff' }}>
                Direct Channels
              </h3>

              {/* Primary Email Card */}
              <div
                className="rounded-2xl p-5 border transition-all"
                style={{ background: 'hsl(203 21.6% 23%)', borderColor: 'hsl(203 21.6% 30%)' }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="bcp-mono text-[11.0px] uppercase tracking-[0.12em]" style={{ color: 'hsl(351 75% 72%)' }}>
                      Platform Operations
                    </p>
                    <p className="text-[15.5px] font-semibold select-all text-white">
                      {CONTACT_EMAIL_PRIMARY}
                    </p>
                    <p className="text-[12.5px]" style={{ color: 'hsl(40 21.4% 80%)' }}>
                      For institutional pilots, health ministries, and official correspondence.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy('primary_email', CONTACT_EMAIL_PRIMARY)}
                    className="px-3 py-1.5 rounded-lg text-[12.0px] font-medium transition-all shrink-0 cursor-pointer hover:bg-slate-700"
                    style={{ background: 'hsl(203 21.6% 32%)', color: '#fff' }}
                  >
                    {copiedKey === 'primary_email' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* Founder Direct Email Card */}
              <div
                className="rounded-2xl p-5 border transition-all"
                style={{ background: 'hsl(203 21.6% 23%)', borderColor: 'hsl(203 21.6% 30%)' }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="bcp-mono text-[11.0px] uppercase tracking-[0.12em]" style={{ color: 'hsl(351 75% 72%)' }}>
                      Founder Direct
                    </p>
                    <p className="text-[15.5px] font-semibold select-all text-white">
                      {CONTACT_EMAIL_DIRECT}
                    </p>
                    <p className="text-[12.5px]" style={{ color: 'hsl(40 21.4% 80%)' }}>
                      Direct inbox of Gift Jr Nakedi (Founder &amp; Technical Lead).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy('direct_email', CONTACT_EMAIL_DIRECT)}
                    className="px-3 py-1.5 rounded-lg text-[12.0px] font-medium transition-all shrink-0 cursor-pointer hover:bg-slate-700"
                    style={{ background: 'hsl(203 21.6% 32%)', color: '#fff' }}
                  >
                    {copiedKey === 'direct_email' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* WhatsApp & Phone Card */}
              <div
                className="rounded-2xl p-5 border transition-all"
                style={{ background: 'hsl(203 21.6% 23%)', borderColor: 'hsl(203 21.6% 30%)' }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="bcp-mono text-[11.0px] uppercase tracking-[0.12em] text-emerald-400">
                      WhatsApp &amp; Direct Phone
                    </p>
                    <p className="text-[16.5px] font-semibold select-all text-white">
                      {WHATSAPP_NUMBER}
                    </p>
                    <p className="text-[12.5px]" style={{ color: 'hsl(40 21.4% 80%)' }}>
                      Available for voice calls, SMS, and instant WhatsApp messaging.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <a
                      href={WHATSAPP_LINK}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-lg text-[12.0px] font-semibold text-center text-white bg-emerald-600 hover:bg-emerald-700 transition-all"
                    >
                      WhatsApp
                    </a>
                    <a
                      href={TEL_LINK}
                      className="px-3 py-1.5 rounded-lg text-[12.0px] font-medium text-center transition-all hover:bg-slate-700"
                      style={{ background: 'hsl(203 21.6% 32%)', color: '#fff' }}
                    >
                      Call
                    </a>
                  </div>
                </div>
              </div>

              {/* Location Card */}
              <div
                className="rounded-2xl p-5 border"
                style={{ background: 'hsl(203 21.6% 23%)', borderColor: 'hsl(203 21.6% 30%)' }}
              >
                <div className="space-y-1">
                  <p className="bcp-mono text-[11.0px] uppercase tracking-[0.12em]" style={{ color: 'hsl(40 21.4% 75%)' }}>
                    Headquarters
                  </p>
                  <p className="text-[15.0px] font-semibold text-white">
                    Gaborone, Botswana
                  </p>
                  <p className="text-[12.5px]" style={{ color: 'hsl(40 21.4% 80%)' }}>
                    Supporting national trauma corridors and SADC regional healthcare networks.
                  </p>
                </div>
              </div>
            </div>

            {/* Interactive Contact Form Column */}
            <div className="lg:col-span-7">
              <div
                className="rounded-3xl p-7 sm:p-9 border shadow-2xl"
                style={{ background: 'hsl(203 21.6% 22%)', borderColor: 'hsl(203 21.6% 30%)' }}
              >
                {submitStatus === 'success' ? (
                  <div className="text-center py-10 space-y-5">
                    <div className="w-16 h-16 rounded-full bg-emerald-600 text-white grid place-items-center mx-auto shadow-lg">
                      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <div className="space-y-2">
                      <h3 className="bcp-serif text-[26.0px] font-semibold text-white">
                        Message Sent Successfully!
                      </h3>
                      <p className="text-[14.5px] max-w-md mx-auto" style={{ color: 'hsl(40 21.4% 85%)' }}>
                        Thank you, <span className="font-semibold text-white">{formState.name}</span>. Your details and message have been emailed directly to Gift Jr Nakedi (<span className="text-emerald-300">{CONTACT_EMAIL_DIRECT}</span>).
                      </p>
                      <p className="text-[13.0px]" style={{ color: 'hsl(40 21.4% 70%)' }}>
                        We have recorded your details and will get back to you shortly.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setFormState({
                          name: '',
                          email: '',
                          phone: '',
                          organization: '',
                          topic: 'Hospital / Clinical Facility Pilot',
                          message: ''
                        });
                        setSubmitStatus('idle');
                      }}
                      className="px-6 py-2.5 rounded-xl text-[13.5px] font-semibold text-white bg-slate-700 hover:bg-slate-600 transition-all cursor-pointer"
                    >
                      Send Another Message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleFormSubmit} className="space-y-5">
                    <div>
                      <h3 className="bcp-serif text-[24.0px] font-semibold text-white">
                        Send a Message to the Founder
                      </h3>
                      <p className="text-[13.5px] mt-1" style={{ color: 'hsl(40 21.4% 78%)' }}>
                        Captures your details and delivers straight to <span className="text-white font-medium">{CONTACT_EMAIL_DIRECT}</span> without launching an email client.
                      </p>
                    </div>

                    {submitStatus === 'error' && (
                      <div className="p-4 rounded-xl bg-red-950/80 border border-red-700/60 text-red-200 text-[13.0px] flex items-center justify-between gap-3">
                        <span>Could not dispatch form automatically. Please reach out via WhatsApp at {WHATSAPP_NUMBER} or email {CONTACT_EMAIL_DIRECT}.</span>
                        <a href={WHATSAPP_LINK} className="underline font-semibold shrink-0">Open WhatsApp</a>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[12.5px] font-medium mb-1.5 text-slate-300">
                          Your Full Name <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={formState.name}
                          onChange={e => setFormState({ ...formState, name: e.target.value })}
                          placeholder="e.g. Dr. Lesego Moloi"
                          className="w-full px-4 py-3 rounded-xl text-[14.0px] bg-slate-900/60 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-red-400 transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-[12.5px] font-medium mb-1.5 text-slate-300">
                          Email Address <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="email"
                          required
                          value={formState.email}
                          onChange={e => setFormState({ ...formState, email: e.target.value })}
                          placeholder="name@organization.com"
                          className="w-full px-4 py-3 rounded-xl text-[14.0px] bg-slate-900/60 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-red-400 transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[12.5px] font-medium mb-1.5 text-slate-300">
                          Phone / WhatsApp Number <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="tel"
                          required
                          value={formState.phone}
                          onChange={e => setFormState({ ...formState, phone: e.target.value })}
                          placeholder="+267 7X XXX XXX"
                          className="w-full px-4 py-3 rounded-xl text-[14.0px] bg-slate-900/60 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-red-400 transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-[12.5px] font-medium mb-1.5 text-slate-300">
                          Organization / Facility (Optional)
                        </label>
                        <input
                          type="text"
                          value={formState.organization}
                          onChange={e => setFormState({ ...formState, organization: e.target.value })}
                          placeholder="Hospital, Ministry, Venture Firm"
                          className="w-full px-4 py-3 rounded-xl text-[14.0px] bg-slate-900/60 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-red-400 transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[12.5px] font-medium mb-1.5 text-slate-300">
                        Area of Interest
                      </label>
                      <select
                        value={formState.topic}
                        onChange={e => setFormState({ ...formState, topic: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl text-[14.0px] bg-slate-900/60 border border-slate-700 text-white focus:outline-none focus:border-red-400 transition-all"
                      >
                        <option value="Hospital / Clinical Facility Pilot">Hospital / Clinical Facility Pilot</option>
                        <option value="Institutional Investor / Venture Partner">Institutional Investor / Venture Partner</option>
                        <option value="Join the Team / Executive Role">Join the Team / Executive Role (Clinical, Legal, Marketing)</option>
                        <option value="Ministry of Health / Regulatory Partnership">Ministry of Health / Regulatory Partnership</option>
                        <option value="Blood Donor Community / General Inquiry">Blood Donor Community / General Inquiry</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[12.5px] font-medium mb-1.5 text-slate-300">
                        Your Message <span className="text-red-400">*</span>
                      </label>
                      <textarea
                        required
                        rows={4}
                        value={formState.message}
                        onChange={e => setFormState({ ...formState, message: e.target.value })}
                        placeholder="Share your objectives, questions, or how you would like to collaborate..."
                        className="w-full px-4 py-3 rounded-xl text-[14.0px] bg-slate-900/60 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-red-400 transition-all resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submitStatus === 'submitting'}
                      className="w-full py-4 rounded-xl text-[14.5px] font-semibold text-white shadow-lg transition-all flex items-center justify-center gap-2 hover:opacity-95 disabled:opacity-60 cursor-pointer"
                      style={{ background: 'hsl(351 68.2% 39.4%)' }}
                    >
                      {submitStatus === 'submitting' ? (
                        <>
                          <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                          </svg>
                          <span>Delivering Message...</span>
                        </>
                      ) : (
                        <span>Send Message Directly &rarr;</span>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="bcp-hair py-12" style={{ background: 'hsl(36 45.5% 97.8%)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl overflow-hidden shadow-sm shrink-0 bg-white grid place-items-center p-0.5 border border-black/10"
            >
              <img
                src={LOGO_IMAGE}
                alt="Bloodchain Botswana Logo"
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
            <div>
              <p className="bcp-serif text-[17.0px] font-semibold leading-none">Bloodchain</p>
              <p className="text-[11.5px] mt-1" style={{ color: 'hsl(202 15.5% 38%)' }}>
                National Vein-to-Vein Blood Supply Platform &bull; Botswana
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-[13.0px]" style={{ color: 'hsl(202 15.5% 38%)' }}>
            <a href="#overview" className="hover:underline">Overview</a>
            <a href="#platform" className="hover:underline">Platform</a>
            <a href="#impact" className="hover:underline">Impact</a>
            <a href="#sdgs" className="hover:underline">SDGs</a>
            <a href="#roadmap" className="hover:underline">Roadmap</a>
            <a href="#team" className="hover:underline">Team</a>
            <a href="#contact" className="hover:underline">Contact</a>
          </div>

          <div className="text-right text-[12.0px]" style={{ color: 'hsl(202 14% 42%)' }}>
            <p>&copy; {new Date().getFullYear()} Bloodchain Botswana. All rights reserved.</p>
            <p className="mt-0.5 text-[11.0px] text-slate-500">{CONTACT_EMAIL_PRIMARY} &bull; {WHATSAPP_NUMBER}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
