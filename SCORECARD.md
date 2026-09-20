# SCORECARD — CAT1-STATUS-V2-KILL-MAXPOL-1

Program-wide replacement of the MaxPoL **A–E certification ladder** with the Method v2
status lifecycle. **HOLD:** no DataCite mint runs until CEO/Elon PASS on the live page + this scorecard.

## Explicit supersession (not a surprise)

The prior **PR #96** (`SCORECARD — CAT1-MANUAL-V3-BUILD-MINT-1`) deliberately **KEPT**
"statuses A–E, MaxPoL, baseline." **This order reverses that decision.** MaxPoL % bands
(101–150 Transitional, 151–200 Probation, >200 Suspension-by-%) are **RETIRED**. A brand is
Certified only at ≤100% of every published limit; no certification and no mark above the limit.

## Before → after: the status model

| | Before (MaxPoL ladder — retired) | After (Method v2) |
|---|---|---|
| Metric | `MaxPoL` = max percent-of-limit drives status | No status metric; **Certified = every analyte ≤ 100% of its published limit** (gov_floor \| disclosed read_across), under the MU decision rule |
| A | Certified — MaxPoL ≤ 100% | **Certified** — mark permitted |
| B | Transitional (mark withheld) — 101–150%, Tier 2 only | folded into **Remediation** — *no mark, not certified* |
| C | Probation — 151–200% (Low 151–175 / High 176–200) | folded into **Remediation** — reaction severity by tier, not by % band |
| D | Suspension — >200% MaxPoL or hard-stop | **Suspension** — hard-stop only (legal-limit violation, data-integrity failure, directive failure) |
| E | Revocation | **Revocation** — willful / concealment / persistent |
| Tiering | Tier 2 "carries a 150% transitional allowance" (permission to exceed) | Tier 1/Tier 2 set **reaction severity only** — never permission to exceed a limit and keep the mark |
| Confidential Remediation Track | ambiguous vs. status | **explicitly NON-certified, unmarked** (kept) |

## What was kept (per order)

- **Method v2** limit-setting: government floor \| disclosed read-across. No new ppb invented. No Zenodo reprint.
- **Certified = 100% of published claim limits** under the **MU decision rule** (Result ± MU vs limit).
- **Lot Testing**: risk tiers, **lab-informed schedule assignment** (§4.9), **90% stay-in-program gate** (§4.10), totals-always, pathway speciation (species ≤ parent), reflex triggers.
- **Suspension / Revocation** keep their teeth — reworded off MaxPoL onto hard-stop / willful / concealment.
- **Confidential Remediation Track** — retained, restated as expressly non-certified (mark withheld).

## Files flipped (407 tracked files vs `origin/main`)

**Authored source (manual):** `data/manuals/cat1-manual/part2-program.md`, `part4-lot-testing.md`, `part5-backmatter.md` (part1 was already clean).
**Cornerstone / content:** `content/program/structure.md` (A–E table → four statuses; "Variance to 150%" → "Overage allowed: none"), `content/mark.md`, `content/portal.md`, `content/program/corrective-action.md`, `content/index.md`.
**Generators (fixed → regenerated):** `tools/lib/manual-v3-page.mjs`, `tools/lib/manual-page.mjs`, `tools/build-category-standard-pages.mjs`, `tools/build-cat1-standard-pages.mjs`, `tools/build-cert-analyte-pages.mjs`, `tools/build-manuals-page.mjs`, `tools/build-cat17-manual-pdf.mjs`.
**Audit tool (flipped to enforce v2):** `tools/audit-cat1-manual-consistency.mjs` — GOLDEN now asserts the four-status model; FORBIDDEN now rejects `MaxPoL`, `Status A–E`, `150% transitional`, `101–150 / 151–175 / 176–200`, `Transitional (mark withheld)`, `probation`, plus a cross-source check on `structure.md` + `hmtc-primer.md`.
**Data:** `data/method/method-v2.json`, `data/analytes/analytes.json` (8 per-metal treatments), `data/why-limited/nickel.json`, `aluminum.json`, `data/standards/{cat17-manual,cat24-pages,grains-pages,seafood-pages}.json`.
**Briefings:** `data/briefings/hmtc-primer.md`, `defense-counsel-briefing.md`.
**PDF:** `content/static/manuals/HMTc-Infant-and-Child-Foods-Program-Manual-v3.pdf` regenerated from the rewritten parts (verified: v2 language, no retired ladder).
**Regenerated output:** 351 `content/standards/*.md`, 9 `content/analytes/*.md`, 6 `content/manuals/*.md`, 2 `content/briefings/*.md`, 2 `content/why-we-limit/*.md`, plus `content/static/data/*.json` exports and home-stats.
**Docs:** `docs/design-canon/MANUAL-PAGE.md`.

## MaxPoL residual count

`MaxPoL` / `Status A–E` / `150% transitional` / `transitional allowance` / `Transitional (mark withheld)` / `101–150|151–175|176–200` / cert-ladder `probation` in rendered surfaces + authored source: **0**.

- One retained string: `data/source-panels/briefings/after-palmquist.json` — a **historical citation-provenance note** ("printed pp. 326–329 (probation, reflex testing, custody)") describing which pages of the earlier printed manual were read. It is a citation trail, **not a cert-ladder assertion**; rewording it would misstate the citation. Flagged, intentionally kept.
- `tools/audit-cat1-manual-consistency.mjs` contains these terms **as its forbidden-pattern list** (that is the guard, by design).

## Remediation is still NON-certified

Confirmed in `part2-program.md §2.4/§2.7`, `structure.md`, `mark.md`, `portal.md`, `content/manuals/infant-and-child-foods.md`: Remediation (incl. the Confidential Remediation Track) carries **no mark**, is **not listed as certified**, at any margin, on any metal.

## No mint

`tools/mint-dois.mjs` / `tools/mint-queue.mjs` **NOT run**. No DataCite deposit, no ledger write. Held for PASS on the live page + this scorecard.

## PR mechanics

Branch `cat1-status-v2-kill-maxpol` is cut from **`origin/main`** (the true live tip, which already contains the 258-standard DataCite mint write-backs and the prior v3 work). `mint-live-run` was **not** used as the base — it is 10 commits behind `origin/main`, so a PR from it would have reverted the mint write-backs + PR #93–96. The diff is therefore **only this status rewrite and its regeneration** — no local WIP is uploaded.

## Validation

`audit-cat1-manual-consistency` PASS · `npm run prebuild` PASS (terminology-lint, method-drift-lint, firewall-cert-lint, claim-discipline-lint, panel-coherence-lint, pdf-producer-lint, design-lint, dedash `--check`) · all edited JSON valid.
