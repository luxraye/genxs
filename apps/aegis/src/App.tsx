import React, { useState, useEffect } from 'react';
import { useAegis } from './context/AegisContext';
import { Header, type AegisTab } from './components/Header';
import { BedsideScanner } from './components/BedsideScanner';
import { TransfusionMonitor } from './components/TransfusionMonitor';
import { HospitalRequisitions } from './components/HospitalRequisitions';
import { HemovigilanceReporter } from './components/HemovigilanceReporter';
import { SignIn } from './components/SignIn';
import { Info } from 'lucide-react';

const hashToTab = (): AegisTab => {
  const h = (window.location.hash || '').replace(/^#\/?/, '').toLowerCase();
  if (h === 'monitor') return 'MONITOR';
  if (h === 'orders') return 'REQUISITIONS';
  if (h === 'reactions') return 'HEMOVIGILANCE';
  return 'BEDSIDE_SCANNER';
};

const tabToHash = (t: AegisTab) => {
  if (t === 'BEDSIDE_SCANNER') return 'verify';
  if (t === 'MONITOR') return 'monitor';
  if (t === 'REQUISITIONS') return 'orders';
  return 'reactions';
};

const Footer: React.FC = () => (
  <footer className="footer">
    <div className="container footer-inner">
      <span>Bloodchain &middot; ward transfusion console</span>
      <span>Demonstration build &middot; all records illustrative</span>
    </div>
  </footer>
);

const Shell: React.FC = () => {
  const { isAuthenticated } = useAegis();
  const [tab, setTab] = useState<AegisTab>(hashToTab);
  const [monitorDin, setMonitorDin] = useState<string | undefined>(undefined);
  const [hemoDin, setHemoDin] = useState<string | undefined>(undefined);

  const view: AegisTab = isAuthenticated ? tab : 'BEDSIDE_SCANNER';

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
      <a className="skip-link" href="#main">Skip to content</a>
        <main id="main" className="main">
          <div className="container">
            <SignIn onSuccess={() => setTab('BEDSIDE_SCANNER')} />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="shell">
      <a className="skip-link" href="#main">Skip to content</a>
      <Header
        activeTab={view}
        setActiveTab={setTab}
        onTriggerCodeCrimson={() => {
          setTab('REQUISITIONS');
        }}
      />

      <main id="main" className="main">
        <div className="container stack">
          <div className="notice notice--demo">
            <Info className="notice-icon" size={15} />
            <span>
              <strong>Demonstration environment.</strong> Units, patients and observations shown here are illustrative
              sample data. This console does not contain artificial intelligence and is not a decision-making device.
            </span>
          </div>

          {view === 'BEDSIDE_SCANNER' && (
            <BedsideScanner
              onProceedToMonitor={din => {
                setMonitorDin(din);
                setTab('MONITOR');
              }}
            />
          )}
          {view === 'MONITOR' && (
            <TransfusionMonitor
              initialUnitDin={monitorDin}
              onNavigateToHemovigilance={din => {
                setHemoDin(din);
                setTab('HEMOVIGILANCE');
              }}
            />
          )}
          {view === 'REQUISITIONS' && <HospitalRequisitions />}
          {view === 'HEMOVIGILANCE' && <HemovigilanceReporter initialUnitDin={hemoDin} />}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default function App() {
  return <Shell />;
}
