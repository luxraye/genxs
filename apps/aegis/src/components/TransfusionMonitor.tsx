import React, { useState } from 'react';
import { useAegis, MONITOR_UNIT_STATUSES } from '../context/AegisContext';
import { HeartPulse, CheckCircle2, ShieldCheck, AlertTriangle } from 'lucide-react';

interface TransfusionMonitorProps {
  initialUnitDin?: string;
  onNavigateToHemovigilance: (unitDin: string) => void;
}

export const TransfusionMonitor: React.FC<TransfusionMonitorProps> = ({ initialUnitDin, onNavigateToHemovigilance }) => {
  const { units, completeTransfusion, currentClinician } = useAegis();

  const relevant = units.filter(u => MONITOR_UNIT_STATUSES.includes(u.status));
  const [selectedDin, setSelectedDin] = useState<string>(initialUnitDin || relevant[0]?.din || '');

  const [bpSystolic, setBpSystolic] = useState('120');
  const [bpDiastolic, setBpDiastolic] = useState('80');
  const [pulse, setPulse] = useState('74');
  const [temperature, setTemperature] = useState('36.8');
  const [spo2, setSpo2] = useState('99');
  const [notes, setNotes] = useState('Patient stable throughout infusion. No rigors or dyspnoea observed.');
  const [isCompleting, setIsCompleting] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  const active = units.find(u => u.din === selectedDin) || relevant[0];

  const complete = async () => {
    if (!active) return;
    setIsCompleting(true);
    try {
      const clinician = currentClinician ? currentClinician.fullName : 'Ward clinician';
      const summary = `BP ${bpSystolic}/${bpDiastolic} mmHg, pulse ${pulse} bpm, temp ${temperature}°C, SpO2 ${spo2}%. Notes: ${notes}`;
      await completeTransfusion(active.din, clinician, summary);
      setDone(`Transfusion closed for unit ${active.din}. The completed observation was added to the audit log.`);
      setTimeout(() => setDone(null), 6000);
    } finally {
      setIsCompleting(false);
    }
  };

  const infusing = units.filter(u => u.status === 'BEDSIDE_CROSSMATCHED').length;
  const completed = units.filter(u => u.status === 'TRANSFUSED').length;

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <div className="eyebrow">Infusion monitor</div>
          <h1 className="page-title">Transfusion administration</h1>
          <p className="page-sub">
            Record bedside observations during infusion and close the unit&rsquo;s journey.
          </p>
        </div>
        <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(120px, 1fr))' }}>
          <div className="kpi">
            <div className="kpi-k">Infusing</div>
            <div className="kpi-v">{infusing}</div>
          </div>
          <div className="kpi kpi--watch">
            <div className="kpi-k">Completed</div>
            <div className="kpi-v">{completed}</div>
          </div>
        </div>
      </div>

      {done && (
        <div className="notice notice--safe">
          <CheckCircle2 className="notice-icon" size={15} />
          <span>{done}</span>
        </div>
      )}

      <div className="ward-grid">
        <div className="card">
          <div className="card-hd">
            <strong>Infusions in ward</strong>
            <span className="mono dim">{relevant.length}</span>
          </div>
          <div className="card-bd">
            {relevant.length === 0 ? (
              <div className="tbl-empty">No crossmatched units in the ward. Verify a unit at the bedside first.</div>
            ) : (
              <div className="wide-list">
                {relevant.map(u => {
                  const on = u.din === selectedDin;
                  const isDone = u.status === 'TRANSFUSED';
                  return (
                    <button key={u.din} className="queue-item" aria-pressed={on} onClick={() => setSelectedDin(u.din)}>
                      <div className="queue-top">
                        <span className="mono" style={{ fontWeight: 600 }}>{u.din}</span>
                        <span className="cell-strong mono">{u.bloodType}</span>
                      </div>
                      <div className="queue-foot">
                        <span>{u.componentType.replace(/_/g, ' ').toLowerCase()}</span>
                        <span className={`status ${isDone ? 'status--safe' : 'status--watch'}`}>
                          {u.status.replace(/_/g, ' ').toLowerCase()}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {active ? (
          <div className="card">
            <div className="card-hd">
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <HeartPulse size={16} /> Infusion deck
              </span>
              <span className={`status ${active.status === 'TRANSFUSED' ? 'status--safe' : 'status--watch'}`}>
                {active.status.replace(/_/g, ' ').toLowerCase()}
              </span>
            </div>
            <div className="card-bd stack">
              <div className="spec-grid">
                <div className="spec">
                  <div className="spec-k">Patient reference</div>
                  <div className="spec-v mono">{active.patientHash || 'not recorded'}</div>
                </div>
                <div className="spec">
                  <div className="spec-k">Donor group</div>
                  <div className="spec-v mono">{active.bloodType} &middot; {active.componentType.replace(/_/g, ' ').toLowerCase()}</div>
                </div>
                <div className="spec">
                  <div className="spec-k">Recipient ABO/Rh</div>
                  <div className="spec-v mono">{active.patientAssignedBloodType || 'not recorded'}</div>
                </div>
                <div className="spec">
                  <div className="spec-k">Ward location</div>
                  <div className="spec-v">{active.currentFacility}</div>
                </div>
              </div>

              <div>
                <div className="eyebrow" style={{ marginBottom: 8 }}>Bedside observations</div>
                <div className="vitals">
                  <div className="field">
                    <label className="label" htmlFor="v-bp">BP systolic (mmHg)</label>
                    <input id="v-bp" className="input" type="number" value={bpSystolic} onChange={e => setBpSystolic(e.target.value)} />
                  </div>
                  <div className="field">
                    <label className="label" htmlFor="v-bpd">BP diastolic (mmHg)</label>
                    <input id="v-bpd" className="input" type="number" value={bpDiastolic} onChange={e => setBpDiastolic(e.target.value)} />
                  </div>
                  <div className="field">
                    <label className="label" htmlFor="v-pulse">Pulse (bpm)</label>
                    <input id="v-pulse" className="input" type="number" value={pulse} onChange={e => setPulse(e.target.value)} />
                  </div>
                  <div className="field">
                    <label className="label" htmlFor="v-temp">Temp (°C)</label>
                    <input id="v-temp" className="input" value={temperature} onChange={e => setTemperature(e.target.value)} />
                  </div>
                  <div className="field">
                    <label className="label" htmlFor="v-spo2">SpO2 (%)</label>
                    <input id="v-spo2" className="input" type="number" value={spo2} onChange={e => setSpo2(e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="field">
                <label className="label" htmlFor="v-notes">Clinical notes</label>
                <textarea id="v-notes" className="textarea" rows={3} value={notes} onChange={e => setNotes(e.target.value)} />
              </div>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <button className="btn btn--danger" onClick={() => onNavigateToHemovigilance(active.din)}>
                  <AlertTriangle size={15} />
                  Report an adverse reaction
                </button>
                {active.status === 'BEDSIDE_CROSSMATCHED' && (
                  <button className="btn btn--primary" onClick={complete} disabled={isCompleting}>
                    <CheckCircle2 size={15} />
                    {isCompleting ? 'Recording\u2026' : 'Complete transfusion'}
                  </button>
                )}
                {active.status === 'TRANSFUSED' && (
                  <span className="hint" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ShieldCheck size={14} /> Transfusion completed.
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="card-bd tbl-empty">Select a unit from the left to record observations.</div>
          </div>
        )}
      </div>
    </div>
  );
};
