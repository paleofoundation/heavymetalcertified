# Rich citation context: numbered-source coverage

## Result

As of 15 September 2026, 388 of 401 numbered bibliography records (96.8%) have
reviewed rich context across all 49 pages with supported bibliographies. The
original Big 8's 15 records remain intact; 373 additional records are available.
The Premium Promise now has all seven, including source record 1.
Thirty-nine pages have every numbered record reviewed; ten contain the remaining
13 unresolved records.

Every reviewed drawer includes the verified citation, source summary, what the
source establishes, page-specific relevance to HMTc, source links and copy action.
Readers can open it from an inline citation or a numbered bibliography control.
Reviewed data is saved with the site; opening a drawer does not call an AI model.

The inventory scans 509 Markdown pages. All 571 numbered citation uses resolve.
There are no unsupported bibliography layouts or invalid reviewed records in this
inventory. The 1,082 standalone DOI/HMI link appearances are a separate scope and
are not included in the 401-record denominator or claimed as enriched drawers.
Records are citation appearances; grouped references can contain several sources.

## Remaining 13 records

These retain the basic bibliographic drawer. Research attempts and exact identity
bindings are saved in `reports/citation-context/unresolved/`. All pending entries
have exactly one saved unresolved record.

| Page | References | Remaining evidence needed |
| --- | --- | --- |
| After Palmquist | 4 | Identify the December 2025 scheduling order by date/docket. |
| US baby-food laws | 4, 6 | Read final Vermont Act 110 text; recover the exact missing HMI page. |
| Pet food | 7, 8, 9 | Identify the national register, AAFCO/NRC editions and baseline collection. |
| Supplements: child-protective | 2 | Complete the grouped four-jurisdiction source review. |
| Before the Meat Label Prints | 2 | Obtain readable FSIS Directive 7221.1 Revision 4. |
| Wastewater irrigation | 6 | Identify the exact grouped WHO/FAO documents and editions. |
| Peptides and SARMs | 4 | Recover FDA's original 31 October 2017 announcement. |
| No Limit Is Not No Standard | 3 | Recover the same original FDA announcement. |
| Bivalve cadmium | 1 | Resolve the claimed Bao/cadmium paper versus its unrelated gold-nanoparticle DOI. |
| Organ meat | 7 | Identify the jurisdiction and instrument behind the generic offal-limit title. |

Some sources were accessible only as an abstract or catalog entry. Reviewed
drawers state the resulting limits; inclusion does not imply that every full
document, dataset or numerical table was available.

## Editorial follow-up

The research found unsupported causal claims, source/title mismatches, unit and
moisture-basis errors, outdated regulatory comparisons and overbroad descriptions
of advisory scope. Drawers explain these limits rather than endorse the page's
claim automatically. Article body claims remain separate editorial work.

Evidence URLs, passages and review notes accompany each record under
`data/source-panels/`; batch review notes summarize material findings. A compact
coverage snapshot is saved in
`reports/citation-context/snapshots/2026-09-15-numbered-coverage.json`.

## Reuse and future updates

The [engine guide](../citation-context-engine.md) documents audit, batch, import
and build commands. The queue selects missing or stale records; source and page
hashes prevent an old review from silently following changed claims. Matching
source evidence can be reused, while relevance is reviewed for each page.
Partial imports preserve still-valid records and archive replaced material.

The engine prepares and validates the work; Codex or an editor performs the
source review. No paid generation service or background research job is required
by the published website.

## Validation, usage and release state

- Registry validation, audit, design lint and direct Quartz build passed.
- The rendered design gate passed 1,115 assertions. Desktop/mobile checks covered
  new records in each batch, inline openings, source links, fallback behavior
  and overflow. The final two copy refinements were rebuilt and checked.
- Engine and citation-rendering tests passed after the last code changes;
  subsequent batches changed reviewed data and acceptance fixtures.
- Weekly usage moved from 31% to 46% used during the measured rollout; 54%
  remains. This is a rounded, shared account meter, not an exact task token bill.
  The 30% working reserve was preserved.

Work is committed locally on `codex/citation-context-engine`; it is not deployed.
The [initial engine review](2026-09-15-citation-context-engine.md) records the
existing full-prebuild failure: generated `cooking-oils-other` and `olive-oil`
pages lack required iAs/MeHg cells. Direct citation validation and Quartz builds
pass, but that unrelated standards-renderer issue still blocks a clean full
release pipeline.
