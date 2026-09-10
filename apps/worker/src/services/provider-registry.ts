import type { ProviderHealth, ProviderModel, ProviderRecord } from '@llmfaucet/types';
import type { Capability, Env, Model } from '../types';
import { createProviderAdapter } from '../providers/factory';
import type { ProviderAdapter } from '../providers/base';

export interface RegisteredProvider extends ProviderRecord { adapter: ProviderAdapter; }

function publicModelPrefix(provider: string): string {
  return provider === 'opencode-zen' ? 'opencode' : provider === 'ai-horde' ? 'horde' : provider;
}

function jsonObject(value: unknown): Record<string, unknown> {
  if (typeof value !== 'string') return (value && typeof value === 'object' ? value : {}) as Record<string, unknown>;
  try { const parsed = JSON.parse(value); return parsed && typeof parsed === 'object' ? parsed : {}; } catch { return {}; }
}

function record(row: Record<string, unknown>, health?: ProviderHealth): ProviderRecord {
  return {
    id: String(row.id), name: String(row.name), display_name: String(row.display_name), base_url: String(row.base_url),
    adapter_type: String(row.adapter_type ?? 'openai-compatible'), api_key_required: Number(row.api_key_required) === 1,
    api_key_header: row.api_key_header == null ? null : String(row.api_key_header), api_key_secret_ref: row.api_key_secret_ref == null ? null : String(row.api_key_secret_ref),
    is_enabled: Number(row.is_enabled) === 1, priority: Number(row.priority ?? 0), weight: Number(row.weight ?? 1),
    supports_chat: Number(row.supports_chat) === 1, supports_embeddings: Number(row.supports_embeddings) === 1, supports_streaming: Number(row.supports_streaming) === 1,
    rate_limit_per_minute: row.rate_limit_per_minute == null ? null : Number(row.rate_limit_per_minute), timeout_ms: Number(row.timeout_ms ?? 10000),
    max_retries: Number(row.max_retries ?? 2), cooldown_seconds: Number(row.cooldown_seconds ?? 60), metadata: jsonObject(row.metadata_json), health,
  };
}

function healthFrom(value: string | null): ProviderHealth | undefined {
  if (!value) return undefined;
  try { return JSON.parse(value) as ProviderHealth; } catch { return undefined; }
}

export class ProviderRegistry {
  constructor(private readonly env: Env) {}

  async listProviders(): Promise<Array<Record<string, unknown>>> {
    const rows = await this.rows<Record<string, unknown>>(
      `SELECT p.id, p.name, p.display_name, p.base_url, p.adapter_type,
              p.api_key_required, p.is_enabled, p.priority, p.weight,
              p.supports_chat, p.supports_embeddings, p.supports_streaming,
              p.rate_limit_per_minute, p.timeout_ms, p.max_retries,
              p.cooldown_seconds, p.metadata_json, COUNT(pm.id) AS model_count
       FROM providers p
       LEFT JOIN provider_models pm
         ON pm.provider_id = p.id AND pm.is_enabled = 1 AND pm.is_deprecated = 0
       GROUP BY p.id
       ORDER BY p.priority DESC, p.weight DESC, p.name ASC`,
    );
    return Promise.all(rows.map(async (row) => {
      const id = String(row.id);
      const health = healthFrom(await this.env.BUDGETS.get(`provider:health:${id}`)) ?? healthFrom(await this.env.BUDGETS.get(`health:${id}`));
      return {
        id, name: String(row.name), display_name: String(row.display_name), base_url: String(row.base_url),
        adapter_type: String(row.adapter_type ?? 'openai-compatible'), api_key_required: Number(row.api_key_required) === 1,
        is_enabled: Number(row.is_enabled) === 1, priority: Number(row.priority ?? 0), weight: Number(row.weight ?? 1),
        supports_chat: Number(row.supports_chat) === 1, supports_embeddings: Number(row.supports_embeddings) === 1,
        supports_streaming: Number(row.supports_streaming) === 1, rate_limit_per_minute: row.rate_limit_per_minute == null ? null : Number(row.rate_limit_per_minute),
        timeout_ms: Number(row.timeout_ms ?? 10000), max_retries: Number(row.max_retries ?? 2), cooldown_seconds: Number(row.cooldown_seconds ?? 60),
        metadata: jsonObject(row.metadata_json), health: health ?? { status: 'unknown', timestamp: new Date().toISOString() },
        model_count: Number(row.model_count ?? 0),
      };
    }));
  }

