# Citation context engine

The source drawer can publish reviewed explanations on any page with a supported
numbered bibliography. The engine inventories citations, prepares research jobs,
validates reviewed results, and builds the compact page records consumed by the
drawer. It does not generate unverified summaries or call a paid API. Codex or an
editor researches each queued source and returns a reviewed batch.

The original Big 8 explanations remain the reviewed seed. Additional records use
the same reader-facing fields: full citation, source summary, what it establishes,
page-specific relevance to HMTc, and one or more source links.

## Run a batch

Run these commands from the repository root. Options use `--name=value`.

```sh
npm run citations:audit -- --out=reports/citation-context/audit.json
npm run citations:batch -- --limit=5 --out=reports/citation-context/batch.json
```

To focus on one page:

```sh
npm run citations:batch -- --page=briefings/brief-7-four-vs-eight --limit=5 --out=reports/citation-context/batch.json
```

Use a real slug from the audit's `pages` array. The batch contains a `jobs` manifest,
an empty `records` array, and an `unresolved` array. Each job includes the full page
body, nearby citation passages with actual Markdown file line numbers, the existing
source row, available links and identifiers, source/page hashes, and the exact
research prompt. There is no need to reconstruct context from the title.

Give the batch to Codex with this request:

> Research the citation jobs in this batch. Follow each job's researchPrompt, read
> the primary sources, and fill records with reviewed explanations and evidence
> notes. Preserve jobs unchanged. Put inaccessible or unresolved sources in
> unresolved with a reason. Do not import until the source checks are complete.

Complete `records` using the schema below, then validate and import:

```sh
npm run citations:import -- --file=reports/citation-context/batch.json
npm run citations:import -- --file=reports/citation-context/batch.json --write
npm run citations:build
npm run citations:audit -- --out=reports/citation-context/audit.json
```

Import is a dry run unless `--write` is present. An unresolved job may be omitted
from `records`; it remains pending on the next batch. A batch containing no reviewed
records is rejected rather than presented as progress. Import writes local data;
it does not commit, push, or deploy. The normal site build runs the index validation
after the content generators have finished.

## Reviewed result schema

Each entry in the batch's `records` array covers one page. Put several reviewed
references for that page inside its `refs` object; do not duplicate the page entry.

```json
{
  "page": "briefings/example",
  "reviewed": "2026-09-15",
  "refs": {
    "1": {
      "referenceTitle": "Exact title from the job",
      "citation": "Complete verified bibliographic citation.",
      "summary": "What the source studied, reviewed, reported, or enacted.",
      "establishes": "Its supported finding or rule, including relevant limitations.",
      "relevance": "Why that evidence matters to the claims on this particular HMTc page.",
      "links": [{"label": "Original source", "href": "https://example.org/source"}],
      "pageDigest": "copy the exact pageDigest from the job",
      "sourceDigest": "copy the exact sourceDigest from the job",
      "review": {
        "reviewer": "Person or agent that performed the source review",
        "date": "2026-09-15",
        "evidence": [
          {
            "url": "https://example.org/source",
            "note": "What was read and what supports or limits the explanation; include a page or section locator when available."
          }
        ]
      }
    }
  }
}
```

This is a schema illustration, not a ready-to-import review. The hashes, page,
number, title, evidence and links must come from the actual job and source review.
Every published link needs a corresponding evidence note with the exact same URL.
Extra evidence URLs can document verification, limitations or contradictions with
the page. Evidence notes are editorial provenance and are not sent to the browser.

An optional `kind` string can correct the drawer's source category after review
(for example, `Industry survey` or `Preprint`). Explain the classification in its
evidence notes. Without an override the drawer retains the bibliography's label.
This does not edit the bibliography itself or change its source digest.

The importer checks the entire batch before writing any page. It rejects missing
fields, invalid dates, unsafe URLs, missing review provenance, unmatched manifests,
unknown pages or reference numbers, title changes, duplicate JSON keys, duplicate
page records and duplicate bibliography numbers. URLs must be absolute HTTP(S)
without credentials or embedded whitespace. A URL passing these structural checks
still needs the researcher's source verification.

## Scope and honest coverage

The engine scans every `content/**/*.md` file through the Markdown and HTML syntax
tree (`remark-parse`, `remark-gfm`, `remark-rehype`, `rehype-raw`). It recognizes the
same canonical reference-grid signature as the existing drawer, including rows
without `id="ref-N"`, plus the site's plain bracket and superscript citation forms.
Comma-separated groups such as `[4, 5]` contribute one use per number and render
as individually operable source controls. Ranges and arbitrary bracketed text do
not acquire inferred source numbers.

