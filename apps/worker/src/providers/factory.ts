import type { ProviderRecord } from '@llmfaucet/types';
import type { Env } from '../types';
import { AdapterConfig, ProviderAdapter } from './base';
import { AIHordeAdapter, LLM7Adapter, OpenAICompatibleAdapter, OVHAdapter, OpenCodeZenAdapter, PollinationsAdapter } from './adapters';

const adapters: Record<string, new (env: Env, config: AdapterConfig) => ProviderAdapter> = {
  pollinations: PollinationsAdapter,
  llm7: LLM7Adapter,
  ovh: OVHAdapter,
  'ai-horde': AIHordeAdapter,
  'opencode-zen': OpenCodeZenAdapter,
  'openai-compatible': OpenAICompatibleAdapter,
};

// Keep remote catalogs constrained to provider names with an adapter that is
// actually shipped by the Worker. A catalog entry must never make routing
// attempt an arbitrary upstream just because its name is well-formed.
export const SUPPORTED_CATALOG_PROVIDERS = new Set([
  'pollinations',
  'llm7',
  'ovh',
  'ai-horde',
  'opencode-zen',
  'opencode',
]);

export function createProviderAdapter(env: Env, provider: ProviderRecord): ProviderAdapter | null {
  const Adapter = adapters[provider.adapter_type];
  if (!Adapter) return null;
  try { return new Adapter(env, { id: provider.name, name: provider.display_name, baseURL: provider.base_url, timeoutMs: provider.timeout_ms, apiKeyRequired: provider.api_key_required, apiKeyHeader: provider.api_key_header, apiKeySecretRef: provider.api_key_secret_ref }); } catch { return null; }
}
