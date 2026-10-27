import React, { useMemo, useState } from 'react';
import { useRubric } from '../context/RubricContext';
import {
  MODEL_REGISTER,
  assertRegisterIntegrity,
  assertAnomalyCannotSetVerdict,
  holtLinear,
  movingAverage,
  detectAnomalies,
  isOutOfRange,
  evaluateDemandForecast,
  evaluateAnomalyDetection,
  type AnomalyFlag
} from '@shared/lib/ai';
import { Info, ShieldCheck, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, FlaskConical, Sparkles } from 'lucide-react';

/**
 * Tier 1 advisory surface.
 *
 * Two statistical models, both local, both blind to personal data, both
 * advisory. Nothing on this page can set a unit's status, authorise a release,
 * or write to the audit log.
 */

/** Deterministic illustrative history, seeded from the group so it is stable across renders. */
const illustrativeHistory = (seed: number, current: number, weeks = 12): number[] => {
  const out: number[] = [];
  let x = (seed + 1) * 0.37;
  for (let i = weeks - 1; i >= 0; i--) {
    x = ((x * 9301 + 49297) % 233280) / 233280;
    const drift = (i / weeks) * 0.4;
    out.push(Math.max(0, Math.round(current * (0.7 + drift) + (x - 0.5) * Math.max(1, current * 0.15))));
  }
  if (out.length) out[out.length - 1] = current;
  return out;
};

const reasonLabel: Record<AnomalyFlag['reason'], string> = {
  RAPID_CHANGE: 'Rapid change',
  STATISTICAL_OUTLIER: 'Statistical outlier',
  APPROACHING_LIMIT: 'Approaching limit'
};

interface AdvisoryInsightsProps {
  onOpenCopilot?: () => void;
}

