---
title: For brands — the defensibility layer
noindex: true
audience: [regulator, brand-legal, commercial]
updated: 2026-05-30
---

# For brands

Heavy Metal Index is an independent, source-traceable record of the heavy-metals food-and-supply-chain literature. For a brand, the value of that record is not the badge. It is that the evidence behind a certification can be produced, version-pinned, and traced to the peer-reviewed and regulatory literature on demand, so that a certification survives a regulator's question, a retailer's compliance review, or a plaintiff's expert in a class action. This page is the entry point to the four instruments that deliver that value.

Each instrument reports what the literature and the regulations say. None of them states an [[heavy-metal-tested-certified|HMTc]] certification threshold or a pass/fail determination. Those are policy choices that live in the certification program, separate from this evidence base by design, which is what lets this record stay defensible when a threshold is challenged.

## The certification defense dossier

For every certified product category there is a single, version-pinned dossier that assembles the contributing literature, the applicable regulatory ceilings, the supply-chain risk drivers, and the recent regulatory and literature changes into one record. Every page it pins is hashed and tied to a git commit, so any party can reconstruct exactly what the record said on a given date. The full set is at [[dossiers/index|the dossiers hub]].

The machine-verifiable downloads sit behind two endpoints. The per-category packet is at `/api/defense-dossier?slug=<category>`, and the single-page evidence packet, which carries the verbatim attestation language an exhibit author can paste into a filing, is at `/api/evidence-packet?slug=<page-slug>`. Add `&download=1` to either to save it as a file.

## The change-watch feed

The literature and the regulations move. A tightened limit, a new effective date, or a material shift in the cited concentration for an ingredient can turn a settled position into an exposure. The change-watch feed records what has moved that touches a given category, so the change reaches a brand before it becomes a delisting or a complaint. The feed for a category is at `/api/change-watch?category=<category>`; the recent record across all categories is at `/api/change-watch`.

## The supply-chain risk map

Given a bill of materials, the risk map ranks which ingredients drive each metal's risk and cites the ingredient evidence behind each rank. It answers where a brand's lead, cadmium, or arsenic exposure originates and which input to address first. An arbitrary ingredient list is handled at `/api/risk-map?ingredients=rice,cocoa,spinach`; a certified category's declared inputs are precomputed at `/api/risk-map?category=<category>`. The ranking is ingredient-level literature evidence for defensive sourcing, not a finished-product measurement.

## The Lab Result Comparator

When a brand has a finished-product laboratory value, the [Lab Result Comparator](/certification/lab-result-comparator) positions it inside the cited literature for the matrix and against the applicable regulatory ceiling, with the basis conversion shown if one was applied. Where finished-product sampling is thin, the comparator falls back to the ingredient-level literature and labels it as indicative; where an analyte has not been characterized at all, it says so and names what to request from the laboratory, rather than showing an empty cell.

## Ask the Index, in brand-legal mode

Reference questions about the corpus can be put to [Ask the Index](/ask), which answers only from the cited wiki pages and traces every claim back to its source. A brand-legal mode foregrounds provenance, source tier, and the gap between a regulatory ceiling and the cited field findings, which is the reading that matters under a defensibility review.

## How the separation protects the brand

The wiki reports the literature honestly, including where the literature supports a less strict position than the certification requires. That honesty is the asset. A record that can be shown to report the complete literature without favoring the certifier is the record that dominates a dispute, because the opposing expert is reading from the same book. The gap between what the literature supports and where a certification sets its line is stated, never hidden; it is how a ratcheting standard drives a category cleaner over time.
