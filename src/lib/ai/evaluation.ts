/**
 * Tier 1 — evaluation harness.
 *
 * Control 6 in the AI position requires that every AI feature ships with a
 * golden dataset, a measured error rate and regression tests. This module is
 * that harness: fixed, illustrative datasets and the metrics computed over them.
 *
 * Everything here is deterministic and offline. The numbers are measured on
 * SAMPLE data shipped with the demonstration build, not on real service data —
 * which is why they are labelled as such wherever they are shown.
 */

import { backtest, type BacktestResult } from './forecast';
import { detectAnomalies, isOutOfRange, type TelemetryReading, type TemperatureRange } from './anomaly';

export interface ClassificationMetrics {
  truePositives: number;
  falsePositives: number;
  falseNegatives: number;
  precision: number;
  recall: number;
  f1: number;
}

export interface AnomalyEvaluation {
  metrics: ClassificationMetrics;
  readings: number;
  labelled: number;
  detected: number;
}

const round3 = (n: number): number => Math.round(n * 1000) / 1000;
const safeDiv = (a: number, b: number): number => (b === 0 ? 0 : a / b);

/**
 * Golden dataset: twelve weeks of illustrative weekly issue counts for one
 * blood group. A gentle upward trend with mild noise — enough to backtest a
 * trend model, small enough to read.
 */
export const GOLDEN_DEMAND_SERIES: number[] = [
  42, 40, 44, 46, 43, 47, 49, 48, 52, 51, 54, 56
];

/** Golden dataset: a temperature trace with three labelled excursions. */
export const GOLDEN_TELEMETRY: TelemetryReading[] = [
  { timestamp: '2026-01-01T00:00:00Z', temperatureCelsius: 4.0 },
  { timestamp: '2026-01-01T01:00:00Z', temperatureCelsius: 4.1 },
  { timestamp: '2026-01-01T02:00:00Z', temperatureCelsius: 3.9 },
  { timestamp: '2026-01-01T03:00:00Z', temperatureCelsius: 4.2 }, // labelled excursion
  { timestamp: '2026-01-01T04:00:00Z', temperatureCelsius: 4.0 },
  { timestamp: '2026-01-01T05:00:00Z', temperatureCelsius: 4.1 },
  { timestamp: '2026-01-01T06:00:00Z', temperatureCelsius: 6.9 }, // labelled excursion
  { timestamp: '2026-01-01T07:00:00Z', temperatureCelsius: 4.0 },
  { timestamp: '2026-01-01T08:00:00Z', temperatureCelsius: 3.8 },
  { timestamp: '2026-01-01T09:00:00Z', temperatureCelsius: 9.5 } // labelled excursion
];

/** Readings a human would consider worth flagging (breach OR unusual-but-in-range). */
export const GOLDEN_TELEMETRY_LABELS: number[] = [3, 6, 9];

/** Readings genuinely outside the stored range — the deterministic verdict's ground truth. */
export const GOLDEN_BREACH_INDICES: number[] = [6, 9];
export const GOLDEN_RANGE: TemperatureRange = { min: 2, max: 6 };

/** Evaluate the demand forecaster against the golden series. */
export function evaluateDemandForecast(): BacktestResult {
  return backtest(GOLDEN_DEMAND_SERIES, 0.5, 0.3, 3);
}

/** Evaluate anomaly detection against the labelled golden trace. */
export function evaluateAnomalyDetection(): AnomalyEvaluation {
  const flags = detectAnomalies(GOLDEN_TELEMETRY, GOLDEN_RANGE);
  const detectedIndices = new Set(flags.map(f => f.index));
  const labelled = new Set(GOLDEN_TELEMETRY_LABELS);

  let tp = 0;
  let fp = 0;
  for (const i of detectedIndices) {
    if (labelled.has(i)) tp += 1;
    else fp += 1;
  }
  const fn = [...labelled].filter(i => !detectedIndices.has(i)).length;

  const precision = safeDiv(tp, tp + fp);
  const recall = safeDiv(tp, tp + fn);

  return {
    metrics: {
      truePositives: tp,
      falsePositives: fp,
      falseNegatives: fn,
      precision: round3(precision),
      recall: round3(recall),
      f1: round3(safeDiv(2 * precision * recall, precision + recall))
    },
    readings: GOLDEN_TELEMETRY.length,
    labelled: labelled.size,
    detected: detectedIndices.size
  };
}

/**
 * How often the deterministic verdict agrees with the out-of-range comparison
 * on the golden trace. This is a consistency check on the safety boundary, not
 * a model metric: it must always be 1.0.
 */
export function verdictAgreement(): number {
  const breach = GOLDEN_TELEMETRY.filter(r => isOutOfRange(r.temperatureCelsius, GOLDEN_RANGE)).length;
  const expected = GOLDEN_BREACH_INDICES.length;
  return round3(safeDiv(breach, expected));
}

export { backtest, type BacktestResult };
