import type { Env, Model } from './types';
import { MODELS } from './catalog';
import { ProviderRegistry, type RegisteredProvider } from './services/provider-registry';
import { SUPPORTED_CATALOG_PROVIDERS } from './providers/factory';

const defaults: Record<string, string> = { pollinations: 'https://text.pollinations.ai/openai', llm7: 'https://api.llm7.io/v1/chat/completions', 'opencode-zen': 'https://opencode.ai/zen/v1/chat/completions', ovh: 'https://oai.endpoints.kepler.ai.cloud.ovh.net/v1/chat/completions', 'ai-horde': 'https://aihorde.net/api/v2/status' };
const keys: Record<string, keyof Env> = { pollinations: 'POLLINATIONS_URL', llm7: 'LLM7_URL', 'opencode-zen': 'OPENCODE_ZEN_URL', ovh: 'OVH_URL', 'ai-horde': 'AI_HORDE_URL' };
const PROBE_CONCURRENCY = 4;
const PROVIDER_BATCH_SIZE = 24;
const HEALTH_CURSOR_KEY = 'provider:probe:cursor';
const CATALOG_CURSOR_KEY = 'provider:catalog:cursor';

async function mapWithConcurrency<T>(items: T[], concurrency: number, task: (item: T) => Promise<void>): Promise<void> {
  let next = 0;
  const worker = async (): Promise<void> => {
    while (next < items.length) {
      const item = items[next++];
      if (item !== undefined) await task(item);
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
}

async function providerBatch(env: Env, cursorKey: string): Promise<{ providers: RegisteredProvider[]; nextCursor: number }> {
  const registry = new ProviderRegistry(env);
  const cursor = Number.parseInt((await env.BUDGETS.get(cursorKey)) ?? '0', 10);
  const offset = Number.isFinite(cursor) && cursor >= 0 ? cursor : 0;
  const batch = await registry.getEnabledProviderBatch(PROVIDER_BATCH_SIZE, offset);
  return { providers: batch.providers, nextCursor: batch.hasMore ? batch.nextOffset : 0 };
}

function probeUrl(provider: string, env: Env): string {
  const configured = (env[keys[provider]] as string | undefined) || defaults[provider];
  return provider === 'ai-horde' ? configured.replace(/\/generate\/async$/, '/status') : configured;
}

export async function probeProvider(provider: string, env: Env, fetcher: typeof fetch = fetch): Promise<{ status: 'healthy' | 'degraded' | 'unhealthy'; latency: number }> {
  const started = Date.now();
  const url = probeUrl(provider, env);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const horde = provider === 'ai-horde';
    const response = await fetcher(url, horde ? { headers: { apikey: '0000000000' }, signal: controller.signal } : { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ model: 'health-check', messages: [{ role: 'user', content: 'ping' }], max_tokens: 1 }), signal: controller.signal });
    return { status: response.ok ? 'healthy' : 'unhealthy', latency: Date.now() - started };
  } catch { return { status: 'unhealthy', latency: Date.now() - started }; }
  finally { clearTimeout(timer); }
}

export async function probeProviders(env: Env, models: Model[], cursorKey = HEALTH_CURSOR_KEY): Promise<void> {
  const registry = new ProviderRegistry(env);
  const batch = await providerBatch(env, cursorKey);
  const registered = batch.providers;
  const registeredNames = new Set(registered.map((provider) => provider.name));
  await mapWithConcurrency(registered, PROBE_CONCURRENCY, async (provider) => {
    try {
      const health = await provider.adapter.checkHealth();
      await registry.updateHealth(provider.id, health);
      await env.BUDGETS.put(`health:${provider.name}`, JSON.stringify({ status: health.status === 'down' ? 'unhealthy' : health.status, latency: health.latencyMs, checked_at: Date.now() }), { expirationTtl: 7200 });
    } catch (error) {
      console.error(`[provider-probe] ${provider.name} failed`, error);
      await env.BUDGETS.put(`health:${provider.name}`, JSON.stringify({ status: 'unhealthy', checked_at: Date.now() }), { expirationTtl: 7200 });
    }
  });

  const legacy = [...new Set(models.map((model) => model.provider))].filter((provider) => !registeredNames.has(provider));
  await mapWithConcurrency(legacy, PROBE_CONCURRENCY, async (provider) => {
    const result = await probeProvider(provider, env);
    await env.BUDGETS.put(`health:${provider}`, JSON.stringify({ ...result, checked_at: Date.now() }), { expirationTtl: 7200 });
  });
  await env.BUDGETS.put(cursorKey, String(batch.nextCursor), { expirationTtl: 86400 });
}

export async function refreshProviderModels(env: Env): Promise<void> {
  const registry = new ProviderRegistry(env);
  const batch = await providerBatch(env, CATALOG_CURSOR_KEY);
  const providers = batch.providers;
  let failed = false;
  await mapWithConcurrency(providers, PROBE_CONCURRENCY, async (provider) => {
    try {
      await registry.refreshModels(provider.id);
    } catch (error) {
      failed = true;
      console.error(`[provider-catalog] ${provider.name} failed`, error);
    }
  });
  if (!failed) await env.BUDGETS.put(CATALOG_CURSOR_KEY, String(batch.nextCursor), { expirationTtl: 604800 });
}

export async function refreshCatalog(env: Env, models: Model[]): Promise<void> {
  let next = models;
  if (env.CATALOG_URL) {
    try { const response = await fetch(env.CATALOG_URL, { signal: AbortSignal.timeout(5000) }); const value = await response.json(); if (Array.isArray(value) && value.length > 0 && value.every((m) => SUPPORTED_CATALOG_PROVIDERS.has(m?.provider) && typeof m?.id === 'string' && /^[a-z0-9][a-z0-9_./:-]{1,127}$/i.test(m.id) && Array.isArray(m?.capabilities) && typeof m?.quality === 'number' && Number.isFinite(m.quality) && typeof m?.speed === 'number' && Number.isFinite(m.speed) && typeof m?.context === 'number' && Number.isFinite(m.context) && Array.isArray(m?.supported_parameters))) next = value as Model[]; } catch { /* retain last known catalog */ }
  }
  await env.BUDGETS.put('catalog:active', JSON.stringify(next), { expirationTtl: 7200 });
}
