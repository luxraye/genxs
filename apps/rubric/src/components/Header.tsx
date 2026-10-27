import React from 'react';
import { useRubric } from '../context/RubricContext';
import { Plus, Activity, Building2, Users, UserCheck, AlertTriangle, LogOut, TrendingUp, Sparkles } from 'lucide-react';

export type Tab = 'MATRIX' | 'REQUISITIONS' | 'STAFF' | 'DONORS' | 'INCIDENTS' | 'ADVISORY';

interface HeaderProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  onOpenCopilot?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, onOpenCopilot }) => {
  const { currentOperator, logoutOperator, criticalDeficitCount, requests, issuesList } = useRubric();

  if (!currentOperator) return null;

  const pendingRequests = requests.filter(r => r.status === 'PENDING').length;
  const openIssues = issuesList.filter(i => i.status === 'OPEN').length;

  const tabs: { id: Tab; label: string; icon: React.ElementType; count?: number; tone?: 'alert' | 'watch' }[] = [
    { id: 'MATRIX', label: 'Inventory', icon: Activity, count: criticalDeficitCount, tone: 'alert' },
    { id: 'REQUISITIONS', label: 'Requisitions', icon: Building2, count: pendingRequests, tone: 'watch' },
    { id: 'STAFF', label: 'Personnel', icon: Users },
    { id: 'DONORS', label: 'Donor verification', icon: UserCheck },
    { id: 'INCIDENTS', label: 'Incidents', icon: AlertTriangle, count: openIssues, tone: 'alert' },
    { id: 'ADVISORY', label: 'Advisory', icon: TrendingUp }
  ];

  return (
    <header className="topbar">
      <div className="strip">
        <div className="container strip-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
            <span
              className="bc-dot"
              style={{ width: 7, height: 7, borderRadius: '50%', background: '#3fbf7f', flexShrink: 0 }}
            />
            <strong>Bloodchain Operations</strong>
            <span className="strip-tag">National blood operations console</span>
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
          <span className="brand-tag">Operations</span>
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

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          {onOpenCopilot && (
            <button
              type="button"
              onClick={onOpenCopilot}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid #8e1b2e',
                color: '#8e1b2e',
                background: '#f8edef',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
              title="Launch Bloodchain AI Copilot (Tier 2 Operational Query)"
            >
              <Sparkles size={14} />
              <span>AI Copilot</span>
              <span style={{ fontSize: 9, background: '#8e1b2e', color: '#fff', padding: '1px 4px', borderRadius: 3, fontFamily: 'monospace' }}>
                T2
              </span>
            </button>
          )}

          <div style={{ textAlign: 'right' }} className="op-id">
            <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.2 }}>{currentOperator.fullName}</div>
            <div className="mono dim" style={{ fontSize: 11 }}>
              {currentOperator.badgeNumber}
            </div>
          </div>
          <button className="btn btn--outline" onClick={logoutOperator} title="Sign out">
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
