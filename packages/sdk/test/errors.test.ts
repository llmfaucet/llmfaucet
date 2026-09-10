import { describe, expect, it } from 'vitest';
import { AuthenticationError, LlmFaucetClient, RateLimitError } from '../src';
describe('errors', () =>
  it('maps status errors', async () => {
    await expect(
      new LlmFaucetClient({ fetch: async () => new Response('{"message":"no"}', { status: 401 }) }).models.list(),
    ).rejects.toBeInstanceOf(AuthenticationError);
    await expect(
      new LlmFaucetClient({ fetch: async () => new Response('{}', { status: 429 }) }).models.list(),
    ).rejects.toBeInstanceOf(RateLimitError);
  }));
