# S-DOI-OLIVE-1 — olive-oil mint-ready (cert) · Elon PASS pending Claude live mint

**STATUS:** Elon PASS pending Claude live mint. Claim-complete on page + freeze PDF. Physics caps wired. Do not mint from this agent — Claude Desktop has DataCite creds and executes `docs/ELON_BRIDGE.md` ORDER S-DOI-OLIVE-MINT-1.

This is the cert-side companion to `docs/ELON_BRIDGE.md`. Index-side species≤parent kill-gate + rice proof is `paleofoundation/heavymetalindex` PR #136 — this cert independently wires the same physics cap so freeze PDFs cannot print species>parent.

## Claim table extract (olive-oil)

| Analyte | Limit (ppb) | Basis |
|---|---:|---|
| Pb | 80 | gov_floor (GSO) |
| Cd | 30 | gov_floor (IL) |
| tAs | 100 | gov_floor (CODEX) |
| tHg | 20 | gov_floor (IL) |
| Ni | 100 | disclosed read_across (EU 2024/1987 formula-liquid) |
| Sn | 200000 | disclosed read_across (EU 2023/915 canned-food Sn) |
| Al | 1000 | disclosed read_across (EU 10/2011 Al SML) |
| Cr | 300 | disclosed read_across (CN GB 2762 liquid milk) |
| Cr-VI | 10 | disclosed read_across (US-CA SWRCB MCL); ≤ Cr 300 |

iAs and MeHg are **omitted** from the Master Limit Table (totals-only; speciation is not a defining pathway). Compiled cells remain `type: subsumed` with `binding_total` 100 / 20 for lab reflex speciation — they must not appear as monitored / blank / bounded on the claim surface. Derivation (page + freeze PDF) still lists them as numeric 100 / 20 (≤ parent).

Two PDF paths: the committed freeze edition is `/static/standards/olive-oil.pdf` (200 in this build). The chrome Download PDF button points at `/standards/olive-oil.pdf` (web edition, emitted by `postbuild-document-editions.mjs` on Vercel). Quartz-only local builds 404 that second path until postbuild.

## What still blocks DOI mint

1. **Claude live mint** — ORDER S-DOI-OLIVE-MINT-1 in `docs/ELON_BRIDGE.md`. This agent must not run `mint-dois.mjs --live`. Claude Desktop has DataCite creds.
2. **REGISTERED** — `cert_doi` is null until Claude writes the production DOI (no test prefix).
3. **HMI compile SoT** — confidence ≥ 0.95 live on the Index side; companion HMI PR #136 (species≤parent).
4. **Post-mint** — write `cert_doi`, regenerate freeze+web PDFs, update ledger to MINTED, commit+push main, live-verify page+PDF+doi.org.

PR #75 / `7ae4633` is on `main`. Olive-oil page + freeze PDF are claim-complete.

## Operator commands (Claude Desktop, after Elon PASS)

```
node tools/standard-readiness-lint.mjs --strict
node tools/claim-surface-lint.mjs
node tools/panel-coherence-lint.mjs
node tools/mint-dois.mjs --types=standards --slug=olive-oil
# Claude Desktop only (DataCite creds):
# DATACITE_MODE=live node tools/mint-dois.mjs --types=standards --slug=olive-oil --live
```
