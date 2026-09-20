# SCORECARD — HMTC-OG-COVER-DATACITE-1 (Elon FAIL fix)

Karen lock: `og:image` / `twitter:image` MUST be ~1200×630 landscape
(`summary_large_image`). The left-rail cover stays the tall first-page PNG.
**No live mint. No live PATCH. No new DOI invented.**

## Before → after: `/manuals/infant-and-child-foods` (curl meta)

Before (live, and PR #100 first emit): tall PDF page as the social card.
After: `./quartz/bootstrap-cli.mjs build` → `public/manuals/infant-and-child-foods.html`.

| Tag | Before (live / PR #100 r1) | After (this fix) |
|---|---|---|
| `og:image` | `…/covers/infant-and-child-foods-v3.png` (or generic `/static/og-image.png` on production) | `https://heavymetalcertified.com/static/manuals/covers/infant-and-child-foods-v3-og.png` |
| `twitter:image` | same tall/generic | same 1200×630 OG URL |
| `og:image:width` × `height` | 1020 × 1320 (tall) or 1200 × 630 generic | **1200 × 630** |
| `og:image:alt` | dek or `Cover of …` | `Cover of Infant and Child Foods: HMTc Program Manual` |
| Left-rail `pdf_cover` | `…/infant-and-child-foods-v3.png` 1020×1320 | **unchanged** tall raster |
| Generic site OG on Cat-1 | gone in r1, but card was portrait | gone; card is landscape |

## Split (do not collapse)

| Asset | Path | Size | Used by |
|---|---|---|---|
| Rail cover | `/static/manuals/covers/infant-and-child-foods-v3.png` | 1020×1320 | `ManualAuthority` only |
| OG derivative | `/static/manuals/covers/infant-and-child-foods-v3-og.png` | 1200×630 letterbox on `#fffdfb` | `og:image`, `twitter:image`, DataCite Image URL |
| Rail cover | `/static/manuals/covers/pet-foods-2026.png` | 993×1404 | rail only |
| OG derivative | `/static/manuals/covers/pet-foods-2026-og.png` | 1200×630 | unfurl + DataCite |

Letterbox (not crop) so the cover title stays readable.

## Fallback

`/manuals/seafood` and `/standards/olive-oil` still emit `/static/og-image.png` (1200×630).
`pdf_cover` alone never becomes `og:image` (portrait rejected).

## mint-dois dry-run (no `--live`)

```
manuals/infant-and-child-foods: HasPart URL Image https://heavymetalcertified.com/static/manuals/covers/infant-and-child-foods-v3-og.png
manuals/seafood: (none)
--update-covers --slug=olive-oil: no cover asset — no PATCH
```

The Image URL is the 1200×630 unfurl asset. The tall rail PNG is not deposited.

## Validation

- `node --test tools/tests/document-cover.test.mjs` — 7/7 pass
- `node --import tsx --test quartz/util/documentCover.test.ts` — 2/2 pass
- `node tools/design-lint.mjs` — exit 0
- OG PNG IHDR: both `*-og.png` files are 1200×630
- Quartz emit: Cat-1 / pet-foods use `*-og.png` 1200×630; seafood / olive-oil keep generic 1200×630

## HOLD

No DataCite POST. No mass PATCH. `cert_doi` on Manual v3 stays null.
