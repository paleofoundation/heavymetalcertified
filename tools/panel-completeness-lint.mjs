#!/usr/bin/env node
// Panel-completeness lint — a rendered standard page must not silently drop a compiled analyte.
//
// The defect this exists to prevent: build-cat1-standard-pages.mjs defined its analyte panel as a
// hardcoded array that omitted tAs while every compiled Cat-1 record carried a tAs cell. The
// limit was compiled, frozen, and published in standards.csv, but nine standard pages never
// rendered the row — a silent drop that no existing lint could see, because every lint compared
// the pages against each other rather than against the compiled source.
//
// That is a governance violation, not a display bug. The canonical analyte contract
// (heavy-metal-index docs/governance/hmtc-governing-principles.md; CLAUDE.md Part 19) requires the
// eight-total laboratory panel on every certification row and states that species cells are
// additional to, never substituted for, their parent total: "A category compiler that substitutes
// iAs for tAs, MeHg for tHg, or Cr-VI for total Cr is incomplete."
//
// The check is deliberately made against RENDERED OUTPUT rather than against a renderer's panel
// constant. It therefore holds regardless of whether a category drives its panel from
// _meta.panel (build-category-standard-pages.mjs) or from a hardcoded array
// (build-cat1-standard-pages.mjs), and it keeps holding for any renderer added later.
//
// Scope note: this asserts that a compiled cell REACHES THE PAGE. It does not assert that the
// compiled panel is itself complete against data/standards/required-analytes.json — Cat 1 carries
// no Cr-VI cell at all, which is an upstream compiler gap and cannot be fixed by a renderer.

import fs from "node:fs"
import path from "node:path"

const REPO = process.cwd()
const DATA = path.join(REPO, "data/standards")
const CONTENT = path.join(REPO, "content/standards")

const fail = []
let pagesChecked = 0
let cellsChecked = 0

// Rendered analyte rows end in the analyte key in parentheses — "Total arsenic (tAs)",
// "Hexavalent chromium (Cr-VI)". Parsing the key out of the Master Limit Table's first column
// yields the panel the reader actually sees. "(Cr)" cannot match "(Cr-VI)": the closing paren
// is part of the literal, so the two keys stay distinct.
function renderedKeys(slug) {
  const file = path.join(CONTENT, `${slug}.md`)
  if (!fs.existsSync(file)) return null
  const s = fs.readFileSync(file, "utf8")
  const start = s.indexOf('<section id="limits"')
  if (start < 0) return null
  const end = s.indexOf('<section id="derivation"', start)
  const sec = s.slice(start, end > 0 ? end : undefined)
  return new Set([...sec.matchAll(/<td[^>]*>[^<]*\(([A-Za-z][A-Za-z-]*)\)<\/td>/g)].map((m) => m[1]))
}

for (const f of fs.readdirSync(DATA).filter((x) => x.endsWith("-pages.json")).sort()) {
  const spec = JSON.parse(fs.readFileSync(path.join(DATA, f), "utf8"))
  const meta = spec._meta || {}
  // cat1-pages.json predates _meta; its records live in the dir named for the file prefix.
  const dir = path.join(DATA, meta.compiled_dir || `${f.replace("-pages.json", "")}-compiled`)
  if (!fs.existsSync(dir)) continue
  const label = meta.category_name || f.replace("-pages.json", "")

  for (const page of spec.pages || []) {
    const compiled = new Set()
    for (const v of page.variants || []) {
      const rec = path.join(dir, `${v.record}.json`)
      if (!fs.existsSync(rec)) continue
      const j = JSON.parse(fs.readFileSync(rec, "utf8"))
      const cells = j.variants ? j.variants[v.variant] || j.variants[Object.keys(j.variants)[0]] : j.cells
      if (cells) Object.keys(cells).forEach((k) => compiled.add(k))
    }
    if (!compiled.size) continue

    const shown = renderedKeys(page.slug)
    if (!shown) { fail.push(`${label} / ${page.slug}: no Master Limit Table found in content/standards/${page.slug}.md`); continue }

    pagesChecked++
    cellsChecked += compiled.size
    const dropped = [...compiled].filter((k) => !shown.has(k))
    if (dropped.length) {
      fail.push(`${label} / ${page.slug}: compiled cell(s) ${dropped.join(", ")} never render — the limit is published in the compiled record but absent from the page`)
    }
  }
}

if (fail.length) {
  console.error(`\npanel-completeness-lint: ${fail.length} DROPPED ANALYTE(S):`)
  for (const x of fail) console.error(`  ✗ ${x}`)
  console.error(`\nA compiled cell that does not reach the page is a silently dropped published limit.`)
  console.error(`Fix the renderer's panel — never delete the compiled cell to satisfy this lint.`)
  process.exit(1)
}
console.log(`panel-completeness-lint: OK — ${pagesChecked} standard page(s) render all ${cellsChecked} of their compiled analyte cells.`)
