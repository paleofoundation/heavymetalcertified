#!/usr/bin/env node
// postbuild-article-jsonld.mjs — inject schema.org Article (+ FAQPage where the
// article carries an FAQ) structured data into each synthesis-coverage article's
// built HTML, for answer-engine / rich-result surfacing (LLMO).
//
// Head.tsx already emits the Google Scholar citation_* meta for scholar_eligible
// pages; this is the complementary JSON-LD layer. The publisher node reuses the
// cert Organization @id (heavymetalcertified.com/#organization) so Google fuses it
// with the homepage Organization graph (postbuild-cert-jsonld.mjs) rather than
// minting a second, disconnected publisher entity.
//
// Specs supply article relationships; actual page frontmatter supplies authors
// and publication dates. The hand-authored chocolate article has no spec;
// it is skipped (it can carry its own JSON-LD later if wanted).

import fs from "node:fs"
import path from "node:path"
import matter from "gray-matter"
import { CERT_BASE, CERT_ORGANIZATION_ID } from "./lib/entity-graph.mjs"
import { publicationMetadata, replacePublicationGraphs } from "./lib/publication-jsonld.mjs"

const repoRoot = process.cwd()
const SPEC_DIRS = [path.join(repoRoot, "data/articles/synthesis"), path.join(repoRoot, "data/articles/regulatory-watch")]
const PUBLIC = path.join(repoRoot, "public/articles")
const CONTENT = path.join(repoRoot, "content/articles")

if (!SPEC_DIRS.some((dir) => fs.existsSync(dir))) {
  console.log("postbuild-article-jsonld: no spec dir; skipping.")
  process.exit(0)
}

const strip = (s) => String(s || "").replace(/<[^>]+>/g, "").replace(/[_*]([^_*\n]+)[_*]/g, "$1").replace(/\s+/g, " ").trim()

function articleGraph(spec, frontmatter) {
  const url = `${CERT_BASE}/articles/${spec.slug}`
  const g = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${url}#article`,
    headline: strip(spec.title).slice(0, 110),
    name: strip(spec.title),
    description: strip(spec.description || spec.dek),
    inLanguage: "en",
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    ...publicationMetadata(frontmatter),
    publisher: {
      "@type": "Organization",
      "@id": CERT_ORGANIZATION_ID,
      name: "Heavy Metal Tested & Certified",
    },
    license: "https://creativecommons.org/licenses/by/4.0/",
    isAccessibleForFree: true,
  }
  if (Array.isArray(spec.keywords) && spec.keywords.length) g.keywords = spec.keywords.join(", ")
  // The one-way provenance edge: this analysis is based on the independent Index
  // synthesis finding. isBasedOn is the schema.org way to say so.
  const based = Array.isArray(spec.isBasedOn) ? spec.isBasedOn : spec.synthesis_url ? [spec.synthesis_url] : []
  if (based.length) g.isBasedOn = based.map((item) => ({ "@type": "CreativeWork", url: typeof item === "string" ? item : item.url, name: typeof item === "string" ? undefined : item.name }))
  if (Array.isArray(spec.citation) && spec.citation.length) g.citation = spec.citation.map((item) => typeof item === "string" ? item : item.url)
  if (spec.series_url) g.isPartOf = { "@type": "CollectionPage", "@id": `${CERT_BASE}${spec.series_url}#collection`, url: `${CERT_BASE}${spec.series_url}`, name: spec.series || "Regulatory Watch" }
  if (Array.isArray(spec.metals) && spec.metals.length) g.about = spec.metals.map((name) => ({ "@type": "Thing", name }))
  const mentions = [...(spec.jurisdictions || []), ...(spec.instruments || [])]
  if (mentions.length) g.mentions = mentions.map((name) => ({ "@type": "Thing", name }))
  return g
}

function breadcrumbGraph(spec) {
  const url = `${CERT_BASE}/articles/${spec.slug}`
  const items = [
    { "@type": "ListItem", position: 1, name: "Home", item: CERT_BASE },
    { "@type": "ListItem", position: 2, name: "Research", item: `${CERT_BASE}/articles` },
  ]
  if (spec.series_url) items.push({ "@type": "ListItem", position: 3, name: spec.series || "Regulatory Watch", item: `${CERT_BASE}${spec.series_url}` })
  items.push({ "@type": "ListItem", position: items.length + 1, name: strip(spec.title), item: url })
  return { "@context": "https://schema.org", "@type": "BreadcrumbList", "@id": `${url}#breadcrumbs`, itemListElement: items }
}

function faqGraph(spec) {
  if (!Array.isArray(spec.faq) || !spec.faq.length) return null
  const url = `${CERT_BASE}/articles/${spec.slug}`
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${url}#faq`,
    mainEntity: spec.faq.map((f) => ({
      "@type": "Question",
      name: strip(f.q),
      acceptedAnswer: { "@type": "Answer", text: strip(f.a) },
    })),
  }
}

let injected = 0
let missing = 0
for (const dir of SPEC_DIRS) {
 if (!fs.existsSync(dir)) continue
 for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".json"))) {
  const spec = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"))
  const htmlPath = path.join(PUBLIC, `${spec.slug}.html`)
  if (!fs.existsSync(htmlPath)) {
    console.warn(`  no built HTML for ${spec.slug} (${path.relative(repoRoot, htmlPath)}); skipping.`)
    missing++
    continue
  }
  const frontmatter = matter(fs.readFileSync(path.join(CONTENT, `${spec.slug}.md`), "utf8")).data
  const graphs = [articleGraph(spec, frontmatter), faqGraph(spec), breadcrumbGraph(spec)]
  const url = `${CERT_BASE}/articles/${spec.slug}`
  const html = replacePublicationGraphs(fs.readFileSync(htmlPath, "utf8"), graphs,
    [`${url}#article`, `${url}#faq`, `${url}#breadcrumbs`])
  fs.writeFileSync(htmlPath, html, "utf8")
  injected++
 }
}
console.log(
  `postbuild-article-jsonld: injected Article + FAQPage JSON-LD into ${injected} article page(s)` +
    (missing ? `; ${missing} spec(s) had no built HTML.` : "."),
)
