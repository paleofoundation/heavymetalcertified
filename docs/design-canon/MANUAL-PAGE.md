# Program Manual page — canonical v3 design

The bound, citable **Program Manual** landing page for a category (`/manuals/<slug>`). This is the
canonical spec every manual follows — ported verbatim from the approved Claude Design canvas
"Heavy Metal Certified v3.dc.html" (`isManual` screen). It is **canonical, universal, and always
followed**: one renderer produces every manual, and the build blocks on any deviation.

> Palette/type note: like the rest of this repo, use the **HMTc cert values** (`#9f2727` accent,
> `#faf7f4` ground, system-sans body), never the Index values quoted in the older canon `.md` files.
> See `AGENTS.md §3` and `quartz/styles/cert-chrome.scss`.

## One renderer, no exceptions

Category manuals other than Cat-1 still use **`tools/lib/manual-page.mjs`** (`renderManualPage(data)`):

- `tools/build-category-manual.mjs --pages=data/standards/<cat>-pages.json` — every non-Cat-1 category, data from the pages file's `_meta` block.

**Cat-1 Manual v3** is a different document class (the Infant and Child Foods Program Manual for Category 1, not a matrix landing). Method version is secondary and lives at `/program/method`. It is emitted by **`tools/lib/manual-v3-page.mjs`** via `tools/build-cat1-manual.mjs`, with the live register from `tools/lib/cat1-manual-v3.mjs`. It does not reprint the master-limit matrix or the struggle accordion.

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
| `snapshot` | Hero page-snapshot card | Other manuals: `[{k,v}]`, ≤4 rows (Subcategories · Analyte panel · Method · Web edition). **Cat-1 v3 omits this.** |
| `hero_snapshot` | Suppress hero snapshot | Cat-1 v3: `false`. Live standard pages / Cert-ready / Method / Edition are register chrome, not hero chrome. Cover chip already shows Manual v3 · Method v2. Document DOI is the authority signal. |
| `author` + `orcid` | Hero byline + ORCID iD | Karen Pendergrass · 0000-0002-2348-7259 |
| `pdf` | **Center hero** Download PDF action | absolute `/static/manuals/…`; preserves the version-pinned manual PDF |
| `hero_action` | Optional non-PDF hero link | PDF downloads use the shared DocumentActions component |
| `connections` | Rail "Connections" list | `[{label,href}]` |
| `rail_box` | Rail "Document versions" box | `{title, body}` — **no cta** (the center hero owns the download) |
| `effective_date` / `updated` | Hero "UPDATED" stamp + snapshot | |

On **manuals**, the portrait first-page PDF cover (`pdf_cover`) and the Governing Instrument strip live in the **hero left column** (`.hmtc-hb-context`): cover → plain edition metadata (`Manual v3 · Method v2`). Download PDF belongs in the **center hero pane**, using the shared `.hmtc-document-actions` component: dark red `#7f1f1f`, white system-sans text, 3px corners, and 13px 15px padding. Hero action labels never include a “+” glyph, including Follow. The “Governing instrument” label is omitted. The cover and edition metadata are separated by 24px. The cover column aligns to the top; mobile retains 24px bottom padding. Edition metadata has no border, fill, or button padding. The redundant manual hero Cite link remains omitted, while the page citation block is available below. The content left rail is **On this page** only — it must not duplicate the cover or the authority strip. The right rail keeps Connections and does **not** duplicate the download. `.wiki-content a[download]` stays 0. `socialImage` remains the 1200×630 letterbox for `og:image`; `pdf_cover` is never the social card. **Standards pages never carry a PDF cover** — the claim surface stays the hero there. The right hero sidebar uses the same author card as other pages: portrait, name, ORCID, and update date, with the biography in the shared hover/focus popover. On Cat-1 Manual v3 the page snapshot is omitted (`hero_snapshot: false`) — live-page / cert-ready counts are register chrome and do not belong on a governing-instrument hero. Document DOI follows the author card as a clean single DOI block. Other category manuals still carry the snapshot card, then the DOI. An earlier Zenodo edition is not a hero snapshot row. The Document versions table below the fold (historical Zenodo rows) stays.

