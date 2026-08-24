# Regulatory Watch publishing

Regulatory Watch is a Research series and evidence-to-action tracker. It is not a second blog template and it is not a source of automatic threshold changes.

## Required sequence

1. Confirm that the incoming file is the firewall-clean HMI snapshot at `data/regulations/cert-regulatory-watch-snapshot.json`. Never publish directly from a roundup or newsletter.
2. Run `npm run regulatory:watch:impact`. The builder assigns one auditable impact class and a plain-language rationale to every event. It may identify a governance review; it may not edit a published standard.
3. Run `npm run regulatory:watch:build`. This creates the living hub at `/articles/regulatory-watch` plus JSON and CSV feeds under `/static/data/`.
4. Author full analyses only in `data/articles/regulatory-watch/`. The ordinary article generator supplies the canonical research-document apparatus, PDF, citations, FAQ, snapshot, and connections rail.
5. Give each analysis one search-intent cluster, a unique `seoTitle`, a concise search description, a separate social description, publication/modified/evidence-verification dates, series fields, event IDs, jurisdictions, analytes, instruments, official/HMI citations, and related standard URLs.
6. Keep proposed, consultation, delayed, litigated, and monitor-only events visibly non-binding. A tracker entry must say what changed, legal status, date, analytes/scope, who is affected, the HMTc impact, what does not change, evidence-verification date, and its official/HMI sources.
7. Run `npm run regulatory:watch:check`, then the repository's full prebuild, firewall, method, design, regulatory-link, test, type, build, `check:v3`, and SEO crawl-metadata gates.
8. Verify the hub, an analysis, and a related regulation page at desktop and mobile widths. Confirm self-canonicals, JSON-LD, Scholar metadata/PDFs for analyses only, sitemaps, `llms.txt`, feeds, downloads, citations, and internal links.

## Impact classes

- `current-binding-limit-change`
- `future-binding-limit-candidate`
- `testing-panel-or-analytical-method-change`
- `disclosure-reporting-requirement`
- `supply-chain-or-market-access-consequence`
- `context-with-no-direct-hmtc-change`
- `insufficient-evidence`

An impact record describes a consequence of verified law or evidence. It does not alter a certification threshold. Any threshold review must enter the program's existing governance process and cite the corresponding HMI regulation/limit records.

## Promotion rule

A tracker item graduates to a standalone analysis only when it has a distinct search intent, adequate official evidence, enough practical consequence to sustain a substantive document, and a non-duplicative internal-link role. Thin pages for every mention are prohibited.
