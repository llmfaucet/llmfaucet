# ADR-007: Package manager decision

Status: Accepted

## Context

The repository already has a working npm lockfile and active npm scripts.

## Decision

Preserve npm as the current execution contract while adding `pnpm-workspace.yaml`
and package boundaries. A future pnpm migration must regenerate and review the
lockfile as a separate change.

## Consequences

Current CI and local commands remain stable; the workspace can be adopted by
pnpm without forcing an unreviewed dependency-lock rewrite here.

## Alternatives considered

An immediate pnpm conversion was rejected because it would mix structural and
dependency-resolution changes.
