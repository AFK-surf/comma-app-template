# Rules for coding agents

This repository is a Comma app. Comma runs it inside the Comma Mac and web apps,
in a sandboxed frame with no network and no URL of its own.

## Build, test, deploy

1. Install: `npm install`.
2. Build: `npm run build`. It type-checks, builds the frontend to one file,
   `dist/index.html`, and builds the backend (if `comma-app.json` has one) to
   `dist-worker/index.js`.
3. Test: `npm test` runs the unit tests with the mock (`src/comma/mock.ts`).
   Also check the app in a headless browser: run `npm run dev` and open
   the printed URL. Outside Comma, `src/main.tsx` installs the mock, so every
   `comma.*` call works with in-memory data.
4. Deploy: call the station tool `app_deploy` with short `notes` on what
   changed. It commits and pushes your work, then sends the build to Comma.
   Fix every error it returns and call it again. The user sees the new
   version in the chat. Only the app owner can publish it.
5. Backend errors: call the station tool `app_logs`.

Run `npm run build` before each `app_deploy`. Never edit `dist/` or
`dist-worker/` by hand.

## Frontend rules

- Use only `comma` from `src/comma/sdk.ts` for effects. The app has no network:
  `fetch`, `XMLHttpRequest`, `WebSocket`, remote images, fonts and scripts fail.
  Put every asset into the bundle (imports of images and fonts become data URLs).
- Keep data only in `comma.storage`. List each store you use in
  `comma-app.json` `storage`. Keys use letters, digits and `. _ / -` (at most
  256). Use `put(key, value, { ifVersion })` to avoid lost updates.
  - `comma.storage.device`: this device only. 32 KiB per value, 1 MiB in all.
  - `comma.storage.user`: the current viewer, on all devices. 10 MiB per viewer.
  - `comma.storage.app`: shared by all viewers. 1 MiB per value, 100 MiB in all.
- Do not use `localStorage`, `sessionStorage`, IndexedDB, cookies, Service
  Workers, `window.open`, forms that submit, `alert` or `confirm`. They do not
  work in the sandbox.
- Do not use the URL or `history` for navigation. Use `src/router.tsx` (a memory router).
- Keep the build to one module script. Do not add code splitting or dynamic
  `import()` of app code. To load a large file on demand, keep it in `public/`
  and use `comma.asset("file.js")`.
- Capabilities (`comma-app.json` `capabilities`) the app may ask for:
  `identity.basic` (`comma.viewer()`), `ai.chat` (`comma.ai.chat`), `chat.draft`
  (`comma.chat.draft`), `tasks.create` (`comma.tasks.propose`), `files.pick`,
  `drive.app_folder` (`comma.drive.*`), `calendar.read` (Mac only),
  `notifications` (`comma.notify`), `clipboard.write`, `links.open` (`comma.open`).
  Ask only for what the app needs. The viewer grants them; a call can fail.
- Every SDK call can reject with `CommaError` (`code`: `unsupported`,
  `not_granted`, `denied`, `signup_required`, `app_paused`, `rate_limited`,
  `invalid`, `not_found`, `conflict`, `quota_exceeded`, `failed`,
  `unavailable`). Show the user a short message; do not crash. Check
  `comma.supports(op)` before you show a feature that needs a capability.
- Follow the Comma theme: `<html>` has `data-theme` (`light` or `dark`) and
  `color-scheme`. Use `comma.onTheme` for changes.

## Backend (optional)

- `worker/index.ts` is a Cloudflare Worker module. To use it, add to `comma-app.json`:
  `"backend": {"entry": "worker/index.ts", "egress": ["api.example.com"], "secrets": ["API_KEY"]}`.
- The frontend calls it with `comma.backend.fetch("/path", init)`. Requests
  arrive at `https://app.invalid/<path>` with the header `x-comma-viewer`.
- `fetch` from the backend reaches only https hosts in `egress` (at most 20).
- Store data in `env.STORAGE` (see the comments in `worker/index.ts`).
- Secrets are `env.<NAME>`. The app owner sets their values in Comma. Never
  put secret values in the repository.
- Limits: 50 ms CPU and 50 subrequests per request; 1 MiB request body.

## Do not change

- `src/comma/` (Comma updates these files).
- The single-file build in `vite.config.ts`.
