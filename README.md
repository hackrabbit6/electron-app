# Electron Template

[![CI](https://github.com/hackrabbit6/electron-app/actions/workflows/ci.yml/badge.svg)](https://github.com/hackrabbit6/electron-app/actions/workflows/ci.yml)

A minimal, customizable Electron desktop template with a **framework-agnostic core** and a **pick-your-frontend scaffolder**. Choose React, Vue, Svelte, or Vanilla TS — the Electron main/preload layer stays the same.

> 📖 中文使用指南见 [docs/使用指南.md](docs/使用指南.md)。

- ⚡ Electron 37 + Vite 7 + TypeScript
- 🧩 Swap frontend frameworks with one command (`pnpm scaffold`)
- 🪶 No CSS framework, no boilerplate app — just a tiny welcome screen proving the preload bridge
- 🔒 Secure defaults: `contextIsolation` on, `nodeIntegration` off, CSP set, external links open in the browser

## Quick start

```bash
pnpm install        # install the Electron core
pnpm scaffold          # interactively pick a framework (writes the renderer + deps)
pnpm dev            # launch the app with hot reload
```

The repo ships pre-scaffolded with **React** so `pnpm dev` works immediately. Run `pnpm scaffold` whenever you want to switch.

> Use `pnpm scaffold`, **not** `pnpm setup` — `setup` is a reserved pnpm built-in command that pnpm intercepts (you'd get `Unknown option`). `pnpm run setup` also works.

## Choosing / switching frameworks

`pnpm scaffold` is an interactive, dependency-free scaffolder. It copies the chosen variant from `templates/` into `apps/desktop/` and rebuilds `package.json`.

```bash
pnpm scaffold                 # interactive menu
pnpm scaffold vue             # non-interactive
pnpm scaffold svelte --no-install   # skip the pnpm install step
```

> ⚠️ Switching frameworks **overwrites** the active renderer (`src/`, `index.html`, `vite.config.ts`, `tsconfig.json`). Commit your work before switching. The interactive mode asks for confirmation first.

Supported: `react`, `vue`, `svelte`, `vanilla`.

## Commands

| Command | What it does |
| --- | --- |
| `pnpm scaffold` | Scaffold / switch the frontend framework |
| `pnpm dev` | Vite dev server + Electron with hot reload and DevTools |
| `pnpm build` | Production build → `dist/` (renderer) + `dist-electron/` (main, preload) |
| `pnpm typecheck` | Type-check the renderer (uses `tsc` / `vue-tsc` / `svelte-check` per framework) |
| `pnpm dist:mac` | Build, then package a macOS `.dmg`/`.zip` via electron-builder |

For an **unsigned** local macOS package: `pnpm --filter desktop dist:mac -- --unsigned`.

> First packaging needs network access: electron-builder downloads the Electron archive and the `dmgbuild` tool into `~/Library/Caches/electron/`. On a restricted network the `.dmg` step can fail (`EOF`/`ECONNRESET`) while the `.zip` still succeeds. Cached tools make later builds work offline.

## Project layout

```
electron-app/
├── templates/                 # framework library (source of the scaffolder)
│   ├── _base.package.json     # base package.json; setup merges each framework's deps.json
│   ├── react/  vue/  svelte/  vanilla/
│   └── …/{ index.html, vite.config.ts, tsconfig.json, src/, deps.json }
├── apps/desktop/
│   ├── main/index.ts          # Electron main process (framework-agnostic)
│   ├── preload/index.ts       # contextBridge → window.electronAPI (framework-agnostic)
│   ├── types/electron-api.d.ts# shared type for the preload bridge
│   ├── scripts/
│   │   ├── setup.mjs           # the interactive scaffolder
│   │   └── dist-mac.mjs        # macOS packaging
│   └── (active renderer, written by `pnpm scaffold`)
├── package.json               # workspace scripts
└── pnpm-workspace.yaml
```

## Customizing

- **Renderer**: edit the active files in `apps/desktop/` (e.g. `src/App.tsx`). To change a variant for *future* scaffolds, edit `templates/<framework>/`.
- **Window / app behavior**: `apps/desktop/main/index.ts` (size, title, menus, links).
- **Preload API**: add methods in `apps/desktop/preload/index.ts` and type them in `apps/desktop/types/electron-api.d.ts`.
- **App metadata / packaging**: the `build` block and `productName`/`appId` in `templates/_base.package.json` (so they survive a re-scaffold).
- **Add a framework**: drop a new folder in `templates/` with `index.html`, `vite.config.ts`, `tsconfig.json`, `src/`, and a `deps.json` — `pnpm scaffold` picks it up automatically.
