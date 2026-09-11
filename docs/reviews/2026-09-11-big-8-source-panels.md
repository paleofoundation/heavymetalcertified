# The Big 8 source-panel pilot

The user requested substantive explanations in the right-side citation drawers:
a brief source summary, what it establishes, and why it matters to HMTc. All 15
references on `/briefings/the-big-8` now have those sections. Other pages retain
their original reference-derived panels.

Reviewed copy and primary links: `data/source-panels/briefings/the-big-8.json`.
Each record is matched to its reference number AND title. This avoids reusing a
summary against a different source if the bibliography is reordered. The data is
rendered with the page, so there is no extra request or dependency on the public
Heavy Metal Index map. The original briefing prose, tables, references and PDF
source are unchanged by this pilot.

Grouped references retain distinct documents and editions. Reference 10 identifies
the later JECFA tin clarification rather than attributing it to the 1988 meeting.
Reference 13 links all five EFSA opinions separately. Reference 14 uses the public
NSF scope and edition catalog; its paid numerical standard was not verified.
Reference 15 identifies ICH Q3D(R2) separately from USP's implementation FAQ; no
current normative USP chapter revision is asserted.

The navigation review also found and fixed existing duplicate marker listeners:
SPA morphing can reuse nodes but discard the wired attribute. AbortController
cleanup now removes old handlers before binding the current page. An isolated
micromorph reproduction changed from two opens and a 300→0 scroll jump to one
open and restored 300→300 scrolling. Each new record also starts at the top of
the drawer after a longer record was scrolled.

## Source discrepancies requiring a separate briefing revision

These were found while preparing the panels and are not silently carried into the
new summaries. They concern scientific/regulatory prose beyond the drawer pilot;
no standard, threshold or policy was changed.

- **Four-metal origin / House testing:** The 2021 House staff reviewed company
  records; they did not perform the tests. The report also discusses earlier
  investigations, so it does not establish that the four-metal convention began
  solely with that report. [Official report](https://oversightdemocrats.house.gov/imo/media/doc/2021-02-04%20ECP%20Baby%20Food%20Staff%20Report.pdf).
- **Aluminium formula limits:** The briefing incorrectly describes a single
  limit including soy. The 2024 Schedule 19 compilation distinguishes general
  formula (0.5 mg/kg), soy (1 mg/kg), and specified preterm formula (0.2 mg/kg).
  The older rule also had distinct categories (0.05, 0.1 and 0.02 mg/100 mL,
  respectively, prepared/ready to drink). The revised formula rules apply in
  Australia, with old/new transition through 13 September 2029; New Zealand
  opted out. [Schedule 19](https://www.legislation.gov.au/F2015L00454/2024-09-13/2024-09-13/text/original/epub/OEBPS/document_1/document_1.html),
  [older Standard 2.9.1](https://www.legislation.gov.au/F2015L00409/2022-01-20/2022-01-20/text/original/pdf),
  [FSANZ P1028](https://www.foodstandards.gov.au/food-standards-code/proposals/P1028).
- **Tin safety margin:** JECFA's cited evaluation history reports possible gastric
  irritation around 150 mg/kg beverages and 250 mg/kg other canned foods in some
  people. The briefing's claimed wide margin to 1,000–1,400 mg/kg is not supported
  by that source. An elevated tin result alone is also not a definitive diagnosis
  of can failure. [JECFA tin history](https://www.inchem.org/documents/jecfa/jeceval/jec_2277.htm),
  [WHO evaluation](https://apps.who.int/food-additives-contaminants-jecfa-database/Home/Chemical/515).
- **Nickel formula scope:** The 0.25 mg/kg powder entry covers powder outside the
  specified soy-isolate exception, not only cow-milk powder. The original briefing's
  statement that all mean exposures are at/below EFSA's TDI also needs qualification:
  EFSA Table 8 has a maximum upper-bound toddler mean of 14.6 versus a TDI of 13
  µg/kg/day. [EU 2024/1987](https://eur-lex.europa.eu/eli/reg/2024/1987/oj/eng),
  [EFSA full opinion](https://pmc.ncbi.nlm.nih.gov/articles/PMC7643711/).
- **Regulatory floor / exclusivity:** These citations do not establish a universal
  eight-metal food-law floor or HMTc's uniqueness against every certification.
  EPA IRIS is not an inventory of worldwide food legislation, and NSF's scope
  description is not a complete competitive scan. Treat broader coverage as
  HMTc's scope, with any market-wide claims requiring separate substantiation.
  [EPA review](https://iris.epa.gov/static/pdfs/0144tr.pdf),
  [NSF scope](https://www.nsf.org/nutrition-wellness/product-and-ingredient-certification).
- **Chemical species and benchmark types:** ICH's chromium default is Cr(III),
  with Cr(VI) considered separately, so seven overlapping element names do not
  establish equivalent species coverage. EFSA's grouped opinions do not assign
  HMTc tiers or one uniform zero-tolerance benchmark: mercury/cadmium have weekly
  intakes, while lead/inorganic arsenic use different assessment approaches.
  [ICH Q3D(R2)](https://database.ich.org/sites/default/files/Q3D-R2_Guideline_Step4_2022_0308.pdf).

## Validation

- Direct Quartz build: exit 0; 503 input pages, 856 emitted files.
- `npm run check`: exit 0.
- `node tools/design-lint.mjs`: exit 0 (existing table-canonicalization advisory).
- `npm run check:v3`: exit 0; 314 rendered assertions, including the open nickel
  panel's sections, typography, source action and citation control.
- All 15 records checked at 1440px and 390px: correct source/summary/finding/HMTc
  text, primary links, citation clipboard contents, close/focus return and no
  drawer overflow. SPA home→Big 8 return and another article's unchanged fallback
  passed. Browser error collection was empty. Visual checks covered nickel and
  the grouped EFSA record on mobile.
