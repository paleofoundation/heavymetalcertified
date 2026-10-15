// category-program-manual.mjs — facts for a finished-category Program Manual.
//
// Numbers come from data/standards/cat<N>-compiled and the live cert_doi on
// content/standards/<slug>.md. This module does not invent a ceiling. A species
// cell with no number stays capped at its parent. A not-material cell stays
// not material. Public names drop em dashes (a comma for the category title,
// a colon for a subcategory title).

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..")

export const EDITION = "Manual v1"
export const EDITION_DATE = "2026-10-15"
export const HOUSE_PREFIX = "10.83138"
export const BASE = "https://heavymetalcertified.com"

export const PROPOSED_SLUGS = {
  2: "infant-and-child-personal-care",
  14: "cosmetics-and-personal-care-rinse-off",
  15: "feminine-care",
  16: "dietary-supplements",
  18: "pet-supplements",
  19: "laundry-and-fabric-contact-home-products",
  21: "childrens-toys-arts-and-crafts",
  22: "home-air-and-inhalation-adjacent-products",
  23: "food-contact-consumer-goods-and-kitchenware",
  25: "cannabis-hemp-and-cbd-products",
  27: "legumes-and-pulses",
  28: "nuts-seeds-and-their-butters",
  29: "edible-fungi",
  31: "sweeteners-and-syrups",
  32: "condiments-sauces-and-dressings",
}

const ANALYTE_NAME = {
  Pb: "lead",
  Cd: "cadmium",
  tAs: "total arsenic",
  iAs: "inorganic arsenic",
  tHg: "total mercury",
  MeHg: "methylmercury",
  Ni: "nickel",
  Sn: "tin",
  Al: "aluminium",
  Cr: "total chromium",
  "Cr-VI": "hexavalent chromium",
}

const PARENT_OF = { iAs: "tAs", MeHg: "tHg", "Cr-VI": "Cr" }

const BRIEFINGS = {
  2: { label: "Why the baby-wipes standard adds antimony", href: "/briefings/why-baby-wipes-standard-adds-antimony" },
  15: { label: "The first feminine-care standard", href: "/briefings/first-feminine-care-standard" },
  16: { label: "The child eats the adult's supplement", href: "/briefings/supplements-child-protective" },
}

const WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty", "twenty-one", "twenty-two", "twenty-three", "twenty-four", "twenty-five", "twenty-six", "twenty-seven", "twenty-eight", "twenty-nine", "thirty"]

export function countWord(n) {
  return WORDS[n] || String(n)
}

export function basisLabel(native) {
  const s = String(native || "").trim()
  if (s === "as_consumed" || s === "as consumed") return "as consumed"
  return "as sold"
}

export function publicCategoryName(name) {
  return String(name || "").replace(/\s*[—–]\s*/g, ", ").replace(/\s+/g, " ").trim()
}

export function publicPageName(name) {
  return String(name || "").replace(/\s*[—–]\s*/g, ": ").replace(/\s+/g, " ").trim()
}

