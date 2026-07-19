/**
 * @ashborn/bench
 *
 * Replays committed evaluation fixtures through the detectors offline and emits
 * the false-positive scorecard. No network access and no live model calls.
 */

export { createLedger as createReplaySession } from '@ashborn/core';
