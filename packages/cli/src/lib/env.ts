export function readEnvironment(env = process.env) {
  return {
    apiKey: env.LLMFAUCET_API_KEY,
    baseURL: env.LLMFAUCET_BASE_URL ?? 'https://api.llmfaucet.dev/v1',
    model: env.LLMFAUCET_MODEL ?? 'auto:coding',
  };
}
