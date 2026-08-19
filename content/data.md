---
title: "Data and downloads"
type: standards-index
audience: [regulator, brand-legal, brand-qa, retailer-compliance, certifier, ai-integrator]
description: "The published HMTc standards as machine-readable, versioned JSON and CSV. Per product subcategory, variant, and analyte: the limit, its native basis, the controlling government instrument, and the per-country table of sovereign limits the value was selected from. Free to read and cite."
connections:
  - { label: "All standards", href: "/standards" }
  - { label: "How limits are derived", href: "/program/structure" }
  - { label: "Program Manuals", href: "/manuals" }
  - { label: "Heavy Metal Index: evidence base", href: "https://heavymetalindex.com/data" }
rail_box:
  title: "Machine-readable"
  body: "The download files carry schema.org Dataset markup and a version stamp, so answer engines and QA systems can cite the exact limit and reconstruct the snapshot."
  cta_label: "Open the catalog"
  cta_href: "/static/data/catalog.json"
---

# Data and downloads

The published HMTc standards are available as machine-readable, versioned files. This page describes what they contain, how they are versioned, and how to cite them. The machine index for the surface is [`/static/data/catalog.json`](/static/data/catalog.json), a schema.org `DataCatalog` document listing every distribution, its byte size, and its version stamp.

## The dataset

### Published standards, `standards.json` / `standards.csv`

One record per published standard, a live standard page under `/standards/`. For each standard the file reports, per variant and per analyte: the published limit in ppb on the row's native basis, the control basis, the controlling jurisdiction and the specific government instrument that sets it, and, for government-limit cells, the full per-country table of the sovereign limits the value was selected from.

- [`/static/data/standards.json`](/static/data/standards.json): nested, one object per standard, keyed by variant then analyte.
- [`/static/data/standards.csv`](/static/data/standards.csv): tidy/long, one row per standard × variant × analyte.

Per-analyte field schema (JSON):

| Field | Meaning |
|-------|---------|
| `status` | `published` (a firm limit applies), `not_material` (a controlled screen, no numeric limit), or `in_development` |
| `value_ppb` | the published limit in ppb, on the row's `native_basis`; `null` for non-numeric states |
| `native_basis` | the basis the limit is stated on: `as_sold`, `as_consumed`, etc. |
| `control_basis` | `government-limit` (the Method v2.0 default), `government-read-across` (nearest government value where none regulates the exact analyte), `controlled-screen`, or `regulatory-alignment` |
| `controlling_jurisdiction` | the jurisdiction whose limit binds |
| `controlling_instrument` | the identifier of the specific government instrument |
| `per_country` | for government-limit cells, the sovereign limits considered, keyed by jurisdiction |

The CSV carries the scalar fields; the nested `per_country` provenance is in the JSON only.

## How limits are set

Every limit defaults to the strictest applicable government maximum level any credible regulator sets for the product, converted to the row's native basis (Method v2.0, a lookup: not a novel computation). Where no government regulates the exact analyte for a product, the nearest government value is read across and disclosed as such. Occurrence data tightens a limit only for the Tier-1 toxics and for cells no government regulates. The full method is on the [program structure](/program/structure) page.

## Evidence base (one-way)

These files publish the certification standards. The measured heavy-metal occurrence evidence the standards are checked against is reported independently by the Heavy Metal Index and cited one way: every record carries an `hmi_literature_link` to the corresponding literature page, and the Index's own machine-readable occurrence data is published at [heavymetalindex.com/data](https://heavymetalindex.com/data). The Index does not publish HMTc limits; the certifier does not restate the literature. Keeping the evidence and the standard on separate surfaces is what lets each stand on its own.

## Versioning and reconstructibility

Every file carries a version stamp in its envelope: `generated_at` (an ISO timestamp), `generated_commit` (the git commit the build ran from), `standard_version`, and `methodology_version`. `catalog.json` expresses a dataset `version` of the form `YYYY-MM-DD+<commit>`. Because every value is generated deterministically from the compiled standard records and traces to the government instrument that sets it, a snapshot cited by its commit can be reconstructed exactly. A build-time check fails the build if any exported limit does not match the value shown on its standard page.

## License and citation

The published standards are free to read and cite with attribution. The derivation methodology and this compiled dataset are the work of Paleo Certified, Inc., operating as the Institute of Contaminant Standards. Cite the standard's page and version:

> Heavy Metal Tested & Certified, [standard name], heavymetalcertified.com/standards/[slug], version [standard_version], retrieved [date].

Licensing and reuse questions: karen@paleofoundation.com.
