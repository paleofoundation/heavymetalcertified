#!/usr/bin/env node
// import-briefings.mjs — import the 10 already-written Standards Briefings from the
// workbench snapshot (data/briefings/*.md) into the cert site (content/briefings/).
//
// The briefings were authored for the Program-Manual / typst pipeline; here they
// become web pages, slug-preserved (plan 6.F), self-canonical, and Scholar-eligible
// as article-length technical analyses (type: public-briefing → Head.tsx emits
// technical-report citation_* metadata, never citation_journal_title).
//
// Frontmatter is normalized for the web; the body is passed through unchanged.

import fs from "node:fs"
import path from "node:path"

const repoRoot = process.cwd()
const SRC = path.join(repoRoot, "data/briefings")
const OUT = path.join(repoRoot, "content/briefings")
fs.mkdirSync(OUT, { recursive: true })

// 6.F mapping: file slug → { page title override, section }
const MAP = {
  "brief-4-cost-of-being-uncertified": { title: "The Cost of Being Uncertified", section: "Business case" },
  "hmtc-primer": { title: "What HMTc Is", section: "Program" },
  "defense-counsel-briefing": { title: "The Evidence a Jury Will See", section: "Litigation" },
  "after-palmquist": { title: "After Palmquist", section: "Litigation" },
  "brief-7-four-vs-eight": { title: "Four Metals Is No Longer Enough", section: "Scope & standards" },
  "brief-8-surveillance-protocol": { title: "The Surveillance Protocol", section: "Program" },
  "brief-2-open-category": { title: "The Open Category", section: "Positioning" },
  "brief-3-what-organic-doesnt-say": { title: "What Organic Doesn't Say", section: "Positioning" },
  "brief-5-retailer-as-anchor": { title: "The Retailer as Anchor", section: "Retailer" },
  "brief-6-premium-promise": { title: "The Premium Promise", section: "Positioning" },
}

function parse(text) {
  if (!text.startsWith("---")) return { fm: {}, body: text }
  const end = text.indexOf("\n---", 3)
  if (end < 0) return { fm: {}, body: text }
  const fmText = text.slice(3, end)
  const body = text.slice(end + 4).replace(/^\n+/, "")
  const fm = {}
  for (const line of fmText.split("\n")) {
    const m = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/)
    if (m) fm[m[1]] = m[2].trim().replace(/^["']|["']$/g, "")
  }
  return { fm, body }
}

const imported = []
for (const file of fs.readdirSync(SRC).filter((f) => f.endsWith(".md"))) {
  const slug = file.replace(/\.md$/, "")
  const map = MAP[slug]
  if (!map) {
    console.warn(`  skip ${file} — not in the 10-briefing map`)
    continue
  }
  const { fm, body } = parse(fs.readFileSync(path.join(SRC, file), "utf8"))
  const title = map.title || fm.title || slug
  const subtitle = (fm.subtitle || "").replace(/\\/g, "").trim()

  const out = [
    "---",
    `title: "${title.replace(/"/g, '\\"')}"`,
    subtitle ? `description: "${subtitle.replace(/"/g, '\\"').slice(0, 200)}"` : null,
    "type: public-briefing",
    `section: "${map.section}"`,
    `briefing_slug: ${slug}`,
    fm.author ? `author: "${fm.author.replace(/"/g, '\\"')}"` : `author: "Karen Pendergrass"`,
    fm.date ? `briefing_date: "${fm.date}"` : null,
    "scholar_eligible: true",
    "audience: [regulator, brand-legal, brand-finance, retailer-compliance]",
    "---",
    "",
    // a visible subtitle line (frontmatter description is for meta, not body)
    subtitle ? `*${subtitle}*\n` : "",
    body.trimEnd(),
    "",
  ]
    .filter((l) => l !== null)
    .join("\n")

  fs.writeFileSync(path.join(OUT, `${slug}.md`), out, "utf8")
  imported.push({ slug, title, section: map.section })
}

// content/briefings/index.md is hand-authored (the ported v3 design directory:
// the series list, peer-track preprints, and indexing policy). The generator no
// longer emits it — it would clobber the ported layout on every run. The
// per-briefing page loop above still runs.

console.log(`import-briefings: imported ${imported.length} briefings into content/briefings/ (index.md hand-authored, not emitted)`)
if (imported.length !== Object.keys(MAP).length) {
  console.warn(`  WARNING: expected ${Object.keys(MAP).length}, imported ${imported.length}`)
}
