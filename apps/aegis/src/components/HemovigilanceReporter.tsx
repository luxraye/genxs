import React, { useState } from 'react';
import { useAegis } from '../context/AegisContext';
import { ShieldAlert, AlertTriangle, CheckCircle2, HeartCrack } from 'lucide-react';

interface HemovigilanceReporterProps {
  initialUnitDin?: string;
}

export const HemovigilanceReporter: React.FC<HemovigilanceReporterProps> = ({ initialUnitDin }) => {
  const { units, issuesList, reportAdverseReaction, currentClinician } = useAegis();

  const [selectedDin, setSelectedDin] = useState<string>(initialUnitDin || units[0]?.din || '');
  const [reactionType, setReactionType] = useState<'FEBRILE' | 'TRALI' | 'TACO' | 'ACUTE_HEMOLYTIC'>('FEBRILE');
  const [severity, setSeverity] = useState<'MILD' | 'SEVERE' | 'LIFE_THREATENING'>('SEVERE');
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const selectedUnit = units.find(u => u.din === selectedDin);
  const reactionIssues = issuesList.filter(i => i.category === 'BEDSIDE_MISMATCH');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDin) return;
    setIsSubmitting(true);
    try {
      const clinician = currentClinician ? currentClinician.fullName : 'Ward clinician';
      await reportAdverseReaction(selectedDin, reactionType, severity, notes, clinician);
      setMsg(`Reaction recorded against unit ${selectedDin}. An incident was raised for review; linked components are flagged.`);
      setTimeout(() => setMsg(null), 8000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <div className="eyebrow">Reactions</div>
          <h1 className="page-title">Adverse reaction reporting</h1>
          <p className="page-sub">
            Record a suspected transfusion reaction against a unit. This raises an incident and flags linked donor
            components for review.
          </p>
        </div>
        <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(120px, 1fr))' }}>
          <div className="kpi kpi--alert">
            <div className="kpi-k">Open alerts</div>
            <div className="kpi-v">{reactionIssues.filter(i => i.status === 'OPEN').length}</div>
          </div>
          <div className="kpi">
            <div className="kpi-k">Total</div>
            <div className="kpi-v">{reactionIssues.length}</div>
          </div>
        </div>
      </div>

      {msg && (
        <div className="notice notice--safe">
          <CheckCircle2 className="notice-icon" size={15} />
          <span>{msg}</span>
        </div>
      )}

      <div className="ward-grid">
        <div className="card">
          <div className="card-hd">
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <HeartCrack size={16} /> Report a reaction
            </span>
          </div>
          <div className="card-bd">
            <form onSubmit={submit} className="stack">
              <div className="field">
                <label className="label" htmlFor="h-unit">Blood unit (ISBT 128 DIN)</label>
                <select id="h-unit" className="select" value={selectedDin} onChange={e => setSelectedDin(e.target.value)}>
                  {units.map(u => (
                    <option key={u.din} value={u.din}>
                      {u.din} &middot; {u.bloodType} ({u.status.replace(/_/g, ' ').toLowerCase()})
                    </option>
                  ))}
                </select>
              </div>

              {selectedUnit && (
                <div className="spec-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                  <div className="spec">
                    <div className="spec-k">Donor group</div>
                    <div className="spec-v mono">{selectedUnit.bloodType}</div>
                  </div>
                  <div className="spec">
                    <div className="spec-k">Component</div>
                    <div className="spec-v">{selectedUnit.componentType.replace(/_/g, ' ').toLowerCase()}</div>
                  </div>
                </div>
              )}

              <div className="field">
                <label className="label" htmlFor="h-type">Reaction classification</label>
                <select id="h-type" className="select" value={reactionType} onChange={e => setReactionType(e.target.value as typeof reactionType)}>
                  <option value="FEBRILE">Febrile non-haemolytic</option>
                  <option value="TRALI">TRALI — acute lung injury</option>
                  <option value="TACO">TACO — circulatory overload</option>
                  <option value="ACUTE_HEMOLYTIC">Acute haemolytic</option>
                </select>
              </div>

              <div className="field">
                <label className="label" htmlFor="h-sev">Severity</label>
                <select id="h-sev" className="select" value={severity} onChange={e => setSeverity(e.target.value as typeof severity)}>
                  <option value="MILD">Mild — monitored</option>
                  <option value="SEVERE">Severe — resuscitation</option>
                  <option value="LIFE_THREATENING">Life-threatening — critical care</option>
                </select>
              </div>

              <div className="field">
                <label className="label" htmlFor="h-notes">Observations, symptoms and actions taken</label>
                <textarea
                  id="h-notes"
                  className="textarea"
                  rows={4}
                  required
                  value={notes}
                  placeholder="e.g. rigors and fever 25 minutes into infusion; line clamped immediately."
                  onChange={e => setNotes(e.target.value)}
                />
              </div>

              <button className="btn btn--danger btn--block" type="submit" disabled={isSubmitting}>
                <AlertTriangle size={15} />
                {isSubmitting ? 'Recording\u2026' : 'Record reaction and raise incident'}
              </button>
            </form>
          </div>
        </div>

        <div className="card">
          <div className="card-hd">
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShieldAlert size={16} /> Incident registry
            </span>
            <span className="mono dim">{reactionIssues.length}</span>
          </div>
          <div className="card-bd">
            {reactionIssues.length === 0 ? (
              <div className="tbl-empty">No adverse reactions recorded.</div>
            ) : (
              <div className="wide-list">
                {reactionIssues.map(issue => {
                  const critical = issue.severity === 'CRITICAL';
                  return (
                    <div key={issue.id} className="tile" style={{ borderColor: critical ? 'var(--stop)' : 'var(--border)' }}>
                      <div className="tile-top">
                        <span className={`sev ${critical ? 'sev--critical' : 'sev--high'}`}>{issue.severity.toLowerCase()}</span>
                        <span className="mono dim">{issue.id}</span>
                        <span className={`status ${issue.status === 'OPEN' ? 'status--stop' : 'status--safe'}`}>
                          {issue.status.toLowerCase()}
                        </span>
                      </div>
                      <div className="cell-strong" style={{ marginTop: 6 }}>{issue.title}</div>
                      <p className="muted" style={{ fontSize: 12.5, marginTop: 4 }}>{issue.description}</p>
                      <div className="tile-foot mono dim">
                        <span>{issue.facility}</span>
                        <span>{issue.affectedEntity}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
