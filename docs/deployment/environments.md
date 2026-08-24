# Environments

`dev` deploys isolated preview resources and `main` deploys production
resources. Each environment requires separate D1, KV, Durable Object, queue,
OAuth, webhook, and cryptographic secret configuration. The production custom
domain remains disabled until the domain is owned and attached.
