# Cloudflare resources

Worker binding configuration is kept in `apps/worker/wrangler.toml`. This
directory contains operator-facing examples and does not contain credentials.

## Environment loading

Non-secret Worker values are versioned in `apps/worker/wrangler.toml`. Load
the secret subset from a local `.env` without printing values:

```bash
infra/cloudflare/scripts/load-worker-secrets.sh .env preview
infra/cloudflare/scripts/load-worker-secrets.sh .env production
```

Pages does not receive the server `.env`. Configure these GitHub repository
Variables for the Pages workflow:

```text
NEXT_PUBLIC_API_BASE_URL=https://api.llmfaucet.dev
NEXT_PUBLIC_PREVIEW_API_BASE_URL=https://<preview-worker-subdomain>.workers.dev
```

The Worker must also have `PUBLIC_BASE_URL`, `PUBLIC_FRONTEND_URL`, and
`PUBLIC_WEB_ORIGINS` set per Wrangler environment. Keep OAuth/webhook secrets
out of Pages variables.
