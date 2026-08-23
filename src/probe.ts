import type { Env, Model } from './types';

const defaults: Record<string, string> = { pollinations: 'https://text.pollinations.ai/openai', llm7: 'https://api.llm7.io/v1/chat/completions', 'opencode-zen': 'https://opencode.ai/zen/v1/chat/completions', ovh: 'https://oai.endpoints.kepler.ai.cloud.ovh.net/v1/chat/completions' };
const keys: Record<string, keyof Env> = { pollinations: 'POLLINATIONS_URL', llm7: 'LLM7_URL', 'opencode-zen': 'OPENCODE_ZEN_URL', ovh: 'OVH_URL' };

export async function probeProviders(env: Env, models: Model[]): Promise<void> {
  const selected = [...new Map(models.filter((m) => m.provider !== 'ai-horde').map((m) => [m.provider, m])).values()];
  await Promise.all(selected.map(async (model) => {
    const started = Date.now();
    const url = (env[keys[model.provider]] as string | undefined) || defaults[model.provider];
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    try {
      const response = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ model: model.id.split('/').slice(1).join('/'), messages: [{ role: 'user', content: 'ping' }], max_tokens: 1 }), signal: controller.signal });
      await env.BUDGETS.put(`health:${model.provider}`, JSON.stringify({ status: response.ok ? 'healthy' : 'degraded', latency: Date.now() - started, checked_at: Date.now() }), { expirationTtl: 7200 });
    } catch {
      await env.BUDGETS.put(`health:${model.provider}`, JSON.stringify({ status: 'unhealthy', latency: Date.now() - started, checked_at: Date.now() }), { expirationTtl: 7200 });
    } finally { clearTimeout(timer); }
  }));
}

export async function refreshCatalog(env: Env, models: Model[]): Promise<void> {
  let next = models;
  if (env.CATALOG_URL) {
    try { const response = await fetch(env.CATALOG_URL, { signal: AbortSignal.timeout(5000) }); const value = await response.json(); if (Array.isArray(value) && value.every((m) => m?.id && m?.provider && Array.isArray(m?.capabilities))) next = value as Model[]; } catch { /* retain last known catalog */ }
  }
  await env.BUDGETS.put('catalog:active', JSON.stringify(next), { expirationTtl: 7200 });
}
