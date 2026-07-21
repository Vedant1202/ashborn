import { describe, expect, it } from 'vitest';

import type { Scorecard } from '@ashborn-sec/bench';

import { formatScorecard } from './format.js';

const scorecard: Scorecard = {
  corpus: { benign: 57, 'attack-resisted': 389, compromised: 344 },
  signals: [
    {
      id: 'untrusted-data-egress',
      name: 'Untrusted-data egress (risk annotation)',
      auc: 0.6031,
      recallAtLowFalsePositive: 0,
      aucVsClass: { benign: 0.6004, 'attack-resisted': 0.6035 },
      operatingPoints: [{ recall: 0, falsePositiveRate: 0 }],
      baselines: [
        { name: 'always-flag', recall: 1, falsePositiveRate: 1 },
        { name: 'never-flag', recall: 0, falsePositiveRate: 0 },
        { name: 'keyword-match', recall: 1, falsePositiveRate: 0.87 },
      ],
    },
  ],
  drift: {
    id: 'tool-definition-drift',
    name: 'Tool-definition drift',
    synthetic: true,
    changeDetectionRate: 1,
    falsePositiveOnUnchanged: 0,
    auc: 1,
    maxBenignSuspicion: 0,
    minAdversarialSuspicion: 0.4,
    operatingPoints: [{ recall: 0, falsePositiveRate: 0 }],
  },
};

describe('formatScorecard', () => {
  const text = formatScorecard(scorecard);

  it('states the corpus composition', () => {
    expect(text).toContain('790');
    expect(text).toContain('57');
    expect(text).toContain('389');
    expect(text).toContain('344');
  });

  it('shows each trace signal with its AUC', () => {
    expect(text).toContain('untrusted-data-egress');
    expect(text).toContain('0.603');
  });

  it('shows recall at the near-zero false-positive operating point', () => {
    expect(text).toMatch(/recall.*0\.0%/i);
  });

  it('shows the per-negative-class separation', () => {
    expect(text).toContain('0.600');
    expect(text).toContain('0.604');
  });

  it('shows the degenerate baselines', () => {
    expect(text).toContain('always-flag');
    expect(text).toContain('keyword-match');
  });

  it('presents drift with its by-construction facts', () => {
    expect(text).toContain('tool-definition-drift');
    expect(text).toMatch(/change detection.*100/i);
    expect(text).toMatch(/unchanged.*0/i);
  });

  it('marks the drift corpus as synthetic so the perfect score is not misread', () => {
    expect(text.toLowerCase()).toContain('synthetic');
  });

  it('points to the documented injection result rather than implying it was computed here', () => {
    expect(text).toMatch(/tool-output-injection/);
    expect(text).toMatch(/spike|documented|docs\//i);
  });
});
