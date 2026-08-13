---
title: "Food-grade salt — HMTc Standard"
type: standard
description: "Government-anchored HMTc limits and mandatory controls for Food-grade salt, covering eight total metals plus required species determinations."
category: 7
category_name: "Oils, Condiments, and Specialty Foods"
product_slug: salt
public_slug: salt
custom_page: true
subcategory: "Food-grade salt"
firm_analytes: 5
controlled_analytes: 6
native_basis: "as sold"
standard_version: "Government-anchor review 2026-08"
methodology_version: "Method v2.0 — government-limit-only initial standard"
standard_status: governance-review
source_snapshot_commit: "d9fc2f9c9c0f2f1f7d97389447e83e9e2bab31db"
effective_date: 2026-08-12
scholar_eligible: false
audience: [regulator, brand-legal, retailer-compliance, certifier]
snapshot:
  - { k: "Required totals", v: "8 / 8 present" }
  - { k: "Numeric cells", v: "5" }
  - { k: "Controlled cells", v: "6" }
  - { k: "Native basis", v: "as sold" }
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

<p>Food-grade salt is evaluated on its as sold basis.</p>

</section>

<section id="limits">

## Complete analyte panel

Eight total-element results are required: Pb, Cd, total arsenic, total mercury, Ni, Sn, Al, and total Cr. Inorganic arsenic and Cr(VI) are additional required species decisions; methylmercury is conditional. Species never replace the parent total result.

| Analyte | Panel role | Variant | Limit or control | Decision | Government source record |
| --- | --- | --- | --- | --- | --- |
| Lead (Pb) | Required total | — | 1000 µg/kg | Direct sovereign maximum | <code>EU · eu2023_pb_salt_1000</code> |
| Cadmium (Cd) | Required total | — | 500 µg/kg | Direct sovereign maximum | <code>IN · in_fssai2016_cd_015_salt_food_grade_500</code> |
| Total arsenic (tAs) | Required total | — | 500 µg/kg | Direct sovereign maximum | <code>EU · eu20251891_tas_salt_500</code> |
| Inorganic arsenic (iAs) | Required species | — | 500 µg/kg | Direct sovereign maximum | <code>IL · il_fcs2016_ias_12_salt_500</code> |
| Total mercury (tHg) | Required total | — | 100 µg/kg | Direct sovereign maximum | <code>EU · eu2022_617_hg_salt_100</code> |
| Methylmercury (MeHg) | Conditional species | — | Mandatory testing/control; no numeric limit | Mandatory nonnumeric control | <code>Bounded by tHg</code> |
| Nickel (Ni) | Required total | — | Mandatory testing/control; no numeric limit | Mandatory nonnumeric control | <code>Control record</code> |
| Tin (Sn) | Required total | — | Mandatory testing/control; no numeric limit | Mandatory nonnumeric control | <code>Control record</code> |
| Aluminium (Al) | Required total | — | Mandatory testing/control; no numeric limit | Mandatory nonnumeric control | <code>Control record</code> |
| Total chromium (Cr) | Required total | — | Mandatory testing/control; no numeric limit | Mandatory nonnumeric control | <code>Control record</code> |
| Hexavalent chromium (Cr-VI) | Required species | — | Mandatory testing/control; no numeric limit | Mandatory nonnumeric control | <code>Bounded by Cr</code> |

</section>

<section id="controls">

## Mandatory controls and species decisions

A nonnumeric cell does not remove the analyte from testing. It records the governed control used when no defensible sovereign numeric maximum exists for the exact cell.

| Analyte | Variant | Requirement and rationale | Reference method or basis | Bounded by |
| --- | --- | --- | --- | --- |
| Methylmercury (MeHg) | — | This non-marine row has no methylmercury bioaccumulation pathway. Total Hg is mandatory and bounds MeHg; products containing fish or another marine ingredient must route to the applicable seafood/speciation standard. | Total Hg screen; MeHg by GC-ICP-MS / HPLC-ICP-MS if a marine ingredient or anomalous total-Hg result creates a pathway. | tHg |
| Nickel (Ni) | — | No exact sovereign nickel maximum is loaded for this product form. Total Ni remains mandatory and is reported as surveillance, not converted into an occurrence-selected certification value. | Total Ni by ICP-MS. | — |
| Tin (Sn) | — | Tin is primarily a tinplate-migration analyte. Non-canned products require total-Sn surveillance and packaging verification; canned versions route to the canned-food standard. | Total Sn by ICP-MS plus packaging declaration. | — |
| Aluminium (Al) | — | No exact sovereign finished-product aluminium maximum is loaded for this product form. Total Al remains mandatory, with additive, processing-aid, soil, and equipment sources investigated. | Total Al by ICP-MS. | — |
| Total chromium (Cr) | — | No exact sovereign total-chromium maximum is loaded for this product form. Total Cr remains mandatory and any elevated result triggers species investigation. | Total Cr by ICP-MS. | — |
| Hexavalent chromium (Cr-VI) | — | Any total-Cr result at or above 100 ug/kg triggers Cr(VI) speciation, and any quantifiable Cr(VI) fails certification. | Cr(VI) by validated alkaline extraction and IC-ICP-MS (EPA 3060A/EPA 6800 or equivalent). | Cr |

</section>

<section id="method">

## How these cells are set

The initial HMTc value is the strictest applicable maximum level set by a credible sovereign government in the product's native basis. If no government regulates the exact cell, the method uses a disclosed read-across from the nearest applicable sovereign value or an explicit nonnumeric control with its laboratory method. Public occurrence data describe markets and research gaps; they do not select the initial certification value. The 8:1 powder-to-liquid conversion is confined to infant formula.

</section>

<section id="provenance">

## Provenance

<p>Frozen from the Heavy Metal Index deterministic standards compiler at commit <code>d9fc2f9c9c0f2f1f7d97389447e83e9e2bab31db</code>. Source report date: 2026-08-12. Every numeric cell retains its selected government-register row identifier above.</p>

</section>
