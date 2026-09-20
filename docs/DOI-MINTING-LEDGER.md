# DOI Minting Ledger

Tracks every HMTc artifact awaiting a DOI, so that when the **DataCite** prefix lands, minting is
systematic and each assigned DOI is recorded in one place. Registrar is **DataCite** (not Crossref).

- **Registrar:** DataCite. **Membership APPROVED 2026-08-27** (onboarding complete).
- **Prefix:** 🟨 read the auto-assigned prefix from DataCite Fabrica after creating the repository.
  Recommendation (ratified by the 2026-08-27 preflight audit): **two repositories = two free prefixes** —
  one for `heavymetalcertified` (standards/manuals), one for `heavymetalindex` (wiki pages) — which
  reinforces the Part 1 firewall at no marginal cost (flat membership covers ≤100k DOIs/yr). The
  universal `10.5072` test prefix is **retired**; a test repository gets its own assigned prefix.
- **Minting tool:** `tools/mint-dois.mjs` (built + audit-hardened 2026-08-27). Env-gated
  (`DATACITE_USER`/`PASSWORD`/`PREFIX`/`MODE`); dry-run + `--emit` + `--manifest` without credentials.
- **DOI is stored in:** each page's `cert_doi` front-matter field (the tool writes it, inserting the
  line if absent), which renders the resolvable `https://doi.org/…` cite line and the citation `<meta>`.
  `standard-readiness-lint.mjs` reads `cert_doi` (fixed 2026-08-27 — it previously read a `doi:` field
  no standard carries, so minting would have flipped **zero** REGISTERED gates).
- **Status legend:** ⬜ pending · 🟨 metadata prepared · 🟦 submitted to DataCite · ✅ minted + `cert_doi` filled

## S-DOI-OLIVE-1 — olive-oil (2026-09-10) · **Elon PASS pending Claude live mint**

Karen P0 for Kasandrinos. Elon PASS issued 2026-09-10 (`docs/ELON_BRIDGE.md` ORDER S-DOI-OLIVE-MINT-1). Claude Desktop executes live mint; this agent must not `--live`.

| Gate | Status |
|---|---|
| 8 totals numeric (Pb 80, Cd 30, tAs 100, tHg 20, Ni 100, Sn 200000, Al 1000, Cr 300) | ✅ |
| Totals-only claim table (iAs/MeHg omitted — speciation not defining) | ✅ |
| Cr-VI 10 ≤ Cr 300 (published numeric) | ✅ |
| Species≤parent kill-gate (`claim-surface` + `panel-coherence`) | ✅ |
| Page + freeze PDF honest (no bounded/blank claim cells) | ✅ PR #75 / `7ae4633` on `main` |
| Readiness COMPLETE for `olive-oil` | ✅ compiled |
| REGISTERED (production DataCite DOI) | ❌ pending Claude live mint |
| Elon PASS | ✅ PASS 2026-09-10 — Claude live mint pending |
| DataCite creds (`DATACITE_USER` / `PASSWORD` / `PREFIX`) | ❌ not in this environment (Claude Desktop) |
| Cert `ELON_BRIDGE` ORDER | ✅ `docs/ELON_BRIDGE.md` S-DOI-OLIVE-MINT-1 |
| HMI compile SoT | ⬜ confidence ≥ 0.95 on Index; companion HMI PR #136 |

**Remaining mint steps (Claude Desktop, ORDER S-DOI-OLIVE-MINT-1):**

