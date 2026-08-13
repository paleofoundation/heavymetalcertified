---
title: "Canned seafood (canned tuna, canned fish) — HMTc Standard"
type: standard
description: "Government-anchored HMTc limits and mandatory controls for Canned seafood (canned tuna, canned fish), covering eight total metals plus required species determinations."
category: 6
category_name: "Seafood"
product_slug: canned-seafood
public_slug: canned-seafood
custom_page: true
subcategory: "Canned seafood (canned tuna, canned fish)"
firm_analytes: 9
controlled_analytes: 2
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
  - { k: "Numeric cells", v: "9" }
  - { k: "Controlled cells", v: "2" }
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

<p>Canned seafood (canned tuna, canned fish) is evaluated on its as consumed basis.</p>

</section>

<section id="limits">

## Complete analyte panel

Eight total-element results are required: Pb, Cd, total arsenic, total mercury, Ni, Sn, Al, and total Cr. Inorganic arsenic and Cr(VI) are additional required species decisions; methylmercury is conditional. Species never replace the parent total result.

| Analyte | Panel role | Variant | Limit or control | Decision | Government source record |
| --- | --- | --- | --- | --- | --- |
| Lead (Pb) | Required total | — | 200 µg/kg | Direct sovereign maximum | <code>CR · cr_rtcr409_2008_pb_tuna_bonito_200</code> |
| Cadmium (Cd) | Required total | — | 50 µg/kg | Direct sovereign maximum | <code>GSO · gso193_2021_cd_muscle_meat_of_fish_with_exception_mentioned_50</code> |
| Total arsenic (tAs) | Required total | — | 1000 µg/kg | Direct sovereign maximum | <code>SG · sg_foodregs_2026_canned_fish_meat_extract_hydrolysed_protein_tas_1000</code> |
| Inorganic arsenic (iAs) | Required species | — | 100 µg/kg | Direct sovereign maximum | <code>EU · eu20251891_ias_fish_other_100</code> |
| Total mercury (tHg) | Required total | — | 500 µg/kg | Direct sovereign maximum | <code>CR · cr_rtcr409_2008_thg_fish_general_500</code> |
| Methylmercury (MeHg) | Conditional species | — | Bounded by tHg | Species bounded by parent total | <code>CR</code> |
| Nickel (Ni) | Required total | — | 30000 µg/kg (read-across) | Disclosed sovereign read-across | <code>EU · eu2024_ni_seaweed_30000</code> |
| Tin (Sn) | Required total | — | 100000 µg/kg | Direct sovereign maximum | <code>MX · mx_nom242_sn_canned_100000</code> |
| Aluminium (Al) | Required total | — | 500 µg/kg (read-across) | Disclosed sovereign read-across | <code>AU-NZ · aunz_sch19_al_formula_nonsoy_500</code> |
| Total chromium (Cr) | Required total | — | 12000 µg/kg | Direct sovereign maximum | <code>IN · in_fssai2016_crtotal_001_all_fishery_products_12000</code> |
| Hexavalent chromium (Cr-VI) | Required species | — | Mandatory testing/control; no numeric limit | Mandatory nonnumeric control | <code>Bounded by Cr</code> |

</section>

<section id="read-across">

## Disclosed sovereign read-acrosses

These values come from the nearest applicable sovereign product or matrix limit. They are not occurrence-derived values.

| Analyte | Variant | Selected limit | Sovereign source record | Why this comparator is used |
| --- | --- | --- | --- | --- |
| Nickel (Ni) | — | 30000 µg/kg (read-across) | <code>EU · eu2024_ni_seaweed_30000</code> | Sovereign marine-food read-across from the EU seaweed nickel maximum level (30000 ug/kg) where no species-specific seafood nickel limit exists. Seaweed retains its directly applicable value; other seafood rows disclose the matrix transfer. |
| Aluminium (Al) | — | 500 µg/kg (read-across) | <code>AU-NZ · aunz_sch19_al_formula_nonsoy_500</code> | Conservative finished-food read-across from the AU-NZ infant-formula aluminium maximum (500 ug/kg). No sovereign seafood-specific aluminium maximum is loaded; total Al remains tested and this transfer is disclosed rather than derived from occurrence data. |

</section>

<section id="controls">

## Mandatory controls and species decisions

A nonnumeric cell does not remove the analyte from testing. It records the governed control used when no defensible sovereign numeric maximum exists for the exact cell.

