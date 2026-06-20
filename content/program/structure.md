---
title: "Program Structure"
description: "How an HMTc certification limit is set: the two pathways (clean P97 / dirty P45), native-basis pooling, the regulatory cap, the rationale tags, and the five shipping gates."
type: program
audience: [regulator, brand-legal, retailer-compliance, certifier]
---

# Program Structure

This page describes how a Heavy Metal Tested & Certified (HMTc) limit is set. The methodology is fixed and system-wide: it applies to every category and every row in the index, not to any one product family. The arithmetic is the certifier's; the evidence it is applied to is the independent [Heavy Metal Index](https://heavymetalindex.com).

## The standard is set per analyte, per subcategory, in a native basis

Each product subcategory carries its own standard, and within it each of the ten panel analytes — Pb, tAs, iAs, Cd, tHg, MeHg, Ni, Cr-VI, Sn, Al — has its own limit. Every limit is stated in the **native basis** of the product form: powder limits in powder-as-placed-on-market, ready-to-feed liquids as consumed, dry cereals dry-as-sold, purees as consumed. Sources reported in another basis are converted into the row's native basis during pooling, never the reverse.

## Two pathways: clean and dirty

A subcategory's occurrence distribution for an analyte determines which pathway sets the limit. The intent is a pass-rate target; the percentile is the mechanism that delivers it.

- **Clean subcategory — the limit is the P97 of the marginal occurrence distribution.** A clean pathway is calibrated so that roughly the cleanest ~90% of the market already passes, and the dirtiest tail is excluded. Clean is the default for an independent row with no within-pair partner.
- **Dirty subcategory — the limit is the P45 of the marginal occurrence distribution.** Where contamination is endemic to the commodity, a P45 limit is calibrated so that roughly the cleaner ~30% passes, pulling the category toward cleaner product without demanding the impossible on day one.

Clean-versus-dirty is a category-level judgment, not a per-row convenience. It is resolved through governance review before a row publishes.

## The regulatory cap and the final value

The published limit is **`min(per-analyte percentile, lowest applicable regulatory ceiling)`**, both in the native basis. Which side binds determines the rationale tag that ships with the value:

- **literature-baseline** — the pooled percentile binds; the standard rests on the occurrence evidence.
- **regulatory-alignment** — a regulatory ceiling binds and is tighter than (or caps) the percentile.
- **precautionary** — staff set a value below both, with documented rationale.
- **feasibility-driven** — staff set a value above the percentile because methods or supply chains cannot yet support the tighter value, paired with a sunset plan.

The program states the gap between the literature baseline and the published value honestly. The gap is the point: HMTc is a ratcheting program, designed to certify to standards tighter than the regulatory floor so that certified product pulls the category cleaner over time. After publication, an ALARA review and an 80th-percentile ratchet trigger drive further tightening across editions.

## The five gates

A subcategory analyte is held — it renders no firm value — until all five gates pass:

1. **Pairing resolved.** The row's clean/dirty pairing is settled, with no pending within-pair partner and no active across-row review hook.
2. **Methodology uniform.** No two shipped standards encode different percentile framings; the methodology version is uniform.
3. **Per-analyte readiness.** No floating or under-evidenced value; the pool is deep enough and the sensitivity band stable.
4. **Analyte scope disclosed.** Covered versus uncovered analytes travel with the mark, so a certified product is never silently uncontrolled on an analyte.
5. **Completeness ledger.** The category's published-versus-locked count is stated honestly ("Seafood: 2 of 6 subcategories published").

A cell that fails any gate renders its honest evidence-state note and the gate that holds it — never a provisional number.

## Living, versioned, citable

HMTc standards are living documents. Each edition is versioned and dated; superseded versions remain at stable URLs so prior citations resolve. A published standard is a citable technical document, framed as a technical specification — never as a peer-reviewed journal article. The evidence each standard is applied to stays on the independent index, cited one way.

See also: [the two pathways in detail](two-pathways), [Four Metals Is No Longer Enough](../briefings/brief-7-four-vs-eight), and [The Surveillance Protocol](../briefings/brief-8-surveillance-protocol).
