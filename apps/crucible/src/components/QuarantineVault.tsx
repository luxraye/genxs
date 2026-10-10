import React from 'react';
import { useCrucible } from '../context/CrucibleContext';
import { ShieldAlert, Info, PackageX } from 'lucide-react';

export const QuarantineVault: React.FC = () => {
  const { units, issuesList } = useCrucible();

  const held = units.filter(u => u.status === 'QUARANTINED');
  const holdIssues = issuesList.filter(i => i.category === 'LAB_QUARANTINE');

  return (
    <div className="stack">
      <div className="page-head">
        <div className="eyebrow">Held units</div>
        <h1 className="page-title">Units on hold &amp; hold history</h1>
        <p className="page-sub">
          Units held from issue, and the record of why. Held units must not be released to a ward.
        </p>
      </div>

      <div className="notice notice--stop">
        <ShieldAlert className="notice-icon" size={16} />
        <span>
          <strong>Held units are excluded from issue.</strong> A unit in this state must not be dispatched to a ward
          until an authorised reviewer clears it.
        </span>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-hd">
            <h3>Units on hold</h3>
            <span className="badge">{held.length}</span>
          </div>
          <div className="card-bd stack" style={{ gap: 10, maxHeight: 520, overflowY: 'auto' }}>
            {held.length === 0 ? (
              <div className="empty">
                <PackageX className="empty-icon" size={24} />
                <div style={{ fontWeight: 600, color: 'var(--ink)' }}>No units currently on hold</div>
                <p style={{ fontSize: 12.5, marginTop: 6 }}>Units placed on hold will be listed here.</p>
              </div>
            ) : (
              held.map(u => (
                <div key={u.din} className="card" style={{ boxShadow: 'none', borderColor: '#eec3bf' }}>
                  <div className="card-bd" style={{ padding: 13 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                      <span className="mono" style={{ fontWeight: 600 }}>{u.din}</span>
                      <span className="strong-group">{u.bloodType}</span>
                    </div>
                    <div className="cell-sub" style={{ marginTop: 5 }}>
                      {u.componentType.replace(/_/g, ' ').toLowerCase()} &middot; {u.volumeMl} mL
                    </div>
                    <div className="cell-sub">{u.currentFacility}</div>
                    <div style={{ marginTop: 9 }}>
                      <span className="status status--stop">Held from issue</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-hd">
            <h3>Hold history</h3>
            <span className="badge">{holdIssues.length}</span>
          </div>
          <div className="card-bd stack" style={{ gap: 10, maxHeight: 520, overflowY: 'auto' }}>
            {holdIssues.length === 0 ? (
              <div className="empty">
                <Info className="empty-icon" size={22} />
                <div style={{ fontWeight: 600, color: 'var(--ink)' }}>No holds recorded</div>
              </div>
            ) : (
              holdIssues.map(i => (
                <div key={i.id} className="card" style={{ boxShadow: 'none' }}>
                  <div className="card-bd" style={{ padding: 13 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                      <span className="mono dim" style={{ fontSize: 11.5 }}>{i.id}</span>
                      <span className={`sev ${i.severity === 'CRITICAL' ? 'sev--critical' : 'sev--high'}`}>
                        {i.severity}
                      </span>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 13, marginTop: 6 }}>{i.title}</div>
                    <p className="muted" style={{ fontSize: 12.5, marginTop: 5 }}>{i.description}</p>
                    <div className="tile-foot" style={{ marginTop: 9, flexWrap: 'wrap', gap: 10 }}>
                      <span>{i.affectedEntity}</span>
                      <span>
                        {new Date(i.timestamp).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
