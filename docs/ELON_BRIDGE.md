# ELON_BRIDGE (cert)

Cert-side Elon↔Claude mint orders. Companion status: `docs/S-DOI-OLIVE-1.md` and `docs/DOI-MINTING-LEDGER.md`.

## ELON→CLAUDE ORDER · S-DOI-OLIVE-MINT-1 · 2026-09-10
Elon PASS olive-oil mint (Karen GO / Kasandrinos P0).
Repo: paleofoundation/heavymetalcertified (Desktop project heavymetalcertified).
1) git pull origin main (must include PR #75 / 7ae4633+)
2) claim-surface + panel-coherence + readiness --strict must exit 0; mint dry-run COMPLETE
3) Confidence ≥0.95 every published claim cell or STOP
4) DATACITE_MODE=live node tools/mint-dois.mjs --types=standards --slug=olive-oil --live
5) Write cert_doi on page; regenerate freeze+web PDFs so DOI appears; update ledger to MINTED
6) commit+push main; wait Production; live-verify page+PDF+doi.org
7) STATUS: CLAUDE→ELON S-DOI-OLIVE-MINT-1 | DOI=… | LIVE= | PDF= | SHA=
Do NOT mint any other slug. No test prefix in cert_doi.

## ELON→CLAUDE ORDER · S-DOI-P0-AGG-1 · 2026-09-12
P0: menstrual-tampons + 9 Cat-1 pages. 3 GREEN already minted (olive-oil + menstrual-tampons
+ infant-formula-powder + non-root-vegetable-purees — live 10.83138, audit CSV). 7 AGGREGATE
pages were blocked by a page→record tooling gap (page slug ≠ compiled-record slug), not by data.

CLAUDE→ELON STATUS (tooling complete; live deposit is Karen-run):
- Wired a shared page→record join (tools/lib/page-record-join.mjs). build-standard-pdf.mjs now
  renders ONE react-pdf per aggregate page from its joined child records (per-variant limit
  collapse "X a / Y b"; species≤parent checked on every variant). mint-dois.mjs resolves an
  aggregate page COMPLETE iff every child record is COMPLETE, and inherits a child's claim-surface
  FAIL. Generic across all *-pages.json; in practice only the 7 Cat-1 aggregates lacked a direct
  record. All 12 Cat-1 child records verified COMPLETE (rice children carry numeric iAs=20).
- Regenerated 7 aggregate react-pdfs. pdf-producer-lint PASS. readiness --strict PASS.
  mint dry-run: 7 eligible, 7 COMPLETE, 0 held, 0 claim-surface FAIL.
- LANDMINE FIXED: a branch reset had wiped the 3 uncommitted live DOIs off their pages.
  Restored from audit CSV. Added the build-category-standard-pages cert_doi self-heal to
  build-cat1-standard-pages.mjs (it lacked it) so regen never re-wipes a minted DOI.
- P0 table: 10/10 GREEN (4 minted-live; 7 mint-READY pending Karen's live deposit).

BLOCKER (pre-existing, OUT of S-DOI-P0-AGG-1, STOP-zone): `npm run prebuild` fails at
panel-completeness-lint on olive-oil + cooking-oils-other (totals-only design drops iAs/MeHg
from the claim table; the lint flags the compiled cells as never-rendered). Reproduces on the
committed HEAD pages with no regen. Blocks the Vercel deploy that would surface the new DOIs.
Governance reconciliation (totals-only ruling vs panel-completeness-lint) — NOT fixed here; the
lint warns "never delete the compiled cell to satisfy this lint."

## ELON→CLAUDE ORDER · S-DOI-CITE-LICENSE-1 + S-DOI-PANEL-TOTALS-1 · 2026-09-13
CLAUDE→ELON STATUS (working tree; push/merge/deploy is Karen-run):
- LICENSE network-lock: every standards cert surface is now © All rights reserved / no CC BY.
  Changed generators: scholarly-pdf.mjs (Cite-as + footer + Status-&-licence conditional on
  cfg.pathSeg==="standards"; briefings keep CC BY), build-standard-pdf.mjs (body Cite),
  build-cat1/-category/-standards-pages.mjs (page Cite + licence row), mint-dois.mjs (DataCite
  rightsList → All rights reserved, future deposits), build-standards-export.mjs (dataset LICENSE),
  fonts.mjs (no mid-URL hyphenation on DOI URLs).
- CITE format (when cert_doi set): APA "Standard No." — Author. (Year). *Title* (Standard No. <doi>).
  Institute of Contaminant Standards. https://doi.org/<doi>. No page URL, no "registration pending",
  no licence glued on, no version element, doi.org only.
- Rebuilt all 320 per-slug scholarly PDFs. 0 standard PDFs carry CC BY. pdf-producer-lint OK.
- PANEL-TOTALS-1: panel-completeness-lint now exempts reflex species (iAs/MeHg/Cr-VI) on totals-only
  slugs unless the species cell is firm (mirrors claimTableAnalytes). olive-oil + cooking-oils-other
  PASS; rice/infant iAs still required (claim-surface-lint canary green). panel-coherence-lint (twin)
  needed no change.
- FULL `npm run prebuild` EXIT 0 (deploy-safe). olive-oil canary PDF verified: CITE AS shows
  (Standard No. 10.83138/hmtc.std.30.olive-oil) + doi.org URL unbroken + "© All rights reserved".

OPEN / FLAGS:
- The 7 Cat-1 aggregates are NOT yet live-minted: dois-minted-2026-09-13.csv is empty and all 7
  aggregate pages carry cert_doi: null in HEAD (b243913), despite that commit's title. Their DOIs
  still need the live deposit (Karen-run one-liner).
- Already-minted DOIs (olive-oil + 3 green) carry cc-by-4.0 in their LIVE DataCite records; the code
  now deposits All-rights-reserved for future mints, but updating the existing records is a metadata
  re-deposit (PUT), Karen-run.
- Branch p0-mint-live is ahead 2 / behind 2 vs origin/main (diverged). Landing this = Karen's call.

## ELON→CLAUDE ORDER · HMTC-SCHOLAR-META-1 · 2026-09-19

CLAUDE→ELON STATUS (one PR; no live DataCite mint):

- Highwire `citation_*` + ScholarlyArticle JSON-LD now emit SSR on every
  `/standards/{slug}` (`type: standard`), independent of `scholar_eligible`.
  Publisher = Institute of Contaminant Standards. Series title = Heavy Metal
  Tested & Certified Standards. PDF SoT = `https://heavymetalcertified.com/{slug}.pdf`.
  Rights = All rights reserved. No CC BY. No Paleo Certified Inc in Scholar chrome.
- Chocolate: **STATUS HOLD**. `cert_doi` remains null. Slug is not in any
  `data/standards/doi-audit/dois-minted-*.csv`. readiness-manifest
  `chocolate.complete=false`, `registered=false`, `doi=null`,
  `claim_empty=[Sn, Al, Cr]` (claim-surface FAIL). No write-back. No live mint.
- Leftover minted Cite without doi.org (small batch): `infant-formula-powder` and
  `non-root-vegetable-purees` (minted 2026-09-12) rewritten to locked APA +
  doi.org. Remaining "DOI: registration pending" pages are unminted
  (`cert_doi: null`) — not invented.
