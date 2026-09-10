#!/usr/bin/env node
// claim-surface-lint.mjs — ORDER S-DOI-FORCE-1 / CEO lock 2026-09-10.
//
// A claim-surface LIMIT (Master Limit Table on the standard page, and the same
// column the PDF builder emits) must be a firm number. This lint FAILS the build
// when any of the following appear:
//   - monitored / subsumed / dashes / empty LIMIT cells
//   - incomplete N/M headers ("N of M analytes", snapshot "N / M" with N < M)
//   - rice / infant / baby-cereal (and all Cat-1 baby-food) standards missing
//     a numeric inorganic-arsenic (iAs) limit — hard fail
//
// Read-across is allowed when the LIMIT is numeric and provenance is present.
// Mint scripts import assertClaimSurfaceClean() and must refuse on FAIL.
// Wired into prebuild so a blank claim cell cannot ship.
//
// Usage: node tools/claim-surface-lint.mjs [--quiet]

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import {
  allCellMaps,
  cellState,
  classifyLimitDisplay,
  isFirmNumeric,
  isIncompleteNM,
  pdfLimitDisplay,
  requiresNumericIas,
} from "./lib/claim-cell.mjs"

const REPO = process.cwd()
const DATA = path.join(REPO, "data/standards")
const CONTENT = path.join(REPO, "content/standards")
const PDF_DIR = path.join(REPO, "content/static/standards")
const args = new Set(process.argv.slice(2))
const QUIET = args.has("--quiet")

