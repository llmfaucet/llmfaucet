# llmfaucet probe

This package runs the Oracle VPS health probe. It sends bounded health requests
to configured providers and publishes metadata-only results to Cloudflare KV.
It does not route public requests, handle users, or render the website.

When D1 credentials are present, each cycle loads enabled providers from the
`providers` table, publishes health records to the legacy-compatible
`health:<provider>` KV keys, and refreshes public provider models on
`PROVIDER_MODEL_SYNC_INTERVAL_MS`. If D1 is unavailable, it falls back to the
checked-in provider endpoints so an operational probe still runs.

The registry migration is applied by the Worker deployment:

```bash
cd apps/worker
npx wrangler d1 migrations apply llmfaucet-prod --env production
```

Use the preview database first with `--env preview`. Never put provider API
keys in this environment file; the Worker resolves secret references from its
deployment secrets.

Run one cycle with `npm run probe -- --once` from this directory. Required VPS
variables are documented in `.env.example`; real values belong in the VPS
environment, never in the repository.