1. `git pull origin main` (must include PR #75 / `7ae4633+`).
2. claim-surface + panel-coherence + readiness `--strict` must exit 0; mint dry-run COMPLETE.
3. Confidence ≥ 0.95 every published claim cell or STOP.
4. Live mint: `DATACITE_MODE=live node tools/mint-dois.mjs --types=standards --slug=olive-oil --live`.
5. Write `cert_doi` on the page; regenerate freeze+web PDFs so the DOI appears; update this ledger to MINTED.
6. commit+push `main`; wait Production; live-verify page+PDF+doi.org.

Do not mint any other slug. No test prefix in `cert_doi`. A claim-surface FAIL is still never mintable.

## Preflight audit + corrected first batch (2026-08-27)

A six-agent adversarial audit returned NO-GO on the naive "mint everything" plan and caught defects
now fixed in the tooling:

- **Non-standards excluded** — `finder.md` (type `standards-finder`), `standards-index`, and
  `butter-and-ghee.md` (type `standard-in-development`, 0/10 analytes) no longer mint. Only
  `type: standard` pages are eligible. (`scholar_eligible` is the Scholar-indexing-subset flag, not a
  publish signal — it is deliberately NOT gated on for standards.)
- **Zenodo skip corrected** — the deposited-edition skip now reads the item's OWN frontmatter
  (`deposited_doi`/`zenodo_doi`/`concept_doi`/`doi`), not a whole-body substring, so complete standards
  that merely CITE a Zenodo source paper (beef-product, baby-talcum-powder) are no longer false-skipped.
- **Write-back is total** — inserts `cert_doi:` when absent; a no-op write hard-aborts (prevents minting
  an irreversible findable DOI that never gets persisted).
- **Completeness gate** — default is **COMPLETE-only** (per `readiness-manifest.json`).
  ORDER S-DOI-FORCE-1 (2026-09-10): claim-surface FAIL (blank / monitored / subsumed / null
  on the eight totals, or rice / infant-cereal missing numeric iAs) is **never mintable**.
  `--include-incomplete` cannot override a claim-surface FAIL. See
  `docs/claim-surface-strict-rollout.md`. Do not mint until the fail-closed canary is
  green and the operator explicitly runs `--live` with credentials.
- **Test-prefix guard** — a sandbox DOI is never written into `cert_doi`; `DATACITE_MODE=live` required to persist.
- **Default is standards-only** — manuals/articles/briefings (`--types=all`) are held until their Zenodo
  reconciliation is recorded (see Open decisions), so the infant/seafood/grains Zenodo editions are not re-minted.
- **Versioning** — the minted `cert_doi` is the **concept DOI** (stable slug, points to current version,
  carries `version`); per-revision version DOIs (`IsNewVersionOf` chain) are added on first revision.
  Minting the concept DOI now does not foreclose the concept-DOI model.

## Summary

| Batch | Count | Notes |
|---|---:|---|
| Standards (34 categories) | **348** | Definite — each is a versioned, citable standard. None assigned. |
| Category manuals | **3** | Zenodo history — the 384-page deposited editions have Zenodo DOIs; decide keep vs re-mint. |
| Synthesis articles | **24** | All `scholar_eligible`. Confirm new DataCite vs existing Zenodo. |
| Public briefings | **8** | The `scholar_eligible` subset of 18 briefings. Confirm whether briefings warrant DOIs. |
| **Total** | **~383** | |

## Minting projects — Standards (one DOI per subcategory standard)

| Project | Resource type | Count | Landing | Status | Assigned DOIs |
|---|---|---:|---|---|---|
| Standards — Cat 1 · Infant and Child Foods | Standard | 9 | `/standards/*` | ⬜ pending | |
| Standards — Cat 2 · Infant and Child Personal Care (Ages 0-5) | Standard | 16 | `/standards/*` | ⬜ pending | |
| Standards — Cat 3 · Grains, Cereals, and Rice Products | Standard | 12 | `/standards/*` | ⬜ pending | |
| Standards — Cat 4 · Fruits, Vegetables, and Produce | Standard | 8 | `/standards/*` | ⬜ pending | |
| Standards — Cat 5 · Beverages | Standard | 17 | `/standards/*` | ⬜ pending | |
| Standards — Cat 6 · Seafood | Standard | 7 | `/standards/*` | ⬜ pending | |
| Standards — Cat 8 · Water and Water-Based Products | Standard | 4 | `/standards/*` | ⬜ pending | |
| Standards — Cat 9 · Infant and Child Contact Products (Ages 0-5) | Standard | 8 | `/standards/*` | ⬜ pending | |
| Standards — Cat 10 · Infant and Child Durable Goods and Textiles (Ages 0-5) | Standard | 12 | `/standards/*` | ⬜ pending | |
| Standards — Cat 11 · Meat, Poultry, and Eggs | Standard | 9 | `/standards/*` | ⬜ pending | |
| Standards — Cat 12 · Household Cleaning and Dishwashing | Standard | 21 | `/standards/*` | ⬜ pending | |
| Standards — Cat 13 · Cosmetics and Personal Care — Leave-on | Standard | 19 | `/standards/*` | ⬜ pending | |
| Standards — Cat 14 · Cosmetics and Personal Care — Rinse-off | Standard | 12 | `/standards/*` | ⬜ pending | |
| Standards — Cat 15 · Feminine Care | Standard | 10 | `/standards/*` | ⬜ pending | |
| Standards — Cat 16 · Dietary Supplements (Human) | Standard | 24 | `/standards/*` | ⬜ pending | |
| Standards — Cat 17 · Pet Foods | Standard | 10 | `/standards/*` | ⬜ pending | |
| Standards — Cat 18 · Pet Supplements | Standard | 7 | `/standards/*` | ⬜ pending | |
| Standards — Cat 19 · Laundry and Fabric-Contact Home Products | Standard | 13 | `/standards/*` | ⬜ pending | |
| Standards — Cat 20 · Oral Care | Standard | 10 | `/standards/*` | ⬜ pending | |
| Standards — Cat 21 · Children's Toys, Arts, and Crafts | Standard | 21 | `/standards/*` | ⬜ pending | |
| Standards — Cat 22 · Home Air and Inhalation-Adjacent Products | Standard | 15 | `/standards/*` | ⬜ pending | |
| Standards — Cat 23 · Food-Contact Consumer Goods and Kitchenware | Standard | 30 | `/standards/*` | ⬜ pending | |
| Standards — Cat 24 · Dairy and Milk Products | Standard | 9 | `/standards/*` | ⬜ pending | |
| Standards — Cat 25 · Cannabis, Hemp, and CBD Products | Standard | 6 | `/standards/*` | ⬜ pending | |
| Standards — Cat 26 · Peptides, SARMs, and Research Chemicals | Standard | 5 | `/standards/*` | ⬜ pending | |
| Standards — Cat 27 · Legumes and Pulses | Standard | 4 | `/standards/*` | ⬜ pending | |
| Standards — Cat 28 · Nuts, Seeds, and Their Butters | Standard | 6 | `/standards/*` | ⬜ pending | |
| Standards — Cat 29 · Edible Fungi | Standard | 3 | `/standards/*` | ⬜ pending | |
| Standards — Cat 30 · Culinary Oils and Fats | Standard | 2 | `/standards/*` | ⬜ pending | |
| Standards — Cat 31 · Sweeteners and Syrups | Standard | 4 | `/standards/*` | ⬜ pending | |
| Standards — Cat 32 · Condiments, Sauces and Dressings | Standard | 5 | `/standards/*` | ⬜ pending | |
| Standards — Cat 33 · Chocolate, Cocoa and Confectionery | Standard | 3 | `/standards/*` | ⬜ pending | |
| Standards — Cat 34 · Herbs, Spices, Seasonings and Salt | Standard | 4 | `/standards/*` | ⬜ pending | |
| Standards — Cat 35 · Prepared and Packaged Meals | Standard | 3 | `/standards/*` | ⬜ pending | |

Cat 1 is finalized (arsenic, FDA-action-level, aluminium decisions all landed) and is the natural
first batch to mint once the prefix arrives.

## Minting projects — Manuals, Articles, Briefings

| Project | Resource type | Count | Landing | Status | Notes |
|---|---|---:|---|---|---|
| Category Program Manuals | Report / Text | 3 | `/manuals/*` | ⬜ pending | infant-and-child-foods, seafood, grains-cereals-rice. **Decide:** new DataCite DOI vs the existing Zenodo DOIs on the deposited 384-page editions (per program memory). |
| Synthesis-coverage articles | Text / Article | 24 | `/articles/*` | ⬜ pending | all `scholar_eligible`. **Confirm:** mint new DataCite or keep any existing Zenodo DOIs. |
| Public briefings (scholarly subset) | Text | 8 | `/briefings/*` | ⬜ pending | the `scholar_eligible` 8 of 18 briefings. **Confirm:** are briefings DOI-worthy, or public explainers only? |

## DataCite metadata each item needs (DataCite Metadata Schema 4.x)

Required/recommended fields, derivable from front-matter + program constants:

- **DOI** — `10.<prefix>/<suffix>` (suffix scheme below)
- **Creator** — Pendergrass, K. (ORCID 0000-0002-2348-7259)
- **Title** — page `title`
- **Publisher** — Institute of Contaminant Standards (ICS)
- **PublicationYear** — 2026 (from `effective_date`)
- **ResourceType / resourceTypeGeneral** — Standard → `Standard`; Manual → `Report`; Article → `Text` (JournalArticle); Briefing → `Text`
- **Version** — `standard_version` (standards) / `standard_version` or edition (manuals)
- **URL** — `https://heavymetalcertified.com/<landing>`
- **RelatedIdentifier** — `IsSupplementedBy`/`References` the Heavy Metal Index literature (`hmi_literature_link`) and the regulation register
- **RelatedIdentifier (cover image)** — see §Cover images below. Not an `og:image` field (DataCite has none).
- **Rights** — All rights reserved (`https://heavymetalcertified.com/license`). No CC BY on cert deposits.

## Cover images (ORDER HMTC-OG-COVER-DATACITE-1)

DataCite Metadata Schema 4.x has **no `og:image`**. ReadCube and social unfurlers read `og:image` /
`twitter:image` on the **landing page**. Those tags — and the DOI Image URL — are the
**1200×630 letterbox** (`<stem>-og.png`). The tall first-page PNG (`<stem>.png`, e.g. 1020×1320)
is the left-rail ManualAuthority only and is never `og:image`.

| Field | Value |
|---|---|
| `relatedIdentifierType` | `URL` |
| `relatedIdentifier` | `https://heavymetalcertified.com/static/manuals/covers/<stem>-og.png` (1200×630) |
| `relationType` | **`HasPart`** |
| `resourceTypeGeneral` | `Image` |

**Why HasPart, not IsSupplementTo.** DataCite relationType describes resource A (the deposited
work) → related resource B (the cover URL). `A HasPart B` = the manual includes the cover image
as a part. `A IsSupplementTo B` would mean the manual is a supplement *to the image* (inverted).
`IsSupplementedBy` would treat the cover as supplementary material; the cover is page 1 of the
PDF, so HasPart is the tighter description.

Landing-page wiring: `socialImage` (`<stem>-og.png`) → `Head.tsx` `og:image` + `twitter:image`
(1200×630, `summary_large_image`). `pdf_cover` (`<stem>.png`) stays on the rail and is not
aliased into OG. Generic `/static/og-image.png` remains the fallback when no OG derivative
exists (most standards; manuals still in preparation).

**PATCH already-minted records** (optional, gated — does not mint a new DOI):

```
# dry-run plan only
node tools/mint-dois.mjs --update-covers --types=manuals --slug=infant-and-child-foods

# live PUT after SCORECARD + Elon gate (DATACITE_MODE=live, credentials in env)
DATACITE_MODE=live node tools/mint-dois.mjs --update-covers --live --types=standards --slug=<already-minted>
```

`--update-covers --live` GETs the Fabrica record, merges the Image URL if absent, and PUTs.
It never POSTs a new DOI and refuses a test-prefix DOI. Do not run a live mass PATCH without
the scorecard and an Elon gate.

## Proposed DOI suffix scheme (for review)

Human-readable, stable, collision-free:

- Standards: `hmtc.std.<category>.<product_slug>` — e.g. `10.<prefix>/hmtc.std.1.baby-cereals-dry`
- Manuals: `hmtc.manual.<category>` — e.g. `10.<prefix>/hmtc.manual.1`
- Articles: `hmtc.article.<slug>`
- Briefings: `hmtc.brief.<slug>`

Version handling: mint a base DOI per item; on revision, either update the same DOI's metadata
(recommended for living standards) or mint a versioned DOI (`…-v2`) with `IsNewVersionOf`.

## Minting process (once the prefix lands)

1. Fill the prefix at the top of this ledger.
2. I build a **deposit-metadata generator** (`tools/build-doi-deposit.mjs`) that reads every
   DOI-eligible page's front-matter and emits per-item DataCite metadata (JSON for the REST API, or
   the DataCite XML) using the scheme above — no page content is authored, only reshaped.
