#!/usr/bin/env node
// audit-cat1-manual-consistency.mjs — the standing INCONSISTENCY GATE for the full
// Infant & Child Foods Program Manual (Parts 1/2/4/5, the authored governance +
// lot-testing content in data/manuals/cat1-manual/), under the Method v2 status
// model: Certified | Remediation (non-certified) | Suspension | Revocation.
// Part 3's numbers are audited separately, cell-for-cell, by audit-cat1-manual-pdf.mjs.
//
// This is a Daubert artifact: a governance manual that contradicts itself, the
// reconciled source, or the live /program pages is a self-inflicted impeachment. It
// asserts, hard:
//   A. GOLDEN present — the four-status model + load-bearing lot-testing facts.
//   B. FORBIDDEN absent — the RETIRED MaxPoL % bands / Status A–E certification
//      ladder / "150% transitional allowance", in any form, anywhere in the manual.
//   C. FIREWALL — no percentile-selection arithmetic in the manual (gov-limit only).
//   D. CROSS-PART — CAPA/containment facts that appear in more than one Part agree.
//   E. CROSS-SOURCE — the live /program + briefing pages carry no retired ladder either.
//
// Exit non-zero on any failure. Run before regenerating/serving the manual PDF.

import fs from "node:fs"
import path from "node:path"
import { lintAnalyteTierStatus } from "./lib/analyte-tier-status-lint.mjs"

const REPO = process.cwd()
const CDIR = path.join(REPO, "data/manuals/cat1-manual")
const FILES = ["part1-why.md", "part2-program.md", "part4-lot-testing.md", "part5-backmatter.md"]
const PROG = path.join(REPO, "content/program")

const fail = []
const ok = (m) => console.log(`  · ${m}`)
const read = (p) => (fs.existsSync(p) ? fs.readFileSync(p, "utf8") : "")
const norm = (s) => s.replace(/–|—/g, "-").replace(/\s+/g, " ")
const content = Object.fromEntries(FILES.map((f) => [f, read(path.join(CDIR, f))]))
const all = FILES.map((f) => content[f]).join("\n")
const allN = norm(all)

for (const f of FILES) if (!content[f]) fail.push(`missing content file: data/manuals/cat1-manual/${f}`)

// ── A. golden values (present in the named file) ─────────────────────────────
// Method v2 status model + the load-bearing lot-testing facts that must survive.
const GOLD = [
  ["part2-program.md", "Certified = at/below 100% of every published limit", /at or below 100% of its published limit/i],
  ["part2-program.md", "status: Certified", /\bCertified\b/],
  ["part2-program.md", "status: Remediation (not certified)", /Remediation[\s\S]{0,90}(not certified|Not certified)/i],
  ["part2-program.md", "status: Suspension", /\bSuspension\b/],
  ["part2-program.md", "status: Revocation", /\bRevocation\b/],
  ["part2-program.md", "all claim analytes equal at the gate", /equal at the gate/i],
  ["part2-program.md", "no allowed overage / transitional band", /allowed overage|transitional band/i],
  ["part2-program.md", "eight limit analytes", /eight limit analytes/i],
  ["part2-program.md", "pathway species never replace the parent", /never replace the parent/i],
  ["part2-program.md", "CAPA 10 business days / 30 calendar days", /10 business days[\s\S]{0,60}30 calendar days/],
  ["part2-program.md", "CAPA 2 / 10 business days", /2 business days[\s\S]{0,60}10 business days/],
  ["part2-program.md", "12-month default to Certified", /12[ -]month/],
  ["part2-program.md", "three-lot baseline, worst-performing lot", /worst-performing lot/],
  ["part2-program.md", "50% reflex speciation trigger", /50%/],
  ["part2-program.md", "80% early warning", /80%/],
  ["part2-program.md", "Suspension reinstatement — no fresh baseline", /does not require a fresh baseline/],
  ["part2-program.md", "Confidential Remediation Track — not a certified status", /Confidential Remediation Track[\s\S]{0,160}(not a certified status|non-certified)/i],
  ["part4-lot-testing.md", "nine subcategories", /nine subcategor/i],
  ["part4-lot-testing.md", "frequency matrix present", /Testing-Frequency Matrix|Certification status/i],
  ["part4-lot-testing.md", "single Remediation row", /Remediation[\s\S]{0,80}(Every lot|every lot)/i],
  ["part5-backmatter.md", "government-limit default method", /government-limit default/i],
  ["part5-backmatter.md", "glossary — four-status lifecycle", /Certified, Remediation, Suspension, Revocation/],
  ["part1-why.md", "limits do not derive from the Index", /Limits do not derive from the Heavy Metal Index|traces to a named sovereign/i],
  ["part1-why.md", "90% remain-in-program gate", /90% confidence the brand can remain/],
  ["part4-lot-testing.md", "totals every completing lot", /Totals are run on every completing lot/],
  ["part4-lot-testing.md", "Lab-informed schedule", /Lab-informed schedule/],
  ["part4-lot-testing.md", "90% stay-in-program gate", /90% stay-in-program certification gate|90% confidence the brand can remain/],
  ["part4-lot-testing.md", "decision owner Program Operator", /Decision owner:\s*Program Operator/],
]
for (const [file, label, re] of GOLD) {
  if (!re.test(norm(content[file] || ""))) fail.push(`GOLDEN MISSING [${file}] ${label}`)
}
ok(`A. golden values: ${GOLD.length} required Method v2 governance/lot-testing facts checked`)

