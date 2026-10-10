import React from 'react';
import { useTorrent, TRANSIT_STATUSES } from '../context/TorrentContext';
import { Navigation, Truck } from 'lucide-react';

export const FleetManifest: React.FC = () => {
  const { units } = useTorrent();

  const inTransit = units.filter(u => TRANSIT_STATUSES.includes(u.status));

  const corridors = [
    {
      corridor: 'Eastern mainline (national spine)',
      nodes: 'Central depository \u2192 Mahalapye \u2192 Palapye \u2192 district hospital (north-east)',
      distanceKm: 432,
      activeVehicles: inTransit.length
    },
    {
      corridor: 'Trans-Kalahari western corridor',
      nodes: 'Depository \u2192 Jwaneng \u2192 Kang \u2192 Ghanzi',
      distanceKm: 680,
      activeVehicles: 0
    },
    {
      corridor: 'Northern transit',
      nodes: 'Northern blood centre \u2192 Nata \u2192 regional hospital (north-west)',
      distanceKm: 495,
      activeVehicles: 0
    }
  ];

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <div className="eyebrow">Corridors</div>
          <h1 className="page-title">Transit corridors</h1>
          <p className="page-sub">
            An indicative view of the transport corridors the courier fleet uses. Distances are illustrative.
          </p>
        </div>
        <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(120px, 1fr))' }}>
          <div className="kpi">
            <div className="kpi-k">Corridors</div>
            <div className="kpi-v">{corridors.length}</div>
          </div>
          <div className="kpi kpi--watch">
            <div className="kpi-k">Units in transit</div>
            <div className="kpi-v">{inTransit.length}</div>
          </div>
        </div>
      </div>

      <div className="grid-2">
        {corridors.map(c => (
          <div key={c.corridor} className="card">
            <div className="card-hd">
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Navigation size={15} /> {c.corridor}
              </span>
              <span className="mono dim">{c.distanceKm} km</span>
            </div>
            <div className="card-bd">
              <p className="muted" style={{ fontSize: 13, margin: 0 }}>{c.nodes}</p>
              <div className="hint" style={{ marginTop: 8 }}>
                Active vehicles: {c.activeVehicles}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-hd">
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Truck size={16} /> Units in transit
          </span>
          <span className="mono dim">{inTransit.length}</span>
        </div>
        <div className="card-bd">
          {inTransit.length === 0 ? (
            <div className="tbl-empty">No units currently in transit.</div>
          ) : (
            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Unit</th>
                    <th>Component</th>
                    <th>Destination</th>
                    <th>Latest temp</th>
                  </tr>
                </thead>
                <tbody>
                  {inTransit.map(u => {
                    const t = u.telemetryLogs[u.telemetryLogs.length - 1]?.temperatureCelsius;
                    const breach = t !== undefined && (t < u.storageTempRange.min || t > u.storageTempRange.max);
                    return (
                      <tr key={u.din}>
                        <td className="mono">{u.din}</td>
                        <td>{u.componentType.replace(/_/g, ' ').toLowerCase()}</td>
                        <td>{u.destinationHospital || 'in transit'}</td>
                        <td>
                          <span className={`status ${breach ? 'status--stop' : 'status--safe'}`}>
                            {t !== undefined ? `${t}\u00b0C` : 'no reading'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
