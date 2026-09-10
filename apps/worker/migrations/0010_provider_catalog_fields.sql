-- Optional catalog metadata for future provider types. Existing runtime fields
-- remain authoritative; these columns are populated only by trusted catalog
-- synchronization and are nullable where a provider cannot report them.
ALTER TABLE providers ADD COLUMN supports_completions INTEGER NOT NULL DEFAULT 0;
ALTER TABLE providers ADD COLUMN category TEXT;
ALTER TABLE providers ADD COLUMN homepage_url TEXT;
ALTER TABLE providers ADD COLUMN docs_url TEXT;
ALTER TABLE providers ADD COLUMN status_page_url TEXT;
ALTER TABLE providers ADD COLUMN max_context_window INTEGER;
ALTER TABLE providers ADD COLUMN max_output_tokens INTEGER;
ALTER TABLE providers ADD COLUMN supports_vision INTEGER NOT NULL DEFAULT 0;
ALTER TABLE providers ADD COLUMN supports_function_calling INTEGER NOT NULL DEFAULT 0;
ALTER TABLE providers ADD COLUMN supports_json_mode INTEGER NOT NULL DEFAULT 0;
ALTER TABLE providers ADD COLUMN input_cost_per_1m_tokens REAL;
ALTER TABLE providers ADD COLUMN output_cost_per_1m_tokens REAL;
ALTER TABLE providers ADD COLUMN uptime_percentage REAL;
ALTER TABLE providers ADD COLUMN avg_latency_ms REAL;
ALTER TABLE providers ADD COLUMN success_rate_percentage REAL;

ALTER TABLE provider_models ADD COLUMN model_family TEXT;
ALTER TABLE provider_models ADD COLUMN supports_completions INTEGER NOT NULL DEFAULT 0;
ALTER TABLE provider_models ADD COLUMN supports_embeddings INTEGER NOT NULL DEFAULT 0;
ALTER TABLE provider_models ADD COLUMN supports_vision INTEGER NOT NULL DEFAULT 0;
ALTER TABLE provider_models ADD COLUMN supports_function_calling INTEGER NOT NULL DEFAULT 0;
ALTER TABLE provider_models ADD COLUMN supports_json_mode INTEGER NOT NULL DEFAULT 0;
ALTER TABLE provider_models ADD COLUMN supports_streaming INTEGER NOT NULL DEFAULT 1;
ALTER TABLE provider_models ADD COLUMN avg_latency_ms REAL;
ALTER TABLE provider_models ADD COLUMN tokens_per_second REAL;
ALTER TABLE provider_models ADD COLUMN is_featured INTEGER NOT NULL DEFAULT 0;

ALTER TABLE provider_health_history ADD COLUMN error_type TEXT;
ALTER TABLE provider_daily_stats ADD COLUMN total_input_tokens INTEGER NOT NULL DEFAULT 0;
ALTER TABLE provider_daily_stats ADD COLUMN total_output_tokens INTEGER NOT NULL DEFAULT 0;
ALTER TABLE provider_daily_stats ADD COLUMN p50_latency_ms REAL;
