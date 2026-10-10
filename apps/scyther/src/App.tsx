import React, { useState } from 'react';
import { ScytherProvider, useScyther } from './context/ScytherContext';
import { Header, type Tab } from './components/Header';
import { DonorCard, ImpactPanel } from './components/Bloodcard';
import { EligibilityCheck } from './components/EligibilityQuiz';
import { Booking } from './components/CentersLocator';
import { MyDonations } from './components/DonationJourney';
import { Profile } from './components/DocumentVerification';
import { AuthModal } from './components/CitizenAuthModal';
import { Info } from 'lucide-react';

const DemoNotice: React.FC = () => (
  <div className="notice notice--demo">
    <Info className="notice-icon" size={16} />
    <span>
      <strong>Demonstration environment.</strong> Donor records, blood units and centre listings shown here are
      illustrative sample data. No live patient or donor records are displayed.
    </span>
  </div>
);

const Shell: React.FC = () => {
  const [tab, setTab] = useState<Tab>('HOME');
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <div className="shell">
      <Header activeTab={tab} setActiveTab={setTab} onOpenAuth={() => setAuthOpen(true)} />

      <main className="main">
        <div className="container stack">
          <DemoNotice />

          {tab === 'HOME' && (
            <>
              <DonorCard onBook={() => setTab('BOOK')} />
              <EligibilityCheck onBook={() => setTab('BOOK')} />
              <ImpactPanel />
            </>
          )}

          {tab === 'BOOK' && <Booking onDone={() => setTab('DONATIONS')} />}
          {tab === 'DONATIONS' && <MyDonations />}
          {tab === 'PROFILE' && <Profile onSignIn={() => setAuthOpen(true)} />}
        </div>
      </main>

      <footer className="footer">
        <div className="container footer-inner">
          <span>Bloodchain · Botswana national blood service · Donor portal</span>
          <span>Demonstration build · all records illustrative</span>
        </div>
      </footer>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
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
