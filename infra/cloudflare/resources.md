# Cloudflare resource isolation

Preview and production must each have their own Worker name, KV namespace, D1
database, queue, Durable Object namespace/storage, OAuth credentials, webhook
secret, and cryptographic secrets. `apps/worker/wrangler.toml` is the checked-
in binding contract; resource IDs are operator-managed configuration.
