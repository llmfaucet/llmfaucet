# Third-Party Review Checklist

For every pattern or code fragment considered for llmfaucet:

- [ ] Source repository and commit SHA recorded.
- [ ] License verified.
- [ ] Original copyright notice retained where required.
- [ ] Provider Terms of Service reviewed.
- [ ] No scraper, account automation, cookie, proxy-bypass, or private endpoint behavior.
- [ ] Compatible with Cloudflare Workers runtime.
- [ ] No native Node modules or filesystem assumptions.
- [ ] No customer secrets or upstream credentials required.
- [ ] Unit test created before merging.
- [ ] Attribution added to NOTICE.md where applicable.
- [ ] Security review completed.
- [ ] Code review confirms it supports officially anonymous/keyless access only.

| Pattern | Source | Commit | Status | llmfaucet destination | Notes |
|---|---|---|---|---|---|
| OpenAI chat normalization | freellmapi / litellm | pending | pending-review | `src/formats.ts` | Reference only |
| Anthropic message translation | freellmapi / litellm | pending | pending-review | `src/formats.ts` | Reference only |
| Responses API translation | freellmapi | pending | pending-review | `src/formats.ts` | Reference only |
| SSE streaming parser | freellmapi / gpt4free | pending | pending-review | `src/formats.ts` | Reference only |
| Provider interface | litellm | pending | pending-review | `src/providers.ts` | Reference only |
| Model capability schema | litellm / pollinations | pending | pending-review | `src/types.ts` | Reference only |
| Health probe | pollinations / AI Horde | pending | pending-review | `src/probe.ts` | Reference only |
| Fallback and cooldown logic | freellmapi / litellm | pending | pending-review | `src/router.ts` | Reference only |
| Public queue/fairness | AI Horde | pending | pending-review | `src/index.ts` | Reference only |
| Coding-agent setup CLI | freellmapi | pending | pending-review | `bin/llmfaucet.mjs` | Reference only |
