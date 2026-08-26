#!/usr/bin/env node
// terminology-lint.mjs — enforces the baseline-vs-reflex terminology rule
// (heavy-metal-index docs/governance/hmtc-governing-principles.md v2.6 §"Species, screens:
// display + terminology", ratified 2026-08-25).
//
// "Baseline" is MEASUREMENT; "reflex" is the ONGOING-lot regime. A published standard or
// manual must never frame baseline establishment as a reflex, and must never describe a
// species control as "controlled by reflex speciation" (the total is measured every lot; the
// species is speciated only on an ongoing total exceedance). These exact phrasings are the
// baseline-mis-framing error and are forbidden on rendered surfaces.
//
// Precise, low-false-positive: it flags only the specific bad phrasings, not every use of the
// word "reflex" (reflex speciation is a legitimate ongoing-lot concept described elsewhere).
//
// Rollout: WARN-ONLY by default while the backlog of pre-fix rendered pages drains (they clear
// as the standard-page renderer + manual generators re-render on each build). Pass --strict to
// FAIL the build; prebuild flips to --strict once the count reaches zero.
//
// Usage: node tools/terminology-lint.mjs [--strict] [--quiet]

import fs from "node:fs"
import path from "node:path"

const REPO = process.cwd()
const args = new Set(process.argv.slice(2))
const STRICT = args.has("--strict")
const QUIET = args.has("--quiet")

// Only the UNAMBIGUOUS baseline-mis-framings. "Reflex speciation" is legitimate for the
// ongoing-lot / confirmatory regime — e.g. "Cr-VI is controlled by reflex speciation on total
// chromium" is correct (Cr(VI) is confirmatory, per the governance policy), so it is NOT flagged.
// The error is framing a BASELINE-established/measured species (iAs, MeHg bounded by its total)
// as reflex-enforced-on-elevation, or calling a total-metal screen a "reflex screen".
const BAD = [
  /enforced by reflex speciation whenever/i, // the old subsumed-species label ("...whenever total elevated")
  /reflex[- ]speciation screening/i, // framing the total-metal screen as a reflex
]

const DIRS = ["content/standards", "content/manuals", "content/briefings"]
const hits = []
for (const d of DIRS) {
  const dir = path.join(REPO, d)
  if (!fs.existsSync(dir)) continue
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".md"))) {
    const p = path.join(dir, f)
    const s = fs.readFileSync(p, "utf8")
    const matched = BAD.filter((rx) => rx.test(s)).map((rx) => rx.source)
    if (matched.length) hits.push({ file: path.join(d, f), phrases: matched })
  }
}

if (!QUIET) {
  if (hits.length) {
    console.log(`terminology-lint: ${hits.length} surface(s) frame baseline as "reflex" (forbidden — baseline is measured, reflex is the ongoing regime):`)
    for (const h of hits.slice(0, 40)) console.log(`    ${h.file}`)
    if (hits.length > 40) console.log(`    … and ${hits.length - 40} more`)
  } else {
    console.log("terminology-lint: clean — no baseline-mis-framing phrases in any rendered surface.")
  }
}

if (STRICT && hits.length) {
  console.error(`\n!! FAIL (--strict): ${hits.length} surface(s) carry a baseline-mis-framing phrase. Re-render from the corrected generators (standard-page renderer, manual generators, occurrence-section) and recompile any category whose compiled label still carries it.`)
  process.exit(1)
}
if (hits.length && !QUIET) {
  console.log(`\n  (warn-only: ${hits.length} surface(s) remain; they clear as standards + manuals re-render. Lint flips to --strict at zero.)`)
}
process.exit(0)
