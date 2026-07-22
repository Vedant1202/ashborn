---
title: What is and isn't claimed
description: Measuring guardrail over-defense is established prior art. Ashborn's narrow contribution is the unit of evaluation — detectors on multi-step agent traces, including the attack-resisted hard-negative class, rather than guards on prompts.
sidebar_position: 5
---

# What is and isn't claimed

The most important thing a benchmark can be is honest about its own novelty.
This page states what Ashborn does not claim, and then the narrow thing it does.

## What is not claimed

Measuring guardrail over-defense is **established prior art**. Publishing
false-positive figures for prompt guards is not new, and Ashborn does not pretend
otherwise. The work it stands on includes:

- **NotInject / [InjecGuard](https://arxiv.org/abs/2410.22770)** — over-defense
  measurement for prompt-injection guards.
- **Meta's CyberSecEval False Refusal Rate** — a published figure for guards
  refusing benign inputs.
- **BELLS-O** — an over-defense benchmark for guardrails.

Related benchmarks such as OR-Bench and XSTest publish false-positive figures in
the same spirit. The claim here is **not** "nobody publishes numbers." They do,
and this project builds on that.

## The narrow contribution: the unit of evaluation

The prior benchmarks score **guards on chat prompts**. Ashborn scores
**detectors on multi-step agent traces**. That difference in the unit of
evaluation is the contribution, because a trace can express a class that a
prompt-level benchmark structurally cannot.

| Class             | Input    | Actions         | Role                       |
| ----------------- | -------- | --------------- | -------------------------- |
| `benign`          | clean    | legitimate      | ordinary negative          |
| `attack-resisted` | poisoned | legitimate      | **the hard negative**      |
| `compromised`     | poisoned | attacker's sink | positive                   |

## Why `attack-resisted` is the discriminating class

`attack-resisted` is a session that contains untrusted content, a private read,
and an egress call — every leg of the "lethal trifecta" — and yet exfiltrates
nothing. The poisoned input arrives, and the agent does its legitimate job
anyway.

A prompt-level benchmark cannot express this: at the prompt, "poisoned input that
was resisted" and "poisoned input that succeeded" look identical, because the
distinction lives in the _actions the agent took afterward_, not in the input. A
trace carries those actions, so the two can be told apart.

This class is what exposes a shallow detector. A signal that merely checks "were
all three legs present?" fires on `attack-resisted` and is wrong every time — and
[the egress signal's failure](./signals.md) is precisely this: benign and
attack-resisted are structurally identical to a detector that only looks at which
tools were called (per-negative-class AUC 0.600 versus 0.604).

:::note[Reported separately, on purpose]
The false-positive rate is reported against `attack-resisted` on its own, because
folding it into the overall negatives would flatter every signal. Surfacing the
hard negative is the point; hiding it would defeat it.
:::

## Labels are not our judgement

Whether a trace is compromised is decided by AgentDojo's own
`injection_task.security()` oracle, not by Ashborn. The positive labels come from
the benchmark's authoritative check that the attacker's goal was achieved. See
[the benchmark](./the-benchmark.md) for how that oracle is used.
