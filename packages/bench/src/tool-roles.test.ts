import { describe, expect, it } from 'vitest';

import { rolesForTool } from './tool-roles.js';

describe('rolesForTool', () => {
  it('marks a money transfer as egress', () => {
    expect(rolesForTool('banking', 'send_money')).toEqual(['egress']);
  });

  it('marks a file read as an untrusted source, because bills carry the injection', () => {
    expect(rolesForTool('banking', 'read_file')).toEqual(['untrustedSource']);
  });

  it('marks account details as private data', () => {
    expect(rolesForTool('banking', 'get_most_recent_transactions')).toEqual(['privateData']);
  });

  it('marks a tool that is both an untrusted source and private data with both roles', () => {
    const roles = rolesForTool('slack', 'read_inbox');

    expect(roles).toContain('untrustedSource');
    expect(roles).toContain('privateData');
  });

  it('marks posting to the web as egress', () => {
    expect(rolesForTool('slack', 'post_webpage')).toEqual(['egress']);
  });

  it('marks third-party reviews as an untrusted source', () => {
    expect(rolesForTool('travel', 'get_rating_reviews_for_hotels')).toEqual(['untrustedSource']);
  });

  it('returns no roles for a tool that is not mapped', () => {
    expect(rolesForTool('banking', 'not_a_real_tool')).toEqual([]);
  });

  it('returns no roles for an unknown suite', () => {
    expect(rolesForTool('nosuchsuite', 'send_money')).toEqual([]);
  });

  it('does not leak roles across suites', () => {
    // read_file exists in banking only; slack must not inherit it
    expect(rolesForTool('slack', 'read_file')).toEqual([]);
  });
});
