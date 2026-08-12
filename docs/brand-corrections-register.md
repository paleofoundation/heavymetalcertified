# Brand-facing correction register

Status date: 2026-08-12

This register converts the brand-risk audit into an implementation system. It distinguishes changes that can be made from the current published program record from changes that require a final policy decision, a data source, or an application product. A correction is not considered accounted for merely because it appears in strategy prose. It must be implemented, assigned to an issue with acceptance criteria, or explicitly rejected with a recorded rationale.

## Governing objective

Heavy Metal Tested & Certified should reduce the enterprise risk of responsible discovery. The brand-facing system therefore has to help an applicant know, control, correct, prove, explain, and maintain its heavy-metal program without implying that certification guarantees safety, absence of metals, legal privilege, or a passing result.

## Target operating architecture

| Layer | Function | Public surface |
|---|---|---|
| Evidence | The public, versioned record of regulations, occurrence evidence, analytical fitness, uncertainty, and corrections | HeavyMetalIndex.com |
| Governance | The authority that defines program rules, conflicts, appeals, revisions, and the firewall between evidence and certification | Institute of Contaminant Standards |
| Certification | Product-specific evaluation, certification decisions, mark licensing, surveillance, CAPA, and verification | HeavyMetalCertified.com |
| Brand operations | Private readiness, evidence reuse, portfolio triage, sample logistics, result handling, remediation, documents, and renewals | Brand portal / Control Room |
| Market verification | Product passport, retailer verification, certificate API, and public status history | Verify and retailer surfaces |

## Correction ledger

| ID | Correction | Repository action | Remaining dependency | State |
|---|---|---|---|---|
| C-001 | Replace strictness-first homepage positioning with control, privacy, predictability, and proof | Rewrite homepage hero and conversion path | None | Implemented and rendered |
| C-002 | Create a brand-specific entry point | Add `/for-brands` and a first-position For Brands navigation panel | None | Implemented and rendered |
| C-003 | Create a private readiness path before formal certification | Add `/readiness`; distinguish readiness from certification; provide a six-question, browser-only decision map that stores and transmits nothing | Private records, file intake, accounts, and storage require ratified data governance | Public decision tool implemented; private product intentionally gated |
| C-004 | Put the feared question in primary navigation | Add `/what-if-we-dont-pass` and link it from the brand hub, homepage, readiness, and application pages | None | Implemented and rendered |
| C-005 | Reconcile the Confidential Remediation contradiction | Replace the public remediation page so it matches the current Program Manual: pre-certification entry/support pathway, no mark use, no certificate-preservation promise | Decide whether a distinct post-certification self-report protocol should exist | Public contradiction removed; future protocol remains a policy task |
| C-006 | Remove stigmatizing public category terminology | Use Lower-Burden and Category Improvement on hand-written and generated public surfaces while preserving internal machine vocabulary | None | Implemented and enforced by lint |
| C-007 | Remove volatile and contradictory homepage counts | Replace counts with stable commitments; generate readiness states and displayed standard-row totals from authoritative source data | None | Implemented and enforced by generators |
| C-008 | Explain the complete cost architecture | Add `/cost-and-timing`; require written separation of program, laboratory, logistics, confirmation, remediation, surveillance, and optional service costs | Ratified fee schedule and laboratory-charge treatment | Public framework in branch; commercial policy pending |
| C-009 | Stop treating an external Paleo Foundation page as the brand journey | Keep education and decision support on-domain; describe the external submission endpoint as temporary rather than presenting it as the HMTc experience | On-domain application, quote, payment, and document intake | Migration pending |
| C-010 | Publish the consequences before testing | Add a result-consequence matrix that distinguishes readiness, certification, borderline analytical results, certification nonconformity, and legal exceedance | Rules engine and jurisdiction-aware legal mapping | Public matrix implemented; result simulator remains gated |
| C-011 | Make existing evidence reusable | Add prior-evidence acceptance criteria and an Evidence Reuse Passport concept to readiness | COA ingestion, accreditation validation, unit normalization, chain-of-custody checks | Product task pending |
| C-012 | Publish brand operating commitments | Add `/brand-bill-of-rights` | License-language review before contractual adoption | Implemented as public operating commitments |
| C-013 | Explain the institutional and HMI firewall | Add `/trust` and `/what-happens-to-your-data`; explicitly avoid claims of privilege, safety, Cochrane equivalence, unearned accreditation, or unsupported numerical retention terms | Contractual retention schedule and compulsory-process procedure before private intake | Honest public baseline implemented; private intake remains gated |
| C-014 | Create an honest category-readiness vocabulary | Generate `/category-readiness` and its public JSON artifact from one authoritative status object; require complete release gates before `open` is valid | Complete category release-gate records | Implemented; every current category truthfully reports Private Readiness Only |
| C-015 | Make the application page a controlled decision path | Rewrite `/apply` around readiness, evidence review, quote transparency, baseline, decision, mark, and surveillance | Functional on-domain private intake | Public decision path implemented; private intake intentionally gated |
| C-016 | Remove public mark-guide incompleteness | Publish the claim, reproduction, placement, QR, status, artwork-review, suspension, and removal rules; treat visible artwork as reference preview only | Controlled production assets issued only after a product qualifies | Public guide implemented without distributing unauthorized production art |
| C-017 | Protect brands from unpredictable standards changes | Publish `/standard-stability` with named editions, no silent retroactivity, change notices, transitions, and urgent-correction boundaries | Contractual adoption and edition-specific operational notices | Public covenant implemented without inventing notice periods |
| C-018 | Separate payment from outcome | Current standards are published before results and decisions are rule-based | Conflict policy, sales/decision separation, aggregated transparency reporting | Governance task pending |
| C-019 | Build role-specific deliverables | Brand hub identifies CEO, counsel, quality, procurement, operations, marketing, and finance jobs | Automated executive, legal, quality, commercial, and retailer packets | Product task pending |
| C-020 | Turn surveillance into a no-surprise system | Public consequence page explains status and CAPA boundaries | Notice sequence, warning thresholds, simulator, alerting, and surveillance dashboard | Product/policy task pending |
| C-021 | Build persistent product proof | Existing verify page provides the conceptual public lookup | Product passport with standard version, scope, status, surveillance, limitations, and history | Product task pending |
| C-022 | Make HMTc useful to retailers without relying on the package mark | Existing verification and permissions-letter concepts | Retailer API, GTIN mapping, qualification sheet, bulk verification | Product task pending |
| C-023 | Establish Cochrane-level HMI aspirations without overclaiming | Trust page describes HMI as a systematic-review-principled evidence system, not as equivalent to Cochrane | Registered protocols, dual review, audit, error-rate reporting, external methods board | HMI governance task pending |
| C-024 | Verify the rendered implementation | Expand rendered acceptance coverage and add an all-route desktop/mobile/link/interaction audit | None | Implemented: 87 acceptance assertions and 159-route crawl pass |

