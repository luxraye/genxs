import React, { useState } from 'react';
import { useCrucible } from '../context/CrucibleContext';
import { Layers, CheckCircle2, Info } from 'lucide-react';
import type { ComponentType } from '@shared/types/bloodchain';

const COMPONENTS: { type: ComponentType; label: string; storage: string; shelf: string }[] = [
  { type: 'PACKED_RED_CELLS', label: 'Packed red cells', storage: '2–6 °C', shelf: '42 days' },
  { type: 'FRESH_FROZEN_PLASMA', label: 'Fresh frozen plasma', storage: '≤ −18 °C', shelf: '12 months' },
  { type: 'PLATELETS', label: 'Platelets', storage: '20–24 °C, agitated', shelf: '5 days' },
  { type: 'CRYOPRECIPITATE', label: 'Cryoprecipitate', storage: '≤ −18 °C', shelf: '12 months' },
  { type: 'WHOLE_BLOOD', label: 'Whole blood', storage: '2–6 °C', shelf: '35 days' }
];

export const FractionationDesk: React.FC = () => {
  const { units, fractionateUnit } = useCrucible();

  const [din, setDin] = useState<string>(units[0]?.din ?? '');
  const [target, setTarget] = useState<ComponentType>('PACKED_RED_CELLS');
  const [volume, setVolume] = useState<number>(300);
  const [message, setMessage] = useState<string | null>(null);

  const unit = units.find(u => u.din === din) ?? units[0];

  const counts: Record<string, number> = {};
  COMPONENTS.forEach(c => {
    counts[c.type] = units.filter(u => u.componentType === c.type).length;
  });

  const run = async () => {
    if (!unit) return;
    await fractionateUnit(unit.din, target, volume);
    setMessage(
      `${unit.din} recorded as ${target.replace(/_/g, ' ').toLowerCase()} at ${volume} mL.`
    );
  };

  return (
    <div className="stack">
      <div className="page-head">
        <div className="eyebrow">Component preparation</div>
        <h1 className="page-title">Component fractionation</h1>
        <p className="page-sub">
          Record the components prepared from each whole-blood unit, with the storage requirement and shelf life that
          applies to each.
        </p>
      </div>

      {message && (
        <div className="notice notice--safe">
          <CheckCircle2 className="notice-icon" size={15} />
          <span>{message}</span>
        </div>
      )}

      <div className="card">
        <div className="card-hd">
          <h3>Component inventory</h3>
        </div>
        <div className="card-bd">
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Component</th>
                  <th>Storage</th>
                  <th>Shelf life</th>
                  <th style={{ textAlign: 'right' }}>Units held</th>
                </tr>
              </thead>
              <tbody>
                {COMPONENTS.map(c => (
                  <tr key={c.type}>
                    <td className="cell-strong">{c.label}</td>
                    <td className="mono">{c.storage}</td>
                    <td className="mono">{c.shelf}</td>
                    <td style={{ textAlign: 'right' }} className="mono">
                      {counts[c.type]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="notice" style={{ marginTop: 14 }}>
            <Info className="notice-icon" size={15} />
            <span>
              Storage limits and shelf lives shown are reference values for the demonstration and must be confirmed
              against the national laboratory standard operating procedures.
            </span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-hd">
          <h3>Record a preparation</h3>
        </div>
        <div className="card-bd">
          <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label" htmlFor="fr-din">Unit</label>
              <select id="fr-din" className="select" value={din} onChange={e => setDin(e.target.value)}>
                {units.map(u => (
                  <option key={u.din} value={u.din}>
                    {u.din} · {u.bloodType}
                  </option>
                ))}
              </select>
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label" htmlFor="fr-comp">Component</label>
              <select
                id="fr-comp"
                className="select"
                value={target}
                onChange={e => setTarget(e.target.value as ComponentType)}
              >
                {COMPONENTS.map(c => (
                  <option key={c.type} value={c.type}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label" htmlFor="fr-vol">Volume (mL)</label>
              <input
                id="fr-vol"
                className="input mono"
                type="number"
                min={50}
                max={600}
                value={volume}
                onChange={e => setVolume(Number(e.target.value))}
              />
            </div>
          </div>

          {unit && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginTop: 18, flexWrap: 'wrap' }}>
              <span className="muted" style={{ fontSize: 12.5 }}>
                {unit.din} · {unit.bloodType} · currently{' '}
                <span className="status status--hold">{unit.status.replace(/_/g, ' ').toLowerCase()}</span>
              </span>
              <button className="btn btn--primary" onClick={run}>
                <Layers size={15} />
                Record preparation
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
