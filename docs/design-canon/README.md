# v3 hero — drop-in replacement

Two files. `HeroBand.tsx` replaces the existing component wholesale; `heroBand.scss`
is new and owns the hero's styling.

## Install

```
cp HeroBand.tsx  quartz/components/HeroBand.tsx
cp heroBand.scss quartz/components/styles/heroBand.scss
```

Then **delete the `.hero-*` run from `quartz/styles/proof-design.scss`** — the block
beginning `/* ── microbiomemedicine-style hero band (in HMI burgundy) ── */`, around
lines 251–285, including its `@media (max-width: 1080px)` tail. Those rules style the
old three-column glyph layout and will fight the new file. `.hero-band`,
`.hero-wrap`, `.hero-left`, `.hero-glyph`, `.hero-center`, `.hero-crumb`,
`.hero-title`, `.hero-desc`, `.hero-actions`, `.hero-pill`, `.hero-right`,
`.hero-researched*`, `.hero-author`, `.hero-orcid`, `.hero-updated`,
`.hero-snapshot*` — all of them go.

No change to `quartz.layout.ts` or `renderPage.tsx`. The root element keeps its
`hero-band` class, so whatever lifts it out of `#quartz-root` keeps working.

## What changes, visibly

| | before | after |
|---|---|---|
| Glyph | 128px circle in a 232px column | gone — the symbol moves into the title, `Lead (Pb)` |
| Grid | 3 cols, 232px · 1fr · 288px, max 1480 | 2 cols, 1fr · 380px, gap 72px, max 1760 |
| Title | `clamp(40px, 5vw, 58px)` | 44px Lora, `-0.018em` |
| Kind badge | none | outlined mono-caps, e.g. `METAL PROFILE` |
| Actions | 4 filled pills, 3 pointing at `#sources`, 1 at `#` | 3 mono-caps outlined; `Download PDF` filled white |
| Author | `RESEARCHED BY` block in the right rail, non-clickable `iD` chip | inline in the meta row with a real ORCID link |
| Stamps | `Last updated:` only | `UPDATED` and `REV`, mono |
| Snapshot | rounded 12px card, icon rows | square box, dark header, dotted label/value rows, tabular-nums |
| Narrow | collapses at 1080px | collapses at 1149px, matching v3's `vw >= 1150` flag |

## Frontmatter it reads

All optional; the component degrades rather than erroring.

- `title` — required in practice
- `symbol` — appended as `(Pb)` when the title has no parenthetical
- `kind` — overrides the section-derived label (`Metal profile`, `Ingredient profile`, …)
- `dek` — preferred over Quartz's auto description
- `updated`, `rev` — the two mono stamps
- `snapshot` — `[{k, v}]`, wins over everything below
- `sources` / `n_sources`, `n_ingredients`, `n_products`, `n_regulations`, `n_claims`
  — assembled into snapshot rows when `snapshot` is absent

**If there are no snapshot rows the box does not render and the hero runs full
width.** An empty bordered box is worse than no box.

## Known gaps, deliberate

- `Cite this page` → `#cite-this-page`, `Version history` → `#update-history`.
  Anchors, not handlers. Wiring them is step 5's job.
- `Download PDF` → `/api/evidence-packet?slug=…`, which is live and returns a
  manifest. It is not yet a PDF. Either rename the control or point it at the PDF
  route when that exists — do not leave a button labelled PDF returning JSON.
- ORCID is `0000-0002-2348-7259`, from the v3 artifact. Confirm before shipping.
