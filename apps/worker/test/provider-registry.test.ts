import assert from 'node:assert/strict';
import { adminProviders } from '../src/admin-providers';
import { ProviderRegistry } from '../src/services/provider-registry';
import { selectModel } from '../src/router';
import { catalog, unhealthyProviders } from '../src/state';
import { mergeModels } from '../src/state';
import type { Model } from '../src/types';

class MemoryKV {
  data = new Map<string, string>();
  async get(key: string): Promise<string | null>;
  async get(key: string, type: 'json'): Promise<object | null>;
  async get(key: string, type?: string): Promise<string | object | null> {
    const value = this.data.get(key) ?? null;
    return type === 'json' && value ? JSON.parse(value) : value;
  }
  async put(key: string, value: string): Promise<void> { this.data.set(key, value); }
}

const providerRow = {
  id: 'uuid-123', name: 'dynamic-provider', display_name: 'Dynamic Provider', base_url: 'https://api.llm7.io',
  adapter_type: 'openai-compatible', api_key_required: 1, api_key_header: 'authorization', api_key_secret_ref: 'PROVIDER_DYNAMIC_KEY',
  is_enabled: 1, priority: 90, weight: 1, supports_chat: 1, supports_embeddings: 0, supports_streaming: 1,
  timeout_ms: 10000, max_retries: 2, cooldown_seconds: 60, metadata_json: '{}', model_count: 1,
};
const providerModel = {
  id: 'uuid-123:model-a', provider_id: 'uuid-123', model_id: 'model-a', model_name: 'model-a', model_display_name: 'model-a',
  context_window: 8192, metadata_json: JSON.stringify({ capabilities: ['chat'], supported_parameters: ['stream', 'temperature', 'max_tokens'] }),
  is_enabled: 1, is_deprecated: 0, last_synced_at: '2026-08-25 00:00:00', created_at: '2026-08-25 00:00:00',
  provider_name: 'dynamic-provider', supports_chat: 1, supports_embeddings: 0, supports_streaming: 1, provider_priority: 90, provider_weight: 1,
};

const executed: string[] = [];
const db = {
  prepare(sql: string) {
    executed.push(sql);
    return {
      bind(..._args: unknown[]) {
        return {
          async all<T>() {
            if (sql.includes('COUNT(pm.id)')) return { results: [providerRow] as T[] };
            if (sql.includes('FROM providers WHERE id')) return { results: [providerRow] as T[] };
            if (sql.includes('FROM providers')) return { results: [providerRow] as T[] };
            if (sql.includes('FROM provider_models')) return { results: [providerModel] as T[] };
            return { results: [] as T[] };
          },
          async first<T>() { return sql.includes('FROM providers') ? providerRow as T : null; },
          async run() { return { meta: { changes: 1 } }; },
        };
      },
    };
  },
} as any;

const kv = new MemoryKV();
const env = { DB: db, BUDGETS: kv, ENVIRONMENT: 'test', PROVIDER_EGRESS_ALLOWLIST: 'https://api.llm7.io', PROVIDER_DYNAMIC_KEY: 'secret-value' } as any;
const registry = new ProviderRegistry(env);

assert.equal((await registry.getProviderByName('dynamic-provider'))?.id, 'uuid-123');

const listed = await registry.listProviders();
assert.equal(listed.length, 1);
assert.equal(listed[0].name, 'dynamic-provider');
assert.equal('api_key_secret_ref' in listed[0], false);
assert.equal('adapter' in listed[0], false);

await registry.updateHealth('dynamic-provider', { status: 'healthy', latencyMs: 42, timestamp: '2026-08-25T00:00:00.000Z' });
assert.equal(JSON.parse(await kv.get('provider:health:dynamic-provider') ?? '{}').latencyMs, 42);
assert.equal(JSON.parse(await kv.get('health:dynamic-provider') ?? '{}').status, 'healthy');
assert.ok(executed.some((sql) => sql.includes('provider_health_history')));

const dynamicModel: Model = {
  id: 'dynamic-provider/model-a', provider: 'dynamic-provider', capabilities: ['chat'], quality: 9, speed: 9,
  context: 8192, supported_parameters: ['stream', 'temperature', 'max_tokens'],
};
assert.equal((await catalog(env))[0].provider, 'dynamic-provider');
assert.equal(selectModel({ model: 'auto', selector: 'auto', messages: [], stream: false, capability: 'chat', raw: {} }, new Set(), [dynamicModel])?.id, dynamicModel.id);
assert.equal(mergeModels([dynamicModel], [{ ...dynamicModel, quality: 10 }])[0].quality, 10);
kv.data.set('health:dynamic-provider', JSON.stringify({ status: 'unhealthy', checked_at: Date.now() }));
assert.equal((await unhealthyProviders(env)).has('dynamic-provider'), true);

const unauthorized = await adminProviders(new Request('https://api.test/api/admin/providers'), env, '/api/admin/providers');
assert.equal(unauthorized.status, 401);
console.log('provider registry contract tests passed');
