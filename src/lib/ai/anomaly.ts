/**
 * Tier 1 — cold-chain anomaly detection.
 *
 * Statistical, deterministic and local: rolling z-score plus a rate-of-change
 * test over a unit's temperature history. No model weights, no network calls,
 * no personal data.
 *
 * HARD BOUNDARY — read this before using the module.
 * ---------------------------------------------------------------------------
 * The authoritative verdict on whether a unit has been thermally compromised
 * is `isOutOfRange()` below: a pure comparison against the product's stored
 * temperature range. Anomaly detection is a SEPARATE, ADVISORY signal that
 * surfaces an unusual pattern for a human to review. It never sets a unit's
 * status, never marks a unit compromised, and never writes to the audit log.
 *
 * `assertAnomalyCannotSetVerdict()` encodes that separation as a test.
 */

export interface TelemetryReading {
  timestamp: string;
  temperatureCelsius: number;
  locationName?: string;
}

export interface TemperatureRange {
  min: number;
  max: number;
}

export interface AnomalyFlag {
  index: number;
  timestamp: string;
  temperatureCelsius: number;
  /** Standard deviations from the rolling mean, or null on the first points. */
  zScore: number | null;
  /** Change from the previous reading, in degrees per hour where timestamps allow. */
  ratePerHour: number | null;
  reason: 'RAPID_CHANGE' | 'STATISTICAL_OUTLIER' | 'APPROACHING_LIMIT';
  /** Advisory confidence in [0,1] — a heuristic weight, not a probability claim. */
  score: number;
}

export interface AnomalyOptions {
  window?: number;
  zThreshold?: number;
  rateThresholdPerHour?: number;
  approachBand?: number;
}

const mean = (xs: number[]): number => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const stdDev = (xs: number[]): number => {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return Math.sqrt(mean(xs.map(x => (x - m) ** 2)));
};
const round2 = (n: number): number => Math.round(n * 100) / 100;

/** The deterministic verdict. This — not the anomaly score — decides a breach. */
export function isOutOfRange(temp: number, range: TemperatureRange): boolean {
  return temp < range.min || temp > range.max;
}

function hoursBetween(a: string, b: string): number {
  const ta = Date.parse(a);
  const tb = Date.parse(b);
  if (Number.isNaN(ta) || Number.isNaN(tb)) return 1;
  const h = Math.abs(tb - ta) / 3_600_000;
  // Guard against duplicate or out-of-order timestamps producing a divide-by-zero.
  return h <= 0 ? 1 : h;
}

/**
 * Flag unusual patterns for review. Returns advisory flags only — the caller
 * decides what, if anything, a human does about them.
 */
export function detectAnomalies(
  readings: TelemetryReading[],
  range: TemperatureRange,
  options: AnomalyOptions = {}
): AnomalyFlag[] {
  const { window = 5, zThreshold = 2.5, rateThresholdPerHour = 1.5, approachBand = 1 } = options;
  const flags: AnomalyFlag[] = [];
  const temps = readings.map(r => r.temperatureCelsius);

  for (let i = 0; i < readings.length; i++) {
    const r = readings[i];

    // Rolling baseline from the readings before this one only — never look ahead.
    const start = Math.max(0, i - window);
    const prior = temps.slice(start, i);

    const m = mean(prior);
    const sd = stdDev(prior);
    const z = sd > 0 ? (r.temperatureCelsius - m) / sd : null;

    const prev = i > 0 ? readings[i - 1] : null;
    const rate = prev
      ? (r.temperatureCelsius - prev.temperatureCelsius) / hoursBetween(prev.timestamp, r.timestamp)
      : null;

    const nearLimit =
      r.temperatureCelsius < range.min + approachBand &&
      r.temperatureCelsius >= range.min
        ? 'APPROACHING_LIMIT'
        : r.temperatureCelsius > range.max - approachBand && r.temperatureCelsius <= range.max
        ? 'APPROACHING_LIMIT'
        : null;

    if (rate !== null && Math.abs(rate) >= rateThresholdPerHour) {
      flags.push({
        index: i,
        timestamp: r.timestamp,
        temperatureCelsius: r.temperatureCelsius,
        zScore: z === null ? null : round2(z),
        ratePerHour: round2(rate),
        reason: 'RAPID_CHANGE',
        score: round2(Math.min(1, Math.abs(rate) / (rateThresholdPerHour * 2)))
      });
      continue;
    }

    if (z !== null && Math.abs(z) >= zThreshold) {
      flags.push({
        index: i,
        timestamp: r.timestamp,
        temperatureCelsius: r.temperatureCelsius,
        zScore: round2(z),
        ratePerHour: rate === null ? null : round2(rate),
        reason: 'STATISTICAL_OUTLIER',
        score: round2(Math.min(1, Math.abs(z) / (zThreshold * 2)))
      });
      continue;
    }

    if (nearLimit) {
      flags.push({
        index: i,
        timestamp: r.timestamp,
        temperatureCelsius: r.temperatureCelsius,
        zScore: z === null ? null : round2(z),
        ratePerHour: rate === null ? null : round2(rate),
        reason: 'APPROACHING_LIMIT',
        score: 0.4
      });
    }
  }

  return flags;
}

/**
 * The separation between advisory flagging and the deterministic verdict,
 * expressed as an executable check. Throws if the two have been conflated.
 */
export function assertAnomalyCannotSetVerdict(): void {
  const range: TemperatureRange = { min: 2, max: 6 };
  // A reading inside the range that is a statistical outlier must NOT be a breach.
  const inside: TelemetryReading[] = [
    { timestamp: '2026-01-01T00:00:00Z', temperatureCelsius: 4.0 },
    { timestamp: '2026-01-01T01:00:00Z', temperatureCelsius: 4.1 },
    { timestamp: '2026-01-01T02:00:00Z', temperatureCelsius: 4.0 },
    { timestamp: '2026-01-01T03:00:00Z', temperatureCelsius: 5.9 }
  ];
  const flagged = detectAnomalies(inside, range);
  const breach = inside.filter(r => isOutOfRange(r.temperatureCelsius, range));
  if (flagged.length > 0 && breach.length === 0) {
    // Correct: an anomaly was flagged, but no breach was declared.
    return;
  }
  throw new Error('Anomaly detection and the deterministic breach verdict are not separated.');
}
