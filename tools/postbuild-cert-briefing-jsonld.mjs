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
// own publication frontmatter. `updated` supplies only dateModified. Missing or
// unparseable dates are omitted instead of guessed.
//
// Marker-bounded (CERT-BRIEFING-JSONLD-START/END) and idempotent: a page that already
// carries an Article node (e.g. a future spec-driven one) is left untouched, and a
// re-run replaces only its own block.

import fs from "node:fs"
import path from "node:path"
import matter from "gray-matter"
import { jsonLdScript, publicationMetadata } from "./lib/publication-jsonld.mjs"
import {
  CERT_BASE,
  CERT_WEBSITE_ID,
  ICS_ORGANIZATION_ID,
} from "./lib/entity-graph.mjs"

const REPO = process.cwd()
const CONTENT = path.join(REPO, "content/briefings")
const PUBLIC = path.join(REPO, "public/briefings")
const START = "<!-- CERT-BRIEFING-JSONLD-START -->"
const END = "<!-- CERT-BRIEFING-JSONLD-END -->"
const PUBLISHER = {
  "@type": "Organization",
  "@id": ICS_ORGANIZATION_ID,
  name: "Institute of Contaminant Standards",
}

if (!fs.existsSync(PUBLIC)) {
  console.log("postbuild-cert-briefing-jsonld: public/briefings not present yet (skipping; ran before quartz build)")
  process.exit(0)
}

function articleGraph({ url, title, description, frontmatter }) {
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
    copyrightNotice: "© All rights reserved",
    license: "© All rights reserved",
    ...publicationMetadata(frontmatter),
    publisher: PUBLISHER,
    isPartOf: { "@id": CERT_WEBSITE_ID },
  }
  return g
}

let injected = 0, skipped = 0
for (const file of fs.readdirSync(CONTENT)) {
  if (!file.endsWith(".md") || file === "index.md") continue
  const src = fs.readFileSync(path.join(CONTENT, file), "utf8")
  const fm = matter(src).data
  if (fm.type !== "public-briefing") continue

  const slug = fm.briefing_slug || file.replace(/\.md$/, "")
  const htmlPath = path.join(PUBLIC, `${slug}.html`)
  if (!fs.existsSync(htmlPath)) { console.error(`postbuild-cert-briefing-jsonld: ${slug}.html not found; skipping.`); continue }

  let html = fs.readFileSync(htmlPath, "utf8")
  const url = `${CERT_BASE}/briefings/${slug}`
  // Idempotent + non-colliding: skip if an Article node is already present from any source.
  if (html.includes(START)) {
    html = html.replace(new RegExp(`${START}[\\s\\S]*?${END}\\n?`), "")
  } else if (/"@type"\s*:\s*"Article"/.test(html)) { skipped++; continue }

  const title = fm.title || slug
  const description = fm.description || ""

  const graph = articleGraph({ url, title, description, frontmatter: fm })
  const block = `${START}\n${jsonLdScript(graph)}\n${END}`
  html = html.includes("</head>") ? html.replace("</head>", `${block}\n</head>`) : `${html}\n${block}\n`
  fs.writeFileSync(htmlPath, html, "utf8")
  injected++
}

console.log(`postbuild-cert-briefing-jsonld: injected Article into ${injected} briefing(s)${skipped ? `, skipped ${skipped} (already had Article)` : ""}.`)
