export type ProviderHealthState = 'healthy' | 'degraded' | 'down';
export type ProviderCapability = 'chat' | 'vision' | 'tools' | 'embeddings' | 'completion';

export interface ProviderHealth {
  status: ProviderHealthState;
  latencyMs?: number;
  successRate?: number;
  errorMessage?: string;
  timestamp: string;
}

export interface ProviderRecord {
  id: string;
  name: string;
  display_name: string;
  base_url: string;
  adapter_type: string;
  api_key_required: boolean;
  api_key_header?: string | null;
  api_key_secret_ref?: string | null;
  is_enabled: boolean;
  priority: number;
  weight: number;
  supports_chat: boolean;
  supports_embeddings: boolean;
  supports_streaming: boolean;
  rate_limit_per_minute?: number | null;
  timeout_ms: number;
  max_retries: number;
  cooldown_seconds: number;
  metadata?: Record<string, unknown>;
  health?: ProviderHealth;
}

export interface ProviderModel {
  id: string;
  provider_id: string;
  provider: string;
  model_name: string;
  capabilities: ProviderCapability[];
  quality: number;
  speed: number;
  context: number;
  supported_parameters: string[];
  model_display_name?: string | null;
  max_output_tokens?: number | null;
  input_cost_per_1m?: number | null;
  output_cost_per_1m?: number | null;
  is_enabled: boolean;
  is_deprecated: boolean;
  metadata?: Record<string, unknown>;
  last_synced_at?: string | null;
}

export interface ProviderRegistrationInput {
  name: string;
  displayName: string;
  baseURL: string;
  adapterType?: string;
  apiKeyRequired?: boolean;
  apiKeySecretRef?: string;
  isEnabled?: boolean;
  priority?: number;
  weight?: number;
  capabilities?: ProviderCapability[];
  timeoutMs?: number;
}
