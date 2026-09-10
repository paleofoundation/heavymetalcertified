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
