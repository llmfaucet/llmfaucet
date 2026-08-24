# llmfaucet agent guide

## Project overview

llmfaucet is a Cloudflare Worker gateway with a Next.js/Fumadocs web app, an
Oracle VPS probe, and publishable SDK/CLI preparation packages.

## Boundaries

- `apps/web` contains browser-safe pages, components, and API clients only.
- `apps/worker` contains Worker routes, D1/KV/Durable Object/Queue bindings,
  auth, providers, and compatibility formats.
- `apps/probe` contains health probes only.
- `packages/types` and `packages/config` contain runtime-neutral contracts.
- `packages/sdk` is the public client; `packages/cli` is agent setup tooling.
- `internal` is documentation/reference material and is never a runtime import.

## Security and provider policy

Never commit secrets, raw API keys, OAuth tokens, raw IPs, prompts, or
completions. Use Web Crypto in Workers, D1 prepared statements, rotating HMAC
anonymous subjects, and Durable Objects for strict quotas. Integrate only
officially documented anonymous/keyless providers; no scraping, account
rotation, private endpoints, or bypasses.

## Verification

Run `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`,
`npm run verify:secrets`, and `cd apps/worker && npx wrangler deploy --env
preview --dry-run` before claiming completion. Preview must be validated before
production. Do not claim fake metrics, uptime, model guarantees, or SLA.
