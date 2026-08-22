#!/usr/bin/env node
// build-standards-finder-context.mjs — the client payload for the interactive
// Standards Finder (/standards/finder).
//
// The Finder is a GUIDED LOOKUP over the same register the /standards page lists
// statically. It invents no data: it reads the compiled, already-generated export
// content/static/data/standards.json (written earlier in prebuild by
// build-standards-export.mjs) and emits a slim, client-fetchable projection at
// content/static/data/standards-finder-context.json (served /static/data/...).
//
// SEQUENCING: this MUST run AFTER build-standards-export.mjs in prebuild, so it
// reads the freshly regenerated standards.json rather than a stale committed copy.
//
// WHAT IT PROJECTS, per the for-brands promise (content/for-brands.md): "whether a
// standard currently exists, the product basis it uses, the analytes it evaluates,
// the published limits, the known ingredient or matrix challenges, whether your
// existing evidence may be relevant, and whether direct certification or the
// Readiness Track is the more appropriate route."
//
// It drops the heavy prose (per-cell rationale/note/reference_method) that lives on
// each standard's own page, keeping only what the guided lookup renders. "Known
// challenges" is kept HONEST and data-grounded: the tightest published limits, the
// controlled-screen and in-development flags, and pointers to the standard page's own
// "What is likely to struggle to meet this standard" section and to /hard-to-meet.
// It does not fabricate per-matrix prose.
//
// Determinism: no wall-clock stamp. Provenance is carried from standards.json's own
// standard_version + generated_commit, which change only when the data changes.

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { dedashText } from "./lib/dedash.mjs"

// Rewrite em dashes in a display string to the site's canonical punctuation, so the
// client-rendered labels match the dedashed register (dedash-content only sweeps the
// generated markdown/HTML, never this client JSON, so it is applied here).
const dd = (s) => (s == null ? s : dedashText(String(s)))

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const DATA_DIR = path.join(repoRoot, "content/static/data")
const SRC = path.join(DATA_DIR, "standards.json")
const OUT = path.join(DATA_DIR, "standards-finder-context.json")

// Canonical analyte panel order + display labels (matches the standards pages).
const ANALYTE_ORDER = ["Pb", "iAs", "tAs", "tHg", "Cd", "Cr", "Ni", "Sn", "Al"]
const ANALYTE_LABELS = {
  Pb: "Lead",
  iAs: "Inorganic arsenic",
  tAs: "Total arsenic",
  tHg: "Mercury",
  Cd: "Cadmium",
  Cr: "Chromium",
  Ni: "Nickel",
  Sn: "Tin",
  Al: "Aluminium",
}
// The per-metal reference pages the Finder links out to (never a fabricated claim).
const ANALYTE_PAGE = {
  Pb: "/analytes/lead",
  iAs: "/analytes/arsenic",
  tAs: "/analytes/arsenic",
  tHg: "/analytes/mercury",
  Cd: "/analytes/cadmium",
  Cr: "/analytes/chromium",
  Ni: "/analytes/nickel",
  Sn: "/analytes/tin",
  Al: "/analytes/aluminum",
}

// Friendly market names for the per_country jurisdiction codes that appear in the
// export. Unknown codes fall back to the raw code in the client.
const MARKET_LABELS = {
  EU: "European Union",
  US: "United States",
  UK: "United Kingdom",
  CODEX: "Codex (international reference)",
  CA: "Canada",
  AU_NZ: "Australia / New Zealand",
  "AU-NZ": "Australia / New Zealand",
  NZ: "New Zealand",
  CN: "China",
  KR: "South Korea",
  JP: "Japan",
  IN: "India",
  BR: "Brazil",
  MERCOSUR: "Mercosur",
  MX: "Mexico",
  CO: "Colombia",
  CR: "Costa Rica",
  PA: "Panama",
  PY: "Paraguay",
  UY: "Uruguay",
  GY: "Guyana",
  TT: "Trinidad and Tobago",
  CU: "Cuba",
  CH: "Switzerland",
  DE: "Germany",
  FR: "France",
  TR: "Turkey",
  IL: "Israel",
  MA: "Morocco",
  KE: "Kenya",
  GSO: "Gulf (GSO)",
  EAEU: "Eurasian Economic Union",
  ASEAN: "ASEAN",
  SG: "Singapore",
  MY: "Malaysia",
  TH: "Thailand",
  VN: "Vietnam",
  PH: "Philippines",
  ID: "Indonesia",
  TW: "Taiwan",
  HK: "Hong Kong",
  FJ: "Fiji",
  BA: "Bosnia and Herzegovina",
}

// Friendly product-basis labels for the common native_basis codes. Long descriptive
// bases (cosmetics, toys, food-contact) are already sentences; those are shortened to
// a lead clause for the control while the full text stays available on the page.
const BASIS_LABELS = {
  as_sold: "as sold",
  as_consumed: "as consumed (prepared for use)",
  as_sold_dry: "as sold, dry weight",
  drained_as_sold: "drained solids, as sold",
  finished_cosmetic_as_sold: "finished cosmetic, as sold",
  as_sold_product_content: "total product content, as sold",
  "as placed on market": "as placed on the market",
  "as sold": "as sold",
  "as consumed": "as consumed (prepared for use)",
}

function basisLabel(raw) {
  if (!raw) return "as sold"
  if (BASIS_LABELS[raw]) return BASIS_LABELS[raw]
  // A long descriptive basis sentence: take the lead clause before the first em/period
  // separator and cap it so the control stays legible. The full basis is on the page.
  const lead = String(raw).split(/\s+[—-]\s+|\.\s|;\s/)[0].trim()
  return dd(lead.length > 72 ? lead.slice(0, 69).trimEnd() + "..." : lead)
}

