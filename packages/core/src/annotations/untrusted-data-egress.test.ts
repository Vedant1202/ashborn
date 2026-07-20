import { describe, expect, it } from 'vitest';

import { createLedger, recordEvent } from '../ledger.js';
import type { SessionLedger, ToolCallEvent } from '../types.js';
import { annotateUntrustedDataEgress } from './untrusted-data-egress.js';

function event(overrides: Partial<ToolCallEvent> = {}): ToolCallEvent {
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

/** Builds a session that read untrusted content, read private data, then transmitted. */
function fullTrifectaLedger(): SessionLedger {
  let ledger = createLedger('run-1');
  ledger = recordEvent(
    ledger,
    event({ eventId: 'fetch-1', toolName: 'fetchUrl', output: 'promotional spotify listing' }),
    ['untrustedSource'],
  );
  ledger = recordEvent(
    ledger,
    event({ eventId: 'inbox-1', toolName: 'readInbox', output: 'receipt from spotify premium' }),
    ['privateData'],
  );
  ledger = recordEvent(
    ledger,
    event({
      eventId: 'send-1',
      toolName: 'sendEmail',
      args: { body: 'spotify premium receipt forwarded' },
    }),
    ['egress'],
  );
  return ledger;
}

describe('annotateUntrustedDataEgress', () => {
  it('reports nothing when no untrusted content was read', () => {
    let ledger = createLedger('run-1');
    ledger = recordEvent(ledger, event({ eventId: 'inbox-1', output: 'private' }), ['privateData']);
    ledger = recordEvent(ledger, event({ eventId: 'send-1', args: { body: 'x' } }), ['egress']);

    expect(annotateUntrustedDataEgress(ledger)).toBeNull();
  });

  it('reports nothing when no private data was read', () => {
    let ledger = createLedger('run-1');
    ledger = recordEvent(ledger, event({ eventId: 'fetch-1', output: 'public' }), [
      'untrustedSource',
    ]);
    ledger = recordEvent(ledger, event({ eventId: 'send-1', args: { body: 'x' } }), ['egress']);

    expect(annotateUntrustedDataEgress(ledger)).toBeNull();
  });

  it('reports nothing when nothing was transmitted outward', () => {
    let ledger = createLedger('run-1');
    ledger = recordEvent(ledger, event({ eventId: 'fetch-1', output: 'public' }), [
      'untrustedSource',
    ]);
    ledger = recordEvent(ledger, event({ eventId: 'inbox-1', output: 'private' }), ['privateData']);

    expect(annotateUntrustedDataEgress(ledger)).toBeNull();
  });

  it('reports an annotation once all three legs are observed', () => {
    const annotation = annotateUntrustedDataEgress(fullTrifectaLedger());

    expect(annotation).not.toBeNull();
    expect(annotation?.kind).toBe('untrusted-data-egress');
  });

  it('is not a Finding and carries no confidence to threshold', () => {
    const annotation = annotateUntrustedDataEgress(fullTrifectaLedger());

    expect(annotation).not.toHaveProperty('confidence');
  });

  it('names the events forming each leg so the surface can be inspected', () => {
    const annotation = annotateUntrustedDataEgress(fullTrifectaLedger());

    expect(annotation?.evidence.untrustedEventIds).toEqual(['fetch-1']);
    expect(annotation?.evidence.privateEventIds).toEqual(['inbox-1']);
    expect(annotation?.evidence.egressEventIds).toEqual(['send-1']);
  });

  it('reports observed data-flow strength between zero and one', () => {
    const annotation = annotateUntrustedDataEgress(fullTrifectaLedger());

    expect(annotation?.dataFlowStrength).toBeGreaterThan(0);
    expect(annotation?.dataFlowStrength).toBeLessThanOrEqual(1);
  });

  it('reports zero strength when the transmitted payload shares nothing with what was read', () => {
    let ledger = createLedger('run-1');
    ledger = recordEvent(ledger, event({ eventId: 'fetch-1', output: 'alpha' }), [
      'untrustedSource',
    ]);
    ledger = recordEvent(ledger, event({ eventId: 'inbox-1', output: 'bravo' }), ['privateData']);
    ledger = recordEvent(ledger, event({ eventId: 'send-1', args: { body: 'charlie' } }), [
      'egress',
    ]);

    expect(annotateUntrustedDataEgress(ledger)?.dataFlowStrength).toBe(0);
  });

  it('carries a human-readable reason', () => {
    const annotation = annotateUntrustedDataEgress(fullTrifectaLedger());

    expect(annotation?.reason).toMatch(/untrusted/i);
    expect(annotation?.reason.length).toBeGreaterThan(20);
  });

  it('is deterministic', () => {
    expect(annotateUntrustedDataEgress(fullTrifectaLedger())).toEqual(
      annotateUntrustedDataEgress(fullTrifectaLedger()),
    );
  });
});
