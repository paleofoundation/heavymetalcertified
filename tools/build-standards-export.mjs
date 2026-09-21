#!/usr/bin/env node
/**
 * build-standards-export.mjs — the machine-readable open-data surface for the
 * published HMTc certification standards.
 *
 * WHAT IT PUBLISHES
 * -----------------
 * A versioned, self-describing bundle under content/static/data/ (served at
 * /static/data/… via Quartz's Assets emitter). This is the Daubert-grade,
 * machine-citable statement of the HMTc standards: per product subcategory ×
 * variant × analyte — the published limit, its native basis, the control basis
 * (which government instrument sets it), the controlling jurisdiction, and, for
 * government-limit cells, the full per-country table of sovereign limits the
 * value was selected from.
 *
 *   content/static/data/standards.json — nested, one object per published
 *       standard (a live /standards/<slug> page) with variants → analytes.
 *   content/static/data/standards.csv  — tidy/long, one row per
 *       standard × variant × analyte.
 *   content/static/data/catalog.json   — a schema.org DataCatalog manifest.
 *
 * FIREWALL (CLAUDE.md Part 2 / Part 19)
 * -------------------------------------
 * This is the CERTIFICATION side of the firewall. It publishes the HMTc standard
 * VALUES and the government instruments behind them — the certifier's own asset.
 * It deliberately does NOT export the workbench-only pooled percentiles
 * (precise_ppb / P97 / P45 / clean-dirty). Those derivation internals stay in the
 * workbench. The literature occurrence evidence the standards are checked against
 * lives on heavymetalindex.com and is cited one-way (see the `hmi_literature_link`
 * on every record and the /data catalog page).
 *
 * SOURCE OF TRUTH / NO DRIFT
 * --------------------------
 * Values come from the SAME compiled records + catalog the standards PAGES are
 * generated from (data/standards/cat1-compiled, seafood-compiled, and
 * hmtc_standards_catalog.json), read through the SAME page manifests
 * (cat1-pages.json, seafood-pages.json). Because both the page and the export
 * derive from those files, the drift check asserts every firm exported number
 * appears on its rendered content/standards/<slug>.md page; a mismatch fails the
 * build.
 *
 * DATA MODELS (two of them — see the cert data-model inventory)
 * ------------------------------------------------------------
 *  - COMPILED records → the 9 cat1 + 7 seafood custom pages. Per-analyte `type`
 *    is `gov` (government-limit default), `read_across` (nearest government value),
 *    or `not_material` (controlled screen, value=null). A cell is a firm published
 *    value iff cell.value != null.
 *  - CATALOG rows → the 10 chocolate/honey/salt/oils/… pages. A cell is firm iff
 *    cell.status === "published" (take published_limit_ppb). Everything else is
 *    honestly in_development. The forbidden pooled percentiles are never read.
 *
 * USAGE
 *   node tools/build-standards-export.mjs           # emit the bundle (+ drift check)
 *   node tools/build-standards-export.mjs --check   # drift check only, emit nothing
 *   node tools/build-standards-export.mjs --warn-only
 */

import fs from "node:fs"
import path from "node:path"
import { execSync } from "node:child_process"

const repoRoot = process.cwd()
const CHECK = process.argv.includes("--check")
const WARN_ONLY = process.argv.includes("--warn-only")

const STD_DIR = path.join(repoRoot, "data/standards")
const CONTENT_STD = path.join(repoRoot, "content/standards")
const OUT_DIR = path.join(repoRoot, "content/static/data")

const SITE = "https://heavymetalcertified.com"
const HMI = "https://heavymetalindex.com"
const SCHEMA_VERSION = "1.0.0"

// Network-locked to All-rights-reserved (ORDER S-DOI-CITE-LICENSE-1): no CC BY on any cert surface,
// this compiled dataset included. Standards remain free to READ on the site; reuse of the dataset,
// derivation methodology, and compiled values requires written permission.
const LICENSE = {
  terms:
    "© 2026 Institute of Contaminant Standards / Heavy Metal Certified. All rights reserved. The published HMTc standards are free to read on heavymetalcertified.com; the derivation methodology and this compiled dataset are the work of Paleo Certified, Inc., operating as the Institute of Contaminant Standards, and may not be reproduced or redistributed without written permission.",
  attribution:
    "Heavy Metal Tested & Certified (HMTc), Institute of Contaminant Standards. Cite a standard by its Standard No. (cert_doi) at https://doi.org/<cert_doi>.",
  contact: "karen@paleofoundation.com",
}

