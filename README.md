# Chair Run × Mutual Mimu

A game and landing page by **MIMU ON APE**, built by Bert Baccaratt, for the TMF Pass Mimu giveaway. It is independent and not affiliated with THE MUTUAL FUN project (see the NDA screen and the Terms of Service on the site).

A phone lies on a wood desk, and the phone is the game: Chair Run (a pseudo-3D runner), Mutual Mimu (stake, vote and a closing bell every 4h 20m), Leaderboards, Badges, Top 5, Alarm, Messages, Phone, Camera and Settings.

## Run the site locally

It is a static site: `index.html`, `admin.html` and `assets/`. Serve the folder with any static server, then open http://localhost:8765/ :

```
npx serve -l 8765 .
```

Local-only helpers: `?gate=ok` fakes a Glyph sign-in (only on `localhost`), and `?api=http://localhost:8787` points the game at a local Worker (only on `localhost`).

## What is where

- `index.html`: the whole game and landing page (HTML, CSS, JS)
- `admin.html`: the admin page (password checked by the server; visitor flip clock, top lists, review queue, texts, players, live runs)
- `assets/`: images, `sim.js` (the shared game core), `glyph-connect.js` (the Glyph bundle, loaded only when Chair Run opens)
- `glyph/`: builds `assets/glyph-connect.js` (`cd glyph && npm install && npm run build`). It wraps Glyph's React wallet kit and is licensed by Yuga Labs, Inc. under the Glyph Software License v1.0 (https://useglyph.io/license, copy in `glyph/GLYPH-LICENSE.txt`).
- `backend/`: Cloudflare Worker + D1 database (API at https://mimu-mutual-api.mutualmimu.workers.dev), `schema.sql`, and the test scripts
- `tools/`: one-off build and patch scripts (not needed to run the site)

## How the game works with the server

- **Sign in:** the wallet signs a free plain-English message that names this site. The server checks the signature, the origin and the holdings (a wallet must hold a Mimu On Ape; a wallet holding a TMF Pass or a Dengs can't play). The bridge refuses to sign anything else.
- **Username:** every player types a username that must be their X handle (unverified; one wallet per handle). Real "Sign in with X" is built (`/api/x/start`, `/api/x/callback`, `/api/x/link`) and switches on when `X_CLIENT_ID` and `X_CLIENT_SECRET` are set as secrets.
- **Honest scores:** the browser never sends a score. It records only its inputs, and the server replays them with the same `assets/sim.js` (`/api/run/start`, `/api/run/chunk`). A Cloudflare Turnstile check starts each run, and runs with bot-like timing are held for review in the admin page.
- **Top 5 app:** everyone is ranked by total score (Chair Run points + $TMF found). The top 5 can't give $TMF; everyone else can give all of it to one top 5 player (+2 points per $TMF) or send any amount to a player who has at least 1 $TMF. The server decides, using the live ranking, on every request.
- **Mimu Mail:** the admin page has a blue box that sends an email (subject, body, optional photo) to every phone signed in with Glyph. Only the admin password can send; players can only read. Phones show an inbox that starts empty.
- **Messages:** signed-in players can text each other (plain text, 280 characters, rate limited, blocking, admin can read and delete).
- **Rules version:** `assets/sim.js` exports `VERSION`. Any change to the game rules must bump it (and the `?v=` on its script tag). `/api/run/start` refuses a page on a different version with `refresh: true`, and the game reloads the page, so a stale page can never submit a run the server replays differently.
- **Campaign window (enforced by the server):** Chair Run starts runs only between `CHAIR_RUN_OPENS_AT` (default Sat Oct 10 2026, 6:00 PM Pacific) and `CHAIR_RUN_CLOSES_AT` (default Tue Oct 13, 6:00 AM Pacific). `CHAIR_RUN_OPEN` = "1" forces it open (staging) and "0" forces it closed. Gifts work only between `DONATE_FROM` and `DONATE_UNTIL` (defaults: Tue Oct 13, 6:00 AM to Wed Oct 14, 6:00 AM Pacific).
- **Logging everyone out:** sessions issued before `SESSIONS_VALID_AFTER` (a constant in `backend/src/index.js`, overridable by an env var) are refused. Phones then sign out cleanly on their next request.
- **Game feel:** speed climbs 11 to 23 over the first ~2,760 m, then +0.5 every 3 minutes to a ceiling of 30; a red orb appears every 2.5 million points (-0.5 top speed for 3 minutes); every 1 million points there is a 10 second disco party and every 10 million the carpet changes color (display only).
- **Privacy:** the server stores wallet address, Glyph name, username, picture, scores, $TMF gifts, texts, and an anonymous browser ID with visit times. It does **not** store IP addresses or locations (the admin lockout uses a one-way keyed hash).

## Deploying

```
cd backend
npx wrangler deploy                      # production API
npx wrangler deploy --config wrangler.staging.toml   # staging API (used by the tests)
```

Secrets (set with `npx wrangler secret put NAME`, never committed): `SESSION_SECRET`, `ADMIN_TOKEN` (the admin password), `TURNSTILE_SECRET`, optional `RPC_PRIMARY_4663` (a keyed Robinhood Chain RPC), optional `X_CLIENT_ID` / `X_CLIENT_SECRET`.
Database changes are in `backend/schema.sql` (run new `ALTER` statements by hand on existing databases).
The site itself is published by pushing `main` to GitHub Pages.

## Tests (against the staging API)

`node backend/test-sim.mjs` (game determinism), `test-run.mjs`, `test-admin.mjs`, `test-transfer.mjs`, `test-messages.mjs`, `test-live.mjs`, `test-x.mjs` (needs a local `wrangler dev` with a mock X; see the file header).
Most of them need `ADMIN_TOKEN` set to the staging admin password. The tests deliberately send wrong admin passwords, so run them one file at a time (6 wrong passwords lock an address for 15 minutes; clear `admin_fails` on staging between files).

## Known limits

- A bot that really plays in real time with human-looking timing is still possible; the checks make it harder, not impossible.
- GitHub Pages can't send custom security headers, so the site uses a Content-Security-Policy `<meta>` tag and a frame-busting script instead.
- A run that is already in progress when gaming stops is allowed to finish and count (new runs are refused).
- The weekly leaderboards reset every Friday at 20:00 UTC (1:00 PM Pacific); nothing is deleted, older weeks stay in the database.
