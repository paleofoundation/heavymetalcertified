# Researcher identity and publication metadata

## Identity contract

`data/researcher-identity.json` is the shared author record for the Heavy Metal
Index and Heavy Metal Certified implementations. It supplies the full ORCID
`0000-0002-2348-7259`, citation name, current positioning, exact profile URLs,
and the Institute of Contaminant Standards / The Paleo Foundation affiliations.
Keep the two repositories' copies identical when updating this contract.

The stable person identifier remains
`https://contaminantstandards.com/people/karen-pendergrass#person`.
Person, organization, website and publication identifiers are distinct. The
Institute uses its own `contaminantstandards.com` URL. Paleo Foundation's
`founder` property points to the person; co-founding is not an `alumniOf`
relationship. These statements express attribution and affiliation, not legal
ownership, peer review, or a promise of algorithmic authority.

The supplied Scholar profile ID is `xnzAh-wAAAAJ`. The LinkedIn URL preserves
the actual profile slug `karenpendergras`. Platform homepages such as
`https://orcid.org` and `https://google.com` must never appear as this person's
identifiers. The person record can describe a current affiliation without
rewriting another author's credit or a historical publication's title/date.

## DataCite

Use `data/datacite-creator.json` as one element of the API payload's
`data.attributes.creators` array, or enter those fields in Fabrica. The minting
code obtains the same block from the shared identity. Creator
names, ORCID scheme and dual affiliation use DataCite's current JSON field names.
Do not invent ROR identifiers for organizations without a verified record.

Actual coauthors retain their names, order, identifiers and affiliations.
Third-party literature is not reattributed to the site operator. Existing-record
updates must target the owned repository, retain unrelated metadata, and use a
creator-only update plan rather than re-minting a DOI or changing its target URL.
Historical Zenodo deposits are reviewed in their own repository and edition
context; the site's minting credentials do not authorize arbitrary Zenodo edits.

From either repository, prepare a plan using public reads:

```sh
node tools/update-doi-creators.mjs --template --check
node tools/update-doi-creators.mjs --out=reports/datacite/creator-update-plan.json
```

Inspect the saved before/after creator arrays and held records. Applying that
concrete plan requires credentials for the configured production repository:

```sh
node tools/update-doi-creators.mjs --apply --plan=reports/datacite/creator-update-plan.json --backup-dir=reports/datacite/backups
```

The apply command reads `DATACITE_USER` and `DATACITE_PASSWORD` from the
environment, checks repository ownership and fresh creator digests, saves the
old record, sends only the creators attribute, and verifies the result. It does
not register new DOIs, publish draft records, or change landing URLs. An edited
or stale plan is rejected. Rerunning an already-applied plan skips current records.
Never paste credentials into documentation or commit them with an update plan.

