import React, { useState } from 'react';
import { useTorrent, TRANSIT_STATUSES } from '../context/TorrentContext';
import { Thermometer, MapPin, Radio, AlertTriangle, ShieldAlert, CheckCircle2, ArrowRight } from 'lucide-react';

interface TelemetryConsoleProps {
  onNavigateToHandover: (unitDin: string) => void;
}

export const TelemetryConsole: React.FC<TelemetryConsoleProps> = ({ onNavigateToHandover }) => {
  const { units, logTelemetryReading, isOffline, setIsOffline, offlineQueue, syncOfflineQueue } = useTorrent();

  const inTransit = units.filter(u => TRANSIT_STATUSES.includes(u.status));
  const [selectedDin, setSelectedDin] = useState<string>(inTransit[0]?.din || '');
  const [manualTemp, setManualTemp] = useState('3.8');
  const [location, setLocation] = useState('In transit \u2014 waypoint');
  const [feedback, setFeedback] = useState<string | null>(null);

  const selectedUnit = units.find(u => u.din === selectedDin) || inTransit[0];
  const logs = selectedUnit?.telemetryLogs ?? [];
  const latest = logs[logs.length - 1];
  const currentTemp = latest?.temperatureCelsius;
  const isBreached =
    selectedUnit && currentTemp !== undefined
      ? currentTemp < selectedUnit.storageTempRange.min || currentTemp > selectedUnit.storageTempRange.max
      : false;

  const record = async () => {
    if (!selectedUnit) return;
    const temp = Number(manualTemp);
    const res = await logTelemetryReading(selectedUnit.din, temp, location);
    setFeedback(
      res.breachDetected
        ? `Reading of ${temp}\u00b0C is outside the stored range for this unit. An excursion was logged and an incident raised for review.`
        : `Recorded ${temp}\u00b0C at ${location}. Within the stored range.`
    );
    setTimeout(() => setFeedback(null), 8000);
  };

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <div className="eyebrow">Telemetry</div>
          <h1 className="page-title">In-transit temperature</h1>
          <p className="page-sub">
            Record temperature readings for units in transit and watch for excursions outside the stored range.
          </p>
        </div>
        <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(120px, 1fr))' }}>
          <div className="kpi">
            <div className="kpi-k">In transit</div>
            <div className="kpi-v">{inTransit.length}</div>
          </div>
          <div className={`kpi ${isOffline ? 'kpi--alert' : ''}`}>
            <div className="kpi-k">Buffered pings</div>
            <div className="kpi-v">{offlineQueue.length}</div>
          </div>
        </div>
      </div>

      {feedback && (
        <div className={`notice ${feedback.includes('outside') ? 'notice--stop' : 'notice--safe'}`}>
          {feedback.includes('outside') ? <AlertTriangle className="notice-icon" size={15} /> : <CheckCircle2 className="notice-icon" size={15} />}
          <span>{feedback}</span>
        </div>
      )}

      <div className="ward-grid">
        <div className="card">
          <div className="card-hd">
            <strong>En-route units</strong>
            <span className="mono dim">{inTransit.length}</span>
          </div>
          <div className="card-bd">
            {inTransit.length === 0 ? (
              <div className="tbl-empty">No units in transit. Dispatch a released unit first.</div>
            ) : (
              <div className="wide-list">
                {inTransit.map(u => {
                  const on = u.din === selectedDin;
                  const t = u.telemetryLogs[u.telemetryLogs.length - 1]?.temperatureCelsius;
                  const breach = t !== undefined && (t < u.storageTempRange.min || t > u.storageTempRange.max);
                  return (
                    <button key={u.din} className="queue-item" aria-pressed={on} onClick={() => setSelectedDin(u.din)}>
                      <div className="queue-top">
                        <span className="mono" style={{ fontWeight: 600 }}>{u.din}</span>
                        <span className="cell-strong mono">{u.bloodType}</span>
                      </div>
                      <div className="queue-foot">
                        <span>{u.destinationHospital || 'in transit'}</span>
                        <span className={`status ${breach ? 'status--stop' : 'status--safe'}`}>
                          {t !== undefined ? `${t}\u00b0C` : 'no reading'}
                        </span>
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
                  <Thermometer size={16} /> {selectedUnit.din}
                </span>
                <span className="mono dim">
                  range {selectedUnit.storageTempRange.min}&ndash;{selectedUnit.storageTempRange.max}&deg;C
                </span>
              </div>
              <div className="card-bd stack">
                <div className={`scan-cell ${isBreached ? 'notice--stop' : ''}`}>
                  <div className="queue-top">
                    <span className="mono dim">Latest reading</span>
                    <Radio size={14} />
                  </div>
                  <div className="gauge">{currentTemp !== undefined ? `${currentTemp}\u00b0C` : '\u2014'}</div>
                  <div className="hint" style={{ marginTop: 4 }}>
                    {currentTemp === undefined
                      ? 'No reading recorded for this unit yet.'
                      : isBreached
                      ? 'Outside the stored range for this unit.'
                      : 'Within the stored range.'}
                  </div>
                  <div className="hint" style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <MapPin size={13} /> {latest?.locationName || 'location not recorded'}
                  </div>
                </div>

                <div className="field">
                  <label className="label" htmlFor="t-temp">Record a temperature reading (&deg;C)</label>
                  <input id="t-temp" className="input" type="number" step="0.1" value={manualTemp} onChange={e => setManualTemp(e.target.value)} />
                </div>
                <div className="field">
                  <label className="label" htmlFor="t-loc">Location</label>
                  <input id="t-loc" className="input" value={location} onChange={e => setLocation(e.target.value)} />
                </div>

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                  <button className="btn btn--primary" onClick={record}>
                    <Radio size={15} /> Record reading
                  </button>
                  <button
                    className={`btn ${isOffline ? 'btn--ok' : 'btn--outline'}`}
                    onClick={() => (isOffline ? syncOfflineQueue() : setIsOffline(true))}
                  >
                    {isOffline ? `Sync ${offlineQueue.length} buffered` : 'Simulate offline'}
                  </button>
                  <button className="btn btn--outline" onClick={() => onNavigateToHandover(selectedUnit.din)}>
                    Proceed to handover <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-hd">
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ShieldAlert size={16} /> Reading history
                </span>
                <span className="mono dim">{logs.length}</span>
              </div>
              <div className="card-bd">
                <div className="tbl-wrap">
                  <table className="tbl">
                    <thead>
                      <tr>
                        <th>Time</th>
                        <th>Location</th>
                        <th>Temp</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.slice(-6).map((l, i) => (
                        <tr key={i}>
                          <td className="mono">{new Date(l.timestamp).toLocaleTimeString()}</td>
                          <td>{l.locationName}</td>
                          <td className="mono">{l.temperatureCelsius}&deg;C</td>
                          <td>
                            <span className={`status ${l.breachDetected ? 'status--stop' : 'status--safe'}`}>
                              {l.breachDetected ? 'excursion' : 'in range'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="card-bd tbl-empty">Select a unit in transit from the left to view telemetry.</div>
          </div>
        )}
      </div>
    </div>
  );
};
