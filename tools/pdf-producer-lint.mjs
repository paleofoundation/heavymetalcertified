#!/usr/bin/env node
// pdf-producer-lint.mjs — CI HARD-FAIL guard (ORDER S-DOI-OLIVE-FINISH-1 addendum).
//
// Every committed standards PDF under content/static/standards/*.pdf MUST be produced
// by the house scholarly generator (tools/build-standard-pdf.mjs → tools/pdf/scholarly-pdf.mjs,
// @react-pdf/renderer). A headless-browser print (Chromium / Skia / Puppeteer / Playwright /
// wkhtmltopdf) is a HARD FAIL: a DataCite-DOI'd certification standard whose PDF is a browser
// screen-print, not the house publication template, must never ship. This closes the exact
// root failure that S-DOI-OLIVE-PDF-1 was opened for.
//
// The guard is byte-level: react-pdf stamps "react-pdf" into the file; Chromium/Skia prints
// carry "Skia" / "Chromium" / "HeadlessChrome" producer/creator strings instead.
//
// Usage: node tools/pdf-producer-lint.mjs [--quiet]
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

// Producer/creator signatures of headless-browser PDF pipelines. Word/token matched.
export const BROWSER_MARKERS = ["Skia/PDF", "Skia", "Chromium", "HeadlessChrome", "wkhtmltopdf", "Puppeteer", "Playwright"]

// Pure, testable check on the raw PDF bytes (Buffer or string).
export function checkPdfProducer(buf) {
  const text = Buffer.isBuffer(buf) ? buf.toString("latin1") : String(buf)
  const hasReactPdf = /react-pdf/i.test(text)
  const browserHit = BROWSER_MARKERS.find((m) =>
    new RegExp(m.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i").test(text)) || null
  return { ok: hasReactPdf && !browserHit, hasReactPdf, browserHit }
}

function main() {
  const QUIET = process.argv.includes("--quiet")
  const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
  const DIR = path.join(REPO, "content/static/standards")
  if (!fs.existsSync(DIR)) {
    if (!QUIET) console.log("pdf-producer-lint: no content/static/standards dir — nothing to scan.")
    return
  }
  // Scope to the GENERATED per-slug standard PDFs (build-standard-pdf.mjs writes
  // content/static/standards/<slug>.pdf, lowercase-hyphenated, one per published standard
  // page). Hand-authored / versioned deposit artifacts (e.g. TitleCase "…-v3.0.pdf") are a
  // separate deposit track and are out of this guard's scope — it guards the mintable
  // per-slug standards, olive-oil included, without blocking the build on that backlog.
  const CONTENT = path.join(REPO, "content/standards")
  const pdfs = fs.readdirSync(DIR)
    .filter((f) => /^[a-z0-9][a-z0-9-]*\.pdf$/.test(f))
    .filter((f) => fs.existsSync(path.join(CONTENT, f.replace(/\.pdf$/, ".md"))))
    .sort()
  const offenders = []
  for (const f of pdfs) {
    const res = checkPdfProducer(fs.readFileSync(path.join(DIR, f)))
    if (!res.ok) offenders.push({ file: f, reason: res.browserHit ? `browser-print marker "${res.browserHit}"` : "no react-pdf producer signature" })
  }
  if (!QUIET) {
    console.log(`pdf-producer-lint: scanned ${pdfs.length} standards PDF(s)`)
    if (offenders.length) for (const o of offenders) console.log(`    ${o.file.padEnd(40)} ${o.reason}`)
  }
  if (offenders.length) {
    console.error(`\n!! FAIL: ${offenders.length} standards PDF(s) are NOT house @react-pdf output (Chromium/Skia print or unknown producer). The house generator is tools/build-standard-pdf.mjs → tools/pdf/scholarly-pdf.mjs; regenerate the offenders. A browser-print PDF must never carry a DataCite DOI. See ORDER S-DOI-OLIVE-PDF-1 / S-DOI-OLIVE-FINISH-1.`)
    process.exit(1)
  }
  if (!QUIET) console.log("pdf-producer-lint: OK — every standards PDF is house @react-pdf output.")
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))
if (isMain) main()
