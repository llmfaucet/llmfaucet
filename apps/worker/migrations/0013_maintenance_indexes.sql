CREATE INDEX IF NOT EXISTS idx_request_logs_created_at ON request_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_provider_health_history_checked_at ON provider_health_history(checked_at);
CREATE INDEX IF NOT EXISTS idx_daily_stats_day ON daily_stats(day);
CREATE INDEX IF NOT EXISTS idx_provider_daily_stats_date ON provider_daily_stats(date);