## Release blockers

The following items block a production merge only if the affected capability is represented as operational. The public site avoids that false representation and can ship independently:

1. The public remediation page and the Program Manual must describe the same mechanism.
2. The pricing page and application page must not quote an unratified price or imply that laboratory charges are included.
3. A category must not be described as open from a hand-entered count.
4. Production mark assets must not be distributed before qualification and artwork control.
5. New presentation must pass the rendered v3 acceptance gate.
6. Any public data-governance promise must be supportable by contract and operating practice; private intake remains off until this is true.

All six conditions are satisfied by the current public implementation. They continue to gate the corresponding private or operational products.

## Session chips

Each chip is intended to fit one focused implementation session and has a testable exit condition.

### CHIP P0-01 — Remediation governance reconciliation

Scope: Decide whether the Program has only the pre-certification Confidential Remediation Track currently defined in Part 2.4, or also a distinct post-certification voluntary-disclosure protocol. Update the Program Manual, public pages, mark-use table, status framework, portal specimen, and consistency audit from one decision.

Exit condition: one mechanism name has one eligibility rule, one mark-use rule, one public-status rule, and one legal-disclosure rule everywhere; the consistency audit fails on any future divergence.

### CHIP P0-02 — On-domain readiness and application intake

Scope: Build a six-question readiness form, create a private applicant record, issue an NDA/data notice, accept documents, and route the applicant to readiness or certification without leaving HeavyMetalCertified.com.

Exit condition: a brand can begin, save, submit, receive a scope summary, and see the next required action on the HMTc domain; no primary CTA routes through the Paleo Foundation brand.

### CHIP P0-03 — Pricing and laboratory-charge policy

