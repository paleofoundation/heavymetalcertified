---
title: "Fruit purées (general) — HMTc Standard"
type: standard
description: "Government-anchored HMTc limits and mandatory controls for Fruit purées (general), covering eight total metals plus required species determinations."
category: 1
category_name: "Infant and Child Foods"
product_slug: fruit-purees-general
public_slug: fruit-purees
custom_page: true
subcategory: "Fruit purées (general)"
firm_analytes: 8
controlled_analytes: 3
native_basis: "as consumed"
standard_version: "Government-anchor review 2026-08"
methodology_version: "Method v2.0 — government-limit-only initial standard"
standard_status: governance-review
source_snapshot_commit: "d9fc2f9c9c0f2f1f7d97389447e83e9e2bab31db"
effective_date: 2026-08-12
scholar_eligible: false
audience: [regulator, brand-legal, retailer-compliance, certifier]
snapshot:
  - { k: "Required totals", v: "8 / 8 present" }
  - { k: "Numeric cells", v: "8" }
  - { k: "Controlled cells", v: "3" }
  - { k: "Native basis", v: "as consumed" }
connections:
  - { label: "All HMTc standards", href: "/standards" }
  - { label: "How initial limits are set", href: "/program/structure" }
  - { label: "Heavy Metal Index evidence base", href: "https://heavymetalindex.com" }
---
<section id="status">

## Publication status

<div style="border-left:3px solid #8b2a4a;background:#fbf5f7;padding:18px 22px"><p style="margin:0;font-size:15.5px;line-height:1.75;color:#5a4148">Government-anchored standard under governance review. Numeric cells are the strictest applicable sovereign maxima or disclosed sovereign read-acrosses. Control cells keep testing mandatory without inventing a number. This public record is not an occurrence-derived threshold and does not become a final certification boundary until governance approval.</p></div>

</section>

<section id="scope">

## Product scope and basis

<p>Fruit purées (general) is evaluated on its as consumed basis.</p>

</section>

<section id="limits">

## Complete analyte panel

Eight total-element results are required: Pb, Cd, total arsenic, total mercury, Ni, Sn, Al, and total Cr. Inorganic arsenic and Cr(VI) are additional required species decisions; methylmercury is conditional. Species never replace the parent total result.

| Analyte | Panel role | Variant | Limit or control | Decision | Government source record |
| --- | --- | --- | --- | --- | --- |
| Lead (Pb) | Required total | — | 10 µg/kg | Direct sovereign maximum | <code>US · fda2025_pb_baby_food_10</code> |
| Cadmium (Cd) | Required total | — | 40 µg/kg | Direct sovereign maximum | <code>EU · eu2023_cd_babyfood_cereal_40</code> |
| Total arsenic (tAs) | Required total | — | 100 µg/kg | Direct sovereign maximum | <code>SG · sg_foodregs_2026_baby_food_tas_100</code> |
| Inorganic arsenic (iAs) | Required species | — | 20 µg/kg | Direct sovereign maximum | <code>EU · eu2023_ias_babyfood_20</code> |
| Total mercury (tHg) | Required total | — | 8 µg/kg (read-across) | Disclosed sovereign read-across | <code>IL · il_fcs2016_thg_14_2_porridges_and_other_foods_for_infants_and_toddlers_r_8</code> |
| Methylmercury (MeHg) | Conditional species | — | Mandatory testing/control; no numeric limit | Mandatory nonnumeric control | <code>Bounded by tHg</code> |
| Nickel (Ni) | Required total | — | 500 µg/kg | Direct sovereign maximum | <code>EU · eu2024_ni_babyfood_500</code> |
| Tin (Sn) | Required total | — | 5000 µg/kg (read-across) | Disclosed sovereign read-across | <code>IN · in_sn_infant-milk-substitute-and-infant-foods_5000</code> |
| Aluminium (Al) | Required total | — | 500 µg/kg (read-across) | Disclosed sovereign read-across | <code>AU-NZ · aunz_sch19_al_formula_nonsoy_500</code> |
| Total chromium (Cr) | Required total | — | Mandatory testing/control; no numeric limit | Mandatory nonnumeric control | <code>Control record</code> |
| Hexavalent chromium (Cr-VI) | Required species | — | Mandatory testing/control; no numeric limit | Mandatory nonnumeric control | <code>Bounded by Cr</code> |