// ── B/C. forbidden variants (the RETIRED MaxPoL ladder) + firewall ───────────
// Absent in ALL manual content. These are the cert-ladder constructs the v2 status
// rewrite retired; leaving any of them is the FAIL condition of the rewrite order.
const FORBIDDEN = [
  ["RETIRED MaxPoL metric", /MaxPoL/i],
  ["RETIRED Status A–E ladder", /Status A-E|statuses A through E/i],
  ["RETIRED 150% figure", /150\s*%/],
  ["RETIRED 'transitional allowance'", /transitional allowance/i],
  ["RETIRED 'Transitional (mark withheld)'", /Transitional \(mark withheld\)/i],
  ["RETIRED probation status", /\bprobation\b/i],
  ["RETIRED % band 101-150", /\b101\s*-\s*150\b/],
  ["RETIRED % band 151-175", /\b151\s*-\s*175\b/],
  ["RETIRED % band 176-200", /\b176\s*-\s*200\b/],
  ["RETIRED % band 151-200", /\b151\s*-\s*200\b/],
  ["RETIRED >200% band", /200%\s*MaxPoL|above 200%|>\s*200%/i],
  ["FIREWALL percentile-selection", /percentile|\bP97\b|\bP45\b|\bpooled\b|\bP\d{2}\b/i],
  ["stale 'fifteen subcategories'", /fifteen subcategor/i],
  ["wrong governing body 'Paleo Foundation'", /Paleo Foundation/],
  ["informal 'Rudy's Law'", /Rudy'?s Law/i],
]
for (const [label, re] of FORBIDDEN) {
  const hit = allN.match(re)
  if (hit) fail.push(`FORBIDDEN present: ${label} → "${hit[0]}"`)
}
// bare "fresh baseline" not part of the required negation
for (const m of all.matchAll(/fresh baseline/gi)) {
  const ctx = all.slice(Math.max(0, m.index - 22), m.index)
  if (!/does not require a /i.test(ctx)) fail.push(`FORBIDDEN: bare "fresh baseline" (must be "does not require a fresh baseline")`)
}
ok(`B/C. forbidden variants + firewall: ${FORBIDDEN.length} patterns clean; retired MaxPoL ladder absent; government-limit only`)

// ── D. cross-part agreement (a fact stated in >1 Part must match) ────────────
// Suspension containment is "immediate (within 48 hours)" in both Parts that carry it.
for (const [name, t] of [["part2", content["part2-program.md"]], ["part4", content["part4-lot-testing.md"]]]) {
  if (!/Immediate \(within 48 hours\)/i.test(norm(t || ""))) fail.push(`CROSS-PART: ${name} is missing the Suspension "Immediate (within 48 hours)" containment`)
}
ok(`D. cross-part agreement: Suspension containment timing consistent across Parts 2/4`)

// ── E. cross-source: live /program + briefing pages agree with the manual ────
// The retired ladder must be gone from the cornerstone and the primer too. NOTE:
// structure.md legitimately retains the percentile limit-SETTING methodology (P97/P45),
// which is a distinct axis from the status model and is deliberately NOT flagged here.
const structure = read(path.join(PROG, "structure.md"))
const primer = read(path.join(REPO, "data/briefings/hmtc-primer.md"))
const CROSS_FORBIDDEN = [
  ["MaxPoL", /MaxPoL/i],
  ["Status A–E ladder", /Status A-E|statuses A through E/i],
  ["150% transitional / transitional allowance", /150\s*%\s*transitional|transitional allowance/i],
  ["Transitional (mark withheld)", /Transitional \(mark withheld\)/i],
]
if (structure) {
  if (/reinstatement requires a fresh baseline/i.test(norm(structure))) fail.push(`CROSS-SOURCE: content/program/structure.md still asserts reinstatement "requires a fresh baseline" (contradicts the manual)`)
  for (const [label, re] of CROSS_FORBIDDEN) if (re.test(norm(structure))) fail.push(`CROSS-SOURCE: content/program/structure.md still carries retired "${label}"`)
} else fail.push("CROSS-SOURCE: content/program/structure.md not found")
if (primer) {
  for (const [label, re] of CROSS_FORBIDDEN) if (re.test(norm(primer))) fail.push(`CROSS-SOURCE: data/briefings/hmtc-primer.md still carries retired "${label}"`)
}
ok(`E. cross-source: /program + briefing pages carry no retired MaxPoL ladder`)

// ── F. analyte Tier 1/2 must not drive status ────────────────────────────────
// Product risk tiers and the appeals committee tiers are different axes.
const STATUS_SURFACES = [
  ...FILES.map((f) => [path.join(CDIR, f), `data/manuals/cat1-manual/${f}`]),
  [path.join(PROG, "structure.md"), "content/program/structure.md"],
  [path.join(PROG, "corrective-action.md"), "content/program/corrective-action.md"],
  [path.join(REPO, "tools/lib/manual-v3-page.mjs"), "tools/lib/manual-v3-page.mjs"],
  [path.join(REPO, "data/briefings/hmtc-primer.md"), "data/briefings/hmtc-primer.md"],
]
for (const [abs, rel] of STATUS_SURFACES) {
  const text = read(abs)
  if (!text) {
    fail.push(`TIER-STATUS: missing ${rel}`)
    continue
  }
  for (const hit of lintAnalyteTierStatus(text, rel)) fail.push(`TIER-STATUS ${hit}`)
}
ok(`F. analyte Tier 1/2 does not drive certification status on Manual v3 / program / primer surfaces`)

// ── verdict ──────────────────────────────────────────────────────────────────
if (fail.length) {
  console.error(`\naudit-cat1-manual-consistency: ${fail.length} INCONSISTENCY(IES):`)
  for (const f of fail) console.error(`  ✗ ${f}`)
  process.exit(1)
}
console.log(`\naudit-cat1-manual-consistency: OK — the manual is internally consistent, states the Method v2 four-status model (Certified | Remediation | Suspension | Revocation), treats every claim analyte as equal at the gate, is firewall-clean, carries no retired MaxPoL or analyte-tier status ladder, and agrees with the live /program pages.`)
process.exit(0)