Spacing is the locked scale **8 / 16 / 24 / 48 / 72** (`quartz/styles/tokens.scss`, `tools/lib/design-tokens.mjs`). Manuals sections use `.hmtc-section` (`margin-bottom: var(--section-gap-manual)` = 72). Table cells use `--table-cell-pad-y/x` ≥ 12px. Hero dek and the body lead are a kill-gate: ≤2 sentences, not a word pile.

### Body sections (raw HTML, v3 inline styles)

Each is a `<section>` whose `<h2>` carries the anchor `id` (the id is on the `<h2>`, not the
`<section>`, so `snavScrollSpy` also lists the markdown-injected `## Version history` — a complete
"On this page" rail):

**Other category manuals (v2 landing):**

1. `<h2 id="scope">` **Scope and method** — the universal government-limit lead + the category method note.
2. `<h2 id="matrix">` **Master limit matrix** — one row per subcategory × analyte panel + Basis. Sticky first column, canonical burgundy head (from `.wiki-content thead`, not inline), right-aligned IBM Plex Mono values, and a single equal-at-the-gate legend (every claim analyte meets 100% of its published government floor or disclosed read-across).
3. `<h2 id="hard">` **What is likely to struggle to meet this standard** — a no-JS `<details>` accordion per analyte (`.hmtc-mhard*`, styled in `cert-chrome.scss`), from `struggle-section.mjs`.
4. `<h2 id="edition">` **About this edition** — prose + the Heavy Metal Index callout (`border-left:3px #9f2727` on `#fdf4f3`).
5. `## Version history` — markdown table, injected by `build-cert-version-history.mjs` (only when a version record exists).

**Cat-1 Manual v3 (locked thin TOC):**

0. `.hmtc-manual-lead` — two sentences. Job: what the Manual does for Category 1 infant and child foods. Method version is a pointer to `/program/method`, not the lead subject.
1. `<h2 id="principles">` **Governing Principles** — the five co-equal objectives as airy `.hmtc-principle-card`s (`docs/governance/hmtc-governing-principles.md`).
2. `<h2 id="lifecycle">` **Program lifecycle and statuses** — Certified | Remediation | Suspension | Revocation, baseline.
3. `<h2 id="instruments">` **Mark, MU, CAPA, remediation, ratchet** — current SoT, short.
4. `<h2 id="lot-testing">` **Lot Testing Schedule** — risk tiers, baseline, reflex, speciation, sampling, lab-informed schedule, 90% stay-in-program gate.
5. `<h2 id="register">` **Cat-1 Standards Register** — generated from compiled corpus + page `cert_doi` + claim-surface. Incomplete cells are HOLD, not cert-ready.
6. `<h2 id="edition">` **About this edition** — supersedes Zenodo 10.5281/zenodo.20771543 as an earlier deposited edition only.
7. `## Version history` — injected as above.

## Enforcement (always followed)

- **`tools/design-lint.mjs`** (wired into `prebuild`, build-blocking) scans `content/manuals/`:
  no inline bold / `<strong>` / `<b>`; structural conformance — no body `<h1>`; frontmatter
  carries `description` / `connections`, plus `snapshot` on other manuals or `hero_snapshot: false`
  on Cat-1 v3; the body carries `<h2 id="scope|matrix|hard|edition">` except Cat-1 v3, which carries `<h2 id="principles|lifecycle|instruments|lot-testing|register|edition">`.
  Density gate: every manuals `<section>` uses `.hmtc-section` and any inline `margin-bottom` is ≥ the token floor (48). Hero dek ≤ 2 sentences / 32 words; Cat-1 lead ≤ 2 sentences / 50 words. Tokens file must lock `--space-1`…`--space-5` to 8/16/24/48/72. Standards pages fail if a PDF cover / `.hmtc-manual-authority` appears.
- **`design/v3-acceptance.cert.json`** + `npm run check:v3` (Playwright, release path) assert the
  rendered chrome, the canonical table head, no-bold, and the hero-column download.

If you add a new category manual, add its `--pages=<cat>-pages.json` invocation to `prebuild` (with a
`_meta` block: `category`, `category_name`, `panel`, optional leftover `tier1`/`tier2` lists (not status architecture), `manual_slug`,
`manual_method_note`, `effective_date`, optional `download_pdf`). The design comes for free.
