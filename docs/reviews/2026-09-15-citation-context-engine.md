# Citation context engine

Current status: see the [numbered-source coverage report](2026-09-15-citation-context-coverage.md).
The figures below document the original engine pilot.

Follow-up: [The Premium Promise completion](2026-09-15-premium-promise-source-panels.md)
extends that page from one pilot record to all seven. The coverage and checks
below describe the original engine pilot; that follow-up records the next checkpoint.

## Original task

The original Codex task is **Update Heavy Metal Certified site**,
`01a08a77-48c1-77b3-8a5e-4444866cc2c1`. The user requested the Big 8 pilot on
11 September 2026 at 03:30 UTC. The task reported the 15 source drawers published
at 03:52 UTC. Commit `4687cc5` introduced the data and drawer changes;
`456275f` merged its rendered assertions.

The implementation and research notes remain in
`data/source-panels/briefings/the-big-8.json` and
`docs/reviews/2026-09-11-big-8-source-panels.md`.

## This extension

The drawer now takes the current page's records from a generated registry.
The batch workflow inventories the content, prepares research jobs and validates
reviewed records before producing that registry. It never sends the whole library
or the research evidence notes to a reader's browser. A source's summary may help
research another appearance; its relevance is checked against that page's claims.

Two additional appearances of the 2021 House report exercise this distinction:

- `/briefings/brief-7-four-vs-eight`, reference 1: the report supports identifying
  the four named metals, but cannot establish later litigation proceedings.
- `/briefings/brief-6-premium-promise`, reference 2: the report supports discussing
  ingredient versus finished-product verification; it does not establish a
  first-ever testing date.

Primary report passages were read again on 15 September. The source-access scope,
page locators and copy decisions are retained in
`2026-09-15-citation-context-pilot.json`. These are two additional citation records,
not complete enrichment of those pages. Their remaining references keep the
existing bibliography-derived drawer. The source-page claims noted above remain
separate editorial work.

## Release scope

Prepared in the isolated `codex/citation-context-engine` branch based on
`2c54609` (current main when the work began). This review does not deploy to
production. Direct DOI and Heavy Metal Index links that lack a numbered drawer
are inventoried separately; they need a link adapter before they can share this
drawer workflow. Coverage figures must distinguish those links from the numbered
bibliography apparatus.

## Validation and coverage

- Engine suite: 11 tests, exit 0. Includes partial stale-page refresh with archived
  evidence, nested index pages, grouped sources and legacy seed migration.
- TypeScript: `npm run check`, exit 0.
- Design lint: exit 0, with the pre-existing generated-table advisory.
- Direct Quartz build: 509 Markdown inputs, 862 emitted files, exit 0.
- Rendered gate: `npm run check:v3`, 497 assertions, exit 0.
- Browser: page-specific records on both pilot pages; navigation through the
  Briefings index loads the destination's context; the unreviewed reference keeps
  its ordinary drawer; closing returns focus. At 390px the document and panel
  have no horizontal content overflow. Desktop and mobile layouts inspected.

The complete `npm run prebuild` stopped at the existing panel-completeness lint:
`cooking-oils-other` and `olive-oil` omit iAs and MeHg cells from their generated
pages. The citation stage comes later and was not responsible for that failure.
Running the final formatting step and citation build against the generated content
passed, confirming the reviewed hashes survive normal generation/formatting.
Unrelated generated output was restored afterward. Full release validation remains
blocked by the standards renderer issue; no production deployment was attempted.

Final numbered-reference coverage is 17 of 371 records (the original 15 plus two
pilot appearances), with 354 pending. The inventory also contains 57 unresolved
numbered uses on four pages and 1,082 DOI/HMI link appearances outside the supported
apparatus. The latter are appearances, not unique sources. The machine report is
`reports/citation-context/audit.json`; the next five research jobs are in
`reports/citation-context/next-batch.json`.
