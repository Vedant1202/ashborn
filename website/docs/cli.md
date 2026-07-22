---
title: CLI reference
description: The ashborn command — bench, bench --json, --version, and --help, with exit codes. Offline and deterministic, reading only committed fixtures.
sidebar_position: 6
---

# CLI reference

The `ashborn` command runs the benchmark and prints the scorecard. It is offline
and deterministic: it makes no network calls and reads only committed fixtures,
so every number reproduces from a clean clone.

Install it, or invoke it directly with npx:

```bash
npx @ashborn-sec/cli bench      # no install

npm i -g @ashborn-sec/cli       # or install the global command
ashborn bench
```

## Commands

### `ashborn bench`

Scores the committed corpus and prints the scorecard — the AUC, recall at a fixed
false-positive rate, and per-negative-class figures for each signal. See
[getting started](./getting-started.md) for how to read the output.

```bash
ashborn bench
```

### `ashborn bench --json`

Emits the same scorecard as JSON, for a CI check or to diff against a stored
golden scorecard.

```bash
ashborn bench --json
```

### `ashborn --version`, `ashborn -v`

Prints the version and exits.

```bash
ashborn --version
ashborn -v
```

### `ashborn --help`, `ashborn -h`

Shows usage. This is also the output when `ashborn` is run with no arguments.

```bash
ashborn --help
ashborn -h
```

## Exit codes

| Code | Meaning                                                     |
| ---: | ---------------------------------------------------------- |
|  `0` | Success — `bench`, `--json`, `--version`, or `--help` ran. |
|  `1` | Unknown command. The help text is written to stderr.       |

An unrecognized command exits `1` and prints the usage to standard error; the
recognized commands above all exit `0`.

:::note[No network, no key, no variation]
The benchmark makes no network calls and needs no API key. There is no model in
the scoring path, so the output is deterministic — the figures the CLI prints are
the same figures published in the [results](./signals.md), byte-for-byte.
:::
