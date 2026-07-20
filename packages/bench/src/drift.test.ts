import { describe, expect, it } from 'vitest';

import { loadDriftPairs, scoreDriftCard } from './drift.js';

describe('loadDriftPairs', () => {
  const pairs = loadDriftPairs();

  it('loads both classes from the committed fixtures', () => {
    const classes = new Set(pairs.map((pair) => pair.class));
    expect(classes).toEqual(new Set(['benign-bump', 'adversarial']));
  });

  it('has a balanced corpus', () => {
    expect(pairs.filter((pair) => pair.class === 'adversarial').length).toBeGreaterThanOrEqual(20);
    expect(pairs.filter((pair) => pair.class === 'benign-bump').length).toBeGreaterThanOrEqual(20);
  });
});

describe('scoreDriftCard', () => {
  const card = scoreDriftCard(loadDriftPairs());

  it('detects a change in every pair, since after always differs from before', () => {
    expect(card.changeDetectionRate).toBe(1);
  });

  it('reports zero false positives on unchanged definitions by construction', () => {
    expect(card.falsePositiveOnUnchanged).toBe(0);
  });

  it('separates adversarial drift from benign bumps almost perfectly on synthetic data', () => {
    // near-tautological: adversarial mutations carry the patterns the detector
    // keys on. This checks the implementation, not coverage of novel attacks.
    expect(card.auc).toBeGreaterThan(0.95);
  });

  it('scores benign bumps below any adversarial one, so a threshold cleanly separates them', () => {
    expect(card.maxBenignSuspicion).toBeLessThan(card.minAdversarialSuspicion);
  });

  it('is honest that the corpus is synthetic', () => {
    expect(card.synthetic).toBe(true);
  });

  it('is deterministic', () => {
    expect(scoreDriftCard(loadDriftPairs())).toEqual(scoreDriftCard(loadDriftPairs()));
  });
});
