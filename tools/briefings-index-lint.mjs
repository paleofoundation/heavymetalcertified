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

  // ---- Reverse gate: no empty placeholder cards on a public index ----------
  // The orphan check above guards page→index (no unlinked page). This block
  // guards index→page: a public series card must never advertise content that
  // does not exist. Two failure modes shipped before and both are gated here:
  //
  //   A. PLACEHOLDER CARD. A series row hand-authored as a bare <div> (no href)
  //      instead of an <a> — an "In preparation" / "Deposited" card with no page
  //      behind it. That is thin/empty content on the surface a crawler and a
  //      regulator read as the series manifest, and a "Deposited" placeholder is
  //      a dangling-DOI landmine. Every series row MUST be a link to a real page.
  //   B. BROKEN / UNPOPULATED DATE. The "Date unread" token is the design's
  //      unfilled date variable; it renders as a broken field on a citable index.
  //      A card either carries a real date or it is not ready to ship.
  //
  // The series row is identified by its canonical grid signature so the check
  // does not depend on card wording.
  const rowSigRe = /grid-template-columns:52px minmax\(0,1fr\) 190px/g
  const errors = []

  // A. A series-row grid that opens on a <div> (or any non-<a>) is a placeholder.
  for (const m of indexText.matchAll(/<(\w+)\b[^>]*grid-template-columns:52px minmax\(0,1fr\) 190px/g)) {
    if (m[1].toLowerCase() !== "a") {
      errors.push(
        `placeholder card: a series row is a <${m[1]}> with no page link. Every card must be an <a href="/briefings/<slug>"> to a real page — a public index must not advertise content that does not exist.`,
      )
    }
  }

  // A′. Every series-card link must resolve to an existing briefing page (a card
  //     linking a non-existent slug is a 404 waiting to be crawled).
  for (const m of indexText.matchAll(/<a\b[^>]*href="\/briefings\/([a-z0-9][a-z0-9-]*)"[^>]*grid-template-columns:52px minmax\(0,1fr\) 190px/g)) {
    const slug = m[1]
    if (!pages.includes(slug)) {
      errors.push(`dangling card: series card links /briefings/${slug} but content/briefings/${slug}.md does not exist.`)
    }
  }

  // B. The unpopulated-date token must not survive onto the public index.
  const unread = (indexText.match(/Date unread/g) || []).length
  if (unread) {
    errors.push(
      `broken date: "${unread}" card(s) still show the unfilled "Date unread" token. Populate each card's real publication date (from the briefing's briefing_date) or the field renders broken.`,
    )
  }

  if (errors.length) {
    console.error(`briefings-index-lint: ${errors.length} index-card violation(s) in content/briefings/index.md:`)
    for (const e of errors) console.error(`  ✗ ${e}`)
    console.error(
      `\nEach series card either points to a WRITTEN page with a real date, or it is REMOVED — nothing thin ships between those two states.`,
    )
    process.exit(1)
  }

  const cardCount = (indexText.match(rowSigRe) || []).length
  console.log(
    `briefings-index-lint: ${pages.length} briefing pages clean — every page is linked, every one of ${cardCount} series cards points to a real page with a populated date.`,
  )
}

main()
