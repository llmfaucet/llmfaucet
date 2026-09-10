import { describe, expect, it } from 'vitest';
import { LlmFaucetClient } from '../src';
describe('LlmFaucetClient', () =>
  it('exposes resources and defaults the URL', () => {
    const client = new LlmFaucetClient({ apiKey: 'test' });
    expect(client.baseURL).toBe('https://api.llmfaucet.dev/v1');
    expect(client.chat).toBeDefined();
    expect(client.models).toBeDefined();
  }));

it('uses the account API root for authenticated account resources', async () => {
  const urls: string[] = [];
  const client = new LlmFaucetClient({
    baseURL: 'https://example.test/v1',
    fetch: async (url) => {
      urls.push(String(url));
      return new Response(JSON.stringify({ keys: [] }), { status: 200 });
    },
  });
  await client.usage.get();
  await client.keys.list();
  expect(urls).toEqual(['https://example.test/account/usage', 'https://example.test/account/keys']);
});

it('does not retry a caller-aborted request', async () => {
  let calls = 0;
  const controller = new AbortController();
  const client = new LlmFaucetClient({
    fetch: async (_url, init) => {
      calls += 1;
      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(init.signal?.reason), { once: true });
        setTimeout(() => controller.abort(new Error('cancelled')), 0);
      });
    },
  });
  await expect(client.request('/models', { signal: controller.signal })).rejects.toThrow('cancelled');
  expect(calls).toBe(1);
});
