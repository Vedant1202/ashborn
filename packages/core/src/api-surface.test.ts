import { describe, expect, expectTypeOf, it } from 'vitest';

import * as api from './index.js';
import type {
  DriftBaseline,
  DriftInspection,
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
} from './index.js';

/**
 * The runtime exports of @ashborn/core are a versioned public contract.
 * Adding or removing an entry here must be a deliberate act, so this list is
 * written out explicitly rather than snapshotted.
 */
const EXPECTED_RUNTIME_EXPORTS = [
  'annotateUntrustedDataEgress',
  'createDriftBaseline',
  'createLedger',
  'inspectDefinition',
  'pinDefinition',
  'recordEvent',
];

describe('public API surface', () => {
  it('exports exactly the documented runtime surface', () => {
    expect(Object.keys(api).sort()).toEqual([...EXPECTED_RUNTIME_EXPORTS].sort());
  });

  // The exported types are as much a versioned contract as the runtime exports,
  // but `Object.keys` cannot see them. These assertions are erased at runtime;
  // `pnpm typecheck` compiles this file, so a renamed type or a changed field
  // shape fails typecheck even though the test body is a no-op.
  it('pins the exported type shapes', () => {
    expectTypeOf<FindingKind>().toEqualTypeOf<'tool-output-injection' | 'tool-definition-drift'>();
    expectTypeOf<RiskAnnotationKind>().toEqualTypeOf<'untrusted-data-egress'>();
    expectTypeOf<Provenance>().toEqualTypeOf<'trusted' | 'untrusted' | 'unknown'>();
    expectTypeOf<ToolRole>().toEqualTypeOf<'untrustedSource' | 'privateData' | 'egress'>();
    expectTypeOf<ToolSource>().toEqualTypeOf<'local-tool' | 'mcp-server'>();

    expectTypeOf<Finding>().toEqualTypeOf<{
      kind: FindingKind;
      confidence: number;
      reason: string;
      evidence: { eventIds: string[]; detail?: Record<string, unknown> };
    }>();
    expectTypeOf<ToolDefinition>().toEqualTypeOf<{
      name: string;
      description?: string;
      schema?: unknown;
    }>();
    expectTypeOf<RiskAnnotation>().toEqualTypeOf<{
      kind: RiskAnnotationKind;
      reason: string;
      dataFlowStrength: number;
      evidence: {
        untrustedEventIds: string[];
        privateEventIds: string[];
        egressEventIds: string[];
      };
    }>();

    // Larger structural types: pin the load-bearing fields without re-listing every member.
    expectTypeOf<SessionLedger>().toHaveProperty('untrustedTokenHashes');
    expectTypeOf<SessionLedger>().toHaveProperty('egressTokenHashes');
    expectTypeOf<ToolCallEvent>().toHaveProperty('provenance');
    expectTypeOf<DriftBaseline>().toHaveProperty('pinned');
    expectTypeOf<DriftInspection>().toHaveProperty('finding');

    expect(true).toBe(true); // runtime no-op; the enforcement above is at typecheck
  });
});
