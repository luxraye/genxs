import React, { useState } from 'react';
import { useScyther } from '../context/ScytherContext';
import { Plus, AlertTriangle, ChevronDown, LogOut, User as UserIcon } from 'lucide-react';

export type Tab = 'HOME' | 'BOOK' | 'DONATIONS' | 'PROFILE' | 'SIGNIN';

const TABS: { id: Tab; label: string }[] = [
  { id: 'HOME', label: 'Home' },
  { id: 'BOOK', label: 'Book a donation' },
  { id: 'DONATIONS', label: 'My donations' },
  { id: 'PROFILE', label: 'Profile' }
];

interface HeaderProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  onOpenAuth: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, onOpenAuth }) => {
  const { donor, donorsList, quickDemoLogin, logoutDonor, activeShortageAlerts, isAuthenticated } = useScyther();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="topbar">
      <div className="container topbar-inner">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            <Plus size={17} strokeWidth={2.6} />
          </span>
          <span className="brand-name">Bloodchain</span>
          <span className="brand-tag">Donor</span>
        </div>

        <nav className="nav" aria-label="Primary">
          {TABS.map(t => (
            <button
              key={t.id}
              className="navlink"
              aria-current={activeTab === t.id ? 'page' : undefined}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div className="account">
          {isAuthenticated ? (
            <div style={{ position: 'relative' }}>
              <button
                className="btn btn--outline"
                onClick={() => setMenuOpen(v => !v)}
                aria-expanded={menuOpen}
              >
                <span className="avatar avatar--brand">{donor.fullName.charAt(0).toUpperCase()}</span>
                <span style={{ maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {donor.fullName.split(' ')[0]}
                </span>
                <ChevronDown size={15} />
              </button>

              {menuOpen && (
                <div
                  className="card"
                  style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', width: 268, zIndex: 50 }}
                >
                  <div className="card-bd" style={{ paddingBottom: 12 }}>
                    <div style={{ fontWeight: 600 }}>{donor.fullName}</div>
                    <div className="muted" style={{ fontSize: 12.5 }}>
                      {donor.email}
                    </div>
                    <div className="muted mono" style={{ fontSize: 12, marginTop: 6 }}>
                      {donor.bloodType} · {donor.cityDistrict}
                    </div>
                  </div>

                  <div className="card-bd" style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                    <div className="meta-k" style={{ marginBottom: 6 }}>
                      Sample accounts (demonstration)
                    </div>
                    {donorsList.slice(0, 3).map(d => (
                      <button
                        key={d.id}
                        className="navlink"
                        style={{ width: '100%', textAlign: 'left', display: 'flex', justifyContent: 'space-between' }}
                        onClick={() => {
                          quickDemoLogin(d.id);
                          setMenuOpen(false);
                        }}
                      >
                        <span>{d.fullName}</span>
                        <span className="mono dim" style={{ fontSize: 12 }}>
                          {d.bloodType}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="card-bd" style={{ borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                    <button
                      className="navlink"
                      style={{ width: '100%', textAlign: 'left', display: 'flex', gap: 8, alignItems: 'center' }}
                      onClick={() => {
                        setActiveTab('PROFILE');
                        setMenuOpen(false);
                      }}
                    >
                      <UserIcon size={15} />
                      <span>Profile &amp; settings</span>
                    </button>
                    <button
                      className="navlink"
                      style={{ width: '100%', textAlign: 'left', display: 'flex', gap: 8, alignItems: 'center', color: 'var(--stop)' }}
                      onClick={() => {
                        logoutDonor();
                        setMenuOpen(false);
                      }}
                    >
                      <LogOut size={15} />
                      <span>Sign out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button className="btn btn--primary" onClick={onOpenAuth}>
              Sign in
            </button>
          )}
        </div>
      </div>

      {activeShortageAlerts.length > 0 && (
        <div className="container" style={{ paddingBottom: 12 }}>
          <div className="notice notice--stop">
            <AlertTriangle className="notice-icon" size={16} />
            <span>
              <strong>Shortage appeal — {activeShortageAlerts[0].title}.</strong>{' '}
              {activeShortageAlerts[0].description}
            </span>
          </div>
        </div>
      )}

      <div className="nav-mobile">
        <div className="container nav-mobile-inner">
          {TABS.map(t => (
            <button
              key={t.id}
              className="navlink"
              aria-current={activeTab === t.id ? 'page' : undefined}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
