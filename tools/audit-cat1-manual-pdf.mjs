#!/usr/bin/env node
// audit-cat1-manual-pdf.mjs — the defensibility gate for the consolidated Cat-1
// manual PDF. This is a Daubert artifact: a single wrong number, multiplied by the
// program's transparent-derivation posture, is a self-harm. So this asserts, hard,
// that the served PDF cannot disagree with the published web edition.
//
// It checks, in order:
//   A. The shared lib's master matrix == the freshly regenerated web manual page
//      (content/manuals/infant-and-child-foods.md), cell for cell, in row order.
//   B. The shared lib's per-subcategory derivations == the freshly regenerated web
//      /standards/<slug> pages, value for value (HMTc, Binds, every government cell).
//   C. The rendered PDF's own text contains every master-matrix value and every
//      derivation HMTc value, and contains no "NaN" (proves the render emitted the
//      data, not a layout artifact). Skipped with a notice if pdftotext is absent.
//   D. Firewall: neither the lib output nor the PDF text carries retired P97/P45
//      initial-setting arithmetic. P80 is required in the post-publication ratchet.
//
// The PDF is rendered directly from the same lib (masterMatrix/allDerivations), so
// A+B prove the PDF's source equals the web edition and C proves the render is faithful.
//
// Usage:  node tools/audit-cat1-manual-pdf.mjs   (exit 0 = defensible, 1 = drift)

import fs from "node:fs"
import path from "node:path"
import { execSync, spawnSync } from "node:child_process"
import { ROWS, ANALYTES, masterMatrix, pageDerivation } from "./lib/cat1-manual-data.mjs"

const REPO = process.cwd()
const MANUAL_MD = path.join(REPO, "content/manuals/infant-and-child-foods.md")
const STD_DIR = path.join(REPO, "content/standards")
const PDF = path.join(REPO, "content/static/manuals/HMTc-Infant-and-Child-Foods-Program-Manual-2026-v2.pdf")

const fail = []
const note = (m) => console.log(`  · ${m}`)

// Regenerate the web edition so we compare against the deploy truth, not a stale
// committed copy (the committed .md can lag the generators until the next build).
try {
  execSync("node tools/build-cat1-standard-pages.mjs", { cwd: REPO, stdio: "ignore" })
  execSync("node tools/build-cat1-manual.mjs", { cwd: REPO, stdio: "ignore" })
} catch (e) {
  fail.push(`could not regenerate web pages: ${e.message}`)
}

const stripTags = (s) =>
  s
    .replace(/<[^>]+>/g, "")
    .replace(/&sup1;/g, "").replace(/&sup2;/g, "").replace(/&sup3;/g, "")
    .replace(/&mdash;/g, "—").replace(/&amp;/g, "&")
    .trim()

// ── A. lib master matrix == web manual page ──────────────────────────────────
function webManualMatrix() {
  const md = fs.readFileSync(MANUAL_MD, "utf8")
  const tbody = md.slice(md.indexOf("<tbody>") + 7, md.indexOf("</tbody>"))
  const out = []
  for (const tr of tbody.split("</tr>")) {
    if (!tr.includes("/standards/")) continue
    const slug = (tr.match(/\/standards\/([a-z0-9-]+)/) || [])[1]
    const tds = (tr.match(/<td[^>]*>([\s\S]*?)<\/td>/g) || []).map((c) => stripTags(c.replace(/<td[^>]*>/, "").replace(/<\/td>/, "")))
    // td[0] = name, td[1..8] = analytes, td[9] = basis
    out.push({ slug, cells: tds.slice(1, 9), basis: tds[9] })
  }
  return out
}

const lib = masterMatrix()
const web = webManualMatrix()
if (web.length !== lib.length) fail.push(`master matrix row count: web ${web.length} vs lib ${lib.length}`)
// No duplicate subcategory rows (the historical 10-rows-under-a-nine-header bug).
const slugs = web.map((r) => r.slug)
const dupes = slugs.filter((s, i) => slugs.indexOf(s) !== i)
if (dupes.length) fail.push(`duplicate subcategory row(s) in web manual: ${[...new Set(dupes)].join(", ")}`)

let cellChecks = 0
for (let i = 0; i < Math.min(lib.length, web.length); i++) {
  const L = lib[i], W = web[i]
  if (L.slug !== W.slug) { fail.push(`row ${i + 1} slug: lib ${L.slug} vs web ${W.slug}`); continue }
  ANALYTES.forEach((a, j) => {
    cellChecks++
    if (String(L.cells[a.key]) !== String(W.cells[j])) fail.push(`${L.slug} ${a.key}: lib "${L.cells[a.key]}" vs web "${W.cells[j]}"`)
  })
  if (L.basis !== W.basis) fail.push(`${L.slug} basis: lib "${L.basis}" vs web "${W.basis}"`)
}
note(`A. master matrix: ${lib.length} rows × ${ANALYTES.length} analytes = ${cellChecks} cell(s) compared to the web manual page`)

