#!/usr/bin/env node
// build-standards-pages.mjs — render the gated HMTc standards catalog into the
// cert site's Standards cornerstone.
//
// INPUT  : data/standards/hmtc_standards_catalog.json  (the workbench-derived,
//          gated export — produced in the heavy-metal-index repo by
//          tools/standards/build-standards-catalog.mjs and snapshotted here;
//          eventually delivered via the gated standards API).
// OUTPUT : content/standards/index.md                  (completeness ledger + nav)
//          content/standards/<product_slug>.md          (one per locked row)
//
// FIREWALL POSTURE (the whole point):
//   - This is the CERT plane. Percentile-derived values + clean/dirty designations
//     are ALLOWED to render here and ONLY here. They never go on heavymetalindex.com.
//   - A firm published_limit_ppb renders ONLY for an analyte cell with
//     status === "published". Every other cell renders its honest evidence_state_note
//     + the gate that holds it, and NO number (the two-tier firm/in-development model).
//   - Every value renders in its native_basis, with the rationale_tag and (when the
//     cap binds) the regulatory_cap_source. The cross-basis is shown as secondary.
//   - One-way citation OUT to the index literature link; the index never reads back.
//
// HONEST-SURFACE GATE (plan 6.F / S1): today only 3 analyte cells across 2 rows are
// firm. The Standards index therefore leads with the completeness ledger and frames
// itself as "publishing per-subcategory as each becomes defensibly ready," not as a
// finished authority surface. Transparency, not concealment, satisfies the gate.

import fs from "node:fs"
import path from "node:path"

const repoRoot = process.cwd()
const CATALOG = path.join(repoRoot, "data/standards/hmtc_standards_catalog.json")
const OUT_DIR = path.join(repoRoot, "content/standards")

const catalog = JSON.parse(fs.readFileSync(CATALOG, "utf8"))
fs.mkdirSync(OUT_DIR, { recursive: true })

const PANEL = catalog.panel
const today = new Date().toISOString().slice(0, 10)

function fmList(arr) {
  return `[${(arr || []).join(", ")}]`
}
function esc(s) {
  return String(s ?? "").replace(/\|/g, "\\|")
}
function basisLabel(b) {
  return (
    {
      as_sold: "as sold",
      as_consumed: "as consumed",
      prepared_for_feeding: "prepared for feeding",
      dry_as_sold: "dry, as sold",
      reconstituted: "reconstituted",
    }[b] || b
  )
}

// ---- per-row standards pages ----------------------------------------------
let rowsWithFirm = 0
let firmCells = 0
for (const row of catalog.rows) {
  const analytes = row.analytes || {}
  const published = Object.entries(analytes).filter(([, a]) => a.status === "published")
  const hasFirm = published.length > 0
  if (hasFirm) rowsWithFirm += 1
  firmCells += published.length

  const slug = row.product_slug
  const title = `${row.subcategory} — HMTc Standard`

  // Scholar eligibility: a row is a citable technical document ONLY once it
  // publishes at least one firm cell. An all-in-development row is a status
  // page, not a standard — emitting citation_* there would be an overclaim.
  const fm = [
    "---",
    `title: "${row.subcategory.replace(/"/g, '\\"')} — HMTc Standard"`,
    hasFirm ? "type: standard" : "type: standard-in-development",
    `category: ${row.vertical.category}`,
    `category_name: "${row.vertical.category_name}"`,
    `product_slug: ${slug}`,
    `native_basis: ${row.native_basis}`,
    `standard_version: "${row.standard_version}"`,
    `methodology_version: "${catalog.methodology_version}"`,
    `variant_type: ${row.variant_type}`,
    `hmi_literature_link: ${row.hmi_literature_link}`,
    `effective_date: ${today}`,
    hasFirm ? "scholar_eligible: true" : "scholar_eligible: false",
    "audience: [regulator, brand-legal, retailer-compliance, certifier]",
    "---",
    "",
  ].join("\n")

  const body = []
  body.push(`# ${row.subcategory}`)
  body.push("")
  body.push(
    `HMTc standard for **${row.subcategory}** (${row.vertical.category_name}, category ${row.vertical.category}). ` +
      `Values are stated in the product's native basis — **${basisLabel(row.native_basis)}** — per the locked methodology. ` +
      `The standard publishes per analyte; an analyte renders a firm limit only when it has cleared all five shipping gates.`,
  )
  body.push("")
  body.push(`- **Standard version:** ${row.standard_version}`)
  body.push(`- **Methodology:** ${catalog.methodology_version}`)
  body.push(`- **Native basis:** ${basisLabel(row.native_basis)}`)
  body.push(`- **Analyte panel:** ${PANEL.join(", ")}`)
  body.push(
    `- **Literature baseline:** [Heavy Metal Index — ${slug}](${row.hmi_literature_link}) ` +
      `(the independent evidence this standard is applied to; one-way citation)`,
  )
  body.push("")

  // analyte table
  body.push("## Per-analyte standard")
  body.push("")
  body.push("| Analyte | In scope | Limit (native basis) | Basis | Rationale | Status |")
  body.push("|---|---|---|---|---|---|")
  for (const a of PANEL) {
    const cell = analytes[a]
    if (!cell || !cell.in_scope) {
      body.push(`| ${a} | — | — | — | — | not in scope |`)
      continue
    }
    if (cell.status === "published") {
      const limit = `${cell.published_limit_ppb} ppb`
      const cross =
        cell.cross_basis_ppb != null
          ? ` (${round(cell.cross_basis_ppb)} ppb ${basisLabel(cell.cross_basis_label)})`
          : ""
      const rationale =
        cell.rationale_tag +
        (cell.regulatory_cap_source ? ` — cap: ${esc(cell.regulatory_cap_source)}` : "")
      body.push(
        `| ${a} | yes | **${limit}**${cross} | ${basisLabel(cell.native_basis)} | ${esc(rationale)} | published |`,
      )
    } else {
      // in development — honest state note, NO firm number
      const note = cell.evidence_state_note ? esc(shortNote(cell.evidence_state_note)) : "evidence under review"
      body.push(`| ${a} | yes | — | ${basisLabel(cell.native_basis)} | ${note} | in development |`)
    }
  }
  body.push("")

  // analyte-scope disclosure (gate 4 — travels with the mark)
  const covered = PANEL.filter((a) => analytes[a]?.status === "published")
  const inScopeNotPub = PANEL.filter(
    (a) => analytes[a]?.in_scope && analytes[a]?.status !== "published",
  )
  const outScope = PANEL.filter((a) => analytes[a] && !analytes[a].in_scope)
  body.push("## Analyte scope")
  body.push("")
  body.push(
    `This disclosure travels with the mark so a certified product is never silently uncontrolled on an analyte.`,
  )
  body.push("")
  body.push(`- **Published (firm limit in force):** ${covered.length ? covered.join(", ") : "none yet"}`)
  body.push(
    `- **In scope, in development (no firm limit yet):** ${inScopeNotPub.length ? inScopeNotPub.join(", ") : "none"}`,
  )
  body.push(`- **Out of scope for this subcategory:** ${outScope.length ? outScope.join(", ") : "none"}`)
  body.push("")

  if (!hasFirm) {
    body.push("> **Status: in development.** No analyte in this subcategory has cleared all five shipping gates yet. This page reports the current evidence state honestly; it is not yet a published standard. See [Program Structure](../program/structure) for how a subcategory reaches publication.")
    body.push("")
  }

  body.push("---")
  body.push("")
  body.push(
    `*HMTc standards are living, versioned documents. This page reflects ${row.standard_version} as of ${today}. ` +
      `Superseded versions remain at stable URLs so prior citations resolve. The threshold-setting methodology is described in [Program Structure](../program/structure).*`,
  )
  body.push("")

  fs.writeFileSync(path.join(OUT_DIR, `${slug}.md`), fm + body.join("\n"), "utf8")
}

