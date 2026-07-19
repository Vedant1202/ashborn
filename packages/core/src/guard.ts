import type { Detector, DetectorResult, SessionLedger, ToolCallEvent } from './types.js';

/**
 * Runs a detector so that a fault in detection can never break the host agent.
 *
 * A monitoring library that throws into an application's call path is worse
 * than no monitoring at all, so every detector invocation is contained here. A
 * failure degrades to "no finding" and is reported as an internal error for the
 * host to log, rather than propagating.
 */
export function runDetector(
  detector: Detector,
  event: ToolCallEvent,
  ledger: SessionLedger,
): DetectorResult {
  try {
    return { finding: detector.inspect(event, ledger) ?? null };
  } catch (cause) {
    return {
      finding: null,
      error: {
        detector: detector.kind,
        eventId: event.eventId,
        message: cause instanceof Error ? cause.message : String(cause),
      },
    };
  }
}
