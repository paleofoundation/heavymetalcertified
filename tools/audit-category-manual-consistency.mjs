#!/usr/bin/env node
// audit-category-manual-consistency.mjs
//
// Every integer in the authored parts must be a program figure, the category
// number, or a digit already present in the compiled JSON. Parenthesised
// ceilings are forbidden. The landing matrix must match the compiled cells:
// a capped species is a dash, never a number of its own.
//
// Usage: node tools/audit-category-manual-consistency.mjs --cat=27

import fs from "node:fs"
import path from "node:path"
import { loadCategory, PROGRAM_INTEGERS, partFiles } from "./lib/category-program-manual.mjs"
import { routineEveryLotHits } from "./lib/every-lot-claim.mjs"

const REPO = process.cwd()
const arg = process.argv.slice(2).find((a) => a.startsWith("--cat="))
const category = arg ? Number(arg.split("=")[1]) : NaN
const facts = loadCategory(category)
if (!facts.ok) {
  console.error(`audit-category-manual-consistency: cat ${category} dropped: ${facts.reason}`)
  process.exit(2)
}

const fail = []
const ok = (m) => console.log(`  · ${m}`)
const CDIR = path.join(REPO, "data/manuals", `cat${facts.category}-manual`)
const FILES = Object.keys(partFiles(facts))
const content = Object.fromEntries(FILES.map((f) => {
  const p = path.join(CDIR, f)
  return [f, fs.existsSync(p) ? fs.readFileSync(p, "utf8") : ""]
}))
const all = FILES.map((f) => content[f]).join("\n")
for (const f of FILES) if (!content[f]) fail.push(`missing ${f}`)

const GOLD = [
  ["part1-why.md", /90% confidence the brand can remain/],
  ["part1-why.md", /metal safety only/i],
  ["part1-why.md", /does not certify efficacy, legality, or approval status/],
  ["part1-why.md", /Limits do not derive from the Heavy Metal Index/],
  ["part2-program.md", /at or below 100% of its published limit/],
  ["part2-program.md", /Remediation/],
  ["part2-program.md", /\bSuspension\b/],
  ["part2-program.md", /\bRevocation\b/],
  ["part2-program.md", /equal for certification/i],
  ["part2-program.md", /allowed overage/i],
  ["part2-program.md", /10 business days[\s\S]{0,40}30 calendar days/],
  ["part2-program.md", /2 business days[\s\S]{0,40}10 business days/],
  ["part2-program.md", /12-month/],
  ["part2-program.md", /worst-performing lot/],
  ["part2-program.md", /does not require a fresh baseline/],
  ["part2-program.md", /Confidential Remediation Track[\s\S]{0,160}not a certified status/],
  ["part4-lot-testing.md", new RegExp(`${facts.countWord} subcategory standards`)],
  ["part4-lot-testing.md", /tested on the program retest schedule/],
  ["part4-lot-testing.md", /90% stay-in-program rule/],
  ["part4-lot-testing.md", /Decision owner: Program Operator/],
  ["part4-lot-testing.md", /Remediation testing row/],
  ["part4-lot-testing.md", /data-integrity failure is Suspension under section 2\.4/],
  ["part4-lot-testing.md", /Concealment of a known exceedance is Revocation under section 2\.4/],
  ["part4-lot-testing.md", /2 business days[\s\S]{0,80}10 business days[\s\S]{0,40}48 hours/],
  ["part4-lot-testing.md", /does not keep a revoked product in Remediation/],
  ["part5-backmatter.md", /metal safety only/i],
  ["part5-backmatter.md", /Certified, Remediation, Suspension, Revocation/],
  ["part5-backmatter.md", /This manual does not add a ceiling/],
]
for (const [file, re] of GOLD) {
  if (!re.test(content[file] || "")) fail.push(`GOLDEN MISSING [${file}] ${re}`)
}
for (const analyte of facts.panel) {
  const info = facts.analytes[analyte]
  if (!PARENT_OF_SAFE(info)) continue
  const blob = `${content["part2-program.md"]}\n${content["part5-backmatter.md"]}`
  if (info.mode === "capped" && !new RegExp(`${info.name} is capped at ${info.parentName}`, "i").test(blob)) {
    fail.push(`species prose missing capped ${info.name}`)
  }
  if (info.mode === "not_material" && !new RegExp(`${info.name} is not material`, "i").test(blob)) {
    fail.push(`species prose missing not-material ${info.name}`)
  }
  if (info.mode === "numeric" && !new RegExp(`${info.name} publishes the number already on the live standard`, "i").test(blob)) {
    fail.push(`species prose missing numeric ${info.name}`)
  }
  if (info.mode === "mixed" && !new RegExp(`Where ${info.name} has no separate number`, "i").test(blob)) {
    fail.push(`species prose missing mixed ${info.name}`)
  }
}
function PARENT_OF_SAFE(info) {
  return info && info.name && ["capped", "not_material", "numeric", "mixed"].includes(info.mode) && info.parentName
}
ok(`A. golden facts for Category ${facts.category}`)

