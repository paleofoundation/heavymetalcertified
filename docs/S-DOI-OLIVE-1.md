# S-DOI-OLIVE-1 — olive-oil mint-ready (cert) · MINT HOLD

**STATUS:** claim-complete on page + freeze PDF. Physics caps wired. **Do not mint DataCite.** Elon must PASS.

This is the cert-side companion to an HMI `ELON_BRIDGE` STATUS row. This PR is `paleofoundation/heavymetalcertified` only; it does not write HMI `ELON_BRIDGE`. Index-side species≤parent kill-gate + rice proof is `paleofoundation/heavymetalindex` PR #136 — this cert PR independently wires the same physics cap so freeze PDFs cannot print species>parent. HMI was not cloned in this workspace (GitHub API 404 from here).

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

## What still blocks DOI mint after this PR

1. **DataCite credentials** — `DATACITE_USER`, `DATACITE_PASSWORD`, `DATACITE_PREFIX` are not present here; prefix is still unread from Fabrica (`docs/DOI-MINTING-LEDGER.md`).
2. **Elon PASS** — human mint gate. This PR must not run `mint-dois.mjs --live`.
3. **REGISTERED** — `cert_doi` is null; readiness `ready` stays false until a production DOI is written back.
4. **HMI ELON_BRIDGE** — compile SoT / confidence ≥ 0.95 live on the Index side; not updated in this cert PR. Companion: HMI PR #136 (species≤parent).
5. **Production deploy** — this revision's Quartz `check:v3` exited **0** (257 assertions). The page is still not live until this PR is merged and the production deploy finishes.

## Operator commands (after PASS)

```
node tools/standard-readiness-lint.mjs --strict
node tools/claim-surface-lint.mjs
node tools/panel-coherence-lint.mjs
node tools/mint-dois.mjs --types=standards --slug=olive-oil
# only after Elon PASS + creds:
# DATACITE_MODE=live node tools/mint-dois.mjs --types=standards --slug=olive-oil --live
```
