import { MODELS } from './catalog';
import type { Env, Model } from './types';
import { parseTimestamp } from './lib/crypto';

const knownProviders = new Set(MODELS.map((model) => model.provider));
const valid = (value: unknown): value is Model[] => Array.isArray(value) && value.length > 0 && value.every((model) => model && typeof model.id === 'string' && typeof model.provider === 'string' && knownProviders.has(model.provider) && Array.isArray(model.capabilities) && typeof model.quality === 'number' && typeof model.speed === 'number' && typeof model.context === 'number' && Array.isArray(model.supported_parameters));

export async function catalog(env: Env): Promise<Model[]> {
  const raw = await env.BUDGETS.get('catalog:active', 'json');
  return valid(raw) ? raw : MODELS;
}

export async function unhealthyProviders(env: Env): Promise<Set<string>> {
  const active = await catalog(env);
  const providers = [...new Set([...MODELS, ...active].map((model) => model.provider))];
  const statuses = await Promise.all(providers.map(async (provider) => [provider, await env.BUDGETS.get(`health:${provider}`, 'json')] as const));
  const now = Date.now();
  return new Set(statuses.filter(([, value]) => {
    const record = value as { status?: string; checked_at?: number | string } | null;
    const checkedAt = parseTimestamp(record?.checked_at);
    return record?.status === 'unhealthy' && Number.isFinite(checkedAt) && checkedAt <= now && now - checkedAt <= 15 * 60 * 1000;
  }).map(([provider]) => provider));
}

export async function recordRequest(env: Env, data: { provider?: string; model?: string; status: number; latency: number }): Promise<void> {
  if (!env.DB) return;
  await env.DB.prepare('INSERT INTO request_logs (provider, model, status, latency_ms, created_at) VALUES (?, ?, ?, ?, ?)').bind(data.provider ?? null, data.model ?? null, data.status, data.latency, Date.now()).run();
}

export async function scheduledMaintenance(env: Env): Promise<void> {
  if (!env.DB) return;
  const start = new Date(); start.setUTCHours(0, 0, 0, 0);
  await env.DB.prepare('INSERT INTO daily_stats (day, requests, failures) SELECT date(created_at / 1000, \'unixepoch\'), COUNT(*), SUM(CASE WHEN status >= 500 THEN 1 ELSE 0 END) FROM request_logs WHERE created_at >= ? AND created_at < ? GROUP BY 1 ON CONFLICT(day) DO UPDATE SET requests = excluded.requests, failures = excluded.failures').bind(start.getTime(), start.getTime() + 86400000).run();
  await env.DB.prepare('DELETE FROM request_logs WHERE created_at < ?').bind(Date.now() - 30 * 86400000).run();
}