  private async rows<T>(query: string, ...args: unknown[]): Promise<T[]> {
    if (!this.env.DB) return [];
    const result = await this.env.DB.prepare(query).bind(...args).all<T>();
    return result.results ?? [];
  }

  async getEnabledProviders(limit?: number, offset = 0): Promise<RegisteredProvider[]> {
    const paging = Number.isFinite(limit) ? ` LIMIT ${Math.max(1, Math.floor(limit as number))} OFFSET ${Math.max(0, Math.floor(offset))}` : '';
    const rows = await this.rows<Record<string, unknown>>(`SELECT * FROM providers WHERE is_enabled = 1 AND adapter_type != 'ai-horde' ORDER BY priority DESC, weight DESC, name ASC${paging}`);
    const providers: RegisteredProvider[] = [];
    for (const row of rows) {
      const id = String(row.id);
      const cached = healthFrom(await this.env.BUDGETS.get(`provider:health:${id}`)) ?? healthFrom(await this.env.BUDGETS.get(`health:${id}`));
      const provider = record(row, cached);
      const adapter = createProviderAdapter(this.env, provider);
      if (adapter) providers.push({ ...provider, adapter });
    }
    return providers;
  }

  async getEnabledProviderBatch(limit: number, afterName = ''): Promise<{ providers: RegisteredProvider[]; nextCursor: string; hasMore: boolean }> {
    const safeLimit = Math.max(1, Math.floor(limit));
    const rows = await this.rows<Record<string, unknown>>(
      `SELECT * FROM providers WHERE is_enabled = 1 AND adapter_type != 'ai-horde' AND name > ? ORDER BY name ASC LIMIT ${safeLimit + 1}`,
      afterName,
    );
    const page = rows.slice(0, safeLimit);
    const providers: RegisteredProvider[] = [];
    for (const row of page) {
      const id = String(row.id);
      const cached = healthFrom(await this.env.BUDGETS.get(`provider:health:${id}`)) ?? healthFrom(await this.env.BUDGETS.get(`health:${id}`));
      const provider = record(row, cached);
      const adapter = createProviderAdapter(this.env, provider);
      if (adapter) providers.push({ ...provider, adapter });
    }
    const lastName = page.length > 0 ? String(page[page.length - 1].name) : '';
    return { providers, nextCursor: rows.length > safeLimit ? lastName : '', hasMore: rows.length > safeLimit };
  }

  async getProvider(id: string): Promise<RegisteredProvider | null> {
    const rows = await this.rows<Record<string, unknown>>('SELECT * FROM providers WHERE id = ? LIMIT 1', id);
    if (!rows[0]) return null;
    const provider = record(rows[0], healthFrom(await this.env.BUDGETS.get(`provider:health:${id}`)) ?? healthFrom(await this.env.BUDGETS.get(`health:${id}`)));
    const adapter = createProviderAdapter(this.env, provider);
    return adapter ? { ...provider, adapter } : null;
  }

  async getProviderByName(name: string): Promise<RegisteredProvider | null> {
    const rows = await this.rows<Record<string, unknown>>("SELECT * FROM providers WHERE name = ? AND is_enabled = 1 AND adapter_type != 'ai-horde' LIMIT 1", name);
    return rows[0] ? this.getProvider(String(rows[0].id)) : null;
  }

  async hasEnabledProviderName(name: string): Promise<boolean> {
    return (await this.rows<Record<string, unknown>>("SELECT id FROM providers WHERE name = ? AND is_enabled = 1 AND adapter_type != 'ai-horde' LIMIT 1", name)).length > 0;
  }

  async isProviderEnabled(name: string): Promise<boolean> {
    return (await this.rows<Record<string, unknown>>('SELECT id FROM providers WHERE name = ? AND is_enabled = 1 LIMIT 1', name)).length > 0;
  }

