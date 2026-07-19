/**
 * @ashborn/bench
 *
 * Replays committed evaluation fixtures through the detectors offline and emits
 * the false-positive scorecard. No network access and no live model calls.
 */

import { PACKAGE_NAME as CORE_PACKAGE_NAME } from '@ashborn/core';

/** Proves workspace resolution; replaced by the replay engine in a later task. */
export const CORE_DEPENDENCY = CORE_PACKAGE_NAME;
