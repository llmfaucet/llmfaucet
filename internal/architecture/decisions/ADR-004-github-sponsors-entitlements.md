# ADR-004: GitHub Sponsors entitlements

Status: Accepted

## Context

Sponsors should fund infrastructure without becoming provider credentials.

## Decision

GitHub OAuth identifies a user; GraphQL/webhook state maps active tiers to
request budgets and queue priority. GitHub remains the payment processor.

## Consequences

Entitlements can downgrade without invalidating a user’s key or promising a
particular model.

## Alternatives considered

Stripe billing and token guarantees were rejected as unnecessary scope.
