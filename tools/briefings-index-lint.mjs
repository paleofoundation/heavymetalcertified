#!/usr/bin/env node
// briefings-index-lint.mjs — build-blocking guard against orphaned briefings.
//
// WHY: content/briefings/index.md is HAND-AUTHORED raw HTML — import-briefings.mjs
// deliberately does not emit it ("the data may change, but the design should
// not"). Nothing regenerates the series list from the briefing pages, so every
// new content/briefings/*.md must be linked into the index by hand. When that
// step is missed the page becomes a LIVE ORPHAN: it renders at its own URL and
// scores in the graph/folder listing, but is unreachable from the one directory
// a reader (or a crawler following the series) uses to find it. That is exactly
// how /briefings/the-big-8 shipped invisible — the argument existed but nothing
// on the index pointed to it.
//
// This is the same failure class the firewall/method-drift/claim-discipline
// lints already gate: a correct artifact silently dropped from the surface that
// makes it reachable. Wired into prebuild so it blocks the deploy, not just a
// report.
//
// Usage: node tools/briefings-index-lint.mjs

import fs from "node:fs"
import path from "node:path"

const ROOT = process.cwd()
const DIR = path.join(ROOT, "content/briefings")
const INDEX = path.join(DIR, "index.md")

function main() {
  if (!fs.existsSync(DIR)) {
    console.log("briefings-index-lint: no content/briefings/ dir — nothing to check.")
    return
  }
  if (!fs.existsSync(INDEX)) {
    console.error(`briefings-index-lint: missing ${path.relative(ROOT, INDEX)} — the series index must exist.`)
    process.exit(1)
  }

  const indexText = fs.readFileSync(INDEX, "utf8")

  // Every /briefings/<slug> the index links (the hand-authored series rows).
  // Matches absolute (/briefings/x) and relative (./x, ../briefings/x) forms so
  // the check does not depend on how the links happen to be written.
  const linked = new Set()
  for (const m of indexText.matchAll(/\/briefings\/([a-z0-9][a-z0-9-]*)/g)) linked.add(m[1])
  for (const m of indexText.matchAll(/href="\.\/([a-z0-9][a-z0-9-]*)"/g)) linked.add(m[1])

  const pages = fs
    .readdirSync(DIR)
    .filter((f) => f.endsWith(".md") && f !== "index.md")
    .map((f) => f.replace(/\.md$/, ""))
    .sort()

  const orphans = pages.filter((slug) => !linked.has(slug))

  if (orphans.length) {
    console.error(
      `briefings-index-lint: ${orphans.length} briefing page(s) not linked from content/briefings/index.md:`,
    )
    for (const slug of orphans) console.error(`  ✗ /briefings/${slug}   (content/briefings/${slug}.md)`)
    console.error(
      `\nThe index is hand-authored (not generated). Add a series row linking each page, or it ships as a live orphan — reachable by URL but absent from the directory that lists the series.`,
    )
    process.exit(1)
  }

  console.log(`briefings-index-lint: ${pages.length} briefing pages clean — every page is linked from the index.`)
}

main()
