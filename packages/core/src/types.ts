/**
 * Public contract for @ashborn/core.
 *
 * Every name in this file is part of a versioned public API. Changing a shape
 * or a string-literal value here is a breaking change and requires a changeset.
 */

/** The part a tool plays in a data flow, used to reason about egress risk. */
export type ToolRole = 'untrustedSource' | 'privateData' | 'egress';

/** Whether the content a tool returned can be trusted as instruction-free. */
export type Provenance = 'trusted' | 'untrusted' | 'unknown';

/** Where the tool being called lives. */
export type ToolSource = 'local-tool' | 'mcp-server';

/** A conversation message, normalized across agent frameworks. */
export interface NormalizedMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  toolCallId?: string;
}

/**
 * A single tool invocation, normalized by an adapter.
 *
 * Content fields (`args`, `output`, `messages`) are only populated when the
 * host has explicitly opted into content capture.
 */
export interface ToolCallEvent {
  eventId: string;
  runId: string;
  toolName: string;
  args?: unknown;
  output?: unknown;
  provenance: Provenance;
  messages?: NormalizedMessage[];
  source: ToolSource;
  startTime: number;
  endTime?: number;
}

/** Stable identifiers for what a detector can report. */
export type FindingKind =
  'untrusted-data-egress' | 'tool-output-injection' | 'tool-definition-drift';

/** A graded observation from a detector. Never a boolean verdict. */
export interface Finding {
  kind: FindingKind;
  /** Calibrated, in the range [0, 1]. */
  confidence: number;
  /** Human-readable explanation, safe to show in a log line. */
  reason: string;
  evidence: {
    eventIds: string[];
    detail?: Record<string, unknown>;
  };
}

/** Accumulated per-run state that detectors reason over. Pure and serializable. */
export interface SessionLedger {
  readonly runId: string;
  readonly untrustedEventIds: readonly string[];
  readonly privateEventIds: readonly string[];
  readonly egressEventIds: readonly string[];
}

/**
 * A detector inspects one event against the accumulated session state.
 *
 * Structural detectors must be pure and deterministic. Implementations should
 * not throw, but the guard in `runDetector` treats throwing as a fault rather
 * than trusting that contract.
 */
export interface Detector {
  readonly kind: FindingKind;
  inspect(event: ToolCallEvent, ledger: SessionLedger): Finding | null;
}

/** How a tool's roles were determined. */
export type ToolRoleSource = 'configured' | 'inferred';

/** The outcome of resolving a tool's roles, carrying how much to trust it. */
export interface ResolvedToolRoles {
  roles: ToolRole[];
  source: ToolRoleSource;
  /** 1 for explicit configuration; lower for heuristic inference. */
  confidence: number;
}

/** A detector fault, captured rather than propagated to the host agent. */
export interface DetectorError {
  detector: FindingKind;
  eventId: string;
  message: string;
}

/** The result of running one detector under the fail-safe guard. */
export interface DetectorResult {
  finding: Finding | null;
  error?: DetectorError;
}
