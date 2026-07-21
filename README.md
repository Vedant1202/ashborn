# Ashborn

A reproducible benchmark for **agent-security signals** — detectors that try to
tell an attack on a tool-using AI agent apart from the agent doing its job — and
the one detector that survived it.

The output is a scorecard, not a detector to take on faith. Ashborn replays a
corpus of labeled, multi-step agent traces through candidate signals and
publishes their full operating curves, so a claim about catching agent attacks
can be checked instead of asserted. It is built for anyone deciding whether an
agent-security signal actually separates attacks from ordinary work. Everything
runs offline and deterministically; every number the benchmark computes reproduces
from a clean clone with no API key. (Ashborn measures _detectors on agent traces_; how that
differs from the established work on _guards on prompts_ is spelled out under
[What is and isn't claimed](#what-is-and-isnt-claimed).)

## Results

Scored on 790 labeled traces (57 benign, 389 attack-resisted, 344 compromised)
generated from [AgentDojo](https://github.com/ethz-spylab/agentdojo) ground
truth, plus a synthetic corpus for definition drift.

| Signal                                                  | Corpus                                                                   |       AUC | Usable operating point?                                  |
| ------------------------------------------------------- | ------------------------------------------------------------------------ | --------: | -------------------------------------------------------- |
| `untrusted-data-egress` (the "lethal trifecta")         | 790 agent traces                                                         | **0.603** | No — 0% recall at ≤1% false positives                    |
| `tool-output-injection` (a prompt-injection classifier) | measured, [documented](docs/spikes/injection-classifier-availability.md) | **0.817** | No — no threshold separates; model gated                 |
| `tool-definition-drift` (the "rug pull")                | 48 synthetic pairs                                                       | **1.000** | Yes, but **synthetic and near-tautological** — see below |

Reproduce it:

```bash
pnpm install && pnpm build
node packages/cli/dist/index.js bench
```

## What each result means

**Untrusted-data egress (AUC 0.603).** The "lethal trifecta" — a session that
reads untrusted content, reads private data, and sends something outward — is a
_risk surface, not an attack_. Legitimate agent work satisfies all three legs by
design: paying a bill reads an untrusted document, touches account data, and
sends money. So a benign task is as hard to distinguish as a resisted attack
(AUC 0.600 vs 0.604), and at a near-zero false-positive threshold the signal
catches essentially nothing. Ashborn therefore treats egress as a **risk
annotation** that describes the surface a session opened, never as an alert.
Full measurement: [egress-detector-separation.md](docs/spikes/egress-detector-separation.md).

**Tool-output injection (AUC 0.817, unusable).** An off-the-shelf
prompt-injection classifier reproduces the known _over-defense_ failure on real
tool outputs: legitimate bills say "please pay by sending a bank transfer to…",
which is imperative, instruction-shaped text, so at least one benign output
scores a perfect 1.0 for injection and no threshold catches an attack without
flagging benign traffic. The model retrained to fix this (Meta Prompt Guard 2)
is gated behind manual approval; wiring it in is future work. Full measurement:
[injection-classifier-availability.md](docs/spikes/injection-classifier-availability.md).

**Tool-definition drift (AUC 1.000, honest caveat).** This is the one detector
precise enough to ship. Change detection is exact and deterministic — a pinned
definition either changed or it did not, so false positives on unchanged
definitions are zero _by construction_. The suspicion score recognizes specific
documented rug-pull patterns (newly hidden or bidi characters, an injected
instruction, a new outward-sending verb). Its perfect AUC is measured on a
**synthetic** corpus whose adversarial cases carry exactly those patterns, so
the number validates the implementation, not coverage of attacks nobody has
catalogued. It is labeled `synthetic: true` in the scorecard for that reason.

## What is and isn't claimed

Measuring guardrail over-defense is **established prior art**. NotInject /
[InjecGuard](https://arxiv.org/abs/2410.22770), OR-Bench, XSTest, Meta's
CyberSecEval False Refusal Rate, and BELLS-O all publish false-positive figures,
and this project stands on that work. The claim here is **not** "nobody publishes
numbers."

The narrow contribution is the **unit of evaluation**. Those benchmarks score
_guards on chat prompts_. Ashborn scores _detectors on multi-step agent traces_,
which lets it include a class a prompt-level benchmark cannot express:

- **benign** — clean input, legitimate actions
- **attack-resisted** — poisoned input, legitimate actions (the hard negative)
- **compromised** — poisoned input, the attacker's action executed (the positive)

`attack-resisted` is the discriminating class. It contains untrusted content, a
private read, and an egress call, yet nothing is actually exfiltrated. A signal
that merely checks "were all three present?" fires on it and is wrong. The
false-positive rate is reported against it separately, because hiding it would
flatter every signal.

Positive labels come from AgentDojo's own `injection_task.security()` oracle,
not from our judgement.

## How the corpus is built

Generation is **model-free**: it composes AgentDojo's user-task and
injection-task ground truth against a poisoned environment and executes the
calls through `FunctionsRuntime`. No API key, no cost, byte-identical on every
run. See [agentdojo-fixture-feasibility.md](docs/spikes/agentdojo-fixture-feasibility.md).

```bash
pnpm gen:fixtures                                   # regenerate the trace corpus (needs uv)
node scripts/gen-fixtures/gen_drift.mjs              # regenerate the drift corpus
```

## Packages

| Package              | Purpose                                                                             |
| -------------------- | ----------------------------------------------------------------------------------- |
| `@ashborn-sec/core`  | the event model, the session ledger, the drift detector, the egress risk annotation |
| `@ashborn-sec/bench` | the replay harness, metrics, and scorecard                                          |
| `@ashborn-sec/cli`   | the `ashborn` command                                                               |

## Scope

This release is the evaluation harness and the drift detector. A runtime library
that instruments a live agent — framework adapters (Vercel AI SDK, MCP),
OpenTelemetry emission, a timeline UI — is deliberately deferred: it is worth
building once a detector worth instrumenting an agent with exists, and the
measurements here show which detectors do and do not clear that bar.

## Development

```bash
pnpm build       # turbo build
pnpm test        # vitest across packages
pnpm typecheck
pnpm lint
```

## License

MIT. Evaluation traces are derived from AgentDojo (MIT, ETH Zurich SPY Lab); see
[NOTICE](NOTICE).
