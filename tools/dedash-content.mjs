#!/usr/bin/env node
// dedash-content.mjs — enforce the sitewide "avoid em dashes" language rule
// (docs/writing-style: "Avoid em dashes. Use commas, semicolons, periods, or
// parentheticals instead. Em dashes are fine inside direct quotes and citation
// text.") across the certification site's generated + authored content.
//
// WHY A SWEEP. The em dashes are ~72% in content/standards, emitted by a bounded
// set of repeated generator templates + compiled derivation data ("mandatory
// control — no government ML", "not material — controlled analyte", "Derivation —
// …", "Jurisdiction — product scope", …). Fixing them at the content layer, once,
// in one deterministic pass keeps the whole site clean and stays clean as the
// generators re-run. Runs LAST in prebuild (after every content generator) so it
// catches whatever they emit; idempotent.
//
// REPLACEMENT RULES (calibrated on the real corpus):
//   • A spaced em dash (— or &mdash;, any surrounding spaces/&nbsp;) is the target.
//     En dashes (–, ranges like 10–30) and hyphens are LEFT ALONE.
//   • Paired em dashes in one run (a parenthetical: "X — aside — Y") → commas.
//   • A single em dash → a colon by default (the dominant "term — expansion" use),
//     or a comma when what follows is a coordinating conjunction / continuation
//     (and, but, so, or, nor, yet, including, with, because, though, although).
//   • Citation text is EXEMPT (the rule permits em dashes there): reference-row
//     grids and code fences that carry bibliographic titles/details are masked out.
//
// USAGE: node tools/dedash-content.mjs            # rewrite content in place
//        node tools/dedash-content.mjs --check    # report only, exit 1 if any remain

import fs from "node:fs"
import path from "node:path"
import { dedashText, DASH } from "./lib/dedash.mjs"

const repoRoot = process.cwd()
const CONTENT = path.join(repoRoot, "content")
const CHECK = process.argv.includes("--check")

// The em-dash → colon/comma transform (dedashText) and the DASH matcher are shared
// with the JSON-LD sweep; see tools/lib/dedash.mjs. This file owns only the content
// -file masking of exempt spans (citation reference-rows and code) below.
// Private-use sentinels for masked (citation) spans — never occur in content, so
// unmasking cannot collide with ordinary numbers in prose ("20 ppb").
const M0 = ""
const M1 = ""
const REF_ROW = /<div style="display:grid;grid-template-columns:42px minmax\(0,1fr\) 128px[\s\S]*?<\/span><\/div>/g
const FENCE = /```[\s\S]*?```/g
const INLINE_CODE = /`[^`\n]*`/g

function dedashFile(raw) {
  const masks = []
  const stash = (m) => {
    masks.push(m)
    return M0 + (masks.length - 1) + M1
  }
  let s = raw.replace(REF_ROW, stash).replace(FENCE, stash).replace(INLINE_CODE, stash)
  s = dedashText(s)
  return s.replace(new RegExp(M0 + "(\\d+)" + M1, "g"), (_, i) => masks[+i])
}

// Count em dashes that are actual PROSE (the ones the sweep should have fixed):
// outside citation spans, and not standalone "no value" cell placeholders (>—<),
// which are legitimately preserved.
const PLACEHOLDER = /(?:<[^>]*>|>)(?:\s|&nbsp;)*(?:—|&mdash;)(?:\s|&nbsp;)*(?=<)/g
function remainingCount(raw) {
  const s = raw
    .replace(REF_ROW, " ")
    .replace(FENCE, " ")
    .replace(INLINE_CODE, " ")
    .replace(PLACEHOLDER, " ")
  return (s.match(/—|&mdash;/g) || []).length
}

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) walk(full, out)
    else if (e.name.endsWith(".md")) out.push(full)
  }
  return out
}

let changed = 0
let remaining = 0
const remainingFiles = []
for (const f of walk(CONTENT)) {
  const raw = fs.readFileSync(f, "utf8")
  if (CHECK) {
    const n = remainingCount(raw)
    if (n) {
      remaining += n
      remainingFiles.push(`${path.relative(repoRoot, f)} (${n})`)
    }
  } else {
    const next = dedashFile(raw)
    if (next !== raw) {
      fs.writeFileSync(f, next, "utf8")
      changed++
    }
  }
}

if (CHECK) {
  if (remaining) {
    console.error(`dedash-content: ${remaining} em dash(es) remain in non-citation prose across ${remainingFiles.length} file(s):`)
    for (const r of remainingFiles.slice(0, 25)) console.error(`  - ${r}`)
    if (remainingFiles.length > 25) console.error(`  … and ${remainingFiles.length - 25} more`)
    process.exit(1)
  }
  console.log("dedash-content: OK — no em dashes in non-citation prose.")
} else {
  console.log(`dedash-content: rewrote ${changed} file(s) — em dashes → colons/commas per docs/writing-style (citation text exempt).`)
}
