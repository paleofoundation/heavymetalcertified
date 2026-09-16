# Science citation repairs, 16 September 2026

## Outcome and scope

Resolved three pending numbered citations through explicit replacements and corrected the claims directly affected by those replacements. Refreshed all 22 source drawers on the three changed articles against final regenerated page bodies. This closes these three identity gaps; it does not certify every remaining scientific or program-policy assertion in the articles.

| Article | Reference replaced | Identified replacement | Review scope |
| --- | --- | --- | --- |
| Bivalve cadmium amplification | 1: purported Bao cadmium-nanoparticle study | Hervé-Fernández et al. (2010), doi:10.1016/j.aquatox.2010.06.004 | Original abstract and bibliographic record only |
| Wastewater irrigation | 6: unspecified WHO/FAO irrigation/food limits | FAO Water Quality for Agriculture, Paper 29 Rev. 1 (1985, reprinted 1994), Table 21; Codex CXS 193-1995, amended 2025 | Named sections, tables, commodity qualifications and publication history |
| Organ-meat accumulation | 7: unspecified offal maximum levels | Commission Regulation (EU) 2023/915, consolidated 19 August 2026, Annex I 3.1.13–3.1.14 and 3.2.13 | Exact meat/offal species, tissue and wet-weight rows |

The original ambiguous identities remain unrecovered. Bibliography notes, drawer citations and review evidence explicitly identify each replacement; none is presented as discovery of the originally claimed source.

## Evidence and bounded corrections

### Bivalve reference 1

The [original abstract](https://pubmed.ncbi.nlm.nih.gov/20638735/) reports controlled cadmium uptake and elimination in Chilean blue mussels. Retention differed between seawater and dietary exposure; elimination occurred. The publisher full text was inaccessible, so the drawer makes no full-paper or supplementary-data review claim.

Removed unsupported claims of zero excretion, inevitable lifelong accumulation and a universal ten-to-hundredfold fish comparison. Existing primary-source evidence also required bounded corrections to the Faro Lake means, the taxa and dry basis of the Arctic study, the mercury-only scope of the Portuguese study, and the bivalve/cephalopod lead maxima. The EU twentyfold cadmium comparison is now explicitly a comparison of legal ceilings, with fish exceptions and edible-tissue qualifications, rather than measured uptake. Program thresholds and UI styles were not changed.

The prior qsae024 DOI points to the [gold-spike nanoparticle method paper](https://pmc.ncbi.nlm.nih.gov/articles/PMC11223760/). The retained mismatch review explains why the Bao identity was not accepted.

### Wastewater reference 6

The [FAO text, sections 5.5.1–5.5.3 and Table 21](https://www.fao.org/4/t0234e/T0234E06.htm), gives a long-term irrigation-water lead recommendation of 5.0 mg/L, not 0.5 mg/L. Its [frontmatter](https://www.fao.org/4/t0234e/t0234e00.htm) identifies the exact book and reprint. Table footnotes qualify the irrigation rate and continuing use at one site.

The [official Codex 2025 PDF](https://www.fao.org/fao-who-codexalimentarius/sh-proxy/ro/?lnk=1&url=https%253A%252F%252Fworkspace.fao.org%252Fsites%252Fcodex%252FStandards%252FCXS%2B193-1995%252FCXS_193e.pdf) supplies leafy-vegetable cadmium at 0.2 mg/kg and lead at 0.3 mg/kg, with spinach excluded from that lead category. The commodity portion is as usually marketed after removing decomposed or withered leaves, not a generic dry-weight basis. The reviewed schedule does not supply the 2.3 mg/kg total-chromium food value attributed by a secondary paper.

The article now attributes the meta-analysis and Malawi comparison values to their authors, distinguishes water guidance from commodity food maxima and domestic law, and avoids treating reported dry-basis comparisons as verified legal breaches. It no longer presents historical soil loading as measured by a one-time sampling exercise. Both constituents of the replacement are linked and independently documented.

### Organ-meat reference 7

The [official EU consolidation](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:02023R0915-20260819) supports exact species/tissue maxima. Cadmium limits differ between listed muscle, liver and kidney. Lead limits vary by species; poultry offal and poultry muscle both have a 0.10 mg/kg wet-weight maximum. The article no longer claims universally looser offal lead limits or treats regulatory categories as measurements of physiology. The drawer also preserves the separate horse-meat cadmium category.

## Retained limitations outside these three identity repairs

These limitations remain visible in existing drawers, refreshed for the new page context:

- Organ-meat surveys do not establish within-animal paired comparisons or a universal twofold multiplier. The cited Bangladeshi chicken study reports kidney cadmium below muscle, so a universal kidney-above-muscle claim is unsupported.
- Total-mercury measurement does not establish mercury speciation or the cause of a tissue pattern. The organ article's causal methylmercury explanation exceeds that measurement.
- The organ feeding preprint has reporting inconsistencies and some high-dose hazard quotients above one; the article's blanket below-one statement is too broad. Its dry-weight experimental values are not retail wet-weight baselines.
- The organ article's tannery-feed attribution for lead and its roughly sixfold WHO/FAO lead comparison are not independently established by the cited study. The Dutch veterinary reference interval is not a retail-food distribution or maximum observed concentration.
- Wastewater field surveys and a lead-only meta-analysis do not establish that every metal always co-varies, that wastewater is the only cause, or that one crop ranking applies to every metal. The controlled arsenic study concerns geogenic water, not sewage.
- Wastewater reference 5 remains dated 2019 in the local bibliography although the retained original PDF is dated 2017. The drawer gives the original date and flags the discrepancy. The Nigerian sample/composite design and Malawi unit inconsistencies remain limitations.
- Shared-author HMI syntheses provide source organization, not independent corroboration or validation of certification benefit. External papers and laws do not independently establish HMTc's numeric ceilings or its strictest-government policy.

These are documented follow-up issues, not newly unresolved source identities. No broad article overhaul or program-threshold change was undertaken.

## Provenance and validation

- Authoritative edits: three `data/articles/synthesis` JSON specs. `modified` set to `2026-09-16`; original `published`/`date` preserved and verified against HEAD.
- Root regenerated and dedashed the three pages before fresh manifests. Final generated bodies and bibliography context were reviewed.
- Retained 19 earlier drawer records with explicit 15 September primary-reading provenance and fresh 16 September page-specific reassessment. Added three new replacement records.
- Full immutable manifests and reviewed records: `reports/citation-context/repair-2026-09-16-science-bivalve.json`, `...-wastewater.json`, `...-organ.json`.
- All three engine dry runs and write imports passed: 7 + 7 + 8 = 22 records; no stale references retired. Imported files exactly match the reviewed batch records. Engine archives preserve previous complete panel records.
- `node tools/design-lint.mjs` passed: 466 reading-surface pages; 399 generated-table styling entries remain an advisory backlog.
- Independent read-only review found the three replacements correctly scoped, replacement status explicit, abstract-only access disclosed, reuse honest and numbered targets intact.
- Root owns global index/build/browser validation. This subtask did not write the global index, build, deploy or commit.
- Account-wide weekly usage: 50% before the bounded research batch, 52% after validation. This rounded shared meter cannot attribute the difference solely to this work.
