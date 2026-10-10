/**
 * Bloodchain AI layer — Tier 1 (assistive, non-clinical, no personal data).
 *
 * Everything exported here is statistical, deterministic and local. There is no
 * language model, no inference endpoint, and no network call in this module.
 *
 * The clinical path is deliberately absent from this directory. Blood-group
 * interpretation, the compatibility matrix, unit state transitions, release and
 * discard, and the two-clinician interlock live in the domain layer as pure
 * functions and are never imported from here.
 */

export * from './forecast';
export * from './anomaly';
export * from './evaluation';

/**
 * The AI register. Control 1 in the governance section requires that every AI
 * component be recorded with what it does, its tier, the data it sees, its
 * measured error rate, its owner and the condition that would retire it. A
 * component with no register entry does not ship.
 */
export interface ModelRegisterEntry {
  id: string;
  name: string;
  tier: 0 | 1 | 2 | 3;
  method: string;
  seesPersonalData: false;
  runsInCountry: true;
  writesToAuditLog: false;
  canInfluenceClinicalDecision: false;
  measuredError: string;
  owner: string;
  retiresIf: string;
}

export const MODEL_REGISTER: ModelRegisterEntry[] = [
  {
    id: 'BC-AI-001',
    name: 'Demand forecasting',
    tier: 1,
    method: 'Holt linear-trend exponential smoothing (statistical)',
    seesPersonalData: false,
    runsInCountry: true,
    writesToAuditLog: false,
    canInfluenceClinicalDecision: false,
    measuredError: 'reported as MAE/RMSE/MAPE on the sample golden series',
    owner: 'Operations analytics',
    retiresIf: 'Backtest error on real issue history exceeds the mean-baseline baseline.'
  },
  {
    id: 'BC-AI-002',
    name: 'Cold-chain anomaly detection',
    tier: 1,
    method: 'Rolling z-score + rate-of-change (statistical)',
    seesPersonalData: false,
    runsInCountry: true,
    writesToAuditLog: false,
    canInfluenceClinicalDecision: false,
    measuredError: 'reported as precision/recall/F1 on the labelled sample trace',
    owner: 'Cold-chain logistics',
    retiresIf: 'Advisory flags consistently disagree with human review in shadow mode.'
  }
];

/** Every entry must be Tier 1 or lower and free of personal data, by construction. */
export function assertRegisterIntegrity(): void {
  for (const e of MODEL_REGISTER) {
    if (e.tier > 1) {
      throw new Error(`${e.id} is Tier ${e.tier}; only Tier 1 may ship without the Tier 2 gates.`);
    }
    if (e.seesPersonalData || !e.runsInCountry || e.writesToAuditLog || e.canInfluenceClinicalDecision) {
      throw new Error(`${e.id} violates the Tier 1 constraints.`);
    }
  }
}
