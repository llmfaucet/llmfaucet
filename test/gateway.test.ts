import assert from 'node:assert/strict';
import handler from '../src/index';
import { consumeBudget } from '../src/budget';
import { probeProvider } from '../src/probe';
import { entitlementFor } from '../src/sponsors/entitlements';
import { generateApiKey, hashApiKey } from '../src/sponsors/keys';
import { anthropicStream, responsesRequest, responsesStream } from '../src/formats';
import { startGithub } from '../src/auth/github-oauth';
import { readSession, sessionCookie, setSessionCookie } from '../src/auth/sessions';
import { hmac } from '../src/auth/crypto';
import { sponsorWebhook } from '../src/sponsors/webhook';
import { candidatesFor } from '../src/index';
import { MODELS } from '../src/catalog';

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
const invalidKey = await handler.fetch(new Request('https://api.test/v1/chat/completions', { method: 'POST', headers: { authorization: 'Bearer llmfaucet_bad', 'CF-Connecting-IP': '127.0.0.1', 'content-type': 'application/json' }, body: JSON.stringify({ model: 'auto', messages: [{ role: 'user', content: 'hi' }] }) }), env);
assert.equal(invalidKey.status, 401);
assert.equal((await consumeBudget(new Request('https://api.test', { headers: { authorization: 'Bearer llmfaucet_bad', 'CF-Connecting-IP': '127.0.0.1' } }), env)).allowed, false);
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
assert.equal(entitlementFor('supporter').requestsPerDay, 200);
const generatedKey = generateApiKey();
assert.ok(generatedKey.startsWith('llmfaucet_'));
assert.notEqual(await hashApiKey(generatedKey), generatedKey);
const sse = new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode('data: {"choices":[{"delta":{"content":"hi"}}]}\n\ndata: [DONE]\n\n')); controller.close(); } });
const responseEvents = await new Response(responsesStream(new Response(sse, { headers: { 'content-type': 'text/event-stream' } }), 'pollinations/gpt-5').body).text();
assert.match(responseEvents, /response\.created/);
assert.match(responseEvents, /response\.output_text\.delta/);
assert.match(responseEvents, /response\.completed/);
assert.match(responseEvents, /response\.output_item\.added/);
const anthropicEvents = await new Response(anthropicStream(new Response(new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n')); controller.close(); } })), 'pollinations/gpt-5').body).text();
assert.match(anthropicEvents, /message_start/);
assert.match(anthropicEvents, /message_stop/);
const oauthEnv = { BUDGETS: new MemoryKV(), ENVIRONMENT: 'test', GITHUB_CLIENT_ID: 'client', GITHUB_CLIENT_SECRET: 'secret', GITHUB_SESSION_SECRET: 'session' } as any;
const oauthStart = await startGithub(new Request('https://preview.test/auth/github'), oauthEnv);
assert.equal(oauthStart.status, 302);
assert.match(oauthStart.headers.get('location') ?? '', /code_challenge=/);
const sessionValue = await sessionCookie({ userId: 'github:1', githubLogin: 'test', exp: Date.now() + 60_000 }, 'session');
const sessionRequest = new Request('https://preview.test/account', { headers: { cookie: setSessionCookie(sessionValue) } });
assert.equal((await readSession(sessionRequest, oauthEnv))?.githubLogin, 'test');
const webhookCalls: string[] = [];
const webhookDb = { prepare(sql: string) { webhookCalls.push(sql); return { bind(..._args: unknown[]) { return { async first() { return webhookCalls.length === 1 ? null : { delivery_id: 'delivery-1' }; }, async run() { return { meta: { changes: 1 } }; } }; } }; } } as any;
const webhookEnv = { BUDGETS: new MemoryKV(), ENVIRONMENT: 'test', DB: webhookDb, GITHUB_SPONSORS_WEBHOOK_SECRET: 'hook' } as any;
const webhookBody = JSON.stringify({ action: 'created', sponsorship: { sponsor: { id: 7, login: 'sponsor' }, sponsorable: { login: 'llmfaucet' }, tier: { id: 'supporter', name: 'Supporter' } } });
const webhookSignature = `sha256=${await hmac('hook', webhookBody)}`;
const webhookResponse = await sponsorWebhook(new Request('https://preview.test/webhooks/github-sponsors', { method: 'POST', headers: { 'x-hub-signature-256': webhookSignature, 'x-github-delivery': 'delivery-1', 'x-github-event': 'sponsorship' }, body: webhookBody }), webhookEnv);
assert.equal(webhookResponse.status, 200);
const duplicateWebhook = await sponsorWebhook(new Request('https://preview.test/webhooks/github-sponsors', { method: 'POST', headers: { 'x-hub-signature-256': webhookSignature, 'x-github-delivery': 'delivery-1', 'x-github-event': 'sponsorship' }, body: webhookBody }), webhookEnv);
assert.deepEqual(await duplicateWebhook.json(), { ok: true, duplicate: true });
const invalidWebhook = await sponsorWebhook(new Request('https://preview.test/webhooks/github-sponsors', { method: 'POST', headers: { 'x-hub-signature-256': 'sha256=bad', 'x-github-delivery': 'delivery-2' }, body: webhookBody }), webhookEnv);
assert.equal(invalidWebhook.status, 401);
const closedOAuth = await startGithub(new Request('https://preview.test/auth/github'), { BUDGETS: new MemoryKV(), ENVIRONMENT: 'test' } as any);
assert.equal(closedOAuth.status, 503);
const embeddingRequest = { model: 'auto', messages: [], stream: false, capability: 'embeddings', selector: 'auto', raw: {}, wire: 'embeddings' } as any;
const embeddingModels = [
  { id: 'ovh/bge-m3', provider: 'ovh', capabilities: ['embeddings'], quality: 7, speed: 6, context: 8192, supported_parameters: [], family: 'bge-m3' },
  { id: 'pollinations/other-embed', provider: 'pollinations', capabilities: ['embeddings'], quality: 9, speed: 9, context: 8192, supported_parameters: [], family: 'other' }
] as typeof MODELS;
assert.deepEqual(candidatesFor(embeddingRequest, embeddingModels[0], embeddingModels, new Set()).map((model) => model.family), ['bge-m3']);
const incompleteResponse = await new Response(responsesStream(new Response(new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode('data: {"choices":[{"delta":{"content":"partial"}}]}\n\n')); controller.close(); } })), 'pollinations/gpt-5').body).text();
assert.match(incompleteResponse, /response\.failed/);
const structured = responsesRequest({ model: 'auto', input: [{ type: 'message', role: 'user', content: [{ type: 'input_text', text: 'hello' }] }, { type: 'function_call_output', call_id: 'call_1', output: 'done' }] });
assert.equal((structured.messages[0].content as Array<Record<string, unknown>>)[0].type, 'text');
assert.equal(structured.messages[1].role, 'tool');
const toolSse = new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode('data: {"choices":[{"delta":{"tool_calls":[{"index":0,"id":"call_1","function":{"name":"lookup","arguments":"{\\"q\\":\\"x\\"}"}}]}}]}\n\ndata: [DONE]\n\n')); controller.close(); } });
const toolEvents = await new Response(responsesStream(new Response(toolSse), 'pollinations/gpt-5').body).text();
assert.match(toolEvents, /response\.function_call_arguments\.delta/);

const originalFetch = globalThis.fetch;
let attempts = 0;
globalThis.fetch = (async () => { attempts++; return new Response('{}', { status: 503 }); }) as typeof fetch;
const failoverEnv = { BUDGETS: new MemoryKV(), ENVIRONMENT: 'test' } as any;
const failed = await handler.fetch(new Request('https://api.test/v1/chat/completions', { method: 'POST', headers: { 'CF-Connecting-IP': '127.0.0.2' }, body: JSON.stringify({ model: 'auto', messages: [{ role: 'user', content: 'test' }] }) }), failoverEnv);
assert.equal(failed.status, 503);
assert.equal(attempts, 3);
globalThis.fetch = originalFetch;
console.log('gateway contract tests passed');
