/**
 * Tier 1 — demand forecasting.
 *
 * Statistical time-series forecasting (Holt's linear trend), NOT a language
 * model. It runs locally, makes no network calls, and sees no personal data.
 *
 * Advisory only. The authoritative signal remains the deterministic
 * days-of-supply threshold computed elsewhere; this module never sets a status,
 * never triggers an alert, and never writes to the audit log.
 */

export interface ForecastPoint {
  /** Steps ahead of the last observed value. */
  step: number;
  value: number;
}

export interface Forecast {
  method: 'holt-linear' | 'mean-baseline';
  points: ForecastPoint[];
  /** Fitted level and trend at the end of the series. */
  level: number;
  trend: number;
  /** True when the series was too short to fit a trend and a flat mean was used. */
  degraded: boolean;
}

export interface BacktestResult {
  mae: number;
  rmse: number;
  mape: number;
  holdout: number;
  predictions: number[];
  actuals: number[];
}

const mean = (xs: number[]): number => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const round2 = (n: number): number => Math.round(n * 100) / 100;
const clampNonNegative = (n: number): number => (n < 0 ? 0 : n);

/** Simple trailing moving average, used to smooth a plotted history. */
export function movingAverage(series: number[], window: number): number[] {
  if (window < 1) return [...series];
  const out: number[] = [];
  for (let i = 0; i < series.length; i++) {
    const start = Math.max(0, i - window + 1);
    out.push(mean(series.slice(start, i + 1)));
  }
  return out;
}

/**
 * Holt's linear-trend exponential smoothing.
 *
 * alpha weights the level, beta the trend. With fewer than three observations
 * there is nothing to fit, so it degrades to a flat mean baseline and says so
 * via `degraded`.
 */
export function holtLinear(
  series: number[],
  alpha = 0.5,
  beta = 0.3,
  horizon = 6
): Forecast {
  if (series.length < 3) {
    const m = round2(mean(series));
    return {
      method: 'mean-baseline',
      points: Array.from({ length: horizon }, (_, i) => ({ step: i + 1, value: m })),
      level: m,
      trend: 0,
      degraded: true
    };
  }

  let level = series[0];
  let trend = series[1] - series[0];

  for (let i = 1; i < series.length; i++) {
    const prevLevel = level;
    level = alpha * series[i] + (1 - alpha) * (level + trend);
    trend = beta * (level - prevLevel) + (1 - beta) * trend;
  }

  const points: ForecastPoint[] = [];
  for (let h = 1; h <= horizon; h++) {
    points.push({ step: h, value: round2(clampNonNegative(level + h * trend)) });
  }

  return { method: 'holt-linear', points, level: round2(level), trend: round2(trend), degraded: false };
}

/**
 * Hold-out backtest: fit on everything but the last `holdout` points, then
 * predict them. This produces the measured error rate the AI register requires.
 */
export function backtest(
  series: number[],
  alpha = 0.5,
  beta = 0.3,
  holdout = 3
): BacktestResult {
  const n = series.length;
  if (n <= holdout + 2) {
    return { mae: 0, rmse: 0, mape: 0, holdout: 0, predictions: [], actuals: [] };
  }

  const train = series.slice(0, n - holdout);
  const actuals = series.slice(n - holdout);
  const fit = holtLinear(train, alpha, beta, holdout);
  const predictions = fit.points.map(p => p.value);

  const errors = actuals.map((a, i) => a - predictions[i]);
  const mae = mean(errors.map(Math.abs));
  const rmse = Math.sqrt(mean(errors.map(e => e * e)));
  const mape = mean(actuals.map((a, i) => (a === 0 ? 0 : Math.abs(errors[i] / a)))) * 100;

  return {
    mae: round2(mae),
    rmse: round2(rmse),
    mape: round2(mape),
    holdout,
    predictions,
    actuals
  };
}
