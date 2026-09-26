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
// Per-metal specs supply relationships; actual page frontmatter supplies
// author credit and publication dates at their known precision.

import fs from "node:fs"
import path from "node:path"
import matter from "gray-matter"
import { CERT_BASE, CERT_ORGANIZATION_ID } from "./lib/entity-graph.mjs"
import { publicationMetadata, replacePublicationGraphs } from "./lib/publication-jsonld.mjs"

const repoRoot = process.cwd()
const SPEC_DIR = path.join(repoRoot, "data/why-limited")
const PUBLIC = path.join(repoRoot, "public/why-we-limit")
const CONTENT = path.join(repoRoot, "content/why-we-limit")

if (!fs.existsSync(SPEC_DIR)) {
  console.log("postbuild-why-limited-jsonld: no spec dir; skipping.")
  process.exit(0)
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

function articleGraph(spec, frontmatter) {
  const url = `${CERT_BASE}/why-we-limit/${spec.slug}`
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
    // A spec marked all-rights-reserved carries the house notice, never CC BY.
    ...(spec.rights === "all-rights-reserved"
      ? { copyrightNotice: "© 2026 Institute of Contaminant Standards / Heavy Metal Certified. All rights reserved." }
      : { license: "https://creativecommons.org/licenses/by/4.0/" }),
    isAccessibleForFree: true,
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
  const frontmatter = matter(fs.readFileSync(path.join(CONTENT, `${spec.slug}.md`), "utf8")).data
  const graphs = [articleGraph(spec, frontmatter), faqGraph(spec)]
  const url = `${CERT_BASE}/why-we-limit/${spec.slug}`
  const html = replacePublicationGraphs(fs.readFileSync(htmlPath, "utf8"), graphs,
    [`${url}#article`, `${url}#faq`])
  fs.writeFileSync(htmlPath, html, "utf8")
  injected++
}
console.log(
  `postbuild-why-limited-jsonld: injected Article + FAQPage JSON-LD into ${injected} page(s)` +
    (missing ? `; ${missing} spec(s) had no built HTML.` : "."),
)
