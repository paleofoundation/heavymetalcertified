# Part 2 — The HMTc Program

This Part sets out the governance architecture of the Heavy Metal Tested & Certified (HMTc) Program for Infant and Child Foods: how a product enters the Program, how its certification status is determined and maintained, and the corrective, evidentiary, and data-integrity obligations that attach to each status. The Program is published and administered by the Institute of Contaminant Standards (ICS). Except where a defined term states otherwise, every requirement in this Part is normative, and the Program Operator issues binding determinations under it.

Certification status is governed by a single metric, MaxPoL, defined in Section 2.1. Status is limit-relative: it is computed from measured lot results against the applicable government limit under the government-limit default (Method v2.0), and by nothing else. No distribution of measured values, market aggregate, or external dataset sets a limit or determines a status.

## 2.1 Program Flow and Analyte Tiering

### The governing metric: MaxPoL

For each compliance analyte, Percent-of-Limit (PoL) = (measured result ÷ applicable limit) × 100. The applicable limit is the governing regulatory limit for that analyte in the product's market of sale, applied under the government-limit default. MaxPoL (Maximum Percent-of-Limit) is the highest PoL among all compliance analytes in a lot. Certification status is a function of MaxPoL only. A limit is never derived from the distribution of measured values; it is the government limit, and MaxPoL measures a lot against it.

### Program flow

1. Baseline (three lots). Every SKU entering the Program shall be tested across a minimum of three production lots, on the full heavy-metals panel and under Program methodology, before any status is assigned. A single passing lot certifies nothing. The three lots are evaluated collectively, and initial status is assigned from the worst-performing lot.
2. Expedited baseline (prior-data credit), optional. A brand with qualifying accredited testing history may credit up to two of the three baseline lots and complete the baseline with one new full-panel HMTc lot. Credited lots must be ISO/IEC 17025-accredited, from distinct production runs tested within the twelve months preceding application, submitted as structured (machine-readable) data with intact chain of custody, and credited on a per-analyte basis only. Prior-data credit is not available on the Confidential Remediation Track (Section 2.4).
3. Entry gate. A lot testing above 200% MaxPoL, or violating an applicable regulatory limit, is Not Eligible and cannot enter the staged status framework. Such a SKU must resolve the exceedance before baseline.
4. Status assignment. Status A–E is assigned per Section 2.2 from the baseline result, then maintained through ongoing surveillance.
5. Surveillance. Lot-testing frequency is set by the product risk tier and the current certification status (frequency matrix below).

### The certification panel

The certification panel is eight limit analytes: lead (Pb), inorganic arsenic (iAs), mercury (tHg, total), cadmium (Cd), chromium (Cr, total), nickel (Ni), tin (Sn), and aluminium (Al). Three mandatory speciation reflexes attach to the panel — inorganic-arsenic determination for rice-based matrices, methylmercury for relevant matrices, and hexavalent chromium [Cr(VI)] on any credible pathway. A speciation reflex is not a separate limit analyte; where it applies, the speciated result supersedes the corresponding total (see Speciation, below).

### Analyte tiering

Tiering governs whether any exceedance can be tolerated. It is a distinct axis from the product risk tier.

| Tier | Metals | Rule |
|---|---|---|
| Tier 1 — Zero Tolerance | Lead (Pb), Cadmium (Cd), Inorganic arsenic (iAs), Mercury (tHg, total) | No transitional variance at any margin. Any confirmed result above 100% of the applicable limit escalates the SKU to Status C or higher. |
| Tier 2 — Transitional | Nickel (Ni), Aluminium (Al), Tin (Sn), Chromium (Cr, total) | A transitional exceedance above 100% and up to 150% may qualify for Status B under Section 2.3. |

