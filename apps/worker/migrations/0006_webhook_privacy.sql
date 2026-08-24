ALTER TABLE webhook_events ADD COLUMN github_id TEXT;
CREATE INDEX IF NOT EXISTS idx_webhook_events_github_id ON webhook_events(github_id);
UPDATE webhook_events SET payload_json = '{}', github_id = NULL WHERE github_id IS NULL;
