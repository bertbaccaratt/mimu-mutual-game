CREATE TABLE IF NOT EXISTS players (
  address    TEXT PRIMARY KEY,         -- lowercase wallet address
  name       TEXT NOT NULL,            -- Glyph username (sanitised)
  picture    TEXT NOT NULL DEFAULT '', -- Glyph profile picture (https only)
  x_handle   TEXT,                     -- X @handle from Sign in with X (verified by X); shown as the player's name
  x_id       TEXT,                     -- X numeric account id (one X account per wallet)
  glyph_name TEXT,                     -- the name Glyph reported
  updated_at INTEGER NOT NULL
);

-- one row per player per week; filled ONLY by verified (server-replayed) runs
CREATE TABLE IF NOT EXISTS scores (
  address     TEXT NOT NULL,
  week        INTEGER NOT NULL,        -- weeks since the game epoch (matches the front end)
  run_best    INTEGER NOT NULL DEFAULT 0,
  boost       INTEGER NOT NULL DEFAULT 0,   -- points added by $TMF given to a top-9 runner
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
  ended_at   INTEGER,
  last_beat  INTEGER,                       -- last live ping from the game while the run is in progress (display only)
  live_score INTEGER,
  live_dist  INTEGER,
  live_coins INTEGER
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

-- anonymous visitor counter: a random browser id and times only (no IP address, no location)
CREATE TABLE IF NOT EXISTS visitors (
  id         TEXT PRIMARY KEY,
  first_seen INTEGER NOT NULL,
  last_seen  INTEGER NOT NULL,
  visits     INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX IF NOT EXISTS idx_visitors_seen ON visitors (last_seen);

-- wrong admin passwords, to lock out guessing (the key is a one-way keyed hash, never an address)
CREATE TABLE IF NOT EXISTS admin_fails (
  ip    TEXT PRIMARY KEY,
  n     INTEGER NOT NULL,
  at    INTEGER NOT NULL,
  until INTEGER NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_players_xid ON players (x_id) WHERE x_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_players_xhandle ON players (lower(x_handle)) WHERE x_handle IS NOT NULL;

-- $TMF sent between players in the Top 9 app
CREATE TABLE IF NOT EXISTS transfers (id INTEGER PRIMARY KEY AUTOINCREMENT, ts INTEGER NOT NULL, week INTEGER NOT NULL, sender TEXT NOT NULL, recipient TEXT NOT NULL, amount INTEGER NOT NULL, boost INTEGER NOT NULL DEFAULT 0);

-- uploaded profile picture (small JPEG/PNG/WebP, stored as 'mime|base64')
-- (existing databases: ALTER TABLE players ADD COLUMN avatar TEXT)

-- player-to-player texts and blocks (Messages app)
CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, ts INTEGER NOT NULL, sender TEXT NOT NULL, recipient TEXT NOT NULL, body TEXT NOT NULL, read INTEGER NOT NULL DEFAULT 0);
CREATE INDEX IF NOT EXISTS idx_msg_rcpt ON messages (recipient, read);
CREATE INDEX IF NOT EXISTS idx_msg_pair ON messages (sender, recipient, id);
CREATE TABLE IF NOT EXISTS blocks (blocker TEXT NOT NULL, blocked TEXT NOT NULL, PRIMARY KEY (blocker, blocked));

-- Mimu Mail: emails the admin sends to every Glyph-signed-in phone (img = 'mime|base64')
CREATE TABLE IF NOT EXISTS broadcasts (id INTEGER PRIMARY KEY AUTOINCREMENT, ts INTEGER NOT NULL, subject TEXT NOT NULL, body TEXT NOT NULL, img TEXT, ikey TEXT);
CREATE UNIQUE INDEX IF NOT EXISTS idx_broadcasts_ikey ON broadcasts (ikey) WHERE ikey IS NOT NULL;
CREATE TABLE IF NOT EXISTS mail_reads (address TEXT NOT NULL, id INTEGER NOT NULL, PRIMARY KEY (address, id));
