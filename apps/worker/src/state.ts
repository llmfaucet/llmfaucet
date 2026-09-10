import { MODELS } from './catalog';
import type { Env, Model } from './types';
import { parseTimestamp } from './lib/crypto';
import { ProviderRegistry } from './services/provider-registry';
import { SUPPORTED_CATALOG_PROVIDERS } from './providers/factory';

const valid = (value: unknown): value is Model[] => Array.isArray(value) && value.length > 0 && value.every((model) => model && typeof model.id === 'string' && typeof model.provider === 'string' && SUPPORTED_CATALOG_PROVIDERS.has(model.provider) && /^[a-z0-9][a-z0-9_-]{1,63}$/.test(model.provider) && Array.isArray(model.capabilities) && model.capabilities.every((capability: unknown) => typeof capability === 'string') && typeof model.quality === 'number' && Number.isFinite(model.quality) && typeof model.speed === 'number' && Number.isFinite(model.speed) && typeof model.context === 'number' && Number.isFinite(model.context) && Array.isArray(model.supported_parameters) && model.supported_parameters.every((parameter: unknown) => typeof parameter === 'string'));

export const MAINTENANCE_DELETE_BATCH_SIZE = 500;
export const MAINTENANCE_DELETE_BATCHES = 12;

export async function catalog(env: Env): Promise<Model[]> {
  const raw = await env.BUDGETS.get('catalog:active', 'json');
  const fallback = valid(raw) ? raw : MODELS;
  if (!env.DB) return fallback;
  const registry = new ProviderRegistry(env);
  const dynamic = await registry.getAllModelsResult();
  if (!dynamic.available) throw new Error('provider_registry_unavailable');
  const legacy = (await registry.isProviderEnabled('ai-horde')) ? MODELS.filter((model) => model.provider === 'ai-horde') : [];
  // An initialized registry can legitimately have no fresh model rows during
  // migration or a failed refresh. Preserve the known-good checked-in routes
  // until a usable dynamic catalog exists.
  return dynamic.models.length > 0 ? [...dynamic.models, ...legacy] : [...fallback, ...legacy.filter((model) => !fallback.some((item) => item.id === model.id))];
}

export function mergeModels(base: Model[], dynamic: Model[]): Model[] {
  const merged = new Map(base.map((model) => [model.id, model]));
  for (const model of dynamic) merged.set(model.id, model);
  return [...merged.values()];
}

export async function unhealthyProviders(env: Env): Promise<Set<string>> {
  const active = await catalog(env);
  const providers = [...new Set(active.map((model) => model.provider))];
  const statuses = await Promise.all(providers.map(async (provider) => [provider, await env.BUDGETS.get(`health:${provider}`, 'json')] as const));
  const now = Date.now();
  return new Set(statuses.filter(([, value]) => {
    const record = value as { status?: string; checked_at?: number | string; checkedAt?: number | string } | null;
    const checkedAt = parseTimestamp(record?.checked_at ?? record?.checkedAt);
    return record?.status !== 'healthy' && Number.isFinite(checkedAt) && checkedAt <= now && now - checkedAt <= 6 * 60 * 60 * 1000;
  }).map(([provider]) => provider));
}

export async function recordRequest(env: Env, data: { provider?: string; model?: string; status: number; latency: number }): Promise<void> {
  if (!env.DB) return;
  await env.DB.prepare('INSERT INTO request_logs (provider, model, status, latency_ms, created_at) VALUES (?, ?, ?, ?, ?)').bind(data.provider ?? null, data.model ?? null, data.status, data.latency, Date.now()).run();
}

export async function scheduledMaintenance(env: Env): Promise<void> {
  if (!env.DB) return;
  const start = new Date(); start.setUTCHours(0, 0, 0, 0);
  await env.DB.prepare('INSERT INTO daily_stats (day, requests, failures) SELECT date(created_at / 1000, \'unixepoch\'), COUNT(*), SUM(CASE WHEN status >= 500 THEN 1 ELSE 0 END) FROM request_logs WHERE created_at >= ? AND created_at < ? GROUP BY 1 ON CONFLICT(day) DO UPDATE SET requests = excluded.requests, failures = excluded.failures').bind(start.getTime() - 86400000, start.getTime() + 86400000).run();
  const prune = async (query: string, ...args: unknown[]): Promise<void> => {
    for (let batch = 0; batch < MAINTENANCE_DELETE_BATCHES; batch += 1) {
      const result = await env.DB!.prepare(query).bind(...args).run();
      if ((result.meta?.changes ?? 0) < MAINTENANCE_DELETE_BATCH_SIZE) break;
    }
  };
  await prune(`DELETE FROM request_logs WHERE rowid IN (SELECT rowid FROM request_logs WHERE created_at < ? ORDER BY created_at LIMIT ${MAINTENANCE_DELETE_BATCH_SIZE})`, Date.now() - 30 * 86400000);
  await prune(`DELETE FROM provider_health_history WHERE rowid IN (SELECT rowid FROM provider_health_history WHERE checked_at < datetime('now', '-30 days') ORDER BY checked_at LIMIT ${MAINTENANCE_DELETE_BATCH_SIZE})`);
  await prune(`DELETE FROM daily_stats WHERE rowid IN (SELECT rowid FROM daily_stats WHERE day < date('now', '-30 days') ORDER BY day LIMIT ${MAINTENANCE_DELETE_BATCH_SIZE})`);
  await prune(`DELETE FROM provider_daily_stats WHERE rowid IN (SELECT rowid FROM provider_daily_stats WHERE date < date('now', '-30 days') ORDER BY date LIMIT ${MAINTENANCE_DELETE_BATCH_SIZE})`);
}
