/**
 * @bloodchain/domain — the clinical rules.
 *
 * Every function in this package is PURE: same inputs, same outputs, no clock,
 * no network, no storage, no model. This is the layer the build brief requires
 * clinical rules to live in, because a rule that can be tested can be trusted,
 * and a rule that lives in a component cannot.
 *
 * No AI may import into this package. Nothing here may be probabilistic.
 * See docs/CONSTITUTION.md CS-13.
 */

export * from './blood.ts';
export * from './stateMachine.ts';
export * from './telemetry.ts';
export * from './chain.ts';
