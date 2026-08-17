# Cat-1 arsenic + soy-cadmium corrections — upstream reconciliation ticket

**Status:** OPEN. Corrections applied cert-side to the committed compiled JSON; upstream compiler
not yet reconciled. `tools/panel-coherence-lint.mjs` holds a golden-value tripwire so a re-copy
from the index repo cannot silently revert them until this ticket is closed.

**Origin:** multi-agent scope audit `wf2uta7ck` (2026-08-17), 62 agents, 48 candidate defects,
15 survived adversarial refutation → 7 cell corrections. Decisions by Karen Pendergrass
("tightest government limit whose scope actually covers the product; correct in both directions").

## Why the corrections were applied cert-side, not by recompile

At the time of writing, `~/Desktop/heavy-metal-index` was on `codex/methodology-sync` with **702
modified files** (unrelated WIP), and its canonical register
`data/evidence/regulatory_limits.csv` was **missing 11 `hk_cap132v` rows** that the current
compiled Cat-1/3/27/32 records already cite (a clean recompile would dangle those citations). A
safe, same-day upstream recompile was therefore not possible. The compiled JSON is a committed,
versioned cert-repo artifact, so the audited corrections were applied there as a reviewed
transform (`tools/migrations/2026-08-17-cat1-arsenic-corrections.py`, idempotent, format-preserving) and
guarded. This ticket records the equivalent upstream edits so the next index-repo recompile
reproduces the same values and the cert-side golden block can be removed.

## The 7 corrections (what the upstream compiler must reproduce)

| # | record | variant | analyte | from | to | basis |
|---|--------|---------|---------|------|-----|-------|
| 1 | baby-cereals-dry-rice-based | both | iAs | 100 | **50** | parent-bound: iAs ≤ tAs; India tAs 50 binds |
| 2 | teething-and-snacks-rice-based | both | iAs | 100 | **50** | parent-bound; species ref → Health Canada (FDA "infant rice cereal" scope excludes snacks) |
| 3 | baby-cereals-dry-non-rice | both | iAs | 20 | **50** | parent-bound; EU "baby food" 2023/915 3.4.3 excludes processed cereal-based food (Dir. 2006/125 def) → non-traceable |
| 4 | teething-and-snacks-non-rice | both | iAs | 20 | **50** | parent-bound; same EU exclusion |
| 5 | infant-formula-powder | soy | Cd | 10 | **20** | register soy_class mistag; retarget to EU soy powder row |
| 6 | infant-formula-rtf-liquid | soy | Cd | 5 | **10** | register soy_class mistag; retarget to EU soy liquid row |
| 7 | infant-formula-rtf-liquid | cow+soy | Sn, Cd | — | — | clear spurious `converted:true` on the India per-country entries (no 8:1 applied; v1.1 refused it) |

### Decision record for the two arsenic calls (Karen, 2026-08-17)

- **Rice total arsenic held at India tAs 50 (rice subcategories effectively unenterable).** India
  FSSAI `in_tas_infant-milk-substitute-and-infant-foods_50` is the confirmed tightest sovereign
  total-As limit for infant food and its scope covers (FSS Act → IMS Act marketing test). The
  age-scope lever (Cat 1 = ages 0–5 vs India's 24-month definition, which would lift the ceiling to
  Singapore "baby food" 100) was **considered and rejected**: it rests on a contestable reading and
  would engineer a loophole to weaken an infant arsenic standard. Rice iAs is therefore bounded by
  the parent total at 50. *This remains a category-scope question counsel may revisit — FYI, not a
  blocker.*
