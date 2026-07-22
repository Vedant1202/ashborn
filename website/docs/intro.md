---
title: Introduction
description: Ashborn is an open, reproducible benchmark for agent-security signals — plus the one detector precise enough to ship. It publishes full operating curves so a claim about catching agent attacks can be checked, not asserted.
sidebar_position: 1
---

# Introduction

**See what your AI agents access, call, and send.**

Ashborn turns an agent's run into a checkable record — what it read, which tools
it invoked, and what left the session — so a claim about an agent's behavior can
be inspected rather than trusted.

That is the mission. This page is honest about how much of it ships today.

## What ships today

Today Ashborn is an open, reproducible benchmark for **agent-security signals**:
detectors that try to tell an attack on a tool-using agent apart from the agent
doing its job. It ships alongside the one detector precise enough to run in
production.

The output is a scorecard, not a detector to take on faith. Ashborn replays a
corpus of labeled, multi-step agent traces through each candidate signal and
publishes the full operating curves — area under the ROC curve (AUC), recall at
a fixed false-positive rate, and the false-positive rate broken out by negative
class. A reader can check a claim instead of accepting it.

Everything runs offline and deterministically. Every number the benchmark
computes reproduces from a clean clone with no API key.

## The three signals, stated plainly

Ashborn measured three candidate signals. Two do not clear the bar for a
precision claim, and the benchmark says so in the same scorecard that reports
the one that does.

| Signal                   | AUC       | Ships as                                              |
| ------------------------ | --------- | ---------------------------------------------------- |
| `untrusted-data-egress`  | **0.603** | A risk annotation, not an alert                      |
| `tool-output-injection`  | **0.817** | Not shipped — unusable operating point, model gated  |
| `tool-definition-drift`  | **1.000** | The one shipped detector (measured on synthetic data)|

The full results, with the reasoning behind each, are on
[the signals page](./signals.md). The number-by-number caveats matter here — a
perfect AUC on a synthetic corpus is not the same claim as a usable detector,
and the page says which is which.

## Who it is for

- **Engineers running tool-using agents** who want to know which agent-security
  detectors actually hold up on multi-step traces, rather than on isolated
  prompts.
- **Researchers** who want a model-free, byte-reproducible corpus and an
  auditable scorecard to build on.
- **Anyone evaluating a vendor claim** about catching agent attacks, who would
  rather see an operating curve than a headline number.

## The honest scope

Ashborn measures _detectors on agent traces_. The established prior work
measures _guards on prompts_. That difference is the narrow contribution, and it
is spelled out — along with what is explicitly **not** claimed — on
[What is and isn't claimed](./what-is-claimed.md).

The live-instrumentation layer that watches a running agent — framework
adapters, telemetry emission, a timeline UI — is deliberately deferred. It is
worth building once a detector worth instrumenting an agent with exists, and the
measurements here show which detectors do and do not clear that bar. See the
[roadmap](./roadmap.md).

## Next steps

- [Getting started](./getting-started.md) — run the benchmark in one command.
- [The benchmark](./the-benchmark.md) — how the corpus is built and why it is
  reproducible.
- [The signals](./signals.md) — the three detectors and their full results.
- [What is and isn't claimed](./what-is-claimed.md) — the prior art and the
  narrow contribution.

The source, results, and methodology live at
[github.com/Vedant1202/ashborn](https://github.com/Vedant1202/ashborn).
