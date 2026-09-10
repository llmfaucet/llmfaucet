import { LlmFaucetClient } from '@llmfaucet/sdk';

const client = new LlmFaucetClient({ apiKey: process.env.LLMFAUCET_API_KEY });
const response = await client.chat.create({ model: 'auto:coding', messages: [{ role: 'user', content: 'Hello' }] });
console.log(response.choices[0]?.message.content);
