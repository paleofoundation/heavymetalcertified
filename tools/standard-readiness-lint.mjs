#!/usr/bin/env node
// standard-readiness-lint.mjs — enforces the Certification-Readiness Ruling
// (docs/governance/hmtc-governing-principles.md §"Certification-Readiness Ruling";
// ORDER S-DOI-FORCE-1 / PANEL-CLAIM-1).
//
// A category/subcategory is CERTIFICATION-READY only when all three hold:
//   COMPLETE   — every claim-surface analyte carries a firm numeric limit-of-record
//                (gov floor or disclosed read-across, or an explicit numeric ceiling
//                on the cell). type/provenance subsumed|monitored|control|not-material
//                with value:null is EMPTY — never COMPLETE. Reflex speciation does
//                not blank a claim. Rice / infant-cereal rows require numeric iAs.
//   REGISTERED — the standard carries a resolvable PRODUCTION DataCite DOI (a
//                test/sandbox DOI does NOT satisfy this).
//   CORRECTED  — reserved for the standards lint battery verdict.
//
// Output:
//   - data/standards/readiness-manifest.json — the single source of truth every
//     "ready" claim reads from.
//   - data/standards/claim-surface-fail-list.json — honest empty-cell backlog.
//
// --strict (prebuild): fail-closed for rice/infant-cereal canary + any standard
// marked ready + any standard that claims full completeness while claim-surface
// is empty. The rest of the corpus is WARN-listed (WARN→STRICT rollout; see
// docs/claim-surface-strict-rollout.md). --strict-corpus fails every empty cell.
//
// Usage: node tools/standard-readiness-lint.mjs [--strict] [--strict-corpus] [--quiet]

import fs from "node:fs"
import path from "node:path"
import {
  evaluateClaimSurface, loadCompiledRecords, claimSurfaceFailReason,
  isRiceCerealCanary,
} from "./lib/claim-surface.mjs"

const REPO = process.cwd()
const DATA = path.join(REPO, "data/standards")
const CONTENT = path.join(REPO, "content/standards")
const args = new Set(process.argv.slice(2))
const STRICT = args.has("--strict") || args.has("--strict-corpus")
const STRICT_CORPUS = args.has("--strict-corpus")
const QUIET = args.has("--quiet")

