import type { Provenance, ToolCallEvent } from '@ashborn-sec/core';

import { rolesForTool } from './tool-roles.js';

/** The three generated classes; see docs/spikes/agentdojo-fixture-feasibility.md. */
export type TraceClass = 'benign' | 'attack-resisted' | 'compromised';

/** One executed call as written by scripts/gen-fixtures/generate.py. */
export interface RawTraceCall {
  index: number;
  tool: string;
  args: Record<string, unknown>;
  output: string | null;
  outputTruncated: boolean;
  error: string | null;
}

/** A generated trace as committed under fixtures/traces. */
export interface RawTrace {
  traceId: string;
  suite: string;
  userTaskId: string;
  injectionTaskId: string | null;
  class: TraceClass;
  compromised: boolean;
  labelSource: string;
  calls: RawTraceCall[];
}

/** A trace expressed in the public event model, ready to replay through detectors. */
export interface NormalizedTrace {
  traceId: string;
  suite: string;
  class: TraceClass;
  compromised: boolean;
  events: ToolCallEvent[];
}

/**
 * Whether a tool's output can be trusted as instruction-free.
 *
 * A tool that reads third-party content yields untrusted output. A mapped tool
 * that does not is trusted. An unmapped tool is explicitly unknown, so a gap in
 * the role map never masquerades as a safety judgement.
 */
function provenanceFor(suite: string, toolName: string): Provenance {
  const roles = rolesForTool(suite, toolName);
  if (roles.length === 0) {
    return 'unknown';
  }
  return roles.includes('untrustedSource') ? 'untrusted' : 'trusted';
}

/**
 * Converts a generated trace into ordered `ToolCallEvent`s.
 *
 * `startTime` carries the call's ordinal rather than a wall clock. Replayed
 * fixtures have no real timing, and inventing one would break the determinism
 * the evaluation depends on.
 */
export function normalizeTrace(raw: RawTrace): NormalizedTrace {
  const events: ToolCallEvent[] = raw.calls.map((call) => ({
    eventId: `${raw.traceId}#${call.index}`,
    runId: raw.traceId,
    toolName: call.tool,
    args: call.args,
    output: call.output ?? undefined,
    provenance: provenanceFor(raw.suite, call.tool),
    source: 'local-tool',
    startTime: call.index,
  }));

  return {
    traceId: raw.traceId,
    suite: raw.suite,
    class: raw.class,
    compromised: raw.compromised,
    events,
  };
}
