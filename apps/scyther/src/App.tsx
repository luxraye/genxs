import React, { useEffect, useState } from 'react';
import { ScytherProvider, useScyther } from './context/ScytherContext';
import { Header, type Tab } from './components/Header';
import { DonorCard, ImpactPanel } from './components/Bloodcard';
import { EligibilityCheck } from './components/EligibilityQuiz';
import { Booking } from './components/CentersLocator';
import { MyDonations } from './components/DonationJourney';
import { Profile } from './components/DocumentVerification';
import { AuthPage } from './components/AuthPage';
import { Info } from 'lucide-react';

const hashToTab = (): Tab => {
  const h = (window.location.hash || '').replace(/^#\/?/, '').toLowerCase();
  if (h === 'book' || h === 'booking') return 'BOOK';
  if (h === 'donations') return 'DONATIONS';
  if (h === 'profile') return 'PROFILE';
  if (h === 'signin' || h === 'signup' || h === 'login') return 'SIGNIN';
  return 'HOME';
};

const tabToHash = (t: Tab) => (t === 'HOME' ? '' : t.toLowerCase());

const DemoNotice: React.FC = () => (
  <div className="notice notice--demo">
    <Info className="notice-icon" size={16} />
    <span>
      <strong>Demonstration environment.</strong> Donor records, blood units and centre listings shown here are
      illustrative sample data. No live patient or donor records are displayed.
    </span>
  </div>
);

const Footer: React.FC = () => (
  <footer className="footer">
    <div className="container footer-inner">
      <span>Bloodchain &middot; Botswana national blood service &middot; Donor portal</span>
      <span>Part of the Bloodchain ecosystem &middot; demonstration build</span>
    </div>
  </footer>
);

const Shell: React.FC = () => {
  const { isAuthenticated } = useScyther();
  const [tab, setTab] = useState<Tab>(hashToTab);

  // Signed out, the only view is the sign-in page.
  const view: Tab = isAuthenticated ? tab : 'SIGNIN';

  useEffect(() => {
    const h = tabToHash(view);
    const cur = window.location.hash.replace(/^#\/?/, '');
    if (cur !== h) {
      window.history.replaceState(null, '', h ? `#${h}` : window.location.pathname + window.location.search);
    }
  }, [view]);

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
            <AuthPage onSuccess={() => setTab('HOME')} />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="shell">
      <Header activeTab={view} setActiveTab={setTab} onOpenAuth={() => setTab('SIGNIN')} />

      <main className="main">
        <div className="container stack">
          {view !== 'SIGNIN' && <DemoNotice />}

          {view === 'HOME' && (
            <>
              <DonorCard onBook={() => setTab('BOOK')} />
              <EligibilityCheck onBook={() => setTab('BOOK')} />
              <ImpactPanel />
            </>
          )}

          {view === 'BOOK' && <Booking onDone={() => setTab('DONATIONS')} />}
          {view === 'DONATIONS' && <MyDonations />}
          {view === 'PROFILE' && <Profile />}
          {view === 'SIGNIN' && <AuthPage onSuccess={() => setTab('HOME')} />}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default function App() {
  return (
    <ScytherProvider>
      <Shell />
    </ScytherProvider>
  );
}
