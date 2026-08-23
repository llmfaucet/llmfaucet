import assert from 'node:assert/strict';
import handler from '../src/index';
import { consumeBudget } from '../src/budget';
import { probeProvider } from '../src/probe';

class MemoryKV {
  data = new Map<string, string>();
  async get(key: string): Promise<string | null> { return this.data.get(key) ?? null; }
  async put(key: string, value: string): Promise<void> { this.data.set(key, value); }
  async delete(key: string): Promise<void> { this.data.delete(key); }
  async list(): Promise<any> { return { keys: [] }; }
  async getWithMetadata(): Promise<any> { return { value: null, metadata: null }; }
}

const env = { BUDGETS: new MemoryKV(), ENVIRONMENT: 'test' } as any;
const call = (path: string, body?: unknown) => handler.fetch(new Request(`https://api.test${path}`, { method: body ? 'POST' : 'GET', headers: { 'CF-Connecting-IP': '127.0.0.1' }, body: body ? JSON.stringify(body) : undefined }), env);

const models = await call('/v1/models');
assert.equal(models.status, 200);
assert.ok((await models.json() as any).data.length >= 5);
const invalid = await call('/v1/chat/completions', { model: 'auto', messages: [] });
assert.equal(invalid.status, 503); // no network upstream in the local contract test
const missing = await call('/not-found');
assert.equal(missing.status, 404);
const malformed = await handler.fetch(new Request('https://api.test/v1/chat/completions', { method: 'POST', body: '{' }), env);
assert.equal(malformed.status, 400);
const wrongShape = await call('/v1/chat/completions', { messages: 'bad' });
assert.equal(wrongShape.status, 400);
for (let i = 0; i < 20; i++) await consumeBudget(new Request('https://api.test', { headers: { 'CF-Connecting-IP': '127.0.0.1' } }), env);
assert.equal((await consumeBudget(new Request('https://api.test', { headers: { 'CF-Connecting-IP': '127.0.0.1' } }), env)).allowed, false);

assert.ok([...env.BUDGETS.data.keys()].every((key) => !key.includes('127.0.0.1')));
const probe = await probeProvider('ai-horde', { BUDGETS: new MemoryKV(), ENVIRONMENT: 'test' } as any, async (_url, init) => {
  assert.equal((init?.headers as Record<string, string>).apikey, '0000000000');
  return new Response('{}', { status: 200 });
});
assert.equal(probe.status, 'healthy');

const originalFetch = globalThis.fetch;
let attempts = 0;
globalThis.fetch = (async () => { attempts++; return new Response('{}', { status: 503 }); }) as typeof fetch;
const failoverEnv = { BUDGETS: new MemoryKV(), ENVIRONMENT: 'test' } as any;
const failed = await handler.fetch(new Request('https://api.test/v1/chat/completions', { method: 'POST', headers: { 'CF-Connecting-IP': '127.0.0.2' }, body: JSON.stringify({ model: 'auto', messages: [{ role: 'user', content: 'test' }] }) }), failoverEnv);
assert.equal(failed.status, 503);
assert.equal(attempts, 3);
globalThis.fetch = originalFetch;
console.log('gateway contract tests passed');
