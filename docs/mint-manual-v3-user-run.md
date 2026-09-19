# USER-RUN live deposit — Cat-1 Manual v3

Manual v3 is mint-ready after content PASS. This agent does **not** live-deposit.
House prefix `10.83138` / Fabrica `VAJU.HDAWAI`. Suffix is locked:

`hmtc.manual.infant-and-child-foods`

Do not invent a DOI. Do not reuse the Zenodo edition
`10.5281/zenodo.20771543` (concept `10.5281/zenodo.20270511`) as the current DOI.
Those remain `earlier_edition_doi` / superseded rows only.

## Dry-run (this PR)

```bash
node tools/mint-dois.mjs --types=manuals --slug=infant-and-child-foods
```

Expected: one candidate, suffix `hmtc.manual.infant-and-child-foods`,
`relatedIdentifiers` includes `IsNewVersionOf` → `10.5281/zenodo.20771543`,
rights `All rights reserved`. No `DATACITE_*` in this environment → planning
report only.

Optional payload inspect (needs a prefix in env; does not deposit):

```bash
DATACITE_PREFIX=10.83138 DATACITE_MODE=test \
  node tools/mint-dois.mjs --types=manuals --slug=infant-and-child-foods --emit
```

Inspect `tools/.doi-deposit/manuals.infant-and-child-foods.json`. Do not commit it.

## Live deposit (USER / CEO after PASS)

Same path as the Cat-1 standards mint. Credentials stay out of the repo.

```bash
DATACITE_USER=<Fabrica VAJU.HDAWAI repo id> \
DATACITE_PASSWORD=<repo password> \
DATACITE_PREFIX=10.83138 \
DATACITE_MODE=live \
  node tools/mint-dois.mjs --types=manuals --slug=infant-and-child-foods --live
```

`--live` without those env vars is a no-op (dry-run / planning report).

Write-back on persist:

1. `content/manuals/infant-and-child-foods.md` → `cert_doi: "10.83138/hmtc.manual.infant-and-child-foods"`
2. `data/manuals/manifest.json` → matching `doi`
3. `data/standards/version-history/infant-and-child-foods.json` → current edition `doi`, `doi_pending` removed

Then regenerate so the Cite line, Highwire `citation_doi`, and ScholarlyArticle
identifier pick up the house DOI (never the Zenodo earlier edition):

```bash
node tools/build-cat1-manual.mjs
node tools/build-cert-version-history.mjs
node tools/build-manuals-page.mjs
node tools/build-cat1-manual-pdf.mjs
```

`readExistingHouseDoi()` re-reads a `10.83138/` value so a later generate does
not wipe the mint.