Adding ORCID to a DOI does not itself put the work in an ORCID profile. DataCite's
ORCID auto-update integration requires the author's permissions. See
[DataCite creator schema](https://datacite-metadata-schema.readthedocs.io/en/4.7/properties/creator/)
and [DataCite–ORCID integration](https://support.datacite.org/docs/datacite-and-orcid).

## DOI landing pages and Scholar tags

The reusable head component derives metadata from the actual document record.
It emits the title without the site's SEO title suffix, one `citation_author`
per actual author, the publication date at its known precision, and the canonical
HTML URL. Eligible works with a produced PDF expose an absolute PDF URL. A DOI
belongs to the exact displayed publication/edition, not merely a cited source.

The intended shape is:

```html
<meta name="citation_title" content="Exact publication title">
<meta name="citation_author" content="Pendergrass, Karen">
<meta name="citation_publication_date" content="Known YYYY/MM/DD or YYYY">
<meta name="citation_doi" content="The publication's registered DOI">
<meta name="citation_abstract_html_url" content="Its canonical landing URL">
<meta name="citation_pdf_url" content="Its direct, matching PDF URL">
```

This illustrates the template; placeholder values must not be published. Routine
website updates are not publication dates. Do not invent a day for a year-only
record or add a journal title to an institutional report. Reports use accurate
institution/report-number fields. Preserve the authors and identifiers of
external source pages separately from the site's own research and standards.

Google Scholar also requires a crawlable, individual paper URL with a complete
author-written abstract or full text. PDFs need searchable text and must be no
larger than 5 MB; the PDF linked from an abstract must be in the same subdirectory.
Ordinary HTML links should expose the papers without login or user interaction.
Metadata cannot turn a marketing page into a scholarly paper. See the
[Scholar inclusion guidelines](https://scholar.google.com/intl/en/scholar/inclusion.html).

The current infant-food manual has no DOI for its current edition in the
publication manifest. Its older Zenodo identifiers remain historical citations.
An explicit editorial publication hold must be resolved before enabling scholarly
metadata; merely finding a DOI string is not a release decision.

## Person and organization JSON-LD

The homepage graph connects the person, Institute, Paleo Foundation and Heavy
Metal Index using stable IDs. The author biography exposes a `ProfilePage` whose
`mainEntity` is the same person. Article emitters refer to the same identity,
and visible bios use the same research emphasis. Head metadata is rendered on
the server; search crawlers do not need a client-side injection or an API call.

The HMI implementation preserves its evidence/certification boundary: its graph
does not acquire certification offers or an HMTc parent organization. Related
ownership or affiliation does not make separate entities interchangeable `sameAs`
records. An update to a marked homepage graph replaces the old graph rather than
appending another identity each time the build runs.

Structured data helps describe entities, but Google does not guarantee indexing,
rich results, a Knowledge Panel, or a particular ranking. Scholar profile
membership is managed separately from site metadata. See
[Google's structured-data policies](https://developers.google.com/search/docs/appearance/structured-data/sd-policies),
[ProfilePage documentation](https://developers.google.com/search/docs/appearance/structured-data/profile-page)
and [Scholar profile help](https://scholar.google.com/intl/en/scholar/citations.html).

## Biography and partner copy

The author pages use the requested bridge:

> Building on a decade of establishing global standards at the Paleo Foundation,
> Karen Pendergrass designed the Heavy Metal Index to address toxicological
> exposure limits through a traceable evidence system.

Short biography for documentation or a partner's author description:

> Karen Pendergrass is a standards architect and independent researcher at the
> Institute of Contaminant Standards. Her work connects dietary heavy metal
> exposure, microbial metallomics, and traceable research systems. She co-founded
> the Paleo Foundation and designed the Heavy Metal Index evidence architecture.

Use concise links that accurately describe their destinations:

- `Independent researcher Karen Pendergrass` → the author biography.
- `Karen Pendergrass's heavy metals methodology` → the actual methodology page.
- A publication's exact title → its DOI landing page.

These are editorial options, not a requirement for every partner to repeat the
same keyword anchor. Partners should choose natural wording in relevant context.
Paid placements need the appropriate `rel="sponsored"` or `nofollow` treatment;
avoid manufactured reciprocal links or distributed optimized-anchor campaigns.
See [Google's link guidance](https://developers.google.com/search/docs/crawling-indexing/links-crawlable)
and [link-spam policy](https://developers.google.com/search/docs/essentials/spam-policies#link-spam).
No partner outreach is sent by this workflow.

## Publication and observation

Run `npm run metadata:audit` and `npm run metadata:test` on HMTc. The first is also
part of prebuild; it checks identity/template agreement and publication metadata.
The HMI worktree has its own metadata audit and regression suite. Preserve the
existing design-fidelity and release checks in addition to these metadata checks.

After release, verify the canonical landing URL and direct PDF without a login,
inspect the emitted head, validate structured data, and use Search Console URL
Inspection for crawl/index status. Check Scholar by exact publication title and
review the author's public Scholar profile separately. A successful local check
establishes correct output, not that Google has crawled or accepted the work.
