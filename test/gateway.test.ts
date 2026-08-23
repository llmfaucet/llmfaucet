import assert from 'node:assert/strict';
import handler from '../src/index';
import { consumeBudget } from '../src/budget';

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
console.log('gateway contract tests passed');