  async getModels(providerId: string): Promise<Model[]> {
    const rows = await this.rows<Record<string, unknown>>(
      `SELECT pm.*, p.name AS provider_name, p.supports_chat, p.supports_embeddings, p.supports_streaming, p.priority AS provider_priority, p.weight AS provider_weight
       FROM provider_models pm JOIN providers p ON p.id = pm.provider_id
       WHERE pm.provider_id = ? AND pm.is_enabled = 1 AND pm.is_deprecated = 0 AND COALESCE(pm.last_synced_at, pm.created_at) >= datetime('now', '-30 days') ORDER BY pm.model_name`, providerId,
    );
    return rows.map((row) => this.model(row, providerId, String(row.provider_name ?? providerId)));
  }

  async getAllModels(): Promise<Model[]> {
    return (await this.getAllModelsResult()).models;
  }

  async getAllModelsResult(): Promise<{ models: Model[]; available: boolean }> {
    if (!this.env.DB) return { models: [], available: false };
    try {
      const result = await this.env.DB.prepare(
       `SELECT pm.*, p.name AS provider_name, p.supports_chat, p.supports_embeddings, p.supports_streaming, p.priority AS provider_priority, p.weight AS provider_weight
       FROM provider_models pm JOIN providers p ON p.id = pm.provider_id
       WHERE pm.is_enabled = 1 AND pm.is_deprecated = 0 AND p.is_enabled = 1 AND p.adapter_type != 'ai-horde' AND COALESCE(pm.last_synced_at, pm.created_at) >= datetime('now', '-30 days')
       ORDER BY p.priority DESC, p.weight DESC, pm.model_name`,
      ).bind().all<Record<string, unknown>>();
      const models = result.results.map((row) => this.model(row, String(row.provider_id), String(row.provider_name ?? row.provider_id)));
      return { models, available: true };
    } catch {
      return { models: [], available: false };
    }
  }

  private model(row: Record<string, unknown>, providerId: string, provider = providerId): Model {
    const metadata = jsonObject(row.metadata_json);
    const allowed = new Set<Capability>(['chat', 'vision', 'tools', 'embeddings', 'completion']);
    const capabilities: Capability[] = Array.isArray(metadata.capabilities)
      ? metadata.capabilities.filter((value): value is Capability => typeof value === 'string' && allowed.has(value as Capability))
      : ['chat', ...(Number(row.supports_embeddings) === 1 ? ['embeddings' as const] : [])];
    if (Number(row.supports_chat) === 0) capabilities.splice(0, capabilities.length, ...capabilities.filter((value) => value === 'embeddings'));
    if (Number(row.supports_embeddings) === 0) capabilities.splice(0, capabilities.length, ...capabilities.filter((value) => value !== 'embeddings'));
    const supportedParameters = Array.isArray(metadata.supported_parameters)
      ? metadata.supported_parameters.filter((value): value is string => typeof value === 'string')
      : ['stream', 'temperature', 'max_tokens'];
    const streamIndex = supportedParameters.indexOf('stream');
    if (Number(row.supports_streaming) === 0 && streamIndex >= 0) supportedParameters.splice(streamIndex, 1);
    const rawModelId = String(row.model_id ?? row.id);
    const prefix = publicModelPrefix(provider);
    const id = rawModelId.startsWith(`${prefix}/`) ? rawModelId : `${prefix}/${rawModelId}`;
    return {
      id, provider, capabilities, quality: Number(metadata.quality ?? 5), speed: Number(metadata.speed ?? 5),
      context: Number(row.context_window ?? metadata.context ?? 8192), supported_parameters: supportedParameters,
      provider_priority: Number(row.provider_priority ?? 0), provider_weight: Number(row.provider_weight ?? 1),
      ...(typeof metadata.family === 'string' ? { family: metadata.family } : {}),
    };
  }

