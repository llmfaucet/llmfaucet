# ADR-002: Keyless provider policy

Status: Accepted

## Context

The product promises public access only through lawful provider capacity.

## Decision

Only officially documented anonymous/keyless endpoints may be registered in the
catalog. Scrapers, account rotation, private endpoints, and bypasses are out.

## Consequences

Availability changes with upstream policy; the UI and status API must say so.

## Alternatives considered

Credential pooling and unofficial clients were rejected for security, legal,
and provider-terms risk.