const generatedAt = new Date().toISOString()
const generatedCommit = safeGitCommit()

// ---------------------------------------------------------------------------
// Load sources
// ---------------------------------------------------------------------------
const catalog = readJson(path.join(STD_DIR, "hmtc_standards_catalog.json"))
const METHODOLOGY_VERSION = catalog.methodology_version

const standards = []
const customSlugs = new Set()

// --- COMPILED: every category manifest (cat1 + each `<cat>-pages.json`) ---
// Data-driven so a newly-published category (Cat-3 grains, Cat-6 seafood, …) is
// picked up automatically. cat1-pages.json predates the generalized manifest and
// carries no `_meta`; every later category manifest declares `_meta.compiled_dir`
// + `_meta.category`.
const manifestFiles = fs
  .readdirSync(STD_DIR)
  .filter((f) => f.endsWith("-pages.json"))
  .sort()
for (const mf of manifestFiles) {
  const manifest = readJson(path.join(STD_DIR, mf))
  const meta = manifest._meta || {}
  let compiledDir, catInfo
  if (mf === "cat1-pages.json") {
    compiledDir = "cat1-compiled"
    catInfo = { category: 1, category_name: "Infant and Child Foods" }
  } else {
    compiledDir = meta.compiled_dir
    catInfo = { category: meta.category ?? null, category_name: meta.category_name ?? null, panel: meta.panel }
  }
  if (!compiledDir || !Array.isArray(manifest.pages)) continue
  for (const page of manifest.pages) {
    customSlugs.add(page.slug)
    standards.push(buildCompiledStandard(page, compiledDir, catInfo))
  }
}

// --- CATALOG: rows not superseded by a custom page ---
for (const row of catalog.rows) {
  if (customSlugs.has(row.product_slug)) continue // owned by a custom page above
  standards.push(buildCatalogStandard(row))
}

standards.sort((a, b) => (a.category - b.category) || a.product_slug.localeCompare(b.product_slug))

// ---------------------------------------------------------------------------
// Drift check: every firm exported number must appear on its rendered page.
// ---------------------------------------------------------------------------
const { problems, warnings } = driftCheck(standards)
if (warnings.length) {
  console.warn(`build-standards-export: ${warnings.length} note(s):`)
  for (const w of warnings.slice(0, 10)) console.warn(`  · ${w}`)
}
if (problems.length) {
  console.error(`build-standards-export: DRIFT — ${problems.length} firm value(s) not found on their rendered standard page:`)
  for (const p of problems.slice(0, 40)) console.error(`  - ${p}`)
  if (!WARN_ONLY) process.exit(1)
} else {
  console.log(`build-standards-export: drift check clean (${standards.length} standards verified against their pages).`)
}
if (CHECK) process.exit(0)

// ---------------------------------------------------------------------------
// Emit
// ---------------------------------------------------------------------------
const firmCells = countFirm(standards)
const standardsDoc = {
  schema_version: SCHEMA_VERSION,
  dataset: "hmtc-standards",
  title: "Heavy Metal Tested & Certified — published standards",
  description:
    "The HMTc certification limits per product subcategory, variant, and analyte: the published limit in ppb on the row's native basis, the control basis (government-limit default, government read-across, or controlled screen), the controlling jurisdiction and instrument, and — for government-limit cells — the per-country table of sovereign limits the value was selected from. Values are set by Method v2.0 (strictest applicable government maximum level, selective occurrence for priority toxics and unregulated cells).",
  unit: "ppb (µg/kg)",
  methodology_version: METHODOLOGY_VERSION,
  standard_version: catalog.standard_version ?? null,
  generated_at: generatedAt,
  generated_commit: generatedCommit,
  license: LICENSE,
  evidence_basis: `Literature occurrence evidence the standards are checked against is reported independently at ${HMI} and cited one-way; see each record's hmi_literature_link.`,
  standard_count: standards.length,
  firm_analyte_cells: firmCells,
  standards,
}

const standardsJsonStr = JSON.stringify(standardsDoc, null, 2) + "\n"
const standardsCsvStr = standardsCsv(standards)

const sizes = {
  standardsJson: Buffer.byteLength(standardsJsonStr),
  standardsCsv: Buffer.byteLength(standardsCsvStr),
}
const catalogDoc = buildCatalog(standardsDoc, sizes)

