#!/usr/bin/env node
// lint-method-prose-length — enforce the reading-surface paragraph cap.
//
// CONTENT-RULES.md §8: one idea per paragraph; a reading-surface paragraph
// targets 40–100 words and never exceeds ~120. Each element of a
// `_meta.method_prose` (or `meta.` / `pages[].`) array in data/standards/*.json
// renders as ONE <p> on a live certification page, so an over-long element is a
// wall of text. This lint reports every element over the cap with its file,
// location, and word count. The fix is always to SPLIT the source prose (regroup
// its sentences); never reword — the numbers and citations are load-bearing.
//
// Usage:
//   node tools/lint-method-prose-length.mjs [--warn-only] [--limit=120]
//
// Exit 1 if any element exceeds the limit (unless --warn-only). This is the
// authored-source floor in the §7/§8 two-tier enforcement pattern.
import fs from "node:fs"
import path from "node:path"

const args = process.argv.slice(2)
const warnOnly = args.includes("--warn-only")
const limitArg = args.find((a) => a.startsWith("--limit="))
const LIMIT = limitArg ? Number(limitArg.split("=")[1]) : 120

const DIR = "data/standards"
const wordCount = (s) =>
  s.replace(/<[^>]+>/g, " ").replace(/&[a-z]+;|&#\d+;/gi, "x").split(/\s+/).filter(Boolean).length

const collect = (obj, loc, out) => {
  if (obj && Array.isArray(obj.method_prose)) out.push([loc, obj.method_prose])
}

const violations = []
let scanned = 0
for (const f of fs.readdirSync(DIR).filter((f) => f.endsWith(".json"))) {
  let j
  try {
    j = JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8"))
  } catch {
    continue
  }
  const buckets = []
  collect(j._meta, "_meta", buckets)
  collect(j.meta, "meta", buckets)
  if (Array.isArray(j.pages)) j.pages.forEach((p, i) => collect(p, `pages[${i}]`, buckets))
  for (const [loc, arr] of buckets) {
    arr.forEach((p, i) => {
      scanned++
      const w = wordCount(p)
      if (w > LIMIT) violations.push({ f, loc, i, w })
    })
  }
}

const label = "lint-method-prose-length"
if (violations.length === 0) {
  console.log(`${label}: OK — ${scanned} method_prose paragraph(s) scanned, none over ${LIMIT} words.`)
  process.exit(0)
}

violations.sort((a, b) => b.w - a.w)
console.error(
  `${label}: ${violations.length} paragraph(s) exceed the ${LIMIT}-word reading-surface cap (CONTENT-RULES.md §8). Split at idea boundaries — regroup sentences, do not reword:`
)
for (const v of violations) console.error(`  ${v.f}  ${v.loc}.method_prose[${v.i}]  ${v.w} words`)
if (warnOnly) {
  console.error(`${label}: --warn-only, not failing the build.`)
  process.exit(0)
}
process.exit(1)
