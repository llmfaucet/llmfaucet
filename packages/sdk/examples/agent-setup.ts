import { LlmFaucetClient } from '@llmfaucet/sdk';

const client = new LlmFaucetClient();
const config = client.agents.generateConfig('generic', {
  baseURL: client.baseURL,
  apiKey: process.env.LLMFAUCET_API_KEY ?? '',
  defaultModel: 'auto:coding',
});
console.log(config.content);
