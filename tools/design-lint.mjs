#!/usr/bin/env node
// design-lint.mjs — the deterministic, no-browser design-canon gate.
//
// WHY THIS EXISTS. The canon (docs/design-canon/) keeps getting quietly ignored,
// and the cause is always the same: a session eyeballs one page, "matches" it, and
// never runs the rendered gate (check:v3) because it needs a browser and is not in
// the build chain. So canon lived as prose, and prose does not block a build.
//
// This lint is the ALWAYS-RUNS floor. It reads generated content — no browser, no
// dependencies — and fails the build on the mechanical, non-negotiable canon rules:
//
//   1. NO BOLD on the reading surface (docs/design-canon/CONTENT-RULES.md §"No bold").
//      Emphasis is the type system's job — Lora headings, IBM Plex Mono labels —
//      never font-weight. So: no inline `font-weight: 600|700|800|900|bold`, and no
//      raw <strong>/<b> in the content HTML. (font-weight:500 is the canon's label /
//      measured-value weight and is allowed; markdown **…** is neutralised to 400 by
//      the sitewide CSS rule in cert-chrome.scss, so it is not flagged here.)
//
//   2. CANONICAL TABLE (advisory). A generated <table> should inherit the one
//      canonical rule (.wiki-content table, cert-chrome.scss) rather than hand-roll
//      its <thead> background inline. Reported as a count, non-blocking, because the
//      existing inline-styled derivation/master tables are a known backlog that the
//      generator refactor / page redesigns will drain.
//
// The rendered-truth companion is `npm run check:v3` (Playwright), wired into the
// release path — it catches cascade wins this source scan cannot. Run both.
//
// Flags:
//   --warn-only   never exit 1 (staged rollout / backlog-drain window)
//   --all         make the ADVISORY scope blocking too (briefings/articles/program)
//
// Exit non-zero on any BLOCKING violation (build-blocking in the cert prebuild).

import fs from "node:fs"
import path from "node:path"

const repoRoot = process.cwd()
const CONTENT = path.join(repoRoot, "content")
const WARN_ONLY = process.argv.includes("--warn-only")
const ALL_BLOCKING = process.argv.includes("--all")

// The reading surface where "no bolded text anywhere" is enforced hard. These are
// the data pages a regulator / brand-legal reader audits.
const BLOCKING_DIRS = ["standards", "regulations"]
// Prose surfaces held to the same rule, advisory until their backlog is drained.
const ADVISORY_DIRS = ["briefings", "articles", "program", "brands"]

const INLINE_BOLD = /font-weight:\s*(?:bold|[6-9]00)\b/i
const STRONG_TAG = /<strong[\s>]/i
const B_TAG = /<b[\s>]/i // matches <b> / <b …>, not <br>, <blockquote>, <body>

const blocking = []
const advisory = []
let scanned = 0
let tableBacklog = 0

function scopeOf(file) {
  const rel = path.relative(CONTENT, file)
  const top = rel.split(path.sep)[0]
  if (BLOCKING_DIRS.includes(top)) return "blocking"
  if (ADVISORY_DIRS.includes(top)) return "advisory"
  return null // chrome/index/etc. — out of scope for the reading-surface rule
}

function lint(file) {
  const scope = scopeOf(file)
  if (!scope) return
  scanned++
  const rel = path.relative(repoRoot, file)
  // A finding is blocking when it is on the hard reading surface (standards /
  // regulations), or when --all promotes every scope to blocking.
  const sink = scope === "blocking" || ALL_BLOCKING ? blocking : advisory

  const lines = fs.readFileSync(file, "utf8").split("\n")
  lines.forEach((line, i) => {
    const n = i + 1
    if (INLINE_BOLD.test(line)) {
      const m = line.match(INLINE_BOLD)
      sink.push(`${rel}:${n}  inline bold — ${m[0]} (canon: no bold; use 400, or 500 for mono labels/values)`)
    }
    if (STRONG_TAG.test(line)) sink.push(`${rel}:${n}  <strong> tag (canon: no bold; render at normal weight)`)
    if (B_TAG.test(line)) sink.push(`${rel}:${n}  <b> tag (canon: no bold; render at normal weight)`)
  })

  // Canonical-table advisory: a hand-rolled table head instead of .wiki-content table.
  if (/<thead[\s>][\s\S]*?background:/i.test(lines.join("\n")) || /<tr[^>]*style="[^"]*background:#9f2727/i.test(lines.join("\n"))) {
    tableBacklog++
  }
}

function walk(dir, cb) {
  if (!fs.existsSync(dir)) return
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) walk(full, cb)
    else if (e.name.endsWith(".md")) cb(full)
  }
}

walk(CONTENT, lint)

// ---- Report -----------------------------------------------------------------
if (advisory.length) {
  console.warn(`design-lint: ${advisory.length} advisory no-bold finding(s) (non-blocking):`)
  for (const a of advisory) console.warn(`  · ${a}`)
}
if (tableBacklog) {
  console.warn(`design-lint: ${tableBacklog} generated table(s) hand-roll head styling instead of .wiki-content table (canonicalization backlog; advisory).`)
}

if (blocking.length) {
  console.error(`design-lint: ${blocking.length} BLOCKING no-bold violation(s):`)
  for (const b of blocking) console.error(`  ✗ ${b}`)
  console.error(`\ndesign-lint: the reading surface carries no bold. Fix the source, or set a value to\n  font-weight:400 (or 500 for a mono label/measured value). See docs/design-canon/CONTENT-RULES.md.`)
  if (!WARN_ONLY) process.exit(1)
  console.error("design-lint: (--warn-only) not failing the build.")
}

console.log(
  `design-lint: OK — ${scanned} reading-surface page(s) scanned, no bold in ${BLOCKING_DIRS.join("/")}` +
    (advisory.length ? ` (${advisory.length} advisory)` : "") +
    ".",
)
process.exit(0)
