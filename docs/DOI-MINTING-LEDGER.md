# DOI Minting Ledger

Tracks every HMTc artifact awaiting a DOI, so that when the **DataCite** prefix lands, minting is
systematic and each assigned DOI is recorded in one place. Registrar is **DataCite** (not Crossref).

- **Registrar:** DataCite
- **Prefix:** ⬜ pending assignment from DataCite (as of 2026-08-18)
- **DOI is stored in:** each page's `cert_doi` front-matter field (currently `null` everywhere), which
  renders the resolvable `https://doi.org/…` cite line and the citation `<meta>`. Fill it in after minting, then rebuild.
- **Status legend:** ⬜ pending · 🟨 metadata prepared · 🟦 submitted to DataCite · ✅ minted + `cert_doi` filled

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
- **Rights** — CC BY 4.0

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

## Open decisions (yours)

- **Articles & manuals with Zenodo history** — keep the existing Zenodo DOIs, or re-mint under the
  DataCite prefix for a single registrar? (Re-minting changes the citable identifier.)
- **Briefings** — DOI-worthy scholarly outputs, or public explainers that stay DOI-free?
- **Suffix scheme** — approve the scheme above or adjust.
- **Versioning policy** — same-DOI-updated vs versioned-DOI for living standards.