Methylmercury is the speciated form governing the mercury determination in relevant matrices; where required, the methylmercury result supersedes total mercury for compliance. Chromium is evaluated as total chromium, with Cr(III) assumed an essential nutrient; Cr(VI) speciation is required only where a credible hexavalent pathway exists. Any quantifiable hexavalent chromium [Cr(VI)] on a credible pathway is a hard fail, evaluated as a Tier 1 exceedance regardless of the total-chromium result. On new evidence, the Program Operator may, on Technical Committee recommendation and with a defined transition period, reclassify a metal between tiers or add analytes to the panel.

### Speciation

Speciation is mandatory for inorganic arsenic in rice-based products, for methylmercury in fish-containing products, and for Cr(VI) where a credible hexavalent pathway exists. Where a speciated form applies, a total-metal result at or above 50% of the applicable total-metal limit triggers reflex speciation; the Program Operator may lower, but not raise, this trigger. The speciated result supersedes the total-metal result for compliance. Failure to perform a required speciation renders the lot ineligible.

### Product risk tiers and surveillance frequency

The live taxonomy comprises nine subcategories: infant formula (powder), infant formula (ready-to-feed), baby cereal, fruit purée, non-root vegetable purée, root-vegetable purée, mixed meals, fruit juice, and teething/snack. Each SKU is assigned a product risk tier:

- High: infant formula (powder and ready-to-feed), baby cereal.
- Moderate: fruit purées, non-root vegetable purées, root-vegetable purées, mixed meals.
- Lower: fruit juice, teething and snack products.

The Program Operator may adjust an individual product's risk tier on documented rationale (for example, a rice-based teething product elevated to Moderate). Surveillance frequency follows both the risk tier and the current status:

| Product risk tier | Status A | Status B | Status C |
|---|---|---|---|
| High | Monthly, independent sampling | Every lot or monthly (more frequent) | Every lot + mandatory hold-and-release |
| Moderate | Quarterly | Monthly, independent | Every lot + mandatory hold-and-release |
| Lower | Quarterly | Monthly, independent | Every lot + mandatory hold-and-release |

Within Status C, third-party sampling is tied to the probation band, not to the product risk tier: the High Probation band (MaxPoL 176–200%) additionally requires Operator-directed third-party sampling, and the Low Probation band (151–175%) does not (Section 2.2). A lot in the 101–150% band that also carries any Tier 1 exceedance is treated as Status C — every lot, mandatory hold-and-release, and independent sampling — regardless of product risk tier.

## 2.2 Certification Status Framework (A–E)

Status is assigned from MaxPoL and the Tier 1/Tier 2 classification of any exceedance. Bands are integer and non-overlapping.

| Status | Designation | MaxPoL / trigger | Mark use |
|---|---|---|---|
| A | Certified — Full Compliance | MaxPoL ≤ 100% for all analytes | Permitted, unrestricted |
| B | Certified — Transitional | 101–150%, exceedance limited to Tier 2 only, no Tier 1 above 100%, no hard-stop | Permitted, flagged transitional in the registry |
| C | Probation | 151–200% for any analyte; or any Tier 1 above 100% at any margin; or repeated Status B without improvement; or systemic control failure; or unmet transitional conditions | Not on new production; lot-by-lot release only where that lot tests at A/B level |
| D | Suspension | Above 200% MaxPoL for any analyte; or any hard-stop (regulatory-limit violation or data-integrity failure); or failure to execute testing, CAPA, or directives on probation | Prohibited; Mark removed from all units and marketing immediately |
| E | Revocation | Persistent suspension without correction; severe or repeated nonconformance; willful misconduct or data fraud | Permanently prohibited; license terminated |

A lot above 200% MaxPoL or in violation of a regulatory limit at entry is Not Eligible and cannot enter the framework (Section 2.1).

### Status C — graduated severity

- Low Probation: MaxPoL 151–175%. Every-lot hold-and-release; the brand's own accredited sampling is permitted, subject to audit.
- High Probation: MaxPoL 176–200%. Every-lot hold-and-release plus mandatory Operator-directed independent third-party sampling.

Exit from Probation requires both a minimum of five consecutive passing lots at A/B level and completion of all CAPA milestones with verified effectiveness. Neither condition alone is sufficient.

### Status D — actions and reinstatement

