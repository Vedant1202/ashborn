import { describe, expect, it } from 'vitest';

import { aucRoc, operatingPoints, recallAtMaxFalsePositiveRate } from './metrics.js';
import type { ScoredLabel } from './metrics.js';

/** A perfectly separable set: every positive scores above every negative. */
const SEPARABLE: ScoredLabel[] = [
  { score: 0.9, positive: true },
  { score: 0.8, positive: true },
  { score: 0.2, positive: false },
  { score: 0.1, positive: false },
];

/** Positives and negatives interleaved, so ranking is only half right. */
const INTERLEAVED: ScoredLabel[] = [
  { score: 0.9, positive: true },
  { score: 0.7, positive: false },
  { score: 0.5, positive: true },
  { score: 0.3, positive: false },
];

describe('aucRoc', () => {
  it('is 1 for a perfectly separable set', () => {
    expect(aucRoc(SEPARABLE)).toBe(1);
  });

  it('is 0 when every negative outranks every positive', () => {
    const inverted: ScoredLabel[] = [
      { score: 0.9, positive: false },
      { score: 0.1, positive: true },
    ];

    expect(aucRoc(inverted)).toBe(0);
  });

  it('counts a tie between a positive and a negative as half a win', () => {
    const tied: ScoredLabel[] = [
      { score: 0.5, positive: true },
      { score: 0.5, positive: false },
    ];

    expect(aucRoc(tied)).toBe(0.5);
  });

  it('computes the Mann-Whitney value for a hand-checked interleaved set', () => {
    // pos {0.9, 0.5} vs neg {0.7, 0.3}: 0.9 beats both, 0.5 beats 0.3 only -> 3/4
    expect(aucRoc(INTERLEAVED)).toBe(0.75);
  });

  it('is not a number when a class is empty, since AUC is undefined there', () => {
    expect(aucRoc([{ score: 0.5, positive: true }])).toBeNaN();
  });
});

describe('recallAtMaxFalsePositiveRate', () => {
  it('recovers full recall on a separable set at zero tolerated false positives', () => {
    expect(recallAtMaxFalsePositiveRate(SEPARABLE, 0)).toBe(1);
  });

  it('reports the recall reachable without exceeding the false-positive budget', () => {
    // to admit zero negatives the threshold must sit above 0.7, catching only 0.9 -> 1/2
    expect(recallAtMaxFalsePositiveRate(INTERLEAVED, 0)).toBe(0.5);
  });

  it('allows more recall as the false-positive budget grows', () => {
    // tolerating one of two negatives (0.5) lets the threshold drop to 0.5, catching both positives
    expect(recallAtMaxFalsePositiveRate(INTERLEAVED, 0.5)).toBe(1);
  });

  it('is zero when even the highest-scoring item is a negative', () => {
    const negativeOnTop: ScoredLabel[] = [
      { score: 0.9, positive: false },
      { score: 0.4, positive: true },
    ];

    expect(recallAtMaxFalsePositiveRate(negativeOnTop, 0)).toBe(0);
  });
});

describe('operatingPoints', () => {
  it('produces a monotonic non-decreasing false-positive rate as recall rises', () => {
    const points = operatingPoints(INTERLEAVED);
    const fprs = points.map((point) => point.falsePositiveRate);

    expect(fprs).toEqual([...fprs].sort((a, b) => a - b));
  });

  it('starts at the origin and ends at full recall', () => {
    const points = operatingPoints(SEPARABLE);

    expect(points[0]).toMatchObject({ recall: 0, falsePositiveRate: 0 });
    expect(points.at(-1)).toMatchObject({ recall: 1, falsePositiveRate: 1 });
  });

  it('is deterministic', () => {
    expect(operatingPoints(INTERLEAVED)).toEqual(operatingPoints(INTERLEAVED));
  });
});
