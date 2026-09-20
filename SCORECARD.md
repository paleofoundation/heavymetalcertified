# SCORECARD — HMTC-OG-COVER-DATACITE-1

Landing-page `og:image` / `twitter:image` for Program Manuals (P0) now point at the
PR #99 cover PNGs. DataCite deposit metadata gains the same absolute HTTPS URL as
`relatedIdentifiers` `HasPart` + `Image`. **No live mint. No live PATCH. No new DOI
invented.** Rights stay All rights reserved.

## Before → after: `/manuals/infant-and-child-foods` (curl meta)

Before: `curl -sL https://heavymetalcertified.com/manuals/infant-and-child-foods`.
After: `./quartz/bootstrap-cli.mjs build` then the same tags in
`public/manuals/infant-and-child-foods.html`.

| Tag | Before (live 2026-09-20) | After (this branch, local Quartz emit) |
|---|---|---|
| `og:image` | `https://heavymetalcertified.com/static/og-image.png` | `https://heavymetalcertified.com/static/manuals/covers/infant-and-child-foods-v3.png` |
| `og:image:url` | same generic card | same cover URL |
| `twitter:image` | same generic card | same cover URL |
| `og:image:width` / `height` | 1200 × 630 | 1020 × 1320 (PNG IHDR) |
| `og:image:alt` | hero dek | `Cover of Infant and Child Foods: HMTc Program Manual` |
| Generic site OG on Cat-1 | **yes (defect)** | **gone** when `pdf_cover` exists |

## Fallback (standards / manuals without a cover)

Production `/standards/olive-oil` already uses the generic card. This PR does **not**
generate 320 standard cover rasters (not cheap). No `content/static/standards/covers/`
assets. Head keeps `/static/og-image.png` + 1200×630 when `pdf_cover` / `socialImage`
are absent.

| Page | Cover asset | Expected `og:image` |
|---|---|---|
| `/manuals/infant-and-child-foods` | `covers/infant-and-child-foods-v3.png` (1020×1320) | cover HTTPS URL |
| `/manuals/pet-foods` | `covers/pet-foods-2026.png` (993×1404) | cover HTTPS URL |
| `/manuals/seafood` (and grains, dairy) | none | generic `/static/og-image.png` |
| `/standards/olive-oil` (minted; scholarly PDF exists) | none | generic `/static/og-image.png` |

A later standards cover is cheap to add: drop `content/static/standards/covers/<slug>.png`
and set `pdf_cover` / `socialImage`. Mint then emits the Image relatedIdentifier.
On-page `.hmtc-manual-cover` remains banned on standards (PR #99 density lint).

## mint-dois dry-run (no `--live`)

```
node tools/mint-dois.mjs --types=manuals --slug=infant-and-child-foods
```

```
mint-dois (cert): DRY-RUN  mode=test  prefix=<unset>
  relatedIdentifiers.Image (HasPart URL — landing-page cover; IsSupplementTo would invert A→B):
     manuals/infant-and-child-foods: HasPart URL Image https://heavymetalcertified.com/static/manuals/covers/infant-and-child-foods-v3.png
```

Seafood (no cover): `manuals/seafood: (none)`.

`--update-covers --types=standards --slug=olive-oil` (already minted, no cover):
`olive-oil: no cover asset (or not already-deposited) — no PATCH`. No DOI invented.

`--live` was **not** run. `--update-covers --live` is documented and gated
(`DATACITE_MODE=live` + credentials + Elon gate). It PUTs existing records only.

## DataCite relationType

**HasPart**, not IsSupplementTo. Schema 4.x: relationType is A (deposited work) → B
(related URL). The manual HasPart the cover image. IsSupplementTo would mean the
manual is a supplement *to the image*. `resourceTypeGeneral=Image`.
Rights: All rights reserved. No CC BY. No test prefix.

PATCH existing (after Elon gate):

```
DATACITE_MODE=live node tools/mint-dois.mjs --update-covers --live --types=manuals --slug=<already-minted>
```

## Files

- `quartz/components/Head.tsx` — `pdf_cover` / `socialImage` win over generic OG
- `quartz/util/documentCover.ts` + test — URL / frontmatter contract
- `quartz/plugins/transformers/frontmatter.ts` — `pdf_cover` aliases to `socialImage`
- `tools/lib/document-cover.mjs` + `tools/tests/document-cover.test.mjs` — cover SoT + mint dry-run gates
- `tools/lib/manual-page.mjs` — emits `socialImage` + `og_image_width/height` with `pdf_cover`
- `tools/build-cat1-manual.mjs`, `tools/build-category-manual.mjs` — resolve cover via SoT
- `tools/render-manual-pdf-cover.mjs` — jobs imported from SoT (OG + rail)
- `tools/mint-dois.mjs` — HasPart Image on deposit; gated `--update-covers` PATCH
- `content/manuals/infant-and-child-foods.md`, `content/manuals/pet-foods.md` — socialImage + dims
- `docs/DOI-MINTING-LEDGER.md` — cover + PATCH section
- `package.json` — `metadata:test` includes the new tests

Cover rasters themselves are unchanged (PR #99):
`content/static/manuals/covers/infant-and-child-foods-v3.png`,
`content/static/manuals/covers/pet-foods-2026.png`.

## Validation

- `node --test tools/tests/document-cover.test.mjs` — 6/6 pass
- `node --import tsx --test quartz/util/documentCover.test.ts` — 2/2 pass
- `node --test tools/tests/datacite-mint-adapter.test.mjs` — pass
- `node --test tools/tests/cat1-manual-v3.test.mjs` — 4/4 pass
- `node tools/design-lint.mjs` — exit 0
- `npm run build` / `prebuild` **not** used for this scorecard (prebuild regenerates
  the corpus and currently dies on a stale `defense-counsel-briefing` citation-context
  record on `main`). Quartz emit is `./quartz/bootstrap-cli.mjs build` only.

## HOLD

No DataCite POST. No mass PATCH. House DOI for Manual v3 remains unminted
(`cert_doi: null`). Do not `--live` until SCORECARD + Elon PASS.
