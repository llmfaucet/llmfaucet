## Summary

<!-- What user-visible or operational problem does this solve? -->

## Boundaries

- [ ] Worker secrets and provider credentials remain server-side.
- [ ] No raw IPs, API keys, OAuth tokens, prompts, or completions were added to logs or durable records.
- [ ] Third-party references remain outside production imports.

## Verification

- [ ] `npm run typecheck`
- [ ] `npm run lint`
- [ ] `npm test`
- [ ] `npm run build`
- [ ] `npm run verify:secrets`
