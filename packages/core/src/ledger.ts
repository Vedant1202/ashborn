import type { SessionLedger, ToolCallEvent, ToolRole } from './types.js';

/** Creates the empty ledger for a run. */
export function createLedger(runId: string): SessionLedger {
  return {
    runId,
    untrustedEventIds: [],
    privateEventIds: [],
    egressEventIds: [],
  };
}

function append(
  existing: readonly string[],
  eventId: string,
  shouldAppend: boolean,
): readonly string[] {
  return shouldAppend ? [...existing, eventId] : existing;
}

/**
 * Folds one tool call into the ledger, returning new state.
 *
 * The ledger records only which events introduced untrusted content, read
 * private data, or transmitted outward. It deliberately stores event
 * identifiers rather than content, so accumulating session state never becomes
 * a copy of the data being protected.
 *
 * Events from another run are ignored so a mis-routed event cannot corrupt a
 * session's provenance history.
 */
export function recordEvent(
  ledger: SessionLedger,
  event: ToolCallEvent,
  roles: readonly ToolRole[],
): SessionLedger {
  if (event.runId !== ledger.runId) {
    return ledger;
  }

  return {
    runId: ledger.runId,
    untrustedEventIds: append(
      ledger.untrustedEventIds,
      event.eventId,
      roles.includes('untrustedSource'),
    ),
    privateEventIds: append(ledger.privateEventIds, event.eventId, roles.includes('privateData')),
    egressEventIds: append(ledger.egressEventIds, event.eventId, roles.includes('egress')),
  };
}
