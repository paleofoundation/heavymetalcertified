# Cat-1 arsenic + soy-Cd + FDA-action-level corrections — upstream reconciliation ticket

**Status:** OPEN. Corrections applied cert-side to the committed compiled JSON via reviewed
migrations under `tools/migrations/`; upstream compiler not yet reconciled.
`tools/panel-coherence-lint.mjs` holds a species≤total invariant (permanent) plus a golden-value
tripwire (temporary) so a re-copy from the index repo cannot silently revert these values until this
ticket is closed.

**Origin:** two multi-agent scope audits, `wf2uta7ck` (arsenic/soy-Cd, 62 agents) and `wne673rzp`
(FDA action levels, 10 agents), each adversarially verified. Decisions by Karen Pendergrass,
2026-08-17: "tightest government limit whose scope actually covers the product; correct in both
directions; FDA action levels are not government limits; hold the strictest sovereign infant numbers
across the whole 0-5 category."

## Why cert-side, not a recompile

The canonical index register was missing 11 `hk_cap132v` rows the compiled records cite, on a
702-file WIP branch — a safe same-day recompile was impossible. The compiled JSON is a committed
cert-repo artifact, so corrections were applied there as reviewed, idempotent, format-preserving
transforms and guarded. This ticket records the equivalent upstream edits.

## Final corrected values (what the upstream compiler must reproduce)

Migration `2026-08-17-cat1-arsenic-corrections.py` (soy-Cd + converted flags — arsenic parts
SUPERSEDED by ...b), `2026-08-17b-cat1-ias-category-floor-20.py` (iAs 20), and
`2026-08-17c-cat1-drop-fda-action-levels.py` (FDA drops).

| record | variant | analyte | final | basis |
|--------|---------|---------|-------|-------|
| baby-cereals-dry-rice-based | both | iAs | **20** | EU baby-food 2023/915 3.4.3, read across category-wide (see decision) |
| teething-and-snacks-rice-based | both | iAs | **20** | same |
| baby-cereals-dry-non-rice | both | iAs | **20** | same |
| teething-and-snacks-non-rice | both | iAs | **20** | same |
| infant-formula-powder | soy | Cd | **20** | register soy_class mistag → EU soy powder row |
| infant-formula-rtf-liquid | soy | Cd | **10** | register soy_class mistag → EU soy liquid row |
| infant-formula-rtf-liquid | cow+soy | Sn, Cd | (flags) | cleared spurious `converted:true` on India entries |
| fruit-juice | both | iAs | **20** | FDA apple-juice action level dropped → EU fruit-juice ML (loosen, forced) |
| fruit-purees-general | both | Pb | **10** | FDA action level dropped → Panama "fruits" ML (hold) |
| non-root-vegetable-purees | both | Pb | **10** | FDA action level dropped → Brazil "other infant food" ML (hold) |
| mixed-meals-non-rice | both | Pb | **10** | FDA action level dropped → Brazil "other infant food" ML (hold) |
| mixed-meals-rice-containing | both | Pb | **10** | FDA action level dropped → Brazil "other infant food" ML (hold) |

tAs is 50 (India) on all records — unchanged.

## Decision record (Karen, 2026-08-17)

- **Total arsenic 50, inorganic arsenic 20, held across the whole 0-5 category.** EU baby-food iAs
  20 (`eu2023_ias_babyfood_20`) is the strictest sovereign infant inorganic-arsenic ceiling. Its
  scope is drafted narrowly (Directive 2006/125/EC excludes processed cereal-based food; limit set
  for infants up to 24 months), but HMTc's Infant-and-Child category covers ages 0-5 and holds every
  food in it to the tightest sovereign iAs number, applied as a disclosed read-across — the
  age-scope is not a loophole to loosen. This SUPERSEDES the earlier parent-bound iAs=50. 20 ≤ tAs
  50, coherent. Rice-based products will not meet iAs 20 by design; disclosed at `/hard-to-meet`.
