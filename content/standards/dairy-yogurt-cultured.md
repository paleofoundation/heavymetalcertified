---
title: "Yogurt and cultured dairy — HMTc Standard"
type: standard
description: "Government-anchored HMTc limits and mandatory controls for Yogurt and cultured dairy, covering eight total metals plus required species determinations."
category: 24
category_name: "Dairy and Milk Products"
product_slug: dairy-yogurt-cultured
public_slug: dairy-yogurt-cultured
custom_page: true
subcategory: "Yogurt and cultured dairy"
firm_analytes: 7
controlled_analytes: 4
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
  - { k: "Numeric cells", v: "7" }
  - { k: "Controlled cells", v: "4" }
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

<p>Yogurt and cultured dairy is evaluated on its as consumed basis.</p>

</section>

<section id="limits">

## Complete analyte panel

Eight total-element results are required: Pb, Cd, total arsenic, total mercury, Ni, Sn, Al, and total Cr. Inorganic arsenic and Cr(VI) are additional required species decisions; methylmercury is conditional. Species never replace the parent total result.

| Analyte | Panel role | Variant | Limit or control | Decision | Government source record |
| --- | --- | --- | --- | --- | --- |
| Lead (Pb) | Required total | — | 20 µg/kg | Direct sovereign maximum | <code>VN · vn_qcvn8_2_2011_pb_fermented-milk-products_20</code> |
| Cadmium (Cd) | Required total | — | 1000 µg/kg | Direct sovereign maximum | <code>VN · vn_qcvn8_2_2011_cd_fermented-milk-products_1000</code> |
| Total arsenic (tAs) | Required total | — | 500 µg/kg | Direct sovereign maximum | <code>VN · vn_qcvn8_2_2011_tas_fermented-milk-products_500</code> |
| Inorganic arsenic (iAs) | Required species | — | Mandatory testing/control; no numeric limit | Mandatory nonnumeric control | <code>Bounded by tAs</code> |
| Total mercury (tHg) | Required total | — | 50 µg/kg | Direct sovereign maximum | <code>VN · vn_qcvn8_2_2011_thg_fermented-milk-products_50</code> |
| Methylmercury (MeHg) | Conditional species | — | Mandatory testing/control; no numeric limit | Mandatory nonnumeric control | <code>Bounded by tHg</code> |
| Nickel (Ni) | Required total | — | 100 µg/kg (read-across) | Disclosed sovereign read-across | <code>EU · eu2024_ni_formula_liquid_100</code> |
| Tin (Sn) | Required total | — | Mandatory testing/control; no numeric limit | Mandatory nonnumeric control | <code>Control record</code> |
| Aluminium (Al) | Required total | — | 500 µg/kg (read-across) | Disclosed sovereign read-across | <code>AU-NZ · aunz_sch19_al_formula_nonsoy_500</code> |
| Total chromium (Cr) | Required total | — | 300 µg/kg | Direct sovereign maximum | <code>CN · china_gb2762_cr_liquid_milk_300</code> |
| Hexavalent chromium (Cr-VI) | Required species | — | Mandatory testing/control; no numeric limit | Mandatory nonnumeric control | <code>Bounded by Cr</code> |

</section>

<section id="read-across">

## Disclosed sovereign read-acrosses

These values come from the nearest applicable sovereign product or matrix limit. They are not occurrence-derived values.

| Analyte | Variant | Selected limit | Sovereign source record | Why this comparator is used |
| --- | --- | --- | --- | --- |
| Nickel (Ni) | — | 100 µg/kg (read-across) | <code>EU · eu2024_ni_formula_liquid_100</code> | Conservative sovereign dairy read-across from the EU liquid infant/young-child formula nickel maximum (100 ug/kg) where no general-dairy nickel maximum exists. |
| Aluminium (Al) | — | 500 µg/kg (read-across) | <code>AU-NZ · aunz_sch19_al_formula_nonsoy_500</code> | Conservative sovereign dairy read-across from the AU-NZ non-soy infant-formula aluminium maximum (500 ug/kg); no general-dairy aluminium maximum is loaded. |

</section>

<section id="controls">

## Mandatory controls and species decisions

A nonnumeric cell does not remove the analyte from testing. It records the governed control used when no defensible sovereign numeric maximum exists for the exact cell.

| Analyte | Variant | Requirement and rationale | Reference method or basis | Bounded by |
| --- | --- | --- | --- | --- |
| Inorganic arsenic (iAs) | — | Dairy regulations set total-arsenic limits, not a separate inorganic-arsenic limit. Total arsenic is measured on every lot and bounds the iAs fraction; an elevated total-As result triggers arsenic speciation. | Total As by ICP-MS; iAs by HPLC-ICP-MS (EN 16802 or equivalent) on an elevated total-As result. | tAs |
| Methylmercury (MeHg) | — | There is no methylmercury bioaccumulation pathway in dairy and no sovereign dairy MeHg maximum. Total mercury is measured on every lot and bounds the methylmercury fraction. | Total Hg by EPA 7473 or ICP-MS; reflex MeHg speciation only if total Hg approaches the category ceiling. | tHg |
| Tin (Sn) | — | Tin is a packaging-migration analyte. Non-tinplate dairy products have no intrinsic tin pathway; products in tin-coated containers instead use the directly applicable canned/tin-coated dairy limit. | Packaging declaration plus total Sn by ICP-MS; route tin-coated packs to the canned/tin-coated limit. | — |
| Hexavalent chromium (Cr-VI) | — | Total chromium is measured on every lot. Any total-Cr result at or above 100 ug/kg triggers Cr(VI) speciation, and any quantifiable Cr(VI) fails certification. | Total Cr by ICP-MS; Cr(VI) by EPA 3060A with IC-ICP-MS / EN 15192 or equivalent. | Cr |

</section>

<section id="method">

## How these cells are set

The initial HMTc value is the strictest applicable maximum level set by a credible sovereign government in the product's native basis. If no government regulates the exact cell, the method uses a disclosed read-across from the nearest applicable sovereign value or an explicit nonnumeric control with its laboratory method. Public occurrence data describe markets and research gaps; they do not select the initial certification value. The 8:1 powder-to-liquid conversion is confined to infant formula.

</section>

<section id="provenance">

## Provenance

<p>Frozen from the Heavy Metal Index deterministic standards compiler at commit <code>d9fc2f9c9c0f2f1f7d97389447e83e9e2bab31db</code>. Source report date: 2026-08-12. Every numeric cell retains its selected government-register row identifier above.</p>

</section>
