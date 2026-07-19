/**
 * @ashborn/core
 *
 * Runtime security observability for AI agents. This package holds the public
 * contract (event model and findings), the per-session provenance ledger, the
 * detectors, and the OpenTelemetry emitter.
 */

export { createLedger, recordEvent } from './ledger.js';
export { resolveToolRoles } from './roles.js';
export { runDetector } from './guard.js';

export type {
  Detector,
  DetectorError,
  DetectorResult,
  Finding,
  FindingKind,
  NormalizedMessage,
  Provenance,
  ResolvedToolRoles,
  SessionLedger,
  ToolCallEvent,
  ToolRole,
  ToolRoleSource,
  ToolSource,
} from './types.js';
