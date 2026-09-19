#!/usr/bin/env node
// Generalized renderer: compiled per-category standard records -> canonical cert standard pages.
// Category-driven successor to build-cat1-standard-pages.mjs (which stays as-is for Cat-1). Every
// category-specific fact (panel, analyte tiering, jurisdictions, native basis, cite volume, whether
// an 8:1 reconstitution note applies) comes from the `_meta` block of the category's pages.json, so
// one renderer serves Category 6 (Seafood) now and the remaining categories later.
//
// Input:  data/standards/<compiled_dir>/<record>.json  (frozen derivations from the index repo's
//         deterministic compiler; every number traces to a named register row — nothing authored here)
//         data/standards/<cat>-pages.json               (_meta + per-page metadata)
// Output: content/standards/<page-slug>.md              (custom_page:true — protected from the catalog
//         generator, matching the deployed cert standard template)
//
// Usage:  node tools/build-category-standard-pages.mjs --pages=data/standards/seafood-pages.json

import fs from "node:fs"
import path from "node:path"
import { loadOccurrenceEvidence, loadToxAnchors, descriptorFromCompiledCell, occurrenceRationaleSection } from "./lib/occurrence-section.mjs"
import { renderRiskFlagForStandard } from "./lib/struggle-section.mjs"
import { SPECIES, speciesParentViolations } from "./lib/claim-surface.mjs"

const REPO = process.cwd()
const args = new Map((process.argv.slice(2)).map((a) => { const [k, v] = a.replace(/^--/, "").split("="); return [k, v ?? true] }))
const PAGES_FILE = args.get("pages")
if (!PAGES_FILE) { console.error("build-category-standard-pages: --pages=<file> required"); process.exit(1) }
const DOC = JSON.parse(fs.readFileSync(path.join(REPO, PAGES_FILE), "utf8"))
const META = DOC._meta
const COMPILED = path.join(REPO, "data/standards", META.compiled_dir)
const OUT = path.join(REPO, "content/standards")
const REGDIR = path.join(REPO, "content/regulations")
const OCC = loadOccurrenceEvidence(path.join(REPO, "data/standards"))
const TOX = loadToxAnchors(path.join(REPO, "data/standards"))

const ACCENT = "#9f2727", LINK = "#1c43ad"
const PANEL = META.panel
const TIER1 = new Set(META.tier1 || [])

// Full analyte label bank (superset; only PANEL entries render).
const ANALYTE = {
  Pb: "Lead (Pb)", iAs: "Inorganic arsenic (iAs)", tAs: "Total arsenic (tAs)",
  tHg: "Mercury, total (tHg)", MeHg: "Methylmercury (MeHg)", Cd: "Cadmium (Cd)",
  Cr: "Total chromium (Cr)", "Cr-VI": "Hexavalent chromium (Cr-VI)", Ni: "Nickel (Ni)",
  Sn: "Tin (Sn)", Al: "Aluminium (Al)", U: "Uranium (U)", Sb: "Antimony (Sb)",
}
const tierOf = (a) => (TIER1.has(a) ? "Tier 1" : "Tier 2")

// A cell is "firm" (carries a standalone published ceiling) only when it resolves to a
// number via a sovereign lookup, a disclosed read-across, or a special-basis limit.
// control / subsumed / not_material cells are governed but carry NO standalone number, so
// they must not be counted as firm ceilings (the count feeds the honest master-table note,
// the front-matter firm_analytes, and the /standards index "N firm" badge).
const isFirm = (cell) => !!(cell && cell.value != null && (cell.type === "gov" || cell.type === "read_across" || cell.type === "special" || cell.type === "form_split"))
// Native basis arrives as as_sold / as_consumed (cat1, seafood, grains, cat16) OR as a free
// string ("as placed on market", "as sold", "as consumed") from the newer per-category
// compilers. Normalise both to the display word and the front-matter token.
const basisWordOf = (nb) => (String(nb || "").toLowerCase().includes("consum") ? "as-consumed" : "as-sold")
const normBasis = (nb) => (basisWordOf(nb) === "as-consumed" ? "as_consumed" : "as_sold")

// The newer per-category compilers (Cat 33 Chocolate, Cat 34 Herbs/Spices/Salt) emit a flat
// `cells` object using cell_kind / provenance fields (not `type`) and a `form_split` cell whose
// limit varies by product sub-form. Normalise a cells-record into the canonical cell model the
// renderer consumes so one generator serves both schemas. `type` present == already canonical.
function normalizeCell(c) {
  if (!c || c.type) return c
  const kind = c.cell_kind, prov = c.provenance
  if (kind === "form_split") {
    const vals = (c.forms || []).map((f) => f.value).filter((v) => v != null)
    return { type: "form_split", value: c.value ?? c.strictest_form_value ?? (vals.length ? Math.min(...vals) : null), forms: c.forms || [], binding_jurisdiction: (c.forms && c.forms[0] && c.forms[0].binding_jurisdiction) || c.binding_jurisdiction }
  }
  // A screening ceiling (total chromium: dominated by benign Cr(III); the health-relevant species
  // is Cr(VI)). The compiler records the sovereign value on the cell but flags screen:true because
  // it is non-protective as a total-element ceiling — the binding health control is Cr(VI). Checked
  // BEFORE the gov branch (a screen cell is also regulatory-alignment) so it never renders as a firm
  // ceiling. Carries a value for the derivation, but isFirm() excludes it, so it is not counted or
  // displayed as a standalone HMTc limit.
  if (c.screen === true) {
    return { type: "screen", value: c.value, binding_jurisdiction: c.binding_jurisdiction, binding_id: c.binding_id, screen_note: c.screen_note, binding_control: c.binding_control }
  }
  if (kind === "gov" || (prov === "regulatory-alignment" && c.value != null)) {
    return { type: "gov", value: c.value, binding_jurisdiction: c.binding_jurisdiction, binding_id: c.binding_id, concurring: c.concurring || [] }
  }
  if (prov === "read-across") {
    return { type: "read_across", value: c.value, source_jurisdiction: c.source_jurisdiction, label: c.label, analog_scope: c.source_scope }
  }
  if (prov === "control") {
    return { type: "control", value: null, rationale: c.rationale, reference_method: c.reference_method }
  }
  return { type: "control", value: c.value ?? null, rationale: c.rationale || c.label || "" }
}
const normalizeCells = (cells) => Object.fromEntries(Object.entries(cells || {}).map(([a, c]) => [a, normalizeCell(c)]))
// min–max range across a form_split cell's forms
const formRange = (cell) => {
  const vs = (cell.forms || []).map((f) => f.value).filter((v) => v != null)
  if (!vs.length) return cell.value != null ? String(cell.value) : "&mdash;"
  const mn = Math.min(...vs), mx = Math.max(...vs)
  return mn === mx ? String(mn) : `${mn}&ndash;${mx}`
}