fs.mkdirSync(OUT_DIR, { recursive: true })
fs.writeFileSync(path.join(OUT_DIR, "standards.json"), standardsJsonStr)
fs.writeFileSync(path.join(OUT_DIR, "standards.csv"), standardsCsvStr)
fs.writeFileSync(path.join(OUT_DIR, "catalog.json"), JSON.stringify(catalogDoc, null, 2) + "\n")
console.log(
  `build-standards-export: wrote content/static/data/standards.{json,csv} + catalog.json — ` +
    `${standards.length} standards, ${firmCells} firm analyte cells.`,
)

// ===========================================================================
// Builders
// ===========================================================================
function buildCompiledStandard(page, compiledSubdir, extra) {
  const versionHistory = readJsonSafe(path.join(STD_DIR, "version-history", `${page.slug}.json`))
  const variants = {}
  let methodNote = null
  let nativeBasis = null
  for (const v of page.variants || []) {
    const rec = readJsonSafe(path.join(STD_DIR, compiledSubdir, `${v.record}.json`))
    if (!rec) continue
    methodNote = methodNote || rec.method
    nativeBasis = nativeBasis || rec.native_basis
    // Cat 33/34 emit a flat `cells` object (no `variants`); treat it as the sole "both" variant.
    const rvars = rec.variants || { both: rec.cells }
    const variantObj = rvars[v.variant] || rvars[Object.keys(rvars)[0]] || {}
    const analytes = {}
    for (const [analyte, cell] of Object.entries(variantObj)) {
      analytes[analyte] = normalizeCompiledCell(cell, rec.native_basis)
    }
    variants[v.label] = { variant_key: v.variant, record: v.record, native_basis: rec.native_basis, analytes }
  }
  return {
    product_slug: page.slug,
    name: page.name,
    category: extra.category,
    category_name: extra.category_name,
    native_basis: nativeBasis,
    source_model: "compiled",
    standard_version: page.version ?? null,
    current_version: versionHistory?.current_version ?? null,
    methodology_version: methodNote ?? METHODOLOGY_VERSION,
    page_url: `${SITE}/standards/${page.slug}`,
    hmi_literature_link: page.hmi_link ?? null,
    variants,
  }
}

function normalizeCompiledCell(cell, nativeBasis) {
  if (cell.type === "subsumed") {
    return {
      status: "bounded_by_parent",
      value_ppb: null,
      binding_total_ppb: cell.binding_total ?? null,
      subsumed_by: cell.subsumed_by ?? null,
      native_basis: nativeBasis,
      control_basis: "bounded-by-parent-total",
      rationale: trimText(cell.label) || `${cell.subsumed_by || "parent"} ceiling binds; no separate species ML is published.`,
    }
  }
  if (cell.type === "not_material") {
    return {
      status: "not_material",
      value_ppb: null,
      native_basis: nativeBasis,
      control_basis: "controlled-screen",
      rationale: trimText(cell.control),
      reference_method: cell.reference_method ?? null,
    }
  }
  if (cell.type === "read_across") {
    return {
      status: "published",
      value_ppb: cell.value ?? null,
      value_exact_ppb: cell.value_exact ?? null,
      native_basis: nativeBasis,
      basis_note: cell.basis_note ?? null,
      control_basis: "government-read-across",
      rationale: cell.label ?? "Nearest government value read across from a comparable regulated product; no government regulates this exact analyte for this product.",
      controlling_jurisdiction: cell.source_jurisdiction ?? null,
      controlling_instrument: cell.source_id ?? null,
    }
  }
  // cells-schema (Cat 33/34): cell_kind / provenance instead of `type`.
  if (cell.cell_kind === "form_split") {
    return {
      status: "published",
      value_ppb: cell.value ?? cell.strictest_form_value ?? null,
      native_basis: nativeBasis,
      control_basis: "government-limit-form-split",
      rationale: "Strictest applicable government maximum level; the ceiling is set by product sub-form (each form's exact value is on the page derivation).",
      controlling_jurisdiction: (cell.forms && cell.forms[0] && cell.forms[0].binding_jurisdiction) ?? null,
      forms: (cell.forms || []).map((f) => ({ form: f.form, value_ppb: f.value, jurisdiction: f.binding_jurisdiction ?? null })),
    }
  }
  if (cell.type == null && cell.provenance === "control") {
    return {
      status: "control",
      value_ppb: null,
      native_basis: nativeBasis,
      control_basis: "controlled-screen",
      rationale: trimText(cell.rationale),
      reference_method: cell.reference_method ?? null,
    }
  }
  if (cell.type == null && cell.provenance === "read-across") {
    return {
      status: "published",
      value_ppb: cell.value ?? null,
      value_exact_ppb: cell.value_exact ?? null,
      native_basis: nativeBasis,
      control_basis: "government-read-across",
      rationale: cell.label ?? null,
      controlling_jurisdiction: cell.source_jurisdiction ?? null,
      controlling_instrument: cell.source_id ?? null,
    }
  }
  // default: gov (variants-schema `type: gov`, or cells-schema `cell_kind: gov`)
  return {
    status: "published",
    value_ppb: cell.value ?? null,
    value_exact_ppb: cell.value_exact ?? null,
    native_basis: nativeBasis,
    basis_note: cell.basis_note ?? null,
    control_basis: "government-limit",
    rationale: "Strictest applicable government maximum level, converted to the row's native basis (Method v2.0 default).",
    controlling_jurisdiction: cell.binding_jurisdiction ?? null,
    controlling_instrument: cell.binding_id ?? null,
    per_country: cell.per_country && Object.keys(cell.per_country).length ? cell.per_country : undefined,
  }
}

