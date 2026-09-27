#!/usr/bin/env node
// build-standard-pdf.mjs — render each HMTc certification STANDARD to the scholarly
// "Content Page PDF v2" design (tools/pdf/scholarly-pdf.mjs), at
// content/static/standards/<slug>.pdf.
//
// COMMITTED static artifacts, exactly like the briefing/manual PDFs: generated
// locally (needs @react-pdf/renderer, which Vercel does NOT have), committed, and
// served. wire-standard-pdf-links.mjs turns the Rail Download button + citation
// meta on for any standard page whose PDF exists. This driver reads the FROZEN
// compiled record (data/standards/<cat>-compiled/<slug>.json — every number already
// traces to a named register row) plus the rendered page's frontmatter, and emits a
// clean-markdown source for the scholarly renderer. No number is authored here.
//
// Usage: node tools/build-standard-pdf.mjs <slug> [<slug> ...]
//        node tools/build-standard-pdf.mjs --all
import fs from "node:fs"
import path from "node:path"
import { renderScholarlyPdf } from "./pdf/scholarly-pdf.mjs"
import {
  SPECIES, isTotalsOnlySlug, isFirmClaimCell, speciesParentViolations,
} from "./lib/claim-surface.mjs"
import { loadPageJoins } from "./lib/page-record-join.mjs"

const REPO = process.cwd()
const OUT = path.join(REPO, "content/static/standards")
const CONTENT = path.join(REPO, "content/standards")
const DATA = path.join(REPO, "data/standards")
const JOINS = loadPageJoins(DATA)

const ANALYTES = [
  ["Pb", "Lead (Pb)"], ["Cd", "Cadmium (Cd)"], ["tAs", "Total arsenic (tAs)"],
  ["iAs", "Inorganic arsenic (iAs)"], ["tHg", "Mercury, total (tHg)"],
  ["MeHg", "Methylmercury (MeHg)"], ["Ni", "Nickel (Ni)"], ["Sn", "Tin (Sn)"],
  ["Al", "Aluminium (Al)"], ["Cr", "Total chromium (Cr)"], ["Cr-VI", "Hexavalent chromium (Cr-VI)"],
]
const EXTRA_LABELS = { Sb: "Antimony (Sb)" }
const JUR = { EU: "European Union", UK: "United Kingdom", CODEX: "Codex Alimentarius", US: "US FDA", CA: "Canada", "AU-NZ": "Australia / New Zealand", CN: "China", IN: "India", BR: "Brazil", GSO: "Gulf (GSO)", KR: "South Korea", MX: "Mexico", TR: "Türkiye", PY: "Paraguay", MERCOSUR: "Mercosur", IL: "Israel", TH: "Thailand", VN: "Vietnam", PH: "Philippines", SG: "Singapore", CL: "Chile", CO: "Colombia", PA: "Panama", HK: "Hong Kong", MA: "Morocco", international: "Codex / international" }
const jl = (j) => JUR[j] || j || ""
const fmtNum = (v) => (typeof v === "number" && Number.isFinite(v) ? v.toLocaleString("en-US") : String(v))

