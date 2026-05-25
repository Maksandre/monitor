CREATE TABLE IF NOT EXISTS channels (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  notifierType TEXT NOT NULL,
  config TEXT NOT NULL,
  createdAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS monitors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sourceType TEXT NOT NULL,
  config TEXT NOT NULL,
  channelId TEXT,
  pollIntervalSec INTEGER NOT NULL DEFAULT 120,
  enabled INTEGER NOT NULL DEFAULT 1,
  baselined INTEGER NOT NULL DEFAULT 0,
  lastPolledAt TEXT,
  lastError TEXT,
  errorCount INTEGER NOT NULL DEFAULT 0,
  state TEXT NOT NULL DEFAULT '{}',
  createdAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  monitorId TEXT NOT NULL,
  dedupeKey TEXT NOT NULL,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  payload TEXT NOT NULL,
  seenAt TEXT NOT NULL,
  UNIQUE (monitorId, dedupeKey)
);

CREATE TABLE IF NOT EXISTS alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  monitorId TEXT NOT NULL,
  eventId INTEGER NOT NULL,
  channelId TEXT,
  status TEXT NOT NULL,
  error TEXT,
  sentAt TEXT NOT NULL
);
