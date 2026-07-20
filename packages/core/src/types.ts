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

/**
 * A tool's advertised definition, as an agent or MCP server presents it.
 *
 * Unlike tool call content, a definition is authored by the developer or server
 * rather than the user, so it is retained in full for comparison rather than
 * hashed for redaction.
 */
export interface ToolDefinition {
  name: string;
  description?: string;
  schema?: unknown;
}

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

/**
 * Signals precise enough to alert on.
 *
 * `untrusted-data-egress` is deliberately absent. It was measured at AUC 0.712
 * with 6.1% recall at a near-zero false-positive threshold, because legitimate
 * agent work satisfies the trifecta by design, so it is reported as a
 * `RiskAnnotation` instead. See docs/spikes/egress-detector-separation.md.
 */
export type FindingKind = 'tool-output-injection' | 'tool-definition-drift';

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

/** Posture context describing a risk surface. Never an alert. */
export type RiskAnnotationKind = 'untrusted-data-egress';

/**
 * An observation that a session opened a risk surface.
 *
 * This is a separate type from `Finding` rather than a severity flag on one,
 * and it carries no `confidence`. There is deliberately nothing here to
 * threshold: the trifecta is satisfied by ordinary agent work, so treating its
 * presence as an alert produces noise. The type makes that mistake impossible
 * rather than warning against it in prose.
 */
export interface RiskAnnotation {
  kind: RiskAnnotationKind;
  /** Human-readable, safe to show in a log line. */
  reason: string;
  /**
   * Fraction of the transmitted payload that had been read earlier in the
   * session. An observation reported for context, not a calibrated probability
   * and not a basis for alerting.
   */
  dataFlowStrength: number;
  evidence: {
    untrustedEventIds: string[];
    privateEventIds: string[];
    egressEventIds: string[];
  };
}

/** Accumulated per-run state that detectors reason over. Pure and serializable. */
export interface SessionLedger {
  readonly runId: string;
  readonly untrustedEventIds: readonly string[];
  readonly privateEventIds: readonly string[];
  readonly egressEventIds: readonly string[];
  /**
   * Hashed tokens observed in each role's content, used to measure how much of
   * a transmitted payload had been read earlier.
   *
   * Hashes are stored rather than text so a ledger dump does not read as user
   * content. This is a reduction in incidental exposure, not a privacy
   * guarantee: short tokens remain recoverable by dictionary search.
   */
  readonly untrustedTokenHashes: readonly string[];
  readonly privateTokenHashes: readonly string[];
  readonly egressTokenHashes: readonly string[];
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
