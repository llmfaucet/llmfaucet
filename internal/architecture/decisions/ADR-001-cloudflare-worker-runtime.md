# ADR-001: Cloudflare Worker runtime

Status: Accepted

## Context

The gateway must be globally reachable with edge-native storage and streaming.

## Decision

Keep HTTP routing in a Cloudflare Worker. Use Web Crypto, D1, KV, Durable
Objects, Queues, and configured rate limiting; do not use filesystem, SQLite,
native Node modules, or provider SDKs that require Node.

## Consequences

Provider adapters stay fetch-based and request CPU/subrequest budgets remain
explicit. VPS probes are a separate Node process.

## Alternatives considered

A long-running Node API would simplify libraries but weaken the intended edge
deployment and preview isolation.
