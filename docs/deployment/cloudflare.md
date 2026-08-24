# Cloudflare deployment

Run `cd apps/worker && npx wrangler deploy --env preview --dry-run` before any
real deploy. Apply the matching D1 migrations with the same Worker config.
