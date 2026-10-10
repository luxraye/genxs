import React, { useState } from 'react';
import { useAegis, WARD_UNIT_STATUSES } from '../context/AegisContext';
import { BloodType } from '@shared/types/bloodchain';
import { isRbcCompatible } from '@shared/lib/bloodCompatibility';
import { UserCheck, QrCode, CheckCircle2, AlertOctagon, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';

interface BedsideScannerProps {
  onProceedToMonitor: (unitDin: string) => void;
}

export const BedsideScanner: React.FC<BedsideScannerProps> = ({ onProceedToMonitor }) => {
  const { units, verifyBedsideCrossmatch, currentClinician } = useAegis();

  const wardUnits = units.filter(u => WARD_UNIT_STATUSES.includes(u.status));

  const [selectedDin, setSelectedDin] = useState<string>(wardUnits[0]?.din || '');
  const [patientId, setPatientId] = useState<string>('PT-0001');
  const [patientBloodType, setPatientBloodType] = useState<BloodType>('O-');
  const [witness1, setWitness1] = useState<string>('');
  const [witness2, setWitness2] = useState<string>(
    currentClinician ? `${currentClinician.fullName} (${currentClinician.badgeNumber})` : ''
  );

  const [isVerifying, setIsVerifying] = useState(false);
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);

  const selectedUnit = units.find(u => u.din === selectedDin) || wardUnits[0];
  const isCompatible = selectedUnit ? isRbcCompatible(selectedUnit.bloodType, patientBloodType) : false;
  const crossmatched = units.filter(u => u.status === 'BEDSIDE_CROSSMATCHED').length;

  const run = async () => {
    if (!selectedUnit) return;
    setIsVerifying(true);
    setFeedback(null);
    try {
      const res = await verifyBedsideCrossmatch(selectedUnit.din, patientId, patientBloodType, witness1, witness2);
      setFeedback({
        success: res.success,
        message: res.success
          ? `Verified. Donor red cells ${selectedUnit.bloodType} are compatible with patient ${patientBloodType}. Both witnesses recorded against the unit.`
          : res.error || 'Bedside verification failed.'
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <div className="eyebrow">Bedside verification</div>
          <h1 className="page-title">Bedside dual-verification</h1>
          <p className="page-sub">
            Compare the blood-bag ISBT 128 barcode against the patient wristband before the line is opened. Two
            clinicians must be recorded.
          </p>
        </div>
        <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(120px, 1fr))' }}>
          <div className="kpi">
            <div className="kpi-k">Ward units</div>
            <div className="kpi-v">{wardUnits.length}</div>
          </div>
          <div className="kpi">
            <div className="kpi-k">Crossmatched</div>
            <div className="kpi-v">{crossmatched}</div>
          </div>
        </div>
      </div>

      <div className="ward-grid">
        <div className="card">
          <div className="card-hd">
            <strong>Delivered ward units</strong>
            <span className="mono dim">{wardUnits.length}</span>
          </div>
          <div className="card-bd">
            {wardUnits.length === 0 ? (
              <div className="tbl-empty">No units delivered to the ward. Raise a ward order first.</div>
            ) : (
              <div className="wide-list">
                {wardUnits.map(u => {
                  const on = u.din === selectedDin;
                  return (
                    <button
                      key={u.din}
                      className="queue-item"
                      aria-pressed={on}
                      onClick={() => {
                        setSelectedDin(u.din);
                        setFeedback(null);
                      }}
                    >
                      <div className="queue-top">
                        <span className="mono" style={{ fontWeight: 600 }}>{u.din}</span>
                        <span className="cell-strong mono">{u.bloodType}</span>
                      </div>
                      <div className="queue-foot">
                        <span>{u.componentType.replace(/_/g, ' ').toLowerCase()}</span>
                        <span className="status status--hold">{u.status.replace(/_/g, ' ').toLowerCase()}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {selectedUnit ? (
          <div className="stack">
            <div className="card">
              <div className="card-hd">
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <UserCheck size={16} /> Bedside verification terminal
                </span>
                <span className="mono dim">{selectedUnit.din}</span>
              </div>
              <div className="card-bd stack">
                <div className="verify-pair">
                  <div className="scan-cell">
                    <div className="queue-top" style={{ marginBottom: 8 }}>
                      <span className="mono dim" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <QrCode size={14} /> Blood bag
                      </span>
                      <span className="mono dim">ISBT 128</span>
                    </div>
                    <div className="mono" style={{ fontWeight: 600 }}>{selectedUnit.din}</div>
                    <div className="spec-grid" style={{ marginTop: 10, gridTemplateColumns: '1fr 1fr' }}>
                      <div className="spec">
                        <div className="spec-k">Donor group</div>
                        <div className="spec-v" style={{ fontSize: 22, fontWeight: 700 }}>{selectedUnit.bloodType}</div>
                      </div>
                      <div className="spec">
                        <div className="spec-k">Component</div>
                        <div className="spec-v">{selectedUnit.componentType.replace(/_/g, ' ').toLowerCase()}</div>
                      </div>
                    </div>
                    <div className="hint" style={{ marginTop: 8 }}>{selectedUnit.currentFacility}</div>
                  </div>

                  <div className="scan-cell">
                    <div className="queue-top" style={{ marginBottom: 8 }}>
                      <span className="mono dim" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <QrCode size={14} /> Patient wristband
                      </span>
                      <span className="mono dim">EHR scan</span>
                    </div>
                    <div className="field">
                      <label className="label" htmlFor="pt-id">Patient reference</label>
                      <input
                        id="pt-id"
                        className="input"
                        value={patientId}
                        onChange={e => setPatientId(e.target.value)}
                      />
                    </div>
                    <div className="field">
                      <label className="label" htmlFor="pt-bt">Recipient ABO/Rh</label>
                      <select
                        id="pt-bt"
                        className="select"
                        value={patientBloodType}
                        onChange={e => setPatientBloodType(e.target.value as BloodType)}
                      >
                        {(['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'] as BloodType[]).map(bt => (
                          <option key={bt} value={bt}>{bt}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="field">
                  <label className="label" htmlFor="w1">Witnessing clinician 1</label>
                  <input
                    id="w1"
                    className="input"
                    value={witness1}
                    placeholder="Name and role"
                    onChange={e => setWitness1(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label className="label" htmlFor="w2">Witnessing clinician 2</label>
                  <input
                    id="w2"
                    className="input"
                    value={witness2}
                    placeholder="Name and role"
                    onChange={e => setWitness2(e.target.value)}
                  />
                </div>

                <div className={`notice ${isCompatible ? 'notice--safe' : 'notice--stop'}`}>
                  {isCompatible ? <CheckCircle2 className="notice-icon" size={15} /> : <AlertOctagon className="notice-icon" size={15} />}
                  <span>
                    <strong>{isCompatible ? 'ABO/Rh rule: compatible' : 'ABO/Rh rule: incompatible'}</strong>{' '}
                    {selectedUnit.bloodType} donor red cells against a {patientBloodType} recipient.
                    {isCompatible
                      ? ' Compatible under the red-cell rule.'
                      : ' This combination must not be transfused; the line stays locked.'}
                  </span>
                </div>

                {feedback && (
                  <div className={`notice ${feedback.success ? 'notice--safe' : 'notice--stop'}`}>
                    {feedback.success ? <CheckCircle2 className="notice-icon" size={15} /> : <AlertCircle className="notice-icon" size={15} />}
                    <span>{feedback.message}</span>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                  <button className="btn btn--primary" onClick={run} disabled={isVerifying || !isCompatible}>
                    <UserCheck size={15} />
                    {isVerifying ? 'Recording\u2026' : 'Verify and record witnesses'}
                  </button>
                  {selectedUnit.status === 'BEDSIDE_CROSSMATCHED' && (
                    <button className="btn btn--outline" onClick={() => onProceedToMonitor(selectedUnit.din)}>
                      Proceed to infusion monitor
                      <ArrowRight size={15} />
                    </button>
                  )}
                  <span className="hint" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ShieldCheck size={14} /> Two different witnesses are required.
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="card-bd tbl-empty">Select a delivered unit from the left to begin verification.</div>
          </div>
        )}
      </div>
    </div>
  );
};
