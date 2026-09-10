-- Dynamic provider registry.
-- 0006-0008 are already used by applied migrations in this repository; this
-- migration intentionally uses the next number to avoid replacing history.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS providers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  base_url TEXT NOT NULL,
  adapter_type TEXT NOT NULL DEFAULT 'openai-compatible',
  api_key_header TEXT,
  api_key_secret_ref TEXT,
  api_key_required INTEGER NOT NULL DEFAULT 0 CHECK (api_key_required IN (0, 1)),
  is_enabled INTEGER NOT NULL DEFAULT 1 CHECK (is_enabled IN (0, 1)),
  priority INTEGER NOT NULL DEFAULT 0,
  weight REAL NOT NULL DEFAULT 1.0 CHECK (weight >= 0),
  supports_chat INTEGER NOT NULL DEFAULT 1 CHECK (supports_chat IN (0, 1)),
  supports_embeddings INTEGER NOT NULL DEFAULT 0 CHECK (supports_embeddings IN (0, 1)),
  supports_streaming INTEGER NOT NULL DEFAULT 1 CHECK (supports_streaming IN (0, 1)),
  rate_limit_per_minute INTEGER,
  timeout_ms INTEGER NOT NULL DEFAULT 10000 CHECK (timeout_ms > 0),
  max_retries INTEGER NOT NULL DEFAULT 2 CHECK (max_retries >= 0),
  cooldown_seconds INTEGER NOT NULL DEFAULT 60 CHECK (cooldown_seconds >= 0),
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS provider_models (
  id TEXT PRIMARY KEY,
  provider_id TEXT NOT NULL,
  model_id TEXT NOT NULL,
  model_name TEXT NOT NULL,
  model_display_name TEXT,
  context_window INTEGER,
  max_output_tokens INTEGER,
  input_cost_per_1m REAL,
  output_cost_per_1m REAL,
  is_enabled INTEGER NOT NULL DEFAULT 1 CHECK (is_enabled IN (0, 1)),
  is_deprecated INTEGER NOT NULL DEFAULT 0 CHECK (is_deprecated IN (0, 1)),
  metadata_json TEXT NOT NULL DEFAULT '{}',
  last_synced_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE,
  UNIQUE (provider_id, model_id)
);

CREATE TABLE IF NOT EXISTS provider_health_history (
  id TEXT PRIMARY KEY,
  provider_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('healthy', 'degraded', 'down')),
  latency_ms INTEGER,
  success_rate REAL,
  error_message TEXT,
  checked_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS provider_daily_stats (
  id TEXT PRIMARY KEY,
  provider_id TEXT NOT NULL,
  date TEXT NOT NULL,
  total_requests INTEGER NOT NULL DEFAULT 0,
  successful_requests INTEGER NOT NULL DEFAULT 0,
  failed_requests INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER NOT NULL DEFAULT 0,
  avg_latency_ms REAL,
  p95_latency_ms REAL,
  p99_latency_ms REAL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE,
  UNIQUE (provider_id, date)
);

CREATE INDEX IF NOT EXISTS idx_providers_enabled ON providers(is_enabled);
CREATE INDEX IF NOT EXISTS idx_providers_priority ON providers(priority DESC, weight DESC);
CREATE INDEX IF NOT EXISTS idx_provider_models_lookup ON provider_models(provider_id, is_enabled);
CREATE INDEX IF NOT EXISTS idx_provider_models_active ON provider_models(is_enabled, is_deprecated);
CREATE INDEX IF NOT EXISTS idx_provider_health_history ON provider_health_history(provider_id, checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_provider_daily_stats ON provider_daily_stats(provider_id, date DESC);

-- IDs and names intentionally match the existing static catalog. The inserts
-- are idempotent so preview/production migrations can be retried safely.
INSERT INTO providers (id, name, display_name, base_url, adapter_type, is_enabled, priority, weight, supports_embeddings, timeout_ms)
VALUES
  ('pollinations', 'pollinations', 'Pollinations', 'https://text.pollinations.ai/openai', 'pollinations', 1, 100, 1.0, 0, 15000),
  ('llm7', 'llm7', 'LLM7', 'https://api.llm7.io/v1/chat/completions', 'openai-compatible', 1, 90, 1.0, 0, 10000),
  ('opencode-zen', 'opencode-zen', 'OpenCode Zen', 'https://opencode.ai/zen/v1/chat/completions', 'openai-compatible', 1, 80, 1.0, 0, 10000),
  ('ovh', 'ovh', 'OVHcloud AI', 'https://oai.endpoints.kepler.ai.cloud.ovh.net/v1/chat/completions', 'ovh', 1, 70, 1.0, 1, 10000),
  ('ai-horde', 'ai-horde', 'AI Horde', 'https://aihorde.net/api/v2/generate/async', 'ai-horde', 1, 60, 0.8, 0, 30000)
ON CONFLICT (name) DO NOTHING;

-- Model rows are deliberately not fabricated here. The probe synchronizes the
-- provider's authoritative `/v1/models` response and records its timestamp.
