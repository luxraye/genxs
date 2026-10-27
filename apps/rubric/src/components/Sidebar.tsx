import React from 'react';
import { useRubric } from '../context/RubricContext';
import { 
  Plus, 
  Activity, 
  Building2, 
  Users, 
  UserCheck, 
  AlertTriangle, 
  LogOut, 
  TrendingUp, 
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  X
} from 'lucide-react';

export type Tab = 'MATRIX' | 'REQUISITIONS' | 'STAFF' | 'DONORS' | 'INCIDENTS' | 'ADVISORY';

interface SidebarProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  onOpenCopilot: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onOpenCopilot,
  mobileOpen,
  onCloseMobile
}) => {
  const { currentOperator, logoutOperator, criticalDeficitCount, requests, issuesList } = useRubric();

  if (!currentOperator) return null;

  const pendingRequests = requests.filter(r => r.status === 'PENDING').length;
  const openIssues = issuesList.filter(i => i.status === 'OPEN').length;

  const tabs: { 
    id: Tab; 
    label: string; 
    icon: React.ElementType; 
    count?: number; 
    tone?: 'alert' | 'watch';
    detail: string;
  }[] = [
    { id: 'MATRIX', label: 'Inventory', icon: Activity, count: criticalDeficitCount, tone: 'alert', detail: 'Deficit matrix & cover' },
    { id: 'REQUISITIONS', label: 'Requisitions', icon: Building2, count: pendingRequests, tone: 'watch', detail: 'Hospital demand & dispatch' },
    { id: 'STAFF', label: 'Personnel', icon: Users, detail: 'Access & authorization' },
    { id: 'DONORS', label: 'Donor verification', icon: UserCheck, detail: 'Eligibility & screening desk' },
    { id: 'INCIDENTS', label: 'Incidents', icon: AlertTriangle, count: openIssues, tone: 'alert', detail: 'Cold-chain & telemetry' },
    { id: 'ADVISORY', label: 'Advisory', icon: TrendingUp, detail: 'Epidemiological insights' }
  ];

  // Operator initials
  const initials = currentOperator.fullName
    .split(' ')
    .filter(Boolean)
    .map(p => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'OP';

  return (
    <aside className={`rubric-sidebar ${mobileOpen ? 'rubric-sidebar--open' : ''}`}>
      {/* Top Brand Header */}
      <div className="sidebar-brand-box">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="brand-mark" style={{ background: '#8e1b2e', color: '#fff' }}>
              <Plus size={17} strokeWidth={2.8} />
            </span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="sidebar-brand-title">Bloodchain</span>
                <span className="sidebar-brand-badge">OPS</span>
              </div>
              <div className="sidebar-brand-sub">National Operations Console</div>
            </div>
          </div>

          {/* Close button on mobile */}
          <button 
            type="button" 
            className="sidebar-close-btn"
            onClick={onCloseMobile}
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>

        {/* Live Connectivity Pulse */}
        <div className="sidebar-live-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="sidebar-pulse-dot" />
            <span style={{ color: '#4ade80', fontWeight: 600, fontSize: 11 }}>Core Connected</span>
          </div>
          <span style={{ color: '#8a94a6', fontSize: 10.5, fontFamily: 'monospace' }}>ISBT 128</span>
        </div>
      </div>

      {/* Action: AI Copilot Launcher */}
      <div className="sidebar-copilot-wrap">
        <button
          type="button"
          onClick={onOpenCopilot}
          className="sidebar-copilot-card"
          title="Launch Bloodchain AI Copilot (Tier 2 Advisory)"
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <div className="sidebar-copilot-icon-wrap">
                <Sparkles size={15} />
              </div>
              <span style={{ fontWeight: 700, fontSize: 13.5, color: '#fff' }}>AI Copilot</span>
            </div>
            <span className="sidebar-copilot-tag">Tier 2</span>
          </div>
          <p style={{ margin: 0, fontSize: 11, color: '#f1d5da', lineHeight: 1.35, textAlign: 'left' }}>
            Interactive natural language clinical &amp; inventory intelligence
          </p>
        </button>
      </div>

      {/* Navigation Sections */}
      <div className="sidebar-nav-container">
        <div className="sidebar-section-title">Operations Command</div>

        <nav className="sidebar-nav" aria-label="Main Navigation">
          {tabs.map(t => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;

            return (
              <button
                key={t.id}
                type="button"
                className={`sidebar-nav-item ${isActive ? 'sidebar-nav-item--active' : ''}`}
                onClick={() => {
                  setActiveTab(t.id);
                  onCloseMobile();
                }}
                aria-current={isActive ? 'page' : undefined}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <Icon size={16} className="sidebar-nav-icon" />
                  <div style={{ textAlign: 'left', minWidth: 0 }}>
                    <div className="sidebar-nav-label">{t.label}</div>
                  </div>
                </div>

                {t.count !== undefined && t.count > 0 && (
                  <span className={`count ${t.tone === 'alert' ? 'count--alert' : 'count--watch'}`}>
                    {t.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Governance & Trust Badges */}
        <div className="sidebar-section-title" style={{ marginTop: 14 }}>
          Governance &amp; Audit
        </div>
        <div className="sidebar-trust-box">
          <div className="sidebar-trust-item">
            <CheckCircle2 size={12} color="#4ade80" />
            <span>Audit log: hash-chained</span>
          </div>
          <div className="sidebar-trust-item">
            <ShieldCheck size={12} color="#93c5fd" />
            <span>Botswana DPA 18 of 2024</span>
          </div>
          <div className="sidebar-trust-item">
            <span style={{ fontSize: 9.5, fontWeight: 700, background: '#323a48', padding: '1px 4px', borderRadius: 3, color: '#e2e8f0' }}>
              CS
            </span>
            <span>Safety CS-13 to CS-16</span>
          </div>
        </div>
      </div>

      {/* Operator Profile Card & Sign Out (Sticky Footer) */}
      <div className="sidebar-footer">
        <div className="sidebar-operator-card">
          <div className="sidebar-avatar" title={currentOperator.fullName}>
            {initials}
          </div>
          <div className="sidebar-op-info">
            <div className="sidebar-op-name" title={currentOperator.fullName}>
              {currentOperator.fullName}
            </div>
            <div className="sidebar-op-badge">
              {currentOperator.badgeNumber}
            </div>
          </div>
          <button
            type="button"
            className="sidebar-logout-btn"
            onClick={logoutOperator}
            title="Sign out of Operations console"
            aria-label="Sign out"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
};
