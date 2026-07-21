# @ashborn-sec/bench

The offline replay harness and scorecard for [Ashborn](https://github.com/Vedant1202/ashborn). It replays a corpus of labeled, multi-step agent traces through candidate agent-security signals and reports their operating curves — AUC, recall at a fixed false-positive rate, and per-negative-class AUC. Deterministic and offline; the committed fixtures ship with the package.

To run it from the command line, use [`@ashborn-sec/cli`](https://www.npmjs.com/package/@ashborn-sec/cli): `npx @ashborn-sec/cli bench`.

Full docs, results, and methodology: **https://github.com/Vedant1202/ashborn**

## License

MIT © Vedant Nandoskar
