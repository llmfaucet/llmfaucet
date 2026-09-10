# Cloudflare deployment

Run `cd apps/worker && npx wrangler deploy --env preview --dry-run` before any
real deploy. Apply the matching D1 migrations with the same Worker config.

The provider registry is migration `0009_providers.sql`. Apply it to preview,
verify the admin/provider and public model flows, then apply the same migration
to production:

```bash
cd apps/worker
npx wrangler d1 migrations apply llmfaucet-preview --env preview
npx wrangler d1 migrations apply llmfaucet-prod --env production
```

Provider API keys are referenced by secret name in D1 (`api_key_secret_ref`)
and are resolved from Worker secrets at request time. Do not store raw key
values in D1, KV, Pages variables, or this repository.

Authenticated provider management endpoints are available under
`/api/admin/providers` for list, create, update, delete, health check, and model
refresh operations. The existing static catalog remains the fallback when the
dynamic registry or its model catalog is unavailable.
