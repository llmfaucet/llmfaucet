# @llmfaucet/sdk

TypeScript client for the llmfaucet OpenAI-compatible API.

```bash
npm install @llmfaucet/sdk
```

```ts
import { LlmFaucetClient } from '@llmfaucet/sdk';
const client = new LlmFaucetClient({ apiKey: process.env.LLMFAUCET_API_KEY });
const response = await client.chat.create({ model: 'auto:coding', messages: [{ role: 'user', content: 'Hello!' }] });
for await (const chunk of client.chat.stream({ model: 'auto:coding', messages: [{ role: 'user', content: 'Stream this' }] })) process.stdout.write(chunk.choices[0]?.delta.content ?? '');
```

The default base URL is `https://api.llmfaucet.dev/v1`; pass `baseURL` for preview or self-hosted gateways. Usage and key resources use the authenticated Worker session, so browser clients should set `credentials: 'include'` and call them after OAuth sign-in.

## Agent configuration

The SDK also generates starter configuration for supported coding agents:

```ts
const config = client.agents.generateConfig('aider', {
  baseURL: client.baseURL,
  apiKey: process.env.LLMFAUCET_API_KEY!,
  defaultModel: 'auto:coding',
});
console.log(config.path, config.content);
```

Available adapters are `aider`, `cline`, `roo-code`, `claude-code`, `continue`,
`codex`, and `generic`. Treat generated files containing credentials as local
secrets and do not commit them.

JWT parsing, OAuth URL construction, token exchange/refresh, retry helpers, and
the low-level `streamSSE` utility are exported for advanced integrations.