Status D triggers stop-ship, seal removal, and market correction, with CAPA initiated within two business days and containment immediately (within 48 hours). Reinstatement requires a completed CAPA with verification of effectiveness (VOE), a run of consecutive compliant lots set by the Program Operator, restored data integrity, and formal Operator approval. Reinstatement does not require a fresh baseline.

### Status E — revocation

Revocation is permanent and terminates the license. Re-entry is by full re-application only, at the Program Operator's discretion. Concealment of a known exceedance is grounds for revocation.

## 2.3 Transitional Variance (Status B)

Status B is a time-limited, conditional certification for a Tier 2 exceedance. All of the following conditions must hold:

- MaxPoL is above 100% but no greater than 150%.
- The exceedance is limited to Tier 2 metals; no Tier 1 metal exceeds 100%.
- No other hard-stop condition is triggered.
- The Certification Mark is permitted, flagged transitional in the registry.
- Surveillance is elevated: monthly independent sampling minimum, with every-lot testing where a risk assessment requires it.
- A CAPA is mandatory: opened within 10 business days, with a detailed plan within 30 calendar days, and VOE demonstrating a measurable reduction across subsequent lots.
- A default 12-month period applies to reach Status A; the Program Operator may extend for documented complexity.

A Status B SKU shall escalate immediately to Status C if any lot exceeds the 150% cap, if any Tier 1 exceedance occurs, or if the SKU fails to show an improving trend.

## 2.4 The Confidential Remediation Track

The Confidential Remediation Track is an entry and support pathway for brands whose initial baseline does not reach Status A or B, provided every tested lot meets the applicable legal heavy-metal limits in its markets of sale at the time of testing. It is a route into the Program for products not yet certifiable, not a post-certification mechanism.

- Confidentiality. Enrolment status, test data, CAPA documents, and remediation progress are treated as confidential business information under the license agreement.
- Support. Enrolled brands receive confidential remediation support — reformulation and technical assistance — together with supplier intelligence and access to the Program's testing infrastructure.
- Mark-use rule (hard). The Certification Mark shall not be used on any product, packaging, or marketing until at least one SKU achieves Status A or B.
- Interaction with prior-data credit. The Track is not available together with the Expedited Baseline (prior-data credit) pathway.
- Timelines. The Track uses the standard governance CAPA windows (Section 2.8); it carries no separate remediation windows.

Confidentiality has defined limits: enrolment and its documentation never delay a product recall, never override any regulatory reporting duty, and shall be produced to a regulator on request. Participation is positioned as a good-faith, third-party-verified quality-improvement initiative, generating documented, timestamped evidence of due diligence.

## 2.5 The Evidence Base: heavymetalindex.com

The Heavy Metal Index (heavymetalindex.com) is contextual evidence only. It never sets a limit, supplies no selection statistic, and never determines a status. Every limit value in this Program traces to a named sovereign government maximum (Section 2.1 and Part 5); certification status is computed solely from measured lot results against that applicable limit (MaxPoL). The Index may inform category context and prioritization; it carries no compliance weight of its own.

The reference is one-way and outbound. The Program cites the Index; the Index does not endorse the Program. This manual does not re-host, mirror, or reproduce Index content, and asserts no cross-domain canonical relationship with it. The Institute of Contaminant Standards maintains the Index as a separate property.

## 2.6 Decision Rules Under Measurement Uncertainty

Every result is evaluated against its limit using the laboratory's expanded measurement uncertainty (MU), reported at the 95% confidence level (coverage factor k = 2). The rule is two-sided:

| Outcome | Rule |
|---|---|
| Pass | (Result + MU) ≤ Limit |
| Fail | (Result − MU) > Limit |
| Borderline | Neither condition met — confirmatory action required before any status |

A borderline result alone shall not certify. Resolution requires at least one of: confirmatory re-analysis of the same extract; a confirmatory test on a new sample from the same lot under strict chain of custody; or lot hold-and-release. The action and its basis shall be documented, and the more conservative interpretation governs on divergence.

