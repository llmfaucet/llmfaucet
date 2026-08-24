# Monorepo migration plan

## Current state

The repository contains a Cloudflare Worker at the root and a Next.js/Fumadocs
site in `docs/`. The root package currently uses npm and has no workspace
orchestration. Existing source, migrations, tests, and user-authored content
must remain behaviorally unchanged.

## Target mapping

| Current location                                            | Target location                       | Action                                                  |
| ----------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------- |
| `src/`, `test/`, `migrations/`, `wrangler.toml`             | `apps/worker/`                        | Git-aware move; preserve Worker-relative imports        |
| `docs/`                                                     | `apps/web/`                           | Git-aware move; preserve Next App Router                |
| `src/probe.ts`, `scripts/probe.mjs`, `ecosystem.config.cjs` | `apps/probe/`                         | Isolate probe entrypoints and configuration             |
| `bin/llmfaucet.mjs`                                         | `packages/cli/`                       | Wrap as the publishable CLI entrypoint                  |
| new public client contracts                                 | `packages/sdk/`                       | Add minimal typed SDK surface                           |
| shared plans/selectors/contracts                            | `packages/config/`, `packages/types/` | Add dependency-safe shared packages                     |
| architecture/deployment material                            | `internal/`, `docs/`, `infra/`        | Separate non-runtime documentation and operations files |

## Sequencing and safety

1. Add workspace metadata and migration documentation before moving files.
2. Move web, Worker, and probe files with Git-aware renames where possible.
3. Add package boundaries and root scripts that preserve npm execution.
4. Add CI, environment examples, infrastructure documentation, and verification scripts.
5. Update only paths/configuration required by the new locations; preserve the root README.
6. Run Worker tests/typecheck, web typecheck/build/tests, probe checks, secret scans, and the preview dry-run.

## Package-manager decision

The repository keeps npm-compatible root scripts for existing contributors and
now also has a checked-in `pnpm-lock.yaml` plus `pnpm-workspace.yaml` for the
workspace CI path. pnpm is the preferred workspace installer; npm remains a
supported local fallback for the existing root scripts. See ADR-007.

## Intentional deferrals

The repository does not currently contain a publishable SDK, a complete probe
package, or Playwright configuration. Minimal functional package entrypoints
will be added; provider/runtime behavior remains owned by the Worker and is
not duplicated into packages.