Coverage means **reviewed numbered bibliography records**, not every link on the
website. The audit separately reports:

- Canonical bibliography records, citation uses, reviewed records, and pending work.
- Numbered citations with no matching supported bibliography entry.
- Unsupported reference anchors, duplicate rows, and titles that cannot be read.
- Outbound DOI and Heavy Metal Index source-page links outside bibliography rows.
- Exact source groups and potentially ambiguous repeated titles.
- Bibliography entries with no numbered use in the page prose.

The first scan found 509 Markdown pages, 45 pages with supported bibliographies,
371 bibliography entries, 57 unresolved numbered uses, and 1,082 standalone
DOI/HMI source-link uses. These are a baseline, not hardcoded limits; rerun the
audit after content changes. Direct source links and unsupported bibliography
layouts need a separate adapter before they count toward drawer coverage. The
root `index` page does not render a drawer and is reserved; nested index pages can
have their own records.

Source identity is conservative. A reusable group requires the same normalized
title and the complete same set of DOI/URL identities. DOI URLs normalize to their
case-insensitive DOI; other URLs retain their paths, query strings and fragments.
A reference containing several documents retains all links. Sharing one DOI does
not merge two grouped references whose other documents differ. Same-title rows
with missing or different identifiers are flagged for research, never silently
deduplicated. Reuse supplies suggested citation, summary and limitations only;
page relevance is always reviewed afresh.

DOI extraction separates adjacent HTML paragraphs and anchors while preserving
inline formatting inside an identifier. This prevents following prose from
becoming a false DOI suffix. Identifier cleanup alone does not resolve unlinked
or ambiguous sources, and the exact-source group count is not a total of all
unique documents on the site.

## Usage-conscious review

Read each page once alongside its pending references. Keep the immutable batch
manifest on disk; do not repeatedly print every job's duplicated page body into
the research context. For a previously reviewed exact document edition, reuse
the retained primary-source evidence and cached document, inspect additional
sections needed by the new page, and record that reuse explicitly. Reassess each
page's interpretation and relevance; grouped citations still require every
constituent document. An earlier edition cannot establish a current obligation.

Measure account usage before a bounded batch and after validation. That meter is
account-wide and rounded, so concurrent tasks and rounding prevent exact token
attribution. A batch with many reused sources is not a reliable cost forecast
for a batch of inaccessible papers or unlinked legal materials. Save the completed
records and remaining queue before continuing within the user's usage reserve.

## Changes and refreshes

New records store two hashes. `sourceDigest` binds the source row's title, number,
kind, bibliography, finding text, links and identifiers. `pageDigest` binds the
entire Markdown body after YAML frontmatter. A body edit anywhere makes old
page-specific interpretation stale; a metadata-only YAML edit does not. Import
and build reject stale records. The drawer receives only matched, reviewed data.

Create a fresh batch after changing prose or references. On importing reviewed
replacements, the engine archives the previous complete record under
`reports/citation-context/archive/` before replacing it. Still-valid previous
references are retained. Stale unreplaced references are omitted from the new
published record and return to the pending queue; their old text and provenance
remain in the archive. This allows a page with many stale references to be
refreshed in batches of five. After a partial refresh, readers retain the ordinary
bibliographic drawer for pending references. The import result reports both the
archive paths and the stale references retired from publication.

The original Big 8 file is a deliberate legacy exception: its exact reviewed JSON
and original page body are pinned by hash. Changing its text cannot inherit legacy
approval. If its body changes, `batch --page=briefings/the-big-8` includes the
complete source set, even when that exceeds the usual batch limit, and adds a
notice explaining the expansion. Migration requires fresh review metadata and a
matching job for every original reference in one import. The old seed is archived
before replacement. The current seed is left unchanged.

Build writes `data/source-panels/index.json`, keyed by page slug, and excludes only
that root generated index from its input. Each client record contains `page`,
`reviewed`, and the six reader-facing fields per reference. Full page prose, hashes,
jobs, research prompts and evidence notes stay out of the client payload. Keep
completed source records under version control. Retain reviewed batches and
archives as editorial provenance according to the project's review workflow.

## Verification

```sh
npm run citations:test
npm run citations:build
node tools/design-lint.mjs
npm run check:v3
```

Engine tests cover real HTML/Markdown parsing, citation context, coverage gaps,
grouped source identity, unsafe URLs, title/number mismatch, duplicate data, stale
body and source changes, import manifests, dry-run behavior, compact build output,
bounded refreshes, nested index pages, and legacy seed migration. Browser checks
remain the gate for drawer behavior and visual fidelity.