function buildCatalogStandard(row) {
  const versionHistory = readJsonSafe(path.join(STD_DIR, "version-history", `${row.product_slug}.json`))
  const analytes = {}
  for (const [analyte, cell] of Object.entries(row.analytes || {})) {
    if (cell.status === "published" && cell.published_limit_ppb != null) {
      analytes[analyte] = {
        status: "published",
        value_ppb: cell.published_limit_ppb,
        native_basis: cell.native_basis ?? row.native_basis ?? null,
        control_basis: cell.rationale_tag || "regulatory-alignment",
        rationale_tag: cell.rationale_tag ?? null,
        controlling_instrument: cell.regulatory_cap_source || null,
        regulatory_cap_ppb: cell.regulatory_cap_ppb ?? null,
      }
    } else if (cell.in_scope) {
      analytes[analyte] = {
        status: "in_development",
        value_ppb: null,
        native_basis: cell.native_basis ?? row.native_basis ?? null,
        control_basis: "in-development",
        note: trimText(cell.evidence_state_note),
      }
    }
    // out-of-scope analytes are omitted (not part of this subcategory's panel)
  }
  return {
    product_slug: row.product_slug,
    name: row.subcategory ?? row.product_slug,
    category: row.vertical?.category ?? null,
    category_name: row.vertical?.category_name ?? null,
    native_basis: row.native_basis ?? null,
    source_model: "catalog",
    standard_version: row.standard_version ?? catalog.standard_version ?? null,
    current_version: versionHistory?.current_version ?? null,
    methodology_version: METHODOLOGY_VERSION,
    page_url: `${SITE}/standards/${row.product_slug}`,
    hmi_literature_link: row.hmi_literature_link ?? null,
    variants: { all: { variant_key: "all", analytes } },
  }
}

// ===========================================================================
// Drift check
// ===========================================================================
function driftCheck(list) {
  const problems = []
  const warnings = []
  for (const std of list) {
    const pagePath = path.join(CONTENT_STD, `${std.product_slug}.md`)
    if (!fs.existsSync(pagePath)) {
      warnings.push(`${std.product_slug}: no rendered content/standards/${std.product_slug}.md to verify against`)
      continue
    }
    const page = fs.readFileSync(pagePath, "utf8")
    for (const [vlabel, v] of Object.entries(std.variants)) {
      for (const [analyte, cell] of Object.entries(v.analytes)) {
        if (cell.status !== "published" || cell.value_ppb == null) continue
        // The page renders the display value (integer for gov MLs); a multi-variant
        // cell renders "<v1> <label> / <v2> <label>", so a substring match on the
        // number is the robust "is this value present on the page" test.
        if (!page.includes(String(cell.value_ppb))) {
          problems.push(`${std.product_slug} [${vlabel}] ${analyte}=${cell.value_ppb} not found on its page`)
        }
      }
    }
  }
  return { problems, warnings }
}

