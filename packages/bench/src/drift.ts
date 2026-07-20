import { readFileSync } from 'node:fs';

import { createDriftBaseline, inspectDefinition, type ToolDefinition } from '@ashborn/core';

import { aucRoc, operatingPoints } from './metrics.js';
import type { OperatingPoint, ScoredLabel } from './metrics.js';

const PAIRS_URL = new URL('../../../fixtures/drift/pairs.json', import.meta.url);

export type DriftClass = 'benign-bump' | 'adversarial';

/** A committed (before, after) definition pair with its label. */
export interface DriftPair {
  id: string;
  class: DriftClass;
  before: ToolDefinition;
  after: ToolDefinition;
}

/**
 * The drift detector's measured separation.
 *
 * `changeDetectionRate` and `falsePositiveOnUnchanged` capture the part that is
 * true by construction: every real change is detected, and an unchanged
 * definition never is. `auc` captures the suspicion score's separation on the
 * synthetic corpus, flagged `synthetic` so the number is not mistaken for
 * coverage of attacks nobody has catalogued.
 */
export interface DriftCard {
  id: 'tool-definition-drift';
  name: string;
  synthetic: true;
  changeDetectionRate: number;
  falsePositiveOnUnchanged: number;
  auc: number;
  maxBenignSuspicion: number;
  minAdversarialSuspicion: number;
  operatingPoints: OperatingPoint[];
}

/** Loads the committed drift pairs. */
export function loadDriftPairs(): DriftPair[] {
  return JSON.parse(readFileSync(PAIRS_URL, 'utf8')) as DriftPair[];
}

/** Runs one pair: pin the before, inspect the after, return the suspicion (or null if no change). */
function suspicionFor(pair: DriftPair): number | null {
  const baseline = inspectDefinition(createDriftBaseline(), pair.before).baseline;
  const finding = inspectDefinition(baseline, pair.after).finding;
  return finding === null ? null : finding.confidence;
}

/** Measures the drift detector against the committed pairs. */
export function scoreDriftCard(pairs: readonly DriftPair[]): DriftCard {
  const suspicions = pairs.map((pair) => ({ pair, suspicion: suspicionFor(pair) }));

  const changesDetected = suspicions.filter((entry) => entry.suspicion !== null).length;
  const changeDetectionRate = pairs.length === 0 ? 0 : changesDetected / pairs.length;

  // Unchanged: inspecting a definition against itself must never report.
  const falsePositiveOnUnchanged = pairs.some((pair) => {
    const baseline = inspectDefinition(createDriftBaseline(), pair.before).baseline;
    return inspectDefinition(baseline, pair.before).finding !== null;
  })
    ? 1
    : 0;

  const labels: ScoredLabel[] = suspicions.map((entry) => ({
    score: entry.suspicion ?? 0,
    positive: entry.pair.class === 'adversarial',
  }));

  const benign = suspicions
    .filter((entry) => entry.pair.class === 'benign-bump')
    .map((entry) => entry.suspicion ?? 0);
  const adversarial = suspicions
    .filter((entry) => entry.pair.class === 'adversarial')
    .map((entry) => entry.suspicion ?? 0);

  return {
    id: 'tool-definition-drift',
    name: 'Tool-definition drift',
    synthetic: true,
    changeDetectionRate,
    falsePositiveOnUnchanged,
    auc: aucRoc(labels),
    maxBenignSuspicion: benign.length === 0 ? 0 : Math.max(...benign),
    minAdversarialSuspicion: adversarial.length === 0 ? 0 : Math.min(...adversarial),
    operatingPoints: operatingPoints(labels),
  };
}
