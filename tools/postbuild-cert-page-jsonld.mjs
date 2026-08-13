#!/usr/bin/env node
// postbuild-cert-page-jsonld.mjs — inject Article + FAQPage JSON-LD into the
// hand-authored wayfinding/SEO pages that live OUTSIDE /articles.
//
// postbuild-article-jsonld.mjs already does this for research syntheses under
// /articles/ (driven by data/articles/synthesis specs). Top-level SEO surfaces
// like /compare are not syntheses and have no such spec, so they get their own
// injector here. The Article graph reuses the shared Organization @id
// (heavymetalcertified.com/#organization) as both author and publisher, so
// Google fuses this page's node with the homepage Organization graph rather than
// minting a second, disconnected entity (same rationale as the article injector).
//
// The FAQPage is DERIVED from the page's own visible FAQ (the `.hmtc-faq`
// accordion), not authored twice: this keeps the structured data and the
// on-page answers from drifting, which is also what Google requires for the FAQ
// rich result (the Q&A must be visible on the page). A page with no `.hmtc-faq`
// block simply gets no FAQPage node.

import fs from "node:fs"
import path from "node:path"

const PUBLIC = path.join(process.cwd(), "public")
const CERT_BASE = "https://heavymetalcertified.com"
const ORG_ID = `${CERT_BASE}/#organization`

// Per-page Article specs. Slugs are root-relative (no leading slash, no .html).
const PAGES = [
  {
    slug: "compare",
    headline: "Heavy-metal certification comparison",
    description:
      "How heavy-metal certifications compare on coverage: HMTc sets a published limit for all eight priority metals across consumer packaged goods, where conventional four-metal marks screen the big four and NSF/ANSI 173 reaches five.",
    datePublished: "2026-08-13",
    dateModified: "2026-08-13",
    keywords: [
      "heavy metal certification comparison",
      "most comprehensive heavy metal certification",
      "NSF ANSI 173",
      "ICH Q3D",
      "Clean Label Project",
      "USP Verified",
      "eight metals",
      "aluminium in food certification",
      "heavy metals in food",
      "HMTc",
    ],
  },
]

const ENTITIES = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#34;": '"',
  "&#39;": "'",
  "&apos;": "'",
  "&rsquo;": "’",
  "&lsquo;": "‘",
  "&ldquo;": "“",
  "&rdquo;": "”",
  "&mdash;": "—",
  "&ndash;": "–",
  "&middot;": "·",
  "&nbsp;": " ",
  "&hellip;": "…",
}

function decodeEntities(s) {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&[a-z]+;/gi, (m) => (m in ENTITIES ? ENTITIES[m] : m))
}

function stripToText(html) {
  return decodeEntities(
    html
      .replace(/<[^>]+>/g, " ") // drop tags
      .replace(/\s+/g, " ")
      .trim(),
  )
}

// Pull { q, a } pairs from the page's visible <details class="hmtc-faq"> blocks.
function extractFaq(html) {
  const out = []
  const block = /<details[^>]*class="[^"]*\bhmtc-faq\b[^"]*"[^>]*>([\s\S]*?)<\/details>/gi
  let m
  while ((m = block.exec(html))) {
    const inner = m[1]
    const q = /<span[^>]*class="[^"]*\bhmtc-faq-q\b[^"]*"[^>]*>([\s\S]*?)<\/span>/i.exec(inner)
    const a = /<div[^>]*class="[^"]*\bhmtc-faq-a\b[^"]*"[^>]*>([\s\S]*?)<\/div>/i.exec(inner)
    if (!q || !a) continue
    const question = stripToText(q[1])
    const answer = stripToText(a[1])
    if (question && answer) out.push({ q: question, a: answer })
  }
  return out
}

function articleGraph(page, url) {
  const headline = page.headline.slice(0, 110)
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${url}#article`,
    headline,
    name: page.headline,
    description: page.description,
    inLanguage: "en",
    url,
    mainEntityOfPage: url,
    isAccessibleForFree: true,
    datePublished: page.datePublished,
    dateModified: page.dateModified ?? page.datePublished,
    keywords: (page.keywords ?? []).join(", "),
    author: { "@type": "Organization", "@id": ORG_ID, name: "Heavy Metal Tested & Certified" },
    publisher: { "@type": "Organization", "@id": ORG_ID, name: "Heavy Metal Tested & Certified" },
  }
}

function faqGraph(faq, url) {
  if (!faq.length) return null
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${url}#faq`,
    mainEntity: faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  }
}

let injected = 0
for (const page of PAGES) {
  const file = path.join(PUBLIC, `${page.slug}.html`)
  if (!fs.existsSync(file)) {
    console.error(`postbuild-cert-page-jsonld: ${page.slug}.html not found; skipping.`)
    continue
  }
  let html = fs.readFileSync(file, "utf8")
  const url = `${CERT_BASE}/${page.slug}`

  if (html.includes(`${url}#article`)) {
    console.log(`postbuild-cert-page-jsonld: ${page.slug} already has JSON-LD; skipping.`)
    continue
  }

  const faq = extractFaq(html)
  const graphs = [articleGraph(page, url), faqGraph(faq, url)].filter(Boolean)
  const tags = graphs
    .map((g) => `<script type="application/ld+json">${JSON.stringify(g)}</script>`)
    .join("")

  html = html.replace("</head>", `${tags}</head>`)
  fs.writeFileSync(file, html, "utf8")
  injected++
  console.log(
    `postbuild-cert-page-jsonld: injected Article${faq.length ? ` + FAQPage (${faq.length} Q)` : ""} into /${page.slug}.`,
  )
}

if (!injected) console.log("postbuild-cert-page-jsonld: nothing to inject.")
