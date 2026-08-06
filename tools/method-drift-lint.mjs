#!/usr/bin/env node
// method-drift-lint.mjs — fail the build if any page's prose regresses to a
// retired (pre-v2.0) description of the HMTc method.
//
// WHY THIS EXISTS: the method is narrated in prose across ~10 pages, briefings, and
// generator strings. When Method v2.0 landed (government-limit default, ratified
// 2026-08-03) the site kept describing the old v1.0 universal-pooling method — most
// dangerously on the homepage, which stated a false method in production until a human
// happened to notice. A keyword grep cannot catch "the method is described wrongly."
// This lint can: it reads the canonical method statement (data/method/method-v2.json)
// and enforces two rules against every content page and briefing source —
//   1. FORBIDDEN: signatures that are never correct under v2.0 (the P97-clean/P45-dirty
//      label, "Clean · P97" row labels, "monitored not limited", a 30% dirty pass rate).
//   2. REQUIRES-ANCHOR: a pooling/percentile phrase that asserts pooling as the source
//      of limits must carry the government-limit-default anchor within a short window,
//      or it reads as the retired universal method (this is exactly how the homepage
//      drifted). Prose that needs far-away context to be correct is prose a hostile
//      reader can quote out of context — so the fix is to state the scoping close by.
//
// It is the prose sibling of the Part-2 silent-threshold-deviation guard. Build-blocking.

import fs from "node:fs"
import path from "node:path"

const repoRoot = process.cwd()
const SPEC = path.join(repoRoot, "data/method/method-v2.json")
const SCAN_DIRS = ["content", "data/briefings"]

const spec = JSON.parse(fs.readFileSync(SPEC, "utf8"))
const { forbidden, requires_anchor: req } = spec.lint

// Length-preserving-enough entity normalization: entity replacements never add or remove
// newlines, so line numbers computed on the normalized text stay accurate.
function normalize(s) {
  return s
    .replace(/&middot;|&#183;/g, "·")
    .replace(/&mdash;|&#8212;/g, "—")
    .replace(/&ndash;|&#8211;/g, "–")
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/&rsquo;|&#8217;/g, "'")
    .replace(/&ldquo;|&rdquo;|&#8220;|&#8221;/g, '"')
    .replace(/&amp;/g, "&")
}

function lineOf(text, idx) {
  let n = 1
  for (let i = 0; i < idx && i < text.length; i++) if (text[i] === "\n") n++
  return n
}

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) walk(p, out)
    else if (e.isFile() && p.endsWith(".md")) out.push(p)
  }
  return out
}

const files = SCAN_DIRS.flatMap((d) => walk(path.join(repoRoot, d)))
const anchorsLc = req.anchors.map((a) => a.toLowerCase())
const violations = []

for (const file of files) {
  const rel = path.relative(repoRoot, file)
  const text = normalize(fs.readFileSync(file, "utf8"))
  const lc = text.toLowerCase()

  // Rule 1 — forbidden signatures.
  for (const f of forbidden) {
    const re = new RegExp(f.re, "gi")
    let m
    while ((m = re.exec(text)) !== null) {
      violations.push({ rel, line: lineOf(text, m.index), rule: "forbidden", hit: m[0].replace(/\s+/g, " ").trim().slice(0, 80), why: f.why })
      if (m.index === re.lastIndex) re.lastIndex++
    }
  }

  // Rule 2 — pooling/percentile phrase without a v2.0 anchor nearby.
  for (const phrase of req.phrases) {
    const pl = phrase.toLowerCase()
    let from = 0
    for (;;) {
      const idx = lc.indexOf(pl, from)
      if (idx === -1) break
      from = idx + pl.length
      const start = Math.max(0, idx - req.window)
      const end = Math.min(lc.length, idx + pl.length + req.window)
      const window = lc.slice(start, end)
      if (!anchorsLc.some((a) => window.includes(a))) {
        violations.push({ rel, line: lineOf(text, idx), rule: "needs-anchor", hit: phrase, why: req.why })
      }
    }
  }
}

if (violations.length) {
  console.error(`method-drift-lint: FAIL — ${violations.length} v1.0-method regression(s) across ${files.length} scanned file(s):\n`)
  for (const v of violations) {
    console.error(`  ${v.rel}:${v.line}  [${v.rule}]  "${v.hit}"`)
    console.error(`      → ${v.why}\n`)
  }
  console.error(`Canonical method: data/method/method-v2.json (Method ${spec.version}, ratified ${spec.ratified}).`)
  console.error(`Fix the prose to match it, or — if the method itself changed — update the spec first.`)
  process.exit(1)
}

console.log(`method-drift-lint: OK (${files.length} content/briefing files scanned, no pre-v2.0 method regression).`)
