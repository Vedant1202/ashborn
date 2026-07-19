import { describe, expect, it } from 'vitest';

import { resolveToolRoles } from './roles.js';

describe('resolveToolRoles', () => {
  it('uses explicit configuration with full confidence', () => {
    const resolved = resolveToolRoles('sendEmail', { sendEmail: ['egress'] });

    expect(resolved.roles).toEqual(['egress']);
    expect(resolved.source).toBe('configured');
    expect(resolved.confidence).toBe(1);
  });

  it('prefers configuration even when inference would disagree', () => {
    const resolved = resolveToolRoles('fetchUrl', { fetchUrl: ['privateData'] });

    expect(resolved.roles).toEqual(['privateData']);
    expect(resolved.source).toBe('configured');
  });

  it('falls back to inference with reduced confidence', () => {
    const resolved = resolveToolRoles('sendEmail');

    expect(resolved.roles).toContain('egress');
    expect(resolved.source).toBe('inferred');
    expect(resolved.confidence).toBeLessThan(1);
    expect(resolved.confidence).toBeGreaterThan(0);
  });

  it('infers untrusted source for tools that retrieve remote content', () => {
    expect(resolveToolRoles('fetchUrl').roles).toContain('untrustedSource');
    expect(resolveToolRoles('browsePage').roles).toContain('untrustedSource');
  });

  it('infers private data for tools that read user stores', () => {
    expect(resolveToolRoles('readInbox').roles).toContain('privateData');
    expect(resolveToolRoles('listCalendarEvents').roles).toContain('privateData');
  });

  it('infers egress for tools that transmit outward', () => {
    expect(resolveToolRoles('postWebhook').roles).toContain('egress');
    expect(resolveToolRoles('uploadFile').roles).toContain('egress');
  });

  it('infers from the tool description when the name is uninformative', () => {
    const resolved = resolveToolRoles('handler', undefined, 'Sends an email to a recipient');

    expect(resolved.roles).toContain('egress');
    expect(resolved.source).toBe('inferred');
  });

  it('returns no roles for an unrecognised tool rather than guessing', () => {
    const resolved = resolveToolRoles('doTheThing');

    expect(resolved.roles).toEqual([]);
    expect(resolved.source).toBe('inferred');
  });

  it('deduplicates roles when name and description agree', () => {
    const resolved = resolveToolRoles('sendEmail', undefined, 'send an email');

    expect(resolved.roles.filter((role) => role === 'egress')).toHaveLength(1);
  });
});
