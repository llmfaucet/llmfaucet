# Identity, privacy, and limits

llmfaucet supports anonymous use and optional GitHub identity. Anonymous traffic has no durable user record: the gateway derives a daily rotating HMAC subject from `CF-Connecting-IP` and never stores the raw address. Prompts and completions are not retained by default.

## Access plans

| Plan | Requests/day | Concurrent streams | `max_tokens` | Queue priority |
| --- | ---: | ---: | ---: | ---: |
| Anonymous | 20 | 1 | 1,024 | 0 |
| Registered | 50 | 2 | 2,048 | 10 |
| Supporter | 200 | 3 | 4,096 | 20 |
| Pro | 500 | 5 | 4,096 | 30 |

Daily quotas reset at 00:00 UTC. A Durable Object enforces the daily count and stream leases atomically; the Cloudflare Rate Limiting binding is only a short-window abuse shield. Provider capacity can change, so these are fair-use request limits and not an SLA.

## GitHub account and keys

`GET /auth/github` starts OAuth using `read:user`, state, and PKCE. OAuth access tokens are used during the callback and then discarded. A signed-in user can create keys with `POST /account/keys`; the raw `llmfaucet_...` key is shown once and only its SHA-256 hash and short prefix are stored. Keys can be listed with `GET /account/keys` and revoked with `DELETE /account/keys/:id`.

GitHub Sponsors are checked against `GITHUB_SPONSORABLE_LOGIN`. Active configured tiers map to Supporter or Pro limits; cancellation downgrades the existing key to Registered instead of breaking client configuration.

## Deletion and privacy

`DELETE /account` requires an active session and JSON body `{ "confirm": "DELETE MY ACCOUNT" }`. It removes the user, keys, sessions, entitlements, and user-linked audit records. Only non-identifying aggregate operational statistics may remain. Anonymous HMAC subjects rotate daily and are not a cross-day identity.

Required Worker secrets are configured with Wrangler: `IP_HASH_SECRET`, `SESSION_HMAC_SECRET`, `OAUTH_STATE_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_SPONSORABLE_LOGIN`, and `GITHUB_SPONSORS_WEBHOOK_SECRET`. Use separate values and OAuth applications for preview.
