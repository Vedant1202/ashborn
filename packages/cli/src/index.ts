import { readFileSync, realpathSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

import { buildScorecard, loadCorpus } from '@ashborn-sec/bench';

import { formatScorecard } from './format.js';

const { version } = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
) as { version: string };

const HELP = `ashborn — agent-security signal benchmark

Usage:
  ashborn bench           Score the committed corpus and print the scorecard
  ashborn bench --json    Emit the scorecard as JSON
  ashborn --version, -v   Print the version
  ashborn --help, -h      Show this help

The benchmark is offline and deterministic: it makes no network calls and reads
only committed fixtures. Every number reproduces from a clean clone.`;

/**
 * Runs the CLI and returns the exit code plus captured output, so the argument
 * handling is testable without spawning a process.
 */
export function run(argv: readonly string[]): { code: number; stdout: string; stderr: string } {
  const args = argv.slice(2);

  if (args.includes('--version') || args.includes('-v')) {
    return { code: 0, stdout: `${version}\n`, stderr: '' };
  }
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    return { code: 0, stdout: `${HELP}\n`, stderr: '' };
  }

  const [command, ...rest] = args;
  if (command !== 'bench') {
    return { code: 1, stdout: '', stderr: `unknown command: ${command}\n\n${HELP}\n` };
  }

  const scorecard = buildScorecard(loadCorpus());
  const stdout = rest.includes('--json')
    ? `${JSON.stringify(scorecard, null, 2)}\n`
    : `${formatScorecard(scorecard)}\n`;
  return { code: 0, stdout, stderr: '' };
}

// Execute only when run as the `ashborn` binary, not when imported by a test.
// realpath resolves the npm bin symlink so the comparison holds once installed.
const entry = process.argv[1];
if (entry !== undefined && import.meta.url === pathToFileURL(realpathSync(entry)).href) {
  const result = run(process.argv);
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  process.exit(result.code);
}
