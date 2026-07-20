import { describe, expect, it } from 'vitest';

import { extractTokens, hashTokens, overlapStrength } from './dataflow.js';

describe('extractTokens', () => {
  it('keeps distinctive words', () => {
    expect(extractTokens('subscribed to spotify premium')).toContain('spotify');
  });

  it('drops short words that carry no identifying signal', () => {
    const tokens = extractTokens('the cat is on a mat');

    expect(tokens).toEqual([]);
  });

  it('drops common long words that would link unrelated text', () => {
    expect(extractTokens('important information about their message')).toEqual([]);
  });

  it('lowercases so casing differences still link', () => {
    expect(extractTokens('Spotify')).toEqual(extractTokens('spotify'));
  });

  it('reads through structured values', () => {
    const tokens = extractTokens({ recipient: 'US133000000121212121212', amount: 0.01 });

    expect(tokens).toContain('us133000000121212121212');
  });

  it('returns nothing for empty or missing input', () => {
    expect(extractTokens(undefined)).toEqual([]);
    expect(extractTokens('')).toEqual([]);
  });

  it('is deterministic and deduplicated', () => {
    const once = extractTokens('spotify spotify netflix');

    expect(once).toEqual(extractTokens('spotify spotify netflix'));
    expect(once.filter((token) => token === 'spotify')).toHaveLength(1);
  });
});

describe('hashTokens', () => {
  it('is stable across calls', () => {
    expect(hashTokens(['spotify'])).toEqual(hashTokens(['spotify']));
  });

  it('distinguishes different tokens', () => {
    expect(hashTokens(['spotify'])).not.toEqual(hashTokens(['netflix']));
  });

  it('does not retain the original text', () => {
    expect(hashTokens(['spotify'])[0]).not.toContain('spotify');
  });
});

describe('overlapStrength', () => {
  it('is zero when the sink shares nothing with the source', () => {
    expect(overlapStrength(hashTokens(['alpha']), hashTokens(['beta']))).toBe(0);
  });

  it('is one when every sink token came from the source', () => {
    expect(overlapStrength(hashTokens(['alpha', 'beta']), hashTokens(['alpha']))).toBe(1);
  });

  it('reports the fraction of the sink that is tainted', () => {
    const source = hashTokens(['alpha']);
    const sink = hashTokens(['alpha', 'beta', 'gamma', 'delta']);

    expect(overlapStrength(source, sink)).toBeCloseTo(0.25);
  });

  it('is zero for an empty sink rather than dividing by zero', () => {
    expect(overlapStrength(hashTokens(['alpha']), [])).toBe(0);
  });
});
