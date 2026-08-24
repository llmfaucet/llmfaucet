CREATE TABLE IF NOT EXISTS user_preferences (
  user_id TEXT PRIMARY KEY,
  theme TEXT NOT NULL DEFAULT 'system' CHECK (theme IN ('system', 'light', 'dark')),
  default_model_selector TEXT NOT NULL DEFAULT 'auto' CHECK (default_model_selector IN ('auto', 'auto:fast', 'auto:smart', 'auto:coding')),
  primary_workflow TEXT,
  onboarding_completed_at TEXT,
  onboarding_dismissed_at TEXT,
  onboarding_version TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
