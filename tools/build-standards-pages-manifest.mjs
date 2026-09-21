#!/usr/bin/env node
// build-standards-pages-manifest.mjs — generate data/standards/cat<N>-pages.json from a compiled
// standards directory.
//
// The renderer (tools/build-category-standard-pages.mjs) consumes a per-category manifest: a `_meta`
// block plus one `pages[]` entry per published standard page. Those manifests were hand-authored while
// categories shipped one or two at a time. That does not scale to the remaining categories, which add
// roughly two hundred rows across fifteen volumes, and hand-authoring is where per-page drift (a stale
// panel, a mismatched compiled_dir, an effective date that disagrees with its siblings) gets in.
//
// So the manifest is generated from the two artifacts that already carry the facts:
//   - the compiled records in data/standards/<compiled_dir>/*.json (the frozen derivations; every
//     number in them traces to a named row of the index repo's regulatory register)
//   - the index repo's category config, for the category name, method label and basis prose
// Nothing numeric is authored here, and nothing numeric is authored in the manifest it writes: the
// renderer reads values only from the compiled records.
//
// Descriptions are composed from each record's own `name`, `native_basis_label` and `scope_note`, so a
// page's description cannot claim a basis the record does not declare.
//
// Usage:
//   node tools/build-standards-pages-manifest.mjs --compiled=cat11-compiled \
//     [--config=<path to the index repo catN-config.json>] \
//     [--effective=2026-08-17] [--version="1.0 (2026-08-17)"] [--out=data/standards/cat11-pages.json]
//     [--check]
//
// --check writes nothing and exits non-zero if the on-disk manifest differs from a fresh generation.

import fs from "node:fs"
import path from "node:path"

const REPO = process.cwd()
const args = new Map(process.argv.slice(2).flatMap((a) => (a.startsWith("--") ? [a.slice(2).split("=").concat([""]).slice(0, 2)] : [])))
const COMPILED = args.get("compiled")
if (!COMPILED) { console.error("build-standards-pages-manifest: --compiled=<dir name under data/standards> required"); process.exit(2) }
const CHECK = args.has("check")
const EFFECTIVE = args.get("effective") || "2026-08-17"
const VERSION = args.get("version") || `1.0 (${EFFECTIVE})`

// Optional leftover panel-grouping lists on category _meta. Not status architecture.
const TIER1 = ["Pb", "iAs", "tHg", "MeHg", "Cd"]
const PANEL_ORDER = ["Pb", "iAs", "tAs", "tHg", "MeHg", "Cd", "Cr-VI", "Ni", "Sn", "Al", "Cr"]

const compiledDir = path.join(REPO, "data/standards", COMPILED)
if (!fs.existsSync(compiledDir)) { console.error(`build-standards-pages-manifest: ${COMPILED} not found under data/standards/`); process.exit(2) }

const records = fs.readdirSync(compiledDir)
  .filter((f) => f.endsWith(".json") && !f.startsWith("_"))
  .sort()
  .map((f) => JSON.parse(fs.readFileSync(path.join(compiledDir, f), "utf8")))
  .filter((r) => r.slug && (r.cells || r.variants))

if (!records.length) { console.error(`build-standards-pages-manifest: no standard records in ${COMPILED}`); process.exit(2) }

const category = records[0].category
const categoryName = records[0].category_name
if (!category || !categoryName) {
  console.error("build-standards-pages-manifest: compiled records carry no category/category_name — recompile with a _category block")
  process.exit(2)
}

// The category config supplies the method prose. It lives in the index repo, so the path is passed in;
// without it the manifest still generates, carrying only the method label the records themselves record.
let cfg = null
const cfgPath = args.get("config")
if (cfgPath && fs.existsSync(cfgPath)) cfg = JSON.parse(fs.readFileSync(cfgPath, "utf8"))
const cat = (cfg && cfg._category) || {}

const panel = PANEL_ORDER.filter((a) => records.some((r) => {
  const cells = r.cells || Object.assign({}, ...Object.values(r.variants || {}))
  return a in cells
}))

