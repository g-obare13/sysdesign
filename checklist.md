# SysDesign — Improvement Checklist

> Status legend: `[ ]` pending · `[x]` done · `[~]` in progress
> Source: full codebase review (2026-08-04)

---

## Phase 0 — Build Health (fixed 2026-08-04)

> The production build was broken. Fixed as part of the Phase 1–2 work.

- [x] **B.1** `pnpm build` was failing in the router generator — `createFileRoute("/$slug/c4" as any)` prevented static path extraction. Removed the `as any`; route is now properly typed (`/$slug/c4` with `slug` param).
- [x] **B.2** SSR bundle failed: `"invariant" is not exported by @tanstack/router-core` — `pnpm update --i` had left a **stale real directory** (`@tanstack/router-core@1.168.1`) at `node_modules/@tanstack/` that shadowed the correct store copy (1.171.15). Added `@tanstack/router-core` as a direct dependency and cleaned node_modules.
- [x] **B.3** SSR bundle failed again: `"createDevWarn" is not exported by @xyflow/system` — same class of bug: stale `@xyflow/system@0.0.75` real dir shadowed `0.0.79`. Fixed with a full clean reinstall of `node_modules`.
- [x] **B.4** Production build now completes: client, SSR, and server bundles all build successfully.

---

## Phase 1 — Foundation & Correctness (bugs)

- [x] **1.1** Fix `handleCreateProject` type bug in `src/routes/index.tsx` — the 2nd param is typed `description` but is actually the project `type`. Align it with `ProjectSetupPopup.onCreate(name, type, description)`.
- [x] **1.2** Remove unused imports in `src/components/layout/ComingSoon.tsx` (`IconArrowLeft`, `Button`, `navigate`).
- [x] **1.3** Remove unused imports in `src/routes/projects.tsx` (`IconFolder`, `IconPlus`).
- [x] **1.4** Remove unused imports in `src/routes/templates.tsx` (`IconDeviceTv`, `IconBrandWhatsapp`, `IconBrandYoutube`, `IconCloud`).
- [x] **1.5** Clear Tailwind v4 lint noise in `src/components/toolbar/Toolbar.tsx` (`min-w-[200px]` → `min-w-50`, `max-h-[300px]` → `max-h-75`) + `projects.tsx` (`min-h-[40px]` → `min-h-10`).
- [x] **1.6** Migrate `tsconfig.json` off deprecated `baseUrl` (use bare `paths`).

## Phase 2 — Performance & Robustness

- [x] **2.1** Debounce the Supabase/localStorage autosave in `src/store/canvas.store.ts` (currently fires on every mutation while dragging).
- [x] **2.2** Add a "saving / saved / failed" indicator so users know persistence state.
- [x] **2.3** Stop `esbuild.drop: ["console", "debugger"]` from killing real error logging (`console.error` used for Supabase/export failures). Use a logger util; drop only `log`/`debug` or nothing.
- [x] **2.4** Add an error boundary around the canvas so a bad node/edge can't white-screen the app.
- [ ] **2.5** Consider snapshotting history only on discrete ops (add/delete/connect) rather than full-state on every change.

## Phase 3 — Visual Consistency ("more beautiful")

- [x] **3.1** Unify corner radius system — set `--radius` base to `8px` + coherent `--radius-*` scale (`sm 4 / md 6 / lg 10 / xl 16 / 2xl 20 / 3xl 24`). Standardized toolbar dropdown, templates cards (`3xl → xl`), 404 buttons (`2xl → lg`), error boundary.
- [x] **3.2** Add dark-mode variants for `CATEGORY_STYLE` in `src/types/diagram.ts` (hardcoded light pastels look washed out on dark canvas) — added `dark` per category + C4 styles; `DiagramNode`, `Sidebar` items, and `MiniMap` now pick theme-aware colors.
- [x] **3.3** Consolidate to one icon library — `lucide-react` removed (only `Loader2` in `button.tsx`); all icons are Tabler now.
- [x] **3.4** Remove leftover Next.js `"use client"` directives (no-op in TanStack Start) — removed from 17 files.
- [x] **3.5** Remove dead Inter Google Fonts `<link>` in `src/routes/__root.tsx` (local General Sans is the actual font) — replaced with IBM Plex Serif link.
- [x] **3.6** Resolve `--font-serif`/`--font-heading` mapping — kept headings sans for editor legibility; added `--font-display` (IBM Plex Serif) applied only to marketing/landing page titles via `font-display`; removed dead `--font-ibm-*` vars + `.lucide` rule.
- [x] **3.7** Hide marketing `<Footer />` on canvas/editor routes — shown only on content routes (`/projects`, `/templates`, `/privacy`, `/terms`, `/integrations`, `/flows`, `/shapes`).

