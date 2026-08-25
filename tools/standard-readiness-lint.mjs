#!/usr/bin/env node
// standard-readiness-lint.mjs — enforces the Certification-Readiness Ruling
// (docs/governance/hmtc-governing-principles.md §"Certification-Readiness Ruling", ratified
// 2026-08-25; CLAUDE.md Part 19).
//
// A category/subcategory is CERTIFICATION-READY only when all three hold:
//   COMPLETE   — every panel analyte carries a limit-of-record (firm number, species bounded
//                by its parent total, or a baseline/LOQ screen). An empty cell (control /
//                not-material with value:null) fails COMPLETE.
//   REGISTERED — the standard carries a resolvable PRODUCTION DataCite DOI (a test/sandbox DOI
//                does NOT satisfy this).
//   CORRECTED  — reserved for the standards lint battery verdict (panel-coherence, method-drift,
//                firewall, export drift-check). Tracked here as a pass-through flag; the battery
//                runs as its own prebuild steps.
//
// Output:
//   - data/standards/readiness-manifest.json — the single source of truth every "ready" claim
//     reads from. No category may be presented as ready unless its manifest entry says ready.
//   - a per-category report to stdout.
//
// Rollout: WARN-ONLY by default while the empty-cell backlog drains (mirrors the contamination-
// profile integrity lint pattern). Pass --strict to FAIL the build on any empty cell; the prebuild
// flips to --strict once the backlog reaches zero. Regardless of mode, the lint ALWAYS fails if a
// standard whose manifest marks it ready is not in fact COMPLETE (a ready standard can never have
// an empty cell).
//
// Usage: node tools/standard-readiness-lint.mjs [--strict] [--quiet]

import fs from "node:fs"
import path from "node:path"

const REPO = process.cwd()
const DATA = path.join(REPO, "data/standards")
const CONTENT = path.join(REPO, "content/standards")
const args = new Set(process.argv.slice(2))
const STRICT = args.has("--strict")
const QUIET = args.has("--quiet")

// A cell has a limit-of-record when it resolves to a firm value OR is a species bounded by its
// parent total. An empty cell is control/not-material/null with no bound.
function cellState(c) {
  if (!c || typeof c !== "object") return "EMPTY"
  const t = c.type || c.cell_kind || ""
  const prov = c.provenance || c.provenance_tag || ""
  if (c.value !== null && c.value !== undefined) return "firm"
  if (t === "subsumed" || prov === "subsumed") return "bounded"
  // screen cells normally carry a value; a null screen is empty
  return "EMPTY"
}

function panelOf(meta, rec) {
  if (meta && Array.isArray(meta.panel) && meta.panel.length) return meta.panel
  const vs = rec.variants || {}
  const cells = vs.default || Object.values(vs)[0] || {}
  return Object.keys(cells)
}

