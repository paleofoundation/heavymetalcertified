#!/usr/bin/env node
// audit-cat26-manual-consistency.mjs — governance and number gate for the
// Category 26 Program Manual parts (data/manuals/cat26-manual/).
//
// Every integer in the parts must be a compiled cell value, a digit already
// present in the compiled JSON text (instrument identifiers), or a named
// program figure from the Category 1 operating rules this manual adopts.
// No em dash or en dash. No retired ladder. No stale "every cell is control".

import fs from "node:fs"
import path from "node:path"
import { limitGroups, SLUG_ORDER, readRec } from "./lib/cat26-manual.mjs"
import { routineEveryLotHits } from "./lib/every-lot-claim.mjs"

const REPO = process.cwd()
const CDIR = path.join(REPO, "data/manuals/cat26-manual")
const FILES = ["part1-why.md", "part2-program.md", "part4-lot-testing.md", "part5-backmatter.md"]
const fail = []
const ok = (m) => console.log(`  · ${m}`)
const read = (p) => (fs.existsSync(p) ? fs.readFileSync(p, "utf8") : "")
const content = Object.fromEntries(FILES.map((f) => [f, read(path.join(CDIR, f))]))
const all = FILES.map((f) => content[f]).join("\n")

for (const f of FILES) if (!content[f]) fail.push(`missing ${f}`)

const GOLD = [
  ["part1-why.md", "90% remain-in-program", /90% confidence the brand can remain/],
  ["part1-why.md", "metal safety only", /metal safety only/i],
  ["part1-why.md", "not efficacy, legality, or approval", /does not certify efficacy, legality, or approval status/],
  ["part1-why.md", "Index does not set limits", /Limits do not derive from the Heavy Metal Index/],
  ["part1-why.md", "aluminium 25 and 200", /FDA injectable limit \(25\)[\s\S]{0,80}EU drinking-water limit \(200\)/],
  ["part2-program.md", "at or below 100%", /at or below 100% of its published limit/],
  ["part2-program.md", "Remediation not certified", /Remediation[\s\S]{0,40}Not certified/],
  ["part2-program.md", "Suspension", /\bSuspension\b/],
  ["part2-program.md", "Revocation", /\bRevocation\b/],
  ["part2-program.md", "equal at the gate", /equal at the gate/i],
  ["part2-program.md", "no allowed overage", /allowed overage/i],
  ["part2-program.md", "eight numeric ceilings", /eight numeric ceilings/],
  ["part2-program.md", "species tested on the program retest schedule", /tested on the program retest schedule/],
  ["part2-program.md", "never replace the parent", /never replace the parent/],
  ["part2-program.md", "CAPA 10 / 30", /10 business days[\s\S]{0,40}30 calendar days/],
  ["part2-program.md", "CAPA 2 / 10", /2 business days[\s\S]{0,40}10 business days/],
  ["part2-program.md", "12-month", /12-month/],
  ["part2-program.md", "worst-performing lot", /worst-performing lot/],
  ["part2-program.md", "no fresh baseline", /does not require a fresh baseline/],
  ["part2-program.md", "Confidential Remediation Track", /Confidential Remediation Track[\s\S]{0,120}not a certified status/],
  ["part4-lot-testing.md", "five standards", /five subcategory standards/],
  ["part4-lot-testing.md", "program retest schedule", /tested on the program retest schedule/],
  ["part4-lot-testing.md", "Lab-informed schedule", /Lab-informed schedule/],
  ["part4-lot-testing.md", "90% gate", /90% stay-in-program certification gate/],
  ["part4-lot-testing.md", "Decision owner", /Decision owner: Program Operator/],
  ["part4-lot-testing.md", "testing row is not the status", /Remediation testing row/],
  ["part4-lot-testing.md", "data-integrity is Suspension", /data-integrity failure is Suspension under section 2\.4/],
  ["part4-lot-testing.md", "concealment is Revocation", /Concealment of a known exceedance is Revocation under section 2\.4/],
  ["part4-lot-testing.md", "Suspension deadlines match Part 2", /2 business days[\s\S]{0,80}10 business days[\s\S]{0,40}48 hours/],
  ["part4-lot-testing.md", "revocation is not a testing row", /does not keep a revoked product in Remediation/],
  ["part5-backmatter.md", "ICH Q3D", /ICH Q3D elemental-impurity limits/],
  ["part5-backmatter.md", "scope line", /metal safety only/i],
  ["part5-backmatter.md", "four-status glossary", /Certified, Remediation, Suspension, Revocation/],
]
for (const [file, label, re] of GOLD) {
  if (!re.test(content[file] || "")) fail.push(`GOLDEN MISSING [${file}] ${label}`)
}
if (/data-integrity or concealment concern takes the Remediation/.test(content["part4-lot-testing.md"] || "")) {
  fail.push("Part 4 still sends data-integrity and concealment to the Remediation row")
}
ok(`A. golden: ${GOLD.length} required facts`)

