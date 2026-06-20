# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

A minimal, customizable **Electron template** (Electron 37 + Vite 7 + TypeScript). It has a framework-agnostic Electron core plus an interactive scaffolder that lets the user pick the renderer framework: **React, Vue, Svelte, or Vanilla TS**. pnpm monorepo; the single package is `apps/desktop`. User-facing docs live in [README.md](README.md).

## Commands

Run from the repo root (these proxy to the `desktop` package via pnpm filters):

```bash
pnpm scaffold        # interactive scaffolder: pick/switch the frontend framework
pnpm dev          # Vite dev server + Electron with hot reload and DevTools
pnpm build        # Production build (renderer -> dist/, main+preload -> dist-electron/)
pnpm typecheck    # renderer (tsc / vue-tsc / svelte-check, per framework) + node (tsc -p tsconfig.node.json)
pnpm dist:mac     # Build, then package a macOS .dmg/.zip via electron-builder
```

Non-interactive scaffold: `pnpm scaffold <react|vue|svelte|vanilla> [--no-install] [--yes]`.
The command is `scaffold`, **not** `setup`: bare `pnpm setup` hits pnpm's reserved built-in command (errors with `Unknown option`), so the root script is exposed as `scaffold` (with `setup` kept only for `pnpm run setup`). The underlying script file is still `scripts/setup.mjs`.
Unsigned local mac package: `pnpm --filter desktop dist:mac -- --unsigned`. There is no test runner or linter configured.

## Architecture

The key idea: **a fixed Electron core + a swappable renderer**, joined by a scaffolder.

### Framework-agnostic core (never changes per framework) — `apps/desktop/`
- **`main/index.ts`** — Electron main process. 900x700 BrowserWindow, loads `VITE_DEV_SERVER_URL` in dev or `dist/index.html` in prod, routes `http`/`window.open` links to the external browser. Locked down: `contextIsolation: true`, `nodeIntegration: false`.
- **`preload/index.ts`** — `contextBridge.exposeInMainWorld('electronAPI', …)`, currently exposing platform + version info. The only sanctioned renderer↔main channel.
- **`types/electron-api.d.ts`** — shared ambient type for `window.electronAPI`. Update this whenever you add a preload method so every framework variant stays typed.
- **`scripts/dist-mac.mjs`** — macOS packaging wrapper (reads git SHA as build version, `--unsigned` flag).
- **`vite.electron.ts`** — shared factory for the Electron main/preload Vite plugins, imported by every generated `vite.config.ts`.
- **`tsconfig.node.json`** — type-checks the Node-side code (`main/`, `preload/`, `vite.electron.ts`) with Node libs. The renderer tsconfig excludes these (DOM-vs-Node lib conflict), so `pnpm typecheck` runs both configs (renderer + the `typecheck:node` script). Not touched by the scaffolder.

### The scaffolder — `apps/desktop/scripts/setup.mjs`
Zero-dependency Node script (built-in `readline`). It (1) prompts for a framework, (2) clears the active renderer paths (`src/`, `index.html`, `vite.config.ts`, `tsconfig.json`, `svelte.config.js`), (3) copies the chosen variant from `templates/` into `apps/desktop/`, and (4) rebuilds `apps/desktop/package.json` from `templates/_base.package.json` merged with that framework's `deps.json` (deps + any `scripts` override like `typecheck`). It records the choice in `package.json` → `electronTemplate.framework`.

### Template library — `templates/` (at the REPO ROOT, deliberately)
One folder per framework (`react`, `vue`, `svelte`, `vanilla`), each with `index.html`, `vite.config.ts`, `tsconfig.json`, `src/`, and `deps.json`. Plus `_base.package.json` (the canonical base used on every scaffold).

> **Why templates/ lives at the repo root, not under apps/desktop:** if it sat inside the project, `tsc`/`svelte-check`/Vite-config discovery would scan into sibling frameworks' files and break (svelte-check in particular tries to load every `vite.config.ts` it finds). Keeping it outside the project's scan scope is load-bearing — don't move it back in.

> Each `vite.config.ts` **inlines** the Electron main/preload plugins (rather than importing a shared module). This is intentional: a shared `./vite.electron` import broke `svelte-check`'s config loader, and self-contained configs are more template-friendly. The ~25 inlined lines are identical across variants.

### Active renderer (generated)
After `pnpm scaffold`, `apps/desktop/` contains the live `index.html`, `vite.config.ts`, `tsconfig.json`, and `src/`. The repo ships pre-scaffolded with React so `pnpm dev` works out of the box. Re-running setup **overwrites** these — edit `templates/<fw>/` to change a variant for future scaffolds.

## Conventions

- The demo renderer in every variant is intentionally tiny — a welcome screen that reads `window.electronAPI` to prove the preload bridge. No CSS framework (plain `app.css`), no example app.
- TypeScript path alias `@` → `apps/desktop/src` (in each variant's `vite.config.ts` + `tsconfig.json`). Renderer tsconfig `include` is `["src", "types"]` only.
- App metadata, the electron-builder `build` block, and base scripts live in `templates/_base.package.json` so they survive a re-scaffold — edit them there, not in the generated `apps/desktop/package.json`.
- `pnpm-workspace.yaml` approves native install scripts so the Electron binary downloads (pnpm blocks them by default). **This environment's pnpm 11.x reads the `allowBuilds` map; upstream pnpm reads `onlyBuiltDependencies`** — both are kept for cross-version compat. If a fresh clone still reports "Ignored build scripts", run `pnpm approve-builds --all` once. Gotcha: a half-finished electron install can leave `dist/Electron.app` present but `path.txt` missing, which makes `getElectronPath` throw "Electron failed to install correctly" — fix by deleting `node_modules/.pnpm/electron@*/node_modules/electron/{dist,path.txt}` and re-running that package's `install.js`.
- Node/pnpm versions are pinned via `engines` + `packageManager` in `templates/_base.package.json` (survives a re-scaffold) and `.nvmrc` at the repo root.
- Generated/build dirs (`dist/`, `dist-electron/`, `release/`, `node_modules/`) are ignored — don't edit them.
