import { buildScorecard, loadCorpus } from '@ashborn-sec/bench';

import { formatScorecard } from './format.js';

const HELP = `ashborn — agent-security signal benchmark

Usage:
  ashborn bench           Score the committed corpus and print the scorecard
  ashborn bench --json    Emit the scorecard as JSON
  ashborn --help          Show this help

The benchmark is offline and deterministic: it makes no network calls and reads
only committed fixtures. Every number reproduces from a clean clone.`;

function main(argv: readonly string[]): number {
  const args = argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    process.stdout.write(`${HELP}\n`);
    return 0;
  }

  const [command, ...rest] = args;
  if (command !== 'bench') {
    process.stderr.write(`unknown command: ${command}\n\n${HELP}\n`);
    return 1;
  }

  const scorecard = buildScorecard(loadCorpus());
  if (rest.includes('--json')) {
    process.stdout.write(`${JSON.stringify(scorecard, null, 2)}\n`);
  } else {
    process.stdout.write(`${formatScorecard(scorecard)}\n`);
  }
  return 0;
}

process.exit(main(process.argv));
