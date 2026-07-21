import { describe, expect, it } from 'vitest';

import { hashTokens } from './dataflow.js';
import { createLedger, recordEvent } from './ledger.js';
import type { ToolCallEvent } from './types.js';

function toolCallEvent(overrides: Partial<ToolCallEvent> = {}): ToolCallEvent {
  return {
    eventId: 'event-1',
    runId: 'run-1',
    toolName: 'someTool',
    provenance: 'unknown',
    source: 'local-tool',
    startTime: 0,
    ...overrides,
  };
}

describe('session ledger', () => {
  it('starts empty for a run', () => {
    const ledger = createLedger('run-1');

    expect(ledger.runId).toBe('run-1');
    expect(ledger.untrustedEventIds).toEqual([]);
    expect(ledger.privateEventIds).toEqual([]);
    expect(ledger.egressEventIds).toEqual([]);
  });

  it('records the event id that introduced untrusted content', () => {
    const ledger = recordEvent(createLedger('run-1'), toolCallEvent({ eventId: 'fetch-1' }), [
      'untrustedSource',
    ]);

    expect(ledger.untrustedEventIds).toEqual(['fetch-1']);
  });

  it('records private data observations separately from egress', () => {
    let ledger = createLedger('run-1');
    ledger = recordEvent(ledger, toolCallEvent({ eventId: 'inbox-1' }), ['privateData']);
    ledger = recordEvent(ledger, toolCallEvent({ eventId: 'send-1' }), ['egress']);

    expect(ledger.privateEventIds).toEqual(['inbox-1']);
    expect(ledger.egressEventIds).toEqual(['send-1']);
    expect(ledger.untrustedEventIds).toEqual([]);
  });

  it('records a tool carrying several roles under each of them', () => {
    const ledger = recordEvent(createLedger('run-1'), toolCallEvent({ eventId: 'multi-1' }), [
      'untrustedSource',
      'privateData',
    ]);

    expect(ledger.untrustedEventIds).toEqual(['multi-1']);
    expect(ledger.privateEventIds).toEqual(['multi-1']);
  });

  it('preserves observation order across events', () => {
    let ledger = createLedger('run-1');
    ledger = recordEvent(ledger, toolCallEvent({ eventId: 'first' }), ['untrustedSource']);
    ledger = recordEvent(ledger, toolCallEvent({ eventId: 'second' }), ['untrustedSource']);

    expect(ledger.untrustedEventIds).toEqual(['first', 'second']);
  });

  it('does not mutate the previous state', () => {
    const before = createLedger('run-1');
    const after = recordEvent(before, toolCallEvent({ eventId: 'a' }), ['untrustedSource']);

    expect(before.untrustedEventIds).toEqual([]);
    expect(after).not.toBe(before);
  });

  it('ignores events belonging to a different run', () => {
    const ledger = recordEvent(
      createLedger('run-1'),
      toolCallEvent({ eventId: 'stray', runId: 'run-2' }),
      ['untrustedSource'],
    );

    expect(ledger.untrustedEventIds).toEqual([]);
  });

  it('records an event with no roles without changing observations', () => {
    const ledger = recordEvent(createLedger('run-1'), toolCallEvent({ eventId: 'plain' }), []);

    expect(ledger.untrustedEventIds).toEqual([]);
    expect(ledger.privateEventIds).toEqual([]);
    expect(ledger.egressEventIds).toEqual([]);
  });

  it('accumulates read-token hashes across untrusted events, deduping a shared token', () => {
    let ledger = createLedger('run-1');
    ledger = recordEvent(ledger, toolCallEvent({ eventId: 'r1', output: 'spotify premium' }), [
      'untrustedSource',
    ]);
    ledger = recordEvent(ledger, toolCallEvent({ eventId: 'r2', output: 'spotify netflix' }), [
      'untrustedSource',
    ]);

    // 'spotify' is shared, so it is stored once: the union is three tokens, not four.
    expect(ledger.untrustedTokenHashes).toEqual(hashTokens(['spotify', 'premium', 'netflix']));
  });

  it('hashes a source tool from its output and an egress tool from its args', () => {
    let ledger = createLedger('run-1');
    ledger = recordEvent(
      ledger,
      toolCallEvent({
        eventId: 'read',
        args: { query: 'ignored' },
        output: 'account balance twelve',
      }),
      ['privateData'],
    );
    ledger = recordEvent(
      ledger,
      toolCallEvent({
        eventId: 'send',
        args: { body: 'account balance twelve' },
        output: 'delivered',
      }),
      ['egress'],
    );

    // A private read is hashed from what it returned; an egress call from what it was asked to send.
    expect(ledger.privateTokenHashes).toEqual(hashTokens(['account', 'balance', 'twelve']));
    expect(ledger.egressTokenHashes).toEqual(hashTokens(['account', 'balance', 'twelve']));
  });

  it('survives a JSON round trip without loss', () => {
    let ledger = createLedger('run-1');
    ledger = recordEvent(ledger, toolCallEvent({ eventId: 'a' }), ['untrustedSource']);
    ledger = recordEvent(ledger, toolCallEvent({ eventId: 'b' }), ['egress']);

    expect(JSON.parse(JSON.stringify(ledger))).toEqual(ledger);
  });
});
