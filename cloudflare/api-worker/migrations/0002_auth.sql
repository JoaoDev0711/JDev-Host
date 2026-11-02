CREATE TABLE IF NOT EXISTS setup_keys (
  id TEXT PRIMARY KEY,
  token_hash TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  used_at TEXT
);
CREATE TABLE IF NOT EXISTS auth_tokens (
  token_hash TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  revoked_at TEXT
);
INSERT OR IGNORE INTO setup_keys (id, token_hash, created_at, used_at)
VALUES ('initial-panel-claim', '43a06f53067f920b9f75be90a080759a5cf8f1ac33cc567270b382a3f959edc8', CURRENT_TIMESTAMP, NULL);
