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
