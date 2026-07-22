---
title: Packages
description: The three Ashborn npm packages — @ashborn-sec/core (the contract and detectors), @ashborn-sec/bench (the replay harness and scorecard), and @ashborn-sec/cli (the ashborn command).
sidebar_position: 7
---

# Packages

Ashborn ships as three npm packages under the `@ashborn-sec` scope. Most users
want only the CLI; the other two are the library layers it is built on.

| Package              | Purpose                                                                             |
| -------------------- | ----------------------------------------------------------------------------------- |
| `@ashborn-sec/core`  | the event model, the session ledger, the drift detector, the egress risk annotation |
| `@ashborn-sec/bench` | the replay harness, metrics, and scorecard                                          |
| `@ashborn-sec/cli`   | the `ashborn` command                                                               |

## `@ashborn-sec/cli`

The `ashborn` command — the reproducible benchmark for agent-security signals.
This is what most people want. It bundles the corpus and prints the scorecard;
see the [CLI reference](./cli.md).

```bash
npm i -g @ashborn-sec/cli
# or run without installing:
npx @ashborn-sec/cli bench
```

## `@ashborn-sec/bench`

The offline replay harness and scorecard. It replays the corpus of labeled,
multi-step agent traces through each candidate signal and reports the operating
curves — AUC, recall at a fixed false-positive rate, and per-negative-class AUC.
Deterministic and offline; the committed fixtures ship with the package. The CLI
is a thin wrapper over this. See [the benchmark](./the-benchmark.md).

```bash
npm i @ashborn-sec/bench
```

## `@ashborn-sec/core`

The core contract: the tool-call event model, findings and risk annotations, the
per-session provenance ledger, the tool-definition-drift detector, and the
untrusted-data-egress risk annotation. This is the library layer that the
benchmark and CLI are built on. See [the signals](./signals.md) for what those
detectors measure.

```bash
npm i @ashborn-sec/core
```

Full source and methodology:
[github.com/Vedant1202/ashborn](https://github.com/Vedant1202/ashborn).
