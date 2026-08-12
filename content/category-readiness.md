---
title: Category Readiness
type: standards-index
audience: [brand-legal, retailer-compliance, certifier]
description: "The commercial readiness states that distinguish a published technical page from a category that is actually ready to accept certification applications."
snapshot:
  - { k: "Technical page", v: "Not enough" }
  - { k: "Open status", v: "All gates complete" }
  - { k: "Readiness confirmation", v: "Written" }
  - { k: "Counts", v: "Generated only" }
connections:
  - { label: "Standards register", href: "/standards" }
  - { label: "Private Readiness", href: "/readiness" }
  - { label: "Apply for certification", href: "/apply" }
  - { label: "Program structure", href: "/program/structure" }
  - { label: "Cost and timing", href: "/cost-and-timing" }
rail_box:
  variant: note
  title: "A page is not an opening"
  body: "A category is open only when the complete certification pathway is operational, not merely because a standards page exists."
---

A technical standards page can exist while one or more analyte cells, methods, laboratories, contracts, mark assets, surveillance rules, or operational controls remain incomplete. That page may be valuable evidence infrastructure, but it does not by itself mean that a brand can buy a complete certification decision.

The commercial readiness map must therefore use a stricter definition than page publication.

## Current commercial readiness map

<!-- BEGIN: generated-category-readiness -->

_As of 2026-08-12. This table is generated from `data/category-readiness.json`; it is the commercial-state source of truth._

| Category | Current state | Why |
|---|---|---|
| Infant and Child Foods | Private Readiness only | Technical standards and a program manual are published; the complete commercial opening record has not been declared. |
| Grains, Cereals, and Rice Products | Private Readiness only | Technical standards are published; the complete commercial opening record has not been declared. |
| Seafood | Private Readiness only | Technical standards are published; the complete commercial opening record has not been declared. |
| Infant and Child Contact Products (Ages 0–5) | Private Readiness only | Technical standards are published; the complete commercial opening record has not been declared. |
| Culinary Oils and Fats | Private Readiness only | Technical standards are published; the complete commercial opening record has not been declared. |
| Chocolate, Cocoa and Confectionery | Private Readiness only | A technical standard is published; the complete commercial opening record has not been declared. |
| Condiments, Sauces and Dressings | Private Readiness only | A technical standard is published; the complete commercial opening record has not been declared. |
| Dairy and Milk Products | Private Readiness only | A technical standard is published; the complete commercial opening record has not been declared. |
| Herbs, Spices, Seasonings and Salt | Private Readiness only | Technical standards are published; the complete commercial opening record has not been declared. |
| Sweeteners and Syrups | Private Readiness only | A technical standard is published; the complete commercial opening record has not been declared. |

<!-- END: generated-category-readiness -->

## Readiness states

| State | Meaning | What a brand can do |
|---|---|---|
| Open for certification | Applicable limits, analytes, methods, laboratory capacity, decision rules, agreements, mark controls, surveillance, and verification are complete for the named product form | Enter formal certification after written scope and quote confirmation. |
| Private Readiness only | Enough information exists to evaluate products and plan gaps, but one or more components required for an issued certificate are incomplete | Review evidence, classify risk, sequence products, and prepare without purchasing a formal certification decision. |
| Evidence review underway | HMI evidence, regulatory mapping, analytical fitness, or occurrence work is still being built or audited | Register interest and provide nonconfidential category information; do not rely on a future opening date. |
| Public consultation | A draft rule or standard is available for structured technical comment but is not yet the governing certification edition | Submit comments and model impact; do not display the mark or describe the product as pending certification. |
| Not yet scheduled | No complete evidence or operational workstream has been approved for that category | Do not accept a certification fee or imply near-term availability. |
| Paused | A material methodological, regulatory, laboratory, legal, or governance issue prevents new decisions | Existing certificates and applicants follow the published pause and transition rules. |

## What must be complete before “Open” is used

| Gate | Required evidence |
|---|---|
| Product definition | Unambiguous subcategory, product form, native basis, intended consumer, and material formulation splits. |
| Standard | Versioned, dated, publicly readable limits and rationale for every required certification analyte. |
| Regulatory map | Current applicable comparators and a defined method for jurisdiction-specific legal escalation. |
| Analytical method | Fit-for-matrix method, sensitivity, reporting, uncertainty, speciation, reflex, and confirmation rules. |
| Laboratory capacity | At least one qualified route capable of performing the required work under the program conditions. |
| Sampling | Baseline, lot identity, chain of custody, reserve sample, independent sampling, and composite rules. |
| Decision system | Pass, fail, borderline, status, CAPA, suspension, revocation, appeal, and reinstatement rules. |
| Commercial terms | Itemized fee treatment, laboratory-charge treatment, timeline assumptions, agreement, and data notice. |
| Mark controls | Ratified assets, scope line, reproduction guide, claims, artwork review, suspension, and removal. |
| Surveillance | Risk tier, frequency, market-pull, trend, alert, change-control, and renewal process. |
| Verification | Product-specific certificate record, public status logic, limitations, and correction process. |
| Governance | Accountable program operator, conflicts, appeals, firewall, change control, and version record. |

If any release-critical gate is missing, the honest state is Private Readiness only, Evidence Review, Consultation, Paused, or Not Scheduled.

## Counts must come from one source

Homepage counts, standards-register counts, application eligibility, manuals, and portal logic must consume one authoritative generated readiness object. Hand-entered numbers will drift because the technical evidence state and commercial opening state do not change at the same time.

The generated object should identify, for every product form:

| Field | Purpose |
|---|---|
| Readiness state | Controls whether formal application is available. |
| Governing standard and edition | Identifies the rule that would control a decision. |
| Complete analytes and held analytes | Prevents a partial page from being mistaken for a complete certification panel. |
| Laboratory route | Confirms that the required testing can actually be ordered. |
| Mark-guide version | Prevents certification where compliant artwork cannot be issued. |
| Surveillance version | Confirms that post-issue obligations exist. |
| Effective and review dates | Makes future change visible. |
| Blocking reasons | Explains why the state is not Open. |

## Written confirmation before payment

Before a certification fee or formal sample is accepted, the brand should receive written confirmation of the product form, readiness state, governing standard, evidence plan, cost treatment, and known dependencies.

A general category name is not enough. “Infant food,” “seafood,” “cereal,” or “supplement” can contain product forms with different analytes, methods, bases, and readiness states.

[Review the technical standards register](/standards).

[Use Private Readiness](/readiness) when the category is not yet fully open or the product scope is uncertain.