function reportEveryLot(label, text) {
  for (const hit of routineEveryLotHits(text)) {
    fail.push(`routine every-lot claim in ${label}:${hit.line} "${hit.phrase}"`)
  }
}
for (const f of FILES) reportEveryLot(f, content[f])
const manualJson = path.join(REPO, "data/standards", `cat${facts.category}-manual.json`)
const versionJson = path.join(REPO, "data/standards/version-history", `${facts.slug}.json`)
if (fs.existsSync(manualJson)) reportEveryLot(`cat${facts.category}-manual.json`, fs.readFileSync(manualJson, "utf8"))
else fail.push("manual json missing")
if (fs.existsSync(versionJson)) reportEveryLot(`${facts.slug} version history`, fs.readFileSync(versionJson, "utf8"))
else fail.push("version history missing")
reportEveryLot("category-program-manual.mjs", fs.readFileSync(path.join(REPO, "tools/lib/category-program-manual.mjs"), "utf8"))
reportEveryLot("build-category-program-manual-pdf.mjs", fs.readFileSync(path.join(REPO, "tools/build-category-program-manual-pdf.mjs"), "utf8"))
ok("A2. no routine every-lot testing claim outside remediation")

const FORBIDDEN = [
  ["em dash", /—|&mdash;/],
  ["en dash", /–|&ndash;/],
  ["parenthesised number", /\(\d+\)/],
  ["MaxPoL", /MaxPoL/i],
  ["Status A-E", /Status A-E/i],
  ["150%", /150\s*%/],
  ["transitional allowance", /transitional allowance/i],
  ["probation", /\bprobation\b/i],
  ["percentile", /percentile|\bP97\b|\bP45\b/i],
  ["Paleo Foundation", /Paleo Foundation/],
  ["every cell is control", /every cell is/i],
  ["author-year", /\([A-Z][a-z]+,?\s+\d{4}\)/],
  ["internal ORDER", /\bORDER\b/],
  ["internal HOLD", /\bHOLD\b/],
  ["internal lint", /\blint\b/i],
  ["internal Elon", /\bElon\b/],
  ["internal Claude", /\bClaude\b/],
  ["internal adjudication", /\badjudication\b/i],
  ["internal Daubert", /\bDaubert\b/],
  ["internal gate", /\bgate\b/i],
  ["internal canary", /\bcanary\b/i],
  ["internal WARN", /\bWARN\b/],
  ["internal STRICT", /\bSTRICT\b/],
]
for (const [label, re] of FORBIDDEN) {
  const hit = all.match(re)
  if (hit) fail.push(`FORBIDDEN: ${label} -> "${hit[0]}"`)
}
ok("B. forbidden dashes, ceilings, and internal language absent")

const compiledText = facts.pages.map((p) => fs.readFileSync(path.join(REPO, "data/standards", facts.compiled_dir, `${p.record}.json`), "utf8")).join("\n")
const seen = new Set()
for (const m of all.matchAll(/\d+/g)) {
  const n = Number(m[0])
  if (seen.has(n)) continue
  seen.add(n)
  const allowed = PROGRAM_INTEGERS.has(n) || n === facts.category || compiledText.includes(String(n))
  if (!allowed) fail.push(`integer ${n} is not a program figure, the category number, or in the compiled records`)
}
ok(`C. integers checked: ${seen.size} distinct`)

const landing = path.join(REPO, "content/manuals", `${facts.slug}.md`)
if (!fs.existsSync(landing)) fail.push("landing page missing")
else {
  const html = fs.readFileSync(landing, "utf8")
  reportEveryLot("landing", html)
  const rows = [...html.matchAll(/<tr>([\s\S]*?)<\/tr>/g)].map((m) => m[1])
  let checked = 0
  for (const page of facts.pages) {
    const tr = rows.find((r) => r.includes(`href="/standards/${page.slug}"`))
    if (!tr) { fail.push(`matrix missing row ${page.slug}`); continue }
    const tds = [...tr.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/g)].map((m) =>
      m[1].replace(/<[^>]+>/g, "").replace(/&mdash;/g, "—").replace(/\s+/g, " ").trim())
    const values = tds.slice(1, 1 + facts.panel.length)
    const basis = tds[tds.length - 1]
    if (values.length !== facts.panel.length) {
      fail.push(`${page.slug} matrix width ${values.length}, panel ${facts.panel.length}`)
      continue
    }
    facts.panel.forEach((analyte, i) => {
      const cell = page.cells[analyte]
      const expected = cell.mode === "not_material" ? "n/m" : cell.mode === "capped" ? "—" : String(cell.value)
      if (values[i] !== expected) fail.push(`${page.slug} ${analyte} matrix ${JSON.stringify(values[i])} != compiled ${JSON.stringify(expected)}`)
      if ((cell.mode === "capped" || cell.mode === "not_material") && /\d/.test(values[i])) {
        fail.push(`${page.slug} ${analyte} printed a number for a non-numeric cell`)
      }
    })
    if (basis !== page.basis) fail.push(`${page.slug} basis ${JSON.stringify(basis)} != ${JSON.stringify(page.basis)}`)
    checked++
  }
  ok(`D. landing matrix matches compiled cells (${checked} rows)`)
  if (/—|&mdash;/.test(html.replace(/<td\b[^>]*>[\s\S]*?<\/td>/g, ""))) {
    const prose = html.replace(/<td\b[^>]*>[\s\S]*?<\/td>/g, "")
    if (/—|&mdash;/.test(prose)) fail.push("landing prose contains an em dash outside a matrix cell")
  }
}

if (fail.length) {
  console.error(`\naudit-category-manual-consistency: FAIL (${fail.length})`)
  for (const f of fail) console.error(`  - ${f}`)
  process.exit(1)
}
console.log(`audit-category-manual-consistency: PASS cat ${facts.category}`)
