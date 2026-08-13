#!/usr/bin/env node
// audit-cat1-manual-consistency.mjs — the standing INCONSISTENCY GATE for the full
// Infant & Child Foods Program Manual (Parts 1/2/4/5, the authored governance +
// lot-testing content in data/manuals/cat1-manual/). Part 3's numbers are audited
// separately, cell-for-cell against the web edition, by audit-cat1-manual-pdf.mjs.
//
// This is a Daubert artifact: a governance manual that contradicts itself, the
// reconciled source, or the live /program pages is a self-inflicted impeachment. So
// this asserts, hard:
//   A. GOLDEN VALUES present — the load-bearing governance/lot-testing facts appear,
//      in their reconciled form (status bands, CAPA windows, tiers, baseline, triggers).
//   B. FORBIDDEN variants absent — no superseded value, wrong governing body, retired
//      remediation mechanism, or stale count anywhere in the manual content.
//   C. FIREWALL — no percentile-selection arithmetic (government-limit only).
//   D. CROSS-PART agreement — the values that appear in more than one Part agree.
//   E. CROSS-SOURCE — the live /program pages agree with the manual on the same facts
//      (no "fifteen subcategories", no Status-D "fresh baseline" error).
//
// Exit non-zero on any failure. Run before regenerating/serving the manual PDF.

import fs from "node:fs"
import path from "node:path"

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
// Each: [file, human label, RegExp on the normalized text]
const GOLD = [
  ["part2-program.md", "Status A ≤100%", /MaxPoL\s*[≤<]=?\s*100%/],
  ["part2-program.md", "Status B band 101-150%, Tier 2 only", /101-150%/],
  ["part2-program.md", "Status C Low band 151-175%", /151-175%/],
  ["part2-program.md", "Status C High band 176-200%", /176-200%/],
  ["part2-program.md", "Status D >200%", /200% MaxPoL|Above 200%|>\s*200%/],
  ["part2-program.md", "Tier 1 = Pb, Cd, iAs, mercury", /Tier 1[\s\S]{0,120}(Lead|Pb)[\s\S]{0,80}(Cadmium|Cd)[\s\S]{0,80}(arsenic|iAs)/i],
  ["part2-program.md", "Tier 2 = Ni, Al, Sn, Cr", /Tier 2[\s\S]{0,120}(Nickel|Ni)[\s\S]{0,80}(Aluminium|Al)[\s\S]{0,80}(Tin|Sn)/i],
  ["part2-program.md", "CAPA B 10 business days / 30 calendar days", /10 business days[\s\S]{0,60}30 calendar days/],
  ["part2-program.md", "CAPA C 5 / 15 business days", /5 business days[\s\S]{0,60}15 business days/],
  ["part2-program.md", "CAPA D 2 / 10 business days", /2 business days[\s\S]{0,60}10 business days/],
  ["part2-program.md", "12-month default to Status A", /12[ -]month/],
  ["part2-program.md", "three-lot baseline, worst-performing lot", /worst-performing lot/],
  ["part2-program.md", "eight limit analytes", /eight limit analytes/i],
  ["part2-program.md", "50% reflex speciation trigger", /50%/],
  ["part2-program.md", "80% PoL Tier-1 warning", /80%/],
  ["part2-program.md", "Status D reinstatement — no fresh baseline", /does not require a fresh baseline/],
  ["part2-program.md", "Confidential Remediation Track — mark-gated", /Mark[\s\S]{0,120}(not be used|shall not be used)[\s\S]{0,120}Status A or B/i],
  ["part4-lot-testing.md", "nine subcategories", /nine subcategor/i],
  ["part4-lot-testing.md", "frequency matrix present", /Testing-Frequency Matrix|Certification Status/i],
  ["part4-lot-testing.md", "C-Low brand's own sampling", /Low[\s\S]{0,120}own accredited/i],
  ["part4-lot-testing.md", "C-High third-party sampling", /High[\s\S]{0,120}third-party sampling/i],
  ["part5-backmatter.md", "government-limit default method", /government-limit default/i],
  ["part5-backmatter.md", "glossary MaxPoL", /MaxPoL/],
  ["part1-why.md", "limits do not derive from the Index", /Limits do not derive from the Heavy Metal Index|traces to a named sovereign/i],
]
for (const [file, label, re] of GOLD) {
  if (!re.test(norm(content[file] || ""))) fail.push(`GOLDEN MISSING [${file}] ${label}`)
}
ok(`A. golden values: ${GOLD.length} required governance/lot-testing facts checked`)

