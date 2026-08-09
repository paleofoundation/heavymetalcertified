#!/usr/bin/env node
// claim-discipline-lint.mjs — build-blocking guard on superiority claims.
//
// WHY: HMTc adopts the strictest EXISTING government limit cell-by-cell and only
// goes below a government floor on the four Tier-1 toxics. So an UNQUALIFIED
// "strictest limits in the world" / "stricter than any government" claim is
// provably false on the large majority of cells (0 of 112 Cat-1 cells sit below
// the applicable law) and becomes the plaintiff's-expert exhibit that a certified
// product was passed above a limit some government beats — collapsing the
// litigation-insurance (Daubert) thesis the program is sold on. Lanham Act
// §43(a) + FTC §5 substantiation both attach to a falsifiable superiority claim.
//
// This lint permits the true COMPOSITE claim ("the strictest EXISTING limit any
// credible government sets, applied cell-by-cell"; "at least as strict as the
// strictest limit any credible government has set") and fails the build on the
// unqualified superlative, in any channel page. Wired into prebuild so it gates
// the deploy, not just a report.
//
// Usage: node tools/claim-discipline-lint.mjs

import fs from "node:fs"
import path from "node:path"

const ROOT = path.join(process.cwd(), "content")

// Unqualified superiority claims that are provably false / unsubstantiable.
// Each is dangerous regardless of nearby qualifiers.
const BANNED = [
  { rx: /world'?s\s+(strictest|toughest|most\s+stringent|lowest)\b/i, why: "\"world's strictest/toughest\" — unqualified world-superiority superlative" },
  { rx: /\b(strictest|toughest|lowest|most\s+stringent)\s+(heavy[- ]metal\s+)?(limits?|standards?|thresholds?)\s+(in\s+the\s+world|worldwide|on\s+earth|on\s+the\s+planet|anywhere)\b/i, why: "\"strictest limits in the world/worldwide\" — unqualified superiority claim" },
  { rx: /\bstricter\s+than\s+(any|every|all)\s+(government|governments|regulator|regulators|country|countries|agency|agencies)\b/i, why: "\"stricter than any/every government\" — false on all non-Tier-1 cells" },
  { rx: /\blower\s+than\s+every\s+(government|regulator|country|agency)\b/i, why: "\"lower than every government\" — false; HMTc matches the strictest existing floor" },
  { rx: /\bthe\s+strictest\s+(heavy[- ]metal\s+)?(certification|standard|program|limits?)\s+(in\s+existence|ever\s+created|that\s+exists)\b/i, why: "absolute-existence superiority claim" },
]

// If a line matches BANNED but ALSO carries an explicit scope qualifier that makes
// the composite claim, we still fail — the banned phrasings above are unsafe even
// qualified. (The SAFE forms never use "in the world / stricter than any government"
// as the predicate; they say "strictest existing … any credible government,
// cell-by-cell". Those do not match any BANNED pattern, so no allowlist is needed.)

function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) walk(p, acc)
    else if (e.isFile() && p.endsWith(".md")) acc.push(p)
  }
  return acc
}

function main() {
  if (!fs.existsSync(ROOT)) { console.log("claim-discipline-lint: no content/ dir"); return }
  const files = walk(ROOT)
  const violations = []
  for (const f of files) {
    const lines = fs.readFileSync(f, "utf8").split("\n")
    lines.forEach((line, i) => {
      for (const b of BANNED) {
        const m = line.match(b.rx)
        if (m) violations.push({ file: path.relative(process.cwd(), f), line: i + 1, hit: m[0].trim(), why: b.why })
      }
    })
  }
  if (violations.length) {
    console.error(`claim-discipline-lint: ${violations.length} unqualified superiority claim(s) — these are false on most cells and are a Lanham/FTC/Daubert liability:`)
    for (const v of violations) console.error(`  ✗ ${v.file}:${v.line}  "${v.hit}"  — ${v.why}`)
    console.error(`\nUse the composite claim instead: "the strictest EXISTING limit any credible government sets, applied cell-by-cell across every metal and category — no single government is this strict across the whole matrix." See docs (project_hmtc_marketing_repositioning).`)
    process.exit(1)
  }
  console.log(`claim-discipline-lint: ${files.length} pages clean — no unqualified superiority claims.`)
}

main()