export function pdfFileName(publicName) {
  const title = publicName
    .replace(/[()]/g, " ")
    .replace(/&/g, " and ")
    .replace(/['’]/g, "")
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
  return `HMTc-${title}-Program-Manual-v1.pdf`
}

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"))
}

function certDoi(slug) {
  const file = path.join(REPO, "content/standards", `${slug}.md`)
  if (!fs.existsSync(file)) return null
  const m = fs.readFileSync(file, "utf8").match(/^cert_doi:\s*"?(10\.\d{4,9}\/\S+?)"?\s*$/m)
  return m ? m[1] : null
}

function cellsOf(rec, variant) {
  if (rec.variants && typeof rec.variants === "object") {
    return rec.variants[variant] || rec.variants[Object.keys(rec.variants)[0]] || null
  }
  return rec.cells || null
}

function classifyCell(analyte, cell) {
  if (!cell) return { mode: "missing", value: null, parent: null }
  const parent = cell.subsumed_by || cell.bounded_by || PARENT_OF[analyte] || null
  const type = String(cell.type || "")
  if (cell.value == null && /not[_-]?material/.test(type)) return { mode: "not_material", value: null, parent }
  if (cell.value == null) return { mode: "capped", value: null, parent }
  if (typeof cell.value === "number" && Number.isFinite(cell.value)) return { mode: "numeric", value: cell.value, parent }
  return { mode: "other", value: cell.value, parent }
}

function modeOf(modes) {
  const u = [...new Set(modes)]
  if (u.length === 1) return u[0]
  return "mixed"
}

export function loadCategory(category) {
  const n = Number(category)
  const slug = PROPOSED_SLUGS[n]
  if (!slug) return { ok: false, category: n, reason: "not in the finished-category order" }
  const pagesPath = path.join(REPO, "data/standards", `cat${n}-pages.json`)
  const compiledDir = path.join(REPO, "data/standards", `cat${n}-compiled`)
  if (!fs.existsSync(pagesPath) || !fs.existsSync(compiledDir)) {
    return { ok: false, category: n, reason: "pages or compiled directory missing" }
  }
  const doc = readJson(pagesPath)
  const meta = doc._meta
  const readiness = readJson(path.join(REPO, "data/standards/readiness-manifest.json"))
  const cat = (readiness.categories || []).find((c) => c.category === n)
  const records = cat?.records || []
  const notReady = records.filter((r) => !(r.complete && r.registered && r.ready && r.doi && !(r.claim_empty || []).length))
  if (!records.length || notReady.length || records.length !== doc.pages.length) {
    return {
      ok: false,
      category: n,
      slug,
      reason: !records.length
        ? "no readiness records"
        : notReady.length
          ? `no longer 100% complete: ${notReady.map((r) => r.slug).join(", ")}`
          : `readiness count ${records.length} does not match pages ${doc.pages.length}`,
    }
  }

  const panel = meta.panel
  const pages = []
  const problems = []
  for (const page of doc.pages) {
    if (!page.variants || page.variants.length !== 1) {
      problems.push(`${page.slug} does not have exactly one variant`)
      continue
    }
    const variant = page.variants[0]
    const recPath = path.join(compiledDir, `${variant.record}.json`)
    if (!fs.existsSync(recPath)) {
      problems.push(`${variant.record} compiled record missing`)
      continue
    }
    const rec = readJson(recPath)
    const cells = cellsOf(rec, variant.variant)
    if (!cells) {
      problems.push(`${variant.record} has no cells`)
      continue
    }
    const doi = certDoi(page.slug)
    if (!doi || !doi.startsWith(`${HOUSE_PREFIX}/hmtc.std.${n}.`)) {
      problems.push(`${page.slug} missing house DOI`)
    }
    const classified = {}
    for (const analyte of panel) {
      const info = classifyCell(analyte, cells[analyte])
      classified[analyte] = info
      if (info.mode === "missing" || info.mode === "other") problems.push(`${page.slug} ${analyte} is ${info.mode}`)
      if (info.mode === "numeric" && PARENT_OF[analyte]) {
        const parentCell = cells[info.parent]
        const parentValue = parentCell && typeof parentCell.value === "number" ? parentCell.value : null
        if (parentValue == null) problems.push(`${page.slug} ${analyte} has a number but parent ${info.parent} does not`)
        else if (info.value > parentValue) problems.push(`${page.slug} ${analyte} ${info.value} exceeds parent ${info.parent} ${parentValue}`)
      }
    }
    pages.push({
      slug: page.slug,
      name: publicPageName(page.name),
      href: `/standards/${page.slug}`,
      record: variant.record,
      variant: variant.variant,
      cert_doi: doi,
      basis: basisLabel(rec.native_basis),
      cells: classified,
    })
  }
  if (problems.length) {
    return { ok: false, category: n, slug, reason: problems.slice(0, 8).join("; ") }
  }

  const analytes = {}
  for (const analyte of panel) {
    const modes = pages.map((p) => p.cells[analyte].mode)
    const parents = [...new Set(pages.map((p) => p.cells[analyte].parent).filter(Boolean))]
    analytes[analyte] = {
      name: ANALYTE_NAME[analyte] || analyte,
      mode: modeOf(modes),
      parent: parents.length === 1 ? parents[0] : parents[0] || PARENT_OF[analyte] || null,
      parentName: ANALYTE_NAME[parents[0] || PARENT_OF[analyte]] || null,
    }
  }

  const name = publicCategoryName(meta.category_name)
  const pdf = pdfFileName(name)
  return {
    ok: true,
    category: n,
    slug,
    name,
    pdf,
    doiSuffix: `hmtc.manual.${slug}`,
    panel,
    tier1: meta.tier1 || [],
    tier2: meta.tier2 || [],
    compiled_dir: `cat${n}-compiled`,
    pages,
    analytes,
    count: pages.length,
    countWord: countWord(pages.length),
    briefing: BRIEFINGS[n] || null,
  }
}

function speciesSentences(facts) {
  const lines = []
  for (const analyte of facts.panel) {
    if (!PARENT_OF[analyte]) continue
    const info = facts.analytes[analyte]
    if (info.mode === "capped") {
      lines.push(`${cap(info.name)} is capped at ${info.parentName} and tested on the program retest schedule. It does not carry a separate number, and it never replaces the parent.`)
    } else if (info.mode === "not_material") {
      lines.push(`${cap(info.name)} is not material on these standards. The cell is not a number.`)
    } else if (info.mode === "numeric") {
      lines.push(`${cap(info.name)} publishes the number already on the live standard. That number does not replace ${info.parentName}.`)
    } else if (info.mode === "mixed") {
      lines.push(`Where ${info.name} has no separate number, it is capped at ${info.parentName} and tested on the program retest schedule. Where the live standard publishes a number, that number is the ceiling, and it does not replace the parent.`)
    }
  }
  return lines
}

function cap(s) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function matrixNote(facts) {
  const bits = ["All values are ppb (&micro;g/kg), in the row's basis. Click any subcategory for its derivation."]
  const capped = facts.panel.filter((a) => PARENT_OF[a] && (facts.analytes[a].mode === "capped" || facts.analytes[a].mode === "mixed"))
  const nm = facts.panel.filter((a) => facts.analytes[a].mode === "not_material" || facts.analytes[a].mode === "mixed" && false)
  const notMaterial = facts.panel.filter((a) => facts.analytes[a].mode === "not_material")
  if (capped.length) {
    const named = capped.map((a) => {
      const info = facts.analytes[a]
      return `${info.name} at ${info.parentName}`
    })
    bits.push(`A dash is a species capped at its parent total (${named.join(", ")}) and tested on the program retest schedule. It is not an empty cell and not an invented number.`)
  }
  if (notMaterial.length) {
    bits.push(`n/m means not material (${notMaterial.map((a) => facts.analytes[a].name).join(", ")}). It is not a number.`)
  }
  const mixed = facts.panel.filter((a) => facts.analytes[a].mode === "mixed")
  if (mixed.length) {
    bits.push(`A printed number on ${mixed.map((a) => facts.analytes[a].name).join(", ")} is the ceiling on that row.`)
  }
  if (!capped.length && !notMaterial.length) {
    bits.push("Every printed figure is the ceiling on the live standard. Nothing in this matrix is invented.")
  }
  void nm
  return bits.join(" ")
}

export function buildManualConfig(facts) {
  const species = speciesSentences(facts).join(" ")
  const description = `The ${facts.name} Program Manual for Category ${facts.category}: metal-safety limits, lot testing, and the standards register.`
  const connections = [
    ...facts.pages.map((p) => ({ label: p.name, href: p.href })),
    ...(facts.briefing ? [facts.briefing] : []),
    { label: "How limits are derived", href: "/program/structure" },
    { label: "Method v1 to Method v2", href: "/program/method" },
    { label: "All Program Manuals", href: "/manuals" },
    { label: "Heavy Metal Index: literature baseline", href: "https://heavymetalindex.com" },
  ]
  return {
    _meta: {
      _doc: `MANUAL-ONLY config for the Category ${facts.category} (${facts.name}) Program Manual landing page, consumed by tools/build-category-manual.mjs. Deliberately NOT named '*-pages.json' so tools/render-all-standard-pages.mjs does NOT pick it up. The subcategory pages are rendered from data/standards/cat${facts.category}-pages.json. This manual re-presents the SAME numbers already live on those pages. cert_doi stays empty until the house deposit.`,
      category: facts.category,
      category_name: facts.name,
      volume_name: facts.name,
      panel: facts.panel,
      tier1: facts.tier1,
      tier2: facts.tier2,
      compiled_dir: facts.compiled_dir,
      methodology_version: "Method v2.0",
      effective_date: EDITION_DATE,
      default_version: `1.0 (${EDITION_DATE})`,
      manual_slug: facts.slug,
      doi_suffix: facts.doiSuffix,
      edition: EDITION,
      edition_chip: "Manual v1 · Method v2.0",
      pdf_label: "Download PDF · Manual v1",
      page_title: `${facts.name}: HMTc Program Manual`,
      download_pdf: facts.pdf,
      description,
      method_snapshot: "Method v2.0",
      scholar_abstract: `The ${facts.name} Program Manual is the Category ${facts.category} instrument of Heavy Metal Certified. The publisher is the Institute of Contaminant Standards. The house DOI suffix ${facts.doiSuffix} is reserved for deposit and is not yet assigned. The Manual binds the ${facts.countWord} live subcategory standard pages; those pages remain the derivation of each cell. ${species} Certification is metal safety only. It does not certify efficacy, legality, or approval status. A product is certified only when every published limit is met at or below 100 percent. The program certifies only when there is at least 90 percent confidence the brand can remain in the program. All rights reserved.`,
      keywords: [
        facts.name,
        `Category ${facts.category}`,
        EDITION,
        "Heavy Metal Certified",
        "Institute of Contaminant Standards",
        "Lot Testing Schedule",
        facts.doiSuffix,
      ],
      scope_lead_html: `This manual states how Category ${facts.category} ${facts.name} is certified for metal safety. It does not certify efficacy, legality, or approval status. ${species} Every figure in the matrix is read from the live standard record. Nothing in this manual invents a ceiling.`,
      manual_method_note: `The ${facts.countWord} live standards remain the derivation of each cell. A product is certified only at or below 100% of every published ceiling. The v1 PDF carries the program rules and the standards register, including each house DOI.`,
      matrix_note: matrixNote(facts),
      risk_note_html: `<p style="font-size:16.5px;line-height:1.78;color:#3f3a3a;max-width:74ch;margin:0 0 14px">Certification is decided on the product's own tested lot against the published ceiling. The limit is that ceiling on the live standard. Occurrence data do not set it. An individual lot can still exceed a limit.</p><p style="font-size:12.5px;line-height:1.7;color:#a9a1a1;max-width:84ch;margin:0">See <a href="/hard-to-meet" style="color:#1c43ad">the cross-category summary</a>${facts.briefing ? `, and the <a href="${facts.briefing.href}" style="color:#1c43ad">${facts.briefing.label.toLowerCase()}</a>` : ""}.</p>`,
      rail_body: `Manual v1 current (${EDITION_DATE}, Method v2.0). ${cap(facts.countWord)} subcategory standards, each with a house DOI. The v1 PDF is downloadable here. The manual DOI suffix ${facts.doiSuffix} is reserved for deposit. cert_doi on this page stays empty until that deposit.`,
      edition_pdf_line: "The Manual v1 PDF is downloadable from the rail. Its program text and standards register match this page. The live subcategory pages remain the derivation of each cell. The manual DOI is not deposited yet.",
      connections,
    },
    pages: facts.pages.map((p) => ({
      slug: p.slug,
      name: p.name,
      variants: [{ label: "all", variant: p.variant || "both", record: p.record }],
    })),
  }
}

export function partFiles(facts) {
  const species = speciesSentences(facts)
  const speciesBlock = species.map((s) => s).join(" ")
  const namedList = facts.pages.map((p) => p.name).join("; ")
  return {
    "part1-why.md": `# Part 1: Why this manual exists

The Heavy Metal Tested & Certified program for ${facts.name} is governed by five co-equal objectives. None may be sacrificed to advance another. The ruling is the program's governing principles.

Limits do not derive from the Heavy Metal Index. Every published number traces to the live standard record [1].

Certification is metal safety only. It does not certify efficacy, legality, or approval status.

## 1.1 Drive down contamination

The program exists to lower the heavy-metal burden in products that reach people. A mark that does not change what is in the product is not the work.

## 1.2 Protect consumers

Limits, lot testing, and the mark are instruments of consumer protection for one attribute: the metal content of the tested lot. A certificate that cannot be trusted does not protect anyone.

## 1.3 Protect brands who enter

A brand that enters in good faith, tests honestly, and stays inside the published rules is not set up to fail. Certification is offered only when the program has at least 90% confidence the brand can remain in the program.

## 1.4 Remain legally defensible

Published ceilings are the numbers already on the live standard records [1]. ${speciesBlock} Nothing is invented.

## 1.5 Become the de facto standard

The program is written to be the instrument a laboratory, a brand, and a regulator can actually use for metal safety. It is not an approval, an efficacy claim, or a statement that the product is lawful to sell.
`,
    "part2-program.md": `# Part 2: Program lifecycle and instruments

This Part is how a Category ${facts.category} SKU enters, is assigned a status, and is held to the mark. Except where a defined term states otherwise, every requirement is normative. The ${facts.countWord} live standard pages remain the derivation of each cell.

## 2.1 The governing rule

Certification is limit-relative and binary at the limit. For every numeric ceiling the applicable limit is the value published on the live standard (Method v2.0). Limits do not derive from a distribution of measured values. A product is Certified only when every numeric ceiling is met at or below 100% of its published limit, confirmed under the measurement-uncertainty decision rule (section 2.5). There is no band above the limit that still earns the mark.

${speciesBlock}

Certification is metal safety only. It does not certify efficacy, legality, or approval status.

## 2.2 Program flow

1. Baseline (three lots). Every SKU is tested across a minimum of three production lots, on every numeric ceiling and every capped species, before any status is assigned. A single passing lot certifies nothing. The entry decision is taken from the worst-performing lot.
2. Expedited baseline (prior-data credit), optional. Qualifying ISO/IEC 17025 results from the preceding 12 months may credit up to two lots, per analyte actually measured. Not available on the Confidential Remediation Track.
3. Entry. A lot above any published HMTc ceiling is not certified and enters Remediation.
4. Status assignment. The product is assigned Certified or Remediation from the baseline, then maintained through surveillance. Suspension and Revocation follow section 2.4.
5. Schedule assignment. The Lot Testing Schedule is written after application, from the brand laboratory's stated panel, limit of quantification, measurement uncertainty, and capability (Part 4).

## 2.3 The analyte panel

The panel is the panel on the live standards. Every cell that publishes a number is a numeric ceiling. ${speciesBlock} All claim analytes are equal for certification: at or below 100% of a published ceiling, or, for a capped species, at or below its parent total. An exceedance on any metal removes the mark and moves the SKU to Remediation. No metal has a transitional band or an allowed overage.

## 2.4 Certification status framework

Four statuses. Status attaches to the product, not the brand. The mark is permitted only while the product is Certified.

| Status | Meaning | Mark | Condition |
|---|---|---|---|
| Certified | Full compliance | Permitted | Every numeric ceiling at or below 100% of its published limit, and every capped species at or below its parent total, confirmed under section 2.5. |
| Remediation | Not certified, applicant or corrective | Withheld / removed | The product does not meet every published ceiling, or is a new applicant not yet at 100%. This is not a softer certification and not an allowed overage. The SKU is not listed as certified and the mark is not displayed. |
| Suspension | Certification halted, hard stop | Removed | A data-integrity failure, or failure to execute testing, CAPA, or directives. The mark is removed from units and marketing immediately. |
| Revocation | Permanent termination | Removed | Willful misconduct, data fraud, concealment of a known exceedance, or persistent unremediated suspension. Re-entry by full re-application only. |

The Certification Mark shall not be used on any product, packaging, or marketing unless the product is Certified. A product above any published ceiling, at any margin and on any metal, is not Certified and does not display the mark.

Suspension reinstatement does not require a fresh baseline. It requires a completed CAPA with verification of effectiveness, a run of consecutive compliant lots set by the Program Operator, restored data integrity, and formal Operator approval.

## 2.5 Measurement uncertainty

Every result is read with the laboratory's expanded measurement uncertainty at coverage factor k = 2 (95%). Pass only when the result plus the uncertainty is at or below the limit. Fail when the result minus the uncertainty is above the limit. Anything between is borderline and requires confirmatory action before a status issues. A borderline result alone shall not certify. Testing into compliance is prohibited.

## 2.6 CAPA

CAPA windows scale with certification status, not with analyte class. A product in Remediation has a 12-month default to return to Certified. A CAPA closes only after verification of effectiveness and Operator approval.

| Status | Initiate | Full plan | Containment |
|---|---|---|---|
| Remediation | 10 business days | 30 calendar days | as needed |
| Suspension (hard stop) | 2 business days | 10 business days | Immediate (within 48 hours) |

## 2.7 Remediation

The Confidential Remediation Track is a confidential entry-and-support pathway for products not yet at 100% of every published ceiling. It is not a certified status and displays no mark. Concealment of a known exceedance is grounds for revocation. Confidentiality never delays a recall, never overrides a reporting duty, and never withholds evidence from a regulator who asks.

## 2.8 The mark

The mark may be used only on Certified product. Claims of heavy-metal free, no toxic metals, or 100% safe are prohibited. The mark certifies metal safety of the tested lot against the published ceilings, under ongoing surveillance. It does not certify efficacy, legality, or approval status.

## 2.9 Standards ratchet

A published limit tightens only through the Standards Ratchet: a stated trigger, a capped step, and a dated edition. Limits do not loosen because a brand found them inconvenient. The subcategory page, not this manual, is the live derivation of each cell.
`,
    "part4-lot-testing.md": `# Part 4: Lot Testing Schedule

Certification is a standing obligation for as long as the mark appears on a product. The ${facts.countWord} subcategory standards are the live taxonomy.

Every numeric ceiling is tested on the program retest schedule. ${speciesBlock} Product surveillance is not a reason to drop a metal or a capped species.

## 4.1 Product risk tiers

All ${facts.countWord} standards are held to the program retest schedule. The Program Operator does not assign a lighter calendar to any of them.

| Risk class | Standards |
|---|---|
| Program retest schedule | ${namedList} |

The Program Operator may add hold-and-release or third-party sampling on documented rationale. The Operator may not drop an analyte from the scheduled panel.

## 4.2 The Testing-Frequency Matrix

This is the starting grid. The assigned schedule is written after the lab-informed review in section 4.7. Certified is the only status that carries the mark. Remediation carries no mark. All claim analytes are equal for certification. These rows set the testing regime. They do not override the status decisions or deadlines in Part 2.

| Certification status | Testing | Hold and release | Independent sampling |
|---|---|---|---|
| Certified | Program retest schedule | not required | yes, per schedule |
| Remediation | Every lot | mandatory | Operator-directed third-party sampling |

Any exceedance, or any capped species above its parent total, takes the Remediation testing row. There is no transitional overage and no analyte-class exception. A data-integrity failure is Suspension under section 2.4, not a stay on the Remediation row. Concealment of a known exceedance is Revocation under section 2.4.

## 4.3 Baseline

Every SKU shall undergo baseline testing across three production lots before any certification status is assigned. Status is assigned from the worst-performing lot. Each lot runs every numeric ceiling and every capped species.

Qualifying prior ISO/IEC 17025 data from the preceding 12 months may credit up to two lots, per analyte actually measured. This pathway is not available on the Confidential Remediation Track.

## 4.4 Surveillance by status

Certified: the program retest schedule, with independent sampling on the assigned schedule. A numeric result at or above 80% of its published ceiling triggers confirmatory testing and Operator notice.

Remediation: the product carries no mark and is not listed as certified. Corrective action is mandatory. Surveillance is every lot, with mandatory hold-and-release and Operator-directed third-party sampling. Return to Certified requires the product to meet 100% of every published ceiling, and every capped species at or below its parent, across a run of consecutive lots set by the Program Operator, plus completed CAPA with verification of effectiveness.

Suspension: a data-integrity failure, or a failure to execute testing, CAPA, or directives. Stop-ship and mark removal are immediate. CAPA is initiated within 2 business days, with a full plan within 10 business days, and containment Immediate (within 48 hours). Reinstatement does not require a fresh baseline. It requires a completed CAPA with verification of effectiveness, a run of consecutive compliant lots set by the Program Operator, restored data integrity, and formal Operator approval.

Revocation: willful misconduct, data fraud, concealment of a known exceedance, or persistent unremediated suspension. Re-entry is by full re-application only. The testing row does not keep a revoked product in Remediation.

## 4.5 Species

${species.join("\n\n")}

The species result does not replace the parent total. Both must be met where the live standard publishes a parent and a capped species. Failure to test a required species renders the lot ineligible.

## 4.6 Sampling and chain of custody

Certification testing is lot-based composite sampling with a complete custody record from collection through laboratory receipt. A custody breach invalidates the result. Testing is ISO/IEC 17025 for the methods and matrices in scope. The limit of quantification for each numeric ceiling must sit at or below the published limit. Where it does not, a non-detect is indeterminate. Results are reported as structured data, with measurement uncertainty, on the row's basis. PDF-only submissions are not accepted.

## 4.7 Lab-informed schedule

The frequency matrix is not assigned by itself. After application, the Program Operator reads what the brand's laboratory actually states and writes the schedule from that evidence.

| Input | What is read |
|---|---|
| Panel | Does the lab quantify every numeric ceiling and every capped species on this matrix? |
| LOQ | Is each numeric ceiling's limit of quantification at or below the published limit? |
| MU | Is expanded uncertainty reported at k = 2? |
| Capability | Can the lab report every capped species on the program retest schedule? |
| Accreditation | ISO/IEC 17025 for the methods and matrices in scope? |
| Turnaround | Can hold-and-release be met when the Remediation row applies? |

Decision owner: Program Operator.

A brand is not certified against a fantasy grid. If the laboratory cannot support the published panel, the limits of quantification, the uncertainty, or the capped species on the program retest schedule, the SKU stays uncertified until the capability exists.

## 4.8 90% stay-in-program rule

The program certifies only if there is at least 90% confidence the brand can remain in the program. A one-lot pass that will fail the next lot is not a certification. This rule protects brands who enter as much as it protects consumers.

| Input | Read as |
|---|---|
| Baseline lots | three-lot record, worst lot, not the best lot |
| Headroom | distance to the published ceiling, not a knife-edge pass |
| Lab capability | the lab-informed schedule inputs above |
| Species | every capped species on the program retest schedule, as the live standard defines it |
| Schedule feasibility | can the brand actually run the program retest schedule? |
| CAPA capacity | can the brand open and close CAPA on the published windows? |

Decision owner: Program Operator. Pass means at least 90% confidence the brand can remain under the assigned schedule. A knife-edge baseline, a laboratory that cannot support the schedule, or a doubt about data integrity is not a certification.
`,
    "part5-backmatter.md": `# Part 5: Method and glossary

## 5.1 How every limit is set

The method is the ceiling already published on the live standard, not an invented ceiling.

${speciesBlock}

Every figure above is the value already published on the standard record. This manual does not add a ceiling. Occurrence data carry no compliance weight [2]. The instrument for each cell is named on the live standard [1].

Certification is metal safety only. It does not certify efficacy, legality, or approval status.

## 5.2 What this manual does not do

This manual does not reprint the per-analyte ceiling table. The ${facts.countWord} live standard pages are the derivation of each cell, and Part 3 lists them with their house DOIs. A change to a cell is made on the standard, then reflected here at the next edition.

## 5.3 Glossary

percent of limit: A single analyte's measured value divided by its applicable numeric ceiling, as a percentage. Used only as an operational testing trigger (the 80% confirmatory trigger). It is not a certification ladder.

Certification status: The product-level lifecycle: Certified, Remediation, Suspension, Revocation. Certified means every numeric ceiling is at or below 100% of its published limit, and every capped species is at or below its parent total, under the measurement-uncertainty rule. The mark is permitted only then. Remediation is not certified and carries no mark. Suspension halts certification. Revocation is permanent. No band above the limit keeps the mark. All claim analytes are equal for certification.

priority toxics: Plain-language name for lead, cadmium, inorganic arsenic, and mercury, used only for toxicological clarity. It is not a status ladder and does not change certification.

CAPA: Corrective and preventive action. Windows scale with status.

native basis: The form in which the row is read. The matrix states as sold or as consumed for each subcategory. The live standard page is the full basis statement.

metal safety only: The only attribute the mark speaks to. Not efficacy, not legality, and not approval status.

## 5.4 References

[1] Heavy Metal Certified subcategory standards for Category ${facts.category}. Each cell's instrument is named on that page. ${BASE}/standards

[2] Heavy Metal Index, literature baseline. ${BASE.replace("heavymetalcertified.com", "heavymetalindex.com")}. Cited one way, outbound only. The Index does not set these ceilings.
`,
  }
}

export function versionHistory(facts) {
  return {
    product_slug: facts.slug,
    document_noun: "manual",
    current_version: EDITION,
    _note: `Manual v1 (${EDITION_DATE}) is the current ${facts.name} Program Manual for Category ${facts.category}. The house DOI suffix ${facts.doiSuffix} is reserved for deposit. cert_doi stays empty until that deposit. Method edition is at /program/method.`,
    versions: [
      {
        version: EDITION,
        label: EDITION,
        date: EDITION_DATE,
        status: "current",
        doi: null,
        doi_pending: "not yet deposited",
        pdf: `/static/manuals/${facts.pdf}`,
        permalink: `/manuals/${facts.slug}`,
        summary: `First Category ${facts.category} Program Manual. ${cap(facts.countWord)} live standards. Numeric ceilings are the values on those standards. Species with no separate number are capped at the parent total and tested on the program retest schedule. Metal safety only.`,
      },
    ],
  }
}

export function manifestRow(facts, pages = null) {
  return {
    category: facts.category,
    title: facts.name,
    slug: facts.slug,
    edition: EDITION,
    pdf: facts.pdf,
    download_pdf: facts.pdf,
    status: "published",
    doi: null,
    doi_suffix: facts.doiSuffix,
    subcategories: facts.count,
    pages,
    published_date: EDITION_DATE,
    evidence_note: `Manual v1 (${EDITION_DATE}) is the ${facts.name} Program Manual for Category ${facts.category}. ${cap(facts.countWord)} live standards, each already minted under ${HOUSE_PREFIX}/hmtc.std.${facts.category}. Numeric ceilings are the values on those live standards. Species with no separate number are capped at the parent total. Scope is metal safety only. Served PDF is tools/build-category-program-manual-pdf.mjs (react-pdf). The manual DOI is left empty.`,
    custom_landing: true,
    landing_note: `Manual v1 current (${EDITION_DATE}, Method v2.0). House DOI suffix ${facts.doiSuffix} is reserved. cert_doi stays empty until deposit.`,
  }
}

export const PROGRAM_INTEGERS = new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 30, 48, 80, 90, 95, 100, 17025, 2026])

export function editionDateIntegers() {
  return EDITION_DATE.split("-").map(Number)
}
