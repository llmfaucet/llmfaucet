# ADR-003: User privacy and IP hashing

Status: Accepted

## Context

Anonymous budgets need a subject without retaining raw network identifiers.

## Decision

Use a daily HMAC subject derived from `CF-Connecting-IP`; retain neither the
raw address nor a durable cross-day anonymous profile. Store API-key hashes and
discard OAuth tokens after lookup.

## Consequences

Daily limits work without durable anonymous user records; abuse analysis is
limited to aggregate metadata.

## Alternatives considered

Plain hashes and raw IP logs were rejected because they are guessable or
unnecessarily identifying.