// ── B/C. forbidden variants + firewall (absent in ALL content) ───────────────
const FORBIDDEN = [
  ["FIREWALL percentile-selection", /percentile|\bP97\b|\bP45\b|\bpooled\b|\bP\d{2}\b/i],
  ["FIREWALL pass-rate arithmetic", /\b9[04]\/[34]0\b|\b94%\b.*\b42%\b/],
  ["stale 'fifteen subcategories'", /fifteen subcategor/i],
  ["miscounted 'ten-analyte' panel", /ten-analyte|eleven analyte|eleventh/i],
  ["wrong governing body 'Paleo Foundation'", /Paleo Foundation/],
  ["informal 'Rudy's Law'", /Rudy'?s Law/i],
  ["retired 'certificate held' remediation", /certificate (is )?held|certificate unaffected/i],
  ["overlapping band 150-175", /150-175%/],
  ["overlapping band 175-200", /175-200%/],
]
for (const [label, re] of FORBIDDEN) {
  const hit = allN.match(re)
  // "fresh baseline" is allowed only inside the negation, handled as a golden value; not scanned here.
  if (hit) fail.push(`FORBIDDEN present: ${label} → "${hit[0]}"`)
}
// bare "fresh baseline" not part of the required negation
for (const m of all.matchAll(/fresh baseline/gi)) {
  const ctx = all.slice(Math.max(0, m.index - 22), m.index)
  if (!/does not require a /i.test(ctx)) fail.push(`FORBIDDEN: bare "fresh baseline" (must be "does not require a fresh baseline")`)
}
ok(`B/C. forbidden variants + firewall: ${FORBIDDEN.length} patterns clean; government-limit only`)

// ── D. cross-part agreement (a fact stated in >1 Part must match) ────────────
// Band correctness (the 151-175 / 176-200 integers) is enforced by the forbidden
// overlapping-variant check in B. Here we catch the remaining cross-part drift risk:
// every Part that carries a Status-C probation band must use the SAME integer pair,
// and containment timing must not swap between Parts.
const bandParts = { part2: content["part2-program.md"], part4: content["part4-lot-testing.md"], part5: content["part5-backmatter.md"] }
for (const [name, t] of Object.entries(bandParts)) {
  const tn = norm(t || "")
  if (/probation|Status C/i.test(tn)) {
    if (/\b1[0-9][0-9]-175%/.test(tn) && !/151-175%/.test(tn)) fail.push(`CROSS-PART: ${name} states a Status C Low band other than 151-175%`)
    if (/\b1[0-9][0-9]-200%/.test(tn) && !/176-200%/.test(tn)) fail.push(`CROSS-PART: ${name} states a Status C High band other than 176-200%`)
  }
}
// containment must not be swapped: Status C = "within 48 hours"; Status D = "immediate".
for (const [name, t] of [["part2", content["part2-program.md"]], ["part4", content["part4-lot-testing.md"]]]) {
  if (!/Immediate \(within 48 hours\)/i.test(norm(t || ""))) fail.push(`CROSS-PART: ${name} is missing the Status D "immediate (within 48 hours)" containment`)
}
ok(`D. cross-part agreement: Status-C bands and containment timing consistent across Parts 2/4/5`)

// ── E. cross-source: live /program + briefing pages agree with the manual ────
// NOTE on scope: structure.md's "fifteen subcategory standards … across eight
// categories" is a correct PROGRAM-WIDE count (15 catalog rows / 8 categories), NOT
// the Cat-1 taxonomy (nine) — so it is deliberately NOT flagged here.
//
// CERTIFICATE-RETENTION GUARD. Program Manual Part 2.4 defines the Confidential
// Remediation Track as a PRE-certification entry pathway and states in terms that it is
// "not a post-certification mechanism"; the Mark may not be used until a SKU reaches
// Status A or B (§A golden value above; §B forbids "certificate held"/"certificate
// unaffected" in the manual). There is no ratified post-certification voluntary-
// disclosure protocol under which an already-certified brand self-reports and KEEPS its
// certificate. So the live /program + /portal pages must not promise certificate
// retention for a remediation item — the retired "certificate held / certificate
// unaffected / certificate intact" framing. A prior note here exempted remediation.md on
// the theory that a post-cert "certificate held" track was "a distinct, real feature"; it
// was not, and that exemption is what let the promise ship untraceable. If HMTc later
// ratifies such a protocol, cite its section on the page and relax this guard
// deliberately — do not delete it silently.
const PAGES_NO_RETAIN = [
  ["content/program/structure.md", path.join(PROG, "structure.md")],
  ["content/program/remediation.md", path.join(PROG, "remediation.md")],
  ["content/portal.md", path.join(REPO, "content/portal.md")],
]
for (const [rel, abs] of PAGES_NO_RETAIN) {
  const t = norm(read(abs))
  if (!t) { fail.push(`CROSS-SOURCE: ${rel} not found`); continue }
  const m = t.match(/certificate (is )?held|certificate unaffected|certificate intact/i)
  if (m) fail.push(`CROSS-SOURCE: ${rel} promises certificate retention for a remediation item ("${m[0]}") — Part 2.4 is pre-certification only; no ratified post-cert self-report protocol exists`)
}
const structure = read(path.join(PROG, "structure.md"))
const primer = read(path.join(REPO, "data/briefings/hmtc-primer.md"))
if (structure) {
  if (/reinstatement requires a fresh baseline/i.test(norm(structure))) fail.push(`CROSS-SOURCE: content/program/structure.md still asserts Status-D reinstatement "requires a fresh baseline" (contradicts Governance Policy §5.5 + the manual)`)
  if (/and governed under the Institute of Contaminant Standards,/i.test(norm(structure))) fail.push(`CROSS-SOURCE: content/program/structure.md still has the corrupted double-ICS governing sentence`)
} else fail.push("CROSS-SOURCE: content/program/structure.md not found")
if (primer && /ten-analyte panel is the eight total-metal measurements plus three speciated/i.test(norm(primer)))
  fail.push(`CROSS-SOURCE: data/briefings/hmtc-primer.md still carries the "eight + three speciated = ten" miscount`)
ok(`E. cross-source: /program + briefing pages checked against the manual (genuine defects only)`)

// ── verdict ──────────────────────────────────────────────────────────────────
if (fail.length) {
  console.error(`\naudit-cat1-manual-consistency: ${fail.length} INCONSISTENCY(IES):`)
  for (const f of fail) console.error(`  ✗ ${f}`)
  process.exit(1)
}
console.log(`\naudit-cat1-manual-consistency: OK — the manual is internally consistent, matches the reconciled governance/lot-testing source, is firewall-clean, and agrees with the live /program pages.`)
process.exit(0)