Testing into compliance is prohibited. Ad-hoc retesting to obtain a pass is not permitted; any retest must follow a pre-approved, scientifically justified pathway. Undocumented resampling, lab-shopping, and selective reporting are data-integrity violations and lead to suspension or revocation.

Where a laboratory does not report MU, the result is evaluated directly against the limit — a result above the limit fails, and a result at or below the limit passes. Laboratories unable to report MU are disfavored, and the Program Operator may require transition to a conforming laboratory.

## 2.7 Data Governance and Integrity

- Structured data. Laboratories shall provide the Program Operator written access to underlying data in machine-readable form. PDF-only submissions are not permitted. Machine-readability enables trend analysis and aggregate Program surveillance.
- Laboratory and LOQ. All testing shall be performed by ISO/IEC 17025-accredited laboratories using methods fit for the matrix, with a limit of quantitation (LOQ) at or below the applicable HMTc action level per analyte. Where the LOQ exceeds the limit, a non-detect is not acceptable proof of compliance and the result is indeterminate pending retest.
- Chain of custody. Chain of custody is required for every sample. An enumerated custody breach invalidates the result, and the default disposition is invalidation, treated as a data-integrity matter; minor, well-documented lapses may be excused at the Program Operator's discretion.
- Composite sampling. Composite samples shall be drawn from units across the lot such that the result supports 95% confidence that the lot meets requirements. Alternative sampling designs require prior written approval.
- Integrity as hard-stop. Falsification, manipulation, selective omission, or unauthorized alteration of data results in immediate Status D and, in the ordinary case, Status E. Enumerated violations include falsified results, failure to report required results, use of unauthorized non-accredited laboratories, undocumented custody breaks, and undisclosed retesting or lab-shopping. The Program Operator audits integrity and may require random verification testing at designated laboratories.

## 2.8 Corrective and Preventive Action (CAPA)

CAPA timelines scale with severity:

| Status | CAPA initiation | Full plan due | Containment |
|---|---|---|---|
| B | 10 business days | 30 calendar days | As needed |
| C | 5 business days | 15 business days | Within 48 hours |
| D | 2 business days | 10 business days | Immediate (within 48 hours) |

For Status B, a 12-month default period to return to Status A applies; failure to demonstrate an improving trend escalates the SKU to Status C.

### Required elements

Every CAPA shall contain: Issue Identification (SKU, affected lots, analytes, numeric results, applicable limits, and PoL/MaxPoL); Impact Quantification; Immediate Containment; Root-Cause Analysis using a structured method (5-Why, fishbone, or fault-tree); Corrective Actions; Preventive Actions; and a VOE plan specifying validation lots and success criteria.

### Closure

A CAPA closes only after VOE demonstrates return to controlled status against the defined success criteria and the Program Operator formally approves closure. Where criteria are unmet, the Operator extends the CAPA or requires additional actions.

### Escalation and early warning

A Status B lot that exceeds the 150% cap, any Tier 1 exceedance, or the absence of an improving trend escalates the SKU immediately to Status C. As an early-warning control distinct from the 50% reflex-speciation trigger, any Tier 1 result reaching or exceeding 80% of its applicable limit shall trigger a confirmatory test on the next lot, notification of the Program Operator, enhanced monitoring, and speciation where a speciated form applies.

### Regulatory hard-stop

Any lot violating an applicable regulatory limit (as distinct from an HMTc action level) in any market of sale — regardless of HMTc status — triggers immediate licensee notification, a mandatory hold or market correction, CAPA within two business days, and Program Operator cooperation with regulators. Regulatory compliance takes absolute precedence over Program status.

## 2.9 Appeals

A licensee may appeal a determination made under this Part. Appeals proceed in two tiers. A Tier 1 appeal is reviewed internally by the Program Operator. A Tier 2 appeal is referred to an independent three-reviewer body; a Tier 2 reversal binds the Program Operator and applies retroactively to the affected determination. The Program Operator publishes the filing and review windows for each tier and applies them uniformly.
