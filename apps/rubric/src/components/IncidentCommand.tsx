import React, { useState } from 'react';
import { useRubric } from '../context/RubricContext';
import { AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';

const CATEGORY_LABEL: Record<string, string> = {
  COLD_CHAIN_ALERT: 'Cold-chain exception',
  BEDSIDE_MISMATCH: 'Bedside mismatch',
  LAB_QUARANTINE: 'Laboratory quarantine',
  SUPPLY_DEFICIT: 'Supply deficit',
  DONOR_APPEAL: 'Donor review'
};

export const IncidentCommand: React.FC = () => {
  const { issuesList, resolveIssue } = useRubric();

  const [category, setCategory] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [severity, setSeverity] = useState('ALL');
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [done, setDone] = useState<string | null>(null);

  const filtered = issuesList.filter(i => {
    if (category !== 'ALL' && i.category !== category) return false;
    if (status !== 'ALL' && i.status !== status) return false;
    if (severity !== 'ALL' && i.severity !== severity) return false;
    return true;
  });

  const open = issuesList.filter(i => i.status === 'OPEN').length;
  const critical = issuesList.filter(i => i.severity === 'CRITICAL' && i.status !== 'RESOLVED').length;

  const resolve = async (id: string) => {
    await resolveIssue(id, note.trim() || 'Reviewed and closed by the operations desk.');
    setDone(`${id} recorded as resolved.`);
    setResolvingId(null);
    setNote('');
  };

  return (
    <div className="stack">
      <div className="page-head">
        <div className="eyebrow">Incidents</div>
        <h1 className="page-title">Incident &amp; exception review</h1>
        <p className="page-sub">
          Cold-chain exceptions, laboratory quarantine holds, bedside discrepancies and supply deficits awaiting
          review.
        </p>
      </div>

      {done && (
        <div className="notice notice--safe">
          <CheckCircle2 className="notice-icon" size={15} />
          <span>{done}</span>
        </div>
      )}

      {critical > 0 && (
        <div className="notice notice--stop">
          <ShieldAlert className="notice-icon" size={16} />
          <span>
            <strong>{critical} critical incident{critical === 1 ? '' : 's'} open.</strong> Affected units should remain
            held from issue until an authorised reviewer closes the incident.
          </span>
        </div>
      )}

      <div className="kpi-grid">
        <div className="kpi">
          <div className="kpi-k">Open</div>
          <div className="kpi-v">{open}</div>
          <div className="kpi-n">Awaiting review</div>
        </div>
        <div className={`kpi ${critical > 0 ? 'kpi--alert' : ''}`}>
          <div className="kpi-k">Critical &amp; unresolved</div>
          <div className="kpi-v">{critical}</div>
          <div className="kpi-n">Require immediate attention</div>
        </div>
        <div className="kpi">
          <div className="kpi-k">Resolved</div>
          <div className="kpi-v">{issuesList.length - open}</div>
          <div className="kpi-n">Closed with a recorded note</div>
        </div>
        <div className="kpi">
          <div className="kpi-k">Total logged</div>
          <div className="kpi-v">{issuesList.length}</div>
          <div className="kpi-n">All categories</div>
        </div>
      </div>

      <div className="card">
        <div className="card-hd">
          <h3>Incident queue</h3>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <select className="select" style={{ width: 'auto' }} value={category} onChange={e => setCategory(e.target.value)}>
              <option value="ALL">All categories</option>
              {Object.keys(CATEGORY_LABEL).map(c => (
                <option key={c} value={c}>
                  {CATEGORY_LABEL[c]}
                </option>
              ))}
            </select>
            <select className="select" style={{ width: 'auto' }} value={status} onChange={e => setStatus(e.target.value)}>
              <option value="ALL">All statuses</option>
              <option value="OPEN">Open</option>
              <option value="INVESTIGATING">Investigating</option>
              <option value="RESOLVED">Resolved</option>
            </select>
            <select className="select" style={{ width: 'auto' }} value={severity} onChange={e => setSeverity(e.target.value)}>
              <option value="ALL">All severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
            </select>
          </div>
        </div>

        <div className="card-bd stack" style={{ gap: 12 }}>
          {filtered.length === 0 ? (
            <div className="tbl-empty">No incidents match the current filters.</div>
          ) : (
            filtered.map(issue => {
              const resolved = issue.status === 'RESOLVED';
              return (
                <div
                  key={issue.id}
                  className="card"
                  style={{ boxShadow: 'none', opacity: resolved ? 0.72 : 1 }}
                >
                  <div className="card-bd" style={{ padding: 15 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', gap: 9, alignItems: 'center', minWidth: 0 }}>
                        <span
                          className={`sev ${
                            issue.severity === 'CRITICAL' ? 'sev--critical' : issue.severity === 'HIGH' ? 'sev--high' : 'sev--medium'
                          }`}
                        >
                          {issue.severity}
                        </span>
                        <span className="mono dim" style={{ fontSize: 11.5 }}>
                          {issue.id}
                        </span>
                        <span style={{ fontWeight: 600, fontSize: 13.5 }}>{issue.title}</span>
                      </div>
                      <span className={`status ${resolved ? 'status--safe' : 'status--watch'}`}>
                        {issue.status}
                      </span>
                    </div>

                    <p className="muted" style={{ fontSize: 13, marginTop: 8 }}>
                      {issue.description}
                    </p>

                    <div className="tile-foot" style={{ marginTop: 10, flexWrap: 'wrap', gap: 12 }}>
                      <span>
                        Facility: <strong style={{ color: 'var(--ink)' }}>{issue.facility}</strong>
                      </span>
                      <span>
                        Affected: <strong style={{ color: 'var(--ink)' }}>{issue.affectedEntity}</strong>
                      </span>
                      <span>
                        {CATEGORY_LABEL[issue.category] ?? issue.category} &middot;{' '}
                        {new Date(issue.timestamp).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                    </div>

                    {issue.resolutionNotes && (
                      <div className="notice notice--safe" style={{ marginTop: 10 }}>
                        <CheckCircle2 className="notice-icon" size={14} />
                        <span style={{ fontSize: 12.5 }}>
                          {issue.resolutionNotes}
                          {issue.resolvedBy ? ` — ${issue.resolvedBy}` : ''}
                        </span>
                      </div>
                    )}

                    {!resolved && (
                      <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                        {resolvingId === issue.id ? (
                          <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
                            <input
                              className="input"
                              style={{ flex: 1, minWidth: 240 }}
                              placeholder="Resolution note (recorded against this closure)"
                              value={note}
                              onChange={e => setNote(e.target.value)}
                            />
                            <button className="btn btn--outline" onClick={() => setResolvingId(null)}>
                              Cancel
                            </button>
                            <button className="btn btn--ok" onClick={() => resolve(issue.id)}>
                              Confirm resolution
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button className="btn btn--outline" onClick={() => setResolvingId(issue.id)}>
                              <AlertTriangle size={14} />
                              Review &amp; resolve
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
