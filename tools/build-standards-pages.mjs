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
import { loadOccurrenceEvidence, loadToxAnchors, descriptorFromCatalogAnalyte, occurrenceRationaleSection } from "./lib/occurrence-section.mjs"

const repoRoot = process.cwd()
const CATALOG = path.join(repoRoot, "data/standards/hmtc_standards_catalog.json")
const OUT_DIR = path.join(repoRoot, "content/standards")

const catalog = JSON.parse(fs.readFileSync(CATALOG, "utf8"))
const OCC = loadOccurrenceEvidence(path.join(repoRoot, "data/standards"))
const TOX = loadToxAnchors(path.join(repoRoot, "data/standards"))
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
// Canonical analyte tiering (matches /program/structure): Tier 1 metals carry no
// safe threshold / bioaccumulate → no variance; everything else is Tier 2.
const TIER1 = new Set(["Pb", "Cd", "iAs", "MeHg"])
const tierOf = (a) => (TIER1.has(a) ? "Tier 1" : "Tier 2")
// Subcategory clean/dirty classification from variant_type. Under Method v2.0 the
// P97/P45 percentile mechanism runs only on the Tier-1-toxic and no-government-ML
// cells, not on the whole row, so the label reports the classification without
// pinning the row to a single percentile.
function pathwayLabel(vt) {
  const v = String(vt || "").toLowerCase()
  if (v.includes("dirty")) return "Dirty"
  return "Clean"
}
// The v3 section-heading style, reused across the emitted body.
const H2S =
  'style="font-family:Lora,serif;font-weight:400;font-size:30px;line-height:1.2;color:#2b1f1f;border-bottom:1px solid #e8e1db;padding-bottom:10px;margin:0 0 20px"'
const TH =
  "style=\"text-align:left;padding:11px 15px;font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:500;letter-spacing:.1em;text-transform:uppercase\""
const TD = 'style="padding:13px 15px;vertical-align:top;border-bottom:1px solid #f2ece7'

// A catalog row is SUPERSEDED when a hand-authored custom page already exists for its slug
// (frontmatter custom_page: true) — e.g. the government-limit seafood standards, which carry a
// bespoke derivation the catalog template cannot render and whose numbers are current. The catalog
// snapshot may still list the row from an earlier (partial-occurrence) methodology; the custom page
// wins for BOTH the page file and the index listing, so this generator must not overwrite it nor
// re-list a stale copy. The custom-page scan below (which reads firm_analytes from the page itself)
// gives the superseded row its accurate index entry.
const isSupersededByCustom = (slug) => {
  const p = path.join(OUT_DIR, `${slug}.md`)
  if (!fs.existsSync(p)) return false
  const raw = fs.readFileSync(p, "utf8")
  const end = raw.indexOf("\n---", 4)
  return /\bcustom_page:\s*true/.test(end > 0 ? raw.slice(0, end) : raw)
}

