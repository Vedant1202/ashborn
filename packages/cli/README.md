# @ashborn-sec/cli

The `ashborn` command — a reproducible benchmark for **agent-security signals**: detectors that try to tell an attack on a tool-using AI agent apart from the agent doing its job.

```bash
npx @ashborn-sec/cli bench          # print the scorecard
npx @ashborn-sec/cli bench --json   # machine-readable

# or install the `ashborn` command globally
npm i -g @ashborn-sec/cli
ashborn bench
```

Everything runs offline and deterministically — no API key. A bundled corpus of 790 labeled, multi-step agent traces (composed from [AgentDojo](https://github.com/ethz-spylab/agentdojo) ground truth) is replayed through each signal, and the full operating curves are printed so a claim about catching agent attacks can be checked, not asserted.

Full results, methodology, and what is and isn't claimed: **https://github.com/Vedant1202/ashborn**

## License

MIT © Vedant Nandoskar