| Analyte | Variant | Requirement and rationale | Reference method or basis | Bounded by |
| --- | --- | --- | --- | --- |
| Methylmercury (MeHg) | — | Methylmercury is a component of total mercury (MeHg ≤ tHg). No government sets a methylmercury limit for this product below the binding total-mercury ceiling (500 µg/kg), so methylmercury is governed by and bounded by the total-mercury ceiling; no separate methylmercury ceiling is published. | Use the category laboratory method on the stated native basis. | tHg |
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
| 1 | [Commission Regulation (EU) 2023/915 and (EU) 2025/1891](/regulations/eu-2023-915) | 2023 | Maximum levels | Binds inorganic arsenic; Comparator for lead, total mercury |
| 2 | [GSO 193 — Gulf Technical Regulation](/regulations/gso-193) | 2021 | Maximum levels | Binds cadmium; Comparator for lead, total mercury |
| 3 | Costa Rica RTCR 409:2008 — Reglamento de límites de contaminantes | 2008 | Maximum levels | Binds lead, total mercury; Comparator for cadmium, tin |
| 4 | Mexico NOM-242-SSA1-2009 | 2009 | Maximum levels | Binds tin; Comparator for lead, cadmium |
| 5 | Singapore Food Regulations | 2023 | Maximum levels | Binds total arsenic; Comparator for lead, total mercury |
| 6 | [GB 2762 — National Food Safety Standard](/regulations/china-gb-2762) | 2022 | Maximum levels | Comparator for inorganic arsenic |
| 7 | [FSSAI (Contaminants, Toxins and Residues) Regulations](/regulations/india-fssai) | 2011 | Maximum levels | Comparator for lead, total mercury, cadmium, tin |
| 8 | [FSANZ Food Standards Code — Schedule 19](/regulations/au-nz-fsanz) | 2015 | Maximum levels | Comparator for lead, total arsenic, total mercury |
| 9 | Ecuador NTE INEN 184 | 2013 | Maximum levels | Comparator for total mercury |
| 10 | Fiji Food Safety Regulations | 2009 | Maximum levels | Comparator for lead, total mercury, cadmium |
| 11 | Guyana Fisheries Products Regulations | 2023 | Maximum levels | Comparator for lead, total mercury, cadmium |
| 12 | Israel Food Contaminants Standard (FCS) | 2016 | Maximum levels | Comparator for lead, total arsenic, total mercury, cadmium |
| 13 | Morocco Arrêté 2410-22 | 2022 | Maximum levels | Comparator for total mercury, cadmium |
| 14 | MERCOSUR GMC Resolución 12/2011 | 2011 | Maximum levels | Comparator for lead, total arsenic, total mercury, cadmium |
| 15 | Panama Resolución 368/2009 | 2009 | Maximum levels | Comparator for lead, total mercury, cadmium |
| 16 | Philippines PNS/BAFS 194:2017 | 2017 | Maximum levels | Comparator for lead |
| 17 | Paraguay Decreto 1335/2019 | 2019 | Maximum levels | Comparator for lead, total arsenic, total mercury, cadmium |
| 18 | Thailand MOPH Notification No. 414 | 2020 | Maximum levels | Comparator for lead, cadmium |
| 19 | Trinidad & Tobago Food and Drugs Regulations | 2007 | Maximum levels | Comparator for lead |
| 20 | Uruguay Reglamento Bromatológico Nacional | 1994 | Maximum levels | Comparator for total mercury |
| 21 | Vietnam QCVN 8-2:2011/BYT | 2011 | Maximum levels | Comparator for lead, total mercury, cadmium |
<!-- END: hmtc-sources -->

<!-- BEGIN: hmtc-version-history -->
## Version history

The dated editions of this standard. Each is kept at a stable permalink, so a regulator or brand can reconstruct exactly what the standard required on any date — the edition record, not an editorial commit trail. Version-pinned DOIs link here once each edition is deposited.

| Version | Date | Status | What changed |
| --- | --- | --- | --- |
| v1.0 | 2026-08-07 | **current** | Initial publication. Government-limit standard (Method v2.0) for canned fish, as-consumed. Metal ceilings bound to the general-fish government floor (tHg 500, MeHg 500, Cd 50) after adversarial audit corrected an initial predatory-tuna reading that understated non-predatory canned fish; tin bound to the strictest canned-fishery ML (100000). A species-identified canned product additionally meets its species subcategory where stricter. |
<!-- END: hmtc-version-history -->
