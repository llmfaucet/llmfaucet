import type { Env, Model } from './types';

const defaults: Record<string, string> = { pollinations: 'https://text.pollinations.ai/openai', llm7: 'https://api.llm7.io/v1/chat/completions', 'opencode-zen': 'https://opencode.ai/zen/v1/chat/completions', ovh: 'https://oai.endpoints.kepler.ai.cloud.ovh.net/v1/chat/completions', 'ai-horde': 'https://aihorde.net/api/v2/status' };
const keys: Record<string, keyof Env> = { pollinations: 'POLLINATIONS_URL', llm7: 'LLM7_URL', 'opencode-zen': 'OPENCODE_ZEN_URL', ovh: 'OVH_URL', 'ai-horde': 'AI_HORDE_URL' };

export async function probeProvider(provider: string, env: Env, fetcher: typeof fetch = fetch): Promise<{ status: 'healthy' | 'degraded' | 'unhealthy'; latency: number }> {
  const started = Date.now();
  const url = (env[keys[provider]] as string | undefined) || defaults[provider];
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const horde = provider === 'ai-horde';
    const response = await fetcher(url, horde ? { headers: { apikey: '0000000000' }, signal: controller.signal } : { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ model: 'health-check', messages: [{ role: 'user', content: 'ping' }], max_tokens: 1 }), signal: controller.signal });
    return { status: response.ok ? 'healthy' : 'degraded', latency: Date.now() - started };
  } catch { return { status: 'unhealthy', latency: Date.now() - started }; }
  finally { clearTimeout(timer); }
}

export async function probeProviders(env: Env, models: Model[]): Promise<void> {
  const selected = [...new Set(models.map((m) => m.provider))];
  await Promise.all(selected.map(async (model) => {
    const result = await probeProvider(model, env);
    await env.BUDGETS.put(`health:${model}`, JSON.stringify({ ...result, checked_at: Date.now() }), { expirationTtl: 7200 });
  }));
}

export async function refreshCatalog(env: Env, models: Model[]): Promise<void> {
  let next = models;
  if (env.CATALOG_URL) {
    try { const response = await fetch(env.CATALOG_URL, { signal: AbortSignal.timeout(5000) }); const value = await response.json(); if (Array.isArray(value) && value.every((m) => m?.id && m?.provider && Array.isArray(m?.capabilities))) next = value as Model[]; } catch { /* retain last known catalog */ }
  }
  await env.BUDGETS.put('catalog:active', JSON.stringify(next), { expirationTtl: 7200 });
}
