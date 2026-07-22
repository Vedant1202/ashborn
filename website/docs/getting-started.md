---
title: Getting started
description: Run the Ashborn benchmark in one command with npx, or build it from source. It is offline, deterministic, and reproducible with no API key.
sidebar_position: 2
---

# Getting started

The benchmark runs in one command. It makes no network calls, needs no API key,
and produces byte-identical output on every run.

## Run it with npx

```bash
npx @ashborn-sec/cli bench
```

This scores the committed corpus and prints the scorecard. The corpus ships
inside the package, so nothing is downloaded at run time beyond the package
itself.

For machine-readable output — for a CI check or to diff against a stored golden
scorecard — add `--json`:

```bash
npx @ashborn-sec/cli bench --json
```

## What the scorecard shows

For each of the three signals, the scorecard reports its operating curve rather
than a single pass/fail:

- **AUC** — area under the ROC curve, the threshold-independent measure of how
  well the signal separates attacks from benign traces.
- **Recall at a fixed false-positive rate** — how many real attacks the signal
  catches once the threshold is pushed to a near-zero false-positive rate, which
  is the operating point a production detector actually needs.
- **False-positive rate per negative class** — reported separately for the
  `benign` and `attack-resisted` classes, because a signal that looks precise
  overall can be firing on the hard negatives. See
  [the benchmark](./the-benchmark.md) for what those classes are.

The point is that a claim about catching agent attacks can be checked against the
curve, not asserted. Two of the three signals do not clear the bar for a
precision claim, and the scorecard shows exactly where they fail. The full
reading of each result is on [the signals page](./signals.md).

## Offline, deterministic, reproducible

:::note[Every number reproduces from a clean clone]
The benchmark reads only committed fixtures and makes no network calls. There is
no model in the scoring path, so there is no non-determinism and no cost. The
figures the CLI prints are the same figures published in the results, and anyone
who clones the repository gets them byte-for-byte.
:::

This is a deliberate property, not a convenience. The premise of the project is
that a published false-positive figure is verifiable by anyone, which requires
that generating and scoring the corpus never depends on a paid, non-deterministic
model call. How that is achieved is described in [the benchmark](./the-benchmark.md).

## Run it from source

To build and run from a clone — for development, or to regenerate the corpus:

```bash
pnpm install && pnpm build
node packages/cli/dist/index.js bench
```

Add `--json` to the last command for the machine-readable scorecard, exactly as
with the npx path.

The corpus itself can be regenerated from AgentDojo ground truth. That step needs
[uv](https://github.com/astral-sh/uv) for the Python side and is documented in
[the benchmark](./the-benchmark.md); the scoring path above needs neither uv nor
any API key.
