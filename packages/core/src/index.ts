/**
 * @ashborn/core
 *
 * The offline contract behind the Ashborn benchmark: the tool-call event model,
 * findings and risk annotations, the per-session provenance ledger, the
 * tool-definition-drift detector, and the untrusted-data-egress risk annotation.
 */

export { annotateUntrustedDataEgress } from './annotations/untrusted-data-egress.js';
export {
  createDriftBaseline,
  inspectDefinition,
  pinDefinition,
} from './detectors/tool-definition-drift.js';
export type { DriftBaseline, DriftInspection } from './detectors/tool-definition-drift.js';
export { createLedger, recordEvent } from './ledger.js';

export type {
  Finding,
  FindingKind,
  Provenance,
  RiskAnnotation,
  RiskAnnotationKind,
  SessionLedger,
  ToolCallEvent,
  ToolDefinition,
  ToolRole,
  ToolSource,
} from './types.js';
