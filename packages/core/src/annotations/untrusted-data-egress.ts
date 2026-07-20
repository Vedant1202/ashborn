import { overlapStrength } from '../dataflow.js';
import type { RiskAnnotation, SessionLedger } from '../types.js';

/**
 * Reports that a session opened the untrusted-data-egress risk surface: it read
 * content the user did not author, read the user's own data, and transmitted
 * outward.
 *
 * This returns a `RiskAnnotation` rather than a `Finding` on purpose. Measured
 * against 790 labeled traces the signal reached AUC 0.712, detecting 6.1% of
 * attacks at a near-zero false-positive threshold, because ordinary agent work
 * satisfies all three legs: paying a bill reads an untrusted document, touches
 * account data and sends money. The surface being open is worth showing a
 * reader. It is not worth waking one up. Full measurement and threats to
 * validity: docs/spikes/egress-detector-separation.md.
 */
export function annotateUntrustedDataEgress(ledger: SessionLedger): RiskAnnotation | null {
  const { untrustedEventIds, privateEventIds, egressEventIds } = ledger;

  if (
    untrustedEventIds.length === 0 ||
    privateEventIds.length === 0 ||
    egressEventIds.length === 0
  ) {
    return null;
  }

  const readHashes = [...ledger.untrustedTokenHashes, ...ledger.privateTokenHashes];
  const dataFlowStrength = overlapStrength(readHashes, ledger.egressTokenHashes);

  return {
    kind: 'untrusted-data-egress',
    reason:
      'session read untrusted content, read private data, and transmitted outward; ' +
      'this describes a risk surface, not an attack',
    dataFlowStrength,
    evidence: {
      untrustedEventIds: [...untrustedEventIds],
      privateEventIds: [...privateEventIds],
      egressEventIds: [...egressEventIds],
    },
  };
}