function readFm(md) {
  const m = md.match(/^---\n([\s\S]*?)\n---/)
  const fm = {}
  if (m) for (const line of m[1].split("\n")) { const mm = line.match(/^([A-Za-z_]+):\s*(.*)$/); if (mm) fm[mm[1]] = mm[2].replace(/^["']|["']$/g, "").trim() }
  return fm
}
function findRecord(slug) {
  for (const d of fs.readdirSync(DATA)) {
    if (!/-compiled$/.test(d)) continue
    const p = path.join(DATA, d, `${slug}.json`)
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, "utf8"))
  }
  return null
}
function cellsOf(rec) {
  if (rec.variants && typeof rec.variants === "object" && !rec.cells) return Object.assign({}, ...Object.values(rec.variants))
  return rec.cells || {}
}
// limitOverride (optional): a precomputed HMTc-limit column string, used for an aggregate page
// whose grouped variants disagree on this analyte (e.g. "5 cow / 10 soy"). When given it replaces
// only the value column; the basis text still comes from the primary variant's cell.
function publishedValue(c) {
  if (!c) return null
  if (c.value != null) return c.value
  if (c.strictest_form_value != null) return c.strictest_form_value
  const vals = (c.forms || []).map((f) => f && f.value).filter((v) => v != null)
  return vals.length ? Math.min(...vals) : null
}
function cellKindOf(c) {
  return String((c && (c.type || c.cell_kind)) || "").toLowerCase()
}
function disclosedBasis(c) {
  return c && c.binding_short ? String(c.binding_short).replace(/\|/g, "/") : ""
}
function cellRow([k, label], c, limitOverride) {
  if (!c) return `| ${label} | ${limitOverride ?? "—"} | not compiled |`
  const t = cellKindOf(c)
  const published = publishedValue(c)
  if (published != null) {
    const basis = disclosedBasis(c) || (t === "read_across" ? `human-grade read-across (${jl(c.source_jurisdiction)})` : t === "gov" ? "government maximum level" : t === "form_split" ? "strictest government ML, set by product form" : t === "screen" ? `screening ceiling (${jl(c.binding_jurisdiction || c.source_jurisdiction)})` : "sovereign maximum level")
    return `| ${label} | ${limitOverride ?? fmtNum(published)} | ${basis} |`
  }
  if (limitOverride) return `| ${label} | ${limitOverride} | bounded by parent / per-variant (see derivation) |`
  if (t === "subsumed") {
    const n = c.value ?? c.binding_total
    if (n != null) return `| ${label} | ${fmtNum(n)} | bounded by ${c.subsumed_by || c.bounded_by || "parent"} (reflex speciation) |`
    return `| ${label} | ≤ ${c.subsumed_by || c.bounded_by || "parent total"} | bounded by ${c.subsumed_by || c.bounded_by || "parent"} (reflex speciation) |`
  }
  if (t === "control") return `| ${label} | control | measured every lot; no human-food maximum |`
  if (t === "not_material" || t === "not-material") return `| ${label} | n/m | not material in this matrix |`
  return `| ${label} | — | — |`
}
function derivRow([k, label], c) {
  if (!c) return `| ${label} | — | not compiled |`
  const published = publishedValue(c)
  if (published != null) {
    const t = cellKindOf(c)
    const src = disclosedBasis(c) || (t === "read_across" ? `${jl(c.source_jurisdiction)} — ${(c.analog_scope || c.analog_label || "human-food analog")}` : t === "form_split" ? "strictest government ML, set by product form" : "government maximum level")
    return `| ${label} | ${fmtNum(published)} | ${src} |`
  }
  if (c.type === "subsumed") {
    const n = c.value ?? c.binding_total
    const shown = n != null ? fmtNum(n) : `≤ ${c.subsumed_by || c.bounded_by}`
    return `| ${label} | ${shown} | ${(c.label || c.rationale || "bounded by parent total").replace(/\|/g, "/")} |`
  }
  if (c.type === "control") return `| ${label} | control | ${(c.control || c.rationale || "mandatory surveillance control").replace(/\|/g, "/")} |`
  if (c.type === "not_material") return `| ${label} | n/m | ${(c.control || c.rationale || "not material").replace(/\|/g, "/")} |`
  return `| ${label} | — | — |`
}
function references(cells) {
  const seen = new Map()
  for (const [k] of ANALYTES) {
    const c = cells[k]
    if (c && c.type === "read_across" && c.source_jurisdiction) {
      if (!seen.has(c.source_jurisdiction)) seen.set(c.source_jurisdiction, [])
      seen.get(c.source_jurisdiction).push(k)
    }
  }
  let n = 0
  return [...seen.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([j, ks]) => ({ n: ++n, head: `${jl(j)} — human-food maximum levels`, meta: `Binds ${ks.join(", ")}. Strictest applicable human-food sovereign maximum for the nearest analog.`, tag: "Maximum level" }))
}

// Resolve a page slug to its rendered variant(s). Direct path: a compiled record whose slug equals
// the page slug (the common case) — one variant built from its merged cells, unchanged behavior.
// Aggregate path: no such record, but a *-pages.json join groups one or more records onto this page
// (ORDER S-DOI-P0-AGG-1) — one variant per join entry, cells taken from that record's named variant.
function resolveVariants(slug) {
  const direct = findRecord(slug)
  if (direct) return { variants: [{ label: null, cells: cellsOf(direct) }], primary: direct, aggregated: false }
  const join = JOINS.get(slug)
  if (!join) return null
  const variants = join.variants.map((v) => {
    const rec = findRecord(v.record)
    if (!rec) throw new Error(`page "${slug}" joins record "${v.record}" but no compiled record exists`)
    const cells = rec.variants && rec.variants[v.variant] ? rec.variants[v.variant] : cellsOf(rec)
    return { label: v.label, cells, rec }
  })
  return { variants, primary: variants[0].rec, aggregated: true }
}

// For an aggregate page, collapse one analyte across variants into the page's display convention:
// null when every variant agrees (caller uses the normal single-value row), else "X label1 / Y label2".
function collapseLimitCell(variants, k) {
  const show = (c) => {
    if (!c) return "—"
    if (publishedValue(c) != null) return fmtNum(publishedValue(c))
    if (c.type === "subsumed") { const n = c.value ?? c.binding_total; return n != null ? fmtNum(n) : `≤ ${c.subsumed_by || c.bounded_by || "parent"}` }
    if (c.type === "control") return "control"
    if (c.type === "not_material") return "n/m"
    return "—"
  }
  const vals = variants.map((v) => show(v.cells[k]))
  if (vals.every((x) => x === vals[0])) return null
  return variants.map((v, i) => `${vals[i]} ${v.label}`).join(" / ")
}

async function build(slug) {
  const resolved = resolveVariants(slug)
  if (!resolved) throw new Error(`no compiled record or page-join for "${slug}"`)
  const { variants, primary: rec, aggregated } = resolved
  const pagePath = path.join(CONTENT, `${slug}.md`)
  const pfm = fs.existsSync(pagePath) ? readFm(fs.readFileSync(pagePath, "utf8")) : {}
  // The derivation table is rendered for the primary variant (matching the page renderer), but the
  // species<=parent physics cap is checked on EVERY joined variant so a rice child cannot smuggle a
  // species ceiling above its parent total onto the aggregate PDF.
  const cells = variants[0].cells
  for (const v of variants) {
    const caps = speciesParentViolations(v.cells)
    if (caps.length) {
      throw new Error(`${slug}${v.label ? ` [${v.label}]` : ""} species>parent ${caps.map((h) => `${h.species}=${h.species_value} > ${h.parent}=${h.parent_value}`).join("; ")}`)
    }
  }
  const claimAnalytes = ANALYTES.filter(([k]) => {
    if (!SPECIES.includes(k)) return true
    if (isTotalsOnlySlug(slug)) return isFirmClaimCell(cells[k])
    return true
  })
  const known = new Set(ANALYTES.map(([k]) => k))
  const extraAnalytes = Object.keys(cells)
    .filter((k) => !known.has(k) && publishedValue(cells[k]) != null)
    .map((k) => [k, EXTRA_LABELS[k] || k])
  const tableAnalytes = claimAnalytes.concat(extraAnalytes)
  const derivAnalytes = ANALYTES.concat(extraAnalytes)
  const title = (pfm.title || `${rec.name || slug}: HMTc Standard`).replace(/\s*[—–\-:]*\s*HMTc Standard.*$/i, "").trim()
  const basisRaw = String(pfm.native_basis || rec.native_basis || "as placed on market").toLowerCase().replace(/[_-]/g, " ")
  const basisLabel = /\bsold\b/.test(basisRaw) ? "as sold" : /\bconsumed\b/.test(basisRaw) ? "as consumed" : (basisRaw || "as placed on market")
  const dek = (pfm.description || `The Heavy Metal Tested & Certified certification standard for ${title}, stated ${basisLabel}. Every analyte is set to the strictest applicable government maximum for the nearest analog; the derivation is disclosed for each cell.`).replace(/&amp;/g, "&")
  const catName = pfm.category_name || rec.category_name || ""
  const version = pfm.standard_version || rec.standard_version || "1.0"
  const eff = pfm.effective_date || rec.effective_date || "2026"
  // The minted DataCite DOI (written back to the page frontmatter by mint-dois) prints on the
  // PDF face — both the scholarly "Cite as" block and the body citation. (S-DOI-OLIVE-DOI-SURFACE-1)
  const certDoi = pfm.cert_doi && String(pfm.cert_doi).toLowerCase() !== "null" ? String(pfm.cert_doi) : null

  const limitRows = tableAnalytes.map((a) => cellRow(a, cells[a[0]], variants.length > 1 ? collapseLimitCell(variants, a[0]) : null)).join("\n")
  const derivRows = derivAnalytes.map((a) => derivRow(a, cells[a[0]])).join("\n")
  const variantNote = variants.length > 1
    ? `\nVariants on this standard: ${variants.map((v) => v.label).join(" and ")}. Where a cell differs between them the limit column shows both (value per variant); the derivation below is stated for ${variants[0].label}.`
    : ""

  const body = [
    `## How every number on this standard is set`,
    (rec.feed_law_note || rec.method || `The standard for each analyte is the strictest maximum level a credible government sets for the nearest applicable product, converted into this product's ${basisLabel} basis. It is a lookup of sovereign law, carrying at most one disclosed basis conversion, with an explicit read-across where no government regulates the exact product. A certified product sits at or below every applicable sovereign limit at once.`).replace(/&mdash;/g, "—").replace(/&rsquo;/g, "'").replace(/&amp;/g, "&").replace(/&nbsp;/g, " "),
    ``,
    `## Master limit table`,
    `All values in ppb (µg/kg), ${basisLabel} basis. A brand meeting every value qualifies for the mark.${variantNote}`,
    ``,
    `| Analyte | HMTc limit | Basis |`,
    `| --- | --- | --- |`,
    limitRows,
    ``,
    `## Derivation — where each number comes from`,
    `Every cell traces to one named sovereign maximum level (the strictest for the nearest analog), or to an explicit control, not-material, or species-bounded determination. No occurrence statistic selects a certification value.`,
    ``,
    `| Analyte | HMTc | Sovereign analog / determination |`,
    `| --- | --- | --- |`,
    derivRows,
    ``,
    `## Cite this standard`,
    // APA "Standard No." form, network-locked to All-rights-reserved (ORDER S-DOI-CITE-LICENSE-1):
    // Standard No. = cert_doi, URL = doi.org only, no version element, no licence on the cite line,
    // never "registration pending". The licence line is separate, below.
    `Pendergrass, K. (${String(eff).slice(0, 4) || "2026"}). *${title}: HMTc standard*${certDoi ? ` (Standard No. ${certDoi})` : ""}. Institute of Contaminant Standards.${certDoi ? ` https://doi.org/${certDoi}` : ""}`,
    ``,
    `© ${String(eff).slice(0, 4) || "2026"} Institute of Contaminant Standards / Heavy Metal Certified. All rights reserved.`,
  ].join("\n")

  const fm = { title: `${title}: HMTc Standard`, dek, updated: /^\d{4}-\d{2}/.test(eff) ? eff.slice(0, 7) : "2026-08", ...(certDoi ? { cert_doi: certDoi } : {}) }
  fs.mkdirSync(OUT, { recursive: true })
  await renderScholarlyPdf({ fm, body, outPath: path.join(OUT, `${slug}.pdf`), cfg: { masthead: "Heavy Metal Certified  ·  Certification Standard", slug, pathSeg: "standards", references: references(cells) } })
  console.log(`standard-pdf: wrote content/static/standards/${slug}.pdf`)
}

const args = process.argv.slice(2)
let targets = args.filter((a) => !a.startsWith("--"))
if (args.includes("--all")) targets = fs.readdirSync(CONTENT).filter((f) => f.endsWith(".md") && f !== "index.md").map((f) => f.replace(/\.md$/, "")).filter((s) => findRecord(s) || JOINS.has(s))
let ok = 0; const failed = []
for (const s of targets) { try { await build(s); ok++ } catch (e) { failed.push(s); console.error(`standard-pdf: FAILED ${s}: ${e.message}`) } }
console.log(`standard-pdf: ${ok}/${targets.length} rendered${failed.length ? `; failed: ${failed.join(", ")}` : ""}`)
if (failed.length) process.exitCode = 1
