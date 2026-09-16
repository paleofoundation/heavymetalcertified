# Researcher metadata implementation — 16 September 2026

## Delivery status

Implemented locally in two isolated worktrees:

- HMTc: `codex/researcher-metadata` at `/Users/karenpendergrass/Documents/ChatGPT/heavymetalcertified/work/citation-context`.
- HMI: `codex/hmi-researcher-identity` at `/Users/karenpendergrass/Desktop/hmi-researcher-identity`.

The implementation covers the shared researcher identity, future DataCite creator generation, plans for existing public DOI records, dynamic publication headers, homepage/profile JSON-LD, visible biographies, and reusable partner copy. No deployment, live DataCite mutation, or partner outreach occurred.

## What changed

The two repositories share identical identity JSON, creator JSON, creator-update helpers, CLI, and identity auditor. Karen's full ORCID is `0000-0002-2348-7259`; her canonical Person ID remains `https://contaminantstandards.com/people/karen-pendergrass#person`. Both Institute of Contaminant Standards and The Paleo Foundation appear as named affiliations. Exact ORCID, Scholar and LinkedIn profile URLs replace generic platform URLs.

Homepage and author-profile graphs connect distinct person, organization and website entities. Paleo Foundation uses its `founder` relationship, rather than treating co-founding as `alumniOf`. HMI retains its evidence/certification boundary. The biography connects the Paleo Foundation history to heavy metal exposure research, microbial metallomics and systems architecture.

Publication metadata uses the actual authors, title, DOI, immutable publication date and matching PDF. Coauthors and foreign publications retain their credit. Date precision is preserved: a known year does not become an invented January 1 date, and modification dates do not become publication dates. HMTc's older JSON-LD emitters follow the same rules and refresh their own metadata without duplicating graphs.

The shared DataCite workflow validates the real ORCID, preserves other creators and identifiers, verifies ownership, rejects stale or tampered plans, creates backups and performs creator-only updates. Future minting uses the same creator template and actual publication fields. The API workflow has a documented GET-to-PUT concurrency limitation; it is not an atomic compare-and-swap.

See [architecture and editorial guide](../researcher-metadata-architecture.md) and [DataCite update instructions](../DATACITE-CREATOR-UPDATES.md).

## Existing DOI inventory

Public DataCite client enumeration found exactly **30 findable records**, all represented by the saved plans:

| Repository | Public records | Planned creator updates |
| --- | ---: | ---: |
| HMTc `vaju.hdawai` / `10.83138` | 4 | 4 |
| HMI `vaju.hmi` / `10.83376` | 26 | 26 |

The plans and complete public-record snapshots are in `reports/datacite/` in each worktree. Public enumeration cannot account for private drafts. The historical Zenodo manual DOI is held separately because the current web edition and owning repository differ.

**These plans remain unapplied.** The available local credential configuration did not match either production repository and was not used. Applying the plans requires the correct production repository credentials; credentials must not be added to source control.

## Verification

| Check | Result |
| --- | --- |
| HMTc metadata regression tests | 31 passed |
| HMI metadata and DataCite regression tests | 19 passed |
| TypeScript checks, both worktrees | Passed |
| Shared identity/template audit | Passed; shared files identical |
| HMTc local publication audit | 509 pages examined; 44 eligible; zero errors; five documented holds/warnings |
| HMTc rendered fidelity gate | 1,118 assertions passed |
| HMI rendered DOI metadata | All 26 DOI reports passed; titles match public DataCite records |
| HMI foreign source metadata | All 3,088 rendered source pages preserved original authors/DOIs |
| HMTc scholarly PDFs | All 44 are searchable, have matching titles/authors and same-subdirectory URLs, and are below 5 MB |
| HMI DOI PDFs | All 26 meet the same checks |
| Git whitespace checks | Passed |

HMTc's direct Quartz build and selected document/JSON-LD postprocessors completed. The author profile was also inspected at desktop and mobile widths. HMI's full direct Quartz build and full postbuild completed, emitting 5,110 files and 36 scholarly PDFs. Machine-readable PDF and metadata verification results are saved under `reports/researcher-identity/`.

## Remaining publication and release work

1. **Four HMTc standards retain their existing scholarly holds:** infant-formula-powder, non-root-vegetable-purees, menstrual-tampons and olive-oil have `scholar_eligible: false`. Their registered DOIs are included in creator-update plans, but the implementation does not bypass the editorial holds to emit Scholar tags.
2. **The current infant-food manual has no current-edition DOI in the publication manifest.** Its older Zenodo DOI remains a historical reference and is not presented as this edition's DOI.
3. **HMI's broader browser fidelity gate is unresolved:** 743 of 866 chrome assertions passed; 123 failed. The non-gating body inventory has 23 gaps. These concern selectors and layout dimensions/corners/shadows. This task changed no stylesheet or design specification, but an untouched-HEAD browser baseline was not run, so the failures are not claimed as proven pre-existing. See the [HMI audit](/Users/karenpendergrass/Desktop/hmi-researcher-identity/docs/audits/2026-09-16-researcher-identity-metadata.md) and its saved gate log.
4. **HMTc's full prebuild remains blocked by the separately observed standards-data issue:** missing required iAs/MeHg cells for cooking-oils-other/olive-oil. The full prebuild was not rerun or bypassed for release. Metadata checks and the direct build do not constitute a clean full release pipeline.
5. After resolving the release blockers and publishing, inspect the live canonical HTML and PDFs, then check crawl/index status and the Scholar profile separately. Metadata describes authorship and affiliations; it does not guarantee Google indexing, ranking or profile assignment.

No changes to research claims, rich citation records, thresholds or certification rules were made as part of this metadata implementation.