3. You submit through **DataCite Fabrica** (UI) or the DataCite REST API with your account
   credentials. *(This step is yours — it is an authenticated deposit I cannot perform.)*
4. Paste each returned DOI into the corresponding page's `cert_doi` front-matter, mark the row ✅
   here, and rebuild. The cite line and `<meta>` then resolve live.

## Decisions (resolved 2026-08-27; per CLAUDE.md `wwsaid`)

- **Zenodo manuals/preprints** — **KEEP, do not re-mint.** They are already DataCite-registered with
  deposited PDFs; re-minting fragments citations. Record each existing Zenodo DOI in a `deposited_doi:`
  frontmatter field so the tool keeps it, then link the new-prefix landing page via `IsNewVersionOf`
  (if the standard revised) or `IsIdenticalTo` (if mirrored unchanged). Never `IsVariantFormOf`.
- **Suffix scheme** — adopted: `hmtc.std.<cat>.<slug>`, `hmtc.manual.<slug>`, `hmtc.article.<slug>`,
  `hmtc.brief.<slug>`, sanitized to `[a-z0-9._-]`.
- **Versioning** — concept DOI now; version DOI per material revision (ceiling/analyte/basis change),
  chained `IsNewVersionOf`/`IsPreviousVersionOf` with the `version` field. Typo/format fixes reuse the DOI.
