# OpenAPI

`llmfaucet.yaml` is the source contract for the Worker HTTP API. The pinned
OpenAPI Generator CLI release is `v7.25.0` and runs through Docker so local
generation does not depend on a host Java installation.

```bash
pnpm openapi:validate
pnpm openapi:generate
```

The generated TypeScript Fetch client is written to
`openapi/generated/typescript-fetch`. The hand-written `@llmfaucet/sdk`
remains the supported ergonomic client; the generated client is a contract
artifact and a compatibility reference.
