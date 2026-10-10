import React, { useState } from 'react';
import { useScyther } from '../context/ScytherContext';
import { Check, Package, Info } from 'lucide-react';
import type { UnitStatus } from '@shared/types/bloodchain';

const STAGES = [
  { title: 'Collected', meta: 'Whole blood collected at the donation centre.' },
  { title: 'Screened', meta: 'Infectious-disease screening and blood group confirmation.' },
  { title: 'Released', meta: 'Passed quality control and released by the laboratory.' },
  { title: 'In transit', meta: 'Moved to a hospital under monitored cold-chain conditions.' },
  { title: 'Received at hospital', meta: 'Accepted into the hospital blood bank.' },
  { title: 'Transfused', meta: 'Issued and administered to a patient.' }
];

const stageIndex = (status?: UnitStatus): number => {
  switch (status) {
    case 'COLLECTED':
      return 0;
    case 'IN_TESTING':
      return 1;
    case 'RELEASED':
      return 2;
    case 'IN_TRANSIT':
      return 3;
    case 'DELIVERED_TO_HOSPITAL':
    case 'BEDSIDE_CROSSMATCHED':
      return 4;
    case 'TRANSFUSED':
      return 5;
    case 'QUARANTINED':
      return -1;
    default:
      return 0;
  }
};

const fmt = (iso?: string) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const MyDonations: React.FC = () => {
  const { donor, donorUnits } = useScyther();
  const dins = donor?.linkedUnitDins ?? [];
  const [selected, setSelected] = useState<string>(dins[0] ?? '');

  if (!donor) return null;

  const unit = donorUnits.find(u => u.din === selected);
  const current = unit ? stageIndex(unit.status) : 0;

  if (dins.length === 0) {
    return (
      <div className="stack">
        <div className="page-head">
          <div className="eyebrow">Donation history</div>
          <h1 className="page-title">My donations</h1>
          <p className="page-sub">Follow what happens to a unit of your blood after you donate.</p>
        </div>
        <div className="card">
          <div className="card-bd">
            <div className="empty">
              <Package className="empty-icon" size={26} />
              <div style={{ fontWeight: 600, color: 'var(--ink)' }}>No donations recorded yet</div>
              <p style={{ fontSize: 13, marginTop: 6 }}>
                Once a donation is recorded, each unit and its progress will appear here.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="stack">
      <div className="page-head">
        <div className="eyebrow">Donation history</div>
        <h1 className="page-title">My donations</h1>
        <p className="page-sub">Follow what happens to a unit of your blood after you donate.</p>
      </div>

      <div className="grid-2">
        <div className="card" style={{ alignSelf: 'start' }}>
          <div className="card-hd">
            <h3>Units</h3>
            <span className="dim" style={{ fontSize: 12.5 }}>
              {dins.length} recorded
            </span>
          </div>
          <div className="card-bd stack" style={{ gap: 8 }}>
            {dins.map(din => {
              const u = donorUnits.find(x => x.din === din);
              return (
                <button key={din} className="choose" aria-pressed={din === selected} onClick={() => setSelected(din)}>
                  <div style={{ flex: 1 }}>
                    <div className="choose-title mono">{din}</div>
                    <div className="choose-sub">
                      {u ? `${u.componentType.replace(/_/g, ' ').toLowerCase()} · collected ${fmt(u.collectedAt)}` : 'Record not loaded'}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="card">
          <div className="card-hd">
            <h3>Progress</h3>
            <span className="badge">
              <Info size={13} />
              Illustrative
            </span>
          </div>
          <div className="card-bd">
            {current === -1 && (
              <div className="notice notice--watch" style={{ marginBottom: 18 }}>
                <Info className="notice-icon" size={15} />
                <span>This unit is currently held and is not available for issue.</span>
              </div>
            )}

            <div className="timeline">
              {STAGES.map((s, i) => {
                const done = i < current;
                const isCurrent = i === current;
                return (
                  <div className="tl-item" key={s.title}>
                    <div className={`tl-dot ${done ? 'tl-dot--done' : isCurrent ? 'tl-dot--current' : ''}`}>
                      {done ? <Check size={12} strokeWidth={3} /> : <span style={{ fontSize: 10 }}>{i + 1}</span>}
                    </div>
                    <div className="tl-title">{s.title}</div>
                    <div className="tl-meta">{s.meta}</div>
                    {isCurrent && unit && (
                      <div className="tl-meta" style={{ marginTop: 6 }}>
                        Current status: <strong>{unit.status.replace(/_/g, ' ').toLowerCase()}</strong>
                        {unit.currentFacility ? ` · ${unit.currentFacility}` : ''}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="notice" style={{ marginTop: 20 }}>
              <Info className="notice-icon" size={15} />
              <span style={{ fontSize: 12.5 }}>
                Status is drawn from sample data. In production this reflects the unit&rsquo;s record in the national
                system, updated as it moves.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
