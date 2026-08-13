---
title: "Bottles (plastic, glass, stainless steel) — HMTc Standard"
type: standard
description: "Government-anchored HMTc limits and mandatory controls for Bottles (plastic, glass, stainless steel), covering eight total metals plus required species determinations."
category: 9
category_name: "Infant and Child Contact Products"
product_slug: infant-bottles
public_slug: infant-bottles
custom_page: true
subcategory: "Bottles (plastic, glass, stainless steel)"
firm_analytes: 8
controlled_analytes: 3
native_basis: "specific migration into food (mg/kg food)"
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
  - { k: "Native basis", v: "specific migration into food (mg/kg food)" }
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

<p>Bottles (plastic, glass, stainless steel) is evaluated on its specific migration into food (mg/kg food) basis.</p>

<p>Covers the bottle body in plastic, glass, or stainless steel. Nipples and teats are certified separately under Bottle nipples and spouts; general-market drinkware not marketed for children routes to Category 23.</p>
<p>food-contact specific migration into food (<a href="https://heavymetalindex.com/regulations/eu-10-2011-food-contact-plastics-sml" style="color:#1c43ad">EU Regulation 10/2011</a> Annex II; 10/2011 is plastics-scope, applied to glass and stainless components as a conservative read-across since no stricter metal-FCM sovereign limit exists)</p>

</section>

<section id="limits">

## Complete analyte panel

Eight total-element results are required: Pb, Cd, total arsenic, total mercury, Ni, Sn, Al, and total Cr. Inorganic arsenic and Cr(VI) are additional required species decisions; methylmercury is conditional. Species never replace the parent total result.

| Analyte | Panel role | Variant | Limit or control | Decision | Government source record |
| --- | --- | --- | --- | --- | --- |
| Lead (Pb) | Required total | — | 10 µg/kg food — not-detectable ceiling | Direct sovereign maximum | <code>EU · eu_10_2011_pb_sml_nd</code> |
| Cadmium (Cd) | Required total | — | 2 µg/kg food — not-detectable ceiling | Direct sovereign maximum | <code>EU · eu_10_2011_cd_sml_nd</code> |
| Total arsenic (tAs) | Required total | — | 10 µg/kg food — not-detectable ceiling | Direct sovereign maximum | <code>EU · eu_10_2011_tas_sml_nd</code> |
| Inorganic arsenic (iAs) | Required species | — | Screened; no separate numeric limit | Controlled not-material determination | <code>Bounded by tAs</code> |
| Total mercury (tHg) | Required total | — | 10 µg/kg food — not-detectable ceiling | Direct sovereign maximum | <code>EU · eu_10_2011_thg_sml_nd</code> |
| Methylmercury (MeHg) | Conditional species | — | Screened; no separate numeric limit | Controlled not-material determination | <code>Bounded by tHg</code> |
| Nickel (Ni) | Required total | — | 20 µg/kg food | Direct sovereign maximum | <code>EU · eu_10_2011_ni_sml</code> |
| Tin (Sn) | Required total | — | Screened; no separate numeric limit | Controlled not-material determination | <code>Control record</code> |
| Aluminium (Al) | Required total | — | 1000 µg/kg food | Direct sovereign maximum | <code>EU · eu_10_2011_al_sml</code> |
| Total chromium (Cr) | Required total | — | 10 µg/kg food — not-detectable ceiling | Direct sovereign maximum | <code>EU · eu_10_2011_crtotal_sml_nd</code> |
| Hexavalent chromium (Cr-VI) | Required species | — | 10 µg/kg food (read-across) — not-detectable ceiling | Disclosed sovereign read-across | <code>EU · eu_10_2011_crtotal_sml_nd</code> |

</section>

<section id="read-across">

## Disclosed sovereign read-acrosses

These values come from the nearest applicable sovereign product or matrix limit. They are not occurrence-derived values.

| Analyte | Variant | Selected limit | Sovereign source record | Why this comparator is used |
| --- | --- | --- | --- | --- |
| Hexavalent chromium (Cr-VI) | — | 10 µg/kg food (read-across) — not-detectable ceiling | <code>EU · eu_10_2011_crtotal_sml_nd</code> | bounded by the total-chromium specific-migration limit (not detectable); hexavalent chromium is a fraction of total chromium, so the total-Cr ceiling bounds it |

</section>

<section id="controls">

## Mandatory controls and species decisions

A nonnumeric cell does not remove the analyte from testing. It records the governed control used when no defensible sovereign numeric maximum exists for the exact cell.

| Analyte | Variant | Requirement and rationale | Reference method or basis | Bounded by |
| --- | --- | --- | --- | --- |
| Inorganic arsenic (iAs) | — | Food-contact migration limits regulate total arsenic; no inorganic-arsenic migration limit exists. Bounded by the tAs specific-migration ceiling. | Total-arsenic migration screen (EN 1186 / ICP-MS). | tAs |
| Methylmercury (MeHg) | — | No methylmercury pathway in a food-contact article. Bounded by the tHg specific-migration ceiling. | Total-mercury migration screen. | tHg |
| Tin (Sn) | — | Tin migration is a tinplate/canned-food pathway; there is no tin source in a plastic, glass, or stainless food-contact bottle. Material only for tin-plated cans (Category 6/7). | Packaging control (non-tinplate); periodic ICP-MS tin verification. | — |

</section>

<section id="method">

## How these cells are set

The initial HMTc value is the strictest applicable maximum level set by a credible sovereign government in the product's native basis. If no government regulates the exact cell, the method uses a disclosed read-across from the nearest applicable sovereign value or an explicit nonnumeric control with its laboratory method. Public occurrence data describe markets and research gaps; they do not select the initial certification value. The 8:1 powder-to-liquid conversion is confined to infant formula.

</section>

<section id="provenance">

## Provenance

<p>Frozen from the Heavy Metal Index deterministic standards compiler at commit <code>d9fc2f9c9c0f2f1f7d97389447e83e9e2bab31db</code>. Source report date: 2026-08-12. Every numeric cell retains its selected government-register row identifier above.</p>

</section>