Scope: Ratify the fee model and identify every charge that can arise. Replace all generic or contradictory pricing language with a machine-readable schedule and a written-quote renderer.

Exit condition: the same product inputs return the same all-in estimate everywhere; program fees, laboratory charges, logistics, confirmation, remediation, surveillance, renewal, rush, and optional services are individually identified.

### CHIP P0-04 — Mark reproduction and claims guide

Scope: Ratify minimum size, clear space, approved variants, color values, backgrounds, QR pairing, ecommerce use, retailer use, prohibited alterations, artwork review, transition, suspension, and removal rules.

Exit condition: a packaging designer can produce compliant artwork without interpretation; every downloadable asset is versioned and access-controlled; the site no longer says the guide does not exist.

### CHIP P0-05 — Authoritative category readiness map

Scope: Generate commercial readiness from source data rather than page existence. A category is Open only when limits, methods, laboratory capacity, decision rules, mark assets, surveillance, and contract terms are complete.

Exit condition: homepage, standards register, application eligibility, and readiness tool consume one generated status object; no hand-coded count remains.

### CHIP P0-06 — Data governance and HMI firewall policy

Scope: Ratify role-based access, retention, deletion, subpoena/regulator handling, legal-hold behavior, applicant visibility, HMI exclusion, aggregation rules, and audit logging.

Exit condition: the contract, portal behavior, Trust Center, HMI Trust Center, and data architecture express the same boundaries; an automated test prevents client data from entering HMI exports.

### CHIP P0-07 — Decision independence and appeals

Scope: Separate sales/account support from technical review and certification decisions; publish conflicts, compensation controls, reviewer recusals, appeals, and annual aggregate outcomes.

Exit condition: no person is commercially rewarded for a passing result; an appeal is reviewed by people not responsible for the appealed decision; the governance diagram names each accountable function.

### CHIP P1-01 — Evidence Reuse Passport

Scope: Ingest COAs and score laboratory, scope, analyte/speciation, method, sensitivity, sample identity, recency, custody, and reporting basis.

Exit condition: every uploaded result receives Accepted, Accepted with qualification, Readiness only, or New testing required, with a machine-readable reason and an immutable audit trail.

### CHIP P1-02 — No-Surprise Result Simulator

Scope: Let a brand enter a hypothetical result and see the pre-published consequence under the relevant standard, measurement-uncertainty rule, legal comparator, status rule, confirmation route, mark effect, public effect, and next action.

Exit condition: simulator output is generated from the same rules used by certification; every result class has a test fixture; no marketing prose hard-codes the consequence.

### CHIP P1-03 — Brand Control Room MVP

Scope: Portfolio heat map, evidence gaps, samples, laboratory status, results, CAPA, supplier actions, artwork, certificates, surveillance, renewals, and standard-change alerts.

Exit condition: one product can complete the full readiness-to-renewal lifecycle without email being the system of record.

### CHIP P1-04 — Standard Stability Covenant

Scope: Versioning, redlines, ordinary notice period, emergency revision criteria, transition windows, existing-certificate treatment, retesting, cost treatment, and pre-effective-date impact reports.

Exit condition: a brand can determine exactly which edition governs each lot and certificate and what a future edition will require before it takes effect.

### CHIP P2-01 — Product passport and retailer API

Scope: Persistent SKU/GTIN page, certificate status, scope, edition, product form, dates, surveillance, limitations, history, retailer download, and API.

Exit condition: a retailer can verify one product in seconds or thousands by API without interpreting a PDF certificate.

### CHIP P2-02 — Role-specific substantiation packets

Scope: Generate executive, legal, quality, procurement, commercial, and retailer outputs from the same certified record.

Exit condition: every packet is source-linked, versioned, and regenerated automatically when status, standard, formulation, or surveillance changes.

### CHIP QA-01 — Rendered and adversarial verification

Scope: Run prebuild, design lint, TypeScript check, full build, v3 rendered acceptance, link crawl, mobile navigation, accessibility, noindex controls, firewall lint, and adversarial copy review.

Exit condition: all gates exit zero; screenshots exist for homepage, brand hub, readiness, consequences, cost, trust, application, remediation, and mobile navigation; no page makes a safety, privilege, zero-metals, guaranteed-pass, or unearned-accreditation claim.
