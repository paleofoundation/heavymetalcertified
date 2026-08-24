#!/usr/bin/env node
// retired-methodology-lint.mjs — fail the build if the percentile-SELECTION method
// (P97/P45 and the clean/dirty two-pathways framing) appears on any public cert
// surface except the single dedicated retired-methodology page.
//
// WHY THIS EXISTS (2026-08-24): the government-limit default is the public method.
// The percentile arithmetic (a clean value near P97, a dirty value near P45) is an
// INTERNAL derivation step for the occurrence-set cells; it must not be presented as
// the public standard. Karen's rule: "no P97/P45 anywhere on the website except a
// page dedicated to retired methodology." This lint makes that rule self-enforcing
// so no future generator or hand edit can silently reintroduce the retired framing.
//
// It is deliberately narrow: it targets the selection LABELS and pathway-name
// phrases, never the bare word "percentile" (the 80th-percentile ratchet and
// literature percentiles like P97.5 or "95th percentile" are legitimate and stay),
// and never the hyphenated /program/two-pathways URL slug (links to the retired
// page are allowed). Build-blocking.

import fs from "node:fs"
import path from "node:path"

const repoRoot = process.cwd()
const SCAN_DIR = path.join(repoRoot, "content")
// The one page allowed to carry the retired framing.
const ALLOWED = new Set(["content/program/two-pathways.md"])

// Selection labels + pathway-name phrases. Each is a derivation disclosure when it
// sits on a public page. The negative lookahead on P97/P45 spares literature
// percentiles (P97.5) exactly as faq-firewall-guard does.
const PATTERNS = [
  { re: /\bp(?:97|45)(?![\d.])/gi, why: "bare P97/P45 selection label (case-insensitive: catches lowercase p97/p45 in rationale prose)" },
  { re: /\b(?:97th|45th)\s+percentile\b/gi, why: "97th/45th percentile (selection percentile)" },
  { re: /\b(?:clean|dirty)[-\s]subcategory\s+pathway\b/gi, why: "clean/dirty-subcategory pathway (retired framing)" },
  { re: /\b(?:clean|dirty)\s+pathway\b/gi, why: "clean/dirty pathway (retired framing)" },
  // "two limit pathways" is the methodology's own name (was the nav label). NOT bare
  // "two pathways", which legitimately means unrelated things elsewhere (e.g. the two
  // infant-EXPOSURE pathways, breastmilk vs formula) — the unambiguous method signals
  // above (P97/P45, clean/dirty pathway, 97th/45th percentile) carry the real load.
  { re: /\btwo\s+limit\s+pathways\b/gi, why: "two limit pathways as method name" },
]

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) walk(p, out)
    else if (e.isFile() && p.endsWith(".md")) out.push(p)
  }
  return out
}

function lineOf(text, idx) {
  let n = 1
  for (let i = 0; i < idx && i < text.length; i++) if (text[i] === "\n") n++
  return n
}

const files = walk(SCAN_DIR)
const violations = []

for (const file of files) {
  const rel = path.relative(repoRoot, file)
  if (ALLOWED.has(rel)) continue
  const text = fs.readFileSync(file, "utf8")
  for (const { re, why } of PATTERNS) {
    re.lastIndex = 0
    let m
    while ((m = re.exec(text)) !== null) {
      violations.push({ rel, line: lineOf(text, m.index), hit: m[0].trim(), why })
      if (m.index === re.lastIndex) re.lastIndex++
    }
  }
}

if (violations.length) {
  console.error(`retired-methodology-lint: FAIL — ${violations.length} retired-framing disclosure(s) across ${files.length} scanned page(s):\n`)
  for (const v of violations) {
    console.error(`  ${v.rel}:${v.line}  "${v.hit}"  → ${v.why}`)
  }
  console.error(`\nThe percentile-selection method (P97/P45, clean/dirty two-pathways) is INTERNAL. The only page allowed to describe it is content/program/two-pathways.md (the retired-methodology record).`)
  console.error(`If a generator emitted this, fix the generator (e.g. tools/lib/occurrence-section.mjs), then rebuild. Do not hand-edit generated pages.`)
  process.exit(1)
}

console.log(`retired-methodology-lint: OK (${files.length} content pages scanned, no P97/P45 or two-pathways framing outside the retired page).`)