// Prose comes from the config's PUBLIC method fields, so the page and the derivation report cannot
// tell different stories about how the limits were set. The config's `_doc` is deliberately excluded:
// it is internal staff documentation (it names the firewall, the compiler, and the file layout) and
// publishing it would put staff-facing text on a public certification page.
const methodProse = [cat.method_note, cat.public_prose]
  .filter((s) => typeof s === "string" && s.trim().length > 40)
  .map((s) => s.trim())

const meta = {
  category,
  category_name: categoryName,
  volume_name: categoryName,
  panel,
  tier1: TIER1.filter((a) => panel.includes(a)),
  tier2: panel.filter((a) => !TIER1.includes(a)),
  tier_footnote: "",
  reconstitution_note: false,
  compiled_dir: COMPILED,
  method_label: cat.method_label || records[0].method || "Strictest applicable government ML",
  methodology_version: "Method v2.0 — government-limit default (CLAUDE.md Part 19, Governing Principles v2.0)",
  ...(cat.basis_family ? { basis_family: cat.basis_family } : {}),
  ...(methodProse.length ? { method_prose: methodProse } : {}),
  effective_date: EFFECTIVE,
  default_version: VERSION,
}

const CONNECTIONS = [
  { label: "Method v1 to Method v2", href: "/program/method" },
  { label: "How limits are derived", href: "/program/structure" },
  { label: "Regulation references (source documents)", href: "/regulations" },
  { label: "All HMTc standards", href: "/standards" },
]

// A record with no numeric cell is still a standard in force — every analyte is under mandatory
// control or a substantiated not-material determination — and the description has to say that
// honestly rather than imply a ceiling the page does not publish.
const isFirm = (c) => !!(c && c.value != null && ["gov", "read_across", "special", "form_split"].includes(c.type))

function describe(rec) {
  const cells = rec.cells || Object.assign({}, ...Object.values(rec.variants || {}))
  const firm = Object.values(cells).filter(isFirm).length
  const basis = rec.native_basis_label || rec.native_basis || "the product's native basis"
  const parts = [
    `The Heavy Metal Tested & Certified heavy-metal-safety standard for ${lowerFirst(rec.name)} in ${categoryName}, evaluated on ${lowerFirst(basis)}.`,
  ]
  if (firm === 0) {
    parts.push("No government sets a numeric heavy-metal limit for this product form, so every panel analyte is held under mandatory analytical control or a substantiated not-material determination rather than an invented ceiling.")
  } else {
    parts.push(`${firm} of ${Object.keys(cells).length} panel analytes publish a numeric limit taken from the strictest applicable government maximum; the remainder are held under mandatory control or a substantiated not-material determination.`)
  }
  return parts.join(" ")
}
const lowerFirst = (s) => (typeof s === "string" && s ? s[0].toLowerCase() + s.slice(1) : s)

const pages = records.map((rec) => ({
  slug: rec.slug,
  name: rec.name,
  description: describe(rec),
  version: VERSION,
  connections: CONNECTIONS,
  variants: [{ label: "all", variant: "default", record: rec.slug }],
}))

const doc = {
  _doc: `Per-page metadata for the Category-${category} (${categoryName}) standard renderer (tools/build-category-standard-pages.mjs). GENERATED by tools/build-standards-pages-manifest.mjs from data/standards/${COMPILED} — do not hand-edit. Numbers come from the compiled records, which are frozen derivations from the index repo's deterministic government-limit compiler; nothing numeric is authored here.`,
  _meta: meta,
  pages,
}

const outArg = args.get("out") || `data/standards/cat${category}-pages.json`
const outPath = path.isAbsolute(outArg) ? outArg : path.join(REPO, outArg)
const next = JSON.stringify(doc, null, 2) + "\n"

if (CHECK) {
  const prev = fs.existsSync(outPath) ? fs.readFileSync(outPath, "utf8") : ""
  if (prev !== next) {
    console.error(`build-standards-pages-manifest --check: ${path.relative(REPO, outPath)} is stale`)
    process.exit(1)
  }
  console.log(`build-standards-pages-manifest --check: ${path.relative(REPO, outPath)} is current`)
  process.exit(0)
}

fs.writeFileSync(outPath, next)
console.log(`wrote ${path.relative(REPO, outPath)} — category ${category} (${categoryName}), ${pages.length} page(s), ${panel.length} analytes`)
