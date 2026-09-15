# The Premium Promise: complete citation context

The initial engine pilot covered only reference 2 on this page. The user found
that reference 1 still opened the bibliography-derived record. This follow-up
completes the six remaining records, preserving the reviewed reference 2.

## Coverage and sources

All seven numbered records on `/briefings/brief-6-premium-promise` now include a
bibliographic citation, source summary, what the source establishes, page-specific
HMTc relevance, and verified source destinations. Research notes, access limits,
edition information and page locators are retained in
`data/source-panels/briefings/brief-6-premium-promise.json`.

- 1: Supreme Court opinion, with HMTc's *After Palmquist* commentary separately
  identified. The holding concerns federal jurisdiction; it does not decide
  injury causation, product liability or certification requirements.
- 2: Existing reviewed House report context retained without change.
- 3: Original FDA Total Diet Study FY2018–2020 elements report.
- 4: Original IFIC food/ingredient safety report and the separate Gallup
  food-safety and institutional-confidence reports. Dates and questions remain
  distinct.
- 5: Complete original Zenodo preprint on public exposé testing. Its argument
  is distinguished from a measured comparison of premium-brand targeting.
- 6: Complete original Zenodo cost-model preprint. Its illustrative scenario
  and assumed certification benefits are distinguished from observed outcomes.
- 7: Exact cited May 2026 v0 manual deposit, including the cited sections;
  current edition history is linked separately. This edition is superseded.

## Editorial findings

These findings are preserved for work on the briefing itself. This change does
not edit its prose or bibliography, so the existing reviewed page digest remains
valid.

- Reference 2: an August 2019 presentation does not establish that finished-food
  testing began for the first time that year.
- Reference 3: FDA's executive summary reports cadmium detection in 61% and
  mercury in 8%, conflicting with the bibliography's 33% and 10%.
- Reference 4: IFIC reports 44% somewhat confident and 11% very confident. The
  6% selecting full confidence answered a separate question. These do not support
  describing a majority as only somewhat confident.
- Reference 5: the paper does not measure a targeting rate or establish that
  premium brands are always targeted first.
- Reference 6: the abstract/introduction range differs from section 7.3. The
  drawer explicitly attributes the briefing's $1.6M–$6.6M-or-more example to that
  modeled scenario. Certification's assumed effect is not a measured benefit.
- Reference 7: the cited manual explicitly describes Clean Label Project testing
  heavy metals, contradicting the briefing's blanket clean-label claim. Its mark
  rules also do not prescribe the exact dose/population/limit wording attributed
  to them in the bibliography.

## Validation

- Import dry run and write: six new records, prior page record archived,
  no stale records retired. Reference 2 remains byte-for-byte equivalent as a
  parsed record.
- Registry build: 23 reviewed references across three pages, exit 0.
- Page audit: 7 of 7 bibliography records reviewed, zero pending and zero invalid
  records, exit 0.
- Design lint: exit 0, with the existing generated-table advisory.
- Direct Quartz build: 509 Markdown inputs, 862 emitted files, exit 0.
- Rendered gate: `npm run check:v3`, 501 assertions, exit 0; includes source 1's
  three sections and two distinct source links at desktop and mobile widths.
- Browser: opened each of records 1–7 at 1440px and 390px; all show three populated
  context sections and correct source destinations, with no horizontal overflow.
  The preview is left on source 1 for review.
- Whole-library audit: 23 of 371 numbered references reviewed, 348 pending,
  zero invalid reviewed records, exit 0. Other pages still require research.

Prepared locally on `codex/citation-context-engine`; no production deployment.
The earlier review documents the unrelated full-prebuild standards-renderer
failure. That broader pipeline was not rerun for this data-only completion.
