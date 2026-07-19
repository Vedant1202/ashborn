import { describe, expect, it } from 'vitest';

import { runDetector } from './guard.js';
import { createLedger } from './ledger.js';
import type { Detector, Finding, ToolCallEvent } from './types.js';

const event: ToolCallEvent = {
  eventId: 'event-1',
  runId: 'run-1',
  toolName: 'sendEmail',
  provenance: 'untrusted',
  source: 'local-tool',
  startTime: 0,
};

const finding: Finding = {
  kind: 'tool-output-injection',
  confidence: 0.9,
  reason: 'instruction-shaped text in an untrusted tool output',
  evidence: { eventIds: ['event-1'] },
};

const workingDetector: Detector = {
  kind: 'tool-output-injection',
  inspect: () => finding,
};

const silentDetector: Detector = {
  kind: 'tool-output-injection',
  inspect: () => null,
};

const throwingDetector: Detector = {
  kind: 'tool-output-injection',
  inspect: () => {
    throw new Error('detector exploded');
  },
};

const nonErrorThrowingDetector: Detector = {
  kind: 'untrusted-data-egress',
  inspect: () => {
    throw 'a bare string';
  },
};

describe('runDetector fail-safe guard', () => {
  it('returns the finding when the detector succeeds', () => {
    const result = runDetector(workingDetector, event, createLedger('run-1'));

    expect(result.finding).toEqual(finding);
    expect(result.error).toBeUndefined();
  });

  it('returns no finding when the detector reports nothing', () => {
    const result = runDetector(silentDetector, event, createLedger('run-1'));

    expect(result.finding).toBeNull();
    expect(result.error).toBeUndefined();
  });

  it('never propagates an exception to the caller', () => {
    expect(() => runDetector(throwingDetector, event, createLedger('run-1'))).not.toThrow();
  });

  it('captures the failure as an internal error and yields no finding', () => {
    const result = runDetector(throwingDetector, event, createLedger('run-1'));

    expect(result.finding).toBeNull();
    expect(result.error).toBeDefined();
    expect(result.error?.detector).toBe('tool-output-injection');
    expect(result.error?.eventId).toBe('event-1');
    expect(result.error?.message).toContain('detector exploded');
  });

  it('captures throws that are not Error instances', () => {
    const result = runDetector(nonErrorThrowingDetector, event, createLedger('run-1'));

    expect(result.finding).toBeNull();
    expect(result.error?.message).toContain('a bare string');
  });
});
