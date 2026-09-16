# Repairing the remaining 13 numbered citation records

## What was repaired

The final audit reports **401/401 reviewed numbered records across 49 pages**,
zero pending records, zero invalid records and zero unsupported bibliography
layouts. All **581 numbered citation uses** resolve. The separately inventoried
1,082 standalone DOI/HMI link appearances are outside this drawer coverage.

The 13 records previously left unresolved were worked through individually.
Two original documents were recovered. Eleven entries required an explicit
bibliography correction or narrower scope, with corresponding prose corrections
where the earlier citation did not support the page's claim.

| Page / reference | Resolution |
| --- | --- |
| After Palmquist 4 | Replaced the unidentified scheduling-order component with the precise JPML transfer order and dated docket report; corrected 345 claims to 385 pending actions on 2 December 2025, with 395 historical total actions. |
| US baby-food laws 4 | Recovered Vermont Act 110 as enacted; clarified January 2027 commencement and the separate conditional formula-inclusion provision. |
| US baby-food laws 6 | Replaced the missing HMI page with the actual FDA Closer to Zero overview; narrowed its use to secondary federal background. |
| Pet food 7 | Identified the original EU regulation and specific human-food categories; removed the unidentified national-register grouping. |
| Pet food 8 | Replaced the unspecified AAFCO edition with FDA's actual pet-food overview; removed the exhaustive claim that AAFCO/NRC materials have no relevant limits. |
| Pet food 9 | Identified HMI's dated library homepage as a discovery resource, with occurrence claims supported by named studies. |
| Supplements 2 | Replaced the incomplete four-jurisdiction grouping with verified Thai Notification 414; removed unverified comparisons and universal adult-body-weight claims. |
| Meat-label briefing 2 | Recovered federal FSIS Directive 7221.1 Revision 4 in a Maine government reproduction; distinguished federal text from the state cover sheet and corrected the approval-route description. |
| Wastewater 6 | Replaced the generic WHO/FAO label with specific FAO irrigation guidance and Codex food standards; separated water/food units, commodity basis and guideline/legal status. |
| Peptides/SARMs 4 and No Limit 3 | Replaced the unavailable 2017 announcement with FDA's current warning, explicitly; corrected the suggestion that unapproved status puts products outside drug law. |
| Bivalve cadmium 1 | Replaced the misidentified Bao/cadmium citation with an identified radiotracer study; corrected the zero-excretion claim and related unsupported cross-analyte comparisons. |
| Organ meat 7 | Replaced the unidentified offal-limit title with the precise EU instrument and Annex categories; removed the universal assertion that offal lead limits are higher. |

Original failed attempts remain in `reports/citation-context/unresolved/` as
history. The resolution ledger records each old title beside its final reviewed
identity. Existing page panels were archived before replacement.

## Evidence and editorial scope

Detailed primary-source links, access limits and before/after explanations are in:

- [Access repairs: five records](2026-09-16-citation-context-repair-access.md).
- [Pet food and supplement repairs: four records](2026-09-16-citation-repair-regulations.md).
- [Science and regulatory-source repairs: three records](2026-09-16-citation-repair-science.md).
- [Palmquist repair: one record](2026-09-16-citation-repair-palmquist.md).

The ten affected pages' existing drawer explanations were also reassessed against
the corrected prose. Reused evidence retains its access and edition limitations;
page-context reassessment is not represented as a fresh reading of every original
source. In particular, the new mussel-study explanation identifies its
abstract-only access, and the Thai document's English translation yields to the
Thai text.

Review coverage means each numbered reference has an identified source and a
supported explanation of its findings, limits and relevance. It does not endorse
every broader marketing, causal, financial or program claim in an article. The
reports and drawers retain specific qualifications that require separate
editorial work. HMI's underlying synthesis pages were not rewritten in this HMTc
repair, and program thresholds and standard datasets were not changed.

## Build and validation

Passed:

- Engine imports: 80 reviewed records on ten changed pages, including the
  13 newly resolved entries and 67 prior records reassessed; a subsequent wording review revalidated the six
  No Limit records again. No prior records were silently retired.
- Global index build: 49 pages and 401 explanations.
- Audit: 401/401 reviewed, 0 pending, 0 invalid records, 581/581 numbered uses
  resolve, 0 unsupported bibliography layouts.
- Citation engine/rendering regression suite: 16 tests passed.
- Design lint: exit 0; the existing 399-table canonicalization advisory remains.
- Metadata audit: zero errors; the five previously documented publication
  holds/edition warnings remain unchanged.
- Direct Quartz build: 509 Markdown inputs, 862 emitted files, exit 0.
- Applicable homepage, article, briefing and rationale JSON-LD and search-index
  postprocessors completed.
- In-app browser: opened all 13 repaired records and verified the three context
  sections, source links, copy controls and absence of drawer overflow. A fresh
  revision query was needed to bypass the browser's earlier cached page.
- Refreshed all 54 article/briefing and previously verified scholarly PDFs; all
  table-row counts preserved. The ten repaired page PDFs are present and each
  is below 5 MB.
- Git whitespace checks passed.

**Full design-fidelity gate: exit 0, 1,196 assertions passed.** Its acceptance
spec opens all 13 repaired records at both desktop and mobile widths in addition
to the prior checks. Saved audit, browser, PDF and fidelity artifacts
are under `reports/citation-context/repair-2026-09-16-*`.

The missing shared dependency target was repaired by replacing this worktree's
broken symlink with a local `npm ci` installation; the lockfile was unchanged.
Generators ran against temporary copies of canonical inputs, and only the ten
repaired pages plus the article index were copied back. This avoided rewriting
unrelated generated pages. The briefing importer now honors an explicit
modification date independently of the original publication date.

The shared weekly usage meter moved from 49% used at task start to 53% used after
verification: 47% remained at that observation. This is rounded account-wide
usage, not an exact task token bill.

Changes remain local until deployed. The existing full-prebuild standards-data
failure for missing iAs/MeHg cells in cooking-oils-other/olive-oil was not bypassed
or repaired. A successful direct build is not a clean full release pipeline.
