# Comma app template

This is the template for Comma apps. An app runs inside Comma (Mac and web),
in a sandboxed frame. It has no network and no URL of its own. It uses Comma
through `window.comma`: storage, the viewer, AI chat, Drive and more.

Comma makes a new private repository from this template when you ask it to
build an app. A coding agent then writes the app and deploys it with the
station tool `app_deploy`. The rules for the agent are in [AGENTS.md](AGENTS.md).

The stack is Node, Vite, TypeScript, React, shadcn/ui, Tailwind CSS and
lucide-react icons. The shadcn/ui theme follows Comma's colors in light and dark.

## Develop locally

```sh
npm install
npm run dev     # opens the app with an in-memory mock of window.comma
npm test        # unit tests with the mock
npm run build   # dist/index.html (and dist-worker/index.js with a backend)
```

## Files

| Path                 | Use                                                                                 |
| -------------------- | ----------------------------------------------------------------------------------- |
| `comma-app.json`     | Name, capabilities, storage stores and the optional backend.                        |
| `src/`               | The React frontend. `src/main.tsx` starts it.                                       |
| `src/components/ui/` | shadcn/ui components. Add more with `npx shadcn@latest add <name>`.                 |
| `src/index.css`      | Tailwind CSS and the shadcn/ui theme, mapped to Comma's `--comma-*` colors.         |
| `src/comma/`         | The Comma SDK (`sdk.ts`) and its local mock (`mock.ts`). Comma updates these files. |
| `src/router.tsx`     | A memory router. Apps do not use the URL.                                           |
| `worker/`            | The optional backend (a Cloudflare Worker).                                         |

## `comma-app.json`

```json
{
  "name": "Habit tracker",
  "description": "Track daily habits.",
  "icon": "icon.png",
  "capabilities": ["identity.basic", "ai.chat"],
  "storage": ["user", "device"],
  "backend": {
    "entry": "worker/index.ts",
    "egress": ["api.open-meteo.com"],
    "secrets": ["OPEN_METEO_KEY"]
  }
}
```

- `name`: 1 to 60 characters.
- `icon`: a PNG, SVG or WebP file in `dist/` (at most 256 KiB). Optional.
- `capabilities`: `identity.basic`, `ai.chat`, `chat.draft`, `tasks.create`,
  `files.pick`, `drive.app_folder`, `calendar.read`, `notifications`,
  `clipboard.write`, `links.open`.
- `storage`: `app`, `user`, `device`.
- `backend`: optional. At most 20 `egress` hosts (no IP addresses, no
  wildcards) and 20 `secrets` names (`A-Z`, `0-9`, `_`).

## Limits

- `dist/index.html` at most 8 MiB; the whole `dist/` at most 25 MiB and 2,000 files.
- The backend at most 3 MiB compressed.
