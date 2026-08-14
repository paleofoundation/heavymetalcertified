# Cat 26 number-derivation — the shadow calc of record

Internal methodology note. NOT published (docs/ is not built to `public/`). This is
the quarantined derivation the standard's `control` design refers to when it says the
toxicological anchor is "a firewalled staff quantity that must not be published as a
product-content limit." It records how a firm numeric product-content limit *would* be
derived for Category 26 (Peptides, SARMs & Research Chemicals), what that derivation
actually yields, and why the honest public form remains `control` / non-detect.

Provenance: derived 2026-08-14 via a multi-agent derivation + adversarial-verification
pass (5 domain lenses → synthesis → 4 adversarial verifiers → reconcile). Toxicological
constants below are Q3D(R2)/agency values pinned in that pass; every one must be
re-verified against the current source before operational use (see §6). This note is a
methodology of record, not a lab spec.

---

## 1. The question

The standard reports `control` (mandatory per-lot ICP-MS + reflex speciation, each result
escalated against the route-appropriate ICH Q3D PDE used only as an investigation flag)
and 0/11 firm numeric limits, because no government sets a product-content limit for this
unapproved-drug class and HMTc does not invent one. The challenge: a capable analyst who
accepts the briefing's own thesis ("the absence of a standard is the hazard") should not
treat the absence of a *number* as costless either — they should attempt the derivation
and then decide whether to bind on it. This note is that attempt.

## 2. The derivation

A product-content limit is a concentration (µg metal per g of product as sold). The bridge
from a daily-exposure ceiling (µg/day) to a concentration is the daily intake of product —
the denominator the class refuses to fix. The full form:

```
limit (µg/g) = min[ C_tox , F_ALARA ]

  C_tox    = ( PDE_route × A ÷ N_stack ) ÷ D_p97 ÷ S_subpop
  F_ALARA  = max( clean-process residual , validated ICP-MS / speciation LOQ )

  publish F_ALARA ; annotate residual risk where C_tox < F_ALARA
  (a literal min() returns the sub-LOQ tox value — an un-implementable limit
   nothing could pass; the operative published number is the detection floor)
```

Inputs:

| Term | Meaning | Value used |
|---|---|---|
| `PDE_route` | route-appropriate ICH Q3D(R2) permitted daily exposure, 50 kg adult | see §3 |
| `A` | fraction of the budget allocated to the product after subtracting dietary/environmental background (EPA relative-source-contribution logic) | Pb 0.50 (parenteral) / 0.20 (oral), Cd 0.20, iAs 0.10, tHg 0.80, Ni 0.50, Al 0.50 (stress-tested down from 0.90), default 0.20 |
| `N_stack` | metal-bearing products co-administered in a cycle, sharing one PDE budget | 10 (p97 heavy-user tail; AAS-polypharmacy surveys ≈ 8.7 ± 4.2 concurrent agents) |
| `D_p97` | heavy-user daily mass of PRODUCT as sold (carrier + active, not active alone) | 2.0 g/day injectable oil & oral; 4.5 g/day troche (binding mucosal denominator) |
| `S_subpop` | binding susceptible-subgroup tightening multiplier | Pb/Ni/Al 10; Cd/iAs/tHg/Cr-VI 3; Sn/total-Cr 1 |

## 3. The route-appropriate anchors (Q3D R2, µg/day)

Pinned in the derivation pass; re-verify against ICH Q3D(R2) Table A.2.1 before use.

| Element | oral | parenteral | inhalation (mucosal proxy) |
|---|---|---|---|
| Pb | 5 | 5 | 5 |
| Cd | 5 | 2 | 3 |
| As (tAs/iAs) | 15 | 15 | 2 |
| Hg (total) | 30 | 3 | 1 |
| Ni | 200 | 20 | 6 |
| Sn | 6000 | 600 | 60 |
| Cr (total) | 11000 | 1100 | 3 |

Non-Q3D (element not classified by Q3D):
- Aluminium — parenteral base = FDA 21 CFR 201.323 accumulation threshold 5 µg/kg/day × 50 kg = 250 µg/day; oral base = EFSA TWI 1 mg/kg bw/week ≈ 7143 µg/day. Al is blank-limited in practice.
- Cr-VI — no Q3D species PDE; anchored at the speciation LOQ, not a PDE (a no-threshold genotoxin has no ceiling to "afford").