const TEST_PREFIXES = ["10.5072", "10.82", "10.84435"]
function productionDoi(slug) {
  const f = path.join(CONTENT, `${slug}.md`)
  if (!fs.existsSync(f)) return null
  const s = fs.readFileSync(f, "utf8")
  const m = s.match(/^(?:cert_doi|doi):\s*"?(10\.\d{4,9}\/[^\s"']+)"?/mi)
  if (!m) return null
  const doi = m[1]
  if (TEST_PREFIXES.some((p) => doi.startsWith(p))) return null
  return doi
}

function pageClaimsFullCompleteness(slug) {
  const f = path.join(CONTENT, `${slug}.md`)
  if (!fs.existsSync(f)) return false
  const s = fs.readFileSync(f, "utf8")
  if (/Every analyte carries a firm ceiling/i.test(s)) return true
  if (/Analytes limited:\s*"?\s*(\d+)\s*\/\s*\1/i.test(s)) return true
  const fm = s.match(/firm_analytes:\s*(\d+)/)
  if (fm && /Every analyte carries a firm ceiling/i.test(s)) return true
  return false
}

const compiled = loadCompiledRecords(DATA)
const records = []
for (const row of compiled) {
  const ev = evaluateClaimSurface(row)
  const doi = productionDoi(row.slug)
  const registered = !!doi
  records.push({
    category: row.category,
    category_name: row.category_name,
    compiled_dir: row.compiled_dir,
    slug: row.slug,
    panel_size: ev.panel.length,
    complete: ev.complete,
    empty_cells: ev.empty_cells,
    claim_empty: ev.claim_empty,
    rice: ev.rice,
    rice_missing_ias: ev.rice_missing_ias,
    registered,
    doi: doi || null,
    corrected: ev.complete,
    ready: ev.complete && registered,
    claims_full: pageClaimsFullCompleteness(row.slug),
    fail_reason: claimSurfaceFailReason(ev),
  })
}

const byCat = {}
for (const r of records) {
  const k = String(r.category)
  ;(byCat[k] ||= { category: r.category, category_name: r.category_name, records: [] }).records.push({
    slug: r.slug, complete: r.complete, registered: r.registered, corrected: r.corrected,
    ready: r.ready, empty_cells: r.empty_cells, claim_empty: r.claim_empty,
    rice: r.rice, rice_missing_ias: r.rice_missing_ias, doi: r.doi,
  })
}
for (const k of Object.keys(byCat)) {
  const rs = byCat[k].records
  byCat[k].complete = rs.every((r) => r.complete)
  byCat[k].registered = rs.every((r) => r.registered)
  byCat[k].ready = rs.every((r) => r.ready)
  byCat[k].incomplete_records = rs.filter((r) => !r.complete).length
  byCat[k].empty_cell_total = rs.reduce((n, r) => n + r.empty_cells.length, 0)
  byCat[k].claim_empty_total = rs.reduce((n, r) => n + r.claim_empty.length, 0)
}

const incomplete = records.filter((r) => !r.complete)
const emptyCellCount = records.reduce((n, r) => n + r.empty_cells.length, 0)
const claimEmptyCount = records.reduce((n, r) => n + r.claim_empty.length, 0)
const riceCanaryFail = records.filter((r) => {
    const canary = isRiceCerealCanary(r.slug)
    const iAsHole = r.rice && r.rice_missing_ias
    return (canary && !r.complete) || iAsHole
  })
const readyButIncomplete = records.filter((r) => r.ready && !r.complete)
const claimedFullButEmpty = records.filter((r) => r.claims_full && !r.complete)

const manifest = {
  _doc: "GENERATED by tools/standard-readiness-lint.mjs — do not hand-edit. The single source of truth for whether a category/standard is certification-ready (COMPLETE + REGISTERED + CORRECTED). Every 'ready' claim on the site must read from this file; no category may be presented as ready unless its entry says ready:true. Ruling: docs/governance/hmtc-governing-principles.md. ORDER S-DOI-FORCE-1: subsumed/monitored/control/not-material with value:null is EMPTY.",
  ruling: "Certification-Readiness Ruling + PANEL-CLAIM-1 (S-DOI-FORCE-1): every claim-surface analyte carries a firm numeric limit-of-record; subsumed+null is never COMPLETE; a category is ready only when COMPLETE + REGISTERED (production DOI) + CORRECTED.",
  totals: {
    records: records.length,
    complete: records.filter((r) => r.complete).length,
    registered: records.filter((r) => r.registered).length,
    ready: records.filter((r) => r.ready).length,
    empty_cells: emptyCellCount,
    claim_empty_cells: claimEmptyCount,
    incomplete_records: incomplete.length,
    rice_canary_fail: riceCanaryFail.length,
  },
  categories: Object.values(byCat).sort((a, b) => String(a.category).localeCompare(String(b.category), undefined, { numeric: true })),
}
fs.writeFileSync(path.join(DATA, "readiness-manifest.json"), JSON.stringify(manifest, null, 2))

const failList = {
  _doc: "GENERATED empty-cell backlog for the WARN→STRICT rollout (docs/claim-surface-strict-rollout.md). subsumed+null is listed here as EMPTY. Do not mint a DOI for any slug in incomplete.",
  generated_by: "tools/standard-readiness-lint.mjs",
  totals: manifest.totals,
  incomplete: incomplete
    .slice()
    .sort((a, b) => (b.claim_empty.length - a.claim_empty.length) || (b.empty_cells.length - a.empty_cells.length) || a.slug.localeCompare(b.slug))
    .map((r) => ({
      slug: r.slug,
      category: r.category,
      rice: r.rice,
      claim_empty: r.claim_empty,
      empty_cells: r.empty_cells,
      rice_missing_ias: r.rice_missing_ias,
    })),
}
fs.writeFileSync(path.join(DATA, "claim-surface-fail-list.json"), JSON.stringify(failList, null, 2))

if (!QUIET) {
  console.log(`standard-readiness-lint: ${records.length} standards | ${manifest.totals.complete} COMPLETE | ${manifest.totals.registered} REGISTERED | ${manifest.totals.ready} READY | ${emptyCellCount} empty cells (${claimEmptyCount} claim-surface)`)
  if (incomplete.length) {
    console.log(`\n  INCOMPLETE standards (empty analyte cells — not certification-ready):`)
    for (const r of incomplete.sort((a, b) => b.empty_cells.length - a.empty_cells.length).slice(0, 80)) {
      const extra = r.rice_missing_ias ? " [rice iAs missing]" : ""
      console.log(`    [${String(r.category).padStart(2)}] ${r.slug.padEnd(42)} empty: ${r.empty_cells.join(", ") || "(claim)"}${extra}`)
    }
    if (incomplete.length > 80) console.log(`    … ${incomplete.length - 80} more (see data/standards/claim-surface-fail-list.json)`)
  }
  if (manifest.totals.registered < records.length) {
    console.log(`\n  ${records.length - manifest.totals.registered} standards carry no production DOI (REGISTERED gate open — depends on DataCite membership approval + live prefix).`)
  }
  console.log(`\n  wrote data/standards/readiness-manifest.json`)
  console.log(`  wrote data/standards/claim-surface-fail-list.json (${incomplete.length} incomplete)`)
}

if (readyButIncomplete.length) {
  console.error(`\n!! FAIL: ${readyButIncomplete.length} standard(s) marked ready but not COMPLETE — impossible state.`)
  process.exit(1)
}

const strictFails = []
if (STRICT || STRICT_CORPUS) {
  for (const r of riceCanaryFail) {
    strictFails.push(`rice/infant-cereal canary ${r.slug}: ${r.fail_reason || r.empty_cells.join(", ")}`)
  }
  for (const r of claimedFullButEmpty) {
    if (!strictFails.some((s) => s.includes(r.slug))) {
      strictFails.push(`claims-full-completeness ${r.slug}: ${r.fail_reason || r.claim_empty.join(", ")}`)
    }
  }
}
if (STRICT_CORPUS && incomplete.length) {
  for (const r of incomplete) {
    if (!strictFails.some((s) => s.includes(r.slug))) {
      strictFails.push(`corpus ${r.slug}: empty ${r.empty_cells.join(", ")}`)
    }
  }
}

if (strictFails.length) {
  console.error(`\n!! FAIL (--strict${STRICT_CORPUS ? "-corpus" : ""}): ${strictFails.length} standard(s) fail the fail-closed claim-surface gate.`)
  for (const s of strictFails.slice(0, 60)) console.error(`  ✗ ${s}`)
  if (strictFails.length > 60) console.error(`  … ${strictFails.length - 60} more`)
  console.error(`See docs/claim-surface-strict-rollout.md. subsumed+null is never COMPLETE.`)
  process.exit(1)
}

if (incomplete.length && !QUIET) {
  const mode = STRICT
    ? `warn-listed backlog: ${incomplete.length} incomplete (not rice-canary / not claims-full); --strict-corpus to fail them all`
    : `${incomplete.length} incomplete standards remain; prebuild uses --strict (canary + ready + claims-full). Destination is --strict-corpus`
  console.log(`\n  (${mode}.)`)
}
process.exit(0)
