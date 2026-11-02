CREATE TABLE IF NOT EXISTS servers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  config_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'stopped' CHECK (status IN ('stopped','queued','starting','running','stopping','error')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS devices (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  last_seen TEXT,
  revoked_at TEXT
);
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  command TEXT NOT NULL CHECK (command IN ('start','stop','restart','install')),
  server_id TEXT NOT NULL,
  payload_json TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','claimed','done','failed')),
  claimed_by TEXT,
  claimed_at TEXT,
  created_at TEXT NOT NULL,
  finished_at TEXT,
  result TEXT,
  FOREIGN KEY (server_id) REFERENCES servers(id)
);
CREATE TABLE IF NOT EXISTS logs (
  id TEXT PRIMARY KEY,
  server_id TEXT,
  level TEXT NOT NULL DEFAULT 'info',
  message TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (server_id) REFERENCES servers(id)
);
CREATE TABLE IF NOT EXISTS runtime_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  active_server_id TEXT,
  updated_at TEXT NOT NULL
);
INSERT OR IGNORE INTO runtime_state (id, active_server_id, updated_at) VALUES (1, NULL, CURRENT_TIMESTAMP);
CREATE INDEX IF NOT EXISTS idx_tasks_queue ON tasks(status, created_at);
CREATE INDEX IF NOT EXISTS idx_logs_server ON logs(server_id, created_at);