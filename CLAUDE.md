# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Chat Language
永远使用中文回答我的问题

## Quick Reference

| Task | Command |
|---|---|
| Install dependencies | `pnpm i` |
| Tauri dev (standard) | `pnpm tauri dev` |
| Tauri dev + React DevTools standalone | `pnpm tauri:dev` (sets `VITE_REACT_DEVTOOLS=1`) |
| Tauri dev + WebView2 extension (Windows only) | `pnpm tauri:ext` (sets `TAURI_ENV_EXTENSION=1`) |
| Browser dev (external browser, Tauri API proxied via HTTP) | `pnpm tauri:web` (sets `TAURI_ENV_WEB_INVOKE=1`) |
| Production build | `pnpm tauri build` |
| Vite-only dev (no Tauri) | `pnpm dev` |
| Type check + Vite build (no Tauri) | `pnpm build` |
| Lint | `pnpm exec eslint .` |
| Version bump (syncs Cargo.toml) | `pnpm version major\|minor\|patch` |
| Rust docs | `pnpm doc:tauri` |

**Package manager is always pnpm** — enforced by a `preinstall` hook.

## Architecture

This is a **Tauri v2 desktop app** with a **React 19** frontend and a **Rust** backend, designed as a personal starter template.

### Frontend (`src/`)

- **Entry**: [src/main.tsx](src/main.tsx) — mounts React root with TanStack Router, UnoCSS reset, global Less styles.
- **Routing**: TanStack Router with **file-based routes** and **hash history**. The route tree is auto-generated at `src/routes/-routes.tree.ts` by the Vite plugin. Manual route files live in `src/routes/` — `__root.tsx` wraps everything with the App layout and devtools.
- **Pages**: `src/pages/app/App.tsx` is the layout shell (renders `<Outlet />` + `<ThemeManager />`). `src/pages/home/Home.tsx` is the landing page.
- **State**: Zustand store at `src/shared/stores/useGlobalStore.ts` — currently holds dark/light theme toggle. Immer is available via `use-immer` for immutable updates.
- **Styling**: UnoCSS (atomic, `presetMini` with `on-demand` preflight) + Less for component styles. Dark/light CSS custom properties in [src/shared/styles/global.less](src/shared/styles/global.less). Theme switching via View Transition API with a circular reveal animation.
- **Types**: Global types in `src/shared/types/` — `GlobalStore` interface and a utility `EventFor<TElement, THandler>` type.

### Backend (`src-tauri/`)

- **Entry**: [src-tauri/src/main.rs](src-tauri/src/main.rs) calls `lib::run()`. The `#[cfg_attr(not(debug_assertions), windows_subsystem = "windows")]` attribute hides the console window in release builds on Windows.
- **Commands**: Defined in [src-tauri/src/lib.rs](src-tauri/src/lib.rs) with `#[tauri::command]` + `#[specta::specta]`. Currently exposes `greet(count: i32) -> String`.
- **Type-safe IPC**: `tauri-specta` + `specta` auto-generates [src/utils/command.ts](src/utils/command.ts) from Rust commands at compile time (debug only). The generated file exports typed `commands.greet(count)` → `invoke<string>("greet", { count })`.
- **Custom plugin**: `tauri-plugin-dev-invoke` at `src-tauri/src/plugins/tauri-plugin-dev-invoke/` spins up an HTTP server (port 3030) that proxies browser requests to Tauri's IPC system, enabling `pnpm tauri:web` mode.
- **React DevTools extension**: Bundled at `src-tauri/extensions/react-devtools/` for `pnpm tauri:ext` mode (Windows WebView2 only). Loaded via `browser_extensions_enabled(true)` + custom data directory.
- **Capabilities**: Defined in `src-tauri/capabilities/` — currently grants `core:default` and `opener:default`.

### Development Modes (decoded by env vars in `lib.rs` `setup`)

| Env var | Mode | Behavior |
|---|---|---|
| (none) | Standard | Normal Tauri window |
| `VITE_REACT_DEVTOOLS=1` | `tauri:dev` | Opens DevTools, injects React DevTools standalone script |
| `TAURI_ENV_EXTENSION=1` | `tauri:ext` | Creates window with WebView2 extension support, opens DevTools |
| `TAURI_ENV_WEB_INVOKE=1` | `tauri:web` | Minimizes Tauri window, starts HTTP invoke proxy; frontend connects from `localhost:1420` in a browser |

### Build Tooling

- **Vite 8** with Rolldown. [`vite.config.ts`](vite.config.ts) configures: TanStack Router plugin (auto code-splitting), UnoCSS, React plugin, Babel with React Compiler preset, and a custom plugin to inject React DevTools standalone script.
- **Path aliases**: `@renderer/*` → `src/*`, `@components/*` → `src/components/*`, `@utils/*` → `src/utils/*`, `@shared/*` → `src/shared/*`, `@hooks/*` → `src/hooks/*`. Defined in both Vite resolve and tsconfig paths.
- **envPrefix**: `VITE_` and `TAURI_ENV_` — both are exposed to client code via `import.meta.env`.
- **HMR**: Fixed port 1420 with `strictPort: true`. Watcher ignores `src-tauri/`.

## Key Conventions

- **No default exports in pages** — page components are named exports, imported via barrel files ([src/pages/index.ts](src/pages/index.ts)).
- **Rust edition 2024** — the Cargo.toml specifies `edition = "2024"`.
- **Version sync**: `pnpm version` bumps `package.json` version, then `scripts/version.ts` syncs it to `src-tauri/Cargo.toml` before generating a changelog with git-cliff.
- **Type-only imports**: `verbatimModuleSyntax` is enabled in tsconfig — use `import type` for type-only imports.
- **`&` in import paths** (`import '@shared/styles/global.less'`) — Less files imported this way are treated as side-effect imports.
