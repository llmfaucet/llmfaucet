import { consumeBudget } from './budget';
import { MODELS } from './catalog';
import { anthropicRequest, anthropicResponse, embeddingRequest, embeddingResponse, legacyRequest, legacyResponse, openAIRequest, responsesRequest, responsesResponse } from './formats';
import { error, responseHeaders } from './headers';
import { callProvider } from './providers';
import { capabilityError, selectModel } from './router';
import type { Env, NormalizedRequest } from './types';
import { catalog, unhealthyProviders, recordRequest, scheduledMaintenance } from './state';
import { probeProviders, refreshCatalog } from './probe';

const headerObject = (headers?: Headers): Record<string, string> => { const out: Record<string, string> = {}; headers?.forEach((value, key) => { out[key] = value; }); return out; };
const json = (data: unknown, status = 200, headers?: Headers): Response => new Response(JSON.stringify(data), { status, headers: new Headers({ 'content-type': 'application/json', 'access-control-allow-origin': '*', ...headerObject(headers) }) });

async function run(req: Request, env: Env, normalized: NormalizedRequest, wire: 'openai' | 'anthropic' | 'responses' = 'openai', models = MODELS): Promise<Response> {
  if (normalized.stream && wire !== 'openai') return error('Streaming for this wire format is not yet available.', 422, { 'x-error-code': 'unsupported_stream_format' });
  const budget = await consumeBudget(req, env);
  const baseHeaders = responseHeaders(budget.remaining, budget.reset);
  if (!budget.allowed) return error('Daily request budget exhausted. Try again after reset.', 429, { ...headerObject(baseHeaders), 'retry-after': String(Math.max(1, Math.ceil((budget.reset - Date.now()) / 1000))) });
  const unhealthy = await unhealthyProviders(env);
  const model = selectModel(normalized, unhealthy, models);
  if (!model) return capabilityError(normalized.capability);
  if (normalized.stream && model.provider === 'ai-horde') return error('AI Horde does not support streaming in this gateway.', 422, { 'x-error-code': 'unsupported_stream_provider' });
  let attempts = 0;
  const started = Date.now();
  const candidates = [model, ...models.filter((m) => m.provider !== model.provider && m.capabilities.includes(normalized.capability) && !unhealthy.has(m.provider))].filter((m, i, all) => all.findIndex((x) => x.provider === m.provider) === i).slice(0, 3);
  for (const candidate of candidates) {
    attempts++;
    try {
      const result = await callProvider(candidate, normalized, env);
      void recordRequest(env, { provider: result.provider, model: result.model.id, status: result.response.status, latency: Date.now() - started });
      const headers = responseHeaders(budget.remaining, budget.reset, `${result.provider}/${result.model.id.split('/').slice(1).join('/')}`, attempts);
      if (normalized.stream) {
        for (const key of ['cache-control', 'connection']) { const value = result.response.headers.get(key); if (value) headers.set(key, value); }
        headers.set('content-type', 'text/event-stream');
        headers.set('access-control-allow-origin', '*');
        return new Response(result.response.body, { status: result.response.status, headers });
      }
      const data = await result.response.json();
      const converted = wire === 'anthropic' ? anthropicResponse(data, result.model.id) : wire === 'responses' ? responsesResponse(data, result.model.id) : normalized.wire === 'legacy' ? legacyResponse(data, result.model.id) : normalized.wire === 'embeddings' ? embeddingResponse(data, result.model.id) : data;
      return json(converted, result.response.status, headers);
    } catch { /* fail over to the next compatible upstream */ }
  }
  if (env.QUEUE) {
    if (normalized.stream) return error('Streaming requests cannot enter the waiting room; retry without stream or later.', 503, { 'retry-after': '30' });
    const requestId = crypto.randomUUID();
    await env.BUDGETS.put(`queue:${requestId}`, JSON.stringify({ status: 'pending', normalized, wire, created_at: Date.now() }), { expirationTtl: 600 });
    await env.QUEUE.send({ request_id: requestId, model: normalized.model, priority: req.headers.has('authorization') ? 1 : 0, created_at: Date.now() });
    return json({ id: requestId, object: 'queue.response', status: 'queued', message: 'All compatible providers are busy.', retry_after: 30 }, 202, new Headers({ ...headerObject(baseHeaders), 'retry-after': '30' }));
  }
  return error('All compatible upstream providers are unavailable.', 503, { ...headerObject(baseHeaders), 'retry-after': '30' });
}