// Jurisdiction display labels + optional regulation-page slugs. A header/link renders only when the
// regulation page actually exists on disk (existsSync-gated), so no category can emit a broken link.
const JUR_LABEL = {
  EU: "EU", UK: "UK", CODEX: "Codex", CA: "Canada", CN: "China", IN: "India", BR: "Brazil",
  GSO: "GSO", "AU-NZ": "AU/NZ", US: "FDA", "US-CA": "US-CA", "US-WA": "US-WA", EC: "Ecuador",
  MX: "Mexico", TR: "Türkiye", CR: "Costa Rica", FJ: "Fiji", IL: "Israel", PA: "Panama",
  PY: "Paraguay", SG: "Singapore", TH: "Thailand", VN: "Vietnam", GY: "Guyana", MA: "Morocco",
  PH: "Philippines", TT: "Trinidad & Tobago", UY: "Uruguay", MERCOSUR: "Mercosur", international: "Intl",
  HK: "Hong Kong",
}
const JUR2REG = {
  EU: "eu-2023-915", UK: "uk-1881-2006", CODEX: "codex-cxs-193", CA: "canada-contaminants",
  CN: "china-gb-2762", IN: "india-fssai", BR: "brazil-anvisa", GSO: "gso-193", "AU-NZ": "au-nz-fsanz",
  US: "us-fda-c2z",
}
// Column order: major bodies first, then everyone else alphabetically by label.
const JUR_ORDER = ["EU", "UK", "CODEX", "US", "AU-NZ", "GSO", "CA", "CN", "IN", "BR", "MERCOSUR",
  "CR", "EC", "FJ", "GY", "IL", "MA", "MX", "PA", "PH", "PY", "SG", "TH", "TT", "UY", "VN"]

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
const reg = (j) => {
  const slug = JUR2REG[j]
  if (slug && fs.existsSync(path.join(REGDIR, `${slug}.md`))) return `/regulations/${slug}`
  return null
}
// JUR2REG maps a whole JURISDICTION to one regulation page, which is only ever right when a
// jurisdiction has a single relevant instrument. It is wrong the moment a category leaves food law:
// a bottled-water cell bound by the EU Drinking Water Directive, a toy cell bound by the Toy Safety
// Directive, and a food-contact cell bound by the plastics SML regulation would all have linked to
// the EU food-contaminants regulation. Citing an instrument the cell was not derived from is a
// defensibility hole, so a cell that names its OWN instrument is linked to that instrument or to
// nothing at all — never to a jurisdiction stand-in. Cells from older compilers carry no page and
// keep the jurisdiction fallback, so existing food pages are unaffected.
const regForCell = (cell, jurisdiction) => {
  const page = cell && (cell.binding_page || cell.source_page)
  if (page) {
    const slug = String(page).replace(/^regulations\//, "")
    return fs.existsSync(path.join(REGDIR, `${slug}.md`)) ? `/regulations/${slug}` : null
  }
  return reg(jurisdiction)
}
const jlabel = (j) => JUR_LABEL[j] || j

// --- binding-basis label per cell ---------------------------------------------
function bindingLabel(cell) {
  if (cell.type === "gov") {
    const href = regForCell(cell, cell.binding_jurisdiction)
    const txt = `strictest government ML (${jlabel(cell.binding_jurisdiction)})`
    return href ? `<a href="${href}" style="color:${LINK};text-decoration:none">${txt}</a>` : txt
  }
  if (cell.type === "read_across") {
    const sj = cell.source_jurisdiction || cell.binding_jurisdiction
    const href = regForCell(cell, sj)
    const label = esc(cell.label && cell.label.length < 90 ? cell.label : `government read-across (${jlabel(sj)})`)
    return href ? `<a href="${href}" style="color:${LINK};text-decoration:none">${label}</a>` : label
  }
  if (cell.type === "not_material") return "not material — controlled analyte (see note)"
  if (cell.type === "control") return "mandatory control — no government ML; screened every lot (see note)"
  if (cell.type === "screen") return "screening ceiling — Cr(VI) is the binding health control (see note)"
  if (cell.type === "subsumed") return `&le; total ${esc(cell.subsumed_by || "parent total")}, measured every lot (see note)`
  if (cell.type === "form_split") return "strictest government ML, set by product form (see derivation)"
  return "&mdash;"
}

// Collapse one analyte across variants into a single display value ("X" or "X lab1 / Y lab2").
function limitDisplay(analyte, variants) {
  const parts = variants.map((v) => ({ label: v.label, val: v.cells[analyte] }))
  const vals = parts.map((p) => {
    if (!p.val) return "&mdash;"
    if (p.val.type === "form_split") return formRange(p.val)
    if (p.val.type === "screen") return "screen"
    if (p.val.value == null) {
      if (p.val.type === "not_material") return "n/m"
      if (p.val.type === "control") return "control"
      if (p.val.type === "subsumed") return p.val.binding_total != null ? String(p.val.binding_total) : "bounded"
      return "&mdash;"
    }
    return String(p.val.value)
  })
  if (vals.every((x) => x === vals[0])) return vals[0]
  return parts.map((p, i) => `${vals[i]} ${p.label}`).join(" / ")
}

// --- Master Limit Table -------------------------------------------------------
function claimPanelOf(cells) {
  // Totals-only categories (olive oil / culinary oils): speciation is not a
  // defining pathway. Omit iAs/MeHg unless they already carry a firm numeric ML.
  // Cr-VI stays when it is a published number ≤ total Cr.
  if (META.speciation_defining === false) {
    return PANEL.filter((a) => !SPECIES.includes(a) || isFirm(cells[a]))
  }
  return PANEL
}

function masterTable(variants, basisWord, tierNote, firmCount, claimPanel) {
  const rows = claimPanel.map((a, i) => {
    const cell0 = variants[0].cells[a]
    const zebra = i % 2 === 1 ? ";background:#fbf7f5" : ""
    return `<tr style="border-bottom:1px solid #f2ece7${zebra}"><td style="padding:10px 15px;color:#2b1f1f">${ANALYTE[a] || a}</td><td style="padding:10px 15px;color:#736b6b;font-size:12px">${tierOf(a)}</td><td style="padding:10px 15px;text-align:right;font-family:'IBM Plex Mono',monospace;color:#2b1f1f">${limitDisplay(a, variants)}</td><td style="padding:10px 15px;color:#736b6b;font-size:12.5px">${bindingLabel(cell0)}</td></tr>`
  }).join("")
  // Honest cap note: a fully-numeric category (seafood, grains) states every analyte carries a
  // firm ceiling. Otherwise the remainder splits into two distinct, non-interchangeable kinds, and
  // the note must not conflate them: a SUBSUMED (bounded) cell is a toxic species bounded by its
  // parent total (iAs by tAs, MeHg by tHg) and enforced by reflex speciation — it carries an
  // enforceable ceiling; a CONTROL / not-material cell carries no standalone number at all. When the
  // only non-firm cells are bounded species, every analyte still has an enforceable ceiling, and the
  // note says so rather than implying an analyte is unspecified.
  const boundedCount = claimPanel.filter((a) => { const c = variants[0].cells[a]; return c && c.type === "subsumed" }).length
  const controlCount = claimPanel.filter((a) => { const c = variants[0].cells[a]; return c && (c.type === "control" || c.type === "not_material") }).length
  const capNote = firmCount >= claimPanel.length
    ? "Every analyte carries a firm ceiling. A brand meeting every value on a like-for-like basis qualifies for the mark."
    : controlCount === 0
    ? `${firmCount} of ${claimPanel.length} analytes carry a firm ceiling; the remaining ${boundedCount} are toxic species bounded by their parent totals (species &le; total, measured on every lot), so every analyte carries an enforceable ceiling. A brand meeting every value on a like-for-like basis qualifies for the mark.`
    : `${firmCount} of ${claimPanel.length} analytes carry a firm ceiling; ${boundedCount ? `${boundedCount} are toxic species bounded by their parent totals (species &le; total, measured on every lot), and ` : ""}the remaining ${controlCount} are governed by mandatory control or the total-metal screen with no standalone number, itemised in the derivation below. A brand meeting every firm value on a like-for-like basis, and passing every control, qualifies for the mark.`
  return `<section id="limits" style="margin-bottom:52px"><h2 style="font-family:Lora,serif;font-weight:400;font-size:30px;line-height:1.2;color:#2b1f1f;border-bottom:1px solid #e8e1db;padding-bottom:10px;margin:0 0 20px">Master Limit Table</h2><p style="font-size:11.5px;line-height:1.55;color:#a9a1a1;max-width:84ch;margin:0 0 14px">All values in ppb (&micro;g/kg), ${basisWord} basis. ${capNote}</p><div style="overflow-x:auto"><table style="width:100%;font-size:13.5px;border:1px solid #e8e1db;min-width:48rem;border-collapse:collapse"><thead><tr style="background:${ACCENT};color:#fff"><th style="text-align:left;padding:11px 15px;font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:500;letter-spacing:.1em;text-transform:uppercase">Analyte</th><th style="text-align:left;padding:11px 15px;font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:500;letter-spacing:.1em;text-transform:uppercase">Tier</th><th style="text-align:right;padding:11px 15px;font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:500;letter-spacing:.1em;text-transform:uppercase">HMTc limit</th><th style="text-align:left;padding:11px 15px;font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:500;letter-spacing:.1em;text-transform:uppercase">Binding basis</th></tr></thead><tbody>${rows}</tbody></table></div><p style="font-size:11.5px;line-height:1.55;color:#a9a1a1;max-width:84ch;margin:14px 0 0">${tierNote}</p></section>`
}

// --- Derivation (per-country) table -------------------------------------------
function derivationTable(primary, basisWord, subName, otherNote, reconNote) {
  const present = new Set()
  for (const a of PANEL) { const c = primary.cells[a]; if (c && c.per_country) Object.keys(c.per_country).forEach((j) => present.add(j)) }
  const cols = JUR_ORDER.filter((j) => present.has(j)).concat([...present].filter((j) => !JUR_ORDER.includes(j)))
  const th = cols.map((j) => { const h = reg(j); const lbl = jlabel(j); return `<th style="text-align:right;padding:9px 10px;font-family:'IBM Plex Mono',monospace;font-size:9.5px;font-weight:500">${h ? `<a href="${h}" style="color:#fff;text-decoration:underline;text-underline-offset:2px">${lbl}</a>` : lbl}</th>` }).join("")
  let anyConv = false, anyControl = false, anySubsumed = false
  const body = PANEL.map((a) => {
    const c = primary.cells[a]
    const tds = cols.map((j) => {
      const pc = c && c.per_country && c.per_country[j]
      if (!pc) return `<td style="padding:9px 10px;text-align:right;color:#d8cfca">&mdash;</td>`
      // The ¹ mark denotes a genuine basis conversion. It only ever applies to a category that
      // reconstitutes (the 8:1 formula case); the compiled record flags face-value cells as
      // "converted" too (their note is "face value", not "same basis"), so gate on reconstitution_note
      // to avoid a superscript with no conversion and no footnote on a face-value category like seafood.
      const isConv = reconNote && pc.converted
      const conv = isConv ? "&sup1;" : ""; if (isConv) anyConv = true
      const strict = c.type === "gov" && c.binding_jurisdiction === j
      const color = strict ? `${ACCENT};font-weight:400` : "#736b6b"
      return `<td style="padding:9px 10px;text-align:right;font-family:'IBM Plex Mono',monospace;color:${color}">${pc.value}${conv}</td>`
    }).join("")
    let hmtc, binds
    if (!c) { hmtc = "&mdash;"; binds = "&mdash;" }
    else if (c.type === "control") { hmtc = "control&sup4;"; binds = "screened"; anyControl = true }
    else if (c.type === "subsumed") {
      const n = c.binding_total != null ? c.binding_total : c.value
      hmtc = (n != null ? String(n) : "bounded") + "&sup5;"
      binds = `species &le; ${esc(c.subsumed_by || "total")}`
      anySubsumed = true
    }
    else if (c.value == null && c.type !== "not_material") { hmtc = "&mdash;"; binds = "&mdash;" }
    else if (c.type === "read_across") {
      // Method v2.0 retired the occurrence-selected and precautionary numeric pathways. A record
      // still carrying one is a methodology regression, not something to render: fail the build
      // rather than publish a page asserting a derivation the programme no longer performs.
      if (c.basis_kind === "occurrence" || c.basis_kind === "precautionary") {
        console.error(`build-category-standard-pages: ${subName} / ${a} carries retired basis_kind "${c.basis_kind}" — Method v2.0 permits only regulatory-alignment, read-across, not-material, control and ratchet. Recompile the record.`)
        process.exit(1)
      }
      hmtc = `${c.value}&sup2;`; binds = "read-across"
    }
    else if (c.type === "not_material") { hmtc = "n/m&sup3;"; binds = "controlled" }
    else { hmtc = String(c.value); const h = regForCell(c, c.binding_jurisdiction); binds = h ? `<a href="${h}" style="color:${LINK};text-decoration:none">${jlabel(c.binding_jurisdiction)}</a>` : jlabel(c.binding_jurisdiction) }
    return `<tr style="border-bottom:1px solid #f2ece7"><td style="padding:9px 12px;color:#2b1f1f">${ANALYTE[a] || a}</td>${tds}<td style="padding:9px 12px;text-align:right;font-family:'IBM Plex Mono',monospace;color:#2b1f1f;font-weight:500;background:#fbf7f5">${hmtc}</td><td style="padding:9px 12px;color:#736b6b;font-size:11.5px">${binds}</td></tr>`
  }).join("")
  const convNote = (anyConv && reconNote) ? "&sup1; basis-converted at the 8:1 powder-to-liquid ratio &mdash; the only such ratio a government legislates (China GB 2762 footnote c). " : ""
  const ctrlNote = anyControl ? "&sup4; no sovereign maximum exists for this analyte in this product, but a credible exposure pathway does &mdash; it is screened on every lot under ALARA against the tightest analogous reference, not assigned an invented number. " : ""
  const subNote = anySubsumed ? "&sup5; a toxic species governed by and bounded by its parent total (for example inorganic arsenic &le; total arsenic): the species can never exceed the total, so the total ceiling is the species ceiling. The total metal is measured on every lot and the species is established at baseline; no separate species ceiling is published. On ongoing lots the species is speciated whenever the total exceeds its limit. " : ""
  const foot = `All values &micro;g/kg (ppb), ${basisWord} basis. ${convNote}&sup2; no government regulates this analyte for this exact product form: the value is a disclosed read-across from the nearest applicable government maximum, and the derivation names the instrument it comes from. It is never taken from occurrence data. After publication the standards ratchet may tighten it, using certified-lot results only. &sup3; not material in this matrix: measured but with no standalone number, controlled by packaging control or by the total-metal screen, not an invented value. ${ctrlNote}${subNote}${otherNote || ""}`
  return `<section id="derivation" style="margin-bottom:52px"><h2 style="font-family:Lora,serif;font-weight:400;font-size:30px;line-height:1.2;color:#2b1f1f;border-bottom:1px solid #e8e1db;padding-bottom:10px;margin:0 0 20px">Derivation</h2><p style="font-size:13.5px;line-height:1.7;color:#736b6b;max-width:84ch;margin:0 0 16px">The full derivation for ${esc(subName)}. Each row lists every government maximum level in force worldwide, converted to the ${basisWord} basis; the HMTc limit is the strictest of them, and the last column names which sovereign law binds. A blank cell means that government sets no limit for this analyte in this product.</p><div style="overflow-x:auto"><table style="width:100%;font-size:12.5px;border:1px solid #e8e1db;min-width:56rem;border-collapse:collapse"><thead><tr style="background:${ACCENT};color:#fff"><th style="text-align:left;padding:9px 12px;font-family:'IBM Plex Mono',monospace;font-size:9.5px;font-weight:500;letter-spacing:.08em;text-transform:uppercase">Analyte</th>${th}<th style="text-align:right;padding:9px 12px;font-family:'IBM Plex Mono',monospace;font-size:9.5px;font-weight:500;background:#7d1f1f">HMTc</th><th style="text-align:left;padding:9px 12px;font-family:'IBM Plex Mono',monospace;font-size:9.5px;font-weight:500">Binds</th></tr></thead><tbody>${body}</tbody></table></div><p style="font-family:'IBM Plex Mono',monospace;font-size:10.5px;line-height:1.7;color:#a9a1a1;max-width:84ch;margin:14px 0 0">${foot}</p></section>`
}

function methodSection(subName, basisWord, methodProse) {
  const H = `<h2 style="font-family:Lora,serif;font-weight:400;font-size:30px;line-height:1.2;color:#2b1f1f;border-bottom:1px solid #e8e1db;padding-bottom:10px;margin:0 0 20px">How limits are set</h2>`
  // A category whose method is not the strictest-government-ML default (e.g. Cat 16's
  // child-protective over-compliance) supplies its own prose via META.method_prose.
  if (Array.isArray(methodProse) && methodProse.length) {
    const paras = methodProse.map((p) => `<p style="font-size:15.5px;line-height:1.75;color:#3f3a3a;margin:0 0 16px;max-width:84ch">${p}</p>`).join("")
    return `<section id="method" style="margin-bottom:52px">${H}${paras}</section>`
  }
  return `<section id="method" style="margin-bottom:52px">${H}<p style="font-size:15.5px;line-height:1.75;color:#3f3a3a;margin:0 0 16px;max-width:84ch">The standard for each analyte is the strictest maximum level set by any credible government regulator &mdash; among them the European Union, Codex Alimentarius, the US FDA, Australia/New Zealand, the Gulf states (GSO), and the national authorities of every jurisdiction that regulates the product &mdash; converted into ${esc(subName)}&rsquo;s own ${basisWord} basis. It is a lookup of sovereign law, carrying at most one disclosed basis conversion where the law is written in another basis, and an explicit read-across where no government regulates the exact product. A certified product sits at or below every applicable sovereign limit at once.</p><p style="font-size:15.5px;line-height:1.75;color:#3f3a3a;margin:0 0 16px;max-width:84ch">Where <em>no</em> government regulates the exact product for an analyte, the standard does not go blank or invent a number: the limit is read across from the nearest government value for an analogous product, so a certified product still sits at or below a real sovereign limit. The ratchet tightens these after publication as surveillance warrants.</p></section>`
}

// Child-protective anchor derivation (Cat 16): no government regulates a supplement to a
// child-safe level, so the per-country matrix does not apply. This shows, per analyte, the
// sovereign infant-and-child-food anchor the limit is read across from, the HMTc value, and
// the disclosed (never-selected) adult floor — the whole defensibility of the over-compliance.
function childAnchorDerivation(primary, subName) {
  const adultFloor = (cell) => {
    const af = cell.adult_floor
    if (!af) return "&mdash;"
    // parts are already HTML-safe (numeric values + fixed jurisdiction labels), so no esc()
    const parts = []
    const s = af.strictest_supplement_ml, l = af.laxest_supplement_ml
    if (s) parts.push(`${esc(jlabel(s.jurisdiction))} ${s.value}${l && l.value !== s.value ? `&ndash;${l.value}` : ""}`)
    if (af.usp_2232 && af.usp_2232.conc_equiv_ug_per_kg_at_10g != null) parts.push(`USP &lt;2232&gt; ${af.usp_2232.conc_equiv_ug_per_kg_at_10g}`)
    if (af.prop65_madl && af.prop65_madl.madl_ug_per_day != null) parts.push(`Prop 65 ${af.prop65_madl.madl_ug_per_day}&thinsp;&micro;g/day`)
    return parts.length ? parts.join(" &middot; ") : "&mdash;"
  }
  const body = PANEL.map((a) => {
    const c = primary.cells[a]
    let anchor, hmtc, floor, basis
    if (c && c.type === "read_across") {
      anchor = esc(`${jlabel(c.source_jurisdiction)} — ${c.analog_scope || "infant/child food"}`)
      hmtc = String(c.value); floor = adultFloor(c); basis = "child-protective read-across"
    } else if (c && c.type === "control") {
      anchor = "no infant-food ML exists"; hmtc = "control"; floor = "&mdash;"; basis = "mandatory control &mdash; screened every lot"
    } else if (c && c.type === "subsumed") {
      anchor = `&le; ${esc(c.subsumed_by || "parent total")}`; hmtc = "bounded"; floor = "&mdash;"; basis = "bounded by parent total"
    } else if (c && c.type === "not_material") {
      anchor = "&mdash;"; hmtc = "n/m"; floor = "&mdash;"; basis = "not material"
    } else { anchor = "&mdash;"; hmtc = "&mdash;"; floor = "&mdash;"; basis = "&mdash;" }
    return `<tr style="border-bottom:1px solid #f2ece7"><td style="padding:9px 12px;color:#2b1f1f">${ANALYTE[a] || a}</td><td style="padding:9px 12px;color:#736b6b;font-size:12px">${anchor}</td><td style="padding:9px 12px;text-align:right;font-family:'IBM Plex Mono',monospace;color:#2b1f1f;font-weight:500;background:#fbf7f5">${hmtc}</td><td style="padding:9px 12px;font-family:'IBM Plex Mono',monospace;font-size:11px;color:#a9a1a1">${floor}</td><td style="padding:9px 12px;color:#736b6b;font-size:11.5px">${basis}</td></tr>`
  }).join("")
  return `<section id="derivation" style="margin-bottom:52px"><h2 style="font-family:Lora,serif;font-weight:400;font-size:30px;line-height:1.2;color:#2b1f1f;border-bottom:1px solid #e8e1db;padding-bottom:10px;margin:0 0 20px">Derivation</h2><p style="font-size:13.5px;line-height:1.7;color:#736b6b;max-width:84ch;margin:0 0 16px">No government regulates a dietary supplement to a child-safe heavy-metal level. Each HMTc limit for ${esc(subName)} is read across from the strictest sovereign infant-and-child-food maximum level for the analyte &mdash; the child anchor named below &mdash; and applied to all supplements as a voluntary over-compliance. The adult floor column discloses the laxer sovereign supplement limit, USP &lt;2232&gt; oral concentration, and California Prop 65 dose that HMTc declines to use. It is shown, and never selected.</p><div style="overflow-x:auto"><table style="width:100%;font-size:12.5px;border:1px solid #e8e1db;min-width:52rem;border-collapse:collapse"><thead><tr style="background:${ACCENT};color:#fff"><th style="text-align:left;padding:9px 12px;font-family:'IBM Plex Mono',monospace;font-size:9.5px;font-weight:500;letter-spacing:.08em;text-transform:uppercase">Analyte</th><th style="text-align:left;padding:9px 12px;font-family:'IBM Plex Mono',monospace;font-size:9.5px;font-weight:500">Child-protective anchor</th><th style="text-align:right;padding:9px 12px;font-family:'IBM Plex Mono',monospace;font-size:9.5px;font-weight:500;background:#7d1f1f">HMTc</th><th style="text-align:left;padding:9px 12px;font-family:'IBM Plex Mono',monospace;font-size:9.5px;font-weight:500">Adult floor (disclosed, not used)</th><th style="text-align:left;padding:9px 12px;font-family:'IBM Plex Mono',monospace;font-size:9.5px;font-weight:500">Basis</th></tr></thead><tbody>${body}</tbody></table></div><p style="font-family:'IBM Plex Mono',monospace;font-size:10.5px;line-height:1.7;color:#a9a1a1;max-width:84ch;margin:14px 0 0">Adult floor values in &micro;g/kg unless marked. Supplement ML is the strictest&ndash;laxest sovereign food-supplement maximum on the register; USP &lt;2232&gt; is the oral permitted-daily-exposure concentration at a 10&thinsp;g/day intake; Prop 65 is the California developmental safe-harbour dose. HMTc holds every supplement to the child anchor instead.</p></section>`
}

function citeSection(subName, version, hmiLink, doi, volume) {
  const hmi = hmiLink ? `<a href="${hmiLink}" style="color:${LINK}">Heavy Metal Index</a>` : "Heavy Metal Index"
  // APA "Standard No." form, network-locked to All-rights-reserved (ORDER S-DOI-CITE-LICENSE-1):
  // Standard No. = cert_doi, URL = doi.org only (never the page URL, never "registration pending"),
  // no licence glued onto the cite line. The licence line is a separate row below.
  const stdNo = doi ? ` (Standard No. ${doi})` : ""
  const doiText = doi ? ` <a href="https://doi.org/${doi}" style="color:${LINK}">https://doi.org/${doi}</a>` : ""
  return `<section id="cite" style="margin-bottom:20px"><h2 style="font-family:Lora,serif;font-weight:400;font-size:30px;line-height:1.2;color:#2b1f1f;border-bottom:1px solid #e8e1db;padding-bottom:10px;margin:0 0 20px">Cite this standard</h2><p style="font-family:'IBM Plex Mono',monospace;font-size:11px;line-height:1.75;color:#5a4141;margin:0 0 10px;max-width:84ch">Pendergrass, K. (2026). <em style="font-style:italic">${esc(subName)}: HMTc standard</em>${stdNo}. Institute of Contaminant Standards.${doiText}</p><p style="font-size:11px;line-height:1.6;color:#736b6b;max-width:84ch;margin:0 0 14px">&copy; 2026 Institute of Contaminant Standards / Heavy Metal Certified. All rights reserved.</p><p style="font-size:12.5px;line-height:1.65;color:#a9a1a1;max-width:84ch;margin:0">The literature baseline for every analyte is maintained independently at the ${hmi}. This certification standard applies those findings; the two are kept editorially separate by design.</p></section>`
}

// Binding derivation (Cat 33 Chocolate, Cat 34 Herbs/Spices/Salt): the compiler emits the
// binding sovereign limit and the jurisdictions that concur, not a full per-country matrix, and
// some analytes carry a form-specific limit (cocoa content, refined vs unrefined salt, spice
// botanical part). Show the binding value/jurisdiction per analyte, then break out every
// form-specific limit so a certifier can read the exact ceiling for the product's sub-form.
function cellsBindingDerivation(primary, subName, leadOverride) {
  const splits = []
  let anyFirm = false
  const body = PANEL.map((a) => {
    const c = primary.cells[a]
    let hmtc, binds, basis
    if (c && (c.type === "gov" || c.type === "form_split" || c.type === "read_across")) anyFirm = true
    if (!c) { hmtc = "&mdash;"; binds = "&mdash;"; basis = "&mdash;" }
    else if (c.type === "form_split") {
      splits.push({ a, cell: c })
      hmtc = formRange(c); binds = "by product form (below)"; basis = "sovereign ML, form-specific"
    } else if (c.type === "gov") {
      hmtc = String(c.value)
      const extra = Array.isArray(c.concurring) && c.concurring.length > 1 ? ` &middot; +${c.concurring.length - 1} concurring` : ""
      const h = regForCell(c, c.binding_jurisdiction)
      binds = (h ? `<a href="${h}" style="color:${LINK};text-decoration:none">${esc(jlabel(c.binding_jurisdiction))}</a>` : esc(jlabel(c.binding_jurisdiction))) + extra
      basis = "direct sovereign ML"
    } else if (c.type === "read_across") {
      hmtc = String(c.value); binds = esc(jlabel(c.source_jurisdiction || c.binding_jurisdiction)); basis = "disclosed read-across"
    } else if (c.type === "control") {
      hmtc = "control"; binds = "screened every lot"; basis = "mandatory control &mdash; no government ML"
    } else if (c.type === "screen") {
      hmtc = "screen"; binds = "Cr(VI) binds"; basis = `screening ceiling (${esc(jlabel(c.binding_jurisdiction))} action level ${c.value != null ? esc(String(c.value)) + "&thinsp;&micro;g/kg " : ""}&mdash; non-protective for total Cr); any quantifiable Cr(VI) fails`
    } else if (c.type === "not_material") {
      hmtc = "n/m"; binds = c.bounded_by ? `&le; ${esc(c.bounded_by)}` : "controlled"; basis = "not material in this matrix"
    } else if (c.type === "subsumed") {
      hmtc = "bounded"; binds = `&le; ${esc(c.subsumed_by || "total")}`; basis = "bounded by parent total"
    } else { hmtc = c.value != null ? String(c.value) : "&mdash;"; binds = "&mdash;"; basis = "&mdash;" }
    return `<tr style="border-bottom:1px solid #f2ece7"><td style="padding:9px 12px;color:#2b1f1f">${ANALYTE[a] || a}</td><td style="padding:9px 12px;text-align:right;font-family:'IBM Plex Mono',monospace;color:#2b1f1f;font-weight:500;background:#fbf7f5">${hmtc}</td><td style="padding:9px 12px;color:#736b6b;font-size:12px">${binds}</td><td style="padding:9px 12px;color:#736b6b;font-size:11.5px">${basis}</td></tr>`
  }).join("")
  const splitBlocks = splits.map(({ a, cell }) => {
    const rows = (cell.forms || []).map((f) => {
      const h = regForCell(f, f.binding_jurisdiction)
      const jur = h ? `<a href="${h}" style="color:${LINK};text-decoration:none">${esc(jlabel(f.binding_jurisdiction))}</a>` : esc(jlabel(f.binding_jurisdiction))
      return `<tr style="border-bottom:1px solid #f2ece7"><td style="padding:8px 12px;color:#3f3a3a;font-size:12.5px">${esc(f.form)}</td><td style="padding:8px 12px;text-align:right;font-family:'IBM Plex Mono',monospace;color:#2b1f1f">${f.value}</td><td style="padding:8px 12px;color:#736b6b;font-size:11.5px">${jur}</td></tr>`
    }).join("")
    return `<div style="margin:0 0 18px"><div style="font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#9a8f8f;margin:0 0 8px">${ANALYTE[a] || a} &mdash; limit by product form</div><div style="overflow-x:auto"><table style="width:100%;font-size:12.5px;border:1px solid #e8e1db;min-width:34rem;border-collapse:collapse"><thead><tr style="background:#fbf7f5"><th style="text-align:left;padding:8px 12px;font-family:'IBM Plex Mono',monospace;font-size:9.5px;font-weight:500;color:#736b6b">Product form</th><th style="text-align:right;padding:8px 12px;font-family:'IBM Plex Mono',monospace;font-size:9.5px;font-weight:500;color:#736b6b">HMTc (&micro;g/kg)</th><th style="text-align:left;padding:8px 12px;font-family:'IBM Plex Mono',monospace;font-size:9.5px;font-weight:500;color:#736b6b">Binding jurisdiction</th></tr></thead><tbody>${rows}</tbody></table></div></div>`
  }).join("")
  const splitSection = splitBlocks
    ? `<h3 style="font-family:Lora,serif;font-weight:400;font-size:19px;color:#2b1f1f;margin:26px 0 12px">Form-specific limits</h3><p style="font-size:13px;line-height:1.65;color:#736b6b;max-width:84ch;margin:0 0 16px">Where a government sets the maximum by product sub-form, the HMTc column above shows the range and the exact ceiling for each form is listed here. A certified product meets the ceiling for its own form.</p>${splitBlocks}`
    : ""
  const lead = leadOverride
    ? String(leadOverride).replace(/\{name\}/g, esc(subName))
    : anyFirm
      ? `For ${esc(subName)}, each HMTc limit is the strictest maximum level any credible government sets for the product, named in the Binding column with the count of jurisdictions that concur at that value. Where no government regulates the analyte, the cell is a mandatory control or a not-material determination, never an invented number.`
      : `No government sets a heavy-metal content limit for ${esc(subName)}. Every analyte on the panel is held under mandatory control &mdash; measured on every lot and escalated against route-appropriate toxicological anchors &mdash; or, where the chemistry rules it out of the matrix, recorded as a substantiated not-material determination. No number is invented.`
  return `<section id="derivation" style="margin-bottom:52px"><h2 style="font-family:Lora,serif;font-weight:400;font-size:30px;line-height:1.2;color:#2b1f1f;border-bottom:1px solid #e8e1db;padding-bottom:10px;margin:0 0 20px">${anyFirm ? "Derivation" : "Derivation"}</h2><p style="font-size:13.5px;line-height:1.7;color:#736b6b;max-width:84ch;margin:0 0 16px">${lead}</p><div style="overflow-x:auto"><table style="width:100%;font-size:12.5px;border:1px solid #e8e1db;min-width:44rem;border-collapse:collapse"><thead><tr style="background:${ACCENT};color:#fff"><th style="text-align:left;padding:9px 12px;font-family:'IBM Plex Mono',monospace;font-size:9.5px;font-weight:500;letter-spacing:.08em;text-transform:uppercase">Analyte</th><th style="text-align:right;padding:9px 12px;font-family:'IBM Plex Mono',monospace;font-size:9.5px;font-weight:500;background:#7d1f1f">HMTc</th><th style="text-align:left;padding:9px 12px;font-family:'IBM Plex Mono',monospace;font-size:9.5px;font-weight:500">Binding</th><th style="text-align:left;padding:9px 12px;font-family:'IBM Plex Mono',monospace;font-size:9.5px;font-weight:500">Basis</th></tr></thead><tbody>${body}</tbody></table></div>${splitSection}</section>`
}

// --- drive --------------------------------------------------------------------
const tier1Names = (META.tier1 || []).map((a) => (a === "tHg" ? "Hg" : a)).filter((v, i, arr) => arr.indexOf(v) === i).join(", ")
const tier2Names = (META.tier2 || []).join(", ")
const tierNote = `Tier 1 (${tier1Names}) are zero-tolerance toxics with no established safe threshold. Tier 2 (${tier2Names}) carry a 150% transitional allowance under the program&rsquo;s Status A&ndash;E framework. ${META.tier_footnote || ""}`.trim()

let n = 0
for (const page of DOC.pages) {
  const variants = page.variants.map((v) => {
    const rec = JSON.parse(fs.readFileSync(path.join(COMPILED, `${v.record}.json`), "utf8"))
    const vmap = rec.variants || { both: normalizeCells(rec.cells) }
    const cells = vmap[v.variant] || vmap[Object.keys(vmap)[0]]
    return { label: v.label, cells, native_basis: rec.native_basis }
  })
  const basisWord = basisWordOf(variants[0].native_basis)
  const caps = speciesParentViolations(variants[0].cells)
  if (caps.length) {
    console.error(`build-category-standard-pages: ${page.slug} species>parent ${caps.map((h) => `${h.species}=${h.species_value} > ${h.parent}=${h.parent_value}`).join("; ")}`)
    process.exit(1)
  }
  const claimPanel = claimPanelOf(variants[0].cells)
  const firmCount = claimPanel.filter((a) => isFirm(variants[0].cells[a])).length
  const version = page.version || META.default_version
  const vshort = version.split(" ")[0]
  // cert_doi is minted out-of-band (tools/mint-dois.mjs writes it into the rendered page's
  // frontmatter) and is NOT carried in the pages manifest — so a rebuild must PRESERVE the
  // existing page's cert_doi, never reset it to null (that reverts the cite to "registration
  // pending" and drops the DOI meta). (S-DOI-OLIVE-DOI-SURFACE-1)
  const existingMd = fs.existsSync(path.join(OUT, `${page.slug}.md`)) ? fs.readFileSync(path.join(OUT, `${page.slug}.md`), "utf8") : ""
  const existingDoi = (existingMd.match(/^cert_doi:\s*["']?([^"'\n]+?)["']?\s*$/m) || [])[1]
  const certDoi = page.cert_doi || (existingDoi && existingDoi.toLowerCase() !== "null" ? existingDoi : null)
  const otherNote = variants.length > 1
    ? `Variants on this page: ${variants.map((v) => v.label).join(" and ")}. Where a cell differs between them the Master Limit Table shows both; the derivation above is for ${variants[0].label}.`
    : ""

  const fm = [
    "---",
    `title: "${page.name} — HMTc Standard"`,
    "type: standard",
    `description: "${page.description}"`,
    `category: ${META.category}`,
    `category_name: "${META.category_name}"`,
    `product_slug: ${page.slug}`,
    "custom_page: true",
    `subcategory: "${page.name}"`,
    `firm_analytes: ${firmCount}`,
    `native_basis: ${normBasis(variants[0].native_basis)}`,
    `standard_version: "${version}"`,
    `methodology_version: "${META.methodology_version}"`,
    `variant_type: ${page.variant_type || "whole_row_platform"}`,
    ...(page.hmi_link ? [`hmi_literature_link: ${page.hmi_link}`] : []),
    `effective_date: ${META.effective_date}`,
    'author: "Karen Pendergrass"',
    // Highwire + ScholarlyArticle emit for type:standard on /standards/{slug}
    // regardless of this flag (HMTC-SCHOLAR-META-1). scholar_eligible stays
    // false so articles/briefings remain the Scholar-eligible subset.
    "scholar_eligible: false",
    `cert_doi: ${certDoi ? JSON.stringify(certDoi) : "null"}`,
    "audience: [regulator, brand-legal, retailer-compliance, certifier]",
    "rail_box:",
    '  title: "Document versions"',
    `  body: "v${vshort} · ${META.effective_date} · current. Every edition is dated and kept at a stable permalink; earlier editions and their DOIs appear here as the standard revises. Full change history below."`,
    "snapshot:",
    `  - { k: "Analytes limited", v: "${firmCount} / ${claimPanel.length}" }`,
    `  - { k: "Method", v: "${META.method_label || "Strictest government ML"}" }`,
    `  - { k: "Native basis", v: "${basisWord}" }`,
    `  - { k: "Standard version", v: "${version}" }`,
    "connections:",
    ...(page.connections || []).map((c) => `  - { label: "${c.label}", href: "${c.href}" }`),
    "---",
  ].join("\n")

  // Occurrence is keyed by the compiled RECORD slug (== aggregate product_slug),
  // which for a multi-variant page differs from the grouped page slug. Use the
  // primary variant's record, matching the derivation table above it.
  const occSection = occurrenceRationaleSection({
    evidence: OCC, toxAnchors: TOX, rowSlug: page.variants[0].record,
    analytes: PANEL.map((a) => descriptorFromCompiledCell(variants[0].cells[a], a)),
  })

  const derivation = META.derivation_mode === "child_anchor"
    ? childAnchorDerivation(variants[0], page.name)
    : META.derivation_mode === "cells_binding"
      ? cellsBindingDerivation(variants[0], page.name, META.derivation_lead)
      : derivationTable(variants[0], basisWord, page.name, otherNote, META.reconstitution_note)
  const riskFlag = renderRiskFlagForStandard({
    slug: page.variants[0].record, name: page.name, cells: variants[0].cells,
    occurrence: OCC, categoryDirName: META.compiled_dir, LINK, ACCENT,
  })
  const body = [
    methodSection(page.name, basisWord, META.method_prose),
    masterTable(variants, basisWord, tierNote, firmCount, claimPanel),
    derivation,
    occSection,
    riskFlag,
    citeSection(page.name, vshort, page.hmi_link, certDoi, META.volume_name),
  ].join("\n")

  fs.writeFileSync(path.join(OUT, `${page.slug}.md`), `${fm}\n${body}\n`)
  n++
  console.log(`  rendered ${page.slug}.md  (${variants.length} variant${variants.length > 1 ? "s" : ""})`)
}
console.log(`build-category-standard-pages [${META.category_name}]: wrote ${n} page(s)`)
