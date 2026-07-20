import {
  annotateUntrustedDataEgress,
  createLedger,
  recordEvent,
  type SessionLedger,
} from '@ashborn/core';

import type { NormalizedTrace, TraceClass } from './normalize.js';
import { rolesForTool } from './tool-roles.js';

/**
 * A candidate detector, expressed as a function that scores a whole trace.
 *
 * The bench benchmarks signals as the product actually computes them, not as a
 * more flattering variant. Higher means more suspicious.
 */
export interface Signal {
  id: string;
  name: string;
  score(trace: NormalizedTrace): number;
}

/** A trace's score paired with its ground-truth label and class. */
export interface ScoredTrace {
  traceId: string;
  class: TraceClass;
  positive: boolean;
  score: number;
}

/** Replays a normalized trace back through the per-session ledger. */
function replayLedger(trace: NormalizedTrace): SessionLedger {
  let ledger = createLedger(trace.traceId);
  for (const event of trace.events) {
    ledger = recordEvent(ledger, event, rolesForTool(trace.suite, event.toolName));
  }
  return ledger;
}

/**
 * Scores the untrusted-data-egress annotation as shipped.
 *
 * The score is the annotation's own `dataFlowStrength` when the risk surface
 * opened, and zero when it did not. This measures the exact quantity the
 * product reports, so the published curve describes what a user would actually
 * get rather than a better-looking candidate metric.
 */
const untrustedDataEgress: Signal = {
  id: 'untrusted-data-egress',
  name: 'Untrusted-data egress (risk annotation)',
  score(trace) {
    const annotation = annotateUntrustedDataEgress(replayLedger(trace));
    return annotation?.dataFlowStrength ?? 0;
  },
};

/** Signals the bench scores. Drift joins here in T6. */
export const SIGNALS: readonly Signal[] = [untrustedDataEgress];

/** Scores every trace in a corpus with one signal, attaching ground-truth labels. */
export function scoreCorpus(signal: Signal, traces: readonly NormalizedTrace[]): ScoredTrace[] {
  return traces.map((trace) => ({
    traceId: trace.traceId,
    class: trace.class,
    positive: trace.compromised,
    score: signal.score(trace),
  }));
}
