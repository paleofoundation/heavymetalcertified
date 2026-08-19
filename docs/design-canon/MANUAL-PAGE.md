# Program Manual page — canonical v3 design

The bound, citable **Program Manual** landing page for a category (`/manuals/<slug>`). This is the
canonical spec every manual follows — ported verbatim from the approved Claude Design canvas
"Heavy Metal Certified v3.dc.html" (`isManual` screen). It is **canonical, universal, and always
followed**: one renderer produces every manual, and the build blocks on any deviation.

> Palette/type note: like the rest of this repo, use the **HMTc cert values** (`#9f2727` accent,
> `#faf7f4` ground, system-sans body), never the Index values quoted in the older canon `.md` files.
> See `AGENTS.md §3` and `quartz/styles/cert-chrome.scss`.

## One renderer, no exceptions

Every Program Manual page is emitted by **`tools/lib/manual-page.mjs`** (`renderManualPage(data)`).
Both generators call it, so all manuals are byte-identical in design and only the data differs:

- `tools/build-cat1-manual.mjs` — Infant and Child Foods (Cat 1), data from `tools/lib/cat1-manual-data.mjs`.
- `tools/build-category-manual.mjs --pages=data/standards/<cat>-pages.json` — every other category, data from the pages file's `_meta` block.

The "What is likely to struggle" section is the shared `tools/lib/struggle-section.mjs`. Version
history is appended by `tools/build-cert-version-history.mjs` from
`data/standards/version-history/<slug>.json`. **Never hand-edit a generated `content/manuals/*.md`
— change the renderer or the data and regenerate**; a hand-edit is overwritten on the next build
and will fail `design-lint`.

## The page shape

**Hero + rails are frontmatter-driven** (the site v3 components `HeroBand.tsx` · `Snav.tsx` ·
`Rail.tsx`), never hand-rolled in content. The body carries only the sections. A hand-rolled `<h1>`
in the body is the old duplicate-title defect — the hero title is the HeroBand's, from `title`.

### Frontmatter contract (what the renderer emits)

| Field | Drives | Notes |
|---|---|---|
| `title` | Hero `<h1>` | `"<Category> — HMTc Program Manual"` |
| `type: standard` | Hero KIND badge → "Standard" | matches the canvas chip; no side-effects |
| `breadcrumb_leaf` | Hero breadcrumb leaf | the short category name |
| `description` | Hero dek (one sentence) | never leave to auto-derivation |
| `snapshot` | Hero page-snapshot card | `[{k,v}]`, ≤4 rows (Subcategories · Analyte panel · Method · Web edition) |
| `author` + `orcid` | Hero byline + ORCID iD | Karen Pendergrass · 0000-0002-2348-7259 |
| `pdf` | **Rail** PdfCard (the single canonical download) | absolute `/static/manuals/…`; omit when no PDF is served |
| `hero_action` | Hero download link | mirrors the PDF when served |
| `connections` | Rail "Connections" list | `[{label,href}]` |
| `rail_box` | Rail "Document versions" box | `{title, body}` — **no cta** (the PdfCard is the download) |
| `effective_date` / `updated` | Hero "UPDATED" stamp + snapshot | |

The PDF lives **only in the rail** (`aside.rail a[download]` == 1; `.wiki-content a[download]` == 0).

### Body sections (raw HTML, v3 inline styles)

Each is a `<section>` whose `<h2>` carries the anchor `id` (the id is on the `<h2>`, not the
`<section>`, so `snavScrollSpy` also lists the markdown-injected `## Version history` — a complete
"On this page" rail):

1. `<h2 id="scope">` **Scope and method** — the universal government-limit lead + the category method note.
2. `<h2 id="matrix">` **Master limit matrix** — one row per subcategory × analyte panel + Basis. Sticky first column, canonical burgundy head (from `.wiki-content thead`, not inline), right-aligned IBM Plex Mono values, and a **Tier 1 / Tier 2** legend.
3. `<h2 id="hard">` **What is likely to struggle to meet this standard** — a no-JS `<details>` accordion per analyte (`.hmtc-mhard*`, styled in `cert-chrome.scss`), from `struggle-section.mjs`.
4. `<h2 id="edition">` **About this edition** — prose + the Heavy Metal Index callout (`border-left:3px #9f2727` on `#fdf4f3`).
5. `## Version history` — markdown table, injected by `build-cert-version-history.mjs` (only when a version record exists).

## Enforcement (always followed)

- **`tools/design-lint.mjs`** (wired into `prebuild`, build-blocking) scans `content/manuals/`:
  no inline bold / `<strong>` / `<b>`; and structural conformance — no body `<h1>`; frontmatter
  carries `description` / `snapshot` / `connections`; the body carries `<h2 id="scope|matrix|hard|edition">`.
- **`design/v3-acceptance.cert.json`** + `npm run check:v3` (Playwright, release path) assert the
  rendered chrome, the canonical table head, no-bold, and the rail-only download.

If you add a new category manual, add its `--pages=<cat>-pages.json` invocation to `prebuild` (with a
`_meta` block: `category`, `category_name`, `panel`, `tier1`, `tier2`, `manual_slug`,
`manual_method_note`, `effective_date`, optional `download_pdf`). The design comes for free.