// ---- per-row standards pages ----------------------------------------------
let rowsWithFirm = 0
let firmCells = 0
for (const row of catalog.rows) {
  if (isSupersededByCustom(row.product_slug)) continue
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
  const subj = row.subcategory.replace(/"/g, "")
  const fm = [
    "---",
    `title: "${row.subcategory.replace(/"/g, '\\"')} — HMTc Standard"`,
    hasFirm ? "type: standard" : "type: standard-in-development",
    `description: "The HMTc standard for ${subj} (${row.vertical.category_name}), stated in ${basisLabel(row.native_basis)}. Per-analyte limits publish as each analyte clears the five shipping gates; a cell with no firm number yet shows its evidence state honestly."`,
    `category: ${row.vertical.category}`,
    `category_name: "${row.vertical.category_name}"`,
    `product_slug: ${slug}`,
    `native_basis: ${row.native_basis}`,
    `standard_version: "${row.standard_version}"`,
    `methodology_version: "${catalog.methodology_version}"`,
    `variant_type: ${row.variant_type}`,
    `hmi_literature_link: ${row.hmi_literature_link}`,
    `effective_date: ${today}`,
    // Normative certification specification; never a scholarly work (2026-08-17).
    "scholar_eligible: false",
    "audience: [regulator, brand-legal, retailer-compliance, certifier]",
    "snapshot:",
    `  - { k: "Analytes published", v: "${published.length} / ${PANEL.length}" }`,
    `  - { k: "Pathway", v: "${pathwayLabel(row.variant_type)}" }`,
    `  - { k: "Native basis", v: "${basisLabel(row.native_basis)}" }`,
    `  - { k: "Standard version", v: "${row.standard_version}" }`,
    "connections:",
    '  - { label: "How limits are derived", href: "/program/structure" }',
    '  - { label: "Program Manuals", href: "/manuals" }',
    '  - { label: "Verify a certificate", href: "/verify" }',
    `  - { label: "Heavy Metal Index — literature baseline", href: "${row.hmi_literature_link}" }`,
    "---",
    "",
  ].join("\n")

  // Master Limit Table rows. Firm number renders ONLY for published cells (the
  // firewall two-tier rule); in-development and out-of-scope cells stay em-dashed
  // with their honest state note — never an invented number or pooled value.
  const covered = PANEL.filter((a) => analytes[a]?.status === "published")
  const inScopeNotPub = PANEL.filter((a) => analytes[a]?.in_scope && analytes[a]?.status !== "published")
  const outScope = PANEL.filter((a) => analytes[a] && !analytes[a].in_scope)

  const tdMono = `${TD};white-space:nowrap;color:#2b1f1f;font-family:'IBM Plex Mono',monospace"`
  const tdTier = `${TD};color:#736b6b"`
  const tdLimit = `${TD};line-height:1.55;color:#3f3a3a"`
  const tdPool = `${TD};font-family:'IBM Plex Mono',monospace;color:#3f3a3a"`
  const tdRat = `${TD};color:#736b6b"`
  const tdRatDev = `${TD};color:#736b6b;line-height:1.55"`
  const tdStatPub = `${TD};font-family:'IBM Plex Mono',monospace;font-size:12px;color:#9f2727"`
  const tdStatMuted = `${TD};font-family:'IBM Plex Mono',monospace;font-size:12px;color:#a9a1a1"`
  const rowsHtml = PANEL.map((a, i) => {
    const cell = analytes[a]
    const z = i % 2 === 0 ? ' style="background:#fdfaf8"' : ""
    if (!cell || !cell.in_scope) {
      return `      <tr${z}><td ${tdMono}>${a}</td><td ${tdTier}>${tierOf(a)}</td><td ${tdLimit}>&mdash;</td><td ${tdPool}>&mdash;</td><td ${tdRat}>&mdash;</td><td ${tdStatMuted}>not in scope</td></tr>`
    }
    if (cell.status === "published") {
      const cross =
        cell.cross_basis_ppb != null
          ? `<span style="color:#a9a1a1"> &middot; ${round(cell.cross_basis_ppb)} ${basisLabel(cell.cross_basis_label)}</span>`
          : ""
      const rat =
        esc(cell.rationale_tag) +
        (cell.regulatory_cap_source
          ? `<br><span style="font-family:'IBM Plex Mono',monospace;font-size:11.5px;color:#a9a1a1">${esc(cell.regulatory_cap_source)}</span>`
          : "")
      const pooled = cell.precise_ppb != null ? round(cell.precise_ppb) : "&mdash;"
      return `      <tr${z}><td ${tdMono}>${a}</td><td ${tdTier}>${tierOf(a)}</td><td ${tdLimit}><span data-firm-ppb style="font-family:'IBM Plex Mono',monospace;font-weight:500;color:#2b1f1f">${cell.published_limit_ppb}</span>${cross}</td><td ${tdPool}>${pooled}</td><td ${tdRat}>${rat}</td><td ${tdStatPub}>published</td></tr>`
    }
    const note = cell.evidence_state_note ? esc(shortNote(cell.evidence_state_note)) : "evidence under review"
    return `      <tr${z}><td ${tdMono}>${a}</td><td ${tdTier}>${tierOf(a)}</td><td ${tdLimit}>&mdash;</td><td ${tdPool}>&mdash;</td><td ${tdRatDev}>${note}</td><td ${tdStatMuted}>in development</td></tr>`
  }).join("\n")

  const scopeRow = (label, val) =>
    `    <div style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:16px;align-items:baseline;padding:10px 0;border-bottom:1px dotted #f2ece7"><span style="font-size:13px;line-height:1.5;color:#3f3a3a">${label}</span><span style="font-family:'IBM Plex Mono',monospace;font-size:12.5px;color:#9f2727;text-align:right">${val}</span></div>`

  const devNote = !hasFirm
    ? `  <div style="border-left:3px solid #9f2727;background:#fdf4f3;padding:18px 22px;margin-top:16px"><p style="font-size:15.5px;line-height:1.75;color:#5a4141;margin:0">No analyte in this subcategory has cleared all five shipping gates yet, so no firm limit is in force. This page reports the current evidence state honestly; it is not yet a published standard. See <a href="/program/structure" style="color:#1c43ad">Program structure</a> for how a subcategory reaches publication.</p></div>`
    : ""

  const occSection = occurrenceRationaleSection({
    evidence: OCC, toxAnchors: TOX, rowSlug: slug,
    analytes: PANEL.map((a) => descriptorFromCatalogAnalyte(analytes[a], a)),
  })

  const body = `<section id="audiences" style="margin-bottom:52px">
  <h2 ${H2S}>Who this standard is for</h2>
  <p style="font-size:13.5px;line-height:1.7;color:#736b6b;margin:0 0 20px;max-width:84ch">Four audiences read this page differently. Each has a route through it.</p>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(17rem,1fr));gap:1px;background:#e8e1db;border:1px solid #e8e1db">
    <div style="background:#fffdfb;padding:18px 19px"><div style="font-family:Lora,serif;font-size:18px;line-height:1.3;color:#2b1f1f;margin-bottom:8px">Brand regulatory affairs and QA</div><p style="font-size:14px;line-height:1.7;color:#3f3a3a;margin:0">Read the Master Limit Table and the derivation. Every numeric claim traces to a source page on the independent literature index.</p></div>
    <div style="background:#fffdfb;padding:18px 19px"><div style="font-family:Lora,serif;font-size:18px;line-height:1.3;color:#2b1f1f;margin-bottom:8px">Retailer quality and compliance</div><p style="font-size:14px;line-height:1.7;color:#3f3a3a;margin:0">Read the Master Limit Table. The mark on a product means the brand tested at or below every value in it, in the product&rsquo;s native basis.</p></div>
    <div style="background:#fffdfb;padding:18px 19px"><div style="font-family:Lora,serif;font-size:18px;line-height:1.3;color:#2b1f1f;margin-bottom:8px">Regulators &mdash; FDA, EFSA, state AGs</div><p style="font-size:14px;line-height:1.7;color:#3f3a3a;margin:0">Read the HMTc-limit column and the rationale tag. Each limit is set to the strictest applicable government maximum by lookup, in the native basis; for the Tier-1 toxics (Pb, Cd, iAs, MeHg) and for cells no government regulates, the program&rsquo;s pooled occurrence distribution sets or tightens the value, never above the government maximum.</p></div>
    <div style="background:#fffdfb;padding:18px 19px"><div style="font-family:Lora,serif;font-size:18px;line-height:1.3;color:#2b1f1f;margin-bottom:8px">Adversarial readers &mdash; plaintiff&rsquo;s experts, competing bodies</div><p style="font-size:14px;line-height:1.7;color:#3f3a3a;margin:0">Read the rationale column and the firm/in-development split. Every published value carries its pooled figure, its native basis, and the reason for any gap with the pool.</p></div>
  </div>
</section>

<section id="limits" style="margin-bottom:52px">
  <h2 ${H2S}>Master Limit Table</h2>
  <p style="font-size:11.5px;line-height:1.55;color:#a9a1a1;max-width:84ch;margin:0 0 14px">All values in ppb, ${basisLabel(row.native_basis)}. A firm limit renders only for an analyte that has cleared all five shipping gates; every other analyte shows its honest evidence state and no number. The pooled column shows the program&rsquo;s occurrence figure for the analyte; the HMTc limit is the stricter of the applicable government maximum and &mdash; for Tier-1 toxics and cells no government regulates &mdash; that pooled figure, so the derivation stays re-derivable and the rationale tag names which bound. A brand meeting every firm value on a like-for-like basis qualifies for the mark for this subcategory.</p>
  <div style="overflow-x:auto">
  <table style="width:100%;font-size:13.5px;border:1px solid #e8e1db;min-width:48rem;border-collapse:collapse">
    <thead>
      <tr style="background:#9f2727;color:#fff">
        <th ${TH}>Analyte</th><th ${TH}>Tier</th><th ${TH}>HMTc limit</th><th ${TH}>Pooled</th><th ${TH}>Rationale</th><th ${TH}>Status</th>
      </tr>
    </thead>
    <tbody>
${rowsHtml}
    </tbody>
  </table>
  </div>
  <p style="font-size:11.5px;line-height:1.55;color:#a9a1a1;max-width:84ch;margin:14px 0 0">Published values round to the HMTc primary increment ladder &mdash; 1 &middot; 2 &middot; 3 &middot; 5 &middot; 10 &middot; 15 &middot; 20 &middot; 25 &middot; 50 &middot; 100 &middot; 200 &middot; 500 &middot; 1000 &middot; 1300 &middot; 1500 &middot; 2000 &middot; 5000 &middot; 10000 &mdash; so a brand has an unambiguous bin to test against.</p>
${devNote}
</section>

<section id="scope" style="margin-bottom:52px">
  <h2 ${H2S}>Analyte scope</h2>
  <p style="font-size:16.5px;line-height:1.78;color:#3f3a3a;margin:0 0 18px;max-width:72ch">This disclosure travels with the mark so a certified product is never silently uncontrolled on an analyte. The panel is ${PANEL.join(", ")}.</p>
  <div style="border:1px solid #e8e1db;background:#fffdfb;padding:16px 18px">
${scopeRow("Published (firm limit in force)", covered.length ? covered.join(", ") : "none yet")}
${scopeRow("In scope, in development (no firm limit yet)", inScopeNotPub.length ? inScopeNotPub.join(", ") : "none")}
    <div style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:16px;align-items:baseline;padding:10px 0"><span style="font-size:13px;line-height:1.5;color:#3f3a3a">Out of scope for this subcategory</span><span style="font-family:'IBM Plex Mono',monospace;font-size:12.5px;color:#9f2727;text-align:right">${outScope.length ? outScope.join(", ") : "none"}</span></div>
  </div>
</section>

${occSection}

<section id="cite">
  <h2 ${H2S}>Cite this standard</h2>
  <div style="border:1px solid #e8e1db;background:#fffdfb">
    <div style="padding:11px 15px;border-bottom:1px solid #e8e1db;background:#fdf4f3;font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;color:#9f2727">Reuse this page</div>
    <div style="padding:14px 15px">
      <p style="font-family:'IBM Plex Mono',monospace;font-size:11px;line-height:1.75;color:#5a4141;margin:0 0 14px">Pendergrass, K. &ldquo;${subj}.&rdquo; In Heavy Metal Tested &amp; Certified (HMTc) ${row.vertical.category_name} standard, version ${row.standard_version}. Institute of Contaminant Standards (ICS), 2026.</p>
      <p style="font-size:11.5px;line-height:1.55;color:#a9a1a1;margin:0">The evidence each limit is applied to lives on the independent <a href="${row.hmi_literature_link}" style="color:#1c43ad">Heavy Metal Index</a>; HMTc cites it one way and never the reverse. HMTc standards are living, versioned documents; this page reflects ${row.standard_version} and superseded versions remain at stable URLs so prior citations resolve. The threshold-setting methodology is described in <a href="/program/structure" style="color:#1c43ad">Program structure</a>.</p>
    </div>
  </div>
</section>
`

  fs.writeFileSync(path.join(OUT_DIR, `${slug}.md`), fm + body, "utf8")
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
// A manual's live download is its served `download_pdf` when present (a consolidated
// PDF committed under content/static/manuals/ — used when the web edition has moved
// ahead of the deposited volume); otherwise the copied `pdf`. A manual counts as
// published when either exists, so it never depends solely on the archival deposit.
const STATIC_MANUALS = path.join(repoRoot, "content/static/manuals")
const servedDownload = (m) =>
  m.download_pdf && fs.existsSync(path.join(STATIC_MANUALS, m.download_pdf)) ? `/static/manuals/${m.download_pdf}` : null
const manualLive = (m) =>
  m.status === "published" && (servedDownload(m) || fs.existsSync(path.join(repoRoot, "data/manuals", m.pdf)))
let publishedManuals = []
try {
  const mm = JSON.parse(fs.readFileSync(path.join(repoRoot, "data/manuals/manifest.json"), "utf8"))
  publishedManuals = (mm.manuals || []).filter(manualLive)
} catch {
  publishedManuals = []
}
const publishedCategories = Object.values(ledger).filter((e) => (e.subcategories_published || 0) > 0).length

// Bound-editions list (or empty state).
const editionRows = publishedManuals.length
  ? publishedManuals
      .map((m) => {
        const meta = `${m.edition} Edition &middot; ${m.subcategories || "—"} subcategor${m.subcategories === 1 ? "y" : "ies"} &middot; ${m.pages ? m.pages + " pp" : "—"}`
        // Title links to the landing page for a custom_landing manual; the button is the
        // live download. When a served download_pdf exists the button downloads it (so the
        // card offers Download-PDF IN ADDITION to the title's page link); otherwise fall
        // back to "Read the standard" (custom_landing) or the copied pdf.
        const dl = servedDownload(m)
        const btnStyle = `font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.08em;text-transform:uppercase;color:#9f2727;border:1px solid #f2dcda;background:#fdf4f3;border-radius:2px;padding:5px 10px;text-decoration:none;white-space:nowrap`
        const button = dl
          ? `<a href="${dl}" download="download" style="${btnStyle}">Download PDF</a>`
          : m.custom_landing
            ? `<a href="/manuals/${m.slug}" style="${btnStyle}">Read the standard</a>`
            : `<a href="/static/manuals/${m.pdf}" download="download" style="${btnStyle}">Download PDF</a>`
        return `    <div style="display:flex;align-items:baseline;justify-content:space-between;gap:18px;flex-wrap:wrap;padding:14px 18px;border-bottom:1px solid #f2ece7">
      <div style="min-width:0"><div style="font-size:14.5px;line-height:1.45;color:#2b1f1f">${m.custom_landing ? `<a href="/manuals/${m.slug}" style="color:#2b1f1f;text-decoration:none">${m.title}</a>` : m.title}</div><div style="font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:#a9a1a1;margin-top:4px">${meta}</div></div>
      ${button}
    </div>`
      })
      .join("\n")
  : `    <div style="padding:16px 18px"><div style="font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:#a9a1a1;margin-bottom:6px">No bound edition published yet</div><p style="font-size:13px;line-height:1.65;color:#a9a1a1;margin:0">The subcategory standards below are in force and readable per page; the first bound category volume publishes once its every value is defensibly current.</p></div>`

// Subcategory groups: every locked row, grouped by real category, each linked.
const byCat = {}
for (const row of catalog.rows) {
  if (isSupersededByCustom(row.product_slug)) continue // custom page re-lists it below with current data
  ;(byCat[row.vertical.category] ??= { name: row.vertical.category_name, rows: [] }).rows.push(row)
}

// Hand-authored custom standard pages (frontmatter `custom_page: true`) are NOT
// generated from the catalog — they carry a bespoke derivation (e.g. the
// government-limit infant-formula standard) that the catalog template cannot
// render. This scan gives them a permanent home in the index without the
// generator ever writing over them; they are listed alongside catalog rows.
for (const f of fs.readdirSync(OUT_DIR)) {
  if (!f.endsWith(".md") || f === "index.md") continue
  const raw = fs.readFileSync(path.join(OUT_DIR, f), "utf8")
  const end = raw.indexOf("\n---", 4)
  const fm = end > 0 ? raw.slice(0, end) : ""
  if (!/\bcustom_page:\s*true/.test(fm)) continue
  const get = (k) => (fm.match(new RegExp(`^${k}:\\s*"?([^"\\n]+)"?`, "m")) || [])[1] || ""
  const cat = get("category") || "0"
  const slug = get("product_slug") || f.replace(/\.md$/, "")
  const group = (byCat[cat] ??= { name: get("category_name") || "Other", rows: [] })
  if (group.rows.some((r) => r.product_slug === slug)) continue
  const firm = Number(get("firm_analytes")) || 0
  group.rows.push({
    vertical: { category: cat, category_name: group.name },
    subcategory: get("subcategory") || get("title").replace(/ &mdash;.*| — HMTc.*/, ""),
    product_slug: slug,
    native_basis: get("native_basis") || "as_sold",
    analytes: Object.fromEntries(Array.from({ length: firm }, (_, i) => [i, { status: "published" }])),
  })
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
  `description: "A category-wide limit is the wrong instrument. Rice-based cereal and non-rice cereal do not carry the same arsenic risk; soy formula and cow-milk formula do not carry the same cadmium risk. Each subcategory gets its own limit and its own page. A limit defaults to the strictest applicable government maximum; occurrence tightens it only for the Tier-1 toxics and the cells no government regulates."`,
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
