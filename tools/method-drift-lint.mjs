#!/usr/bin/env node
// Build-blocking guard for the current HMTc limit-setting method.
//
// The August 2026 Program Manual retired percentile- and occurrence-selected
// certification values. Every public explanation and every generator that can
// publish one must now distinguish government-limit-only initial setting from
// the separate post-publication P80 Standards Ratchet.

import fs from "node:fs"
import path from "node:path"

const repoRoot = process.cwd()
const SPEC = path.join(repoRoot, "data/method/method-v2.json")
const SCAN_TARGETS = [
  "README.md",
  "content",
  "data/briefings",
  "data/manuals/cat1-manual",
  "data/articles/synthesis",
  "data/analytes/analytes.json",
  "data/for-brands-source.md",
  "data/standards/hmtc_standards_catalog.json",
  "data/standards/cat1-pages.json",
  "data/standards/grains-pages.json",
  "data/standards/seafood-pages.json",
  "quartz/components/Footer.tsx",
  "tools/build-cat1-manual.mjs",
  "tools/build-category-manual.mjs",
  "tools/build-cat1-standard-pages.mjs",
  "tools/build-category-standard-pages.mjs",
  "tools/build-standards-pages.mjs",
  "tools/lib/occurrence-section.mjs",
  "tools/postbuild-cert-llms.mjs",
  "tools/postbuild-cert-jsonld.mjs",
]
const TEXT_EXTENSIONS = new Set([".md", ".json", ".mjs", ".tsx"])

const spec = JSON.parse(fs.readFileSync(SPEC, "utf8"))
const { forbidden } = spec.lint

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

function collect(target, out = []) {
  if (!fs.existsSync(target)) return out
  const stat = fs.statSync(target)
  if (stat.isDirectory()) {
    for (const entry of fs.readdirSync(target, { withFileTypes: true })) {
      collect(path.join(target, entry.name), out)
    }
  } else if (stat.isFile() && TEXT_EXTENSIONS.has(path.extname(target))) {
    out.push(target)
  }
  return out
}

const files = [...new Set(SCAN_TARGETS.flatMap((target) => collect(path.join(repoRoot, target))))]
const violations = []

for (const file of files) {
  const rel = path.relative(repoRoot, file)
  const text = normalize(fs.readFileSync(file, "utf8"))

  for (const rule of forbidden) {
    const re = new RegExp(rule.re, "gi")
    let match
    while ((match = re.exec(text)) !== null) {
      violations.push({
        rel,
        line: lineOf(text, match.index),
        hit: match[0].replace(/\s+/g, " ").trim().slice(0, 100),
        why: rule.why,
      })
      if (match.index === re.lastIndex) re.lastIndex++
    }
  }
}

// Compiled records are a higher-risk surface than prose: one stale basis_kind
// can publish an occurrence-selected number while every paragraph states the
// current method correctly. Reject those records structurally.
for (const dir of ["cat1-compiled", "cat3-compiled", "seafood-compiled", "cat9-compiled"]) {
  const fullDir = path.join(repoRoot, "data/standards", dir)
  if (!fs.existsSync(fullDir)) continue
  for (const name of fs.readdirSync(fullDir).filter((entry) => entry.endsWith(".json"))) {
    const rel = path.join("data/standards", dir, name)
    const record = JSON.parse(fs.readFileSync(path.join(repoRoot, rel), "utf8"))
    for (const [variant, cells] of Object.entries(record.variants ?? {})) {
      for (const [analyte, cell] of Object.entries(cells ?? {})) {
        if (["occurrence", "precautionary"].includes(cell?.basis_kind)) {
          violations.push({
            rel,
            line: 1,
            hit: `${variant}.${analyte}.basis_kind=${cell.basis_kind}`,
            why: "Compiled numeric cells must cite government limits or sovereign read-across; occurrence/precautionary numeric bases are retired.",
          })
        }
      }
    }
  }
}

if (violations.length) {
  console.error(`method-drift-lint: FAIL — ${violations.length} retired-method reference(s) across ${files.length} scanned file(s):\n`)
  for (const violation of violations) {
    console.error(`  ${violation.rel}:${violation.line}  "${violation.hit}"`)
    console.error(`      → ${violation.why}\n`)
  }
  console.error(`Canonical method: data/method/method-v2.json (${spec.label}, ratified ${spec.ratified}).`)
  process.exit(1)
}

console.log(`method-drift-lint: OK (${files.length} public-source and generator files scanned).`)
