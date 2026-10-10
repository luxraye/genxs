import React, { useEffect, useState } from 'react';
import { RubricProvider, useRubric } from './context/RubricContext';
import { Header, type Tab } from './components/Header';
import { DeficitMatrix } from './components/DeficitMatrix';
import { RequisitionConductor } from './components/RequisitionConductor';
import { StaffProvisioning } from './components/StaffProvisioning';
import { DonorVerificationDesk } from './components/DonorVerificationDesk';
import { IncidentCommand } from './components/IncidentCommand';
import { SignIn } from './components/SignIn';
import { Info } from 'lucide-react';

const hashToTab = (): Tab => {
  const h = (window.location.hash || '').replace(/^#\/?/, '').toLowerCase();
  if (h === 'requisitions') return 'REQUISITIONS';
  if (h === 'staff') return 'STAFF';
  if (h === 'donors') return 'DONORS';
  if (h === 'incidents') return 'INCIDENTS';
  return 'MATRIX';
};

const tabToHash = (t: Tab) => t.toLowerCase();

const Footer: React.FC = () => (
  <footer className="footer">
    <div className="container footer-inner">
      <span>Bloodchain &middot; national blood operations console</span>
      <span>Demonstration build &middot; all records illustrative</span>
    </div>
  </footer>
);

const Shell: React.FC = () => {
  const { isAuthenticated, criticalDeficitCount, issuesList } = useRubric();
  const [tab, setTab] = useState<Tab>(hashToTab);

  const view: Tab = isAuthenticated ? tab : 'MATRIX';
  const openIssues = issuesList.filter(i => i.status === 'OPEN').length;

  useEffect(() => {
    if (!isAuthenticated) return;
    const h = tabToHash(view);
    const cur = window.location.hash.replace(/^#\/?/, '');
    if (cur !== h) window.history.replaceState(null, '', `#${h}`);
  }, [view, isAuthenticated]);

  useEffect(() => {
    const onHash = () => setTab(hashToTab());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  if (!isAuthenticated) {
    return (
      <div className="shell">
        <main className="main">
          <div className="container">
            <SignIn onSuccess={() => setTab('MATRIX')} />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="shell">
      <Header activeTab={view} setActiveTab={setTab} />

      <main className="main">
        <div className="container stack">
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
        </div>
      </main>

      <Footer />
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
