# ADR-005: Strict rate limits

Status: Accepted

## Context

KV is eventually consistent and cannot enforce exact concurrent daily budgets.

## Decision

Use a Durable Object per access subject for atomic daily quota and stream slots;
use the edge rate-limit binding as the cheaper first-line abuse shield.

## Consequences

The Worker pays one coordination request for exact enforcement, while short
window abuse is rejected earlier.

## Alternatives considered

KV-only counters were rejected because simultaneous requests can race.
