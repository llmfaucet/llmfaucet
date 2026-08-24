import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import handler from '../src/index';
import { probeProvider } from '../src/probe';
import { entitlementFor } from '../src/sponsors/entitlements';
import { generateApiKey, hashApiKey } from '../src/sponsors/keys';
import { anthropicStream, responsesRequest, responsesStream } from '../src/formats';
import { startGithub } from '../src/auth/github-oauth';
import { readSession, setSessionCookie } from '../src/auth/sessions';
import { hmac } from '../src/auth/crypto';
import { sponsorWebhook } from '../src/sponsors/webhook';
import { candidatesFor } from '../src/index';
import { supportsRequest } from '../src/router';
import { MODELS } from '../src/catalog';
import { resolveAnonymousSubject } from '../src/auth/verify';
import { createApiKey } from '../src/auth/api-keys';
import { QuotaLimiter } from '../src/durable/quota-limiter';
import { saveEntitlement } from '../src/state/users';

class MemoryKV {
  data = new Map<string, string>();
  async get(key: string): Promise<string | null> { return this.data.get(key) ?? null; }
  async put(key: string, value: string): Promise<void> { this.data.set(key, value); }
  async delete(key: string): Promise<void> { this.data.delete(key); }
  async list(): Promise<any> { return { keys: [] }; }
  async getWithMetadata(): Promise<any> { return { value: null, metadata: null }; }
}

const env = { BUDGETS: new MemoryKV(), ENVIRONMENT: 'test' } as any;
const call = (path: string, body?: unknown) => handler.fetch(new Request(`https://api.test${path}`, { method: body ? 'POST' : 'GET', headers: { 'CF-Connecting-IP': 'test-client-a' }, body: body ? JSON.stringify(body) : undefined }), env);

const models = await call('/v1/models');
assert.equal(models.status, 200);
assert.ok((await models.json() as any).data.length >= 5);
const invalid = await call('/v1/chat/completions', { model: 'auto', messages: [] });
assert.equal(invalid.status, 503); // no network upstream in the local contract test
const invalidKey = await handler.fetch(new Request('https://api.test/v1/chat/completions', { method: 'POST', headers: { authorization: 'Bearer llmfaucet_bad', 'CF-Connecting-IP': 'test-client-a', 'content-type': 'application/json' }, body: JSON.stringify({ model: 'auto', messages: [{ role: 'user', content: 'hi' }] }) }), env);
assert.equal(invalidKey.status, 503);
const missing = await call('/not-found');
assert.equal(missing.status, 404);
const malformed = await handler.fetch(new Request('https://api.test/v1/chat/completions', { method: 'POST', body: '{' }), env);
assert.equal(malformed.status, 400);
const wrongShape = await call('/v1/chat/completions', { messages: 'bad' });
assert.equal(wrongShape.status, 400);

