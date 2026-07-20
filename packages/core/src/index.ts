/**
 * @ashborn/core
 *
 * Runtime security observability for AI agents. This package holds the public
 * contract (event model, findings and risk annotations), the per-session
 * provenance ledger, the detectors, and the OpenTelemetry emitter.
 */

export { annotateUntrustedDataEgress } from './annotations/untrusted-data-egress.js';
export {
  createDriftBaseline,
  inspectDefinition,
  pinDefinition,
} from './detectors/tool-definition-drift.js';
export type { DriftBaseline, DriftInspection } from './detectors/tool-definition-drift.js';
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
  RiskAnnotation,
  RiskAnnotationKind,
  SessionLedger,
  ToolCallEvent,
  ToolDefinition,
  ToolRole,
  ToolRoleSource,
  ToolSource,
} from './types.js';