// Humanise a variant object key ("rice-based", "non-rice", "cow", "default") into a
// product-form label. Single-form standards collapse to a neutral label the UI hides.
const NEUTRAL_FORMS = new Set(["default", "all", "both", "_", "base", "standard"])
function formLabel(key) {
  if (!key || NEUTRAL_FORMS.has(key.toLowerCase())) return "Standard form"
  return key
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\bAnd\b/g, "and")
    .replace(/\bNon /g, "Non-")
}

function round(v) {
  if (v == null || !Number.isFinite(v)) return v
  return Math.round(v * 1000) / 1000
}

function main() {
  if (!fs.existsSync(SRC)) {
    console.error(`build-standards-finder-context: missing ${SRC} — run build-standards-export first`)
    process.exit(1)
  }
  const src = JSON.parse(fs.readFileSync(SRC, "utf8"))
  const marketsSeen = new Set()

  const products = src.standards.map((std) => {
    const variants = Object.entries(std.variants).map(([vkey, v]) => {
      const analytes = ANALYTE_ORDER.filter((code) => v.analytes[code]).map((code) => {
        const cell = v.analytes[code]
        const perMarket = {}
        if (cell.per_country) {
          for (const [mk, rec] of Object.entries(cell.per_country)) {
            if (rec && rec.value != null) {
              perMarket[mk] = round(rec.value)
              marketsSeen.add(mk)
            }
          }
        }
        const out = {
          code,
          status: cell.status, // published | in_development | not_material | control
          limit_ppb: cell.value_ppb ?? null,
          control_basis: cell.control_basis || null,
        }
        if (cell.controlling_jurisdiction) out.controlling_jurisdiction = cell.controlling_jurisdiction
        if (Object.keys(perMarket).length) out.per_market = perMarket
        if (Array.isArray(cell.forms) && cell.forms.length) {
          out.forms = cell.forms.map((f) => ({
            form: f.form,
            limit_ppb: f.value_ppb ?? null,
            jurisdiction: f.jurisdiction || null,
          }))
        }
        return out
      })

      const published = analytes.filter((a) => a.status === "published")
      const inDev = analytes.filter((a) => a.status === "in_development")
      const screens = analytes.filter(
        (a) => a.status === "not_material" || a.status === "control" || a.control_basis === "controlled-screen",
      )
      const formSplit = analytes.filter((a) => Array.isArray(a.forms) && a.forms.length)

      // "Known challenges", kept honest: the tightest firm limits (lowest ppb) are
      // where the numbers bite, plus the controlled-screen and in-development flags.
      // The narrative "why" lives on the standard page's struggle section, linked.
      const tightest = published
        .filter((a) => a.limit_ppb != null)
        .sort((a, b) => a.limit_ppb - b.limit_ppb)
        .slice(0, 3)
        .map((a) => ({ code: a.code, limit_ppb: a.limit_ppb }))

      // Eligibility: firm = every applicable cell published; partial = some firm, some
      // still in development; forming = none firm yet (the page is in force, cells open).
      let eligibility
      if (published.length === 0) eligibility = "forming"
      else if (inDev.length === 0) eligibility = "firm"
      else eligibility = "partial"

      return {
        key: vkey,
        form: formLabel(vkey),
        basis: basisLabel(v.native_basis || std.native_basis),
        eligibility,
        firm_count: published.length,
        in_development: inDev.map((a) => a.code),
        controlled_screens: screens.map((a) => a.code),
        form_split: formSplit.map((a) => a.code),
        tightest,
        analytes,
      }
    })

    return {
      slug: std.product_slug,
      name: dd(std.name),
      category: std.category,
      category_name: dd(std.category_name),
      page_url: `/standards/${std.product_slug}`,
      standard_version: std.current_version || std.standard_version || null,
      single_form: variants.length === 1,
      variants,
    }
  })

  // Category index, sorted by category number, each with its product count.
  const catMap = new Map()
  for (const p of products) {
    if (!catMap.has(p.category)) catMap.set(p.category, { num: p.category, name: dd(p.category_name), product_count: 0 })
    catMap.get(p.category).product_count += 1
  }
  const categories = [...catMap.values()].sort((a, b) => a.num - b.num)

  const markets = [...marketsSeen]
    .sort()
    .map((code) => ({ code, label: MARKET_LABELS[code] || MARKET_LABELS[code.replace(/-/g, "_")] || code }))

  const context = {
    schema: "hmtc-standards-finder/1.0",
    note: "Guided-lookup projection of standards.json. Not the citable dataset; see /static/data/standards.json.",
    source_standard_version: src.standard_version || null,
    source_generated_commit: src.generated_commit || null,
    unit: "ppb (ug/kg)",
    analyte_order: ANALYTE_ORDER,
    analyte_labels: ANALYTE_LABELS,
    analyte_pages: ANALYTE_PAGE,
    markets,
    categories,
    products: products.sort((a, b) => a.category - b.category || a.name.localeCompare(b.name)),
  }

  fs.writeFileSync(OUT, JSON.stringify(context) + "\n")
  const bytes = fs.statSync(OUT).size
  console.log(
    `build-standards-finder-context: wrote ${path.relative(repoRoot, OUT)} — ` +
      `${products.length} products, ${categories.length} categories, ${markets.length} markets, ` +
      `${(bytes / 1024).toFixed(0)} KB`,
  )
}

main()