assert.ok([...env.BUDGETS.data.keys()].every((key) => !key.includes('test-client-a')));
const probe = await probeProvider('ai-horde', { BUDGETS: new MemoryKV(), ENVIRONMENT: 'test' } as any, async (_url, init) => {
  assert.equal((init?.headers as Record<string, string>).apikey, '0000000000');
  return new Response('{}', { status: 200 });
});
assert.equal(probe.status, 'healthy');
assert.equal(entitlementFor('supporter').requestsPerDay, 200);
assert.equal(entitlementFor('early_tester').requestsPerDay, 100);
const entitlementSql: string[] = [];
const entitlementDb = { prepare(sql: string) { entitlementSql.push(sql); return { bind(..._args: unknown[]) { return { async first() { return sql.startsWith('SELECT') ? { plan: 'early_tester', expires_at: new Date(Date.now() + 86400000).toISOString() } : null; }, async run() { return { meta: { changes: 1 } }; } }; } }; } } as any;
await saveEntitlement({ DB: entitlementDb, GITHUB_SPONSORABLE_LOGIN: 'justinedevs' } as any, { githubId: 'tester', login: 'tester', tierId: 'registered', tierName: 'registered', active: false });
assert.ok(entitlementSql.some((sql) => sql.includes('INSERT INTO entitlements')));
assert.match(readFileSync('src/auth/github-oauth.ts', 'utf8'), /keep the last verified sponsor plan for its bounded verification window/);
const generatedKey = generateApiKey();
assert.ok(generatedKey.startsWith('llmfaucet_'));
assert.match(generatedKey, /^llmfaucet_[a-f0-9]{64}$/);
assert.match(createApiKey(), /^llmfaucet_[a-f0-9]{64}$/);
assert.notEqual(await hashApiKey(generatedKey), generatedKey);
const privacyRequest = new Request('https://api.test', { headers: { 'CF-Connecting-IP': 'test-client-privacy' } });
const subjectToday = await resolveAnonymousSubject(privacyRequest, 'secret', new Date('2026-08-24T12:00:00Z'));
assert.equal(subjectToday, await resolveAnonymousSubject(privacyRequest, 'secret', new Date('2026-08-24T23:59:00Z')));
assert.notEqual(subjectToday, await resolveAnonymousSubject(privacyRequest, 'secret', new Date('2026-08-25T00:00:00Z')));
assert.match(await resolveAnonymousSubject(new Request('https://api.test'), 'secret', new Date('2026-08-24T12:00:00Z')), /^anonymous:/);
class DurableMemory { data = new Map<string, unknown>(); async get<T>(key: string): Promise<T | undefined> { return this.data.get(key) as T | undefined; } async put(key: string, value: unknown): Promise<void> { this.data.set(key, value); } async delete(key: string): Promise<void> { this.data.delete(key); } }
let serialized = Promise.resolve();
const durableState = { storage: new DurableMemory(), blockConcurrencyWhile: <T>(fn: () => Promise<T>) => { const next = serialized.then(fn); serialized = next.then(() => undefined, () => undefined); return next; } } as unknown as DurableObjectState;
const limiter = new QuotaLimiter(durableState);
const consume = async (body: unknown) => limiter.fetch(new Request('https://quota', { method: 'POST', body: JSON.stringify(body) }));
assert.equal((await consume({ action: 'consume', limit: 2, now: Date.parse('2026-08-24T12:00:00Z') })).status, 200);
assert.equal((await consume({ action: 'consume', limit: 2, now: Date.parse('2026-08-24T12:01:00Z') })).status, 200);
assert.equal((await consume({ action: 'consume', limit: 2, now: Date.parse('2026-08-24T12:02:00Z') })).status, 429);
assert.equal((await consume({ action: 'consume', limit: 2, now: Date.parse('2026-08-25T00:00:00Z') })).status, 200);
assert.equal((await consume({ action: 'acquire', plan: 'anonymous', leaseId: 'a', now: Date.parse('2026-08-25T01:00:00Z') })).status, 200);
assert.equal((await consume({ action: 'acquire', plan: 'anonymous', leaseId: 'b', now: Date.parse('2026-08-25T01:00:01Z') })).status, 429);
assert.equal((await consume({ action: 'release', leaseId: 'a', plan: 'anonymous', now: Date.parse('2026-08-25T01:00:02Z') })).status, 200);
await consume({ action: 'reset' });
const concurrent = await Promise.all([consume({ action: 'consume', limit: 1 }), consume({ action: 'consume', limit: 1 })]);
assert.equal(concurrent.filter((response) => response.status === 200).length, 1);
const sse = new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode('data: {"choices":[{"delta":{"content":"hi"}}]}\n\ndata: [DONE]\n\n')); controller.close(); } });
const responseEvents = await new Response(responsesStream(new Response(sse, { headers: { 'content-type': 'text/event-stream' } }), 'pollinations/gpt-5').body).text();
assert.match(responseEvents, /response\.created/);
assert.match(responseEvents, /response\.output_text\.delta/);
assert.match(responseEvents, /response\.completed/);
assert.match(responseEvents, /response\.output_item\.added/);
const anthropicEvents = await new Response(anthropicStream(new Response(new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n')); controller.close(); } })), 'pollinations/gpt-5').body).text();
assert.match(anthropicEvents, /message_start/);
assert.match(anthropicEvents, /message_stop/);
const oauthEnv = { BUDGETS: new MemoryKV(), ENVIRONMENT: 'test', GITHUB_CLIENT_ID: 'client', GITHUB_CLIENT_SECRET: 'secret', SESSION_HMAC_SECRET: 'session', OAUTH_STATE_SECRET: 'oauth-state' } as any;
const oauthStart = await startGithub(new Request('https://preview.test/auth/github'), oauthEnv);
assert.equal(oauthStart.status, 302);
assert.match(oauthStart.headers.get('location') ?? '', /code_challenge=/);
assert.match(setSessionCookie('opaque-token', false), /HttpOnly/);
const webhookCalls: string[] = [];
const webhookDb = { prepare(sql: string) { webhookCalls.push(sql); return { bind(..._args: unknown[]) { return { async first() { return webhookCalls.length === 1 ? null : { delivery_id: 'delivery-1' }; }, async run() { return { meta: { changes: 1 } }; } }; } }; } } as any;
const webhookEnv = { BUDGETS: new MemoryKV(), ENVIRONMENT: 'test', DB: webhookDb, GITHUB_SPONSORS_WEBHOOK_SECRET: 'hook' } as any;
const webhookBody = JSON.stringify({ action: 'created', sponsorship: { sponsor: { id: 7, login: 'sponsor' }, sponsorable: { login: 'justinedevs' }, tier: { id: 'supporter', name: 'Supporter' } } });
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
const structuredRequest = { ...embeddingRequest, capability: 'chat', response_format: { type: 'json_object' }, tools: [{ type: 'function' }] } as any;
const incompatibleModel = { id: 'ovh/plain', provider: 'ovh', capabilities: ['chat'], quality: 9, speed: 9, context: 8192, supported_parameters: ['max_tokens', 'temperature'] } as typeof MODELS[number];
assert.equal(supportsRequest(structuredRequest, incompatibleModel), false);
const incompleteResponse = await new Response(responsesStream(new Response(new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode('data: {"choices":[{"delta":{"content":"partial"}}]}\n\n')); controller.close(); } })), 'pollinations/gpt-5').body).text();
assert.match(incompleteResponse, /response\.failed/);
const structured = responsesRequest({ model: 'auto', input: [{ type: 'message', role: 'user', content: [{ type: 'input_text', text: 'hello' }] }, { type: 'function_call_output', call_id: 'call_1', output: 'done' }] });
assert.equal((structured.messages[0].content as Array<Record<string, unknown>>)[0].type, 'text');
assert.equal(structured.messages[1].role, 'tool');
const instructed = responsesRequest({ model: 'auto', instructions: 'Be concise.', input: 'hello' });
assert.equal(instructed.messages[0].role, 'system');
assert.equal(instructed.messages[0].content, 'Be concise.');
const toolSse = new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode('data: {"choices":[{"delta":{"tool_calls":[{"index":0,"id":"call_1","function":{"name":"lookup","arguments":"{\\"q\\":\\"x\\"}"}}]}}]}\n\ndata: [DONE]\n\n')); controller.close(); } });
const toolEvents = await new Response(responsesStream(new Response(toolSse), 'pollinations/gpt-5').body).text();
assert.match(toolEvents, /response\.function_call_arguments\.delta/);

const originalFetch = globalThis.fetch;
let attempts = 0;
globalThis.fetch = (async () => { attempts++; return new Response('{}', { status: 503 }); }) as typeof fetch;
const failoverEnv = { BUDGETS: new MemoryKV(), ENVIRONMENT: 'test' } as any;
const failed = await handler.fetch(new Request('https://api.test/v1/chat/completions', { method: 'POST', headers: { 'CF-Connecting-IP': 'test-client-b' }, body: JSON.stringify({ model: 'auto', messages: [{ role: 'user', content: 'test' }] }) }), failoverEnv);
assert.equal(failed.status, 503);
assert.equal(attempts, 0);
globalThis.fetch = originalFetch;
console.log('gateway contract tests passed');
