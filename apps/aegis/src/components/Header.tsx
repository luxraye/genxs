import React from 'react';
import { useAegis, WARD_UNIT_STATUSES, MONITOR_UNIT_STATUSES } from '../context/AegisContext';
import { Plus, UserCheck, HeartPulse, Building2, ShieldAlert, LogOut, Flame } from 'lucide-react';

export type AegisTab = 'BEDSIDE_SCANNER' | 'MONITOR' | 'REQUISITIONS' | 'HEMOVIGILANCE';

interface HeaderProps {
  activeTab: AegisTab;
  setActiveTab: (tab: AegisTab) => void;
  onTriggerCodeCrimson: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, onTriggerCodeCrimson }) => {
  const { currentClinician, logoutClinician, units, requests, issuesList } = useAegis();

  if (!currentClinician) return null;

  const wardUnits = units.filter(u => WARD_UNIT_STATUSES.includes(u.status)).length;
  const infusing = units.filter(u => u.status === 'BEDSIDE_CROSSMATCHED').length;
  const pendingRequests = requests.filter(r => r.status === 'PENDING').length;
  const openReactions = issuesList.filter(i => i.category === 'BEDSIDE_MISMATCH' && i.status === 'OPEN').length;

  const tabs: { id: AegisTab; label: string; icon: React.ElementType; count?: number; tone?: 'alert' | 'watch' }[] = [
    { id: 'BEDSIDE_SCANNER', label: 'Bedside verification', icon: UserCheck, count: wardUnits, tone: 'watch' },
    { id: 'MONITOR', label: 'Infusion monitor', icon: HeartPulse, count: infusing, tone: 'watch' },
    { id: 'REQUISITIONS', label: 'Ward orders', icon: Building2, count: pendingRequests, tone: 'watch' },
    { id: 'HEMOVIGILANCE', label: 'Reactions', icon: ShieldAlert, count: openReactions, tone: 'alert' }
  ];

  return (
    <header className="topbar">
      <div className="strip">
        <div className="container strip-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#3fbf7f', flexShrink: 0 }} />
            <strong>Bloodchain Ward</strong>
            <span className="strip-tag">Bedside transfusion console</span>
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
          <span className="brand-tag">Ward</span>
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
          <button className="btn btn--danger" onClick={onTriggerCodeCrimson} title="Raise an emergency order">
            <Flame size={15} />
            <span className="nav-label-desktop">Emergency</span>
          </button>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.2 }}>{currentClinician.fullName}</div>
            <div className="mono dim" style={{ fontSize: 11 }}>
              {currentClinician.badgeNumber}
            </div>
          </div>
          <button className="btn btn--outline" onClick={logoutClinician} title="Sign out">
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
