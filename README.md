# Chair Run × Mutual Mimu

A collab game and landing page by **MIMU ON APE** × **THEMUTUAL.FUN**, built by Bert Baccaratt.

A phone lies on a wood desk, and the phone is the game: Chair Run (a pseudo-3D runner), Mutual Mimu (stake, vote and a closing bell every 4h 20m), Leaderboards, Season Vault, Top 5, plus Phone, Messages, Camera and Settings.

## Run it locally

It is a static site: one `index.html` plus `assets/`. Serve the folder with any static server, for example:

```
python -m http.server 8765
```

then open http://localhost:8765/.

## Layout

- `index.html` — the whole site and game (HTML, CSS, JS)
- `assets/` — desk, props and character images
- `assets/source/` — original source images (kept locally, not in the repo)
- `tools/render-lab/` — the offline tools used to build the photoreal desk props

Game progress is saved in the visitor's browser (`localStorage`). The back end comes later.

## Back end (leaderboards + Glyph sign-in)

- `glyph/` builds `assets/glyph-connect.js`, a small bridge around Glyph's React wallet kit. It is only loaded when someone opens Chair Run. Rebuild with `cd glyph && npm install && npm run build`.
  This Glyph Code is licensed by Yuga Labs, Inc. and may only be used in accordance with the Glyph Software License v1.0 published at https://useglyph.io/license (copy in `glyph/GLYPH-LICENSE.txt`).
- `backend/` is a Cloudflare Worker + D1 database (API at https://mimu-mutual-api.mutualmimu.workers.dev):
  `GET /api/nonce`, `POST /api/auth` (wallet signature + holdings check), `POST /api/score`, `GET /api/leaderboard`.
  Holdings rules live in `backend/wrangler.toml` (`GATE_MIMU`, `GATE_PASS`, `GATE_DENGS`) and in `GAME_CONFIG.gates` in `index.html`.
  Deploy with `cd backend && npx wrangler deploy`. Check it with `node test-local.mjs <url>`.
- Rules: a wallet must hold a Mimu On Ape; a wallet holding a TMF Pass or a Dengs can't play. The TMF Pass rule is off until its chain is confirmed.
### How scores are kept honest

The browser never sends a score. The game logic lives in `assets/sim.js` (pure, deterministic: seeded random numbers and fixed 1/60 s ticks). A run goes like this:

1. `POST /api/run/start`: the server picks the random seed and opens the run.
2. You play. The game records only your inputs (tick number + move).
3. `POST /api/run/chunk` (in chunks of 2,000 ticks): the server replays the same `sim.js` from the seed and your inputs, keeps the replay state in D1 between chunks, and refuses runs that are faster than real time. The score it computes is the score that counts.

`node backend/test-sim.mjs` checks the determinism and `node backend/test-run.mjs <url>` runs the whole flow against a deployed API (use the staging worker, which has the holdings rules switched off).
Remaining risk: a bot that really plays the game in real time is still possible; the server can't tell a robot from a person.

### Wallet safety

- The only thing a wallet is ever asked to sign is a plain-English sign-in message that names this site (`Domain:` line), costs nothing and sends no transaction. The bridge in `glyph/src/entry.jsx` refuses to sign any other text and exposes no transaction, approval or typed-data calls.
- The server only accepts that message for its allowed origins, so a copy-cat site can't use a signature it collects.
- Sessions are 12-hour tokens kept in memory only (never in localStorage).
- The page sets a Content-Security-Policy that blocks scripts from other sites, and refuses to be framed.
- Rate limits: sign-in 10/min per IP, runs 120/min per player, leaderboard reads 120/min per IP (Cloudflare Workers Rate Limiting bindings in `backend/wrangler.toml`).