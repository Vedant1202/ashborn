# Spike: can an injection classifier carry the precision claim in TypeScript?

**Question:** does a prompt-injection classifier run in transformers.js at acceptable latency, and does it separate on our tool outputs?
**Answer:** it runs, but the only obtainable model does not separate at high precision, and the intended model is behind manual approval.
**Date:** 2026-07-19. Run in the gitignored `trial/` directory before implementing T8.

## Why this was spiked

Checkpoint 0 demoted the egress signal to a risk annotation, which moved the
precision claim onto T7 and T8. That made T8 load-bearing and it had never been
validated, so it was tested before being built.

## Model availability

| model                                           | status          | note                     |
| ----------------------------------------------- | --------------- | ------------------------ |
| `meta-llama/Llama-Prompt-Guard-2-22M`           | `gated: manual` | Meta approves by hand    |
| `meta-llama/Llama-Prompt-Guard-2-86M`           | `gated: manual` | Meta approves by hand    |
| `onnx-community/Llama-Prompt-Guard-2-22M-ONNX`  | 401             | no community ONNX mirror |
| `protectai/deberta-v3-base-prompt-injection-v2` | public          | loads and runs           |

Prompt Guard 2 was the intended model precisely because it was retrained against
over-defense. It is not readily obtainable: access needs manual approval, the
official repository ships PyTorch weights rather than ONNX, so a conversion step
would also be required.

A control model loaded and ran correctly, so the toolchain and network are sound.
The obstacle is model access, not the TypeScript runtime.

## Measurement of the obtainable model

`protectai/deberta-v3-base-prompt-injection-v2`, over tool outputs drawn from the
committed fixtures: 85 benign outputs and 120 outputs carrying an injection,
truncated to 1500 characters.

| threshold |   TPR |   FPR |
| --------: | ----: | ----: |
|       0.5 | 75.8% | 29.4% |
|       0.9 | 70.0% | 21.2% |
|      0.99 | 28.3% |  4.7% |
|     0.999 |  6.7% |  3.5% |

AUC 0.8172. Latency p50 125 ms, p95 339 ms against a 60 ms budget.

**The decisive result:** at least one benign tool output scored 1.0000 for
injection, so no threshold catches a single attack without also flagging benign
content. Recall at a threshold above every benign sample is 0%.

This is the over-defense failure the research warned about, reproduced on our own
data. The cause is visible in the corpus: legitimate bills contain "please pay the
amount by sending a bank transfer to...", which is imperative, instruction-shaped
text. The classifier is reacting to instruction shape rather than to injection.

Provenance gating does not rescue this. Gating limits how often the classifier
runs, not its per-item error rate, and the benign bills and web pages that trip it
are themselves untrusted-provenance content, so they would still be scanned.

## Limitations of this measurement

- Outputs were truncated rather than chunked with a sliding window, so an
  injection past the truncation point is missed. A real implementation needs
  chunking; that would raise recall but not lower the false-positive rate, which
  is the failing axis.
- One model was measured. Prompt Guard 2 may well perform materially better,
  since fixing over-defense was its stated purpose. That remains untested.

## Where this leaves the three signals

| signal                | status                                                                     |
| --------------------- | -------------------------------------------------------------------------- |
| untrusted-data-egress | measured AUC 0.712, demoted to a risk annotation at Checkpoint 0           |
| tool-output-injection | obtainable model gives no usable high-precision threshold                  |
| tool-definition-drift | not yet built; a hash comparison, near-zero false positive by construction |

One of three signals can carry a precision claim, and it is the simplest one.

## Options

1. **Make the harness the product.** Ship the reproducible benchmark and publish
   honest operating curves for all three signals, with drift as the one precise
   detector included. The contribution becomes the measurement rather than another
   detector, which is a gap the field genuinely has.
2. **Pursue Prompt Guard 2 access** in parallel: request approval, convert to ONNX,
   re-measure. Uncertain timeline and may be refused, but it is the one path that
   could restore T8.
3. **Lead on drift alone** as the detector, with the harness as supporting evidence.
4. Abandon.
