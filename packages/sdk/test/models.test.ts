import { describe, expect, it } from 'vitest';
import { LlmFaucetClient } from '../src';
describe('models resource', () =>
  it('lists models', async () => {
    const result = await new LlmFaucetClient({
      fetch: async () => new Response(JSON.stringify({ object: 'list', data: [] })),
    }).models.list();
    expect(result.data).toEqual([]);
  }));
