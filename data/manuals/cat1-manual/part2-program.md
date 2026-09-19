# Part 2 — Program lifecycle and instruments

This Part is the current source of truth for how a Category 1 SKU enters, is assigned a status, and is held to the mark. Except where a defined term states otherwise, every requirement is normative.

## 2.1 The governing metric

For each of the eight limit analytes, Percent-of-Limit (PoL) = (measured result ÷ applicable limit) × 100. MaxPoL is the highest PoL in a lot. Status is a function of MaxPoL only. The applicable limit is the published government floor or disclosed read-across. Limits do not derive from a distribution of measured values.

The eight limit analytes are lead (Pb), total arsenic (tAs), cadmium (Cd), mercury (tHg, total), nickel (Ni), tin (Sn), aluminium (Al), and chromium (Cr, total). Inorganic arsenic, methylmercury, and hexavalent chromium are pathway species. They never replace the parent total.

## 2.2 Program flow

1. Baseline (three lots). Every SKU is tested across a minimum of three production lots, on the full eight-total panel and required pathway speciation, before any status is assigned. A single passing lot certifies nothing. The three lots are evaluated collectively, and initial status is assigned from the worst-performing lot.
2. Expedited baseline (prior-data credit), optional. Qualifying ISO/IEC 17025 results from the preceding twelve months may credit up to two lots, per analyte actually measured. Not available on the Confidential Remediation Track.
3. Entry gate. A lot testing above 200% MaxPoL, or violating an applicable regulatory limit, is Not Eligible.
4. Status assignment. Status A–E is assigned from the baseline, then maintained through surveillance.
5. Schedule assignment. Risk tier and lot-testing frequency are assigned after application, from the brand laboratory's stated panel, LOQ, MU, and capability (Part 4).

## 2.3 Analyte tiering

| Tier | Metals | Rule |
|---|---|---|
| Tier 1 — Zero Tolerance | Lead (Pb), Cadmium (Cd), Inorganic arsenic (iAs), Mercury (tHg, total) | No transitional variance. Any confirmed result above 100% of the applicable limit escalates the SKU to Status C or higher. |
| Tier 2 — Transitional | Nickel (Ni), Aluminium (Al), Tin (Sn), Chromium (Cr, total) | A transitional exceedance above 100% and up to 150% may qualify for Status B. |

Any quantifiable hexavalent chromium [Cr(VI)] on a credible pathway is a hard fail, evaluated as a Tier 1 exceedance.

## 2.4 Certification Status Framework (A–E)

| Status | Designation | MaxPoL / trigger | Mark use |
|---|---|---|---|
| A | Certified — Full Compliance | MaxPoL ≤ 100% for all analytes | Permitted, unrestricted |
| B | Transitional (mark withheld) | 101–150%, exceedance limited to Tier 2 only, no Tier 1 above 100% | Withheld until Status A |
| C | Probation | 151–200% for any analyte; or any Tier 1 above 100%; or unmet transitional conditions | Not on new production; lot-by-lot release only where that lot tests at Status A |
| D | Suspension | Above 200% MaxPoL for any analyte; or any hard-stop | Prohibited; mark removed immediately |
| E | Revocation | Persistent suspension; willful misconduct; concealment | Permanently prohibited |

Status C Low band is 151–175%. Status C High band is 176–200%. High Probation adds Operator-directed third-party sampling.

The Certification Mark shall not be used on any product, packaging, or marketing until the SKU achieves Status A.

Status D reinstatement does not require a fresh baseline. It requires a completed CAPA with verification of effectiveness, a run of consecutive compliant lots set by the Program Operator, restored data integrity, and formal Operator approval.

## 2.5 Measurement uncertainty

Every result is evaluated with expanded measurement uncertainty at coverage factor k = 2 (95%). Pass: (Result + MU) ≤ Limit. Fail: (Result − MU) > Limit. Borderline: neither, confirmatory action required before any status. A borderline result alone shall not certify. Testing into compliance is prohibited.

## 2.6 CAPA

| Status | CAPA initiation | Full plan due | Containment |
|---|---|---|---|
| B | 10 business days | 30 calendar days | As needed |
| C | 5 business days | 15 business days | Within 48 hours |
| D | 2 business days | 10 business days | Immediate (within 48 hours) |

For Status B, a 12-month default period to return to Status A applies. As an early-warning control distinct from the 50% reflex-speciation trigger, any Tier 1 result reaching or exceeding 80% of its applicable limit shall trigger a confirmatory test on the next lot.

## 2.7 Remediation and ratchet

Before certification, readiness awards no mark. After certification, corrective action follows the published status rules. Concealment of a known exceedance is grounds for revocation.

A published limit tightens only through the Standards Ratchet: a stated trigger and a capped step. Limits do not loosen because a brand found them inconvenient.

The Heavy Metal Index is contextual evidence only. It never sets a limit and never determines a status. The reference is one-way and outbound.