function countFirm(list) {
  let n = 0
  for (const std of list) for (const v of Object.values(std.variants)) for (const c of Object.values(v.analytes)) if (c.status === "published" && c.value_ppb != null) n++
  return n
}

// ===========================================================================
// CSV
// ===========================================================================
function standardsCsv(list) {
  const header = [
    "product_slug",
    "standard_name",
    "category",
    "category_name",
    "variant",
    "analyte",
    "status",
    "value_ppb",
    "native_basis",
    "control_basis",
    "rationale_tag",
    "controlling_jurisdiction",
    "controlling_instrument",
    "regulatory_cap_ppb",
    "standard_version",
    "page_url",
    "hmi_literature_link",
  ]
  const rows = [header]
  for (const std of list) {
    for (const [vlabel, v] of Object.entries(std.variants)) {
      for (const [analyte, c] of Object.entries(v.analytes)) {
        rows.push([
          std.product_slug,
          std.name,
          std.category ?? "",
          std.category_name ?? "",
          vlabel,
          analyte,
          c.status,
          c.value_ppb ?? "",
          c.native_basis ?? std.native_basis ?? "",
          c.control_basis ?? "",
          c.rationale_tag ?? "",
          c.controlling_jurisdiction ?? "",
          c.controlling_instrument ?? "",
          c.regulatory_cap_ppb ?? "",
          std.standard_version ?? "",
          std.page_url,
          std.hmi_literature_link ?? "",
        ])
      }
    }
  }
  return toCsv(rows)
}

// ===========================================================================
// Catalog manifest
// ===========================================================================
function buildCatalog(doc, sizes) {
  const base = `${SITE}/static/data`
  const version = generatedCommit ? `${isoDay(generatedAt)}+${generatedCommit.slice(0, 12)}` : isoDay(generatedAt)
  return {
    schema_version: SCHEMA_VERSION,
    "@context": "https://schema.org",
    "@type": "DataCatalog",
    "@id": `${SITE}/data#catalog`,
    name: "Heavy Metal Tested & Certified — standards open data",
    url: `${SITE}/data`,
    description:
      "Machine-readable HMTc certification standards: the published limit per product subcategory, variant, and analyte, with basis, control, controlling jurisdiction and instrument. Set by Method v2.0. The literature evidence is reported independently at heavymetalindex.com.",
    generated_at: generatedAt,
    generated_commit: generatedCommit,
    methodology_version: METHODOLOGY_VERSION,
    license: LICENSE,
    publisher: "Institute of Contaminant Standards",
    datasets: [
      {
        id: "hmtc-standards",
        name: doc.title,
        description: doc.description,
        landing_page: `${SITE}/data`,
        version,
        date_modified: isoDay(generatedAt),
        standard_count: doc.standard_count,
        firm_analyte_cells: doc.firm_analyte_cells,
        unit: doc.unit,
        distributions: [
          { format: "application/json", content_url: `${base}/standards.json`, content_size: sizes.standardsJson },
          { format: "text/csv", content_url: `${base}/standards.csv`, content_size: sizes.standardsCsv },
        ],
      },
    ],
  }
}

// ===========================================================================
// Helpers
// ===========================================================================
function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"))
}
function readJsonSafe(p) {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"))
  } catch {
    return null
  }
}
function trimText(s) {
  if (!s) return null
  const t = String(s).replace(/\s+/g, " ").trim()
  return t.length > 400 ? t.slice(0, 397) + "…" : t
}
function toCsv(rows) {
  return rows.map((r) => r.map(csvCell).join(",")).join("\n") + "\n"
}
function csvCell(v) {
  const s = v == null ? "" : String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}
function isoDay(iso) {
  return String(iso).slice(0, 10)
}
function safeGitCommit() {
  // Vercel shallow-clones the repo, so `git rev-parse` may report shallow or
  // fail; fall back to the commit SHA Vercel injects into the build env so the
  // version stamp is populated on production deploys and a cited snapshot stays
  // reconstructible by commit.
  try {
    const shallow = execSync("git rev-parse --is-shallow-repository", { cwd: repoRoot, stdio: ["ignore", "pipe", "ignore"] }).toString().trim()
    if (shallow !== "true") return execSync("git rev-parse HEAD", { cwd: repoRoot, stdio: ["ignore", "pipe", "ignore"] }).toString().trim()
  } catch {
    /* fall through to the env fallback */
  }
  return process.env.VERCEL_GIT_COMMIT_SHA || null
}
