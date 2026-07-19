import type { ResolvedToolRoles, ToolRole } from './types.js';

/**
 * Confidence assigned to heuristically inferred roles.
 *
 * Inference is a convenience for tools the host has not annotated. It is
 * deliberately weak: it lowers the confidence of anything derived from it and
 * never asserts a role the way explicit configuration does.
 */
const INFERRED_ROLE_CONFIDENCE = 0.5;

/** Word stems suggesting a tool returns content the user did not author. */
const UNTRUSTED_SOURCE_STEMS = [
  'fetch',
  'browse',
  'crawl',
  'scrape',
  'web',
  'url',
  'http',
  'page',
  'issue',
  'comment',
  'feed',
  'rss',
  'download',
  'external',
];

/** Word stems suggesting a tool reads data belonging to the user. */
const PRIVATE_DATA_STEMS = [
  'inbox',
  'mailbox',
  'calendar',
  'contact',
  'profile',
  'account',
  'credential',
  'secret',
  'token',
  'document',
  'file',
  'database',
  'history',
  'note',
];

/** Word stems suggesting a tool transmits data outward. */
const EGRESS_STEMS = [
  'send',
  'post',
  'publish',
  'upload',
  'notify',
  'webhook',
  'dispatch',
  'share',
  'transmit',
  'reply',
  'forward',
  'submit',
];

/** Evaluated in this order so inferred role lists are stable. */
const STEMS_BY_ROLE: ReadonlyArray<readonly [ToolRole, readonly string[]]> = [
  ['untrustedSource', UNTRUSTED_SOURCE_STEMS],
  ['privateData', PRIVATE_DATA_STEMS],
  ['egress', EGRESS_STEMS],
];

/** Splits camelCase and delimiters into lowercase words. */
function tokenize(value: string): string[] {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 0);
}

function matchesAnyStem(tokens: readonly string[], stems: readonly string[]): boolean {
  return tokens.some((token) => stems.some((stem) => token.startsWith(stem)));
}

/**
 * Determines what part a tool plays in a data flow.
 *
 * Explicit configuration always wins and carries full confidence. Otherwise the
 * tool name and description are matched against word stems, which yields
 * reduced confidence. An unrecognised tool returns no roles rather than a
 * guess, because a wrong role is worse than an absent one.
 */
export function resolveToolRoles(
  toolName: string,
  configuredRoles?: Readonly<Record<string, readonly ToolRole[]>>,
  description?: string,
): ResolvedToolRoles {
  const configured = configuredRoles?.[toolName];
  if (configured !== undefined) {
    return { roles: [...configured], source: 'configured', confidence: 1 };
  }

  const tokens = [...tokenize(toolName), ...(description ? tokenize(description) : [])];
  const roles = STEMS_BY_ROLE.filter(([, stems]) => matchesAnyStem(tokens, stems)).map(
    ([role]) => role,
  );

  return {
    roles,
    source: 'inferred',
    confidence: roles.length > 0 ? INFERRED_ROLE_CONFIDENCE : 0,
  };
}
