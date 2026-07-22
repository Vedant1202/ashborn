---
title: The signals
description: The three agent-security signals Ashborn measured, with full results — untrusted-data-egress (0.603, demoted to a risk annotation), tool-output-injection (0.817, unusable and gated), and tool-definition-drift (1.000, the one shipped detector, on synthetic data).
sidebar_position: 4
---

# The signals

Ashborn measured three candidate signals. This page reports each result and the
reasoning behind it, without rounding away the caveats. Two signals do not clear
the bar for a precision claim; one does, on a synthetic corpus, with the caveat
stated.

| Signal                                                  | Corpus                        |       AUC | Usable operating point?                                  |
| ------------------------------------------------------- | ----------------------------- | --------: | -------------------------------------------------------- |
| `untrusted-data-egress` (the "lethal trifecta")         | 790 agent traces              | **0.603** | No — 0% recall at ≤1% false positives                    |
| `tool-output-injection` (a prompt-injection classifier) | tool outputs from the corpus  | **0.817** | No — no threshold separates; intended model gated        |
| `tool-definition-drift` (the "rug pull")                | 48 synthetic pairs            | **1.000** | Yes, but **synthetic and near-tautological** — see below |

## Untrusted-data egress — AUC 0.603

**Result: demoted from a finding to a risk annotation.**

The "lethal trifecta" is a session that reads untrusted content, reads private
data, and sends something outward. Ashborn tested whether the presence of all
three legs can separate an attack from benign work. It cannot, and the reason is
structural rather than an implementation defect.

Legitimate agent work satisfies the trifecta by design. Paying a bill reads an
untrusted document, touches account data, and sends money. Emailing a schedule,
booking a hotel with personal details — the same shape. The trifecta describes a
**risk surface, not an attack**, so its presence is normal.

The measurement makes this concrete. Per-negative-class AUC is **0.600 for
benign versus 0.604 for attack-resisted** — a benign task is as hard to
distinguish as a resisted attack. And at a threshold pushed until the
false-positive rate reaches roughly zero (≤1%), recall is **0%**: the signal
catches essentially nothing without also flagging benign traffic.

:::note[Why it still ships, as an annotation]
Ashborn treats egress as a **risk annotation** that describes the surface a
session opened, never as an alert. The shipped annotation scores `dataFlowStrength`
— the fraction of egress-payload tokens traceable to an untrusted or private read
— which re-measures at AUC 0.603 / 0% recall on the full corpus. That is honest
posture information. It is not a precision claim, and it is not presented as one.
:::

The benign corpus here is adversarially hard for this detector on purpose:
AgentDojo user tasks are deliberately data-movement tasks, so the false-positive
rate is pessimistic relative to real traffic that includes far more read-only
work. Choosing a gentler corpus to get a better number would be benchmark
shopping, so the number stands as measured. Full measurement:
[egress-detector-separation.md](https://github.com/Vedant1202/ashborn/blob/main/docs/spikes/egress-detector-separation.md).

## Tool-output injection — AUC 0.817 (unusable)

**Result: reproduces the known over-defense failure; the retrained fix is gated.**

An off-the-shelf prompt-injection classifier, run over the corpus's tool
outputs, reproduces the over-defense failure the research literature warns
about. Legitimate bills contain text like "please pay the amount by sending a
bank transfer to…" — imperative, instruction-shaped language. The classifier
reacts to instruction _shape_ rather than to injection.

The AUC of 0.817 (measured on the obtainable model,
`protectai/deberta-v3-base-prompt-injection-v2`, over 85 benign and 120
injection-carrying outputs) hides the decisive result:

| threshold |   TPR |   FPR |
| --------: | ----: | ----: |
|       0.5 | 75.8% | 29.4% |
|       0.9 | 70.0% | 21.2% |
|      0.99 | 28.3% |  4.7% |
|     0.999 |  6.7% |  3.5% |

At least one **benign** tool output scored a perfect 1.0000 for injection. No
threshold catches a single attack without also flagging benign content, so
recall at a threshold above every benign sample is **0%**. Provenance gating does
not rescue this: gating limits how often the classifier runs, not its per-item
error rate, and the benign bills that trip it are themselves untrusted-provenance
content.

:::caution[The intended model is gated]
Meta's Prompt Guard 2 was the intended model precisely because it was retrained
against over-defense, and it may perform materially better. It is behind manual
approval, and the official repository ships PyTorch weights rather than ONNX, so a
conversion step would also be required. Wiring it in is future work; until then,
this signal is not shipped. Full measurement:
[injection-classifier-availability.md](https://github.com/Vedant1202/ashborn/blob/main/docs/spikes/injection-classifier-availability.md).
:::

## Tool-definition drift — AUC 1.000

**Result: the one detector precise enough to ship — with a synthetic caveat
stated plainly.**

This is the "rug pull": a tool's definition changes after an agent has been
built against it. Detection has two parts, and both are sound:

- **Change detection is exact and deterministic.** A pinned definition either
  changed or it did not, so false positives on unchanged definitions are zero
  _by construction_.
- **A suspicion score** recognizes specific documented rug-pull patterns — newly
  hidden or bidirectional-override characters, an injected instruction, a new
  outward-sending verb.

The AUC of 1.000 is measured on the 48 synthetic pairs (24 `benign-bump`, 24
`adversarial`).

:::caution[Why 1.000 is honest but narrow]
The corpus is **synthetic**, and its adversarial cases carry exactly the patterns
the detector looks for. A perfect separation therefore **validates the
implementation** — the detector does catch the patterns it claims to catch — but
it does **not** prove coverage of rug-pull attacks nobody has catalogued yet. The
result is near-tautological in that sense, and the drift corpus is labeled
`synthetic: true` in the scorecard for exactly that reason.
:::

This is the honest version of a strong result: an exact, zero-false-positive
change detector plus a pattern-matcher, measured on a corpus that tests the
patterns it was built for. It is shipped because the change-detection half is
precise on any input; the caveat is about the coverage of the suspicion score,
not its correctness.

## Reading the three together

One of three signals can carry a precision claim, and it is the simplest one.
Publishing the operating curve for all three — including the two that fail — is a
more credible position than tuning one until a headline number looks acceptable.
Why that is the contribution, and what it is measured _against_, is on
[What is and isn't claimed](./what-is-claimed.md).