- **Non-rice iAs set to 50 (parent-bound), not 25 (Israel).** Israel `il_fcs2016_ias_14_2` (25) is
  an *as-consumed* number; applied face-value to a dry as-sold cereal it is ~2× too strict
  (Israel's own ~2:1 porridge ratio ⇒ as-sold equivalent ≈ 50). 25 face-value would be a basis
  error; 50 (India tAs bound) is the basis-correct, fully traceable ceiling.

## Upstream edits required (heavy-metal-index)

**BLOCKER first:** reconcile `data/evidence/regulatory_limits.csv` on main to restore the 11
`hk_cap132v` rows the compiled records cite (they live in the index worktrees
`objective-kapitsa-6466e4`, `serene-meitner-009b2c`, `fix-cat1724`, `reverent-driscoll-03cde0`).
Every drifted arsenic row is ≥100 ppb, so no tightest-value conclusion changes — this is
citation-resolution only.

**A. Register (`data/evidence/regulatory_limits.csv`)**
1. `soy_class` mistags (drives #5, #6): `il_fcs2016_cd_14_...ready_to_eat_5` and
   `il_fcs2016_cd_14_1_...powder_10` are tagged `both`; set both to `non-soy`. (Israel's dedicated
   soy rows `14_2`=10 liquid, `14_3`=20 powder are already correct.)
2. Stale free-text `basis` on India infant rows (tAs 50, Pb 200, Cd 100) reads "as consumed" while
   `basis_class` correctly reads `as_sold` (cosmetic; the Sn sibling was fixed 2026-08-05).
3. Truncated Korea scope `kr_ias_..._100` — restore the dropped qualifier "(limited to food made
   with brown rice, rice bran, rice germ, fusiformis, or gulfweed)". Korea then no longer covers
   non-rice cereal (value-neutral; already dropped from those records' per-country here).
4. Duplicate/mistyped rows: `us_ias_rice-cereals...` vs `fda2020_ias_infant_rice_cereal_100`
   (the latter is a guidance action level, not an ML — type accordingly); apple-juice duplicate;
   GB 2762 Table-7 milk-powder rows under both `Cr` and `Cr-total`.

**B. Compiler config (`tools/standards/cat1-config.json`) + `compile-cat1.mjs`**
1. **Parent-bound arsenic rule (preferred as a general compiler rule, mirroring the tHg/MeHg
   pattern):** `iAs = min(tightest covering sovereign iAs ceiling, parent tAs ceiling)`, retaining
   the species row as a disclosed reference. Applies to #1–#4.
2. #2 species reference: swap `fda2020_ias_infant_rice_cereal_100` →
   `ca_ias_rice-based-foods-intended-specifically-f_100`.
3. #3–#4: EU `eu2023_ias_babyfood_20` must not bind processed cereal-based food (Reg 609/2013 Art.
   2(2)(f) carve-out). With it removed and no covering sovereign iAs < 50, the parent bounds at 50.
4. #7: clear the spurious `converted:true` on RTF-liquid Sn (India 5000) and Cd (India 100), both
   variants.

**C.** Recompile Cat-1 in the index repo, copy the 6 changed records into
`data/standards/cat1-compiled/`, then remove the golden block in `tools/panel-coherence-lint.mjs`
and close this ticket. The species≤total coherence check stays permanently.

## Deferred (separate tickets, not in this change)

- **Soy formula chromium 2000 → 1000** (bean-matrix read-across). Blocked on the register-drift
  blocker + verbatim read of GB 2762 Appendix A; a tightening, safe to defer one cycle.
- **Cr-VI panel gap:** Cat-1 compiled records carry no Cr-VI cell; the canonical contract requires
  it. Upstream compiler gap, cannot be fixed by a renderer.
- **Per-country citation polish on rice tAs cells:** swap PY/MERCOSUR "cereals excluding **rice**"
  → the correctly-scoped rice-derivatives twin (same value 300); add SG `baby_food` 100; drop the
  ingredient-only `gso193`/`il 5.2.1` rows and the rice-excluding `hk_cap132v` row. Value-neutral.
- **Published India regulation page snapshot** (`data/regulations/cert-regulation-snapshot.json`)
  omits the India infant tAs/Pb/Cd/Sn rows that bind the Cat-1 panel — a reader following the
  citation won't find the limit. Fix before/with the next India-facing publish.
- **fruit-juice iAs** bound to `fda2023_ias_apple_juice_10` (apple only) — untested for non-apple
  baby juices; audit flagged, not covered in this pass.
