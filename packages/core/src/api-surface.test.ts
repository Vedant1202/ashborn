import { describe, expect, it } from 'vitest';

import * as api from './index.js';

/**
 * The runtime exports of @ashborn/core are a versioned public contract.
 * Adding or removing an entry here must be a deliberate act accompanied by a
 * changeset, so this list is written out explicitly rather than snapshotted.
 */
const EXPECTED_RUNTIME_EXPORTS = [
  'annotateUntrustedDataEgress',
  'createDriftBaseline',
  'createLedger',
  'inspectDefinition',
  'pinDefinition',
  'recordEvent',
  'resolveToolRoles',
  'runDetector',
];

describe('public API surface', () => {
  it('exports exactly the documented runtime surface', () => {
    expect(Object.keys(api).sort()).toEqual([...EXPECTED_RUNTIME_EXPORTS].sort());
  });
});