- **Briefings** — the `scholar_eligible` subset gets DOIs (Text), as part of the pubs batch.

## Remaining sequence (pubs batch + landing pages)

Before minting manuals/articles/briefings (`--types=all`):
1. Record `deposited_doi:` on the infant/seafood/grains manuals and the JFM preprint articles that
   already have Zenodo DOIs, and wire the `IsNewVersionOf`/`IsIdenticalTo` relatedIdentifier.
2. Confirm every DOI'd landing page renders the DOI hyperlink + citation + schema.org JSON-LD
   (DataCite's landing-page obligation) and add a build-lint that fails when a page carries a DOI in
   frontmatter but does not render it. Same lint on the Index side.
3. Reconcile the 6 COMPLETE readiness-manifest records whose slug does not match a content
   `product_slug` (currently held conservatively; 48 complete records → 42 matched).

## Open (genuinely yours — DataCite Fabrica, authenticated)

- Create the repository/repositories and read the assigned **prefix(es)**; generate **Repository
  credentials**; place `DATACITE_USER`/`PASSWORD`/`PREFIX` in the environment (a gitignored `.env` or
  the app secret store) — never in source, never pasted into chat. Start with a **test** repository
  (`DATACITE_MODE=test`) for the Cat-1 sandbox rehearsal, then production.
