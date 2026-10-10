import React from 'react';
import { useCrucible, AWAITING_STATUSES } from '../context/CrucibleContext';
import { Plus, FlaskConical, Layers, ShieldAlert, LogOut, Info } from 'lucide-react';

export type CrucibleTab = 'SEROLOGY' | 'FRACTIONATION' | 'QUARANTINE';

interface HeaderProps {
  activeTab: CrucibleTab;
  setActiveTab: (tab: CrucibleTab) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  const { currentScientist, logoutScientist, units } = useCrucible();

  if (!currentScientist) return null;

  const awaiting = units.filter(u => AWAITING_STATUSES.includes(u.status)).length;
  const held = units.filter(u => u.status === 'QUARANTINED').length;

  const tabs: { id: CrucibleTab; label: string; icon: React.ElementType; count?: number; tone?: 'alert' | 'watch' }[] = [
    { id: 'SEROLOGY', label: 'Screening & release', icon: FlaskConical, count: awaiting, tone: 'watch' },
    { id: 'FRACTIONATION', label: 'Component preparation', icon: Layers },
    { id: 'QUARANTINE', label: 'Held units', icon: ShieldAlert, count: held, tone: 'alert' }
  ];

  return (
    <header className="topbar">
      <div className="strip">
        <div className="container strip-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#3fbf7f', flexShrink: 0 }} />
            <strong>Bloodchain Laboratory</strong>
            <span className="strip-tag">National blood laboratory console</span>
          </div>
          <div className="strip-tag" style={{ display: 'flex', gap: 14 }}>
            <span>Audit log: hash-chained</span>
            <span>Aligned to ISBT 128</span>
          </div>
        </div>
      </div>

      <div className="container topbar-inner">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            <Plus size={17} strokeWidth={2.6} />
          </span>
          <span className="brand-name">Bloodchain</span>
          <span className="brand-tag">Laboratory</span>
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
                {t.count !== undefined && t.count > 0 && (
                  <span className={`count ${t.tone === 'alert' ? 'count--alert' : 'count--watch'}`}>{t.count}</span>
                )}
              </button>
            );
          })}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.2 }}>{currentScientist.fullName}</div>
            <div className="mono dim" style={{ fontSize: 11 }}>
              {currentScientist.badgeNumber}
            </div>
          </div>
          <button className="btn btn--outline" onClick={logoutScientist} title="Sign out">
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
              {t.count !== undefined && t.count > 0 && <span className="count">{t.count}</span>}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