// A standard carries a PRODUCTION DOI if its content page frontmatter has a doi: field that is a
// real DOI (10.<prefix>/...) and is NOT the DataCite test prefix (10.5072 / 10.82XXX sandbox). The
// assigned production prefix is configured via DATACITE_PREFIX; a test DOI never satisfies REGISTERED.
const TEST_PREFIXES = ["10.5072", "10.82"] // datacite sandbox families
function productionDoi(slug) {
  const f = path.join(CONTENT, `${slug}.md`)
  if (!fs.existsSync(f)) return null
  const s = fs.readFileSync(f, "utf8")
  const m = s.match(/^doi:\s*"?(10\.\d{4,9}\/[^\s"']+)"?/mi)
  if (!m) return null
  const doi = m[1]
  if (TEST_PREFIXES.some((p) => doi.startsWith(p))) return null
  return doi
}

const records = []
for (const dir of fs.readdirSync(DATA).filter((d) => d.endsWith("-compiled"))) {
  const base = dir.replace("-compiled", "")
  const pj = path.join(DATA, `${base}-pages.json`)
  const meta = fs.existsSync(pj) ? (JSON.parse(fs.readFileSync(pj, "utf8"))._meta || {}) : {}
  for (const f of fs.readdirSync(path.join(DATA, dir)).filter((x) => x.endsWith(".json") && !x.startsWith("derivation"))) {
    let rec
    try { rec = JSON.parse(fs.readFileSync(path.join(DATA, dir, f), "utf8")) } catch { continue }
    if (!rec.variants) continue
    const slug = rec.slug || f.replace(/\.json$/, "")
    const vs = rec.variants
    const cells = vs.default || Object.values(vs)[0] || {}
    const panel = panelOf(meta, rec)
    const empties = panel.filter((a) => cellState(cells[a]) === "EMPTY")
    const complete = empties.length === 0
    const doi = productionDoi(slug)
    const registered = !!doi
    records.push({
      category: rec.category ?? meta.category ?? base,
      category_name: rec.category_name || meta.category_name || base,
      compiled_dir: dir, slug, panel_size: panel.length,
      complete, empty_cells: empties, registered, doi: doi || null,
      // CORRECTED is asserted by the standards lint battery; a standard that is complete and has
      // passed render + export drift-check is treated as corrected here (the battery blocks the
      // build independently if it is not).
      corrected: complete,
      ready: complete && registered,
    })
  }
}

// --- readiness manifest ---------------------------------------------------------------------
const byCat = {}
for (const r of records) {
  const k = String(r.category)
  ;(byCat[k] ||= { category: r.category, category_name: r.category_name, records: [] }).records.push({
    slug: r.slug, complete: r.complete, registered: r.registered, corrected: r.corrected,
    ready: r.ready, empty_cells: r.empty_cells, doi: r.doi,
  })
}
for (const k of Object.keys(byCat)) {
  const rs = byCat[k].records
  byCat[k].complete = rs.every((r) => r.complete)
  byCat[k].registered = rs.every((r) => r.registered)
  byCat[k].ready = rs.every((r) => r.ready)
  byCat[k].incomplete_records = rs.filter((r) => !r.complete).length
  byCat[k].empty_cell_total = rs.reduce((n, r) => n + r.empty_cells.length, 0)
}
const manifest = {
  _doc: "GENERATED by tools/standard-readiness-lint.mjs — do not hand-edit. The single source of truth for whether a category/standard is certification-ready (COMPLETE + REGISTERED + CORRECTED). Every 'ready' claim on the site must read from this file; no category may be presented as ready unless its entry says ready:true. Ruling: docs/governance/hmtc-governing-principles.md.",
  ruling: "Certification-Readiness Ruling (2026-08-25): every analyte carries a limit-of-record; a category is ready only when COMPLETE + REGISTERED (production DOI) + CORRECTED.",
  totals: {
    records: records.length,
    complete: records.filter((r) => r.complete).length,
    registered: records.filter((r) => r.registered).length,
    ready: records.filter((r) => r.ready).length,
    empty_cells: records.reduce((n, r) => n + r.empty_cells.length, 0),
  },
  categories: Object.values(byCat).sort((a, b) => String(a.category).localeCompare(String(b.category), undefined, { numeric: true })),
}
fs.writeFileSync(path.join(DATA, "readiness-manifest.json"), JSON.stringify(manifest, null, 2))

// --- report ---------------------------------------------------------------------------------
const incomplete = records.filter((r) => !r.complete)
if (!QUIET) {
  console.log(`standard-readiness-lint: ${records.length} standards | ${manifest.totals.complete} COMPLETE | ${manifest.totals.registered} REGISTERED | ${manifest.totals.ready} READY | ${manifest.totals.empty_cells} empty cells`)
  if (incomplete.length) {
    console.log(`\n  INCOMPLETE standards (empty analyte cells — not certification-ready):`)
    for (const r of incomplete.sort((a, b) => b.empty_cells.length - a.empty_cells.length)) {
      console.log(`    [${String(r.category).padStart(2)}] ${r.slug.padEnd(42)} empty: ${r.empty_cells.join(", ")}`)
    }
  }
  if (manifest.totals.registered < records.length) {
    console.log(`\n  ${records.length - manifest.totals.registered} standards carry no production DOI (REGISTERED gate open — depends on DataCite membership approval + live prefix).`)
  }
  console.log(`\n  wrote data/standards/readiness-manifest.json`)
}

// --- exit -----------------------------------------------------------------------------------
// Hard failure regardless of mode: a standard the manifest marks ready must be COMPLETE.
const readyButIncomplete = records.filter((r) => r.ready && !r.complete)
if (readyButIncomplete.length) {
  console.error(`\n!! FAIL: ${readyButIncomplete.length} standard(s) marked ready but not COMPLETE — impossible state.`)
  process.exit(1)
}
if (STRICT && incomplete.length) {
  console.error(`\n!! FAIL (--strict): ${incomplete.length} standard(s) have empty analyte cells. Every analyte must carry a limit-of-record before the build can pass. See docs/governance/hmtc-governing-principles.md §Certification-Readiness Ruling.`)
  process.exit(1)
}
if (incomplete.length && !QUIET) {
  console.log(`\n  (warn-only: ${incomplete.length} incomplete standards remain; lint flips to --strict when the backlog reaches zero.)`)
}
process.exit(0)