function decode(html) {
  return String(html ?? "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/&le;|&#8804;|&#x2264;/gi, "≤")
    .replace(/&#8201;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim()
}

function limitsSection(md) {
  const start = md.search(/id=["']limits["']/)
  if (start < 0) return null
  const from = md.indexOf("<", start)
  const end = md.indexOf("<section", from + 8)
  return md.slice(from, end > 0 ? end : undefined)
}

function limitRowsFromSection(sec) {
  const ths = [...sec.matchAll(/<th\b[^>]*>([\s\S]*?)<\/th>/gi)].map((m) => decode(m[1]).toLowerCase())
  let limitIdx = ths.findIndex((t) => /\blimit\b/.test(t) && !/analyte/.test(t))
  if (limitIdx < 0) limitIdx = 2
  const rows = []
  for (const rm of sec.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const tds = [...rm[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map((m) => decode(m[1]))
    if (!tds.length) continue
    rows.push({ analyte: tds[0] || "", limit: tds[limitIdx] ?? tds[2] ?? "" })
  }
  return rows
}

function incompleteHeaders(md, loc) {
  const hits = []
  for (const m of md.matchAll(/(\d+)\s+of\s+(\d+)\s+analytes/gi)) {
    if (isIncompleteNM(m[1], m[2])) hits.push(`${loc}: incomplete N/M header "${m[1]} of ${m[2]} analytes"`)
  }
  for (const m of md.matchAll(/Analytes (?:limited|published)"?\s*,\s*v:\s*"(\d+)\s*\/\s*(\d+)"/g)) {
    if (isIncompleteNM(m[1], m[2])) hits.push(`${loc}: incomplete N/M snapshot "${m[1]} / ${m[2]}"`)
  }
  return hits
}

function iasKey(cells) {
  return Object.keys(cells || {}).find((k) => k.toLowerCase() === "ias") || "iAs"
}

function readAcrossHasProvenance(c) {
  const t = String(c.type || c.cell_kind || "").toLowerCase()
  const p = String(c.provenance || c.provenance_tag || "").toLowerCase()
  if (t !== "read_across" && p !== "read-across" && p !== "read_across") return true
  return !!(c.source_jurisdiction || c.source_id || c.label || c.analog_scope || c.binding_jurisdiction)
}

export function lintClaimSurface({ repo = REPO } = {}) {
  const data = path.join(repo, "data/standards")
  const content = path.join(repo, "content/standards")
  const pdfDir = path.join(repo, "content/static/standards")
  const violations = []
  let pages = 0
  let pdfSurfaces = 0
  let compiled = 0

  for (const dirName of fs.readdirSync(data).filter((d) => d.endsWith("-compiled"))) {
    const dir = path.join(data, dirName)
    const base = dirName.replace(/-compiled$/, "")
    const pj = path.join(data, `${base}-pages.json`)
    const meta = fs.existsSync(pj) ? (JSON.parse(fs.readFileSync(pj, "utf8"))._meta || {}) : {}
    for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".json") && !x.startsWith("derivation"))) {
      let rec
      try { rec = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")) } catch { continue }
      const maps = allCellMaps(rec)
      if (!maps.length) continue
      compiled += 1
      const slug = rec.slug || f.replace(/\.json$/, "")
      const name = rec.name || rec.category_name || slug
      const category = rec.category ?? meta.category
      const needIas = requiresNumericIas({ slug, name, category })

      for (const [vk, cells] of maps) {
        if (!cells || typeof cells !== "object") continue
        const loc = `${dirName}/${slug}${vk !== "-" ? `[${vk}]` : ""}`
        for (const [analyte, cell] of Object.entries(cells)) {
          const state = cellState(cell)
          const pdfLimit = pdfLimitDisplay(cell)
          const pdfWhy = classifyLimitDisplay(pdfLimit)
          if (state === "EMPTY" || pdfWhy) {
            const why = pdfWhy || (tagsHint(cell) || "empty")
            violations.push(`${loc} ${analyte}: ${why} LIMIT (compiled/PDF claim surface)`)
          } else if (!readAcrossHasProvenance(cell)) {
            violations.push(`${loc} ${analyte}: read-across LIMIT missing provenance`)
          }
        }
        if (needIas) {
          const key = iasKey(cells)
          const ias = cells[key]
          if (!isFirmNumeric(ias) || classifyLimitDisplay(pdfLimitDisplay(ias))) {
            const hard = String(category) === "1" ? "HARD FAIL (baby food)" : "FAIL"
            violations.push(`${loc}: missing numeric iAs — ${hard}`)
          }
        }
      }
    }
  }

  if (fs.existsSync(content)) {
    for (const f of fs.readdirSync(content).filter((x) => x.endsWith(".md") && x !== "index.md" && !x.startsWith("_"))) {
      const slug = f.replace(/\.md$/, "")
      const md = fs.readFileSync(path.join(content, f), "utf8")
      const fmType = (md.match(/^type:\s*(\S+)/m) || [])[1]
      if (fmType && !/^standard/i.test(fmType)) continue
      pages += 1
      const loc = `content/standards/${f}`
      violations.push(...incompleteHeaders(md, loc))
      const sec = limitsSection(md)
      if (!sec) {
        violations.push(`${loc}: no Master Limit Table (#limits)`)
        continue
      }
      const rows = limitRowsFromSection(sec)
      if (!rows.length) violations.push(`${loc}: Master Limit Table has no LIMIT rows`)
      for (const row of rows) {
        const why = classifyLimitDisplay(row.limit)
        if (why) violations.push(`${loc}: ${row.analyte || "(row)"} LIMIT is ${why} ("${row.limit}")`)
      }
      const cat = (md.match(/^category:\s*(\S+)/m) || [])[1]
      const title = (md.match(/^title:\s*"?([^"\n]+)"?/m) || [])[1] || slug
      if (requiresNumericIas({ slug, name: title, category: cat })) {
        const ias = rows.find((r) => /\(iAs\)|inorganic arsenic/i.test(r.analyte))
        if (!ias || classifyLimitDisplay(ias.limit)) {
          const hard = String(cat) === "1" ? "HARD FAIL (baby food)" : "FAIL"
          violations.push(`${loc}: rice/infant/baby cereal missing numeric iAs — ${hard}`)
        }
      }
    }
  }

  if (fs.existsSync(pdfDir)) {
    const pdfs = fs.readdirSync(pdfDir).filter((x) => x.endsWith(".pdf"))
    pdfSurfaces = pdfs.length
    for (const f of pdfs) {
      const buf = fs.readFileSync(path.join(pdfDir, f))
      const text = pdfExtract(buf)
      if (!text) continue
      if (/\b(monitored|subsumed|bounded)\b/i.test(text) && /hmtc limit/i.test(text)) {
        violations.push(`content/static/standards/${f}: PDF claim surface contains monitored/subsumed/bounded LIMIT text`)
      }
    }
  }

  return {
    ok: violations.length === 0,
    violations,
    pages,
    compiled,
    pdfSurfaces,
  }
}

function tagsHint(c) {
  if (!c || typeof c !== "object") return "empty"
  const t = String(c.type || c.cell_kind || c.provenance || "").toLowerCase()
  if (t === "subsumed" || t === "monitored") return t
  if (c.value == null) return "empty"
  return null
}

function pdfExtract(buf) {
  const s = buf.toString("latin1")
  const chunks = []
  const re = /\((?:\\.|[^\\)])*\)/g
  let m
  while ((m = re.exec(s))) {
    const inner = m[0].slice(1, -1).replace(/\\n/g, "\n").replace(/\\(.)/g, "$1")
    if (inner.length > 1) chunks.push(inner)
  }
  return chunks.join(" ")
}

export function assertClaimSurfaceClean({ repo = REPO, label = "claim-surface-lint" } = {}) {
  const result = lintClaimSurface({ repo })
  if (result.ok) return result
  console.error(`\n${label}: FAIL — ${result.violations.length} claim-surface defect(s). No DOI may be minted.`)
  for (const v of result.violations.slice(0, 80)) console.error(`  ✗ ${v}`)
  if (result.violations.length > 80) console.error(`  … ${result.violations.length - 80} more`)
  console.error(`\nCEO lock (2026-09-10): every claim-surface LIMIT on pages and PDFs must be a firm number. Read-across is OK with provenance; never blank. Inorganic arsenic blank on baby foods is a hard fail.`)
  return result
}

function main() {
  const result = lintClaimSurface()
  if (!QUIET) {
    console.log(`claim-surface-lint: ${result.compiled} compiled record(s) · ${result.pages} standard page(s) · ${result.pdfSurfaces} PDF(s)`)
  }
  if (!result.ok) {
    console.error(`\nclaim-surface-lint: ${result.violations.length} FAILURE(S) — blank/monitored/subsumed/dash LIMIT cells cannot ship:`)
    for (const v of result.violations) console.error(`  ✗ ${v}`)
    console.error(`\nFix the compiled cell (firm numeric, or read-across with provenance) and re-render pages/PDFs. Do not mint a DOI while this lint fails.`)
    process.exit(1)
  }
  if (!QUIET) console.log(`claim-surface-lint: OK — every claim-surface LIMIT is numeric.`)
  process.exit(0)
}

const invoked = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
if (invoked) main()
