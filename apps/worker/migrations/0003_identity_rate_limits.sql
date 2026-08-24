CREATE TABLE IF NOT EXISTS entitlements (user_id TEXT PRIMARY KEY, plan TEXT NOT NULL DEFAULT 'registered', requests_per_day INTEGER NOT NULL DEFAULT 50, queue_priority INTEGER NOT NULL DEFAULT 10, sponsorable_login TEXT, github_tier_id TEXT, github_tier_name TEXT, sponsorship_status TEXT NOT NULL DEFAULT 'none', expires_at TEXT, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id));
CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, session_hash TEXT NOT NULL UNIQUE, expires_at TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, revoked_at TEXT, FOREIGN KEY (user_id) REFERENCES users(id));
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE TABLE IF NOT EXISTS audit_events (id TEXT PRIMARY KEY, user_id TEXT, event_type TEXT NOT NULL, metadata_json TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id));
ALTER TABLE users ADD COLUMN status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE users ADD COLUMN last_seen_at TEXT;
