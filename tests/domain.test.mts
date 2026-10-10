import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  isRbcCompatible, compatibleDonorGroups, parseGroup, isBloodGroup, BLOOD_GROUPS
} from '../packages/domain/blood.ts';
import { canTransition, allowedTransitions, isUnitStatus, UNIT_STATUSES } from '../packages/domain/stateMachine.ts';
import { isOutOfRange, summariseExcursions } from '../packages/domain/telemetry.ts';

test('ABO/Rh: universal donor and recipient', () => {
  for (const r of BLOOD_GROUPS) assert.equal(isRbcCompatible('O-', r), true, `O- -> ${r}`);
  assert.equal(isRbcCompatible('AB+', 'AB+'), true);
  assert.equal(isRbcCompatible('AB+', 'A+'), false);
});

test('ABO/Rh: Rh-negative recipients never receive Rh-positive red cells', () => {
  for (const abo of ['A', 'B', 'AB', 'O'] as const) {
    assert.equal(isRbcCompatible(`${abo}+`, `${abo}-`), false, `${abo}+ -> ${abo}- must be refused`);
  }
});

test('ABO/Rh: plasma-style antigen rules', () => {
  assert.equal(isRbcCompatible('A+', 'A+'), true);
  assert.equal(isRbcCompatible('A+', 'B+'), false);
  assert.equal(isRbcCompatible('B+', 'A+'), false);
  assert.equal(isRbcCompatible('A+', 'AB+'), true);
});

test('ABO/Rh: matches the shipped matrix exactly', () => {
  const matrix: Record<string, string[]> = {
    'O-': ['O-','O+','A-','A+','B-','B+','AB-','AB+'], 'O+': ['O+','A+','B+','AB+'],
    'A-': ['A-','A+','AB-','AB+'], 'A+': ['A+','AB+'],
    'B-': ['B-','B+','AB-','AB+'], 'B+': ['B+','AB+'],
    'AB-': ['AB-','AB+'], 'AB+': ['AB+']
  };
  for (const d of BLOOD_GROUPS) for (const r of BLOOD_GROUPS) {
    assert.equal(isRbcCompatible(d, r), matrix[d].includes(r), `${d} -> ${r}`);
  }
});

test('ABO/Rh: malformed input is refused, never guessed', () => {
  assert.equal(isRbcCompatible('', 'O-'), false);
  assert.equal(isRbcCompatible('O', 'O-'), false);
  assert.equal(isRbcCompatible('OO-', 'O-'), false);
  assert.equal(parseGroup('a+')?.abo, 'A');
  assert.equal(isBloodGroup('AB-'), true);
  assert.equal(isBloodGroup('AB'), false);
});

test('ABO/Rh: compatible donor groups for a recipient', () => {
  assert.deepEqual(compatibleDonorGroups('O-'), ['O-']);
  assert.deepEqual(compatibleDonorGroups('A+').sort(), ['A+','A-','O+','O-'].sort());
  assert.equal(compatibleDonorGroups('AB+').length, 8);
});

test('state machine: no unit skips a stage', () => {
  assert.equal(canTransition('COLLECTED', 'RELEASED'), false);
  assert.equal(canTransition('COLLECTED', 'IN_TESTING'), true);
  assert.equal(canTransition('RELEASED', 'TRANSFUSED'), false);
  assert.equal(canTransition('IN_TRANSIT', 'DELIVERED_TO_HOSPITAL'), true);
});

test('state machine: terminal states stay terminal', () => {
  assert.deepEqual(allowedTransitions('TRANSFUSED'), ['TRANSFUSED']);
  assert.deepEqual(allowedTransitions('DISPOSED'), ['DISPOSED']);
  assert.equal(canTransition('DISPOSED', 'RELEASED'), false);
});

test('state machine: every status may re-write itself (idempotent)', () => {
  for (const s of UNIT_STATUSES) assert.equal(canTransition(s, s), true, s);
});

test('state machine: unknown statuses are refused', () => {
  assert.equal(isUnitStatus('DONATED'), false);
  assert.equal(canTransition('COLLECTED', 'DONATED'), false);
});

test('telemetry: verdict is a plain comparison', () => {
  assert.equal(isOutOfRange(4, { min: 2, max: 6 }), false);
  assert.equal(isOutOfRange(1.9, { min: 2, max: 6 }), true);
  assert.equal(isOutOfRange(6.1, { min: 2, max: 6 }), true);
});

test('telemetry: excursion summary', () => {
  const r = [{ timestamp: 't', temperatureCelsius: 4 }, { timestamp: 't2', temperatureCelsius: 9.5 }];
  const s = summariseExcursions(r, { min: 2, max: 6 });
  assert.equal(s.compromised, true);
  assert.equal(s.breaches, 1);
  assert.equal(s.worstCelsius, 9.5);
  assert.equal(summariseExcursions([], { min: 2, max: 6 }).compromised, false);
});
