import React, { useEffect, useState } from 'react';
import { RubricProvider, useRubric } from './context/RubricContext';
import { Sidebar, type Tab } from './components/Sidebar';
import { DeficitMatrix } from './components/DeficitMatrix';
import { RequisitionConductor } from './components/RequisitionConductor';
import { StaffProvisioning } from './components/StaffProvisioning';
import { DonorVerificationDesk } from './components/DonorVerificationDesk';
import { IncidentCommand } from './components/IncidentCommand';
import { AdvisoryInsights } from './components/AdvisoryInsights';
import { AICopilotDrawer } from './components/AICopilotDrawer';
import { SignIn } from './components/SignIn';
import { Info, Menu, Sparkles, Plus } from 'lucide-react';

const hashToTab = (): Tab => {
  const h = (window.location.hash || '').replace(/^#\/?/, '').toLowerCase();
  if (h === 'requisitions') return 'REQUISITIONS';
  if (h === 'staff') return 'STAFF';
  if (h === 'donors') return 'DONORS';
  if (h === 'incidents') return 'INCIDENTS';
  if (h === 'advisory' || h === 'copilot' || h === 'ai_copilot') return 'ADVISORY';
  return 'MATRIX';
};

const tabToHash = (t: Tab) => t.toLowerCase();

const TAB_METAS: Record<Tab, { name: string; category: string }> = {
  MATRIX: { name: 'National Inventory & Deficit Matrix', category: 'Stock & Depository' },
  REQUISITIONS: { name: 'Hospital Requisitions Conductor', category: 'Clinical Demand & Triage' },
  STAFF: { name: 'Personnel & Access Management', category: 'Operator Credentials' },
  DONORS: { name: 'Donor Verification & Eligibility Desk', category: 'Pre-donation Screening' },
  INCIDENTS: { name: 'Incident Command & Telemetry', category: 'Cold-chain Alerts' },
  ADVISORY: { name: 'Advisory Insights & AI Governance', category: 'Epidemiological Intelligence' }
};

const Footer: React.FC = () => (
  <footer className="footer">
    <div className="container footer-inner">
      <span>Bloodchain &middot; national blood operations console</span>
      <span>Demonstration build &middot; aligned to WHO AI-for-health &amp; Botswana DPA 18 of 2024</span>
    </div>
  </footer>
);

const Shell: React.FC = () => {
  const { isAuthenticated, criticalDeficitCount, issuesList } = useRubric();
  const [tab, setTab] = useState<Tab>(hashToTab);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const view: Tab = isAuthenticated ? tab : 'MATRIX';

  useEffect(() => {
    if (!isAuthenticated) return;
    const h = tabToHash(view);
    const cur = window.location.hash.replace(/^#\/?/, '');
    if (cur !== h) window.history.replaceState(null, '', `#${h}`);
  }, [view, isAuthenticated]);

  useEffect(() => {
    const onHash = () => {
      const h = (window.location.hash || '').replace(/^#\/?/, '').toLowerCase();
      if (h === 'copilot' || h === 'ai_copilot') {
        setTab('ADVISORY');
        setIsCopilotOpen(true);
      } else {
        setTab(hashToTab());
      }
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  if (!isAuthenticated) {
    return (
      <div className="shell">
        <a className="skip-link" href="#main">Skip to content</a>
        <main id="main" className="main">
          <div className="container">
            <SignIn onSuccess={() => setTab('MATRIX')} />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="rubric-layout">
      <a className="skip-link" href="#main">Skip to content</a>

      {/* Mobile Top Header */}
      <header className="rubric-mobile-bar">
        <button
          type="button"
          className="mobile-menu-trigger"
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation menu"
        >
          <Menu size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="brand-mark" style={{ width: 24, height: 24, background: '#8e1b2e', color: '#fff' }}>
            <Plus size={15} strokeWidth={2.8} />
          </span>
          <span style={{ fontWeight: 700, fontSize: 15, color: '#fff' }}>Bloodchain</span>
          <span className="sidebar-brand-badge" style={{ fontSize: 9.5, padding: '1px 5px' }}>OPS</span>
        </div>

        <button
          type="button"
          className="mobile-copilot-trigger"
          onClick={() => setIsCopilotOpen(true)}
          title="Launch AI Copilot"
        >
          <Sparkles size={16} />
        </button>
      </header>

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div 
          className="rubric-mobile-backdrop" 
          onClick={() => setMobileOpen(false)} 
          aria-hidden="true" 
        />
      )}

      {/* Command Sidebar */}
      <Sidebar
        activeTab={view}
        setActiveTab={setTab}
        onOpenCopilot={() => setIsCopilotOpen(true)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main Operations Pane */}
      <div className="rubric-main-pane">
        <header className="rubric-pane-header">
          <div className="rubric-pane-header-left">
            <span className="rubric-tab-crumb">Operations</span>
            <span className="rubric-crumb-sep">/</span>
            <span className="rubric-tab-active-name">{TAB_METAS[view]?.name || 'Console'}</span>
          </div>

          <div className="rubric-pane-header-right">
            <div className="rubric-header-pills">
              <span className="rubric-audit-pill">Audit: hash-chained</span>
              <span className="rubric-audit-pill">ISBT 128</span>
              <span className="rubric-audit-pill">DPA 18 of 2024</span>
            </div>

            <button
              type="button"
              className="rubric-header-copilot-btn"
              onClick={() => setIsCopilotOpen(true)}
              title="Launch Bloodchain AI Copilot (Tier 2 Advisory)"
            >
              <Sparkles size={14} />
              <span>AI Copilot</span>
              <span className="rubric-t2-tag">T2</span>
            </button>
          </div>
        </header>

        <main id="main" className="rubric-workspace-content">
          <div className="stack">
            <div className="notice notice--demo">
              <Info className="notice-icon" size={15} />
              <span>
                <strong>Demonstration environment.</strong> Inventory, requests, personnel and incident records shown
                here are illustrative sample data. Burn rates are planning assumptions, not measured consumption.
              </span>
            </div>

            {view === 'MATRIX' && <DeficitMatrix onNavigateToRequisitions={() => setTab('REQUISITIONS')} />}
            {view === 'REQUISITIONS' && <RequisitionConductor />}
            {view === 'STAFF' && <StaffProvisioning />}
            {view === 'DONORS' && <DonorVerificationDesk />}
            {view === 'INCIDENTS' && <IncidentCommand />}
            {view === 'ADVISORY' && <AdvisoryInsights onOpenCopilot={() => setIsCopilotOpen(true)} />}
          </div>
        </main>

        <Footer />
      </div>

      {/* Slide-out Interactive AI Copilot Drawer */}
      <AICopilotDrawer isOpen={isCopilotOpen} onClose={() => setIsCopilotOpen(false)} />
    </div>
  );
};

export default function App() {
  return (
    <RubricProvider>
      <Shell />
    </RubricProvider>
  );
}