// ---- Standards index (completeness ledger) --------------------------------
const ledger = catalog.completeness_ledger || {}
const idx = []
idx.push("---")
idx.push('title: "HMTc Standards"')
idx.push("type: standards-index")
idx.push("audience: [regulator, brand-legal, retailer-compliance, certifier]")
idx.push("---")
idx.push("")
idx.push("# HMTc Standards")
idx.push("")
idx.push(
  "The Heavy Metal Tested & Certified (HMTc) standard is published **per subcategory**, in each product form's native basis, the moment that subcategory is defensibly ready. Each analyte limit is held behind five shipping gates; an analyte renders a firm value only when it clears all five. This page is the live completeness ledger.",
)
idx.push("")
idx.push(`- **Methodology:** ${catalog.methodology_version}`)
idx.push(`- **Standard version:** ${catalog.standard_version}`)
idx.push(`- **Analyte panel (10):** ${PANEL.join(", ")}`)
idx.push(
  `- **Published today:** ${firmCells} firm analyte limit${firmCells === 1 ? "" : "s"} across ${rowsWithFirm} subcategor${rowsWithFirm === 1 ? "y" : "ies"} of ${catalog.rows.length} locked. The standard widens as the evidence base and governance review clear more cells.`,
)
idx.push("")
idx.push("## Completeness by category")
idx.push("")
idx.push("| Category | Subcategories locked | Published | Progress |")
idx.push("|---|---|---|---|")
for (const k of Object.keys(ledger).sort((a, b) => Number(a) - Number(b))) {
  const e = ledger[k]
  idx.push(
    `| ${esc(e.category_name)} (cat ${e.category}) | ${e.subcategories_locked}/${e.subcategories_total} | ${e.subcategories_published} | ${esc(e.context)} |`,
  )
}
idx.push("")
idx.push("## Subcategory standards")
idx.push("")
// group rows by category
const byCat = {}
for (const row of catalog.rows) {
  ;(byCat[row.vertical.category] ??= { name: row.vertical.category_name, rows: [] }).rows.push(row)
}
for (const cat of Object.keys(byCat).sort((a, b) => Number(a) - Number(b))) {
  idx.push(`### ${byCat[cat].name}`)
  idx.push("")
  for (const row of byCat[cat].rows) {
    const pub = Object.values(row.analytes || {}).filter((a) => a.status === "published").length
    const tag = pub > 0 ? `**${pub} published**` : "in development"
    idx.push(`- [${row.subcategory}](${row.product_slug}) — ${tag}`)
  }
  idx.push("")
}
idx.push("---")
idx.push("")
idx.push(
  "*The threshold-selection methodology (clean P97 / dirty P45, native-basis pooling, the regulatory cap, the five gates) is documented in [Program Structure](../program/structure). The evidence each standard is applied to lives on the independent [Heavy Metal Index](https://heavymetalindex.com); HMTc cites it one-way and never the reverse.*",
)
idx.push("")

fs.writeFileSync(path.join(OUT_DIR, "index.md"), idx.join("\n"), "utf8")

console.log(
  `build-standards-pages: wrote ${catalog.rows.length} row pages + index; ${firmCells} firm cells across ${rowsWithFirm} rows.`,
)

function round(n) {
  return Math.round(n * 100) / 100
}
function shortNote(s) {
  // keep the table cell readable
  return s.length > 90 ? s.slice(0, 88) + "…" : s
}
