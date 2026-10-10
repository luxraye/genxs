import React, { useState } from 'react';
import { useRubric } from '../context/RubricContext';
import { Send, CheckCircle2, AlertTriangle, Search } from 'lucide-react';
import type { HospitalRequest } from '@shared/types/bloodchain';

const urgencyLabel = (u: HospitalRequest['urgency']) =>
  u === 'EMERGENCY_CODE_CRIMSON' ? 'Emergency' : u === 'URGENT' ? 'Urgent' : 'Routine';

const urgencyTone = (u: HospitalRequest['urgency']) =>
  u === 'EMERGENCY_CODE_CRIMSON' ? 'status--stop' : u === 'URGENT' ? 'status--watch' : 'status--hold';

export const RequisitionConductor: React.FC = () => {
  const { requests, units, fulfillRequest } = useRubric();

  const [statusFilter, setStatusFilter] = useState('ALL');
  const [urgencyFilter, setUrgencyFilter] = useState('ALL');
  const [query, setQuery] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const released = units.filter(u => u.status === 'RELEASED');
  const inTransit = units.filter(u => u.status === 'IN_TRANSIT');
  const transfused = units.filter(u => u.status === 'TRANSFUSED');

  const filtered = requests.filter(r => {
    if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
    if (urgencyFilter !== 'ALL' && r.urgency !== urgencyFilter) return false;
    if (query.trim()) {
      const q = query.toLowerCase();
      return (
        r.id.toLowerCase().includes(q) ||
        r.hospitalName.toLowerCase().includes(q) ||
        r.bloodType.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const dispatch = async (req: HospitalRequest) => {
    setError(null);
    const matching = released.filter(u => u.bloodType === req.bloodType);
    if (matching.length === 0) {
      setError(`No released units of ${req.bloodType} are currently held. Release from the laboratory or raise a deficit appeal.`);
      return;
    }
    setBusyId(req.id);
    try {
      const dins = matching.slice(0, req.unitsNeeded).map(u => u.din);
      await fulfillRequest(req.id, dins);
      setMessage(`Allocated ${dins.length} unit${dins.length === 1 ? '' : 's'} to ${req.hospitalName}.`);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="stack">
      <div className="page-head">
        <div className="eyebrow">Ward requisitions</div>
        <h1 className="page-title">Allocate units to requisitions</h1>
        <p className="page-sub">
          Match released units to ward requests, dispatch them, and keep a record of what went where.
        </p>
      </div>

      <div className="kpi-grid">
        <div className="kpi">
          <div className="kpi-k">Released &amp; held</div>
          <div className="kpi-v">{released.length}</div>
          <div className="kpi-n">Available for allocation</div>
        </div>
        <div className="kpi">
          <div className="kpi-k">In transit</div>
          <div className="kpi-v">{inTransit.length}</div>
          <div className="kpi-n">Dispatched, not yet received</div>
        </div>
        <div className="kpi">
          <div className="kpi-k">Transfused</div>
          <div className="kpi-v">{transfused.length}</div>
          <div className="kpi-n">Recorded as administered</div>
        </div>
        <div className="kpi">
          <div className="kpi-k">Open requisitions</div>
          <div className="kpi-v">{requests.filter(r => r.status === 'PENDING').length}</div>
          <div className="kpi-n">Awaiting allocation</div>
        </div>
      </div>

      {message && (
        <div className="notice notice--safe">
          <CheckCircle2 className="notice-icon" size={15} />
          <span>{message}</span>
        </div>
      )}
      {error && (
        <div className="notice notice--watch">
          <AlertTriangle className="notice-icon" size={15} />
          <span>{error}</span>
        </div>
      )}

      <div className="card">
        <div className="card-hd">
          <h3>Requisitions</h3>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 9, top: 10, color: 'var(--ink-3)' }} />
              <input
                className="input"
                style={{ paddingLeft: 30, width: 220 }}
                placeholder="Order ID, hospital, group"
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
            </div>
            <select className="select" style={{ width: 'auto' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="ALL">All statuses</option>
              <option value="PENDING">Pending</option>
              <option value="DISPATCHED">Dispatched</option>
              <option value="FULFILLED">Fulfilled</option>
            </select>
            <select className="select" style={{ width: 'auto' }} value={urgencyFilter} onChange={e => setUrgencyFilter(e.target.value)}>
              <option value="ALL">All urgency</option>
              <option value="EMERGENCY_CODE_CRIMSON">Emergency</option>
              <option value="URGENT">Urgent</option>
              <option value="ROUTINE">Routine</option>
            </select>
          </div>
        </div>

        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Order</th>
                <th>Requesting ward</th>
                <th>Urgency</th>
                <th style={{ textAlign: 'center' }}>Group</th>
                <th style={{ textAlign: 'center' }}>Units</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="tbl-empty">No requisitions match the current filters.</div>
                  </td>
                </tr>
              ) : (
                filtered.map(req => {
                  const availableForType = released.filter(u => u.bloodType === req.bloodType).length;
                  return (
                    <tr key={req.id}>
                      <td className="mono cell-strong">{req.id}</td>
                      <td>
                        <div className="cell-strong">{req.hospitalName}</div>
                        <div className="cell-sub">{req.department}</div>
                      </td>
                      <td>
                        <span className={`status ${urgencyTone(req.urgency)}`}>{urgencyLabel(req.urgency)}</span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="strong-group">{req.bloodType}</span>
                      </td>
                      <td style={{ textAlign: 'center' }} className="mono">
                        {req.unitsNeeded}
                        <div className="cell-sub">held {availableForType}</div>
                      </td>
                      <td>
                        <span
                          className={`status ${
                            req.status === 'FULFILLED'
                              ? 'status--safe'
                              : req.status === 'DISPATCHED'
                              ? 'status--info'
                              : 'status--watch'
                          }`}
                        >
                          {req.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {req.status === 'PENDING' ? (
                          <button
                            className="btn btn--primary"
                            style={{ padding: '5px 10px', fontSize: 12 }}
                            disabled={availableForType === 0 || busyId === req.id}
                            onClick={() => dispatch(req)}
                          >
                            <Send size={13} />
                            {busyId === req.id ? 'Allocating…' : 'Dispatch'}
                          </button>
                        ) : (
                          <span className="dim" style={{ fontSize: 12, display: 'inline-flex', gap: 5, alignItems: 'center' }}>
                            <CheckCircle2 size={13} color="var(--safe)" />
                            {req.fulfilledUnitDins.length} allocated
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
