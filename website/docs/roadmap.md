---
title: Roadmap
description: What ships today and what is deliberately deferred — the live-instrumentation layer (framework adapters, OpenTelemetry emission, a timeline UI), worth building once a detector worth instrumenting an agent with exists.
sidebar_position: 8
---

# Roadmap

## What ships today

This release is the **evaluation harness and the tool-definition-drift
detector**. It is the reproducible benchmark that replays labeled agent traces
through candidate signals and publishes their operating curves, plus the one
detector precise enough to run in production. The [signals page](./signals.md)
records which detectors clear the bar and which do not.

## What is deliberately deferred

The mission is visibility — [see what your AI agents access, call, and
send](./intro.md) — and the full expression of that is a runtime library that
instruments a **live** agent, not just a benchmark that scores recorded traces.
That layer is deferred on purpose. It would include:

- **Framework adapters** — hooks into agent frameworks such as the Vercel AI SDK
  and MCP, so a running agent's tool calls become checkable events.
- **OpenTelemetry emission** — emitting those events as standard telemetry, so an
  agent's behavior can be inspected with existing observability tooling.
- **A timeline UI** — a view of what a session read, called, and sent, so a claim
  about an agent's behavior can be inspected rather than trusted.

## Why it waits

Instrumenting a live agent is only worth the cost once there is a detector worth
instrumenting it _with_. Building the runtime layer around a signal that cannot
carry a precision claim would ship visibility that produces false alerts, which
is worse than no alert.

The measurements here are what decide the order. Two of the three signals do not
clear the bar today, and the one that does is measured on synthetic data with the
[caveat stated](./signals.md). The honest position is to publish the harness and
the results first, and build the instrumentation layer when a detector earns it.

:::note[The sequence is the point]
Ship the measurement, let it say plainly which detectors work, and defer the
runtime layer until one of them is good enough to justify it. The benchmark is
how that judgement stays honest.
:::

Follow the work at
[github.com/Vedant1202/ashborn](https://github.com/Vedant1202/ashborn).