</section>

<section id="read-across">

## Disclosed sovereign read-acrosses

These values come from the nearest applicable sovereign product or matrix limit. They are not occurrence-derived values.

| Analyte | Variant | Selected limit | Sovereign source record | Why this comparator is used |
| --- | --- | --- | --- | --- |
| Total mercury (tHg) | — | 8 µg/kg (read-across) | <code>IL · il_fcs2016_thg_14_2_porridges_and_other_foods_for_infants_and_toddlers_r_8</code> | government read-across — Israel FCS-2016 porridges &amp; other foods for infants and toddlers, total-Hg 8 (the strictest applicable baby-food mercury ML; supersedes the looser China canned-complementary 20). |
| Tin (Sn) | — | 5000 µg/kg (read-across) | <code>IN · in_sn_infant-milk-substitute-and-infant-foods_5000</code> | government read-across (India FSSAI "Infant Milk substitute and Infant foods" Sn 5000, the only non-canned tin ML in the register) applied at face value. |
| Aluminium (Al) | — | 500 µg/kg (read-across) | <code>AU-NZ · aunz_sch19_al_formula_nonsoy_500</code> | government read-across (AU-NZ Schedule 19 infant-formula Al 500, the only government aluminium ML in any jurisdiction) applied at face value; the 8:1 reconstitution factor is formula-specific and is not applied to a non-formula product. |

</section>

<section id="controls">

## Mandatory controls and species decisions

A nonnumeric cell does not remove the analyte from testing. It records the governed control used when no defensible sovereign numeric maximum exists for the exact cell.

| Analyte | Variant | Requirement and rationale | Reference method or basis | Bounded by |
| --- | --- | --- | --- | --- |
| Methylmercury (MeHg) | — | Methylmercury is not a distinct accumulation pathway in non-marine infant foods. Total mercury is measured on every lot and bounds the methylmercury fraction; reflex MeHg speciation is required when source materials include fish or another credible methylation pathway. | Total Hg by EPA 7473 or ICP-MS; MeHg by species-specific GC-ICP-MS / HPLC-ICP-MS when the matrix contains fish or total Hg approaches the category ceiling. | tHg |
| Total chromium (Cr) | — | reflex Cr(VI) speciation on any total-Cr result &gt; 100 ppb; any quantifiable Cr(VI) fails | species-specific isotope-dilution HPLC-ICP-MS (per saraiva2021, infant-formula Cr-VI adjudication) | — |
| Hexavalent chromium (Cr-VI) | — | Total chromium is measured on every lot. Any total-Cr result at or above 100 ug/kg triggers Cr(VI) speciation, and any quantifiable Cr(VI) fails certification. | Total Cr by ICP-MS; Cr(VI) by EPA 3060A alkaline extraction with IC-ICP-MS (EPA 6800 / EN 15192 or equivalent). | Cr |

</section>

<section id="method">

## How these cells are set

The initial HMTc value is the strictest applicable maximum level set by a credible sovereign government in the product's native basis. If no government regulates the exact cell, the method uses a disclosed read-across from the nearest applicable sovereign value or an explicit nonnumeric control with its laboratory method. Public occurrence data describe markets and research gaps; they do not select the initial certification value. The 8:1 powder-to-liquid conversion is confined to infant formula.

</section>

<section id="provenance">

## Provenance

<p>Frozen from the Heavy Metal Index deterministic standards compiler at commit <code>d9fc2f9c9c0f2f1f7d97389447e83e9e2bab31db</code>. Source report date: 2026-08-12. Every numeric cell retains its selected government-register row identifier above.</p>

</section>

<!-- BEGIN: hmtc-sources -->
## Source regulations