- **FDA action levels are not government limits.** Audit `wne673rzp` confirmed
  `fda2025_pb_baby_food_10` and `fda2023_ias_apple_juice_10` are nonbinding final guidance; the US
  sets no binding federal ML for these metals in food (only 21 CFR 165.110 bottled water, out of
  scope). Both dropped. Four lead cells HOLD at 10 on real covering government MLs (Panama fruits,
  Brazil "other foods specially formulated for infants and young children") — no lead loosening.
  Only fruit-juice iAs loosens, forced, 10 → 20 (EU fruit-juice ML; no government arsenic ML ≤ 10
  covers a fruit juice), and it is arsenic, not lead.

## Upstream edits required (heavy-metal-index)

**BLOCKER first:** reconcile `data/evidence/regulatory_limits.csv` on main to restore the 11
`hk_cap132v` rows the compiled records cite (index worktrees `objective-kapitsa-6466e4`,
`serene-meitner-009b2c`, `fix-cat1724`, `reverent-driscoll-03cde0`).

**A. Register**
1. `soy_class` mistags: set `il_fcs2016_cd_14_...ready_to_eat_5` and `..._powder_10` from `both` to
   `non-soy` (Israel's soy rows `14_2`=10, `14_3`=20 are correct).
2. Mark `fda2025_pb_baby_food_10` and `fda2023_ias_apple_juice_10` as action levels excluded from
   binding selection (they must not be selected as MLs, and should not appear as comparators).
3. Add the Brazil catch-all `br_pb_other-foods-specially-formulated-for-inf_10` to the Pb
   per-country candidate sets of non-root-vegetable-purees and mixed-meals (it covers non-cereal
   infant foods at 10).
4. Stale India `basis` free-text (as-consumed vs as_sold); truncated Korea iAs scope. (Value-neutral.)

**B. Compiler config (`cat1-config.json` / `compile-cat1.mjs`)**
1. iAs: adopt EU baby-food 20 as a category-wide protective read-across floor for the four dry
   cereal/snack records (min with any stricter covering sovereign iAs; records already ≤20 keep
   their tighter value). Coherence: iAs ≤ tAs enforced.
2. Exclude FDA action-level rows from Pb/iAs selection; rebind the 5 affected cells to the tightest
   covering government ML per the table above.
3. Clear spurious `converted:true` on RTF-liquid Sn + Cd India entries, both variants.

**C.** Recompile Cat-1, copy the changed records into `data/standards/cat1-compiled/`, then remove
the golden block in `tools/panel-coherence-lint.mjs` and close this ticket. The species≤total check
stays permanently.

## Deferred (separate tickets, flagged, not in this change)

- **ALUMINIUM on dry cereals** — the same class of defect as arsenic, and a bigger cliff. Al 500 is
  AU-NZ's infant-*formula* limit (the only sovereign Al number), read across to dry cereals whose
  natural Al runs ~13,000-18,000 ppb, so essentially no dry cereal certifies on Al. Needs the same
  scope/basis decision the owner made for arsenic. Disclosed at `/hard-to-meet` as "under review."
- **Soy formula chromium 2000 → 1000** (bean-matrix read-across); blocked on register drift + GB
  2762 Appendix A. A tightening, safe to defer.
- **Cr-VI panel gap:** Cat-1 records carry no Cr-VI cell; the canonical contract requires it.
  Upstream compiler gap.
- **FDA action levels as comparators** elsewhere in Cat-1 (and program-wide) — drop from all
  per-country displays, not just the 5 bound cells fixed here. Value-neutral; program-wide cleanup.
- **Infant-formula tHg occurrence anomaly** (pool median ~83 ppb) — contaminated market data, not a
  real struggle; excluded from `/hard-to-meet`. Needs an occurrence-pool review.
- **Published India regulation page snapshot** omits the India infant tAs/Pb/Cd/Sn rows binding the
  Cat-1 panel; **fruit-juice iAs** apple-only note; per-country citation polish (PY/MERCOSUR rice
  twins, SG add). All flagged in `wf2uta7ck`.