const handler = { async fetch(request: Request, env: Env): Promise<Response> {
  if (request.method === 'OPTIONS') return new Response(null, { headers: { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET,POST,OPTIONS', 'access-control-allow-headers': 'authorization,content-type,anthropic-version' } });
  const url = new URL(request.url);
  const queueMatch = url.pathname.match(/^\/v1\/queue\/([\w-]+)$/);
  if (queueMatch && request.method === 'GET') { const value = await env.BUDGETS.get(`queue:${queueMatch[1]}`, 'json'); return value ? json(value) : error('Queue request not found or expired.', 404); }
  const models = await catalog(env);
  if (url.pathname === '/health' || url.pathname === '/status') return json({ status: 'ok', environment: env.ENVIRONMENT, providers: models.map((m) => m.provider).filter((p, i, a) => a.indexOf(p) === i) });
  if (url.pathname === '/v1/models' && request.method === 'GET') return json({ object: 'list', data: models.map((m) => ({ id: m.id, object: 'model', created: 0, owned_by: m.provider, capabilities: m.capabilities, supported_parameters: m.supported_parameters })) });
  if (request.method !== 'POST' || !url.pathname.startsWith('/v1/')) return error('Not found', 404);
  let body: Record<string, unknown>;
  try {
    const parsed = await request.json();
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return error('Request body must be a JSON object.', 400);
    body = parsed as Record<string, unknown>;
  } catch { return error('Request body must be valid JSON.', 400); }
  if (url.pathname.endsWith('/count_tokens')) { const budget = await consumeBudget(request, env); if (!budget.allowed) return error('Daily request budget exhausted. Try again after reset.', 429); return json({ input_tokens: Math.ceil(JSON.stringify(body.messages ?? []).length / 4) }, 200, responseHeaders(budget.remaining, budget.reset)); }
  try {
    if (url.pathname.endsWith('/chat/completions')) { if (!Array.isArray(body.messages)) return error('messages must be an array.', 400); return run(request, env, openAIRequest(body), 'openai', models); }
    if (url.pathname.endsWith('/completions')) { if (typeof body.prompt !== 'string') return error('prompt must be a string.', 400); return run(request, env, legacyRequest(body), 'openai', models); }
    if (url.pathname.endsWith('/messages')) { if (!Array.isArray(body.messages)) return error('messages must be an array.', 400); return run(request, env, anthropicRequest(body), 'anthropic', models); }
    if (url.pathname.endsWith('/responses')) { if (!('input' in body)) return error('input is required.', 400); return run(request, env, responsesRequest(body), 'responses', models); }
    if (url.pathname.endsWith('/embeddings')) { if (!('input' in body)) return error('input is required.', 400); return run(request, env, embeddingRequest(body), 'openai', models); }
  } catch { return error('Invalid request shape.', 400); }
  return error('Not found', 404);
}, async scheduled(_controller: ScheduledController, env: Env): Promise<void> { const models = await catalog(env); await scheduledMaintenance(env); await probeProviders(env, models); await refreshCatalog(env, models); }, async queue(batch: MessageBatch<any>, env: Env): Promise<void> { for (const message of batch.messages) { const id = message.body?.request_id; const stored = id ? await env.BUDGETS.get(`queue:${id}`, 'json') as any : null; if (!stored || stored.status !== 'pending') { message.ack(); continue; } try { const models = await catalog(env); const model = selectModel(stored.normalized, await unhealthyProviders(env), models); if (!model) throw new Error('no compatible model'); const result = await callProvider(model, stored.normalized, env); const text = await result.response.text(); let response: any = text; try { response = JSON.parse(text); } catch {} response = stored.wire === 'anthropic' ? anthropicResponse(response, result.model.id) : stored.wire === 'responses' ? responsesResponse(response, result.model.id) : stored.normalized.wire === 'legacy' ? legacyResponse(response, result.model.id) : stored.normalized.wire === 'embeddings' ? embeddingResponse(response, result.model.id) : response; await env.BUDGETS.put(`queue:${id}`, JSON.stringify({ status: 'complete', response, provider: result.provider, model: result.model.id, completed_at: Date.now() }), { expirationTtl: 600 }); message.ack(); } catch { message.retry({ delaySeconds: 30 }); } } } };

export default handler;
