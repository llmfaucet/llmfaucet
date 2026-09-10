import { LlmFaucetClient } from '@llmfaucet/sdk';

const client = new LlmFaucetClient({ apiKey: process.env.LLMFAUCET_API_KEY });
for await (const chunk of client.chat.stream({ model: 'auto:coding', messages: [{ role: 'user', content: 'Stream this' }] })) {
  process.stdout.write(String(chunk.choices[0]?.delta.content ?? ''));
}