function reportEveryLot(label, text) {
  for (const hit of routineEveryLotHits(text)) {
    fail.push(`routine every-lot claim in ${label}:${hit.line} "${hit.phrase}"`)
  }
}
for (const f of FILES) reportEveryLot(f, content[f])
reportEveryLot("cat26-manual.json", read(path.join(REPO, "data/standards/cat26-manual.json")))
reportEveryLot("version history", read(path.join(REPO, "data/standards/version-history/peptides-sarms-and-research-chemicals.json")))
reportEveryLot("manifest", read(path.join(REPO, "data/manuals/manifest.json")))
reportEveryLot("landing", read(path.join(REPO, "content/manuals/peptides-sarms-and-research-chemicals.md")))
reportEveryLot("pdf builder", read(path.join(REPO, "tools/build-cat26-manual-pdf.mjs")))
ok("A2. no routine every-lot testing claim outside remediation")

const FORBIDDEN = [
  ["em dash", /—|&mdash;/],
  ["en dash", /–|&ndash;/],
  ["MaxPoL", /MaxPoL/i],
  ["Status A-E", /Status A-E/i],
  ["150%", /150\s*%/],
  ["transitional allowance", /transitional allowance/i],
  ["probation", /\bprobation\b/i],
  ["percentile", /percentile|\bP97\b|\bP45\b/i],
  ["Paleo Foundation", /Paleo Foundation/],
  ["every cell is control", /every cell is/i],
  ["no-regulatory-anchor", /no-regulatory-anchor/i],
  ["author-year", /\([A-Z][a-z]+,?\s+\d{4}\)/],
]
for (const [label, re] of FORBIDDEN) {
  const hit = all.match(re)
  if (hit) fail.push(`FORBIDDEN: ${label} -> "${hit[0]}"`)
}
ok("B. forbidden ladder, dashes, and stale control prose absent")

const limits = limitGroups()
const compiledText = SLUG_ORDER.map((slug) => JSON.stringify(readRec(slug))).join("\n")
const PROGRAM = new Set([
  1, 2, 3, 4, 5, 7, 8, 10, 12, 26, 30, 48, 80, 90, 95, 100,
  17025, 2026,
])
const seen = new Set()
for (const m of all.matchAll(/\d+/g)) {
  const n = Number(m[0])
  if (seen.has(n)) continue
  seen.add(n)
  const inRecord = compiledText.includes(String(n))
  const cellValue = Object.values(limits.parenteralMetals).includes(n)
    || Object.values(limits.oralMetals).includes(n)
    || n === limits.parenteralAl
    || n === limits.oralAl
  if (!inRecord && !cellValue && !PROGRAM.has(n)) fail.push(`integer ${n} is not in the compiled records or the program allowlist`)
}
ok(`C. integers checked: ${seen.size} distinct`)

if (fail.length) {
  console.error(`\naudit-cat26-manual-consistency: FAIL (${fail.length})`)
  for (const f of fail) console.error(`  - ${f}`)
  process.exit(1)
}
console.log("audit-cat26-manual-consistency: PASS")
