/**
 * @ashborn/bench
 *
 * Replays the committed evaluation corpus through candidate detectors offline
 * and emits their operating curves. No network access and no live model calls.
 */

export { aucRoc, operatingPoints, recallAtMaxFalsePositiveRate } from './metrics.js';
export type { OperatingPoint, ScoredLabel } from './metrics.js';
export { normalizeTrace } from './normalize.js';
export type { NormalizedTrace, RawTrace, RawTraceCall, TraceClass } from './normalize.js';
export { buildScorecard, loadCorpus, scoreSignalCard } from './run.js';
export type { Scorecard, SignalCard } from './run.js';
export { SIGNALS, scoreCorpus } from './signals.js';
export type { ScoredTrace, Signal } from './signals.js';
export { rolesForTool } from './tool-roles.js';
