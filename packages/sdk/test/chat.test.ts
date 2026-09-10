import { describe, expect, it } from 'vitest';
import { LlmFaucetClient } from '../src';
describe('chat resource', () => {
  it('creates a completion and parses SSE', async () => {
    const fetch = async (_url: string, _init?: RequestInit) =>
      new Response(JSON.stringify({ id: '1', choices: [] }), { status: 200 });
    const client = new LlmFaucetClient({ baseURL: 'https://example.test/v1', fetch });
    expect((await client.chat.create({ model: 'auto:coding', messages: [{ role: 'user', content: 'hi' }] })).id).toBe(
      '1',
    );
    const body = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('data: {"id":"1","choices":[]}\n\ndata: [DONE]\n\n'));
        controller.close();
      },
    });
    const streamClient = new LlmFaucetClient({ fetch: async () => new Response(body) });
    const chunks = [];
    for await (const chunk of streamClient.chat.stream({ model: 'auto', messages: [] })) chunks.push(chunk);
    expect(chunks).toHaveLength(1);
  });
  it('rejects malformed SSE data', async () => {
    const body = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('data: not-json\n\n'));
        controller.close();
      },
    });
    const client = new LlmFaucetClient({ fetch: async () => new Response(body) });
    await expect(client.chat.stream({ model: 'auto', messages: [] }).next()).rejects.toThrow('Malformed SSE');
  });

  it('preserves stream error messages', async () => {
    const client = new LlmFaucetClient({
      fetch: async () => new Response(JSON.stringify({ message: 'capacity unavailable' }), { status: 503 }),
    });
    await expect(client.chat.stream({ model: 'auto', messages: [] }).next()).rejects.toThrow('capacity unavailable');
  });

  it('cancels an interrupted SSE reader', async () => {
    let cancelled = false;
    let rejectRead: ((reason?: unknown) => void) | undefined;
    const reader = {
      read: async () =>
        new Promise<never>((_resolve, reject) => {
          rejectRead = reject;
        }),
      cancel: async () => {
        cancelled = true;
      },
      releaseLock: () => undefined,
    } as unknown as ReadableStreamDefaultReader<Uint8Array>;
    const controller = new AbortController();
    const client = new LlmFaucetClient({
      fetch: async (_url, init) => {
        init?.signal?.addEventListener('abort', () => rejectRead?.(init.signal?.reason), { once: true });
        return { ok: true, body: { getReader: () => reader } } as unknown as Response;
      },
    });
    const iterator = client.chat.stream({ model: 'auto', messages: [] }, { signal: controller.signal });
    const next = iterator.next();
    await new Promise((resolve) => setTimeout(resolve, 0));
    controller.abort(new Error('cancelled'));
    await expect(next).rejects.toThrow('cancelled');
    expect(cancelled).toBe(true);
  });
});