Every published government regulation weighed to set this standard, evaluated against each other. The strictest applicable maximum level binds each analyte; the rest are comparators, and where no government regulates the exact product the value is read across from the nearest government limit. Follow a reference for the source document and its per-analyte limits — the Derivation table above shows every value side by side.

| # | Regulation | Year | Instrument | Role in this standard |
| --- | --- | --- | --- | --- |
| 1 | [Commission Regulation (EU) 2023/915](/regulations/eu-2023-915) | 2023 | Maximum levels | Binds inorganic arsenic, cadmium, nickel |
| 2 | [US FDA — Closer to Zero action levels](/regulations/us-fda-c2z) | 2020 | Guidance action levels | Binds lead |
| 3 | [FSSAI (Contaminants, Toxins and Residues) Regulations](/regulations/india-fssai) | 2011 | Maximum levels | Read-across for tin; Comparator for lead |
| 4 | [FSANZ Food Standards Code — Schedule 19](/regulations/au-nz-fsanz) | 2015 | Maximum levels | Read-across for aluminium |
| 5 | Israel Food Contaminants Standard (FCS) | 2016 | Maximum levels | Read-across for total mercury; Comparator for lead, inorganic arsenic, cadmium |
| 6 | [Contaminants in Food (retained Reg. 1881/2006)](/regulations/uk-1881-2006) | 2006 | Maximum levels | Comparator for lead, cadmium |
| 7 | [GB 2762 — National Food Safety Standard](/regulations/china-gb-2762) | 2022 | Maximum levels | Comparator for inorganic arsenic, cadmium |
| 8 | [ANVISA RDC — Inorganic Contaminant Limits](/regulations/brazil-anvisa) | 2022 | Maximum levels | Comparator for lead, inorganic arsenic, cadmium |
| 9 | [GSO 193 — Gulf Technical Regulation](/regulations/gso-193) | 2021 | Maximum levels | Comparator for lead, cadmium |
| 10 | Morocco Arrêté 2410-22 | 2022 | Maximum levels | Comparator for lead, cadmium |
| 11 | MERCOSUR GMC Resolución 12/2011 | 2011 | Maximum levels | Comparator for lead, cadmium |
| 12 | Panama Resolución 368/2009 | 2009 | Maximum levels | Comparator for lead |
| 13 | Philippines PNS/BAFS 194:2017 | 2017 | Maximum levels | Comparator for lead |
| 14 | Paraguay Decreto 1335/2019 | 2019 | Maximum levels | Comparator for lead, cadmium |
| 15 | Singapore Food Regulations | 2023 | Maximum levels | Comparator for lead |
| 16 | Thailand MOPH Notification No. 414 | 2020 | Maximum levels | Comparator for lead |
| 17 | Trinidad & Tobago Food and Drugs Regulations | 2007 | Maximum levels | Comparator for lead |
| 18 | Vietnam QCVN 8-2:2011/BYT | 2011 | Maximum levels | Comparator for lead |
<!-- END: hmtc-sources -->

<!-- BEGIN: hmtc-version-history -->
## Version history

The dated editions of this standard. Each is kept at a stable permalink, so a regulator or brand can reconstruct exactly what the standard required on any date — the edition record, not an editorial commit trail. Version-pinned DOIs link here once each edition is deposited.

| Version | Date | Status | What changed |
| --- | --- | --- | --- |
| v1.1 | 2026-08-06 | **current** | Register-completeness correction. Mercury tightened 20→8 (Israel FCS-2016 baby-food ML). Compiler hardened (multilingual canned-gating, powder-scoped reconstitution, read-across as comparator) against a 7× expanded government register. |
| v1.0 | 2026-08-06 | superseded | Initial publication. Government-limit standard (Method v2.0): each analyte is the strictest sovereign maximum by lookup, converted to the as-consumed basis; a disclosed read-across from the nearest government value where no government regulates the exact product; total chromium controlled via reflex Cr-VI speciation where not a material toxic in the matrix. |
<!-- END: hmtc-version-history -->
