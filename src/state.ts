import { MODELS } from './catalog';
import type { Env, Model } from './types';

const valid = (value: unknown): value is Model[] => Array.isArray(value) && value.every((model) => model && typeof model.id === 'string' && typeof model.provider === 'string' && Array.isArray(model.capabilities));

export async function catalog(env: Env): Promise<Model[]> {
  const raw = await env.BUDGETS.get('catalog:active', 'json');
  return valid(raw) ? raw : MODELS;
}

export async function unhealthyProviders(env: Env): Promise<Set<string>> {
  const active = await catalog(env);
  const providers = [...new Set([...MODELS, ...active].map((model) => model.provider))];
  const statuses = await Promise.all(providers.map(async (provider) => [provider, await env.BUDGETS.get(`health:${provider}`, 'json')] as const));
  return new Set(statuses.filter(([, value]) => (value as any)?.status === 'unhealthy').map(([provider]) => provider));
}

export async function recordRequest(env: Env, data: { provider?: string; model?: string; status: number; latency: number }): Promise<void> {
  if (!env.DB) return;
  await env.DB.prepare('INSERT INTO request_logs (provider, model, status, latency_ms, created_at) VALUES (?, ?, ?, ?, ?)').bind(data.provider ?? null, data.model ?? null, data.status, data.latency, Date.now()).run();
}

export async function scheduledMaintenance(env: Env): Promise<void> {
  if (!env.DB) return;
  await env.DB.prepare('DELETE FROM budgets WHERE key NOT LIKE ?').bind(`%:${new Date(Math.ceil(Date.now() / 86400000) * 86400000).toISOString().slice(0, 10)}`).run();
  const start = new Date(); start.setUTCHours(0, 0, 0, 0);
  await env.DB.prepare('INSERT INTO daily_stats (day, requests, failures) SELECT date(created_at / 1000, \'unixepoch\'), COUNT(*), SUM(CASE WHEN status >= 500 THEN 1 ELSE 0 END) FROM request_logs WHERE created_at >= ? AND created_at < ? GROUP BY 1 ON CONFLICT(day) DO UPDATE SET requests = excluded.requests, failures = excluded.failures').bind(start.getTime(), start.getTime() + 86400000).run();
}
