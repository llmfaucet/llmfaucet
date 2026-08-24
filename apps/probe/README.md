# llmfaucet probe

This package runs the Oracle VPS health probe. It sends bounded health requests
to configured providers and publishes metadata-only results to Cloudflare KV.
It does not route public requests, handle users, or render the website.

Run one cycle with `npm run probe -- --once` from this directory. Required VPS
variables are documented in `.env.example`; real values belong in the VPS
environment, never in the repository.