## 4. The result — the derivation collapses to the detection floor

Running the calc per analyte per form, the toxicological target `C_tox` for **every**
no-threshold toxic (Pb, Cd, iAs, tHg, Cr-VI) and **both** Craven signal metals (Ni, Al)
falls **at or below** the validated ICP-MS / speciation LOQ. So `min(C_tox, F_ALARA)`
collapses to `F_ALARA` = the detection floor. A rigorous derivation does not yield a
comfortable pass-band above detection; it yields non-detect. The published number, per
analyte, is therefore the reporting limit itself — route-invariant (the LOQ does not
change with dose or route), reported `<LOQ`, and for the no-threshold species enforced as
`fail if detected` (zero positive headroom, NOT sign-off up to the LOQ).

Worked examples (µg/g of product):
- Injectable Pb: `C_tox = (5 × 0.50 ÷ 10) ÷ 2.0 ÷ 10 = 0.0125` → below the ~0.05 LOQ → publish 0.05, non-detect.
- Injectable Cd: `C_tox = (2 × 0.20 ÷ 10) ÷ 2.0 ÷ 3 = 0.0067` → below the ~0.02 LOQ → publish 0.02, non-detect.
- Injectable Al (corrected): `C_tox = (250 × 0.50 ÷ 10) ÷ 2.0 ÷ 10 = 0.625` → below the ~1 µg/g Al blank → publish 1, non-detect.

The published non-detect floors (analytical reporting limits, µg/g):

| Analyte | Floor (µg/g) | Binds on |
|---|---|---|
| Lead (Pb) | 0.05 | ICP-MS LOQ (tox target ~10× lower) |
| Cadmium (Cd) | 0.02 | ICP-MS LOQ (parenteral tox target just below → may under-protect) |
| Total As (tAs) | 0.02 | speciation LOQ (treated as iAs worst-case) |
| Inorganic As (iAs) | 0.02 | HPLC-ICP-MS speciation LOQ; no-threshold |
| Total Hg (tHg) | 0.05 | ICP-MS LOQ (parenteral tox ~0.04 → may under-protect) |
| Methylmercury (MeHg) | n/m | matrix chemistry (no abiotic methylation; ≤ tHg by definition) |
| Nickel (Ni) | 0.1 | analytical LOQ — corrected from a 0.5 process residual |
| Tin (Sn) | 0.1 | ALARA floor (tox ceiling 60–600× looser; screen for organotin) |
| Aluminium (Al) | 1 | blank-limited ICP-MS floor — corrected from 5 |
| Total Cr | 0.2 | process floor; a detection gates Cr-VI speciation |
| Cr-VI | 0.02 | speciation LOQ; no-threshold, fail if detected |

The robustness point: the *contested* inputs (`D_p97`, `N_stack` — behavioural, forum-
extrapolated, no peer-reviewed percentile survey for this class) are load-bearing ONLY
when `C_tox` binds, i.e. lands above the LOQ. Because it lands below, the published number
is the LOQ — which does not move with those assumptions. The answer survives large errors
in the soft inputs.

## 5. Corrections applied by the adversarial pass

- **Tin PDE anchor corrupted** (fixed in a dedicated commit; see `docs/findings.md`): all five compiled records carried `Sn tox_anchor.pde_ug_day` = 6400 (parenteral ×3) / 64000 (oral) / 64 (mucosal), none matching any Q3D value → corrected to 600 / 6000 / 60. Internal escalation flag only (Sn renders as `control`), so no page change, but it made the tin trigger ~10× too lenient.
- **Nickel 0.5 → 0.1**: the 0.5 was a stainless-steel *leaching residual*, not an achievable LOQ, and sat ~20× above the mucosal tox target for a contact sensitiser that bypasses oral tolerance when injected. Bind at the analytical LOQ; gate any detection. (Craven oral-SARM Ni mean 27.5 µg/g ≈ 275× over the corrected floor — a process failure, not a floor.)
- **Aluminium 5 → 1**: the 5 µg/g floor sat *above* its own tox target (~0.6–1 µg/g) — anticonservative. Corrected to the blank-limited ~1 µg/g, route-invariant. (Craven oral Al 651–1220 µg/g ≈ 651–1220× over.)
- **N_stack 5 → 10**: median → p97 heavy-user tail; tightens every `C_tox` ~2×.
- **Oral-Pb allocation A 0.50 → 0.20**: dietary/water lead is a major real exposure (EPA RSC). Floor still binds; Pb 0.05 unchanged.
- **Non-detect enforcement hardened**: `<LOQ` = zero positive allowance (fail if any no-threshold species is detected), NOT pass-with-headroom. This is the true load-bearing protection, because `C_tox` sits below the published floor for the Tier-1 toxics.
- **Formula label fixed**: "publish `F_ALARA`; annotate residual risk where `C_tox < F_ALARA`," not a literal `min()` (which returns an un-implementable sub-LOQ value).

