import React, { useState, useEffect } from 'react';
import { useTorrent } from './context/TorrentContext';
import { Header, type TorrentTab } from './components/Header';
import { TelemetryConsole } from './components/TelemetryConsole';
import { DispatchConsole } from './components/DispatchConsole';
import { HospitalHandover } from './components/HospitalHandover';
import { FleetManifest } from './components/FleetManifest';
import { SignIn } from './components/SignIn';
import { Info } from 'lucide-react';

const hashToTab = (): TorrentTab => {
  const h = (window.location.hash || '').replace(/^#\/?/, '').toLowerCase();
  if (h === 'dispatch') return 'DISPATCH';
  if (h === 'handover') return 'HANDOVER';
  if (h === 'corridors') return 'MANIFEST';
  return 'TELEMETRY';
};

const tabToHash = (t: TorrentTab) => t.toLowerCase();

const Footer: React.FC = () => (
  <footer className="footer">
    <div className="container footer-inner">
      <span>Bloodchain &middot; cold-chain logistics console</span>
      <span>Demonstration build &middot; all records illustrative</span>
    </div>
  </footer>
);

const Shell: React.FC = () => {
  const { isAuthenticated } = useTorrent();
  const [tab, setTab] = useState<TorrentTab>(hashToTab);
  const [handoverDin, setHandoverDin] = useState<string | undefined>(undefined);

  const view: TorrentTab = isAuthenticated ? tab : 'TELEMETRY';

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
            <SignIn onSuccess={() => setTab('TELEMETRY')} />
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
              <strong>Demonstration environment.</strong> Units, temperatures and routes shown here are illustrative
              sample data. Temperature readings can be simulated from the telemetry console.
            </span>
          </div>

          {view === 'TELEMETRY' && (
            <TelemetryConsole
              onNavigateToHandover={din => {
                setHandoverDin(din);
                setTab('HANDOVER');
              }}
            />
          )}
          {view === 'DISPATCH' && <DispatchConsole />}
          {view === 'HANDOVER' && <HospitalHandover initialUnitDin={handoverDin} />}
          {view === 'MANIFEST' && <FleetManifest />}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default function App() {
  return <Shell />;
}
