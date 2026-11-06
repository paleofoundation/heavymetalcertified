#!/usr/bin/env node
// Audit committed standard PDFs for the STD-PDF-SWEEP-1 stale signals.
// A PDF is stale when extracted text shows a Tier column, an empty ORCID slot,
// a subsumed iAs/MeHg cell printed as a number, a generic basis, the word
// "briefing", or a producer other than house react-pdf.
//
// Usage: node tools/audit-standard-pdfs.mjs [--json]
import fs from "node:fs"
import path from "node:path"
import { execFileSync } from "node:child_process"
import { fileURLToPath } from "node:url"
import { checkPdfProducer } from "./pdf-producer-lint.mjs"

const REPO = process.cwd()
const PDF_DIR = path.join(REPO, "content/static/standards")
const CONTENT = path.join(REPO, "content/standards")
const DATA = path.join(REPO, "data/standards")

function findRecord(slug) {
  for (const d of fs.readdirSync(DATA)) {
    if (!/-compiled$/.test(d)) continue
    const p = path.join(DATA, d, `${slug}.json`)
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, "utf8"))
  }
  return null
}
function cellsOf(rec) {
  if (!rec) return {}
  if (rec.variants && typeof rec.variants === "object" && !rec.cells) return Object.assign({}, ...Object.values(rec.variants))
  return rec.cells || {}
}
function kind(c) {
  return String((c && (c.type || c.cell_kind)) || "").toLowerCase()
}

const SPECIES = [
  ["iAs", "Inorganic arsenic (iAs)", "tAs"],
  ["MeHg", "Methylmercury (MeHg)", "tHg"],
]

function nextLines(text, label) {
  const esc = label.replace(/[()]/g, "\\$&")
  const re = new RegExp(esc + "\\s*\\n+\\s*([^\\n]+)", "g")
  const out = []
  let m
  while ((m = re.exec(text))) out.push(m[1].trim())
  return out
}
export function auditPdfText(text, bytes, cells) {
  const flags = []
  if (/\bTier\s*[12]\b/.test(text) || /\bTIER\b/.test(text)) flags.push("tier")
  const orcid = text.includes("0000-0002-2348-7259")
  if (!orcid || /Pendergrass\s*·\s*·/.test(text)) flags.push("orcid")
  if (/\bbriefing\b/i.test(text)) flags.push("briefing")
  // Old generator basis cells. Narrative "strictest applicable government maximum level"
  // in the method paragraph is not a basis cell; a named "(Instrument)" cell is not generic.
  if (/human-grade read-across/.test(text) || /human-food maximum levels/.test(text)) flags.push("generic-basis")
  for (const [key, label, parent] of SPECIES) {
    const c = cells[key]
    if (!c || kind(c) !== "subsumed" || c.value != null) continue
    const tokens = nextLines(text, label)
    const numbered = tokens.some((t) => /^[\d,]+$/.test(t))
    const inequality = new RegExp(`^(?:≤|<=)\\s*${parent}$`)
    if (numbered && !tokens.every((t) => inequality.test(t))) flags.push("species-number")
  }
  const producer = checkPdfProducer(bytes)
  if (!producer.ok) flags.push("producer")
  return [...new Set(flags)]
}

function pdfText(file) {
  return execFileSync("pdftotext", [file, "-"], { encoding: "utf8", maxBuffer: 8 * 1024 * 1024 })
}

export function auditStandardPdfs(dir = PDF_DIR) {
  const pdfs = fs.readdirSync(dir).filter((f) => /^[a-z0-9][a-z0-9-]*\.pdf$/.test(f) && fs.existsSync(path.join(CONTENT, f.replace(/\.pdf$/, ".md")))).sort()
  const rows = []
  for (const f of pdfs) {
    const slug = f.replace(/\.pdf$/, "")
    const file = path.join(dir, f)
    const bytes = fs.readFileSync(file)
    let text = ""
    try { text = pdfText(file) } catch (e) { text = "" }
    const flags = auditPdfText(text, bytes, cellsOf(findRecord(slug)))
    rows.push({ slug, flags, stale: flags.length > 0 })
  }
  return rows
}

function writeReport(rows, outPath) {
  const stale = rows.filter((r) => r.stale)
  const counts = {}
  for (const r of stale) for (const f of r.flags) counts[f] = (counts[f] || 0) + 1
  const lines = [
    "# Standard PDF sweep — 2026-11-06",
    "",
    "Audit of `content/static/standards/*.pdf` against the house generator",
    "(`tools/build-standard-pdf.mjs` → `tools/pdf/scholarly-pdf.mjs`).",
    "A PDF is stale when any signal below is present. Firm numeric species",
    "ceilings are not stale; only a subsumed iAs/MeHg cell printed as a number",
    "instead of `≤ tAs` / `≤ tHg` is.",
    "",
    `- PDFs scanned: ${rows.length}`,
    `- Stale: ${stale.length}`,
    `- Clean: ${rows.length - stale.length}`,
    "",
    "## Signal counts",
    "",
    "| Signal | PDFs |",
    "| --- | --- |",
    ...Object.keys(counts).sort().map((k) => `| ${k} | ${counts[k]} |`),
    "",
    "## Stale PDFs",
    "",
    "| Slug | Signals |",
    "| --- | --- |",
    ...stale.map((r) => `| ${r.slug} | ${r.flags.join(", ")} |`),
    "",
  ]
  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  fs.writeFileSync(outPath, lines.join("\n"))
  return { scanned: rows.length, stale: stale.length, clean: rows.length - stale.length, counts }
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))
if (isMain) {
  const rows = auditStandardPdfs()
  const outIdx = process.argv.indexOf("--out")
  if (outIdx !== -1) writeReport(rows, process.argv[outIdx + 1])
  const stale = rows.filter((r) => r.stale)
  const counts = {}
  for (const r of stale) for (const f of r.flags) counts[f] = (counts[f] || 0) + 1
  console.log(JSON.stringify({ scanned: rows.length, stale: stale.length, clean: rows.length - stale.length, counts }, null, 2))
}
