import React, { useState } from 'react';
import { useCrucible, AWAITING_STATUSES } from '../context/CrucibleContext';
import { CheckCircle2, AlertTriangle, ShieldCheck, ShieldAlert, FlaskConical, Info } from 'lucide-react';
import type { BloodType } from '@shared/types/bloodchain';

const PANELS: { key: keyof BloodUnitPanels; label: string }[] = [
  { key: 'hiv', label: 'HIV 1/2 antigen / antibody' },
  { key: 'hbv', label: 'Hepatitis B surface antigen' },
  { key: 'hcv', label: 'Hepatitis C antibody / NAT' },
  { key: 'syphilis', label: 'Syphilis (treponemal)' },
  { key: 'westNile', label: 'Additional panel (as per protocol)' }
];

type BloodUnitPanels = {
  hiv: string;
  hbv: string;
  hcv: string;
  syphilis: string;
  westNile: string;
};

export const SerologyScreening: React.FC = () => {
  const { units, recordLabTests, authorizeLabRelease, quarantineUnitInLab, currentScientist } = useCrucible();

  const [selectedDin, setSelectedDin] = useState<string>('');
  const [filter, setFilter] = useState<'ALL' | 'AWAITING' | 'RELEASED' | 'HELD'>('ALL');
  const [feedback, setFeedback] = useState<{ tone: 'safe' | 'stop'; msg: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [holdReason, setHoldReason] = useState('');

  const unit =
    units.find(u => u.din === selectedDin) ?? units.find(u => AWAITING_STATUSES.includes(u.status)) ?? units[0];

  const filtered = units.filter(u => {
    if (filter === 'AWAITING') return AWAITING_STATUSES.includes(u.status);
    if (filter === 'RELEASED') return u.status === 'RELEASED';
    if (filter === 'HELD') return u.status === 'QUARANTINED';
    return true;
  });

  const waiting = units.filter(u => AWAITING_STATUSES.includes(u.status)).length;
  const released = units.filter(u => u.status === 'RELEASED').length;
  const held = units.filter(u => u.status === 'QUARANTINED').length;

  const set = (field: string, value: string) => unit && recordLabTests(unit.din, { [field]: value } as any);

  // Release readiness
  const panels = (unit?.labTests ?? {}) as unknown as BloodUnitPanels;
  const panelStates = PANELS.map(p => ({ ...p, value: panels[p.key] }));
  const allClear = panelStates.every(p => p.value === 'NEGATIVE');
  const anyReactive = panelStates.some(p => p.value === 'POSITIVE');
  const groupConfirmed = !!unit && unit.labTests.aboRhConfirmatory !== 'PENDING';
  const ready = allClear && groupConfirmed && !!unit;

  const release = async () => {
    if (!unit) return;
    setBusy(true);
    setFeedback(null);
    try {
      const res = await authorizeLabRelease(unit.din, currentScientist?.fullName ?? 'Laboratory user');
      if (res.success) {
        setFeedback({
          tone: 'safe',
          msg: `Unit ${unit.din} released. The release is recorded in the audit log.`
        });
      } else {
        setFeedback({ tone: 'stop', msg: res.error ?? 'Release blocked.' });
      }
    } finally {
      setBusy(false);
    }
  };

  const hold = async () => {
    if (!unit) return;
    await quarantineUnitInLab(
      unit.din,
      currentScientist?.fullName ?? 'Laboratory user',
      holdReason.trim() || 'Reactive screening marker recorded.'
    );
    setFeedback({
      tone: 'stop',
      msg: `Unit ${unit.din} placed on hold and excluded from issue. An incident has been raised.`
    });
    setHoldReason('');
  };

  return (
    <div className="stack">
      <div className="page-head">
        <div className="eyebrow">Screening &amp; release</div>
        <h1 className="page-title">Infectious-disease screening &amp; quality release</h1>
        <p className="page-sub">
          Record screening results and confirm the blood group. A unit can only be released when every panel is clear
          and the group is confirmed by testing.
        </p>
      </div>

      <div className="kpi-grid">
        <div className="kpi">
          <div className="kpi-k">Awaiting screening</div>
          <div className="kpi-v">{waiting}</div>
          <div className="kpi-n">Not yet released</div>
        </div>
        <div className="kpi">
          <div className="kpi-k">Released</div>
          <div className="kpi-v">{released}</div>
          <div className="kpi-n">Cleared for clinical use</div>
        </div>
        <div className={`kpi ${held > 0 ? 'kpi--alert' : ''}`}>
          <div className="kpi-k">On hold</div>
          <div className="kpi-v">{held}</div>
          <div className="kpi-n">Excluded from issue</div>
        </div>
        <div className="kpi">
          <div className="kpi-k">Total in registry</div>
          <div className="kpi-v">{units.length}</div>
          <div className="kpi-n">All statuses</div>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'minmax(260px, 340px) 1fr', gap: 18, alignItems: 'start' }}>
        <div className="card">
          <div className="card-hd">
            <h3>Intake</h3>
            <span className="dim" style={{ fontSize: 12 }}>{filtered.length} shown</span>
          </div>
          <div className="card-bd" style={{ paddingBottom: 10 }}>
            <div className="seg">
              {(['ALL', 'AWAITING', 'RELEASED', 'HELD'] as const).map(f => (
                <button key={f} aria-pressed={filter === f} onClick={() => setFilter(f)}>
                  {f === 'ALL' ? 'All' : f === 'AWAITING' ? 'Awaiting' : f === 'RELEASED' ? 'Released' : 'Held'}
                </button>
              ))}
            </div>
          </div>
          <div className="card-bd stack" style={{ gap: 8, maxHeight: 560, overflowY: 'auto' }}>
            {filtered.length === 0 ? (
              <div className="tbl-empty">No units match this filter.</div>
            ) : (
              filtered.map(u => (
                <button
                  key={u.din}
                  className="queue-item"
                  aria-pressed={u.din === unit?.din}
                  onClick={() => {
                    setSelectedDin(u.din);
                    setFeedback(null);
                  }}
                >
                  <div className="queue-top">
                    <span className="mono" style={{ fontWeight: 600, fontSize: 12.5 }}>{u.din}</span>
                    <span className="strong-group">{u.bloodType}</span>
                  </div>
                  <div className="queue-foot">
                    <span>{u.componentType.replace(/_/g, ' ').toLowerCase()}</span>
                    <span
                      className={`status ${
                        u.status === 'RELEASED'
                          ? 'status--safe'
                          : u.status === 'QUARANTINED'
                          ? 'status--stop'
                          : 'status--watch'
                      }`}
                    >
                      {u.status.replace(/_/g, ' ').toLowerCase()}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {unit ? (
          <div className="stack">
            <div className="card">
              <div className="card-hd">
                <h3>Testing bench</h3>
                <span className="badge mono">{unit.din}</span>
              </div>
              <div className="card-bd stack">
                {feedback && (
                  <div className={`notice notice--${feedback.tone}`}>
                    {feedback.tone === 'safe' ? (
                      <CheckCircle2 className="notice-icon" size={16} />
                    ) : (
                      <AlertTriangle className="notice-icon" size={16} />
                    )}
                    <span>{feedback.msg}</span>
                  </div>
                )}

                <div className="spec-grid">
                  <div className="spec">
                    <div className="spec-k">Unit</div>
                    <div className="spec-v mono">{unit.din}</div>
                  </div>
                  <div className="spec">
                    <div className="spec-k">Declared group</div>
                    <div className="spec-v mono">{unit.bloodType}</div>
                  </div>
                  <div className="spec">
                    <div className="spec-k">Volume</div>
                    <div className="spec-v mono">{unit.volumeMl} mL</div>
                  </div>
                  <div className="spec">
                    <div className="spec-k">Component</div>
                    <div className="spec-v">{unit.componentType.replace(/_/g, ' ').toLowerCase()}</div>
                  </div>
                </div>

                <div>
                  <div className="eyebrow" style={{ marginBottom: 10 }}>
                    Screening panels
                  </div>
                  <div className="bench-grid">
                    {panelStates.map(p => (
                      <div key={p.key} className="panel-cell">
                        <div className="panel-name">{p.label}</div>
                        <div className="panel-choice">
                          <button
                            className="choice choice--neg"
                            aria-pressed={p.value === 'NEGATIVE'}
                            onClick={() => set(p.key, 'NEGATIVE')}
                          >
                            Non-reactive
                          </button>
                          <button
                            className="choice choice--pos"
                            aria-pressed={p.value === 'POSITIVE'}
                            onClick={() => set(p.key, 'POSITIVE')}
                          >
                            Reactive
                          </button>
                        </div>
                      </div>
                    ))}

                    <div className="panel-cell">
                      <div className="panel-name">Confirmatory ABO / RhD</div>
                      <select
                        className="select"
                        value={unit.labTests.aboRhConfirmatory}
                        onChange={e => set('aboRhConfirmatory', e.target.value)}
                      >
                        <option value="PENDING">Not yet confirmed</option>
                        {(['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'] as BloodType[]).map(bt => (
                          <option key={bt} value={bt}>
                            {bt} confirmed
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card-ft">
                <div className="readiness" style={{ flex: 1 }}>
                  <div className="readiness-item">
                    {allClear ? <CheckCircle2 size={14} color="var(--safe)" /> : <AlertTriangle size={14} color="var(--watch)" />}
                    <span>All screening panels non-reactive</span>
                  </div>
                  <div className="readiness-item">
                    {groupConfirmed ? <CheckCircle2 size={14} color="var(--safe)" /> : <AlertTriangle size={14} color="var(--watch)" />}
                    <span>Blood group confirmed by testing</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-bd" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end', justifyContent: 'space-between' }}>
                <div style={{ flex: 1, minWidth: 240 }}>
                  <label className="label" htmlFor="hold-reason">
                    Reason for holding (if a panel is reactive)
                  </label>
                  <input
                    id="hold-reason"
                    className="input"
                    value={holdReason}
                    onChange={e => setHoldReason(e.target.value)}
                    placeholder="e.g. Reactive syphilis screen — confirmatory test requested"
                  />
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button className="btn btn--danger" onClick={hold} disabled={unit.status === 'QUARANTINED'}>
                    <ShieldAlert size={15} />
                    Place on hold
                  </button>
                  <button className="btn btn--ok" onClick={release} disabled={!ready || busy || unit.status === 'RELEASED'}>
                    <ShieldCheck size={15} />
                    {busy ? 'Releasing…' : unit.status === 'RELEASED' ? 'Released' : 'Release unit'}
                  </button>
                </div>
              </div>
              {!ready && (
                <div className="card-ft" style={{ borderTop: '1px solid var(--border)' }}>
                  <div className="notice notice--watch" style={{ width: '100%' }}>
                    <Info className="notice-icon" size={15} />
                    <span>
                      Release is blocked until every panel is non-reactive and the blood group is confirmed
                      {anyReactive ? '. At least one panel is currently marked reactive.' : '.'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="notice">
              <FlaskConical className="notice-icon" size={15} />
              <span>
                Panel composition is illustrative and must be confirmed against the national testing protocol before
                any pilot use.
              </span>
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="card-bd">
              <div className="empty">No unit selected.</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
