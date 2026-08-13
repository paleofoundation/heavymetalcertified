---
title: Category Readiness
type: standards-index
audience: [brand-legal, retailer-compliance, certifier]
description: "The commercial readiness states that separate a published technical standard from a category that can actually accept a certification application. Driven from one generated source of truth; today no category has been declared open for certification."
snapshot:
  - { k: "A technical page", v: "Not an opening" }
  - { k: "Open requires", v: "All gates complete" }
  - { k: "Confirmation", v: "In writing" }
  - { k: "Category state", v: "Generated" }
connections:
  - { label: "The standards register", href: "/standards" }
  - { label: "Apply for certification", href: "/apply" }
  - { label: "The brand's rights in the program", href: "/brand-bill-of-rights" }
  - { label: "What if a product does not pass?", href: "/what-if-we-dont-pass" }
  - { label: "Program structure and the five statuses", href: "/program/structure" }
rail_box:
  variant: note
  title: "A page is not an opening"
  body: "A category is open only when its complete certification pathway is operational, not merely because a standards page exists."
---

<div style="border:1px solid #eddede;background:#fdf4f3;padding:24px 26px;margin-bottom:32px">
  <div style="font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:#9f2727;margin-bottom:10px">Commercial readiness &middot; stated, not implied</div>
  <p style="font-family:Lora,serif;font-size:23px;line-height:1.45;color:#2b1f1f;margin:0">A published standards page is evidence that a rule exists. It is not evidence that a brand can buy a finished certification decision. This map holds the two apart &mdash; and today, no category has been declared open for certification.</p>
</div>

A technical standards page can exist while one or more analyte cells, methods, laboratories, contracts, mark assets, surveillance rules, or operational controls remain incomplete. That page may be valuable evidence infrastructure, but it does not by itself mean a brand can order a complete certification decision against it.

The commercial readiness map therefore uses a stricter definition than page publication. It is generated from a single source of truth, so the state shown here is the same state the application, the register, and the portal read from.

## Current commercial readiness map

<!-- BEGIN: generated-category-readiness -->

_As of 2026-08-13. This table is generated from `data/category-readiness.json`; it is the commercial-state source of truth._

| Category | Current state | Why |
|---|---|---|
| Infant and Child Foods | Private Readiness only | Technical standards for all nine subcategories are published and the category Program Manual is published; the complete commercial opening record — laboratory route, mark controls, surveillance and agreements — has not been declared. |
| Grains, Cereals, and Rice Products | Private Readiness only | Technical standards for all twelve subcategories carry firm analyte limits; the bound category manual is being regenerated before publication, and the commercial opening record has not been declared. |
| Seafood | Private Readiness only | Technical standards for all seven subcategories carry firm limits; the bound category manual is being regenerated ahead of an unresolved methylmercury adjudication, and the commercial opening record has not been declared. |
| Infant and Child Contact Products (Ages 0–5) | Private Readiness only | Technical standards are published on a migration basis; several analyte cells remain scoped by design, no bound category manual is published, and the commercial opening record has not been declared. |
| Herbs, Spices, Seasonings and Salt | Private Readiness only | The spices standard is published with a firm lead limit; salt and the remaining members are still in development, so readiness across the category is partial. |
| Dairy and Milk Products | Evidence review underway | The category standard is in development — no firm analyte limits are published yet, so there is no complete standard to enter readiness against. |
| Culinary Oils and Fats | Evidence review underway | Category standards are in development — no firm analyte limits are published yet. |
| Chocolate, Cocoa and Confectionery | Evidence review underway | The category standard is in development — no firm analyte limits are published yet. |
| Condiments, Sauces and Dressings | Evidence review underway | The category standard is in development — no firm analyte limits are published yet. |
| Sweeteners and Syrups | Evidence review underway | The category standard is in development — no firm analyte limits are published yet. |

<!-- END: generated-category-readiness -->

Two of the states above are easy to confuse, so the map keeps them distinct. Private Readiness only means a brand can already plan against a published standard: the limits exist, the analytes are defined, and a brand can privately assess where its products stand — but one or more components required for an issued certificate are not yet operational, so no formal certification decision is sold. Evidence review underway is a step earlier: the category's standard is still in development, so there is not yet a complete published rule to be ready against. Neither state is an opening, and neither authorizes the mark.

