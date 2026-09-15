# Numbered citation expansion: measured batch 1

Completed all seven records on The Retailer as Anchor and all three on HMTc
Primer. Site coverage is now 33 of 371 numbered bibliography records, with 338
pending. Each record retains primary-source provenance and page-specific review
in its `data/source-panels/briefings/` JSON file.

## Engine improvements

- DOI extraction now respects adjacent HTML blocks/links. It removed phantom
  identifiers from 91 rows across 22 pages without invalidating existing reviews.
- Comma-separated citations, including the retailer page's `[4, 5]`, now render
  as individually operable markers and are counted separately by the audit.
- A reviewed optional `kind` corrects source categories in the drawer. The
  industry litigation survey no longer inherits a Government badge, and the cost
  model is identified as a preprint.

## Research findings retained for editorial follow-up

- The retailer page overstates the Supreme Court jurisdictional holding as a
  universal bar to dismissing retailers and a quantified exposure increase.
- Its FDA bibliography repeats incorrect cadmium and mercury detection rates.
- Its approximate MDL count of 345 was not verified. The drawer gives the
  explicitly dated December 2, 2025 official snapshot of 385 pending actions.
- The cost survey is a May 2010 industry-sponsored submission containing 2008
  data, rather than a Federal Judicial Center study from 2008.
- The cited manual is superseded. Its conditional Status B mark permission
  differs from the primer's A-only wording; its supplier alerts are discretionary
  and anonymization has stated limits.
- The grouped framework preprints describe earlier program design and assumed
  economic benefits, not independent validation of the current calculation method.
- ISO/IEC 17025 review was limited to the official publisher overview; no access
  to the full paid standard or verification of a particular laboratory is claimed.

The briefing prose and bibliography remain unchanged. Verified source facts were
reused where the exact document edition matched, with additional sections read
for the new page. Grouped references retain each constituent document.

## Validation and usage

- 15 engine tests and one citation-transformer regression test: exit 0.
- TypeScript and design lint: exit 0; existing generated-table advisory remains.
- Registry build: five reviewed pages, 33 records, exit 0.
- Direct Quartz build: 509 inputs, 862 emitted files, exit 0.
- `npm run check:v3`: 535 rendered assertions, exit 0.
- Browser: all 10 drawers opened at 1440px and 390px, with three populated
  sections, all reviewed URLs present, corrected source badges and no horizontal
  overflow.
- Weekly account meter: 31% used before cleanup/research, 32% after validation.
  This observed one-percentage-point increase includes engine work and potentially
  other account activity. The meter is rounded and does not provide exact tokens
  attributable to this task. This batch contains considerable source reuse and
  should not be extrapolated as a uniform cost per ten references.

Changes are local. The earlier engine review documents the unrelated full-prebuild
standards-renderer failure; the full release pipeline was not rerun or deployed.