export const AdvisoryInsights: React.FC<AdvisoryInsightsProps> = ({ onOpenCopilot }) => {
  const { deficitMatrix, units } = useRubric();
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [shadow, setShadow] = useState<{ id: string; recommendation: string; decision: 'AGREED' | 'DISMISSED' }[]>([]);

  // Run the two control assertions once, at mount, and report the outcome.
  const controls = useMemo(() => {
    const out: { name: string; ok: boolean }[] = [];
    try {
      assertRegisterIntegrity();
      out.push({ name: 'Register integrity (all components Tier 1, no personal data)', ok: true });
    } catch {
      out.push({ name: 'Register integrity (all components Tier 1, no personal data)', ok: false });
    }
    try {
      assertAnomalyCannotSetVerdict();
      out.push({ name: 'Advisory flagging is separate from the deterministic verdict', ok: true });
    } catch {
      out.push({ name: 'Advisory flagging is separate from the deterministic verdict', ok: false });
    }
    return out;
  }, []);

  const demand = useMemo(() => evaluateDemandForecast(), []);
  const anomalyEval = useMemo(() => evaluateAnomalyDetection(), []);

  const forecasts = useMemo(
    () =>
      deficitMatrix.map((stat, i) => {
        const history = illustrativeHistory(i, stat.count);
        const fit = holtLinear(history, 0.5, 0.3, 6);
        const smoothed = movingAverage(history, 3);
        const atHorizon = fit.points[fit.points.length - 1]?.value ?? stat.count;
        const direction = fit.trend > 0.05 ? 'up' : fit.trend < -0.05 ? 'down' : 'flat';
        return { stat, history, smoothed, fit, atHorizon, direction };
      }),
    [deficitMatrix]
  );

  const flags = useMemo(() => {
    const rows: { din: string; group: string; range: { min: number; max: number }; flag: AnomalyFlag; breach: boolean }[] = [];
    for (const u of units) {
      const hist = u.telemetryLogs ?? [];
      if (hist.length < 2) continue;
      const found = detectAnomalies(hist, u.storageTempRange);
      for (const f of found) {
        rows.push({
          din: u.din,
          group: u.bloodType,
          range: u.storageTempRange,
          flag: f,
          breach: isOutOfRange(f.temperatureCelsius, u.storageTempRange)
        });
      }
    }
    return rows.sort((a, b) => b.flag.score - a.flag.score).slice(0, 8);
  }, [units]);

  const outstanding = flags.filter(f => !reviewed.includes(`${f.din}:${f.flag.index}`)).length;

  const recordReview = (row: (typeof flags)[number], decision: 'AGREED' | 'DISMISSED') => {
    const key = `${row.din}:${row.flag.index}`;
    setReviewed(prev => [...prev, key]);
    setShadow(prev => [
      {
        id: `SH-${row.din.slice(-4)}-${row.flag.index}`,
        recommendation: `${reasonLabel[row.flag.reason]} on ${row.din}`,
        decision
      },
      ...prev
    ]);
  };

  const agreed = shadow.filter(s => s.decision === 'AGREED').length;

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <div className="eyebrow">Tier 1 &middot; assistive</div>
          <h1 className="page-title">Forecast &amp; anomaly review</h1>
          <p className="page-sub">
            Two statistical models that help a person decide. They are local, they never see personal data, and they
            never sit in a clinical path.
          </p>
        </div>
        <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(130px, 1fr))' }}>
          <div className="kpi">
            <div className="kpi-k">Forecast error (MAPE)</div>
            <div className="kpi-v">{demand.mape}%</div>
            <div className="kpi-n">Sample series, {demand.holdout}-week hold-out</div>
          </div>
          <div className={`kpi ${outstanding > 0 ? 'kpi--watch' : ''}`}>
            <div className="kpi-k">Flags for review</div>
            <div className="kpi-v">{outstanding}</div>
            <div className="kpi-n">Advisory &mdash; a person decides</div>
          </div>
        </div>
      </div>

      <div className="notice notice--demo">
        <Info className="notice-icon" size={15} />
        <span>
          <strong>Statistics, not a language model.</strong> These are deterministic time-series and threshold methods
          running in the browser, evaluated on <strong>illustrative sample data</strong>. There is no inference
          endpoint, no third-party service, and no personal data. Output is advisory only.
        </span>
      </div>

      <div className="card" style={{ border: '1px solid #8e1b2e', background: 'linear-gradient(to right, #fbf7f8, #ffffff)', padding: '18px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-sm)', background: '#8e1b2e', color: '#fff', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              <Sparkles size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>Tier 2 Operational Query &middot; Bloodchain AI Copilot</h3>
                <span className="status status--info" style={{ background: '#f8edef', color: '#8e1b2e', borderColor: '#f2d4d9', fontSize: 11, fontWeight: 600 }}>
                  Active Model: gemini-3.8-flash
                </span>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: 12.5, color: 'var(--ink-2)' }}>
                Conversational natural-language query over aggregate operational records, cold-chain telemetry, and clinical blood banking rules.
              </p>
            </div>
          </div>
          {onOpenCopilot && (
            <button
              className="btn btn--primary"
              onClick={onOpenCopilot}
              style={{ background: '#8e1b2e', color: '#fff', display: 'inline-flex', alignItems: 'center', gap: 7, fontWeight: 600, padding: '9px 18px', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer' }}
            >
              <Sparkles size={15} />
              <span>Launch Live Copilot &rarr;</span>
            </button>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-hd">
          <h3>Days-of-cover forecast by group</h3>
          <span className="dim" style={{ fontSize: 12 }}>Holt linear trend &middot; 6 weeks</span>
        </div>
        <div className="card-bd">
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Group</th>
                  <th>Units</th>
                  <th>Cover today</th>
                  <th>Trend</th>
                  <th>Advisory forecast +6w</th>
                  <th>Model basis</th>
                </tr>
              </thead>
              <tbody>
                {forecasts.map(f => (
                  <tr key={f.stat.group}>
                    <td className="cell-strong mono">{f.stat.group}</td>
                    <td className="mono tnum">{f.stat.count}</td>
                    <td className="mono tnum">{f.stat.daysOfSupply} d</td>
                    <td>
                      {f.direction === 'up' ? (
                        <span style={{ color: 'var(--safe)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <TrendingUp size={13} /> rising
                        </span>
                      ) : f.direction === 'down' ? (
                        <span style={{ color: 'var(--stop)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <TrendingDown size={13} /> falling
                        </span>
                      ) : (
                        <span className="dim">steady</span>
                      )}
                    </td>
                    <td className="mono tnum">{f.atHorizon}</td>
                    <td className="cell-sub mono" style={{ fontSize: 11 }}>
                      {f.fit.degraded ? 'mean baseline' : `level ${f.fit.level} · trend ${f.fit.trend}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="notice" style={{ marginTop: 14 }}>
            <Info className="notice-icon" size={15} />
            <span>
              The forecast is computed from an <strong>illustrative history</strong> seeded from the current count, not
              from real issue records. The deterministic threshold below 3&nbsp;days still governs the alert; this
              column only looks ahead of it.
            </span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-hd">
          <h3>Cold-chain anomaly review queue</h3>
          <span className="dim" style={{ fontSize: 12 }}>
            Rolling z-score + rate of change &middot; {flags.length} flag{flags.length === 1 ? '' : 's'}
          </span>
        </div>
        <div className="card-bd">
          {flags.length === 0 ? (
            <div className="tbl-empty">No unusual telemetry patterns in the current sample.</div>
          ) : (
            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Unit</th>
                    <th>Reading</th>
                    <th>Stored range</th>
                    <th>Pattern</th>
                    <th>Score</th>
                    <th>Verdict</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {flags.map(row => {
                    const key = `${row.din}:${row.flag.index}`;
                    const done = reviewed.includes(key);
                    return (
                      <tr key={key} style={{ opacity: done ? 0.55 : 1 }}>
                        <td className="cell-strong mono">{row.din}</td>
                        <td className="mono tnum">{row.flag.temperatureCelsius}&deg;C</td>
                        <td className="mono dim" style={{ fontSize: 11 }}>
                          {row.range.min}&ndash;{row.range.max}&deg;C
                        </td>
                        <td>{reasonLabel[row.flag.reason]}</td>
                        <td className="mono tnum">{row.flag.score}</td>
                        <td>
                          <span className={`status ${row.breach ? 'status--stop' : 'status--hold'}`}>
                            {row.breach ? 'out of range' : 'in range'}
                          </span>
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          {done ? (
                            <span className="dim" style={{ fontSize: 11 }}>reviewed</span>
                          ) : (
                            <>
                              <button className="btn btn--outline" style={{ padding: '3px 8px', fontSize: 11 }} onClick={() => recordReview(row, 'AGREED')}>
                                Agree
                              </button>{' '}
                              <button className="btn btn--outline" style={{ padding: '3px 8px', fontSize: 11 }} onClick={() => recordReview(row, 'DISMISSED')}>
                                Dismiss
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <div className="notice notice--safe" style={{ marginTop: 14 }}>
            <ShieldCheck className="notice-icon" size={15} />
            <span>
              The <strong>Verdict</strong> column is the deterministic comparison against the unit&rsquo;s stored range.
              The anomaly flag never sets it, sets no unit status, and writes nothing to the audit log.
            </span>
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-hd">
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FlaskConical size={16} /> Evaluation harness
            </span>
          </div>
          <div className="card-bd">
            <div className="tbl-wrap">
              <table className="tbl">
                <tbody>
                  <tr>
                    <td>Demand &mdash; mean absolute error</td>
                    <td className="mono tnum">{demand.mae}</td>
                  </tr>
                  <tr>
                    <td>Demand &mdash; root mean square error</td>
                    <td className="mono tnum">{demand.rmse}</td>
                  </tr>
                  <tr>
                    <td>Anomaly &mdash; precision</td>
                    <td className="mono tnum">{anomalyEval.metrics.precision}</td>
                  </tr>
                  <tr>
                    <td>Anomaly &mdash; recall</td>
                    <td className="mono tnum">{anomalyEval.metrics.recall}</td>
                  </tr>
                  <tr>
                    <td>Anomaly &mdash; F1</td>
                    <td className="mono tnum">{anomalyEval.metrics.f1}</td>
                  </tr>
                  <tr>
                    <td>Labelled anomalies detected</td>
                    <td className="mono tnum">
                      {anomalyEval.metrics.truePositives}/{anomalyEval.labelled}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="hint" style={{ marginTop: 10 }}>
              Measured on {demand.holdout + 9} illustrative points shipped with this build. Real error rates require
              real history, and will be published when the pilot supplies it.
            </p>
          </div>
        </div>

        <div className="card">
          <div className="card-hd">
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShieldCheck size={16} /> Controls
            </span>
            <span className="dim" style={{ fontSize: 12 }}>
              {controls.filter(c => c.ok).length}/{controls.length} passing
            </span>
          </div>
          <div className="card-bd">
            <ul className="stack" style={{ listStyle: 'none', padding: 0, margin: 0, gap: 10 }}>
              {controls.map(c => (
                <li key={c.name} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 13 }}>
                  {c.ok ? (
                    <CheckCircle2 size={15} style={{ color: 'var(--safe)', flexShrink: 0, marginTop: 2 }} />
                  ) : (
                    <AlertTriangle size={15} style={{ color: 'var(--stop)', flexShrink: 0, marginTop: 2 }} />
                  )}
                  <span>{c.name}</span>
                </li>
              ))}
            </ul>
            <div className="notice" style={{ marginTop: 12 }}>
              <Info className="notice-icon" size={15} />
              <span>
                Shadow mode: {shadow.length} reviewed
                {shadow.length > 0 ? `, human agreed with ${agreed} of ${shadow.length}` : ''}. The disagreement log is
                what decides whether each model stays.
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-hd">
          <h3>Model register</h3>
          <span className="dim" style={{ fontSize: 12 }}>A component with no entry does not ship</span>
        </div>
        <div className="card-bd">
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Component</th>
                  <th>Tier</th>
                  <th>Method</th>
                  <th>Personal data</th>
                  <th>Retires if</th>
                </tr>
              </thead>
              <tbody>
                {MODEL_REGISTER.map(m => (
                  <tr key={m.id}>
                    <td className="mono">{m.id}</td>
                    <td className="cell-strong">{m.name}</td>
                    <td>
                      <span className="status status--info">Tier {m.tier}</span>
                    </td>
                    <td className="cell-sub">{m.method}</td>
                    <td>
                      <span className="status status--safe">none</span>
                    </td>
                    <td className="cell-sub">{m.retiresIf}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
