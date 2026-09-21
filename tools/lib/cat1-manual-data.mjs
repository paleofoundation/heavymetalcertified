// cat1-manual-data.mjs — the SINGLE source of the Category-1 (Infant and Child
// Foods) manual's numbers. Both the web manual renderer (build-cat1-manual.mjs)
// and the PDF renderer (build-cat1-manual-pdf.mjs) import from here, so the
// downloadable PDF can never drift from the web master matrix: they are the same
// arrays. The per-subcategory derivation extractor mirrors, value-for-value, the
// /standards/<slug> derivation the web renderer (build-cat1-standard-pages.mjs)
// prints, so a regulator sees the identical government-by-government table in
// either place.
//
// Nothing is authored here. Every number is read from the frozen compiled records
// (data/standards/cat1-compiled/<record>.json) and the page wiring
// (data/standards/cat1-pages.json). This module only reshapes them.

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..")
const COMPILED = path.join(REPO, "data/standards/cat1-compiled")
const PAGES = JSON.parse(fs.readFileSync(path.join(REPO, "data/standards/cat1-pages.json"), "utf8"))

// ── analyte panel ────────────────────────────────────────────────────────────
// Order and column labels are the web master matrix's (build-cat1-manual.mjs).
// `full` is the derivation renderer's (build-cat1-standard-pages.mjs).
// Nine cells: the eight-total laboratory panel required by the canonical analyte contract
// (Pb, Cd, tAs, tHg, Ni, Sn, Al, total Cr) plus iAs, Cat 1's core species cell. A species
// cell is additional to its parent total and never substitutes for it, so tAs and iAs both
// appear. This array must stay in step with PANEL in build-cat1-standard-pages.mjs.
export const ANALYTES = [
  { key: "Pb", col: "Lead", full: "Lead (Pb)" },
  { key: "iAs", col: "iAs", full: "Inorganic arsenic (iAs)" },
  { key: "tAs", col: "tAs", full: "Total arsenic (tAs)" },
  { key: "tHg", col: "Hg", full: "Mercury (tHg)" },
  { key: "Cd", col: "Cd", full: "Cadmium (Cd)" },
  { key: "Cr", col: "Cr", full: "Total chromium (Cr)" },
  { key: "Ni", col: "Ni", full: "Nickel (Ni)" },
  { key: "Sn", col: "Sn", full: "Tin (Sn)" },
  { key: "Al", col: "Al", full: "Aluminium (Al)" },
]
export const PANEL = ANALYTES.map((a) => a.key)

// ── jurisdiction wiring (from build-cat1-standard-pages.mjs) ──────────────────
// This map is COPIED VERBATIM from build-cat1-standard-pages.mjs so the derivation
// "Binds" column reads identically to the web page. Jurisdictions absent from it
// (e.g. IL, FJ) fall back to their raw code exactly as the web renderer does — the
// tHg binding on infant formula shows "IL", not "Israel", because the web shows "IL".
export const JUR_LABEL = {
  EU: "EU", UK: "UK", CODEX: "Codex", CA: "Canada", CN: "China", IN: "India",
  BR: "Brazil", GSO: "GSO", "AU-NZ": "AU/NZ", US: "FDA", "US-CA": "US-CA",
  "US-WA": "US-WA", EC: "Ecuador", MX: "Mexico", TR: "Türkiye", international: "Intl",
}
// The derivation table shows exactly these columns, in this order, when present —
// matching the web /standards/<slug> derivation (build-cat1-standard-pages.mjs).
export const JUR_ORDER = ["EU", "UK", "CODEX", "CA", "CN", "IN", "BR", "GSO", "AU-NZ", "US"]

// ── record cache ─────────────────────────────────────────────────────────────
const recCache = new Map()
const readRec = (r) => {
  if (!recCache.has(r)) recCache.set(r, JSON.parse(fs.readFileSync(path.join(COMPILED, `${r}.json`), "utf8")))
  return recCache.get(r)
}

// The nine subcategory rows, in the web master matrix's order. cat1-pages.json is
// the whole set (infant-formula-powder is pages[0]); there is no separate hard-
// coded row — a leftover second infant-formula-powder row was the source of the
// "ten rows under a nine-subcategory header" duplication this module removes.
export const ROWS = PAGES.pages.map((p) => ({ slug: p.slug, name: p.name, variants: p.variants, variant_type: p.variant_type }))

