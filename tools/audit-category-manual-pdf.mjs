#!/usr/bin/env node
// audit-category-manual-pdf.mjs — react-pdf producer, register, and number gate.
//
// Usage: node tools/audit-category-manual-pdf.mjs --cat=27

import fs from "node:fs"
import path from "node:path"
import { spawnSync } from "node:child_process"
import { checkPdfProducer } from "./pdf-producer-lint.mjs"
import { loadCategory, PROGRAM_INTEGERS, editionDateIntegers, HOUSE_PREFIX } from "./lib/category-program-manual.mjs"

const REPO = process.cwd()
const arg = process.argv.slice(2).find((a) => a.startsWith("--cat="))
const category = arg ? Number(arg.split("=")[1]) : NaN
const facts = loadCategory(category)
if (!facts.ok) {
  console.error(`audit-category-manual-pdf: cat ${category} dropped: ${facts.reason}`)
  process.exit(2)
}

const fail = []
const note = (m) => console.log(`  · ${m}`)
const PDF = path.join(REPO, "content/static/manuals", facts.pdf)
const deposit = path.join(REPO, "data/manuals", facts.pdf)
if (!fs.existsSync(PDF)) fail.push(`served PDF missing`)
if (!fs.existsSync(deposit)) fail.push(`deposit PDF missing at data/manuals`)

const bytes = fs.existsSync(PDF) ? fs.readFileSync(PDF) : null
if (bytes) {
  const prod = checkPdfProducer(bytes)
  if (!prod.ok) fail.push(`PDF producer fail: react-pdf=${prod.hasReactPdf} browser=${prod.browserHit || "none"}`)
  else note("B. producer: react-pdf, no browser-print marker")
}

let pdfText = ""
let pages = null
if (bytes) {
  const r = spawnSync("pdftotext", ["-layout", PDF, "-"], { encoding: "utf8" })
  if (r.status !== 0 || !r.stdout) fail.push("pdftotext failed")
  else pdfText = r.stdout
  const info = spawnSync("pdfinfo", [PDF], { encoding: "utf8" })
  if (info.status === 0) {
    pages = Number((info.stdout.match(/Pages:\s+(\d+)/) || [])[1])
    const producer = (info.stdout.match(/Producer:\s+(.+)/) || [])[1]
    note(`B3. pdfinfo pages=${pages} producer=${(producer || "").trim()}`)
  } else fail.push("pdfinfo failed")
}

if (pdfText) {
  const norm = pdfText.replace(/[\s\u00AD\u200B]+/g, " ")
  const compact = (s) => String(s).replace(/[\s\u00AD\u200B-]+/g, "")
  if (/NaN/.test(pdfText)) fail.push("PDF contains NaN")
  if (/CC BY|Creative Commons/i.test(pdfText)) fail.push("PDF carries CC BY")
  if (!norm.includes("All rights reserved")) fail.push("PDF missing All rights reserved")
  if (/Master limit matrix/i.test(norm)) fail.push("PDF reprints a master limit matrix")
  if (!/metal safety only/i.test(norm)) fail.push("PDF missing metal safety only")
  if (!/efficacy/i.test(norm) || !/legality/i.test(norm) || !/approval status/i.test(norm)) {
    fail.push("PDF missing efficacy / legality / approval status scope")
  }
  if (!/90%/.test(norm)) fail.push("PDF missing 90% stay-in-program rule")
  if (/10\.83138\/hmtc\.manual\./.test(norm)) fail.push("PDF prints the manual DOI as if it were deposited")
  if (/\b(ORDER|HOLD|Elon|Claude|adjudication|Daubert|canary)\b/.test(norm)) fail.push("PDF contains internal process language")
  if (/[—–]/.test(pdfText)) fail.push("PDF contains an em dash or en dash")
  for (const row of facts.pages) {
    if (!compact(pdfText).includes(compact(row.slug))) fail.push(`PDF missing slug ${row.slug}`)
    if (!compact(pdfText).includes(compact(row.cert_doi))) fail.push(`PDF missing DOI ${row.cert_doi}`)
    if (!row.cert_doi.startsWith(`${HOUSE_PREFIX}/hmtc.std.${facts.category}.`)) fail.push(`${row.slug} DOI prefix`)
  }
  const doiBlob = facts.pages.map((r) => r.cert_doi).join(" ")
  const allowed = new Set([...PROGRAM_INTEGERS, facts.category, ...editionDateIntegers(), 83138, 2348, 7259])
  const seen = new Set()
  for (const m of pdfText.matchAll(/\d+/g)) {
    const n = Number(m[0])
    if (seen.has(n)) continue
    seen.add(n)
    if (allowed.has(n)) continue
    if (doiBlob.includes(String(n))) continue
    fail.push(`PDF integer ${n} is not a program figure, the edition date, the category number, or a DOI fragment`)
  }
  const page1 = spawnSync("pdftotext", ["-f", "1", "-l", "1", "-layout", PDF, "-"], { encoding: "utf8" })
  if (page1.status === 0) {
    const p1 = page1.stdout.replace(/[\s\u00AD\u200B]+/g, " ")
    if (!/All rights reserved/i.test(p1)) fail.push("PDF page 1 missing All rights reserved")
    if (!p1.includes(facts.name.split(":")[0])) fail.push("PDF page 1 missing citation title")
    if (/Standard No\.|Manual No\./.test(p1)) fail.push("PDF page 1 must not emit Standard No. or Manual No.")
    note("B2. page 1: title, All rights reserved, no Standard No.")
  }
  note(`A. register: ${facts.pages.length} standards`)
}

if (fail.length) {
  console.error(`\naudit-category-manual-pdf: FAIL (${fail.length})`)
  for (const f of fail) console.error(`  - ${f}`)
  process.exit(1)
}
console.log(`audit-category-manual-pdf: PASS cat ${facts.category} pages=${pages}`)
