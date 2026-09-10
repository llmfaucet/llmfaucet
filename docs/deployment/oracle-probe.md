# Oracle probe

Run `apps/probe/src/index.mjs` under PM2 or systemd on the ARM VPS. Use a scoped
Cloudflare API token with KV/D1 permissions; never place it in the repository.

The probe is the runtime health/model-sync actor for the dynamic provider
registry. After applying `apps/worker/migrations/0009_providers.sql`, it:

- reads enabled providers ordered by priority and weight from D1;
- probes each provider with a bounded request and writes `health:<name>` to KV;
- refreshes public `/v1/models` catalogs into `provider_models` periodically;
- falls back to the checked-in provider endpoint list when D1 is unavailable.

Required environment variables are documented in `apps/probe/.env.example`.

For a database provider with `api_key_required=1`, set the Oracle environment
variable named by its `api_key_secret_ref`. Cloudflare Worker secrets are not
available to the Oracle probe; the probe deliberately reports that provider as
unhealthy when the referenced secret is missing.
Set `PROVIDER_MODEL_SYNC_INTERVAL_MS` to tune catalog refreshes; the default is
21600000 (six hours).
