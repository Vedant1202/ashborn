import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { normalizeTrace } from './normalize.js';
import type { RawTrace } from './normalize.js';

function rawTrace(overrides: Partial<RawTrace> = {}): RawTrace {
  return {
    traceId: 'banking__user_task_0__injection_task_0__compromised',
    suite: 'banking',
    userTaskId: 'user_task_0',
    injectionTaskId: 'injection_task_0',
    class: 'compromised',
    compromised: true,
    labelSource: 'injection_task.security',
    calls: [
      {
        index: 0,
        tool: 'read_file',
        args: { file_path: 'bill.txt' },
        output: 'Bill for December',
        outputTruncated: false,
        error: null,
      },
      {
        index: 1,
        tool: 'send_money',
        args: { recipient: 'US1330', amount: 0.01 },
        output: '{"message": "sent"}',
        outputTruncated: false,
        error: null,
      },
    ],
    ...overrides,
  };
}

describe('normalizeTrace', () => {
  it('produces one event per call, in order', () => {
    const trace = normalizeTrace(rawTrace());

    expect(trace.events).toHaveLength(2);
    expect(trace.events.map((event) => event.toolName)).toEqual(['read_file', 'send_money']);
  });

  it('derives stable event ids from the trace id and call index', () => {
    const trace = normalizeTrace(rawTrace());

    expect(trace.events[0]?.eventId).toBe('banking__user_task_0__injection_task_0__compromised#0');
    expect(trace.events[1]?.eventId).toBe('banking__user_task_0__injection_task_0__compromised#1');
  });

  it('uses the trace id as the run id so a session correlates', () => {
    const trace = normalizeTrace(rawTrace());

    expect(new Set(trace.events.map((event) => event.runId))).toEqual(
      new Set(['banking__user_task_0__injection_task_0__compromised']),
    );
  });

  it('marks output from an untrusted-source tool as untrusted', () => {
    const trace = normalizeTrace(rawTrace());

    expect(trace.events[0]?.provenance).toBe('untrusted');
  });

  it('marks output from a mapped non-source tool as trusted', () => {
    const trace = normalizeTrace(rawTrace());

    expect(trace.events[1]?.provenance).toBe('trusted');
  });

  it('marks output from an unmapped tool as unknown rather than guessing', () => {
    const trace = normalizeTrace(
      rawTrace({
        calls: [
          {
            index: 0,
            tool: 'mystery_tool',
            args: {},
            output: 'something',
            outputTruncated: false,
            error: null,
          },
        ],
      }),
    );

    expect(trace.events[0]?.provenance).toBe('unknown');
  });

  it('orders events by a monotonic ordinal rather than a wall clock', () => {
    const trace = normalizeTrace(rawTrace());
    const times = trace.events.map((event) => event.startTime);

    expect(times).toEqual([...times].sort((a, b) => a - b));
    expect(new Set(times).size).toBe(times.length);
  });

  it('carries the ground-truth label through', () => {
    const trace = normalizeTrace(rawTrace());

    expect(trace.compromised).toBe(true);
    expect(trace.class).toBe('compromised');
    expect(trace.suite).toBe('banking');
  });

  it('preserves a null tool output as undefined rather than the string "null"', () => {
    const trace = normalizeTrace(
      rawTrace({
        calls: [
          {
            index: 0,
            tool: 'read_file',
            args: {},
            output: null,
            outputTruncated: false,
            error: null,
          },
        ],
      }),
    );

    expect(trace.events[0]?.output).toBeUndefined();
  });
});

describe('normalizeTrace against a committed fixture (golden)', () => {
  const fixtureUrl = new URL('../../../fixtures/traces/banking/compromised.json', import.meta.url);
  const fixtures = JSON.parse(readFileSync(fixtureUrl, 'utf8')) as RawTrace[];

  it('normalizes the first committed compromised banking trace', () => {
    const first = fixtures[0];
    expect(first).toBeDefined();

    const trace = normalizeTrace(first as RawTrace);

    expect(trace.traceId).toBe('banking__user_task_0__injection_task_0__compromised');
    expect(trace.compromised).toBe(true);
    // poisoned read, the user's legitimate transfer, then the attacker's transfer
    expect(trace.events.map((event) => event.toolName)).toEqual([
      'read_file',
      'send_money',
      'send_money',
    ]);
    expect(trace.events[0]?.provenance).toBe('untrusted');
    expect(trace.events[2]?.output).toContain('US133000000121212121212');
  });

  it('normalizes every committed compromised banking trace without throwing', () => {
    for (const fixture of fixtures) {
      const trace = normalizeTrace(fixture);
      expect(trace.events.length).toBeGreaterThan(0);
      expect(trace.compromised).toBe(true);
    }
  });
});
