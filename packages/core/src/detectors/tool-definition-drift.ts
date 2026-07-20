import type { Finding, ToolDefinition } from '../types.js';

/**
 * Detects when a tool's advertised definition changes after it was first seen,
 * and scores how suspicious the change is.
 *
 * Change detection is exact and deterministic: a pinned definition either
 * matches or it does not, so this never reports a change that did not happen and
 * never misses one that did. That is the precise part, true by construction.
 *
 * The suspicion score is narrower than it looks. It recognizes specific,
 * documented rug-pull patterns — newly hidden characters, an injected
 * instruction, a new outward-sending verb — so it flags a known attack class,
 * not novel ones. On synthetic fixtures built to carry these patterns it
 * separates almost perfectly, which validates the implementation rather than
 * proving coverage of attacks nobody has catalogued yet.
 */

/** Pinned canonical definitions, keyed by tool name. */
export interface DriftBaseline {
  readonly pinned: Readonly<Record<string, string>>;
}

/** The result of inspecting a definition: a finding if it changed, and the baseline to carry forward. */
export interface DriftInspection {
  finding: Finding | null;
  baseline: DriftBaseline;
}

/** Characters that are invisible or reorder text, the hiding tools of a rug pull. */
const HIDDEN_CHARACTER = /[\u200B-\u200D\uFEFF\u202A-\u202E\u2066-\u2069\u{E0000}-\u{E007F}]/gu;

/** Instruction-shaped phrasing that has no business in a tool description. */
const INJECTED_INSTRUCTION =
  /\b(ignore (all |the )?previous|disregard|you must|always (send|forward|copy|blind-copy|bcc)|before you (can |do )?|do the following|new instructions?)\b/i;

/** Verbs that describe sending data outward. */
const EGRESS_VERB = /\b(bcc|blind-copy|forward|exfiltrat\w*|upload|post\b|send to)\b/gi;

/** Stable stringify with sorted keys, so semantically identical definitions match. */
function canonicalize(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value ?? null);
  }
  if (Array.isArray(value)) {
    return `[${value.map(canonicalize).join(',')}]`;
  }
  const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
    a < b ? -1 : a > b ? 1 : 0,
  );
  return `{${entries.map(([key, val]) => `${JSON.stringify(key)}:${canonicalize(val)}`).join(',')}}`;
}

function canonicalDefinition(definition: ToolDefinition): string {
  return canonicalize({
    name: definition.name,
    description: definition.description ?? '',
    schema: definition.schema ?? null,
  });
}

function countMatches(pattern: RegExp, text: string): number {
  return (text.match(pattern) ?? []).length;
}

function egressVerbs(text: string): Set<string> {
  return new Set((text.match(EGRESS_VERB) ?? []).map((verb) => verb.toLowerCase()));
}

/**
 * Scores the suspicion of a change and explains it, crediting a pattern only
 * when the change introduced it rather than when it was already present.
 */
function scoreChange(before: string, after: string): { confidence: number; reason: string } {
  const reasons: string[] = [];
  const contributions: number[] = [];

  if (countMatches(HIDDEN_CHARACTER, after) > countMatches(HIDDEN_CHARACTER, before)) {
    contributions.push(0.7);
    reasons.push('introduced hidden or invisible characters');
  }
  if (INJECTED_INSTRUCTION.test(after) && !INJECTED_INSTRUCTION.test(before)) {
    contributions.push(0.5);
    reasons.push('added instruction-shaped text');
  }
  const newVerbs = egressVerbs(after);
  for (const verb of egressVerbs(before)) {
    newVerbs.delete(verb);
  }
  if (newVerbs.size > 0) {
    contributions.push(0.4);
    reasons.push('added an outward-sending verb');
  }

  // Noisy-or: independent indicators combine toward, but never past, one.
  const confidence = 1 - contributions.reduce((product, weight) => product * (1 - weight), 1);
  const reason =
    reasons.length === 0
      ? 'definition changed with no recognized adversarial pattern'
      : `definition changed and ${reasons.join(', ')}`;
  return { confidence, reason };
}

/** An empty baseline, pinning nothing. */
export function createDriftBaseline(): DriftBaseline {
  return { pinned: {} };
}

/** Records a definition as the accepted baseline, so a matching one no longer reports. */
export function pinDefinition(baseline: DriftBaseline, definition: ToolDefinition): DriftBaseline {
  return { pinned: { ...baseline.pinned, [definition.name]: canonicalDefinition(definition) } };
}

/**
 * Inspects a definition against the baseline.
 *
 * First sighting pins it and reports nothing. An unchanged definition reports
 * nothing. A changed definition reports a finding scored by suspicion, and does
 * not update the baseline, so the change keeps reporting until acknowledged with
 * `pinDefinition`.
 */
export function inspectDefinition(
  baseline: DriftBaseline,
  definition: ToolDefinition,
): DriftInspection {
  const current = canonicalDefinition(definition);
  const previous = baseline.pinned[definition.name];

  if (previous === undefined) {
    return { finding: null, baseline: pinDefinition(baseline, definition) };
  }
  if (previous === current) {
    return { finding: null, baseline };
  }

  const { confidence, reason } = scoreChange(previous, current);
  return {
    finding: {
      kind: 'tool-definition-drift',
      confidence,
      reason,
      evidence: { eventIds: [], detail: { toolName: definition.name } },
    },
    baseline,
  };
}
