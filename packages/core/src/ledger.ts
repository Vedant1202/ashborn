import { extractTokens, hashTokens } from './dataflow.js';
import type { SessionLedger, ToolCallEvent, ToolRole } from './types.js';

/** Creates the empty ledger for a run. */
export function createLedger(runId: string): SessionLedger {
  return {
    runId,
    untrustedEventIds: [],
    privateEventIds: [],
    egressEventIds: [],
    untrustedTokenHashes: [],
    privateTokenHashes: [],
    egressTokenHashes: [],
  };
}

function append(
  existing: readonly string[],
  eventId: string,
  shouldAppend: boolean,
): readonly string[] {
  return shouldAppend ? [...existing, eventId] : existing;
}

function mergeHashes(
  existing: readonly string[],
  incoming: readonly string[],
  shouldMerge: boolean,
): readonly string[] {
  if (!shouldMerge || incoming.length === 0) {
    return existing;
  }
  const seen = new Set(existing);
  const added = incoming.filter((hash) => !seen.has(hash));
  return added.length === 0 ? existing : [...existing, ...added];
}

/**
 * Folds one tool call into the ledger, returning new state.
 *
 * The ledger records which events introduced untrusted content, read private
 * data, or transmitted outward, plus hashed tokens of what each role carried.
 * It stores identifiers and hashes rather than content, so accumulating session
 * state never becomes a readable copy of the data being protected.
 *
 * A source's tokens come from what it returned; an egress tool's come from what
 * it was asked to send.
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

  const readHashes = hashTokens(extractTokens(event.output));
  const sentHashes = hashTokens(extractTokens(event.args));
  const isUntrusted = roles.includes('untrustedSource');
  const isPrivate = roles.includes('privateData');
  const isEgress = roles.includes('egress');

  return {
    runId: ledger.runId,
    untrustedEventIds: append(ledger.untrustedEventIds, event.eventId, isUntrusted),
    privateEventIds: append(ledger.privateEventIds, event.eventId, isPrivate),
    egressEventIds: append(ledger.egressEventIds, event.eventId, isEgress),
    untrustedTokenHashes: mergeHashes(ledger.untrustedTokenHashes, readHashes, isUntrusted),
    privateTokenHashes: mergeHashes(ledger.privateTokenHashes, readHashes, isPrivate),
    egressTokenHashes: mergeHashes(ledger.egressTokenHashes, sentHashes, isEgress),
  };
}
