#!/usr/bin/env node
// postbuild-why-limited-jsonld.mjs — inject schema.org Article (+ FAQPage) into
// each per-metal "why we limit" page's built HTML, for answer-engine / rich-result
// surfacing (LLMO). Sibling of postbuild-article-jsonld.mjs.
//
// The publisher node reuses the cert Organization @id
// (heavymetalcertified.com/#organization) so Google fuses it with the homepage
// Organization graph (postbuild-cert-jsonld.mjs) rather than minting a second
// publisher entity. The author carries the ORCID as `sameAs`/`identifier`.
//
// The `isBasedOn` edge is the one-way firewall stated in structured data: the
// rationale is built on the independent Index metal page. `about` names the metal
// as the DefinedTerm the page is about.
//
// Source of truth is the per-metal spec (data/why-limited/<slug>.json), the same
// file build-why-limited-pages.mjs renders from — so the visible page and the
// structured data never diverge.

import fs from "node:fs"
import path from "node:path"

const repoRoot = process.cwd()
const SPEC_DIR = path.join(repoRoot, "data/why-limited")
const PUBLIC = path.join(repoRoot, "public/why-we-limit")
const CERT_BASE = "https://heavymetalcertified.com"
const ORCID = "https://orcid.org/0000-0002-2348-7259"

if (!fs.existsSync(SPEC_DIR)) {
  console.log("postbuild-why-limited-jsonld: no spec dir; skipping.")
  process.exit(0)
}

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
const strip = (s) =>
  String(s || "")
    .replace(/<[^>]+>/g, "")
    .replace(/[_*]([^_*\n]+)[_*]/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&middot;/g, "·")
    .replace(/&mdash;/g, "—")
    .replace(/\s+/g, " ")
    .trim()

function articleGraph(spec) {
  const url = `${CERT_BASE}/why-we-limit/${spec.slug}`
  const date = isoDate(spec.date)
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
  if (date) {
    g.datePublished = date
    g.dateModified = date
  }
  if (Array.isArray(spec.keywords) && spec.keywords.length) g.keywords = spec.keywords.join(", ")
  if (spec.name) {
    g.about = { "@type": "DefinedTerm", name: spec.name }
  }
  // The one-way provenance edge: this rationale is built on the independent Index
  // metal page.
  if (spec.index_slug) {
    g.isBasedOn = { "@type": "WebPage", url: `https://heavymetalindex.com/metals/${spec.index_slug}` }
  }
  return g
}

function faqGraph(spec) {
  if (!Array.isArray(spec.faq) || !spec.faq.length) return null
  const url = `${CERT_BASE}/why-we-limit/${spec.slug}`
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
for (const f of fs.readdirSync(SPEC_DIR).filter((x) => x.endsWith(".json"))) {
  const spec = JSON.parse(fs.readFileSync(path.join(SPEC_DIR, f), "utf8"))
  const htmlPath = path.join(PUBLIC, `${spec.slug}.html`)
  if (!fs.existsSync(htmlPath)) {
    console.warn(`  no built HTML for ${spec.slug} (${path.relative(repoRoot, htmlPath)}); skipping.`)
    missing++
    continue
  }
  let html = fs.readFileSync(htmlPath, "utf8")
  if (html.includes(`${CERT_BASE}/why-we-limit/${spec.slug}#article`)) {
    // already injected (idempotent re-run)
    continue
  }
  const graphs = [articleGraph(spec), faqGraph(spec)].filter(Boolean)
  const tag = graphs
    .map((g) => `<script type="application/ld+json">${JSON.stringify(g)}</script>`)
    .join("")
  html = html.replace("</head>", `${tag}</head>`)
  fs.writeFileSync(htmlPath, html, "utf8")
  injected++
}
console.log(
  `postbuild-why-limited-jsonld: injected Article + FAQPage JSON-LD into ${injected} page(s)` +
    (missing ? `; ${missing} spec(s) had no built HTML.` : "."),
)
