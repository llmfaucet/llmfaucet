import type { Env } from './types';
import { adminSession, waitlistCsrfAllowed } from './waitlist';
import { ProviderRegistry } from './services/provider-registry';
import { isProviderSecretRef, isProviderURLAllowed } from './providers/base';

const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
});

const error = (message: string, status = 400) => json({ error: { message } }, status);
const adapters = new Set(['openai-compatible', 'pollinations', 'llm7', 'ovh', 'opencode-zen']);
const fields: Record<string, string> = {
  displayName: 'display_name', baseURL: 'base_url', adapterType: 'adapter_type', apiKeyHeader: 'api_key_header',
  apiKeySecretRef: 'api_key_secret_ref', apiKeyRequired: 'api_key_required', isEnabled: 'is_enabled',
  priority: 'priority', weight: 'weight', supportsChat: 'supports_chat', supportsEmbeddings: 'supports_embeddings',
  supportsStreaming: 'supports_streaming', rateLimitPerMinute: 'rate_limit_per_minute', timeoutMs: 'timeout_ms',
  maxRetries: 'max_retries', cooldownSeconds: 'cooldown_seconds', metadata: 'metadata_json',
};

function finiteNumber(value: unknown, min: number, max: number, integer = false): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max || (integer && !Number.isInteger(value))) return undefined;
  return value;
}

function bool(value: unknown): number | undefined { return typeof value === 'boolean' ? (value ? 1 : 0) : undefined; }

function unsafeHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, '');
  if (host.includes(':') || host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal') || host === '::1' || host === '0.0.0.0') return true;
  const octets = host.split('.').map(Number);
  if (octets.length !== 4 || octets.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return host.includes(':') && !host.startsWith('2001:');
  return octets[0] === 0 || octets[0] === 10 || octets[0] === 100 && octets[1] >= 64 && octets[1] <= 127 || octets[0] === 127 || octets[0] === 169 && octets[1] === 254 || octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31 || octets[0] === 192 && (octets[1] === 0 || octets[1] === 168) || octets[0] === 198 && (octets[1] === 18 || octets[1] === 19 || octets[1] === 51) || octets[0] === 203 && octets[1] === 0 || octets[0] >= 224;
}

function validProviderURL(value: string, env: Env): boolean {
  try { const url = new URL(value); return !unsafeHost(url.hostname) && isProviderURLAllowed(url.toString(), env); } catch { return false; }
}

function validateBody(body: Record<string, unknown>, env: Env, partial = false): string | null {
  if (!partial || body.name !== undefined) {
    if (typeof body.name !== 'string' || !/^[a-z0-9][a-z0-9_-]{1,63}$/.test(body.name)) return 'name must be lowercase and 2-64 characters.';
  }
  if (!partial || body.displayName !== undefined) {
    if (typeof body.displayName !== 'string' || body.displayName.trim().length < 1 || body.displayName.length > 120) return 'displayName must be 1-120 characters.';
  }
  if (!partial || body.baseURL !== undefined) {
    if (typeof body.baseURL !== 'string') return 'baseURL is required.';
    if (!validProviderURL(body.baseURL, env)) return 'baseURL is not in the provider egress allowlist.';
  }
  if (body.adapterType !== undefined && (typeof body.adapterType !== 'string' || !adapters.has(body.adapterType))) return 'Unsupported adapterType.';
  if (body.apiKeySecretRef !== undefined && (typeof body.apiKeySecretRef !== 'string' || !isProviderSecretRef(body.apiKeySecretRef))) return 'apiKeySecretRef must use the PROVIDER_* environment variable prefix.';
  if (body.apiKeyHeader !== undefined && (typeof body.apiKeyHeader !== 'string' || !/^[A-Za-z0-9-]{1,80}$/.test(body.apiKeyHeader))) return 'apiKeyHeader is invalid.';
  for (const key of ['apiKeyRequired', 'isEnabled', 'supportsChat', 'supportsEmbeddings', 'supportsStreaming']) if (body[key] !== undefined && typeof body[key] !== 'boolean') return `${key} must be boolean.`;
  if (body.priority !== undefined && finiteNumber(body.priority, -10000, 10000, true) === undefined) return 'priority is invalid.';
  if (body.weight !== undefined && finiteNumber(body.weight, 0.001, 100, false) === undefined) return 'weight is invalid.';
  if (body.timeoutMs !== undefined && finiteNumber(body.timeoutMs, 1000, 120000, true) === undefined) return 'timeoutMs is invalid.';
  if (body.maxRetries !== undefined && finiteNumber(body.maxRetries, 0, 10, true) === undefined) return 'maxRetries is invalid.';
  if (body.cooldownSeconds !== undefined && finiteNumber(body.cooldownSeconds, 0, 86400, true) === undefined) return 'cooldownSeconds is invalid.';
  if (body.rateLimitPerMinute !== undefined && body.rateLimitPerMinute !== null && finiteNumber(body.rateLimitPerMinute, 1, 1000000, true) === undefined) return 'rateLimitPerMinute is invalid.';
  if (body.metadata !== undefined) { if (!body.metadata || typeof body.metadata !== 'object' || Array.isArray(body.metadata) || JSON.stringify(body.metadata).length > 8000) return 'metadata must be a small object.'; }
  if (body.apiKeyRequired === true && typeof body.apiKeySecretRef !== 'string') return 'apiKeySecretRef is required when apiKeyRequired is true.';
  return null;
}

function valueFor(key: string, value: unknown): unknown {
  if (key === 'metadata') return JSON.stringify(value ?? {});
  if (['apiKeyRequired', 'isEnabled', 'supportsChat', 'supportsEmbeddings', 'supportsStreaming'].includes(key)) return bool(value);
  return value;
}

async function bodyOf(request: Request): Promise<Record<string, unknown> | null> {
  try { const body = await request.json(); return body && typeof body === 'object' && !Array.isArray(body) ? body as Record<string, unknown> : null; } catch { return null; }
}

async function handleAdminProviders(request: Request, env: Env, pathname: string): Promise<Response> {
  const current = await adminSession(request, env);
  if (!current) return error('Administrator access required.', 401);
  if (!env.DB) return error('Provider registry is unavailable.', 503);
  const registry = new ProviderRegistry(env);
  const suffix = pathname.slice('/api/admin/providers'.length).replace(/^\//, '');
  const parts = suffix ? suffix.split('/') : [];
  const id = parts[0];
  const action = parts[1];
  if (request.method !== 'GET' && !waitlistCsrfAllowed(request, env)) return error('Origin validation failed.', 403);

  if (request.method === 'GET' && !id) return json({ providers: await registry.listProviders() });
  if (!id) {
    if (request.method !== 'POST') return error('Method not allowed.', 405);
    const body = await bodyOf(request); const issue = body ? validateBody(body, env) : 'Invalid JSON body.';
    if (issue) return error(issue);
    const existing = await env.DB.prepare('SELECT id FROM providers WHERE name=?').bind(body!.name).first();
    if (existing) return error('A provider with that name already exists.', 409);
    const idValue = crypto.randomUUID();
    const values = [idValue, body!.name, body!.displayName, body!.baseURL, body!.adapterType ?? 'openai-compatible', body!.apiKeyHeader ?? null, body!.apiKeySecretRef ?? null, valueFor('apiKeyRequired', body!.apiKeyRequired ?? false), valueFor('isEnabled', body!.isEnabled ?? true), body!.priority ?? 0, body!.weight ?? 1, valueFor('supportsChat', body!.supportsChat ?? true), valueFor('supportsEmbeddings', body!.supportsEmbeddings ?? false), valueFor('supportsStreaming', body!.supportsStreaming ?? true), body!.rateLimitPerMinute ?? null, body!.timeoutMs ?? 10000, body!.maxRetries ?? 2, body!.cooldownSeconds ?? 60, valueFor('metadata', body!.metadata ?? {})];
    await env.DB.prepare('INSERT INTO providers (id,name,display_name,base_url,adapter_type,api_key_header,api_key_secret_ref,api_key_required,is_enabled,priority,weight,supports_chat,supports_embeddings,supports_streaming,rate_limit_per_minute,timeout_ms,max_retries,cooldown_seconds,metadata_json) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(...values).run();
    return json({ id: idValue }, 201);
  }

  if (request.method === 'POST' && (action === 'refresh' || action === 'health')) {
    const provider = await registry.getProvider(id); if (!provider) return error('Provider not found.', 404);
    if (action === 'refresh') {
      try { await registry.refreshModels(id); return json({ success: true, models: (await registry.getModels(id)).length }); }
      catch (cause) { return error(cause instanceof Error ? cause.message : 'Model refresh failed.', 502); }
    }
    const health = await provider.adapter.checkHealth(); await registry.updateHealth(id, health); return json({ health });
  }
  if (request.method === 'GET') {
    const provider = (await registry.listProviders()).find((item) => item.id === id); if (!provider) return error('Provider not found.', 404);
    return json({ provider, models: await registry.getModels(id) });
  }
  if (request.method === 'DELETE') {
    const result = await env.DB.prepare('DELETE FROM providers WHERE id=?').bind(id).run();
    return result.meta.changes ? json({ success: true }) : error('Provider not found.', 404);
  }
  if (request.method === 'PATCH') {
    const body = await bodyOf(request); const issue = body ? validateBody(body, env, true) : 'Invalid JSON body.';
    if (issue) return error(issue);
    const updates = Object.keys(fields).filter((key) => body![key] !== undefined && key !== 'name');
    if (!updates.length) return error('No valid changes supplied.');
    const values = updates.map((key) => valueFor(key, body![key]));
    await env.DB.prepare(`UPDATE providers SET ${updates.map((key) => `${fields[key]}=?`).join(', ')}, updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(...values, id).run();
    return json({ success: true });
  }
  return error('Method not allowed.', 405);
}

export async function adminProviders(request: Request, env: Env, pathname: string): Promise<Response> {
  try { return await handleAdminProviders(request, env, pathname); }
  catch { return error('Provider registry is unavailable.', 503); }
}
