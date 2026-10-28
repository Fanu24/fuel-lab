-- Accesso dedicato al pannello: password e token restano sempre sul server.
CREATE TABLE IF NOT EXISTS admin_access_credentials (
  id TEXT PRIMARY KEY CHECK(id = 'matteo'),
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1 CHECK(enabled IN (0, 1)),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin_access_sessions (
  token_hash TEXT PRIMARY KEY,
  credential_id TEXT NOT NULL REFERENCES admin_access_credentials(id) ON DELETE CASCADE,
  credential_hash TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS admin_access_sessions_expiry ON admin_access_sessions(expires_at);

CREATE TABLE IF NOT EXISTS admin_access_attempts (
  address_hash TEXT NOT NULL,
  window_start INTEGER NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY(address_hash, window_start)
);
