import React, { useState } from 'react';
import { useTorrent, DISPATCHABLE_STATUSES } from '../context/TorrentContext';
import { Truck, Send, CheckCircle2 } from 'lucide-react';

export const DispatchConsole: React.FC = () => {
  const { units, dispatchUnitToTransit, currentCourier } = useTorrent();

  const released = units.filter(u => DISPATCHABLE_STATUSES.includes(u.status));
  const [selectedDin, setSelectedDin] = useState<string>(released[0]?.din || '');
  const [courierName, setCourierName] = useState(
    currentCourier ? `${currentCourier.fullName} (${currentCourier.badgeNumber})` : 'Cold-chain courier'
  );
  const [destinationHospital, setDestinationHospital] = useState('Example Referral Hospital');
  const [initialTemp, setInitialTemp] = useState<number>(3.8);

  const [isDispatching, setIsDispatching] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const selectedUnit = units.find(u => u.din === selectedDin) || released[0];

  const dispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUnit) return;
    setIsDispatching(true);
    try {
      await dispatchUnitToTransit(selectedUnit.din, courierName, destinationHospital, initialTemp);
      setMsg(`Unit ${selectedUnit.din} dispatched to ${destinationHospital} with a recorded departure temperature of ${initialTemp}\u00b0C.`);
      setTimeout(() => setMsg(null), 6000);
    } finally {
      setIsDispatching(false);
    }
  };

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <div className="eyebrow">Dispatch</div>
          <h1 className="page-title">Dispatch to transit</h1>
          <p className="page-sub">
            Move a released unit from the cold vault into a temperature-controlled transport box and record the
            departure reading.
          </p>
        </div>
        <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(1, minmax(120px, 1fr))' }}>
          <div className="kpi">
            <div className="kpi-k">Ready in vault</div>
            <div className="kpi-v">{released.length}</div>
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
            <strong>Released units</strong>
            <span className="mono dim">{released.length}</span>
          </div>
          <div className="card-bd">
            {released.length === 0 ? (
              <div className="tbl-empty">No released units awaiting dispatch. Release units in the laboratory console.</div>
            ) : (
              <div className="wide-list">
                {released.map(u => {
                  const on = u.din === selectedDin;
                  return (
                    <button
                      key={u.din}
                      className="queue-item"
                      aria-pressed={on}
                      onClick={() => setSelectedDin(u.din)}
                    >
                      <div className="queue-top">
                        <span className="mono" style={{ fontWeight: 600 }}>{u.din}</span>
                        <span className="cell-strong mono">{u.bloodType}</span>
                      </div>
                      <div className="queue-foot">
                        <span>{u.componentType.replace(/_/g, ' ').toLowerCase()}</span>
                        <span className="status status--safe">released</span>
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
                <Truck size={16} /> Dispatch manifest
              </span>
              <span className="mono dim">{selectedUnit.din}</span>
            </div>
            <div className="card-bd stack">
              <div className="spec-grid">
                <div className="spec">
                  <div className="spec-k">Unit</div>
                  <div className="spec-v mono">{selectedUnit.din}</div>
                </div>
                <div className="spec">
                  <div className="spec-k">Blood group</div>
                  <div className="spec-v mono">{selectedUnit.bloodType}</div>
                </div>
                <div className="spec">
                  <div className="spec-k">Component</div>
                  <div className="spec-v">{selectedUnit.componentType.replace(/_/g, ' ').toLowerCase()}</div>
                </div>
                <div className="spec">
                  <div className="spec-k">Stored range</div>
                  <div className="spec-v mono">
                    {selectedUnit.storageTempRange.min}&deg;C to {selectedUnit.storageTempRange.max}&deg;C
                  </div>
                </div>
              </div>

              <form onSubmit={dispatch} className="stack">
                <div className="field">
                  <label className="label" htmlFor="d-courier">Assigned vehicle and courier</label>
                  <input id="d-courier" className="input" required value={courierName} onChange={e => setCourierName(e.target.value)} />
                </div>
                <div className="field">
                  <label className="label" htmlFor="d-dest">Destination facility</label>
                  <select id="d-dest" className="select" value={destinationHospital} onChange={e => setDestinationHospital(e.target.value)}>
                    <option value="Example Referral Hospital">Example Referral Hospital</option>
                    <option value="Example District Hospital">Example District Hospital</option>
                    <option value="Example Regional Hospital">Example Regional Hospital</option>
                    <option value="Example Rural Clinic">Example Rural Clinic</option>
                  </select>
                </div>
                <div className="field">
                  <label className="label" htmlFor="d-temp">Departure temperature (&deg;C)</label>
                  <input
                    id="d-temp"
                    className="input"
                    type="number"
                    step="0.1"
                    min="1"
                    max="10"
                    value={initialTemp}
                    onChange={e => setInitialTemp(Number(e.target.value))}
                  />
                </div>
                <button className="btn btn--primary btn--block" type="submit" disabled={isDispatching}>
                  <Send size={15} />
                  {isDispatching ? 'Dispatching\u2026' : 'Dispatch into transit'}
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="card-bd tbl-empty">Select a released unit from the left to dispatch.</div>
          </div>
        )}
      </div>
    </div>
  );
};