## 6. Governance — why the number stays non-detect, never a "maximum permitted level"

The scope critic returned `breaks_scope: true` for the artifact the challenge literally
asks for — a PDE/tox-derived ceiling published as a permitted maximum. Two decisive
failure modes: (a) **the back-solve** — any published per-gram ceiling silently embeds
`D_p97`; a reader multiplies it by their daily product mass, lands under the PDE, and reads
"certified safe to inject at this dose," asserting a fitness-to-inject the mark disclaims;
(b) **headroom = permission** — any ceiling above detection blesses a *detectable* level of
a no-threshold toxin, the inverse of zero-tolerance. The dividing line is exact and binary:
*"must be undetectable at 0.05 µg/g"* is a purity floor (zero headroom, route-invariant,
compatible with safety-only scope); *"must not exceed 0.05 µg/g"* is a use authorisation
(breaks scope). Same number, opposite meaning.

Because the rigorous derivation lands at the LOQ, the only publishable number *is* the
non-detect floor — which is `control` by another name. Reframing to rescue a number
replaces the tox ceiling with the detection floor, i.e. it lands back on control.

## 7. Recommendation — augment-lite

1. Keep mandatory per-lot ICP-MS + reflex-speciation `control` as the operative standard.
2. Keep the route-appropriate Q3D PDE strictly internal as the escalation/investigation flag (shadow calc — this note). Never render a PDE-derived per-gram or per-day pass/fail ceiling on a product page.
3. If any number is surfaced publicly, surface ONLY the ALARA/LOQ non-detect floor as a purity threshold — labelled "must be undetectable at," never "maximum permitted level" — with a printed note that it is the validated LOQ, is route-invariant, and carries no dose or fitness-for-use assumption. For every no-threshold species, `<LOQ = fail if detected`.

The intellectual upshot for the public argument: `control` is not "we declined to set a
number." The number, derived rigorously, is non-detect — and mandatory testing to the
detection floor is how that number is enforced. The absence of a published *ceiling* is the
honest report of a derivation that lands below what any instrument can resolve.

## 8. Residual uncertainty — verify before operational use

- **Soft behavioural inputs** (`N_stack` = 10; `D_p97` = 2.0 / 4.5 g/day): forum/harm-reduction extrapolation, no peer-reviewed percentile survey for this class. They do NOT move the published floor (the floor binds), but they DO drive the internal escalation flag and any future dose-resolved work.
- **Al floor (1 µg/g)** is a blank-limited pragmatic value, not a toxicological guarantee; verify your lab's validated Al blank/LOQ (plausibly 1–2 µg/g). The FDA 25 µg/L LVP cross-check (~0.025 µg/g) remains below achievable Al blanks — a genuine unresolved governance gap.
- **Ni floor (0.1 µg/g)** assumes a clean-lab LOQ (~0.01–0.05 achievable); verify in-matrix and confirm detection-gating is enforced.
- **Non-detect reporting convention** is load-bearing: a lab reporting "`<LOQ` = pass with headroom" would under-protect the p97 user at the reporting boundary. Confirm zero-positive-allowance reporting.
- **Speciation is not optional**: organotin (Sn), tAs, and Cr species carry toxicity a total-element number cannot bound. The total-Sn / tAs / total-Cr floors are screens; reflex HPLC/IC-ICP-MS speciation must actually run.
- **Structural gap**: injectable peptide hormones are 1–5 mg/day of lyophilised powder, so a µg/g assay is LOQ-starved and near-meaningless — those products need a companion per-10-mg-vial (or per-weekly-dose) metal-mass basis, NOT derived here.
- **Re-verify all anchors** against the current ICH Q3D(R2) Table A.2.1, FDA 21 CFR 201.323, and the current EFSA aluminium TWI before any operational use.
