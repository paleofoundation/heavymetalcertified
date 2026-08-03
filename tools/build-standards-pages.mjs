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

// ---- Standards register (ported v3 design: inline-HTML sections) -----------
// Two sections: "The bound editions" (the published Program Manuals) and
// "Subcategory standards" (every locked row, grouped by its real category and
// linked to its page). The design mock is infant-formula-centric (25 aspirational
// rows, 5 bound editions); this emits the design LAYOUT with repo TRUTH — the
// catalog's locked rows and the manuals manifest's published set.
const ledger = catalog.completeness_ledger || {}
const H2 =
  'style="font-family:Lora,serif;font-weight:400;font-size:30px;line-height:1.2;color:#2b1f1f;border-bottom:1px solid #e8e1db;padding-bottom:10px;margin:0 0 20px"'

// Published manuals from the manifest (bound editions). Only status:published.
let publishedManuals = []
try {
  const mm = JSON.parse(fs.readFileSync(path.join(repoRoot, "data/manuals/manifest.json"), "utf8"))
  publishedManuals = (mm.manuals || []).filter(
    (m) => m.status === "published" && fs.existsSync(path.join(repoRoot, "data/manuals", m.pdf)),
  )
} catch {
  publishedManuals = []
}
const publishedCategories = Object.values(ledger).filter((e) => (e.subcategories_published || 0) > 0).length

// Bound-editions list (or empty state).
const editionRows = publishedManuals.length
  ? publishedManuals
      .map((m) => {
        const meta = `${m.edition} Edition &middot; ${m.subcategories || "—"} subcategor${m.subcategories === 1 ? "y" : "ies"} &middot; ${m.pages ? m.pages + " pp" : "—"}`
        return `    <div style="display:flex;align-items:baseline;justify-content:space-between;gap:18px;flex-wrap:wrap;padding:14px 18px;border-bottom:1px solid #f2ece7">
      <div style="min-width:0"><div style="font-size:14.5px;line-height:1.45;color:#2b1f1f">${m.title}</div><div style="font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:#a9a1a1;margin-top:4px">${meta}</div></div>
      <a href="/static/manuals/${m.pdf}" download="download" style="font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.08em;text-transform:uppercase;color:#9f2727;border:1px solid #f2dcda;background:#fdf4f3;border-radius:2px;padding:5px 10px;text-decoration:none;white-space:nowrap">Download PDF</a>
    </div>`
      })
      .join("\n")
  : `    <div style="padding:16px 18px"><div style="font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:#a9a1a1;margin-bottom:6px">No bound edition published yet</div><p style="font-size:13px;line-height:1.65;color:#a9a1a1;margin:0">The subcategory standards below are in force and readable per page; the first bound category volume publishes once its every value is defensibly current.</p></div>`

// Subcategory groups: every locked row, grouped by real category, each linked.
const byCat = {}
for (const row of catalog.rows) {
  ;(byCat[row.vertical.category] ??= { name: row.vertical.category_name, rows: [] }).rows.push(row)
}
const catGroups = Object.keys(byCat)
  .sort((a, b) => Number(a) - Number(b))
  .map((cat) => {
    const g = byCat[cat]
    const basis = basisLabel(g.rows[0]?.native_basis)
    const rowsHtml = g.rows
      .map((row, i) => {
        const pub = Object.values(row.analytes || {}).filter((a) => a.status === "published").length
        const ident = `${g.name} 3.${i + 1}`
        const right = `<span style="font-family:'IBM Plex Mono',monospace;font-size:10.5px;color:#b7aeae;text-align:right;flex:0 0 auto;max-width:14rem">${ident}${pub > 0 ? ` &middot; ${pub} firm` : ""}</span>`
        return `      <a href="/standards/${row.product_slug}" style="display:flex;align-items:baseline;justify-content:space-between;gap:12px;padding:6px 0;font-size:13.5px;color:#1c43ad;border-bottom:1px dotted #f2ece7;text-decoration:none"><span>${row.subcategory}</span>${right}</a>`
      })
      .join("\n")
    return `  <div style="margin-bottom:26px">
    <div style="display:flex;align-items:baseline;justify-content:space-between;gap:12px;padding-bottom:9px;border-bottom:1px solid #e8e1db;margin-bottom:11px">
      <span style="font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:#9f2727">${g.name}</span>
      <span style="font-family:'IBM Plex Mono',monospace;font-size:10.5px;color:#b7aeae">${basis}</span>
    </div>
    <div style="display:flex;flex-direction:column">
${rowsHtml}
    </div>
  </div>`
  })
  .join("\n")

