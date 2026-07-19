import { describe, expect, it } from 'vitest';

import { PACKAGE_NAME } from './index.js';

describe('@ashborn/core toolchain smoke test', () => {
  it('exports its package identifier', () => {
    expect(PACKAGE_NAME).toBe('@ashborn/core');
  });
});