  async refreshModels(providerId: string): Promise<void> {
    const provider = await this.getProvider(providerId);
    if (!provider || !this.env.DB) throw new Error(`provider not found: ${providerId}`);
    if (provider.name === 'ai-horde') throw new Error('AI Horde uses the legacy async adapter and cannot be dynamically refreshed.');
    const models = await provider.adapter.getModels();
    const prefix = publicModelPrefix(provider.name);
    const normalizedModels = models.map((model) => ({ model, modelId: model.id.startsWith(`${provider.name}/`) ? model.id.slice(provider.name.length + 1) : model.id.startsWith(`${prefix}/`) ? model.id.slice(prefix.length + 1) : model.id }));
    for (const { model, modelId } of normalizedModels) {
      const metadata = JSON.stringify({ capabilities: model.capabilities, quality: model.quality, speed: model.speed, supported_parameters: model.supported_parameters, ...(model.family ? { family: model.family } : {}) });
      await this.env.DB.prepare(
        `INSERT INTO provider_models (id, provider_id, model_id, model_name, model_display_name, context_window, metadata_json, is_deprecated, last_synced_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         ON CONFLICT(provider_id, model_id) DO UPDATE SET model_name = excluded.model_name, model_display_name = excluded.model_display_name, context_window = excluded.context_window, metadata_json = excluded.metadata_json, is_deprecated = 0, last_synced_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP`,
      ).bind(`${providerId}:${modelId}`, providerId, modelId, modelId, modelId, model.context, metadata).run();
    }
    if (models.length === 0) {
      await this.env.DB.prepare('UPDATE provider_models SET is_deprecated = 1, updated_at = CURRENT_TIMESTAMP WHERE provider_id = ?').bind(providerId).run();
      return;
    }
    const placeholders = normalizedModels.map(() => '?').join(', ');
    await this.env.DB.prepare(`UPDATE provider_models SET is_deprecated = 1, updated_at = CURRENT_TIMESTAMP WHERE provider_id = ? AND model_id NOT IN (${placeholders})`).bind(providerId, ...normalizedModels.map(({ modelId }) => modelId)).run();
  }

  async updateHealth(providerId: string, health: ProviderHealth): Promise<void> {
    await this.env.BUDGETS.put(`provider:health:${providerId}`, JSON.stringify(health), { expirationTtl: 300 });
    await this.env.BUDGETS.put(`health:${providerId}`, JSON.stringify({ status: health.status === 'down' ? 'unhealthy' : health.status, latency: health.latencyMs, checked_at: health.timestamp, checkedAt: health.timestamp }), { expirationTtl: 900 });
    const provider = await this.rows<{ name: string }>('SELECT name FROM providers WHERE id = ? LIMIT 1', providerId);
    if (provider[0]?.name && provider[0].name !== providerId) await this.env.BUDGETS.put(`health:${provider[0].name}`, JSON.stringify({ status: health.status === 'down' ? 'unhealthy' : health.status, latency: health.latencyMs, checked_at: health.timestamp, checkedAt: health.timestamp }), { expirationTtl: 900 });
    if (!this.env.DB) return;
    await this.env.DB.prepare('INSERT INTO provider_health_history (id, provider_id, status, latency_ms, success_rate, error_message, checked_at) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(crypto.randomUUID(), providerId, health.status, health.latencyMs ?? null, health.successRate ?? null, health.errorMessage ?? null, health.timestamp).run();
  }

  async recordUsage(providerId: string, stats: { success: boolean; latencyMs: number; tokens: number }): Promise<void> {
    if (!this.env.DB) return;
    const date = new Date().toISOString().split('T')[0];
    await this.env.DB.prepare(
      `INSERT INTO provider_daily_stats (id, provider_id, date, total_requests, successful_requests, failed_requests, total_tokens, avg_latency_ms)
       VALUES (?, ?, ?, 1, ?, ?, ?, ?)
       ON CONFLICT(provider_id, date) DO UPDATE SET total_requests = total_requests + 1, successful_requests = successful_requests + excluded.successful_requests, failed_requests = failed_requests + excluded.failed_requests, total_tokens = total_tokens + excluded.total_tokens, avg_latency_ms = ((avg_latency_ms * (total_requests - 1)) + excluded.avg_latency_ms) / total_requests`,
    ).bind(crypto.randomUUID(), providerId, date, stats.success ? 1 : 0, stats.success ? 0 : 1, stats.tokens, stats.latencyMs).run();
  }

  isHealthy(provider: RegisteredProvider): boolean { return !provider.health || provider.health.status !== 'down'; }
}
