/**
 * The clinical rules, re-exported for app code.
 *
 * Canonical implementation lives in packages/domain (pure, unit-tested, no
 * dependencies). Import from here in app code.
 */
export * from '../../packages/domain/index';
export { isPlasmaCompatible, isRbcCompatible as isRbcCompatibleLegacy, RBC_COMPATIBILITY, PLASMA_COMPATIBILITY } from './bloodCompatibility';