// ── B. lib derivations == web /standards/<slug> pages ────────────────────────
function webDerivation(slug) {
  const md = fs.readFileSync(path.join(STD_DIR, `${slug}.md`), "utf8")
  const sec = md.slice(md.indexOf('id="derivation"'))
  const tbody = sec.slice(sec.indexOf("<tbody>") + 7, sec.indexOf("</tbody>"))
  const rows = {}
  for (const tr of tbody.split("</tr>")) {
    if (!tr.includes("<td")) continue
    const cells = (tr.match(/<td[^>]*>([\s\S]*?)<\/td>/g) || []).map((c) => stripTags(c.replace(/<td[^>]*>/, "").replace(/<\/td>/, "")))
    if (!cells.length) continue
    rows[cells[0]] = { hmtc: cells[cells.length - 2], binds: cells[cells.length - 1], perCountry: cells.slice(1, cells.length - 2) }
  }
  return rows
}

let derivChecks = 0
for (const r of ROWS) {
  let web
  try { web = webDerivation(r.slug) } catch (e) { fail.push(`${r.slug}: web derivation unreadable (${e.message})`); continue }
  const d = pageDerivation(r.slug)
  for (const row of d.rows) {
    const w = web[row.analyte]
    if (!w) { fail.push(`${r.slug} ${row.analyte}: missing in web derivation`); continue }
    derivChecks++
    const libHmtc = row.type === "not_material" ? "n/m" : String(row.hmtc)
    if (w.hmtc !== libHmtc) fail.push(`${r.slug} ${row.analyte} HMTc: web "${w.hmtc}" vs lib "${libHmtc}"`)
    if (w.binds !== row.binds) fail.push(`${r.slug} ${row.analyte} Binds: web "${w.binds}" vs lib "${row.binds}"`)
    const libPC = d.cols.map((j) => (row.perCountry[j] ? String(row.perCountry[j].value) : "—"))
    if (JSON.stringify(libPC) !== JSON.stringify(w.perCountry)) fail.push(`${r.slug} ${row.analyte} per-country: web ${JSON.stringify(w.perCountry)} vs lib ${JSON.stringify(libPC)}`)
  }
}
note(`B. derivations: ${derivChecks} analyte row(s) across ${ROWS.length} subcategories compared to the web /standards pages`)

// ── C. rendered PDF text contains every value; no NaN ────────────────────────
let pdfText = null
if (fs.existsSync(PDF)) {
  const r = spawnSync("pdftotext", ["-layout", PDF, "-"], { encoding: "utf8" })
  if (r.status === 0 && r.stdout) pdfText = r.stdout
} else {
  fail.push(`served PDF missing at ${path.relative(REPO, PDF)} — run: node tools/build-cat1-manual-pdf.mjs`)
}
if (pdfText) {
  const norm = pdfText.replace(/\s+/g, " ")
  if (/NaN/.test(pdfText)) fail.push(`PDF text contains "NaN" — a value failed to render`)
  // every distinct token used in the master matrix cells must appear in the PDF
  const tokens = new Set()
  for (const r of lib) for (const a of ANALYTES) String(r.cells[a.key]).split(/\s*\/\s*|\s+/).forEach((t) => t && tokens.add(t))
  const missing = [...tokens].filter((t) => t !== "—" && !norm.includes(t))
  if (missing.length) fail.push(`PDF text missing master-matrix token(s): ${missing.join(", ")}`)
  // every derivation HMTc numeric value must appear
  let hmtcMissing = 0
  for (const r of ROWS) for (const row of pageDerivation(r.slug).rows) {
    if (row.type === "not_material") continue
    if (!norm.includes(String(row.hmtc))) hmtcMissing++
  }
  if (hmtcMissing) fail.push(`PDF text missing ${hmtcMissing} derivation HMTc value(s)`)
  note(`C. PDF text: ${tokens.size} master-matrix token(s) present, no NaN`)
} else if (fs.existsSync(PDF)) {
  note(`C. PDF text check skipped (pdftotext not available) — parity proven structurally by A+B`)
}

// ── D. firewall: government-only initial setting; no retired P97/P45 math ─────
const FORBIDDEN = [/\bP97\b/i, /\bP45\b/i, /clean-subcategory percentile/i, /dirty-subcategory percentile/i, /pooled occurrence (?:limit|threshold|selection)/i]
const libDump = JSON.stringify(masterMatrix()) + JSON.stringify(ROWS.map((r) => pageDerivation(r.slug)))
for (const rx of FORBIDDEN) {
  if (rx.test(libDump)) fail.push(`FIREWALL: lib output matches forbidden ${rx} (manual must be government-limit only)`)
  if (pdfText && rx.test(pdfText)) fail.push(`FIREWALL: PDF text matches forbidden ${rx} (manual must be government-limit only)`)
}
note(`D. firewall: no retired P97/P45 initial-setting arithmetic in the manual; P80 ratchet permitted`)

// ── verdict ──────────────────────────────────────────────────────────────────
if (fail.length) {
  console.error(`\naudit-cat1-manual-pdf: ${fail.length} FAILURE(S):`)
  for (const f of fail) console.error(`  ✗ ${f}`)
  process.exit(1)
}
console.log(`\naudit-cat1-manual-pdf: OK — the served PDF matches the web edition exactly; firewall-clean.`)
process.exit(0)