## Phase 4 — Ease of Use (UX)

- [x] **4.1** Allow a scratchpad / untitled canvas on first visit instead of forcing the "Project Setup" modal (save-to-project later). — `/` now renders an editable scratchpad with a "Save as Project" banner; `createProjectFromScratchpad` carries nodes/edges into the new project.
- [x] **4.2** Add auto-layout (ELK/dagre) to arrange nodes automatically. — Added `@dagrejs/dagre` + `autoLayout()` in the store and an "Auto Layout" button in the toolbar dock (verified: dagre rearranges nodes into an even row).
- [x] **4.3** Add a `?` keyboard-shortcut help overlay (undo/redo, `G` group, `F` fit, Delete confirm already exist but are undiscoverable). — `?` / `Shift+/` opens a shortcuts modal; Escape closes.
- [x] **4.4** Fix slug collisions (`slugify(name)` → duplicate names collide on `/slug`) — `createProject` now appends `-2`, `-3`, … for duplicates.
- [x] **4.5** Type `$slug.c4.tsx` properly (currently `as any` on route path + params).
- [x] **4.6** Add project rename (only create/delete exists today). — Pencil buttons on project cards + rename modal wired to the existing `updateProject` (slug stays stable).
- [x] **4.7** Reconsider full-screen `MobileBlock` — offer a lightweight read-only mobile view (templates + project list). — Mobile blocker now only appears on editor/canvas routes; content pages render normally on mobile.

## Phase 5 — Architecture & Code Health

- [~] **5.1** Extract storage into a small abstraction (`LocalStorageBackend` / `SupabaseBackend`) to de-duplicate `load`/`save` logic across `project.store` and `canvas.store`; makes it testable. — **Deferred (documented).** The stores are stable and now covered by tests (5.2); a full abstraction refactor is high-risk for the current value. Revisit if persistence logic changes.
- [x] **5.2** Add tests — Vitest + RTL are configured but zero test files exist. Prioritize history/persistence logic. — Added `vitest.config.ts` + 3 suites (`project.store`, `canvas.store`, `exportUtils`) — **14 tests passing**. Run with `pnpm test`.
- [x] **5.3** Split the ~600-item `src/data/registry.ts` by provider (aws/gcp/azure) and consider generating from data. — Split into `src/data/registry/{aws,gcp,azure,other,index}.ts`; `registry.ts` is now a thin re-export (stable import path).
- [x] **5.4** BYOK AI keys live in `localStorage` with direct browser calls to OpenAI/Anthropic/Gemini — acceptable for a learning project; upgrade model IDs. — Updated stale models: `claude-3-5-haiku-20241022 → claude-3-5-haiku-latest`, `gemini-2.5-pro-preview-03-25 → gemini-2.5-pro`. (gpt-4o kept — still current.) Proxying via Edge Functions still recommended for production.
- [x] **5.5** Verify whether the `nitro` beta dependency is actually needed. — **Verified: keep it.** The build compiles without `nitro()`, but it's what produces the `.output/` Nitro deployment bundle the app deploys from (removing it switches output to `dist/`). Revisit only when the deploy target changes.
- [~] **5.6** Consolidate near-duplicate home (`/`) and `/$slug` editor pages. — **Kept separate (documented).** `/` is now a scratchpad (no project) and `/$slug` is a specific-project editor — the behaviors genuinely differ after Phase 4.1.
- [x] **5.7** Add error reporting for the dropped `console.error` paths once #2.3 is resolved. — Resolved by 2.3: production keeps `console.error` (only `debugger` is dropped), so Supabase/export failures remain visible.

---
