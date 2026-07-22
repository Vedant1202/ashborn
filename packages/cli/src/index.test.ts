import { describe, expect, it } from 'vitest';

import { run } from './index.js';

const argv = (...args: string[]) => ['node', 'ashborn', ...args];

describe('cli argument handling', () => {
  it('prints the version for --version and -v, and nothing else', () => {
    for (const flag of ['--version', '-v']) {
      const result = run(argv(flag));
      expect(result.code).toBe(0);
      expect(result.stdout.trim()).toMatch(/^\d+\.\d+\.\d+/);
      expect(result.stderr).toBe('');
    }
  });

  it('prints help for --help, -h, and no arguments', () => {
    for (const args of [[], ['--help'], ['-h']]) {
      const result = run(argv(...args));
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('Usage:');
    }
  });

  it('exits non-zero and explains an unknown command on stderr', () => {
    const result = run(argv('frobnicate'));
    expect(result.code).toBe(1);
    expect(result.stderr).toContain('unknown command: frobnicate');
    expect(result.stdout).toBe('');
  });
});
