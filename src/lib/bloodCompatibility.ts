import { BloodType } from '../types/bloodchain';
import { isRbcCompatible as rbc, isBloodGroup } from '../../packages/domain/index';

/**
 * Red-cell and plasma compatibility.
 *
 * The RULE now lives in packages/domain (pure, tested). This module keeps the
 * matrices for UI use and delegates the decision, so there is exactly one
 * implementation of the compatibility rule in the codebase.
 */

/** Donor group -> recipients who may receive it (red cells). */
export const RBC_COMPATIBILITY: Record<BloodType, BloodType[]> = {
  'O-': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
  'O+': ['O+', 'A+', 'B+', 'AB+'],
  'A-': ['A-', 'A+', 'AB-', 'AB+'],
  'A+': ['A+', 'AB+'],
  'B-': ['B-', 'B+', 'AB-', 'AB+'],
  'B+': ['B+', 'AB+'],
  'AB-': ['AB-', 'AB+'],
  'AB+': ['AB+']
};

/** Plasma runs opposite to red cells. */
export const PLASMA_COMPATIBILITY: Record<BloodType, BloodType[]> = {
  'AB+': ['AB+', 'AB-', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-'],
  'AB-': ['AB+', 'AB-', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-'],
  'A+': ['A+', 'A-', 'O+', 'O-'],
  'A-': ['A+', 'A-', 'O+', 'O-'],
  'B+': ['B+', 'B-', 'O+', 'O-'],
  'B-': ['B+', 'B-', 'O+', 'O-'],
  'O+': ['O+', 'O-'],
  'O-': ['O+', 'O-']
};

export function isRbcCompatible(donor: BloodType, recipient: BloodType): boolean {
  return rbc(donor, recipient);
}

export function isPlasmaCompatible(donor: BloodType, recipient: BloodType): boolean {
  return PLASMA_COMPATIBILITY[donor]?.includes(recipient) ?? false;
}

export { isBloodGroup };
