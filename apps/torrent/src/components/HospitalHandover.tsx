import React, { useState } from 'react';
import { useTorrent, TRANSIT_STATUSES } from '../context/TorrentContext';
import { Building2, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

interface HospitalHandoverProps {
  initialUnitDin?: string;
}

export const HospitalHandover: React.FC<HospitalHandoverProps> = ({ initialUnitDin }) => {
  const { units, confirmHospitalReceipt } = useTorrent();

  const inTransit = units.filter(u => TRANSIT_STATUSES.includes(u.status));
  const [selectedDin, setSelectedDin] = useState<string>(initialUnitDin || inTransit[0]?.din || '');
  const [receivingStaff, setReceivingStaff] = useState('');
  const [sealsIntact, setSealsIntact] = useState(true);
  const [isConfirming, setIsConfirming] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const selectedUnit = units.find(u => u.din === selectedDin) || inTransit[0];
  const latestTemp = selectedUnit?.telemetryLogs[selectedUnit.telemetryLogs.length - 1]?.temperatureCelsius;
  const isBreached =
    selectedUnit && latestTemp !== undefined
      ? latestTemp < selectedUnit.storageTempRange.min || latestTemp > selectedUnit.storageTempRange.max
      : false;

  const confirm = async () => {
    if (!selectedUnit) return;
    setErr(null);
    if (!sealsIntact) {
      setErr('Seals must be attested intact before custody can be accepted.');
      return;
    }
    if (!receivingStaff.trim()) {
      setErr('A receiving staff name is required.');
      return;
    }
    setIsConfirming(true);
    try {
      const facility = selectedUnit.destinationHospital || 'Receiving facility';
      await confirmHospitalReceipt(selectedUnit.din, facility, receivingStaff);
      setMsg(`Custody of unit ${selectedUnit.din} transferred to ${facility}. It is now available to the ward.`);
      setTimeout(() => setMsg(null), 8000);
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <div className="eyebrow">Handover</div>
          <h1 className="page-title">Hospital handover</h1>
          <p className="page-sub">
            Inspect the arrival reading and attest the seals before accepting the unit into hospital custody.
          </p>
        </div>
        <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(120px, 1fr))' }}>
          <div className="kpi">
            <div className="kpi-k">Awaiting handover</div>
            <div className="kpi-v">{inTransit.length}</div>
          </div>
          <div className="kpi">
            <div className="kpi-k">Delivered to ward</div>
            <div className="kpi-v">{units.filter(u => u.status === 'DELIVERED_TO_HOSPITAL').length}</div>
          </div>
        </div>
      </div>

      {msg && (
        <div className="notice notice--safe">
          <CheckCircle2 className="notice-icon" size={15} />
          <span>{msg}</span>
        </div>
      )}
      {err && (
        <div className="notice notice--stop">
          <AlertTriangle className="notice-icon" size={15} />
          <span>{err}</span>
        </div>
      )}

      <div className="ward-grid">
        <div className="card">
          <div className="card-hd">
            <strong>Awaiting handover</strong>
            <span className="mono dim">{inTransit.length}</span>
          </div>
          <div className="card-bd">
            {inTransit.length === 0 ? (
              <div className="tbl-empty">No units awaiting handover.</div>
            ) : (
              <div className="wide-list">
                {inTransit.map(u => {
                  const on = u.din === selectedDin;
                  const t = u.telemetryLogs[u.telemetryLogs.length - 1]?.temperatureCelsius;
                  return (
                    <button key={u.din} className="queue-item" aria-pressed={on} onClick={() => setSelectedDin(u.din)}>
                      <div className="queue-top">
                        <span className="mono" style={{ fontWeight: 600 }}>{u.din}</span>
                        <span className="cell-strong mono">{u.bloodType}</span>
                      </div>
                      <div className="queue-foot">
                        <span>{u.destinationHospital || 'in transit'}</span>
                        <span className="mono dim">{t !== undefined ? `${t}\u00b0C` : 'no reading'}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {selectedUnit ? (
          <div className="card">
            <div className="card-hd">
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Building2 size={16} /> Intake inspection
              </span>
              <span className="mono dim">{selectedUnit.din}</span>
            </div>
            <div className="card-bd stack">
              <div className="spec-grid">
                <div className="spec">
                  <div className="spec-k">Destination</div>
                  <div className="spec-v">{selectedUnit.destinationHospital || 'not set'}</div>
                </div>
                <div className="spec">
                  <div className="spec-k">Arrival reading</div>
                  <div className="spec-v mono" style={{ color: isBreached ? 'var(--stop)' : 'var(--safe)' }}>
                    {latestTemp !== undefined ? `${latestTemp}\u00b0C` : '\u2014'}
                  </div>
                </div>
                <div className="spec">
                  <div className="spec-k">Stored range</div>
                  <div className="spec-v mono">
                    {selectedUnit.storageTempRange.min}&deg;C to {selectedUnit.storageTempRange.max}&deg;C
                  </div>
                </div>
                <div className="spec">
                  <div className="spec-k">Component</div>
                  <div className="spec-v">{selectedUnit.componentType.replace(/_/g, ' ').toLowerCase()}</div>
                </div>
              </div>

              {isBreached && (
                <div className="notice notice--stop">
                  <AlertTriangle className="notice-icon" size={15} />
                  <span>
                    The latest reading is outside the stored range. Review this unit before accepting it into
                    clinical use.
                  </span>
                </div>
              )}

              <div className="checkline">
                <input
                  id="seal"
                  type="checkbox"
                  checked={sealsIntact}
                  onChange={e => setSealsIntact(e.target.checked)}
                />
                <label htmlFor="seal">
                  I attest that the tamper-evident seals on the transport box arrived undamaged.
                </label>
              </div>

              <div className="field">
                <label className="label" htmlFor="h-staff">Receiving staff name</label>
                <input
                  id="h-staff"
                  className="input"
                  value={receivingStaff}
                  placeholder="Name and role"
                  onChange={e => setReceivingStaff(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <button className="btn btn--primary" onClick={confirm} disabled={isConfirming || !sealsIntact}>
                  <CheckCircle2 size={15} />
                  {isConfirming ? 'Recording\u2026' : 'Confirm receipt'}
                </button>
                <span className="hint" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ShieldCheck size={14} /> The handover is written to the hash-chained audit log.
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="card-bd tbl-empty">Select an in-transit unit from the left to complete intake.</div>
          </div>
        )}
      </div>
    </div>
  );
};
