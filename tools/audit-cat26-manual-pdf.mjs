#!/usr/bin/env node
// audit-cat26-manual-pdf.mjs — defensibility gate for the Category 26 Program Manual v1.
//
// A. The live register matches the five standard pages (name, cert-ready, house DOI).
// B. The served PDF is house react-pdf, contains every standard name and DOI,
//    the method figures read from the compiled records, All rights reserved,
//    and the metal-safety scope line. No Chromium/Skia. No CC BY. No NaN.
//    No master-limit-matrix reprint. No unminted manual DOI presented as deposited.
// C. Aluminium 25 / 200 in the authored method text match the compiled cells.

import fs from "node:fs"
import path from "node:path"
import { spawnSync } from "node:child_process"
import { checkPdfProducer } from "./pdf-producer-lint.mjs"
import {
  buildRegister,
  limitGroups,
  PDF_FILE,
  CITATION_TITLE,
  readExistingHouseDoi,
} from "./lib/cat26-manual.mjs"

const REPO = process.cwd()
const PDF = path.join(REPO, "content/static/manuals", PDF_FILE)
const PART5 = path.join(REPO, "data/manuals/cat26-manual/part5-backmatter.md")
const fail = []
const note = (m) => console.log(`  · ${m}`)

const lib = buildRegister()
const limits = limitGroups()
if (lib.rows.length !== 5) fail.push(`register row count ${lib.rows.length}, expected 5`)
for (const row of lib.rows) {
  if (!row.cert_ready) fail.push(`${row.slug} not cert-ready: ${row.hold_reason}`)
  if (!row.cert_doi || !row.cert_doi.startsWith("10.83138/hmtc.std.26.")) {
    fail.push(`${row.slug} missing std.26 DOI`)
  }
}
note(`A. register: ${lib.rows.length} standards, all cert-ready; Al parenteral ${limits.parenteralAl}, oral ${limits.oralAl}`)

const part5 = fs.readFileSync(PART5, "utf8")
if (!part5.includes(`(${limits.parenteralAl})`) && !part5.includes(` ${limits.parenteralAl}`)) {
  fail.push(`part5 does not state parenteral aluminium ${limits.parenteralAl}`)
}
if (!part5.includes(`(${limits.oralAl})`) && !part5.includes(` ${limits.oralAl}`)) {
  fail.push(`part5 does not state oral aluminium ${limits.oralAl}`)
}

const bytes = fs.existsSync(PDF) ? fs.readFileSync(PDF) : null
if (!bytes) fail.push(`served PDF missing at ${path.relative(REPO, PDF)}`)
else {
  const prod = checkPdfProducer(bytes)
  if (!prod.ok) fail.push(`PDF producer fail: react-pdf=${prod.hasReactPdf} browser=${prod.browserHit || "none"}`)
  else note("B. producer: react-pdf, no browser-print marker")
}

let pdfText = null
if (bytes) {
  const r = spawnSync("pdftotext", ["-layout", PDF, "-"], { encoding: "utf8" })
  if (r.status === 0 && r.stdout) pdfText = r.stdout
  else fail.push("pdftotext failed")
}
if (pdfText) {
  const norm = pdfText.replace(/[\s\u00AD\u200B]+/g, " ")
  const compact = (s) => String(s).replace(/[\s\u00AD\u200B-]+/g, "")
  if (/NaN/.test(pdfText)) fail.push("PDF contains NaN")
  if (/CC BY|Creative Commons/i.test(pdfText)) fail.push("PDF carries CC BY")
  if (!norm.includes("All rights reserved")) fail.push("PDF missing All rights reserved")
  if (/Master limit matrix/i.test(norm)) fail.push("PDF reprints a master limit matrix")
  if (/every cell is/i.test(norm)) fail.push("PDF still says every cell is control")
  if (/no-regulatory-anchor/i.test(norm)) fail.push("PDF still says no-regulatory-anchor")
  if (!/metal safety only/i.test(norm)) fail.push("PDF missing metal safety only")
  if (!/efficacy/i.test(norm) || !/legality/i.test(norm) || !/approval status/i.test(norm)) {
    fail.push("PDF missing efficacy / legality / approval status scope")
  }
  if (!norm.includes(String(limits.parenteralAl)) || !norm.includes(String(limits.oralAl))) {
    fail.push("PDF missing aluminium figures from the compiled records")
  }
  if (!/ICH Q3D/i.test(norm)) fail.push("PDF missing ICH Q3D")
  if (!/tested on every lot/i.test(norm)) fail.push("PDF missing species tested on every lot")
  if (!/90%/.test(norm)) fail.push("PDF missing 90% stay-in-program gate")
  for (const row of lib.rows) {
    if (!compact(pdfText).includes(compact(row.slug))) fail.push(`PDF missing slug ${row.slug}`)
    if (!compact(pdfText).includes(compact(row.cert_doi))) fail.push(`PDF missing DOI ${row.cert_doi}`)
    const token = row.name.split(/[(),/]/)[0].trim().split(/\s+/).filter((w) => w.length >= 5)[0]
    if (token && !norm.includes(token)) fail.push(`PDF missing name token ${token} from ${row.name}`)
  }
  const house = readExistingHouseDoi()
  if (house) fail.push(`manual cert_doi is set (${house}); this edition must leave it empty until Karen deposits`)
  if (/10\.83138\/hmtc\.manual\.peptides/.test(norm)) {
    fail.push("PDF prints the manual DOI as if it were deposited")
  }
  const page1 = spawnSync("pdftotext", ["-f", "1", "-l", "1", "-layout", PDF, "-"], { encoding: "utf8" })
  if (page1.status === 0) {
    const p1 = page1.stdout.replace(/[\s\u00AD\u200B]+/g, " ")
    if (!/All rights reserved/i.test(p1)) fail.push("PDF page 1 missing All rights reserved")
    if (!p1.includes(CITATION_TITLE.split(":")[0])) fail.push("PDF page 1 missing citation title")
    if (/Standard No\.|Manual No\./.test(p1)) fail.push("PDF page 1 must not emit Standard No. or Manual No.")
    if (/CC BY|registration pending/i.test(p1)) fail.push("PDF page 1 has CC BY or registration pending")
    note("B2. page 1: title, All rights reserved, no Standard No.")
  }
  const info = spawnSync("pdfinfo", [PDF], { encoding: "utf8" })
  if (info.status === 0) {
    const pages = (info.stdout.match(/Pages:\s+(\d+)/) || [])[1]
    const producer = (info.stdout.match(/Producer:\s+(.+)/) || [])[1]
    note(`B3. pdfinfo pages=${pages} producer=${producer}`)
  }
}

if (fail.length) {
  console.error(`\naudit-cat26-manual-pdf: FAIL (${fail.length})`)
  for (const f of fail) console.error(`  - ${f}`)
  process.exit(1)
}
console.log("audit-cat26-manual-pdf: PASS")
