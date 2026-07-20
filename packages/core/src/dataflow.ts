/**
 * Approximate data-flow linking.
 *
 * Measures how much of a transmitted payload had already been read in the same
 * session, by comparing distinctive tokens. This is an approximation: true taint
 * tracking would follow values through the agent's reasoning, which needs an
 * interpreter the design deliberately excludes.
 */

/**
 * Words long enough to identify a specific value but common enough to link
 * unrelated text. Filtering them keeps overlap from firing on ordinary prose.
 */
const COMMON_WORDS = new Set([
  'about',
  'after',
  'again',
  'assistant',
  'before',
  'could',
  'first',
  'https',
  'important',
  'information',
  'message',
  'other',
  'please',
  'should',
  'their',
  'there',
  'these',
  'those',
  'which',
  'would',
]);

/** Shorter runs are too common to identify anything. */
const MINIMUM_TOKEN_LENGTH = 5;

/**
 * Distinctive lowercase tokens found anywhere in a value, deduplicated and in
 * stable order.
 */
export function extractTokens(value: unknown): string[] {
  if (value === undefined || value === null) {
    return [];
  }
  const text = typeof value === 'string' ? value : JSON.stringify(value);
  const matches = text.toLowerCase().match(/[a-z0-9_@.-]+/g) ?? [];
  const seen = new Set<string>();
  for (const token of matches) {
    if (token.length >= MINIMUM_TOKEN_LENGTH && !COMMON_WORDS.has(token)) {
      seen.add(token);
    }
  }
  return [...seen];
}

/**
 * FNV-1a, chosen because it is dependency-free, fast and stable across runs.
 * No cryptographic strength is claimed or needed; see SessionLedger for what
 * hashing here does and does not protect.
 */
function fnv1a(text: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

/** Hashes tokens for storage, preserving order and duplicates-removal. */
export function hashTokens(tokens: readonly string[]): string[] {
  return tokens.map(fnv1a);
}

/**
 * Fraction of the sink's tokens that had already been seen in the source.
 *
 * Zero for an empty sink, so an argument-free call never reports flow.
 */
export function overlapStrength(
  sourceHashes: readonly string[],
  sinkHashes: readonly string[],
): number {
  if (sinkHashes.length === 0) {
    return 0;
  }
  const source = new Set(sourceHashes);
  const matched = sinkHashes.filter((hash) => source.has(hash)).length;
  return matched / sinkHashes.length;
}
