CREATE TABLE IF NOT EXISTS players (
  address    TEXT PRIMARY KEY,         -- lowercase wallet address
  name       TEXT NOT NULL,            -- Glyph username (sanitised)
  picture    TEXT NOT NULL DEFAULT '', -- Glyph profile picture (https only)
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS scores (
  address    TEXT NOT NULL,
  week       INTEGER NOT NULL,         -- weeks since the game epoch (matches the front end)
  run_best   INTEGER NOT NULL DEFAULT 0,
  nw_best    INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (address, week)
);

CREATE INDEX IF NOT EXISTS idx_scores_run ON scores (week, run_best DESC);
CREATE INDEX IF NOT EXISTS idx_scores_nw  ON scores (week, nw_best DESC);