// display value for a single compiled cell (verbatim from build-cat1-manual.mjs)
const cell = (c) => (c == null ? "—" : c.value == null ? (c.type === "not_material" ? "n/m" : "—") : String(c.value))

// ── master matrix ────────────────────────────────────────────────────────────
// One row's nine display values + basis. Split cells ("250 cow / 400 soy",
// "100 rice-based / 20 non-rice") are produced exactly as the web renderer does:
// collapse to one value when every variant agrees, else join "<value> <label>".
export function masterRow(row) {
  const parts = row.variants.map((v) => ({ label: v.label, rec: readRec(v.record), variant: v.variant }))
  const cells = {}
  for (const a of PANEL) {
    const vals = parts.map((p) => ({ label: p.label, v: cell(p.rec.variants[p.variant][a]) }))
    const uniq = [...new Set(vals.map((x) => x.v))]
    cells[a] = uniq.length === 1 ? uniq[0] : vals.map((x) => `${x.v} ${x.label}`).join(" / ")
  }
  const basis = parts[0].rec.native_basis === "as_sold" ? "as sold" : "as consumed"
  return { slug: row.slug, name: row.name, cells, basis }
}

export function masterMatrix() {
  return ROWS.map(masterRow)
}

// ── per-subcategory derivation ───────────────────────────────────────────────
// Mirrors build-cat1-standard-pages.mjs derivationTable: the primary variant's
// government-by-government numbers, the strictest-binds column, and the three
// controlled-cell footnotes. Returns plain data so the PDF renderer can lay it
// out without re-deriving anything.
export function pageDerivation(pageSlug) {
  const page = PAGES.pages.find((p) => p.slug === pageSlug)
  if (!page) throw new Error(`cat1-manual-data: no page "${pageSlug}"`)
  const variants = page.variants.map((v) => {
    const rec = readRec(v.record)
    return { label: v.label, cells: rec.variants[v.variant], native_basis: rec.native_basis }
  })
  const primary = variants[0]
  const basisWord = primary.native_basis === "as_sold" ? "as-sold" : "as-consumed"

  // Columns: canonical order, only jurisdictions that appear in any primary cell.
  const present = new Set()
  for (const a of PANEL) {
    const c = primary.cells[a]
    if (c && c.per_country) Object.keys(c.per_country).forEach((j) => present.add(j))
  }
  const cols = JUR_ORDER.filter((j) => present.has(j))

  let usesConverted = false
  let usesReadAcross = false
  let usesNotMaterial = false

  const rows = ANALYTES.map((meta) => {
    const c = primary.cells[meta.key]
    const perCountry = {}
    for (const j of cols) {
      const pc = c && c.per_country && c.per_country[j]
      if (!pc) { perCountry[j] = null; continue }
      if (pc.converted) usesConverted = true
      perCountry[j] = { value: pc.value, converted: !!pc.converted }
    }
    let hmtc, binds, type
    if (c && c.type === "read_across") { hmtc = String(c.value); binds = "read-across"; type = "read_across"; usesReadAcross = true }
    else if (c && c.type === "not_material") { hmtc = "n/m"; binds = "controlled"; type = "not_material"; usesNotMaterial = true }
    else { hmtc = String(c.value); binds = JUR_LABEL[c.binding_jurisdiction] || c.binding_jurisdiction; type = "gov" }
    return { key: meta.key, analyte: meta.full, perCountry, hmtc, binds, type, bindingJur: c ? c.binding_jurisdiction : null }
  })

  const variantNote = variants.length > 1
    ? `Variants on this page: ${variants.map((v) => v.label).join(" and ")}. Where a cell differs between them the master matrix shows both; the derivation below is for ${primary.label}.`
    : ""

  return {
    slug: page.slug,
    name: page.name,
    basisWord,
    cols,
    rows,
    variantLabels: variants.map((v) => v.label),
    primaryLabel: primary.label,
    variantNote,
    footnotes: { converted: usesConverted, readAcross: usesReadAcross, notMaterial: usesNotMaterial },
  }
}

export function allDerivations() {
  return ROWS.map((r) => pageDerivation(r.slug))
}
