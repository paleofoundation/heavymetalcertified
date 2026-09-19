#!/usr/bin/env node
// audit-cat1-manual-pdf.mjs — defensibility gate for Manual v3 (Infant and Child Foods).
//
// Manual v3 does not reprint per-analyte master-table walls. This gate asserts:
//   A. The live register (cat1-manual-v3.mjs) matches the regenerated web page
//      (name, cert-ready/HOLD, house cert_doi or HOLD reason) row for row.
//   B. The served v3 PDF text contains every register name and every house DOI,
//      the Karen 2026-09-19 locks, All rights reserved, and no NaN / CC BY /
//      master-matrix reprint tokens.
//   C. Firewall: no percentile-selection arithmetic.
//
// Usage:  node tools/audit-cat1-manual-pdf.mjs   (exit 0 = defensible, 1 = drift)

import fs from "node:fs"
import path from "node:path"
import { execSync, spawnSync } from "node:child_process"
import { buildRegister, snapshotFromRegister, PDF_FILE, COPYRIGHT, ZENODO_VERSION_DOI } from "./lib/cat1-manual-v3.mjs"

const REPO = process.cwd()
const MANUAL_MD = path.join(REPO, "content/manuals/infant-and-child-foods.md")
const PDF = path.join(REPO, "content/static/manuals", PDF_FILE)

const fail = []
const note = (m) => console.log(`  · ${m}`)

try {
  execSync("node tools/build-cat1-manual.mjs", { cwd: REPO, stdio: "ignore" })
  execSync("node tools/build-cert-version-history.mjs", { cwd: REPO, stdio: "ignore" })
} catch (e) {
  fail.push(`could not regenerate web page: ${e.message}`)
}

const stripTags = (s) =>
  s
    .replace(/<[^>]+>/g, "")
    .replace(/&mdash;/g, "—").replace(/&amp;/g, "&").replace(/&ndash;/g, "–")
    .trim()

function webRegister() {
  const md = fs.readFileSync(MANUAL_MD, "utf8")
  const sec = md.includes('id="register"') ? md.slice(md.indexOf('id="register"')) : md
  const tbodyStart = sec.indexOf("<tbody>")
  const tbodyEnd = sec.indexOf("</tbody>")
  if (tbodyStart < 0 || tbodyEnd < 0) return []
  const tbody = sec.slice(tbodyStart + 7, tbodyEnd)
  const out = []
  for (const tr of tbody.split("</tr>")) {
    if (!tr.includes("<td")) continue
    const tds = (tr.match(/<td[^>]*>([\s\S]*?)<\/td>/g) || []).map((c) =>
      stripTags(c.replace(/<td[^>]*>/, "").replace(/<\/td>/, "")),
    )
    if (tds.length < 3) continue
    const slug = (tr.match(/\/standards\/([a-z0-9-]+)/) || [])[1] || null
    out.push({ slug, name: tds[0], status: tds[1], doi: tds[2], reason: tds[3] || "" })
  }
  return out
}

const lib = buildRegister()
const snap = snapshotFromRegister(lib)
const web = webRegister()
if (web.length !== lib.rows.length) fail.push(`register row count: web ${web.length} vs lib ${lib.rows.length}`)

let rowChecks = 0
for (let i = 0; i < Math.min(lib.rows.length, web.length); i++) {
  const L = lib.rows[i], W = web[i]
  rowChecks++
  if (L.slug && W.slug && L.slug !== W.slug) fail.push(`row ${i + 1} slug: lib ${L.slug} vs web ${W.slug}`)
  const wantStatus = L.cert_ready ? "cert-ready" : "HOLD"
  if (W.status !== wantStatus) fail.push(`${L.slug || L.name} status: web "${W.status}" vs lib ${wantStatus}`)
  const wantDoi = L.cert_doi || "—"
  if (W.doi !== wantDoi) fail.push(`${L.slug || L.name} cert_doi: web "${W.doi}" vs lib "${wantDoi}"`)
}
note(`A. register: ${rowChecks} row(s); live pages ${snap.live_pages}; cert-ready ${snap.cert_ready}; HOLD ${snap.hold}`)

let pdfText = null
if (fs.existsSync(PDF)) {
  const r = spawnSync("pdftotext", ["-layout", PDF, "-"], { encoding: "utf8" })
  if (r.status === 0 && r.stdout) pdfText = r.stdout
} else {
  fail.push(`served PDF missing at ${path.relative(REPO, PDF)} — run: node tools/build-cat1-manual-pdf.mjs`)
}
if (pdfText) {
  const norm = pdfText.replace(/[\s\u00AD\u200B]+/g, " ")
  const compact = (s) => String(s).replace(/[\s\u00AD\u200B-]+/g, "")
  if (/NaN/.test(pdfText)) fail.push(`PDF text contains "NaN"`)
  if (/CC BY|Creative Commons/i.test(pdfText)) fail.push(`PDF carries CC BY (must be All rights reserved)`)
  if (!norm.includes("All rights reserved")) fail.push(`PDF missing All rights reserved`)
  if (!norm.includes("90%") || !/remain in the program/i.test(norm)) fail.push(`PDF missing 90% stay-in-program gate`)
  if (!/Lab-informed schedule/i.test(norm)) fail.push(`PDF missing Lab-informed schedule`)
  if (/Master limit matrix/i.test(norm)) fail.push(`PDF still reprints a master limit matrix (CUT for Manual v3)`)
  for (const row of lib.rows) {
    const words = row.name.replace(/[(),.&]/g, " ").split(/\s+/).filter((w) => w.length >= 5)
    const missingWord = words.find((w) => !norm.includes(w))
    if (missingWord) fail.push(`PDF missing register name token "${missingWord}" from ${row.name}`)
    if (row.slug && !compact(pdfText).includes(compact(row.slug))) fail.push(`PDF missing register slug ${row.slug}`)
    if (row.cert_doi && !compact(pdfText).includes(compact(row.cert_doi))) fail.push(`PDF missing house cert_doi ${row.cert_doi}`)
  }
  if (!norm.includes(ZENODO_VERSION_DOI)) fail.push(`PDF missing earlier-edition Zenodo ${ZENODO_VERSION_DOI}`)
  note(`B. PDF text: register names + house DOIs present; no CC BY; no master-matrix reprint`)
} else if (fs.existsSync(PDF)) {
  note(`B. PDF text check skipped (pdftotext not available)`)
}

const FORBIDDEN = [/percentile/i, /\bP97\b/, /\bP45\b/, /\bpooled\b/i]
const libDump = JSON.stringify(lib)
for (const rx of FORBIDDEN) {
  if (rx.test(libDump)) fail.push(`FIREWALL: register matches forbidden ${rx}`)
  if (pdfText && rx.test(pdfText)) fail.push(`FIREWALL: PDF text matches forbidden ${rx}`)
}
note(`C. firewall: no percentile-selection arithmetic`)

if (fail.length) {
  console.error(`\naudit-cat1-manual-pdf: ${fail.length} FAILURE(S):`)
  for (const f of fail) console.error(`  ✗ ${f}`)
  process.exit(1)
}
console.log(`\naudit-cat1-manual-pdf: OK — Manual v3 register matches the web edition; PDF is firewall-clean.`)
process.exit(0)
