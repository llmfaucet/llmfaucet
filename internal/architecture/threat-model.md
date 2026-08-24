# Threat model

## Assets

API keys, session cookies, OAuth secrets, sponsor entitlement state, provider
capacity, and user privacy metadata.

## Main controls

- Raw API keys are shown once and stored only as hashes.
- OAuth uses state and PKCE; access tokens are not persisted.
- Anonymous limits use a rotating HMAC subject, never a raw IP record.
- D1 is used for durable identity; KV is cache-only; Durable Objects enforce
  exact per-subject quotas and stream limits.
- Provider integrations are limited to documented anonymous/keyless access.

## Residual risks

Upstream availability and edge rate-limit behavior are external dependencies.
Preview and production credentials must remain isolated in deployment settings.
