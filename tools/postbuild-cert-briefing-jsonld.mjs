#!/usr/bin/env node
// postbuild-cert-briefing-jsonld.mjs — inject Article JSON-LD into every built
// Standards Briefing page (content/briefings/*.md with `type: public-briefing`).
//
// The briefings already receive a FAQPage node from postbuild-cert-faq-jsonld.mjs
// (derived from their visible `## Frequently asked questions` accordion), but they
// carry no Article node of their own — unlike the research syntheses under
// /articles (postbuild-article-jsonld.mjs) and the top-level SEO pages
// (postbuild-cert-page-jsonld.mjs). This injector closes that gap so a scholar_eligible
// briefing exposes the same Article structured data those page-classes do.
//
// The Article author is the briefing's OWN named author with their ORCID (a Person
// node), not the site Organization, because a briefing carries a personal byline.
// Publisher is the Institute of Contaminant Standards (the editorial/operator entity;
// see CLAUDE.md Part 14 entity naming). datePublished is parsed from the briefing's
// own `briefing_date`/`updated` frontmatter, with a robust fallback that simply omits
// the field rather than guessing when the date is unparseable.
//
// Marker-bounded (CERT-BRIEFING-JSONLD-START/END) and idempotent: a page that already
// carries an Article node (e.g. a future spec-driven one) is left untouched, and a
// re-run replaces only its own block.

import fs from "node:fs"
import path from "node:path"

const REPO = process.cwd()
const CONTENT = path.join(REPO, "content/briefings")
const PUBLIC = path.join(REPO, "public/briefings")
const CERT_BASE = "https://heavymetalcertified.com"
const START = "<!-- CERT-BRIEFING-JSONLD-START -->"
const END = "<!-- CERT-BRIEFING-JSONLD-END -->"
const PUBLISHER = { "@type": "Organization", name: "Institute of Contaminant Standards" }

if (!fs.existsSync(PUBLIC)) {
  console.log("postbuild-cert-briefing-jsonld: public/briefings not present yet (skipping; ran before quartz build)")
  process.exit(0)
}

const MONTHS = { january: "01", february: "02", march: "03", april: "04", may: "05", june: "06", july: "07", august: "08", september: "09", october: "10", november: "11", december: "12" }

// Parse "August 2026" -> "2026-08", "2026-06-18" -> "2026-06-18". Returns null if unparseable.
function isoDate(s) {
  const v = (s || "").trim().replace(/^["']|["']$/g, "")
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v
  if (/^\d{4}-\d{2}$/.test(v)) return v
  const m = v.match(/^([A-Za-z]+)\s+(\d{4})$/)
  if (m && MONTHS[m[1].toLowerCase()]) return `${m[2]}-${MONTHS[m[1].toLowerCase()]}`
  if (/^\d{4}$/.test(v)) return v
  return null
}

function fmValue(fm, key) {
  const m = fm.match(new RegExp(`^${key}:\\s*(.+)$`, "m"))
  if (!m) return null
  return m[1].trim().replace(/^["']|["']$/g, "")
}

function articleGraph({ url, title, description, author, orcid, datePublished }) {
  const person = orcid
    ? { "@type": "Person", name: author, url: `https://orcid.org/${orcid}`, identifier: `https://orcid.org/${orcid}` }
    : { "@type": "Person", name: author }
  const g = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${url}#article`,
    headline: title.slice(0, 110),
    name: title,
    description,
    inLanguage: "en",
    url,
    mainEntityOfPage: url,
    isAccessibleForFree: true,
    author: person,
    publisher: PUBLISHER,
  }
  if (datePublished) { g.datePublished = datePublished; g.dateModified = datePublished }
  return g
}

let injected = 0, skipped = 0
for (const file of fs.readdirSync(CONTENT)) {
  if (!file.endsWith(".md") || file === "index.md") continue
  const src = fs.readFileSync(path.join(CONTENT, file), "utf8")
  const fmMatch = src.match(/^---\n([\s\S]*?)\n---/)
  if (!fmMatch) continue
  const fm = fmMatch[1]
  if (fmValue(fm, "type") !== "public-briefing") continue

  const slug = fmValue(fm, "briefing_slug") || file.replace(/\.md$/, "")
  const htmlPath = path.join(PUBLIC, `${slug}.html`)
  if (!fs.existsSync(htmlPath)) { console.error(`postbuild-cert-briefing-jsonld: ${slug}.html not found; skipping.`); continue }

  let html = fs.readFileSync(htmlPath, "utf8")
  const url = `${CERT_BASE}/briefings/${slug}`
  // Idempotent + non-colliding: skip if an Article node is already present from any source.
  if (html.includes(START)) {
    html = html.replace(new RegExp(`${START}[\\s\\S]*?${END}\\n?`), "")
  } else if (/"@type"\s*:\s*"Article"/.test(html)) { skipped++; continue }

  const title = fmValue(fm, "title") || slug
  const description = fmValue(fm, "description") || ""
  const author = fmValue(fm, "author") || "Karen Pendergrass"
  const orcid = fmValue(fm, "orcid")
  const datePublished = isoDate(fmValue(fm, "briefing_date")) || isoDate(fmValue(fm, "updated"))

  const graph = articleGraph({ url, title, description, author, orcid, datePublished })
  const block = `${START}\n<script type="application/ld+json">${JSON.stringify(graph)}</script>\n${END}`
  html = html.includes("</head>") ? html.replace("</head>", `${block}\n</head>`) : `${html}\n${block}\n`
  fs.writeFileSync(htmlPath, html, "utf8")
  injected++
}

console.log(`postbuild-cert-briefing-jsonld: injected Article into ${injected} briefing(s)${skipped ? `, skipped ${skipped} (already had Article)` : ""}.`)
