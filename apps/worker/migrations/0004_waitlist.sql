CREATE TABLE IF NOT EXISTS waitlist_applications (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  github_id TEXT,
  github_login TEXT NOT NULL,
  email TEXT,
  primary_tool TEXT NOT NULL,
  primary_use_case TEXT NOT NULL,
  tester_goal TEXT NOT NULL,
  expected_request_volume TEXT,
  operating_systems_json TEXT NOT NULL DEFAULT '[]',
  bug_report_readiness TEXT NOT NULL,
  agreement_accepted_at TEXT NOT NULL,
  privacy_accepted_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','reviewing','approved','waitlisted','rejected','revoked')),
  reviewer_notes TEXT,
  reviewed_by_user_id TEXT,
  reviewed_at TEXT,
  invitation_sent_at TEXT,
  invited_at TEXT,
  preview_key_id TEXT,
  preview_access_expires_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (preview_key_id) REFERENCES api_keys(id)
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_waitlist_github_login_unique ON waitlist_applications(github_login);
CREATE INDEX IF NOT EXISTS idx_waitlist_status_created ON waitlist_applications(status, created_at);
CREATE TABLE IF NOT EXISTS waitlist_events (
  id TEXT PRIMARY KEY,
  application_id TEXT NOT NULL,
  actor_user_id TEXT,
  event_type TEXT NOT NULL,
  metadata_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (application_id) REFERENCES waitlist_applications(id),
  FOREIGN KEY (actor_user_id) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_waitlist_events_application ON waitlist_events(application_id, created_at);
