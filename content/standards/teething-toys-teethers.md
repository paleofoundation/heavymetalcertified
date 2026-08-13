---
title: "Teething toys/teethers — HMTc Standard"
type: standard
description: "Government-anchored HMTc limits and mandatory controls for Teething toys/teethers, covering eight total metals plus required species determinations."
category: 9
category_name: "Infant and Child Contact Products"
product_slug: teething-toys-teethers
public_slug: teething-toys-teethers
custom_page: true
subcategory: "Teething toys/teethers"
firm_analytes: 9
controlled_analytes: 2
native_basis: "element migration from scraped-off toy material (mg/kg material)"
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
  - { k: "Native basis", v: "element migration from scraped-off toy material (mg/kg material)" }
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

<p>Teething toys/teethers is evaluated on its element migration from scraped-off toy material (mg/kg material) basis.</p>

<p>Covers teethers and teething toys a child mouths. General children’s toys without a mouthing-specific role are certified under Category 21 (Children’s Toys).</p>
<p>toy migration (element migration from scraped-off toy material, EU <a href="https://heavymetalindex.com/regulations/eu-2009-48-toy-safety-migration-limits" style="color:#1c43ad">2009/48/EC</a> Annex II Part III Category III; teething toys are toys and are directly governed by the Toy Safety Directive)</p>

</section>

<section id="limits">

## Complete analyte panel

Eight total-element results are required: Pb, Cd, total arsenic, total mercury, Ni, Sn, Al, and total Cr. Inorganic arsenic and Cr(VI) are additional required species decisions; methylmercury is conditional. Species never replace the parent total result.

| Analyte | Panel role | Variant | Limit or control | Decision | Government source record |
| --- | --- | --- | --- | --- | --- |
| Lead (Pb) | Required total | — | 23000 µg/kg food | Direct sovereign maximum | <code>EU · eu_2009_48_cat3_pb_toy_migration</code> |
| Cadmium (Cd) | Required total | — | 17000 µg/kg food | Direct sovereign maximum | <code>EU · eu_2009_48_cat3_cd_toy_migration</code> |
| Total arsenic (tAs) | Required total | — | 47000 µg/kg food | Direct sovereign maximum | <code>EU · eu_2009_48_cat3_tas_toy_migration</code> |
| Inorganic arsenic (iAs) | Required species | — | Screened; no separate numeric limit | Controlled not-material determination | <code>Bounded by tAs</code> |
| Total mercury (tHg) | Required total | — | 94000 µg/kg food | Direct sovereign maximum | <code>EU · eu_2009_48_cat3_thg_toy_migration</code> |
| Methylmercury (MeHg) | Conditional species | — | Screened; no separate numeric limit | Controlled not-material determination | <code>Bounded by tHg</code> |
| Nickel (Ni) | Required total | — | 930000 µg/kg food | Direct sovereign maximum | <code>EU · eu_2009_48_cat3_ni_toy_migration</code> |
| Tin (Sn) | Required total | — | 180000000 µg/kg food | Direct sovereign maximum | <code>EU · eu_2009_48_cat3_sn_toy_migration</code> |
| Aluminium (Al) | Required total | — | 28130000 µg/kg food | Direct sovereign maximum | <code>EU · eu_2009_48_cat3_al_toy_migration</code> |
| Total chromium (Cr) | Required total | — | 60000 µg/kg food | Direct sovereign maximum | <code>US · astm_f963_crtotal_soluble</code> |
| Hexavalent chromium (Cr-VI) | Required species | — | 53 µg/kg food | Direct sovereign maximum | <code>EU · eu_2009_48_cat3_crvi_toy_migration</code> |

</section>

<section id="controls">

## Mandatory controls and species decisions

A nonnumeric cell does not remove the analyte from testing. It records the governed control used when no defensible sovereign numeric maximum exists for the exact cell.

| Analyte | Variant | Requirement and rationale | Reference method or basis | Bounded by |
| --- | --- | --- | --- | --- |
| Inorganic arsenic (iAs) | — | Contact-product arsenic limits regulate total arsenic; no toy-safety instrument sets an inorganic-arsenic limit. Bounded by the tAs migration ceiling. | Total-arsenic migration screen (EN 71-3 / ICP-MS). | tAs |
| Methylmercury (MeHg) | — | Methylmercury has no formation or migration pathway in a teether. Bounded by the tHg migration ceiling. | Total-mercury migration screen (EN 71-3). | tHg |

</section>

<section id="method">

## How these cells are set

The initial HMTc value is the strictest applicable maximum level set by a credible sovereign government in the product's native basis. If no government regulates the exact cell, the method uses a disclosed read-across from the nearest applicable sovereign value or an explicit nonnumeric control with its laboratory method. Public occurrence data describe markets and research gaps; they do not select the initial certification value. The 8:1 powder-to-liquid conversion is confined to infant formula.

</section>

<section id="provenance">

## Provenance

<p>Frozen from the Heavy Metal Index deterministic standards compiler at commit <code>d9fc2f9c9c0f2f1f7d97389447e83e9e2bab31db</code>. Source report date: 2026-08-12. Every numeric cell retains its selected government-register row identifier above.</p>

</section>
