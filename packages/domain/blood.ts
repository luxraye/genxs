/**
 * ABO/Rh red-cell compatibility. Pure.
 * Patient A+ can receive from donors A+, A-, O+, O-. The rule is set membership.
 */

export type ABO = 'A' | 'B' | 'AB' | 'O';
export type Rh = '+' | '-';
export type BloodGroup = `${ABO}${Rh}`;

export const BLOOD_GROUPS: BloodGroup[] = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'];

const DONOR_ABO: Record<ABO, ABO[]> = {
  O: ['O'],
  A: ['A', 'O'],
  B: ['B', 'O'],
  AB: ['A', 'B', 'AB', 'O']
};

export function parseGroup(group: string): { abo: ABO; rh: Rh } | null {
  const m = /^(A|B|AB|O)([+-])$/.exec(group.trim().toUpperCase());
  if (!m) return null;
  return { abo: m[1] as ABO, rh: m[2] as Rh };
}

export function isBloodGroup(group: string): group is BloodGroup {
  return parseGroup(group) !== null;
}

/** Red-cell compatibility: can a unit of `donorGroup` be given to `recipientGroup`? */
export function isRbcCompatible(donorGroup: string, recipientGroup: string): boolean {
  const d = parseGroup(donorGroup);
  const r = parseGroup(recipientGroup);
  if (!d || !r) return false;
  if (!DONOR_ABO[r.abo].includes(d.abo)) return false;
  // Rh-negative recipient may only receive Rh-negative red cells.
  if (r.rh === '-' && d.rh === '+') return false;
  return true;
}

/** Donor groups that are compatible with a given recipient, in canonical order. */
export function compatibleDonorGroups(recipientGroup: string): BloodGroup[] {
  return BLOOD_GROUPS.filter(g => isRbcCompatible(g, recipientGroup));
}
