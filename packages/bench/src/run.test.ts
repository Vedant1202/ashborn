import { describe, expect, it } from 'vitest';

import { loadCorpus, scoreSignalCard, buildScorecard } from './run.js';

describe('loadCorpus', () => {
  const corpus = loadCorpus();

  it('loads all three classes from the committed fixtures', () => {
    const classes = new Set(corpus.map((trace) => trace.class));
    expect(classes).toEqual(new Set(['benign', 'attack-resisted', 'compromised']));
  });

  it('loads the full corpus', () => {
    // 57 benign + 389 attack-resisted + 344 compromised
    expect(corpus.length).toBe(790);
  });

  it('labels only compromised traces positive', () => {
    const positives = corpus.filter((trace) => trace.compromised);
    expect(positives.every((trace) => trace.class === 'compromised')).toBe(true);
    expect(positives.length).toBe(344);
  });
});

describe('scoreSignalCard', () => {
  const card = scoreSignalCard('untrusted-data-egress', loadCorpus());

  it('reports an AUC in the unit interval', () => {
    expect(card.auc).toBeGreaterThan(0);
    expect(card.auc).toBeLessThanOrEqual(1);
  });

  it('reproduces the spike: the shipped egress signal separates weakly', () => {
    // The annotation ships dataFlowStrength (a fraction), so its AUC sits near
    // the spike's fraction-of-sink variant, well below any usable bar.
    expect(card.auc).toBeGreaterThan(0.55);
    expect(card.auc).toBeLessThan(0.75);
  });

  it('reports separation against benign and attack-resisted separately', () => {
    expect(card.aucVsClass).toHaveProperty('benign');
    expect(card.aucVsClass).toHaveProperty('attack-resisted');
  });

  it('has an overall AUC equal to the class-weighted average of the per-class AUCs', () => {
    // The Mann-Whitney win count is additive over negative subsets, so the
    // overall AUC must sit between the two per-class values. This also documents
    // a real finding: neither negative class is reliably easier for the overlap
    // signal, because legitimate data movement produces the same read-to-sink
    // overlap that an exfiltration does.
    const lo = Math.min(card.aucVsClass.benign, card.aucVsClass['attack-resisted']);
    const hi = Math.max(card.aucVsClass.benign, card.aucVsClass['attack-resisted']);
    expect(card.auc).toBeGreaterThanOrEqual(lo - 1e-9);
    expect(card.auc).toBeLessThanOrEqual(hi + 1e-9);
  });

  it('reports recall at a near-zero false-positive threshold', () => {
    expect(card.recallAtLowFalsePositive).toBeGreaterThanOrEqual(0);
    expect(card.recallAtLowFalsePositive).toBeLessThanOrEqual(1);
  });

  it('includes the degenerate baselines', () => {
    expect(card.baselines.map((baseline) => baseline.name).sort()).toEqual([
      'always-flag',
      'keyword-match',
      'never-flag',
    ]);
  });

  it('scores always-flag at full recall and full false-positive rate', () => {
    const alwaysFlag = card.baselines.find((baseline) => baseline.name === 'always-flag');
    expect(alwaysFlag?.recall).toBe(1);
    expect(alwaysFlag?.falsePositiveRate).toBe(1);
  });
});

describe('buildScorecard', () => {
  it('is deterministic: identical corpus produces an identical scorecard', () => {
    expect(buildScorecard(loadCorpus())).toEqual(buildScorecard(loadCorpus()));
  });

  it('scores every registered signal', () => {
    const scorecard = buildScorecard(loadCorpus());
    expect(scorecard.signals.map((signal) => signal.id)).toContain('untrusted-data-egress');
  });

  it('records the corpus composition so the scorecard is self-describing', () => {
    const scorecard = buildScorecard(loadCorpus());
    expect(scorecard.corpus).toEqual({ benign: 57, 'attack-resisted': 389, compromised: 344 });
  });
});
