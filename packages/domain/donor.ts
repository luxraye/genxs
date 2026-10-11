/**
 * Donor registration and verification rules. Pure, like every rule in this package.
 *
 * What lives here is ACCESS CONTROL and PIPELINE, not clinical judgement:
 *   · who may adjudicate a donor's documents;
 *   · what verification tier the approved documents actually justify.
 *
 * It deliberately says nothing about who may give blood. Deferral and
 * eligibility criteria belong to the national blood service, and a platform that
 * invents them would be inventing clinical policy. See docs/CONSTITUTION.md CS-13.
 *
 * The rule this module exists to enforce: a donor never verifies themselves.
 */

import { isBloodGroup } from './blood';

export type DonorVerificationTier = 1 | 2 | 3 | 4;

export type StaffRole =
  | 'DONOR'
  | 'LAB_TECH'
  | 'LOGISTICS_COURIER'
  | 'CLINICAL_STAFF'
  | 'NATIONAL_OPERATOR'
  | 'AUDITOR';

export type DocumentStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type DocumentType = 'NATIONAL_ID' | 'MEDICAL_CLEARANCE' | 'SEROLOGY_RECORD' | 'DONOR_QUESTIONNAIRE';

export interface DocumentLike {
  type: string;
  status: DocumentStatus;
}

export const DONOR_TIERS: DonorVerificationTier[] = [1, 2, 3, 4];

export const DOCUMENT_TYPES: DocumentType[] = [
  'NATIONAL_ID',
  'MEDICAL_CLEARANCE',
  'SEROLOGY_RECORD',
  'DONOR_QUESTIONNAIRE'
];

/**
 * The roles that may adjudicate a donor document. Operations only: the desk that
 * provisions accounts is the desk that verifies donors. An auditor reads; a
 * laboratory or clinical account has no business approving identity papers.
 */
export const REVIEWER_ROLES: StaffRole[] = ['NATIONAL_OPERATOR'];

export function canReviewDonorDocuments(role: string): boolean {
  return REVIEWER_ROLES.includes(role as StaffRole);
}

export function isDonorTier(value: unknown): value is DonorVerificationTier {
  return value === 1 || value === 2 || value === 3 || value === 4;
}

export function isDocumentType(value: unknown): value is DocumentType {
  return DOCUMENT_TYPES.includes(value as DocumentType);
}

export function isValidDocumentStatus(value: unknown): value is DocumentStatus {
  return value === 'PENDING' || value === 'APPROVED' || value === 'REJECTED';
}

/** A decision is APPROVED or REJECTED. PENDING is a state, never a decision. */
export function isReviewDecision(value: unknown): value is 'APPROVED' | 'REJECTED' {
  return value === 'APPROVED' || value === 'REJECTED';
}

const MAX_EMAIL_LENGTH = 254;
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function normaliseEmail(email: string): string {
  return String(email ?? '').trim().toLowerCase();
}

/** Deliberately conservative: one @, a dot-bearing domain, no whitespace. */
export function isValidDonorEmail(email: string): boolean {
  const candidate = normaliseEmail(email);
  return candidate.length > 3 && candidate.length <= MAX_EMAIL_LENGTH && EMAIL_SHAPE.test(candidate);
}

/** Only an APPROVED document of a given type counts, and only once. */
export function hasApproved(documents: DocumentLike[], type: DocumentType): boolean {
  return documents.some(d => d.type === type && d.status === 'APPROVED');
}

/**
 * The highest tier the evidence justifies — a ceiling, not a target.
 *
 * Registration alone is tier 1. A reviewed national ID is tier 2. One clinical
 * record on top is tier 3; both is tier 4. Pending and rejected documents advance
 * nothing, so nobody climbs by uploading more paper.
 *
 * This is the tier a review settles at, in either direction: approving the
 * evidence that justifies a higher tier raises it, rejecting evidence takes it
 * back down. It is also the ceiling a manual tier change is capped to, because a
 * tier that outruns its documents is a claim, not a record.
 */
export function tierJustifiedBy(documents: DocumentLike[]): DonorVerificationTier {
  if (!hasApproved(documents, 'NATIONAL_ID')) return 1;
  const medicalClearance = hasApproved(documents, 'MEDICAL_CLEARANCE');
  const serology = hasApproved(documents, 'SEROLOGY_RECORD');
  if (medicalClearance && serology) return 4;
  if (medicalClearance || serology) return 3;
  return 2;
}

export interface DonorRegistrationInput {
  fullName?: unknown;
  email?: unknown;
  bloodType?: unknown;
  nationalIdNumber?: unknown;
  phone?: unknown;
  cityDistrict?: unknown;
}

/**
 * Everything wrong with a registration, in the order a form would ask for it.
 * An empty array means the form is acceptable.
 */
export function donorRegistrationProblems(input: DonorRegistrationInput): string[] {
  const problems: string[] = [];

  if (!String(input.fullName ?? '').trim()) problems.push('fullName is required.');
  if (!isValidDonorEmail(String(input.email ?? ''))) problems.push('email must be a valid address.');
  if (!isBloodGroup(String(input.bloodType ?? ''))) {
    problems.push('bloodType must be one of O-, O+, A-, A+, B-, B+, AB-, AB+.');
  }
  if (!String(input.nationalIdNumber ?? '').trim()) problems.push('nationalIdNumber is required.');

  return problems;
}
