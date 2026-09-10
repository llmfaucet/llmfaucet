# Provider registry

The Worker uses the `providers` and `provider_models` D1 tables as the runtime
registry. `apps/worker/migrations/0009_providers.sql` creates the tables and
seeds the existing providers without removing the static catalog fallback.

## Runtime flow

1. The Worker hourly Cron trigger reads enabled providers from D1 and publishes
   bounded health results to KV.
2. The Worker daily Cron trigger refreshes the configured catalog and provider
   model data without a second server process.
3. Worker model selection prefers enabled, healthy dynamic models and falls
   back to the checked-in catalog when dynamic data is unavailable.
4. Admins manage registration, enablement, priority, weight, health checks, and
   model refreshes through authenticated `/api/admin/providers` routes.

Provider rows contain a secret reference, never a raw API key. The adapter
resolves that reference from Worker bindings at request time.

## Adding an adapter

For a provider that is OpenAI-compatible, register the row with
`adapter_type = 'openai-compatible'`; no code change is required. For a
provider-specific protocol:

1. Implement `ProviderAdapter` in `apps/worker/src/providers/adapters.ts` (or a
   focused sibling module).
2. Add its `adapter_type` to the map in `providers/factory.ts`.
3. Normalize requests/responses, health checks, and model IDs to the existing
   `Model` contract.
4. Add a focused Worker contract test and a migration/seed only if the provider
   is part of the default installation.

Keep provider-specific credentials in Worker secrets and preserve the static
catalog/legacy provider path until the new adapter has passed health and route
tests.
