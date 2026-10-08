CREATE TABLE IF NOT EXISTS players (
  address    TEXT PRIMARY KEY,         -- lowercase wallet address
  name       TEXT NOT NULL,            -- Glyph username (sanitised)
  picture    TEXT NOT NULL DEFAULT '', -- Glyph profile picture (https only)
  x_handle   TEXT,                     -- X @handle from Sign in with X (verified by X); shown as the player's name
  x_id       TEXT,                     -- X numeric account id (one X account per wallet)
  glyph_name TEXT,                     -- the name Glyph reported
  last_ip    TEXT,                     -- IP address at the last sign-in
  updated_at INTEGER NOT NULL
);

-- one row per player per week; filled ONLY by verified (server-replayed) runs
CREATE TABLE IF NOT EXISTS scores (
  address     TEXT NOT NULL,
  week        INTEGER NOT NULL,        -- weeks since the game epoch (matches the front end)
  run_best    INTEGER NOT NULL DEFAULT 0,
  coins_total INTEGER NOT NULL DEFAULT 0,   -- $TMF collected in verified runs this week
  runs        INTEGER NOT NULL DEFAULT 0,
  updated_at  INTEGER NOT NULL,
  PRIMARY KEY (address, week)
);
CREATE INDEX IF NOT EXISTS idx_scores_run   ON scores (week, run_best DESC);
CREATE INDEX IF NOT EXISTS idx_scores_coins ON scores (week, coins_total DESC);

-- a run in progress, or finished: the seed is chosen by the server, the replay state is kept between chunks
CREATE TABLE IF NOT EXISTS runs (
  id         TEXT PRIMARY KEY,
  address    TEXT NOT NULL,
  seed       INTEGER NOT NULL,
  wallet     INTEGER NOT NULL DEFAULT 0,
  started_at INTEGER NOT NULL,
  last_tick  INTEGER NOT NULL DEFAULT 0,
  seq        INTEGER NOT NULL DEFAULT 0,
  snapshot   TEXT,
  stats      TEXT,                              -- timing statistics for the bot check
  status     TEXT NOT NULL DEFAULT 'open',      -- open | done | held | released | rejected | abandoned
  flags      TEXT,                              -- why a run was held for review
  score      INTEGER,
  coins      INTEGER,
  dist       INTEGER,
  ended_at   INTEGER
);
CREATE INDEX IF NOT EXISTS idx_runs_addr   ON runs (address, status);
CREATE INDEX IF NOT EXISTS idx_runs_status ON runs (status, ended_at);

-- wallets that are blocked from the leaderboard
CREATE TABLE IF NOT EXISTS bans (
  address TEXT PRIMARY KEY,
  reason  TEXT,
  at      INTEGER NOT NULL
);

-- short-lived cache of on-chain holdings checks, so a busy launch doesn't hammer the public RPC servers
CREATE TABLE IF NOT EXISTS holdings (
  address TEXT NOT NULL,
  gate    TEXT NOT NULL,
  held    INTEGER NOT NULL,
  expires INTEGER NOT NULL,
  PRIMARY KEY (address, gate)
);

-- anonymous visitor counter (random browser id + the approximate place Cloudflare reports)
CREATE TABLE IF NOT EXISTS visitors (
  id         TEXT PRIMARY KEY,
  first_seen INTEGER NOT NULL,
  last_seen  INTEGER NOT NULL,
  visits     INTEGER NOT NULL DEFAULT 1,
  ip         TEXT,
  country    TEXT,
  city       TEXT,
  lat        REAL,
  lon        REAL
);
CREATE INDEX IF NOT EXISTS idx_visitors_seen ON visitors (last_seen);

-- most recent visits (trimmed to the last 2000)
CREATE TABLE IF NOT EXISTS hits (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  ts      INTEGER NOT NULL,
  vid     TEXT,
  ip      TEXT,
  country TEXT,
  city    TEXT
);

-- wrong admin passwords, to lock out guessing
CREATE TABLE IF NOT EXISTS admin_fails (
  ip    TEXT PRIMARY KEY,
  n     INTEGER NOT NULL,
  at    INTEGER NOT NULL,
  until INTEGER NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_players_xid ON players (x_id) WHERE x_id IS NOT NULL;
