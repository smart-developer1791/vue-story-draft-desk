<div align="center">

# ✍️ Story Draft Desk

**A little room for the next sentence.**

![Vue](https://img.shields.io/badge/Vue-3-42b883?style=for-the-badge&logo=vuedotjs&logoColor=ffffff)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178c6?style=for-the-badge&logo=typescript&logoColor=ffffff)
![Vite](https://img.shields.io/badge/Vite-8-646cff?style=for-the-badge&logo=vite&logoColor=ffffff)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06b6d4?style=for-the-badge&logo=tailwindcss&logoColor=ffffff)
![License](https://img.shields.io/badge/License-MIT-777777?style=for-the-badge)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

_Vue short-prose editor with customRef committed snapshots, bounded branching undo/redo, protected pending edits, and text/JSON exports._

</div>

---

## ✨ Highlights

- **A small page for a story:** Edit a title, subtitle, and up to 10,000 characters of plain prose.
- **Keep deliberate versions:** Save a labeled snapshot instead of recording every keystroke.
- **One history-aware Vue ref:** `customRef` tracks the current frozen workspace and publishes Undo, Redo, jumps, and resets explicitly.
- **Follow a new direction:** Saving after Undo replaces the later branch; retain the latest 30 snapshots.
- **Protect the unfinished version:** History navigation asks before discarding pending editor fields.
- **Take the kept story with you:** Export the committed title/subtitle/body as plain text or complete JSON.

## 🧱 Project Structure

```text
public/
├── favicon.svg                         # Original project emblem
├── og.svg                              # Original social artwork
├── font-licenses.txt                   # Font copyright and OFL licenses
└── sample-workspace.json               # Complete importable workspace
src/
├── components/

│   ├── DataTools.vue                   # Workspace actions and restoration
│   ├── AppDialog.vue                   # Native Teleport modal and focus lifecycle
│   ├── AppIcon.vue                     # Original inline SVG icons
│   ├── DataExchange.vue                # Validated workspace import dialog
│   └── StudioHeader.vue                # Workspace branding and actions
├── domain/
│   ├── story.ts                       # Pure validation, calculations, and exports
│   ├── shared.ts                       # Project-specific text and identity helpers
│   └── validation.ts                   # Strict unknown-input guards
├── composables/
│   └── useHistory.ts
├── services/
│   ├── draft.ts                        # Validated device-local persistence
│   └── files.ts                        # Downloads and deterministic identities
├── App.vue                             # Workspace and editor state
├── base.css                            # Tailwind, local fonts, and control defaults
├── style.css                           # Project theme tokens
└── main.ts                             # Vue application entry
tests/
├── *.test.ts                           # Native domain/composable/export tests
└── e2e/                                # Production browser workflows
```

Root files include Vite, TypeScript, Playwright, and Prettier configuration, an npm lockfile, the MIT license, and explicit `vercel.json`. The official scaffold’s default artwork and empty `src/assets` directory are removed. The shared generic development container stays unchanged.

## 🛠 Tech Stack

| Tool                          | Role                                                                        |
| ----------------------------- | --------------------------------------------------------------------------- |
| Vue 3.5                       | Typed SFCs, component contracts, reactive state, and lifecycle management   |
| TypeScript 6                  | Checked domain structures and component/composable inputs                   |
| Vite 8                        | Development server and static production bundles                            |
| Tailwind CSS 4                | Vite plugin, theme tokens, template utilities, and responsive/state styling |
| DM Sans + Bricolage Grotesque | Locally bundled Latin variable fonts                                        |
| Node.js 24+                   | Local CLI tools and native TypeScript tests                                 |
| Playwright                    | Chromium workflows against the production build                             |

The app requires no account, backend, remote data source, or extra UI library. All dependencies and CLI tools are installed locally inside this independent project.

## 🎨 Tailwind Styling

The Vite config enables `@tailwindcss/vite`. `base.css` imports Tailwind, defines font tokens, and uses `@apply` for small native control defaults. `style.css` defines project colors through `@theme`. Actual application templates use Tailwind utilities for grid/flex layouts, spacing, typography, borders, colors, responsive behavior, focus, and visible states.

`data-ui`, `data-project`, and domain identity attributes are explicit browser hooks. There are no orphan semantic styling classes. Reserved preview/list containers and internal overflow keep neighboring panels stable when modes, selected details, or results change. All application layout and visible-state classes use Tailwind utilities; portable text formats carry no application styles. Reduced-motion preferences shorten transitions.

Two Fontsource variable font files are bundled as hashed local assets. Their copyright and OFL text are in [font-licenses.txt](./public/font-licenses.txt). Favicon/social artwork and SVG interface icons are original project assets.

## 📦 Included Demo Data

The original **The bench beside the river** story follows Mira noticing flowers and notes on a neighborhood bench. It contains a subtitle, three paragraphs, and 95 whitespace-separated words. First use begins with one loaded snapshot; no edit history is invented.

The complete [sample-workspace.json](./public/sample-workspace.json) includes valid provenance and is served as a public static file. The same canonical sample is defined in the domain module for first use and confirmed restoration.

## 🚀 Local Development

Use Node.js **24 or later**:

```bash
npm ci
npm run dev
```

Vite prints the local URL and binds to `0.0.0.0` for the shared container. Inspect a production bundle with:

```bash
npm run build
npm run preview
```

## 🧩 Vue Implementation

[`useHistory` builds a real `customRef`](https://vuejs.org/api/reactivity-advanced.html#customref). Its getter calls `track()` and returns the frozen workspace at a private cursor. Its setter validates/reconstructs the next workspace, ignores equal content, truncates a future branch, appends the new labeled snapshot, enforces the 30-entry limit, and calls `trigger()`.

Undo, Redo, and arbitrary history jumps change the private cursor and invoke the same notification callback. Vue computed flags and history metadata explicitly read the custom ref, so they update from those publications without deeply proxying the stored prose snapshots. All workspace fields are strings/primitives; freezing each canonical snapshot prevents accidental nested editor mutation. The separate form is a detached mutable copy.

The parent watches the custom ref and writes its current valid workspace through the shared local-draft parser. The reader and exports use that committed ref, while counters describe pending editor text. Invalid submissions keep existing snapshots and the save intact. Equal submissions do not add history or erase a future branch.

Loading a version when the form differs from the current snapshot uses a native confirmation dialog. Cancel retains the pending form. Valid full imports and confirmed sample restoration atomically reset history to one loaded workspace. Reload restores the currently saved story and begins fresh session history; the snapshot archive and labels are not persisted.

The shared modal uses `Teleport`, a unique `useId` heading, and a post-flush watcher to synchronize Vue state with native `showModal`/`close`. Escape and focus return remain native. A queued close event cannot reset a modal that has already reopened.

## 💾 Local Drafts & Data Exchange

Validated workspace data is stored under `vue-story-draft-desk:v1`. First-use and restored data are validated before use. Invalid saved JSON/schema falls back to the sample without immediately overwriting the damaged entry. A later valid change writes a new draft. Blocked storage leaves editing and downloads usable and shows a status message.

Import parses a detached candidate and replaces the workspace only after complete validation. Failure keeps current work and the saved draft intact. Workspace JSON is limited to **120,000 characters**. Known fields are rebuilt in canonical order; unknown fields and supplied provenance are not trusted or carried into the editable domain. Project markers are recomputed from validated data. Session-only selection, modes, pending forms, dialog text, and derived results are not exported as workspace state.

| Field                  | Accepted values                                                          |
| ---------------------- | ------------------------------------------------------------------------ |
| `version`, `name`      | `1`; nonblank single-line story title up to 80 characters                |
| Subtitle               | Optional single-line string up to 160 characters                         |
| Body                   | Plain text up to 10,000 characters; empty body allowed                   |
| Session snapshot label | Nonblank single-line string up to 40 characters, outside workspace state |

Ordinary line breaks and tabs are allowed in prose; disallowed controls are rejected. CRLF/CR normalise to LF. Blank lines separate preview paragraphs. Character counts use JavaScript string length; word counts split trimmed text on whitespace rather than doing linguistic tokenisation.

Plain-text export includes the committed title, optional subtitle, complete body with line breaks, and SD attribution. User markup remains literal text; the reader interpolates prose without executing HTML or Markdown. JSON retains the current canonical workspace and provenance. Neither format includes uncommitted fields, snapshot labels, prior/future versions, or session cursor state.

Download Blob URLs are revoked after download. Destructive collection removal, sample restoration, and pending-text replacement where applicable use native confirmation dialogs.

## ◈ Project Markers

- `SD` appears in the wordmark, project metadata, and workspace identity; original favicon/social artwork use its matching emblem.
- `SD-XXXXXXXX` is a deterministic 32-bit content stamp calculated from the canonical validated workspace, excluding supplied provenance.
- JSON provenance includes the project slug, `CodeSculptor`, and the marker. Downloaded artifacts carry the appropriate identity in filenames and/or metadata/content.
- Markers help identify configurations and artifacts; they are not cryptographic signatures or tamper-proof authorship claims.
- Author metadata and the MIT license retain CodeSculptor attribution.

## 🧭 Extension Notes & Nuances

- This is a local prose draft desk, without AI writing, collaboration, rich text, Markdown parsing, or document synchronisation.
- Saving creates a version only when workspace content changes. Changing the snapshot label alone does not create a new version.
- Undo/Redo publishes the selected snapshot and saves that current version locally. A new save after Undo permanently replaces the session’s later branch.
- The latest 30 snapshots are retained. Older entries are evicted, so the earliest available version may no longer be the initially loaded story.
- Pending invalid or unsaved text stays in the form until correction, confirmed history navigation, or a complete import/restore.
- Imports and sample restoration replace pending fields and reset the archive. Export before replacement if you want to keep the current committed story.
- Preview paragraphs collapse ordinary whitespace within a paragraph; text export preserves body line breaks.
- Extend snapshot validation, history bounds, persistence rules, and portable formats together when adding new workspace fields.

The application and documentation are English. At 320 px panels stack, while larger screens use the shared grid. Scrollable data regions, named native controls, visible focus styles, and a single main landmark remain available across layouts.

## ✅ Build & Checks

```bash
npm run build
npm run format:check
npm test
npx playwright install chromium
npm run test:e2e
```

`build` runs `vue-tsc` before Vite. Native tests use Node’s built-in runner. Playwright starts the current production bundle with the local preview command and does not reuse another server. Build before browser tests so they inspect current output. `npm run format` formats maintained source; dependencies, generated output, lockfiles, and browser artifacts are excluded.

Six native tests cover sample/newline provenance, prose limits and empty bodies, paragraph/word counts and literal text exports, actual customRef watcher publication/frozen snapshots/duplicate suppression, Undo/Redo/jump branch replacement, and bounded eviction/atomic reset. Four domain browser workflows verify committed-versus-pending views, history navigation and reload, pending-edit protection and failed saves, duplicate/30-entry behavior with stable preview geometry, and real committed text downloads.

Shared browser workflows check valid/failed imports, persistence after reload, provenance downloads, blocked/corrupt storage, confirmed sample restoration, native modal reopening/Escape/focus, real Tailwind grid behavior, named visible controls, and overflow at 320–1440 px. A separate maximum-content case downloads and re-imports the full JSON workspace at 320 px. These are local production checks, not a deployed Vercel smoke test.

## ▲ Vercel Deployment

1. Import the repository and select this project folder as the Root Directory when deploying from the shared workspace.
2. Use the committed config: `npm ci`, `npm run build`, and output folder `dist`.
3. Check the root page, public sample/artwork, and main editor after deployment.

The explicit `vercel.json` rewrites only `/` to `/index.html` and permanently redirects `/index.html` to `/`. There are no client routes requiring a catch-all rewrite. Declared routes preserve missing-resource behavior. HTML and unhashed public files revalidate; Vite’s hashed JS/CSS/font assets receive one-year immutable caching. All responses include `X-Content-Type-Options: nosniff` and `Referrer-Policy: strict-origin-when-cross-origin`. The dev command accepts Vercel’s `$PORT` with `--strictPort`.

Used fields, route compilation, and generated asset/cache behavior are checked locally against the [official Vercel configuration schema](https://openapi.vercel.sh/vercel.json). Vite preview does not emulate deployment headers. SVG social artwork is included as an editable source; platforms requiring raster cards need a rendered image and an absolute deployed image URL.

## 📄 License

[MIT](./LICENSE) · Copyright (c) 2026 **CodeSculptor**. Bundled fonts retain separate OFL licenses.
