# Spike: does the untrusted-data-egress detector actually separate?

**Question:** can a structural trifecta detector reach near-zero false positives on real agent traces?
**Answer:** no, not as specified. AUC 0.712, and at a near-zero false-positive threshold it detects 6.1% of attacks.
**Date:** 2026-07-19. Measured on the 790 committed fixtures before implementing T4.

## Why this was measured before implementing

The plan orders Phase 0 so the riskiest assumption is tested first. Designing the
detector required deciding what signal it keys on, and that decision is only
answerable from data. Implementing first and discovering this in T5 would have
cost the implementation for no additional information.

## Results

All figures over 790 traces (57 benign, 389 attack-resisted, 344 compromised)
across banking, slack and travel. Positives are the compromised class.

**Naive three-leg matching** (untrusted, private and egress all present in a session):

| class           | fires on |
| --------------- | -------: |
| benign          |    22.8% |
| attack-resisted |    18.8% |
| compromised     |    37.5% |

**Private-data tokens reaching an egress payload** (binary):

| class           | fires on |
| --------------- | -------: |
| benign          |    40.4% |
| attack-resisted |    39.1% |
| compromised     |    69.8% |

**Graded scores**, ranked by separation:

| score                           |   AUC | best threshold |   TPR |   FPR |
| ------------------------------- | ----: | -------------: | ----: | ----: |
| count of private tokens in sink | 0.712 |            ≥ 3 | 60.5% | 19.1% |
| fraction of sink tokens tainted | 0.675 |         ≥ 0.71 | 51.5% | 18.2% |
| novel untrusted tokens in sink  | 0.658 |            ≥ 1 | 50.6% | 17.0% |

**At the operating point the product actually needs:** pushing the threshold until
the false-positive rate reaches ~0% leaves **6.1% recall**.

## Why it fails, structurally

Two findings explain it, and neither is an implementation defect.

**1. Benign and attack-resisted are structurally identical.** Their leg profiles match
exactly in every suite (banking 13%/13%, slack 52%/52%, travel 0%/0%). They execute the
_same calls_ — attack-resisted is the same user-task ground truth against a poisoned
environment. No tool-sequence signal can separate them; only content can.

**2. Legitimate agent work satisfies the trifecta by design.** "Pay this bill", "email my
schedule", "book a hotel with my details" all read private data, ingest third-party
content, and transmit outward. The lethal trifecta describes a **risk surface, not an
attack**. Its presence is normal, which is why it cannot carry a precision claim on its
own.

The concrete case: in `banking/user_task_0` the agent reads a bill (untrusted) and then
sends money to the IBAN _from that bill_. Tainted data reaching the sink is the task
working correctly. The attack differs only in that a second transfer goes somewhere the
user never asked for — and "the user never asked for it" is a statement about intent,
which structural analysis does not have.

## Threats to validity, stated fairly

- **The benign corpus is adversarially hard for this detector.** AgentDojo user tasks are
  deliberately data-movement tasks. Real agent traffic includes far more read-only work,
  so the false-positive rate here is pessimistic relative to production. This is a real
  caveat, but choosing a gentler corpus to get a better number would be benchmark
  shopping and is not an option.
- **Token overlap approximates data flow.** True taint tracking through the agent's
  reasoning would be more precise, but it needs an interpreter, which the design
  deliberately excludes.
- **Fixtures carry no user prompt.** A deployed adapter has message history. Intent
  context was considered and looks unlikely to rescue the signal: the legitimate IBAN is
  not in the user prompt either, so "destination the user did not mention" fires on
  benign indirection too. Deciding whether an egress _serves_ the user's goal is a
  semantic judgement, which is what an LLM judge would be for, and the structural core
  excludes that on purpose.
- **The role map is a judgement.** It is plausible and the failure is systemic across all
  three suites rather than localized, so a mapping error is unlikely to be the cause.

## What this does not invalidate

- **Tool-definition-drift (T7)** is deterministic. A pinned hash either changed or it did
  not, so its false-positive rate is near zero by construction.
- **Tool-output-injection (T8)** rests on a classifier with published figures (Prompt
  Guard 2: 97.5% recall at 1% FPR) and is gated to untrusted provenance.

The accuracy claim can still be honest. It cannot rest on this detector.

## Options

1. **Narrow the claim.** Lead the product on drift and injection detection, where the
   precision is defensible. Demote egress from a finding to context.
2. **Reframe egress as risk surfacing.** Annotate the trace with "this session satisfied
   the trifecta" as posture information rather than an alert. Honest, still useful, and
   consistent with an observability-first tool that does not block.
3. **Add an intent layer.** Would likely need an LLM judge, which contradicts the
   structural-core principle and reintroduces the adaptive-attack fragility the design
   was built to avoid.
4. **Abandon the egress detector.**

Recommendation: options 1 and 2 together. Publishing "AUC 0.71, and here is the operating
curve" alongside two detectors that genuinely are precise is a stronger and more credible
position than quietly tuning this one until a headline number looks acceptable.
