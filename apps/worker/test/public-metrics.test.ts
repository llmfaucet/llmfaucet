import assert from 'node:assert/strict';
import { githubRepository, publicMetrics } from '../src/lib/public-metrics';

class MemoryKV {
  private readonly data = new Map<string, string>();
  async get<T>(key: string): Promise<T | null> { return (JSON.parse(this.data.get(key) ?? 'null') as T | null); }
  async put(key: string, value: string): Promise<void> { this.data.set(key, value); }
}

const kv = new MemoryKV();
const envValues = { BUDGETS: kv, ENVIRONMENT: 'test', GITHUB_PUBLIC_REPOSITORY: 'llmfaucet/llmfaucet' };
const env = envValues as never;
const originalFetch = globalThis.fetch;
try {
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes('api.github.com')) return new Response(JSON.stringify({ stargazers_count: 12, forks_count: 3, open_issues_count: 1 }), { status: 200 });
    return new Response('{}', { status: 404 });
  }) as typeof fetch;
  assert.equal((await githubRepository(env)).stars, 12);
  const metrics = await publicMetrics(env, { providers: ['pollinations'], models: [{ provider: 'pollinations' }] });
  assert.equal(metrics.githubStars, 12);
  assert.equal(metrics.status, 'unavailable');
  const freshKv = new MemoryKV();
  await freshKv.put('health:pollinations', JSON.stringify({ status: 'healthy', checked_at: String(Date.now()) }));
  const freshMetrics = await publicMetrics({ ...envValues, BUDGETS: freshKv } as never, { providers: ['pollinations'], models: [{ provider: 'pollinations' }] });
  assert.equal(freshMetrics.healthyUpstreams, 1);
  const staleKv = new MemoryKV();
  await staleKv.put('health:pollinations', JSON.stringify({ status: 'healthy', checked_at: String(Date.now() - 16 * 60 * 1000) }));
  const staleMetrics = await publicMetrics({ ...envValues, BUDGETS: staleKv } as never, { providers: ['pollinations'], models: [{ provider: 'pollinations' }] });
  assert.equal(staleMetrics.healthyUpstreams, null);
  assert.equal(staleMetrics.status, 'unavailable');
  globalThis.fetch = (async () => { throw new Error('offline'); }) as typeof fetch;
  assert.equal((await githubRepository(env)).stars, 12);
} finally {
  globalThis.fetch = originalFetch;
}

console.log('public metrics runtime tests passed');
