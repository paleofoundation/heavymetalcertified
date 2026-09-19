# SCORECARD — CAT1-MANUAL-V3-BUILD-MINT-1

Manual v3 for `/manuals/infant-and-child-foods`. Method v2 governing instrument.
House mint is **USER-RUN** after CEO PASS. This PR does not invent or live-deposit a DOI.

Governing Principles cited from `docs/governance/hmtc-governing-principles.md`
(cert-side mirror; the HMI path 404'd and no org copy was found). Five co-equal
objectives: drive down contamination; protect consumers; protect brands who enter;
remain legally defensible; become the de facto standard.

## KEEP / CUT

| Item | Decision |
|---|---|
| Five Governing Principles | KEEP — Part 1 / `#principles` |
| Program lifecycle / statuses A–E, MaxPoL, baseline | KEEP — `#lifecycle` |
| Mark / MU / CAPA / remediation / ratchet (short, current SoT) | KEEP — `#instruments` |
| Lot Testing Schedule rewrite (tiers × status, baseline, reflex, speciation, CoC) | KEEP — `#lot-testing` |
| Lab-informed schedule (panel / LOQ / MU / capability) | KEEP — hard section, Karen 2026-09-19 |
| 90% stay-in-program certification gate | KEEP — hard section, Karen 2026-09-19 |
| Cat-1 Standards Register (live pages + compiled orphans) | KEEP — generated from SoT, `#register` |
| Method v2 / CLAUDE.md Part 19 locks | KEEP — gov_floor \| disclosed read_across; species ≤ parent; Big-8 totals; pathway speciation; blank = HOLD |
| Exposé / ROI / scenario essays | CUT |
| Long audience reading guides | CUT |
| Part 2.5 HMI how-to nest | CUT |
| Recognition fluff | CUT |
| Reprint of 15× per-analyte master-table walls | CUT — subcategory pages remain the live derivation |
| V1 Zenodo dump as current | CUT — retired; earlier deposited edition only |
| CC BY | CUT — © All rights reserved (ICS / Heavy Metal Certified) |
| Chromium / Skia PDF | CUT — `@react-pdf/renderer` only |
| Stale hero “9 subcategories / 9 analytes / Strictest government ML / 2026-08-06” | CUT — snapshot is Live pages / Cert-ready / Method v2.0 / Edition v3 · 2026-09-19 |

## Cat-1 DOI inventory

Live `/standards/` pages (262-batch house prefix). All nine are cert-ready
(complete claim-surface + house `cert_doi`). Incomplete cells are not counted.

| Standard | Status | cert_doi |
|---|---|---|
| Infant formula (powder) | cert-ready | `10.83138/hmtc.std.1.infant-formula-powder` |
| Infant formula (ready-to-feed, liquid) | cert-ready | `10.83138/hmtc.std.1.infant-formula-ready-to-feed` |
| Baby cereals & dry grain products | cert-ready | `10.83138/hmtc.std.1.baby-cereals-dry` |
| Fruit purées | cert-ready | `10.83138/hmtc.std.1.fruit-purees` |
| Non-root vegetable purées | cert-ready | `10.83138/hmtc.std.1.non-root-vegetable-purees` |
| Root-vegetable purées | cert-ready | `10.83138/hmtc.std.1.root-vegetable-purees` |
| Mixed meals (meat & grain combinations) | cert-ready | `10.83138/hmtc.std.1.mixed-meals` |
| Fruit juice (not canned) | cert-ready | `10.83138/hmtc.std.1.fruit-juice-not-canned` |
| Teething biscuits & finger snacks | cert-ready | `10.83138/hmtc.std.1.teething-and-snacks` |
| mixed-meals-rice-containing (compiled only) | HOLD | — compiled record not joined to a live `/standards/` page |

Manual v3 current DOI: **not minted**. `cert_doi: null`.
Suffix locked: `hmtc.manual.infant-and-child-foods`.
Earlier deposited edition (retired): `10.5281/zenodo.20771543`
(concept `10.5281/zenodo.20270511`). V1 never certified a brand.

## Mint readiness

| Gate | Result |
|---|---|
| No ALL-CAPS TODO / scaffolding | PASS |
| © All rights reserved (ICS / Heavy Metal Certified) | PASS |
| APA cite; `doi.org` only when a house DOI is set | PASS (`apaCite(null)` has no doi.org) |
| react-pdf scholarly PDF, never Chromium | PASS (`react-pdf` producer; no Skia/Chromium) |
| Descriptive suffix from citation_title/slug | PASS `hmtc.manual.infant-and-child-foods` |
| No invented house DOI | PASS |
| Zenodo not in `OWN_DEPOSIT_FIELDS` on the current page | PASS (`earlier_edition_doi` only) |
| Write-back path (page + manifest + version-history; generator re-reads `10.83138/`) | PASS |
| Live credentials in this environment | FAIL — absent |
| **Mint status** | **USER-RUN** after content PASS |

### Dry-run notes

```
node tools/mint-dois.mjs --types=manuals --slug=infant-and-child-foods
```

Ran: eligible total 1 (`manuals=1`). `--emit` with prefix only (not live)
produced `10.83138/hmtc.manual.infant-and-child-foods`, title from
`citation_title`, rights All rights reserved, `IsNewVersionOf`
`10.5281/zenodo.20771543`. Payload deleted; not committed. No credentials →
no deposit.

Live USER-RUN steps: `docs/mint-manual-v3-user-run.md`
(`DATACITE_USER` / `DATACITE_PASSWORD` / `DATACITE_PREFIX=10.83138` /
`DATACITE_MODE=live` / Fabrica `VAJU.HDAWAI`).

## Gates run in this PR

| Gate | Exit |
|---|---|
| `node tools/design-lint.mjs` | 0 |
| `node tools/audit-cat1-manual-consistency.mjs` | 0 |
| `node tools/audit-cat1-manual-pdf.mjs` | 0 |
| `node --test tools/tests/cat1-manual-v3.test.mjs` | 0 |
| citationMetadata manuals ScholarlyArticle tests | 0 |
| `npm run check:v3` | run after first push (needs `public/` build) |
