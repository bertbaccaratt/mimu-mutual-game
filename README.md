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
- **Messages:** signed-in players can text each other (plain text, 280 characters, rate limited, blocking, admin can read and delete).
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
Most of them need `ADMIN_TOKEN` set to the staging admin password.

## Known limits

- A bot that really plays in real time with human-looking timing is still possible; the checks make it harder, not impossible.
- GitHub Pages can't send custom security headers, so the site uses a Content-Security-Policy `<meta>` tag and a frame-busting script instead.
- The campaign schedule (shown in the Alarm app and the Terms) is informational; the server does not yet stop runs or gifts outside it.