## Readiness states

| State | Meaning | What a brand can do |
|---|---|---|
| Open for certification | Limits, analytes, methods, laboratory capacity, decision rules, agreements, mark controls, surveillance, and verification are all operational for the named product form | Enter formal certification after written scope and quote confirmation. |
| Private Readiness only | Enough exists to evaluate products and plan gaps, but one or more components required for an issued certificate are incomplete | Review evidence, classify risk, sequence products, and prepare — without purchasing a formal certification decision. |
| Evidence review underway | The literature mapping, regulatory comparators, analytical fitness, or occurrence work is still being built or audited | Register interest and share nonconfidential category information; do not rely on a future opening date. |
| Public consultation | A draft rule is available for structured technical comment but is not yet the governing edition | Submit comments and model impact; do not display the mark or describe the product as pending certification. |
| Not yet scheduled | No complete evidence or operational workstream has been approved for the category | No certification fee is accepted and no near-term availability is implied. |
| Paused | A material methodological, regulatory, laboratory, legal, or governance issue prevents new decisions | Existing certificates and applicants follow the published pause and transition rules. |

## What must be complete before a category is "Open"

A category reaches *Open for certification* only when every gate below is operational for the product form — not when the first of them is. If any release-critical gate is missing, the honest state is Private Readiness, Evidence Review, Consultation, Paused, or Not Scheduled — never Open.

| Gate | Required evidence |
|---|---|
| Product definition | Unambiguous subcategory, product form, native basis, intended consumer, and material formulation splits. |
| Standard | Versioned, dated, publicly readable limits and rationale for every required certification analyte. |
| Regulatory map | Current applicable comparators and a defined method for jurisdiction-specific legal escalation. |
| Analytical method | Fit-for-matrix method, sensitivity, reporting, uncertainty, speciation, reflex, and confirmation rules. |
| Laboratory capacity | At least one qualified route able to perform the required work under program conditions. |
| Sampling | Baseline, lot identity, chain of custody, reserve sample, independent sampling, and composite rules. |
| Decision system | Pass, fail, borderline, status, CAPA, suspension, revocation, appeal, and reinstatement rules. |
| Commercial terms | Itemized fee treatment, laboratory-charge treatment, timeline assumptions, agreement, and data notice. |
| Mark controls | Ratified assets, scope line, reproduction guide, claims, artwork review, suspension, and removal. |
| Surveillance | Risk tier, frequency, market-pull, trend, alert, change-control, and renewal process. |
| Verification | Product-specific certificate record, public status logic, limitations, and correction process. |
| Governance | Accountable program operator, conflicts, appeals, firewall, change control, and version record. |

## Counts come from one source

Homepage counts, register counts, application eligibility, the manuals, and portal logic should all consume one authoritative generated readiness object rather than a number typed into each page. Hand-entered counts drift, because the technical-evidence state and the commercial-opening state do not change at the same moment — a standard can publish months before its category is operationally open, and a stale "open" count is exactly the overstatement this map exists to prevent.

For every product form, that object should carry:

| Field | Purpose |
|---|---|
| Readiness state | Controls whether formal application is available. |
| Governing standard and edition | Identifies the rule that would control a decision. |
| Complete analytes and held analytes | Prevents a partial page from being read as a complete certification panel. |
| Laboratory route | Confirms the required testing can actually be ordered. |
| Mark-guide version | Prevents certification where compliant artwork cannot be issued. |
| Surveillance version | Confirms post-issue obligations exist. |
| Effective and review dates | Makes future change visible. |
| Blocking reasons | Explains why the state is not Open. |

The table on this page implements the first three of those fields today; the remainder are the target the object grows into as each category's pathway is completed.

## Written confirmation before payment

Before a certification fee or a formal sample is accepted, a brand should receive written confirmation of the product form, readiness state, governing standard, evidence plan, cost treatment, and known dependencies.

A general category name is not enough. "Infant food," "seafood," "cereal," or "supplement" can each contain product forms with different analytes, methods, bases, and readiness states — and one form can be ready while another in the same category is not.

[Review the technical standards register](/standards) to see which subcategory standards are published. [Apply](/apply) to enter Private Readiness and plan against a published number when the category is not yet fully open.
