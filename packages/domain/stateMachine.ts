/**
 * The unit state machine. Pure.
 *
 * This is the SINGLE source of truth for what a unit's status may become. Every
 * surface reads its transitions from here, and the API service refuses any
 * transition this function does not permit. Before this existed, each console
 * held its own copy of the rules and they could disagree.
 */

export const UNIT_STATUSES = [
  'COLLECTED',
  'IN_TESTING',
  'QUARANTINED',
  'RELEASED',
  'IN_TRANSIT',
  'DELIVERED_TO_HOSPITAL',
  'BEDSIDE_CROSSMATCHED',
  'TRANSFUSED',
  'DISPOSED'
] as const;

export type UnitStatus = (typeof UNIT_STATUSES)[number];

/**
 * Legal transitions, keyed by current status.
 * A status may always transition to itself (idempotent write).
 */
const TRANSITIONS: Record<UnitStatus, UnitStatus[]> = {
  COLLECTED: ['COLLECTED', 'IN_TESTING', 'QUARANTINED', 'DISPOSED'],
  IN_TESTING: ['IN_TESTING', 'QUARANTINED', 'RELEASED', 'DISPOSED'],
  QUARANTINED: ['QUARANTINED', 'DISPOSED', 'RELEASED'],
  RELEASED: ['RELEASED', 'IN_TRANSIT', 'DISPOSED'],
  IN_TRANSIT: ['IN_TRANSIT', 'DELIVERED_TO_HOSPITAL', 'QUARANTINED'],
  DELIVERED_TO_HOSPITAL: ['DELIVERED_TO_HOSPITAL', 'BEDSIDE_CROSSMATCHED', 'DISPOSED'],
  BEDSIDE_CROSSMATCHED: ['BEDSIDE_CROSSMATCHED', 'TRANSFUSED'],
  TRANSFUSED: ['TRANSFUSED'],
  DISPOSED: ['DISPOSED']
};

export function isUnitStatus(value: string): value is UnitStatus {
  return (UNIT_STATUSES as readonly string[]).includes(value);
}

export function allowedTransitions(from: UnitStatus): UnitStatus[] {
  return TRANSITIONS[from] ?? [];
}

export function canTransition(from: string, to: string): boolean {
  if (!isUnitStatus(from) || !isUnitStatus(to)) return false;
  return allowedTransitions(from).includes(to);
}

/** Statuses in which a unit may be issued clinically. */
export function isIssuable(status: string): boolean {
  return status === 'RELEASED' || status === 'DELIVERED_TO_HOSPITAL' || status === 'BEDSIDE_CROSSMATCHED';
}

/** Statuses that occupy usable inventory. */
export function isAvailableStock(status: string): boolean {
  return status === 'RELEASED' || status === 'DELIVERED_TO_HOSPITAL';
}
