import type { Scorecard, SignalCard } from '@ashborn-sec/bench';

function pct(value: number, digits = 1): string {
  return `${(100 * value).toFixed(digits)}%`;
}

function formatTraceSignal(signal: SignalCard): string {
  const lines = [
    `  ${signal.id}`,
    `    AUC ${signal.auc.toFixed(3)}   recall @ <=1% FPR ${pct(signal.recallAtLowFalsePositive)}`,
    `    separation  vs benign ${signal.aucVsClass.benign.toFixed(3)}   vs attack-resisted ${signal.aucVsClass['attack-resisted'].toFixed(3)}`,
    '    baselines:',
    ...signal.baselines.map(
      (baseline) =>
        `      ${baseline.name.padEnd(14)} recall ${pct(baseline.recall, 0).padStart(4)}  FPR ${pct(baseline.falsePositiveRate, 0).padStart(4)}`,
    ),
  ];
  return lines.join('\n');
}

/**
 * Renders a scorecard as plain terminal text.
 *
 * Every measured signal is shown, including the weak one, and the drift card is
 * labeled synthetic so its perfect score is not misread as field performance.
 * The injection result is pointed to rather than reprinted, because the bench
 * does not compute it (the model is gated); the number lives in the spike.
 */
export function formatScorecard(scorecard: Scorecard): string {
  const { benign, 'attack-resisted': attackResisted, compromised } = scorecard.corpus;
  const total = benign + attackResisted + compromised;

  const sections: string[] = [
    'Ashborn — agent-security signal scorecard',
    '',
    `Corpus: ${total} agent traces (${benign} benign, ${attackResisted} attack-resisted, ${compromised} compromised)`,
    '',
    'Signals scored on the agent-trace corpus:',
    ...scorecard.signals.map(formatTraceSignal),
    '',
    `Tool-definition drift (${scorecard.drift.id}, synthetic corpus):`,
    `  change detection ${pct(scorecard.drift.changeDetectionRate, 0)}   false positives on unchanged ${scorecard.drift.falsePositiveOnUnchanged}`,
    `  suspicion AUC ${scorecard.drift.auc.toFixed(3)}  (synthetic: validates the implementation, not coverage of novel attacks)`,
    '',
    'Also measured, documented separately (docs/spikes/injection-classifier-availability.md):',
    '  tool-output-injection   AUC 0.817, no usable operating point; the intended model is gated',
  ];

  return sections.join('\n');
}
