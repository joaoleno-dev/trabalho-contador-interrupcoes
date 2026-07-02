# CLAUDE.md — project context

Browser extension (Chrome + Firefox, Manifest V3) that counts and measures
work interruptions, focused on interruptions caused by the immediate manager
("chefia"). Academic project, public repository.

## Key documents

- `PLANO-IMPLEMENTACAO.md` — the full implementation plan (in Portuguese):
  requirements, architecture, data model, state machine, UI and the 7 phases
  with acceptance criteria. **Read it before implementing any phase.**
- `README.md` — the motivation/research behind the project, with references.

## Conventions

- **All code, comments and commit messages in English.** Conversation with
  the user is in Portuguese.
- **Comment generously** — this is an open educational repository; comments
  should explain the *why* (design decisions, browser quirks), not the what.
- Commits follow conventional-commit style (`feat:`, `docs:`, `fix:`).
- Category identifiers stay in Portuguese (`chefia`, `colega`, `reuniao`,
  `mensagem`, `pessoal`, `outro`) — they are data-model constants.

## Architecture rules (do not violate)

- The **background** (service worker on Chromium, event page on Firefox) is
  the single source of truth. The popup is a pure view and requests every
  state change via `runtime.sendMessage`.
- All state lives in `browser.storage.local`. Nothing may rely on in-memory
  state surviving between events (MV3 contexts are killed at any time).
- The stopwatch is **timestamp-based** (`startedAt`/`endedAt`), never an
  accumulator with `setInterval`. Intervals are for display refresh only.
- Single source tree; `scripts/build.mjs` generates per-engine manifests
  into `dist/chrome` and `dist/firefox`. Never edit `dist/` by hand.
- New interruptions are always pre-classified as `chefia` (RF4).
- Paused media is never auto-resumed when the user resumes work.

## Commands

- `npm run build` — builds both targets into `dist/chrome` and `dist/firefox`.
- `npm run typecheck` — strict TypeScript check (esbuild does not type-check).
- Load in Chrome: `chrome://extensions` → Developer mode → Load unpacked →
  `dist/chrome`. Load in Firefox: `about:debugging` → Load Temporary Add-on →
  `dist/firefox/manifest.json` (or `npx web-ext run --source-dir dist/firefox`).

## Status (updated 2026-07-02)

- ✅ Phase 1 — scaffolding, cross-browser build, hello-world popup with a
  ping/pong check of the popup↔background messaging channel. Committed and
  pushed. Manual load test in both browsers still pending by the user.
- ⏭️ Next: **Phase 2** — storage layer (`lib/storage.ts`, `lib/state.ts`,
  `lib/time.ts`), background message handlers (`startInterruption`,
  `endInterruption`, `getState`), badge with the daily count. Acceptance:
  state survives service-worker kill and browser restart.
- Phases 3–7: see `PLANO-IMPLEMENTACAO.md` §8.

## Decisions already made (do not re-litigate)

- No UI framework (popup is 2 simple screens, vanilla TS).
- `webextension-polyfill` + `@types/webextension-polyfill` for a single
  `browser.*` Promise API across engines.
- Estimated resumption cost metric uses ~23 min per interruption (Mark et
  al., CHI 2008) — shown in the day-detail view with an explanatory note.
- Orphaned open interruption (browser closed): on startup, auto-close if
  older than 4h (`endedAt = startedAt + 4h`, note "closed automatically").
- An interruption belongs to the day it **started** (day rollover rule).