const idxFront = [
  "---",
  'title: "HMTc Standards"',
  "type: standards-index",
  "audience: [regulator, brand-legal, retailer-compliance, certifier]",
  `description: "A category-wide limit is the wrong instrument. Rice-based cereal and non-rice cereal do not carry the same arsenic risk; soy formula and cow-milk formula do not carry the same cadmium risk. Each subcategory gets its own pooled distribution, its own limit, and its own page."`,
  "snapshot:",
  `  - { k: "Subcategory standards", v: "${catalog.rows.length}" }`,
  `  - { k: "Firm analyte limits", v: "${firmCells}" }`,
  `  - { k: "Analytes per row", v: "${PANEL.length}" }`,
  `  - { k: "Published manuals", v: "${publishedManuals.length}" }`,
  "connections:",
  '  - { label: "Standards Briefings", href: "/briefings" }',
  '  - { label: "How limits are derived", href: "/program/structure" }',
  '  - { label: "Program Manuals", href: "/manuals" }',
  '  - { label: "Verify a certificate", href: "/verify" }',
  '  - { label: "Heavy Metal Index — evidence base", href: "https://heavymetalindex.com" }',
  "rail_box:",
  '  title: "Verify a certificate"',
  '  body: "Check a lot number, certificate number or product code against the register. Public and open to regulators."',
  '  cta_label: "Look up a lot"',
  '  cta_href: "/verify"',
  "---",
  "",
].join("\n")

const idxBody = `<section id="edition" style="margin-bottom:52px">
  <h2 ${H2}>The bound editions</h2>
  <p style="font-size:16.5px;line-height:1.78;color:#3f3a3a;margin:0 0 18px;max-width:72ch">The web standards below and the Program Manuals are the same content at two granularities. The pages are per subcategory and always current; each manual is the citable bound edition of one category, carrying the governance policy, the lot testing schedule and the full derivation of every limit it publishes.</p>
  <div style="border:1px solid #e8e1db;background:#fffdfb;margin-bottom:16px">
${editionRows}
  </div>
  <a href="/manuals" style="font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#9f2727;text-decoration:none">All program manuals &rarr;</a>
</section>

<section id="subcats">
  <h2 ${H2}>Subcategory standards</h2>
  <p style="font-size:13.5px;line-height:1.7;color:#736b6b;margin:0 0 20px;max-width:84ch">${catalog.rows.length} locked rows across ${Object.keys(byCat).length} categories. Each publishes in the native basis of its own product form, and each has its own page. Numbering restarts per category, so a citation names both &mdash; <span style="font-family:'IBM Plex Mono',monospace;font-size:12.5px;color:#9f2727">Seafood 3.1</span> and <span style="font-family:'IBM Plex Mono',monospace;font-size:12.5px;color:#9f2727">Culinary Oils and Fats 3.1</span> are different standards.</p>
  <div style="border:1px dotted #e8e1db;background:#faf7f4;padding:15px 18px;margin-bottom:20px">
    <div style="font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:#a9a1a1;margin-bottom:7px">${firmCells} firm analyte limit${firmCells === 1 ? "" : "s"} across ${rowsWithFirm} subcategor${rowsWithFirm === 1 ? "y" : "ies"} so far</div>
    <p style="font-size:13px;line-height:1.65;color:#a9a1a1;margin:0">Every row below is locked and has its own page. An analyte renders a firm limit only once it clears all five shipping gates; a row with no firm cell yet is in force as a page but shows its per-analyte state as in development. The standard widens as the evidence base and governance review clear more cells.</p>
  </div>
${catGroups}
</section>
`

fs.writeFileSync(path.join(OUT_DIR, "index.md"), idxFront + idxBody, "utf8")

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
