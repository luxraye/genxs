import React from 'react';
import { useRubric } from '../context/RubricContext';
import { TrendingDown, TrendingUp, ArrowRight, Info } from 'lucide-react';

export const DeficitMatrix: React.FC<{ onNavigateToRequisitions: () => void }> = ({
  onNavigateToRequisitions
}) => {
  const { deficitMatrix, units, criticalDeficitCount, requests } = useRubric();

  const available = units.filter(u => ['RELEASED', 'DELIVERED_TO_HOSPITAL'].includes(u.status)).length;
  const inTransit = units.filter(u => u.status === 'IN_TRANSIT').length;
  const pending = requests.filter(r => r.status === 'PENDING').length;

  const toneFor = (dos: number) => (dos < 3 ? 'crit' : dos <= 5 ? 'watch' : 'safe');

  // The unit state machine, stated as stages. Order is information here.
  const STAGES: { label: string; statuses: string[] }[] = [
    { label: 'Collected', statuses: ['COLLECTED'] },
    { label: 'In testing', statuses: ['IN_TESTING'] },
    { label: 'Released', statuses: ['RELEASED'] },
    { label: 'In transit', statuses: ['IN_TRANSIT'] },
    { label: 'Held at ward', statuses: ['DELIVERED_TO_HOSPITAL'] },
    { label: 'Transfused', statuses: ['BEDSIDE_CROSSMATCHED', 'TRANSFUSED'] }
  ];
  const lifecycle = STAGES.map(s => ({
    label: s.label,
    count: units.filter(u => s.statuses.includes(u.status)).length
  }));
  const mapped = STAGES.flatMap(s => s.statuses);
  const unmappedCount = units.filter(u => !mapped.includes(u.status)).length;

  return (
    <div className="stack">
      <div className="page-head">
        <div className="eyebrow">Inventory position</div>
        <h1 className="page-title">National inventory &amp; days of cover</h1>
        <p className="page-sub">
          Available units by ABO/Rh group and the days of cover each represents at the current planning burn rate.
        </p>
      </div>

      <div className="kpi-grid">
        <div className="kpi">
          <div className="kpi-k">Available units</div>
          <div className="kpi-v">{available}</div>
          <div className="kpi-n">Released and held at depositories</div>
        </div>
        <div className="kpi">
          <div className="kpi-k">In transit</div>
          <div className="kpi-v">{inTransit}</div>
          <div className="kpi-n">Under monitored cold chain</div>
        </div>
        <div className={`kpi ${criticalDeficitCount > 0 ? 'kpi--alert' : ''}`}>
          <div className="kpi-k">Groups below 3 days</div>
          <div className="kpi-v">{criticalDeficitCount}</div>
          <div className="kpi-n">At current planning burn rate</div>
        </div>
        <div className={`kpi ${pending > 0 ? 'kpi--watch' : ''}`}>
          <div className="kpi-k">Pending requisitions</div>
          <div className="kpi-v">{pending}</div>
          <div className="kpi-n">Awaiting allocation</div>
        </div>
      </div>

      <div className="card">
        <div className="card-hd">
          <h3>Inventory by blood group</h3>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
            <span className="status status--stop">Under 3 days</span>
            <span className="status status--watch">3–5 days</span>
            <span className="status status--safe">Over 5 days</span>
          </div>
        </div>
        <div className="card-bd">
          <div className="tiles">
            {deficitMatrix.map(stat => {
              const tone = toneFor(stat.daysOfSupply);
              return (
                <div key={stat.group} className={`tile ${tone === 'crit' ? 'tile--crit' : tone === 'watch' ? 'tile--watch' : ''}`}>
                  <div className="tile-top">
                    <span className="tile-group">{stat.group}</span>
                    <span className="tile-count">
                      {stat.count} <small>units</small>
                    </span>
                  </div>
                  <div className={`bar bar--${tone}`} aria-hidden="true">
                    <span className={`bar--${tone}`} style={{ width: `${Math.min(100, (stat.daysOfSupply / 10) * 100)}%`, display: 'block', height: '100%' }} />
                  </div>
                  <div className="tile-foot">
                    <span>{stat.daysOfSupply} days cover</span>
                    {tone === 'crit' ? (
                      <span style={{ color: 'var(--stop)', fontWeight: 600, display: 'inline-flex', gap: 4, alignItems: 'center' }}>
                        <TrendingDown size={12} /> Below threshold
                      </span>
                    ) : (
                      <span style={{ color: 'var(--safe)', fontWeight: 600, display: 'inline-flex', gap: 4, alignItems: 'center' }}>
                        <TrendingUp size={12} /> Holding
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="notice" style={{ marginTop: 16 }}>
            <Info className="notice-icon" size={15} />
            <span>
              Days of cover uses an <strong>illustrative planning burn rate</strong> per group. It is not measured
              consumption. Real burn rates must be derived from the national service&rsquo;s own issue history.
            </span>
          </div>
        </div>
      </div>


      <div className="card">
        <div className="card-hd">
          <h3>Where the units are</h3>
          <span className="dim" style={{ fontSize: 12 }}>
            Each unit has one journey &middot; counted by stage
          </span>
        </div>
        <div className="card-bd">
          <div className="spine" role="list" aria-label="Units by custody stage">
            {lifecycle.map((stage, i) => (
              <div
                key={stage.label}
                className="spine-stage"
                role="listitem"
                data-state={stage.count > 0 ? (i === lifecycle.length - 1 ? 'active' : 'filled') : undefined}
                aria-label={`${stage.label}: ${stage.count} units`}
              >
                <div className="spine-count">{stage.count}</div>
                <div className="spine-label">{stage.label}</div>
              </div>
            ))}
          </div>
          {unmappedCount > 0 && (
            <div className="spine-note">
              {unmappedCount} unit{unmappedCount === 1 ? '' : 's'} in a stage this view does not classify yet.
            </div>
          )}
          <p className="hint" style={{ marginTop: 10 }}>
            Custody stages follow the unit state machine. A unit appears in exactly one stage, so the counts sum to the
            total on the register.
          </p>
        </div>
      </div>

      <div className="card">
        <div className="card-hd">
          <h3>Depository status</h3>
          <span className="dim" style={{ fontSize: 12 }}>Example sites</span>
        </div>
        <div className="card-bd">
          <div className="grid-2">
            {[
              { name: 'Example Referral Hospital — Blood Bank', region: 'Gaborone', reserve: 14, temp: '4.8 °C' },
              { name: 'Example District Hospital — Donation Centre', region: 'Francistown', reserve: 9, temp: '3.9 °C' },
              { name: 'Example Regional Hospital — Blood Bank', region: 'Molepolole', reserve: 6, temp: '4.2 °C' },
              { name: 'Example District Hospital — Blood Bank', region: 'Maun', reserve: 4, temp: '5.1 °C' }
            ].map(site => (
              <div key={site.name} className="card" style={{ boxShadow: 'none' }}>
                <div className="card-bd" style={{ padding: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                    <span style={{ fontWeight: 600, fontSize: 13.5 }}>{site.name}</span>
                    <span className="mono dim" style={{ fontSize: 11 }}>
                      {site.region}
                    </span>
                  </div>
                  <div className="tile-foot" style={{ marginTop: 10 }}>
                    <span>
                      Reserve: <strong style={{ color: 'var(--ink)' }}>{site.reserve} units</strong>
                    </span>
                    <span className="status status--safe">{site.temp}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="card-ft">
          <span className="muted" style={{ fontSize: 12 }}>
            {pending} requisition{pending === 1 ? '' : 's'} awaiting allocation.
          </span>
          <button className="btn btn--primary" onClick={onNavigateToRequisitions}>
            Review requisitions
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};
