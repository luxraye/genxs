import React, { useState } from 'react';
import { useAegis } from '../context/AegisContext';
import { BloodType, ComponentType } from '@shared/types/bloodchain';
import { Building2, Send, CheckCircle2, Flame } from 'lucide-react';

export const HospitalRequisitions: React.FC = () => {
  const { requests, createHospitalRequest, currentClinician } = useAegis();

  const [hospital, setHospital] = useState('Example Referral Hospital');
  const [department, setDepartment] = useState('Emergency department');
  const [urgency, setUrgency] = useState<'EMERGENCY_CODE_CRIMSON' | 'URGENT' | 'ROUTINE'>('URGENT');
  const [bloodType, setBloodType] = useState<BloodType>('O-');
  const [componentType, setComponentType] = useState<ComponentType>('PACKED_RED_CELLS');
  const [unitsNeeded, setUnitsNeeded] = useState<number>(2);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const created = await createHospitalRequest(hospital, department, urgency, bloodType, componentType, unitsNeeded);
      setMsg(`Order ${created.id} submitted. The operations desk reviews and dispatches units from the regional vaults.`);
      setTimeout(() => setMsg(null), 8000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const pending = requests.filter(r => r.status === 'PENDING').length;

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <div className="eyebrow">Ward orders</div>
          <h1 className="page-title">Blood requisitions</h1>
          <p className="page-sub">
            Raise urgent and routine blood-product orders for the ward and track their status.
          </p>
        </div>
        <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(120px, 1fr))' }}>
          <div className="kpi">
            <div className="kpi-k">Total orders</div>
            <div className="kpi-v">{requests.length}</div>
          </div>
          <div className="kpi kpi--watch">
            <div className="kpi-k">Pending</div>
            <div className="kpi-v">{pending}</div>
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
              <Building2 size={16} /> Create blood order
            </span>
          </div>
          <div className="card-bd">
            <form onSubmit={submit} className="stack">
              <div className="field">
                <label className="label" htmlFor="r-hosp">Hospital facility</label>
                <input id="r-hosp" className="input" required value={hospital} onChange={e => setHospital(e.target.value)} />
              </div>
              <div className="field">
                <label className="label" htmlFor="r-dept">Ward or department</label>
                <input id="r-dept" className="input" required value={department} onChange={e => setDepartment(e.target.value)} />
              </div>
              <div className="field">
                <label className="label" htmlFor="r-urg">Urgency</label>
                <select
                  id="r-urg"
                  className="select"
                  value={urgency}
                  onChange={e => setUrgency(e.target.value as typeof urgency)}
                >
                  <option value="EMERGENCY_CODE_CRIMSON">Emergency — immediate life threat</option>
                  <option value="URGENT">Urgent — within two hours</option>
                  <option value="ROUTINE">Routine — planned</option>
                </select>
              </div>
              <div className="grid-2">
                <div className="field">
                  <label className="label" htmlFor="r-bt">Blood group</label>
                  <select id="r-bt" className="select" value={bloodType} onChange={e => setBloodType(e.target.value as BloodType)}>
                    {(['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'] as BloodType[]).map(bt => (
                      <option key={bt} value={bt}>{bt}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label className="label" htmlFor="r-units">Units needed</label>
                  <input
                    id="r-units"
                    className="input"
                    type="number"
                    min={1}
                    max={10}
                    value={unitsNeeded}
                    onChange={e => setUnitsNeeded(Number(e.target.value))}
                  />
                </div>
              </div>
              <div className="field">
                <label className="label" htmlFor="r-comp">Component</label>
                <select
                  id="r-comp"
                  className="select"
                  value={componentType}
                  onChange={e => setComponentType(e.target.value as ComponentType)}
                >
                  <option value="PACKED_RED_CELLS">Packed red cells</option>
                  <option value="FRESH_FROZEN_PLASMA">Fresh frozen plasma</option>
                  <option value="PLATELETS">Platelets</option>
                  <option value="CRYOPRECIPITATE">Cryoprecipitate</option>
                </select>
              </div>
              <button
                className={`btn ${urgency === 'EMERGENCY_CODE_CRIMSON' ? 'btn--danger' : 'btn--primary'} btn--block`}
                type="submit"
                disabled={isSubmitting}
              >
                {urgency === 'EMERGENCY_CODE_CRIMSON' ? <Flame size={15} /> : <Send size={15} />}
                {isSubmitting ? 'Submitting\u2026' : 'Submit order'}
              </button>
              {currentClinician && (
                <p className="hint">Raised by {currentClinician.fullName} &middot; {currentClinician.facility}</p>
              )}
            </form>
          </div>
        </div>

        <div className="card">
          <div className="card-hd">
            <strong>Order manifest</strong>
            <span className="mono dim">{requests.length}</span>
          </div>
          <div className="card-bd">
            {requests.length === 0 ? (
              <div className="tbl-empty">No orders recorded.</div>
            ) : (
              <div className="tbl-wrap">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Facility</th>
                      <th>Demand</th>
                      <th>Urgency</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map(r => (
                      <tr key={r.id}>
                        <td className="mono">{r.id}</td>
                        <td>
                          <div className="cell-strong">{r.hospitalName}</div>
                          <div className="cell-sub">{r.department}</div>
                        </td>
                        <td className="mono">{r.unitsNeeded} &times; {r.bloodType} &middot; {r.componentType.replace(/_/g, ' ').toLowerCase()}</td>
                        <td>
                          <span className={`status ${r.urgency === 'EMERGENCY_CODE_CRIMSON' ? 'status--stop' : r.urgency === 'URGENT' ? 'status--watch' : 'status--hold'}`}>
                            {r.urgency.replace(/_/g, ' ').toLowerCase()}
                          </span>
                        </td>
                        <td>
                          <span className={`status ${r.status === 'FULFILLED' ? 'status--safe' : r.status === 'DISPATCHED' ? 'status--info' : 'status--watch'}`}>
                            {r.status.toLowerCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
