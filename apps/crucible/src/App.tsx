import React, { useEffect, useState } from 'react';
import { CrucibleProvider, useCrucible, AWAITING_STATUSES } from './context/CrucibleContext';
import { Header, type CrucibleTab } from './components/Header';
import { SerologyScreening } from './components/SerologyScreening';
import { FractionationDesk } from './components/FractionationDesk';
import { QuarantineVault } from './components/QuarantineVault';
import { SignIn } from './components/SignIn';
import { Info } from 'lucide-react';

const hashToTab = (): CrucibleTab => {
  const h = (window.location.hash || '').replace(/^#\/?/, '').toLowerCase();
  if (h === 'fractionation') return 'FRACTIONATION';
  if (h === 'quarantine') return 'QUARANTINE';
  return 'SEROLOGY';
};

const tabToHash = (t: CrucibleTab) => t.toLowerCase();

const Footer: React.FC = () => (
  <footer className="footer">
    <div className="container footer-inner">
      <span>Bloodchain &middot; national blood laboratory console</span>
      <span>Demonstration build &middot; all records illustrative</span>
    </div>
  </footer>
);

const Shell: React.FC = () => {
  const { isAuthenticated, units } = useCrucible();
  const [tab, setTab] = useState<CrucibleTab>(hashToTab);

  const view: CrucibleTab = isAuthenticated ? tab : 'SEROLOGY';
  const awaiting = units.filter(u => AWAITING_STATUSES.includes(u.status)).length;

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
            <SignIn onSuccess={() => setTab('SEROLOGY')} />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="shell">
      <a className="skip-link" href="#main">Skip to content</a>
      <Header activeTab={view} setActiveTab={setTab} />

      <main id="main" className="main">
        <div className="container stack">
          <div className="notice notice--demo">
            <Info className="notice-icon" size={15} />
            <span>
              <strong>Demonstration environment.</strong> Units, screening results and audit entries shown here are
              illustrative sample data. Panel composition must be confirmed against the national testing protocol.
            </span>
          </div>

          {view === 'SEROLOGY' && <SerologyScreening />}
          {view === 'FRACTIONATION' && <FractionationDesk />}
          {view === 'QUARANTINE' && <QuarantineVault />}

          {awaiting > 0 && view !== 'SEROLOGY' && (
            <div className="notice notice--watch">
              <Info className="notice-icon" size={15} />
              <span>
                <strong>{awaiting}</strong> unit{awaiting === 1 ? '' : 's'} awaiting screening or release.
              </span>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default function App() {
  return (
    <CrucibleProvider>
      <Shell />
    </CrucibleProvider>
  );
}
