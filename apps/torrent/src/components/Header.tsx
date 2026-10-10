import React from 'react';
import { useTorrent, DISPATCHABLE_STATUSES, TRANSIT_STATUSES } from '../context/TorrentContext';
import { Plus, Thermometer, Truck, Navigation, Building2, LogOut } from 'lucide-react';

export type TorrentTab = 'TELEMETRY' | 'DISPATCH' | 'HANDOVER' | 'MANIFEST';

interface HeaderProps {
  activeTab: TorrentTab;
  setActiveTab: (tab: TorrentTab) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  const { currentCourier, logoutCourier, units, issuesList } = useTorrent();

  if (!currentCourier) return null;

  const inTransit = units.filter(u => TRANSIT_STATUSES.includes(u.status)).length;
  const dispatchable = units.filter(u => DISPATCHABLE_STATUSES.includes(u.status)).length;
  const breaches = issuesList.filter(i => i.category === 'COLD_CHAIN_ALERT' && i.status === 'OPEN').length;

  const tabs: { id: TorrentTab; label: string; icon: React.ElementType; count: number }[] = [
    { id: 'TELEMETRY', label: 'Telemetry', icon: Thermometer, count: inTransit },
    { id: 'DISPATCH', label: 'Dispatch', icon: Truck, count: dispatchable },
    { id: 'HANDOVER', label: 'Handover', icon: Building2, count: inTransit },
    { id: 'MANIFEST', label: 'Corridors', icon: Navigation, count: 0 }
  ];

  return (
    <header className="topbar">
      <div className="strip">
        <div className="container strip-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#3fbf7f', flexShrink: 0 }} />
            <strong>Bloodchain Cold</strong>
            <span className="strip-tag">Cold-chain logistics console</span>
          </div>
          <div className="strip-tag" style={{ display: 'flex', gap: 14 }}>
            <span>Audit log: hash-chained</span>
            {breaches > 0 && (
              <span style={{ color: 'var(--stop)' }}>
                {breaches} open excursion{breaches === 1 ? '' : 's'}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="container topbar-inner">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            <Plus size={17} strokeWidth={2.6} />
          </span>
          <span className="brand-name">Bloodchain</span>
          <span className="brand-tag">Cold</span>
        </div>

        <nav className="nav" aria-label="Primary">
          {tabs.map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                className="navlink"
                aria-current={activeTab === t.id ? 'page' : undefined}
                onClick={() => setActiveTab(t.id)}
              >
                <Icon size={15} />
                <span>{t.label}</span>
                {t.count > 0 && <span className="count count--watch">{t.count}</span>}
              </button>
            );
          })}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.2 }}>{currentCourier.fullName}</div>
            <div className="mono dim" style={{ fontSize: 11 }}>
              {currentCourier.badgeNumber}
            </div>
          </div>
          <button className="btn btn--outline" onClick={logoutCourier} title="Sign out">
            <LogOut size={15} />
          </button>
        </div>
      </div>

      <div className="nav-mobile">
        <div className="container nav-mobile-inner">
          {tabs.map(t => (
            <button
              key={t.id}
              className="navlink"
              aria-current={activeTab === t.id ? 'page' : undefined}
              onClick={() => setActiveTab(t.id)}
            >
              <span>{t.label}</span>
              {t.count > 0 && <span className="count">{t.count}</span>}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
