# Contributing

Thanks for your interest in Ashborn. This is an early-stage project; issues and
pull requests are welcome.

## Development

Requires Node >= 22.13 and pnpm (pinned via `packageManager`).

```bash
pnpm install
pnpm build          # turbo build across packages
pnpm test           # vitest
pnpm typecheck
pnpm lint
pnpm format:check
```

Run the benchmark end to end:

```bash
node packages/cli/dist/index.js bench
```

The trace corpus is generated model-free from AgentDojo ground truth; regenerate
it with `pnpm gen:fixtures` (needs [uv](https://docs.astral.sh/uv/)) and
`node scripts/gen-fixtures/gen_drift.mjs`.

## Ground rules

- **Conventional Commits.** Commit messages drive the changelog and the version
  bump (`feat:`, `fix:`, `chore:`, `docs:`, …).
- **The checks must pass.** Build, typecheck, lint, format, and tests; CI runs all
  of them plus the shipped `ashborn bench`.
- **Keep the claims honest.** The README states exactly what is and isn't
  measured. A change to a published number must be deliberate and reflected in
  the golden scorecard test (`packages/bench/src/run.test.ts`) and the README.
- **Public `@ashborn-sec/core` types are a versioned contract** — see
  `packages/core/src/types.ts`; the api-surface test pins them.

## Releasing

Maintainers only: `pnpm release` cuts the version, changelog, tag, and GitHub
release from a clean `main`. Publishing to npm happens from CI with provenance.
Use `pnpm release:dry` to preview.
