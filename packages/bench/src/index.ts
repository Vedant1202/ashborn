/**
 * @ashborn/bench
 *
 * Replays committed evaluation fixtures through the detectors offline and emits
 * the false-positive scorecard. No network access and no live model calls.
 */

export { normalizeTrace } from './normalize.js';
export type { NormalizedTrace, RawTrace, RawTraceCall, TraceClass } from './normalize.js';
export { rolesForTool } from './tool-roles.js';
