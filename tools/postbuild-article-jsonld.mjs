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
// Source of truth is the article spec (data/articles/synthesis/<slug>.json), the
// same file build-cert-articles.mjs renders from — so the visible page and the
// structured data never diverge. The hand-authored chocolate article has no spec;
// it is skipped (it can carry its own JSON-LD later if wanted).

import fs from "node:fs"
import path from "node:path"

const repoRoot = process.cwd()
const SPEC_DIRS = [path.join(repoRoot, "data/articles/synthesis"), path.join(repoRoot, "data/articles/regulatory-watch")]
const PUBLIC = path.join(repoRoot, "public/articles")
const CERT_BASE = "https://heavymetalcertified.com"
const ORCID = "https://orcid.org/0000-0002-2348-7259"

if (!SPEC_DIRS.some((dir) => fs.existsSync(dir))) {
  console.log("postbuild-article-jsonld: no spec dir; skipping.")
  process.exit(0)
}

// "August 2026" -> "2026-08-01"; passes ISO through. Best-effort; a schema date
// only needs to be a valid ISO 8601 date.
const MONTHS = {
  january: "01", february: "02", march: "03", april: "04", may: "05", june: "06",
  july: "07", august: "08", september: "09", october: "10", november: "11", december: "12",
}
function isoDate(s) {
  if (!s) return undefined
  const t = String(s).trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t
  const m = t.match(/^([A-Za-z]+)\s+(\d{4})$/)
  if (m && MONTHS[m[1].toLowerCase()]) return `${m[2]}-${MONTHS[m[1].toLowerCase()]}-01`
  const y = t.match(/^\d{4}$/)
  return y ? `${t}-01-01` : undefined
}
const strip = (s) => String(s || "").replace(/<[^>]+>/g, "").replace(/[_*]([^_*\n]+)[_*]/g, "$1").replace(/\s+/g, " ").trim()

function articleGraph(spec) {
  const url = `${CERT_BASE}/articles/${spec.slug}`
  const date = isoDate(spec.published || spec.date)
  const modified = isoDate(spec.modified || spec.date)
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
    author: {
      "@type": "Person",
      name: "Karen Pendergrass",
      url: ORCID,
      sameAs: ORCID,
      identifier: "0000-0002-2348-7259",
    },
    publisher: {
      "@type": "Organization",
      "@id": `${CERT_BASE}/#organization`,
      name: "Heavy Metal Tested & Certified",
    },
    license: "https://creativecommons.org/licenses/by/4.0/",
    isAccessibleForFree: true,
  }
  if (date) g.datePublished = date
  if (modified) g.dateModified = modified
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
  let html = fs.readFileSync(htmlPath, "utf8")
  if (html.includes(`${CERT_BASE}/articles/${spec.slug}#article`)) {
    // already injected (idempotent re-run)
    continue
  }
  const graphs = [articleGraph(spec), faqGraph(spec), breadcrumbGraph(spec)].filter(Boolean)
  const tag = graphs
    .map((g) => `<script type="application/ld+json">${JSON.stringify(g)}</script>`)
    .join("")
  html = html.replace("</head>", `${tag}</head>`)
  fs.writeFileSync(htmlPath, html, "utf8")
  injected++
 }
}
console.log(
  `postbuild-article-jsonld: injected Article + FAQPage JSON-LD into ${injected} article page(s)` +
    (missing ? `; ${missing} spec(s) had no built HTML.` : "."),
)
