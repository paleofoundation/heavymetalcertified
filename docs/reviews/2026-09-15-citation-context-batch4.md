# Numbered citation expansion: batch 4

Added 17 reviewed records: Organic Certification Not Protective (8) and The
Prop 65 Gap (9). The registry now contains 105 reviewed records on 13 pages.

## Older bibliography formats

Normalized the existing references on four briefings: Before the Meat Label
Prints (7), Peptides and SARMs (8), Pet Food (9), and No Limit Is Not No Standard
(6). The shared reference rows now support their inline citations and bibliography
controls. Original citation details, page prose and structured data were preserved.

The 30 newly supported entries enter the research queue. The inventory is now
401 numbered references on 49 pages, with 296 pending. All 571 numbered citation
uses resolve to a bibliography entry, and the audit reports no unsupported
reference layouts or invalid reviewed records. Standalone DOI/HMI links remain
the separately documented scope.

## Evidence and editorial findings

- Organic regulations include contamination controls. The article's absolute
  description goes beyond their scope. Observational comparisons are not tests
  of HMTc effectiveness or universal organic/conventional equivalence.
- The tahini study includes two organic products, not one. Their concentrations
  differ substantially, and its category-limit comparisons require caution.
- The chocolate organic comparison uses a 37-observation daily-intake subset;
  the study did not measure the article's sourcing/blending explanation.
- Dearing's examined version awaits peer review; the HMI synthesis also states
  its provisional review status. Neither is independent validation of HMTc.
- OEHHA lists a 10 µg/day inorganic-arsenic NSRL except inhalation, contradicting
  the Prop 65 briefing's claimed absence of an oral safe harbor.
- Proposition 65 also covers certain drinking-water discharges and preserves
  other laws. A warning does not authorize any concentration under food law.
- Nickel listings depend on chemical form and endpoint. EFSA body-weight intake
  guidance and EU food-category concentration maxima are different measures.

The new records retain source/page hashes, primary evidence, access limitations
and review notes. Article and Prop 65 briefing prose remain unchanged.

## Validation and usage

- Registry import/build, audit, design lint and direct Quartz build: exit 0.
- `npm run check:v3`: 699 rendered assertions passed, exit 0.
- All 17 new rich records opened at 1440px and 390px with three populated
  sections, correct links and no overflow (34 checks).
- All four normalized pages expose the expected source numbers at both widths;
  their first inline source opens the basic drawer without overflow (8 checks).
- Original page bodies and embedded structured data on all four normalized
  pages were compared with HEAD and are unchanged.
- Most recent account-wide weekly meter during this batch: 36% used. Ongoing
  parallel research means this is not an isolated cost measurement.

Local checkpoint only; no deployment was made.
