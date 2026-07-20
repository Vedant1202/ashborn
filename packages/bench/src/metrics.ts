/**
 * Operating-curve metrics for a trace-scoring signal.
 *
 * A signal assigns each labeled trace a score; higher means more suspicious.
 * These functions turn those scores into the curves the scorecard publishes,
 * so a signal's separation is shown as a shape rather than a single number.
 */

/** One trace's score paired with its ground-truth label. */
export interface ScoredLabel {
  score: number;
  positive: boolean;
}

/** A point on the ROC/recall curve at some implicit threshold. */
export interface OperatingPoint {
  /** Fraction of positives caught (true-positive rate). */
  recall: number;
  /** Fraction of negatives wrongly flagged. */
  falsePositiveRate: number;
}

function split(labels: readonly ScoredLabel[]): { positives: number[]; negatives: number[] } {
  const positives: number[] = [];
  const negatives: number[] = [];
  for (const { score, positive } of labels) {
    (positive ? positives : negatives).push(score);
  }
  return { positives, negatives };
}

/**
 * Area under the ROC curve, via the Mann-Whitney U identity: the probability
 * that a random positive outranks a random negative, counting ties as half.
 *
 * Returns NaN when either class is empty, because AUC is undefined without both.
 */
export function aucRoc(labels: readonly ScoredLabel[]): number {
  const { positives, negatives } = split(labels);
  if (positives.length === 0 || negatives.length === 0) {
    return Number.NaN;
  }

  let wins = 0;
  for (const p of positives) {
    for (const n of negatives) {
      if (p > n) {
        wins += 1;
      } else if (p === n) {
        wins += 0.5;
      }
    }
  }
  return wins / (positives.length * negatives.length);
}

/**
 * Highest recall reachable while keeping the false-positive rate at or below a
 * budget. This is the operating point that matters for a precision-first tool:
 * "if I refuse to tolerate more than X% false alarms, how much do I catch?"
 *
 * Thresholds are the distinct scores present. At a given threshold everything
 * scoring at or above it is flagged.
 */
export function recallAtMaxFalsePositiveRate(
  labels: readonly ScoredLabel[],
  maxFalsePositiveRate: number,
): number {
  const { positives, negatives } = split(labels);
  if (positives.length === 0) {
    return 0;
  }

  const thresholds = [...new Set(labels.map((label) => label.score))].sort((a, b) => b - a);
  let bestRecall = 0;
  for (const threshold of thresholds) {
    const falsePositives = negatives.filter((score) => score >= threshold).length;
    const falsePositiveRate = negatives.length === 0 ? 0 : falsePositives / negatives.length;
    if (falsePositiveRate <= maxFalsePositiveRate) {
      const truePositives = positives.filter((score) => score >= threshold).length;
      bestRecall = Math.max(bestRecall, truePositives / positives.length);
    }
  }
  return bestRecall;
}

/**
 * The full recall / false-positive-rate curve, sweeping the threshold from
 * "flag nothing" down through every distinct score. Both series are
 * non-decreasing, running from the origin to full recall.
 */
export function operatingPoints(labels: readonly ScoredLabel[]): OperatingPoint[] {
  const { positives, negatives } = split(labels);
  const thresholds = [...new Set(labels.map((label) => label.score))].sort((a, b) => b - a);

  const points: OperatingPoint[] = [{ recall: 0, falsePositiveRate: 0 }];
  for (const threshold of thresholds) {
    const truePositives = positives.filter((score) => score >= threshold).length;
    const falsePositives = negatives.filter((score) => score >= threshold).length;
    points.push({
      recall: positives.length === 0 ? 0 : truePositives / positives.length,
      falsePositiveRate: negatives.length === 0 ? 0 : falsePositives / negatives.length,
    });
  }
  return points;
}
