-- Serialize scheduled maintenance without relying on eventually consistent KV.
CREATE TABLE IF NOT EXISTS worker_maintenance_leases (
  name TEXT PRIMARY KEY,
  holder TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_worker_maintenance_leases_expiry
  ON worker_maintenance_leases(expires_at);
