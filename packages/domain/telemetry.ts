/**
 * Cold-chain telemetry rules. Pure.
 *
 * The excursion verdict is a comparison, nothing more. Anomaly detection lives
 * in the AI layer and is advisory; this function is the deterministic answer,
 * and only this function may mark a unit compromised.
 */

export interface TempRange {
  min: number;
  max: number;
}

export interface TempReading {
  timestamp: string;
  temperatureCelsius: number;
}

export function isOutOfRange(temp: number, range: TempRange): boolean {
  return temp < range.min || temp > range.max;
}

export interface ExcursionSummary {
  readings: number;
  breaches: number;
  worstCelsius: number | null;
  worstAt: string | null;
  /** True when at least one reading fell outside the range. */
  compromised: boolean;
}

/** Deterministic excursion verdict over a reading history. Pure. */
export function summariseExcursions(readings: TempReading[], range: TempRange): ExcursionSummary {
  if (readings.length === 0) {
    return { readings: 0, breaches: 0, worstCelsius: null, worstAt: null, compromised: false };
  }

  let breaches = 0;
  let worstCelsius: number | null = null;
  let worstAt: string | null = null;
  let worstDistance = -1;

  for (const r of readings) {
    if (!isOutOfRange(r.temperatureCelsius, range)) continue;
    breaches += 1;
    const dist = Math.max(range.min - r.temperatureCelsius, r.temperatureCelsius - range.max);
    if (dist > worstDistance) {
      worstDistance = dist;
      worstCelsius = r.temperatureCelsius;
      worstAt = r.timestamp;
    }
  }

  return { readings: readings.length, breaches, worstCelsius, worstAt, compromised: breaches > 0 };
}

/** Statuses a cold-chain breach may set, per the state machine. */
export const EXCURSION_TARGET_STATUS = 'QUARANTINED' as const;
