---
title: "Bread and baked goods (non-rice) — HMTc Standard"
type: standard
description: "Government-anchored HMTc limits and mandatory controls for Bread and baked goods (non-rice), covering eight total metals plus required species determinations."
category: 3
category_name: "Grains, Cereals, and Rice Products"
product_slug: bread-and-baked-goods
public_slug: bread-and-baked-goods
custom_page: true
subcategory: "Bread and baked goods (non-rice)"
firm_analytes: 7
controlled_analytes: 4
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
  - { k: "Numeric cells", v: "7" }
  - { k: "Controlled cells", v: "4" }
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

<p>Bread and baked goods (non-rice) is evaluated on its as sold basis.</p>

</section>

<section id="limits">

## Complete analyte panel

Eight total-element results are required: Pb, Cd, total arsenic, total mercury, Ni, Sn, Al, and total Cr. Inorganic arsenic and Cr(VI) are additional required species decisions; methylmercury is conditional. Species never replace the parent total result.

| Analyte | Panel role | Variant | Limit or control | Decision | Government source record |
| --- | --- | --- | --- | --- | --- |
| Lead (Pb) | Required total | — | 100 µg/kg | Direct sovereign maximum | <code>CU · cu_nc877_2012_pb_processed_cereals_100</code> |
| Cadmium (Cd) | Required total | — | 100 µg/kg | Direct sovereign maximum | <code>EU · eu2023_cd_cereals_general_100</code> |
| Total arsenic (tAs) | Required total | — | 300 µg/kg | Direct sovereign maximum | <code>PY · py_decreto1335_2019_cereals_excluding_wheat_rice_oils_tas_300</code> |
| Inorganic arsenic (iAs) | Required species | — | Mandatory testing/control; no numeric limit | Mandatory nonnumeric control | <code>Control record</code> |
| Total mercury (tHg) | Required total | — | 30 µg/kg | Direct sovereign maximum | <code>IL · il_fcs2016_thg_4_cereals_and_cereal_products_including_wheat_and_rice_30</code> |
| Methylmercury (MeHg) | Conditional species | — | Mandatory testing/control; no numeric limit | Mandatory nonnumeric control | <code>Control record</code> |
| Nickel (Ni) | Required total | — | 800 µg/kg | Direct sovereign maximum | <code>EU · eu2024_ni_cereals_800</code> |
| Tin (Sn) | Required total | — | Mandatory testing/control; no numeric limit | Mandatory nonnumeric control | <code>Control record</code> |
| Aluminium (Al) | Required total | — | 100000 µg/kg | Direct sovereign maximum | <code>CN · cn_gb2760_2024_al_baked_foods_100000</code> |
| Total chromium (Cr) | Required total | — | 2000 µg/kg (read-across) | Disclosed sovereign read-across | <code>CN · china_gb2762_cr_milk_powder_2000</code> |
| Hexavalent chromium (Cr-VI) | Required species | — | Mandatory testing/control; no numeric limit | Mandatory nonnumeric control | <code>Control record</code> |

</section>

<section id="read-across">

## Disclosed sovereign read-acrosses

These values come from the nearest applicable sovereign product or matrix limit. They are not occurrence-derived values.

| Analyte | Variant | Selected limit | Sovereign source record | Why this comparator is used |
| --- | --- | --- | --- | --- |
| Total chromium (Cr) | — | 2000 µg/kg (read-across) | <code>CN · china_gb2762_cr_milk_powder_2000</code> | Conservative sovereign read-across from China GB 2762 total chromium 2000 ug/kg for milk powder to dry cereal/grain products. The matrix differs, so the source remains explicitly classified as read-across; Cr(VI) is controlled separately by reflex speciation. |

</section>

<section id="controls">

## Mandatory controls and species decisions

A nonnumeric cell does not remove the analyte from testing. It records the governed control used when no defensible sovereign numeric maximum exists for the exact cell.

| Analyte | Variant | Requirement and rationale | Reference method or basis | Bounded by |
| --- | --- | --- | --- | --- |
| Inorganic arsenic (iAs) | — | No loaded government source sets an iAs ML for non-rice baked goods; rice-specific iAs limits are not transferred to wheat or other-grain baked products. | Mandatory total-element screen by ICP-MS; apply species-specific HPLC-ICP-MS for arsenic or GC/HPLC-ICP-MS for methylmercury when the stated control triggers. | — |
| Methylmercury (MeHg) | — | No government sets a methylmercury ML for any grain, cereal, or rice product in any jurisdiction; methylmercury maximum levels exist only for fish and seafood. Mercury in this matrix is controlled by the total-mercury ML (30 ug/kg, Israel FCS-2016), which bounds the methylmercury fraction. Rice can accumulate trace methylmercury via paddy-soil methylation in point-source-contaminated growing regions, but that fraction is bounded by the total-mercury control and no methylmercury ML exists to look up. | MeHg by GC-ICP-MS / EN 16801 only on a lot whose total mercury approaches the tHg ML; grain MeHg is characteristically &lt; LOQ. | — |
| Tin (Sn) | — | Canned-only analyte; bread and baked goods are not sold in tinplate. Canned products route to Cat 7. | Mandatory total-element screen by ICP-MS; apply species-specific HPLC-ICP-MS for arsenic or GC/HPLC-ICP-MS for methylmercury when the stated control triggers. | — |
| Hexavalent chromium (Cr-VI) | — | Cr-VI (hexavalent chromium): No total-Cr ML for cereal products; reflex speciation control — any total-Cr &gt;= 100 ug/kg triggers Cr(VI) speciation, any quantifiable Cr(VI) fails. | Total-Cr by ICP-MS; Cr(VI) by EN 15192 / EPA 6800 on exceedance. | — |

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
| 1 | [Commission Regulation (EU) 2023/915 (as amended by (EU) 2023/465 for rice drinks) and (EU) 2024/1987 for nickel](/regulations/eu-2023-915) | 2023 | Maximum levels | Binds cadmium, nickel |
| 2 | [GB 2762 — National Food Safety Standard](/regulations/china-gb-2762) | 2022 | Maximum levels | Binds aluminium |
| 3 | Israel Food Contaminants Standard (FCS) | 2016 | Maximum levels | Binds total mercury; Comparator for lead, total arsenic, cadmium |
| 4 | Paraguay Decreto 1335/2019 | 2019 | Maximum levels | Binds total arsenic; Comparator for lead, cadmium |
| 5 | [FSSAI (Contaminants, Toxins and Residues) Regulations](/regulations/india-fssai) | 2011 | Maximum levels | Comparator for lead, cadmium |
| 6 | [GSO 193 — Gulf Technical Regulation](/regulations/gso-193) | 2021 | Maximum levels | Comparator for lead, cadmium |
| 7 | [FSANZ Food Standards Code — Schedule 19](/regulations/au-nz-fsanz) | 2015 | Maximum levels | Comparator for total arsenic |
| 8 | MERCOSUR GMC Resolución 12/2011 | 2011 | Maximum levels | Comparator for lead, total arsenic, cadmium |
| 9 | Panama Resolución 368/2009 | 2009 | Maximum levels | Comparator for lead |
| 10 | Philippines PNS/BAFS 194:2017 | 2017 | Maximum levels | Comparator for lead, cadmium |
| 11 | Thailand MOPH Notification No. 414 | 2020 | Maximum levels | Comparator for lead, cadmium |
| 12 | Vietnam QCVN 8-2:2011/BYT | 2011 | Maximum levels | Comparator for lead, cadmium |
<!-- END: hmtc-sources -->
