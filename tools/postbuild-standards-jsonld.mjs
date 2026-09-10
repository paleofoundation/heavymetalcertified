#!/usr/bin/env node
// postbuild-standards-jsonld.mjs — inject TechArticle + BreadcrumbList into
// every built standards page (register, finder, and per-subcategory rows).
//
// Spot-checks on 2026-09-10 found no JSON-LD on standards HTML. Articles already
// go through postbuild-article-jsonld.mjs; this is the matching injector for
// the specification surface. Publisher/author reuse
// https://heavymetalcertified.com/#organization so Google fuses the node with
// the homepage Organization graph. No Review / AggregateRating.

import fs from "node:fs"
import path from "node:path"

import { CERT_BASE, CERT_ORGANIZATION_ID } from "./lib/entity-graph.mjs"
import {
  expectedCanonical,
  htmlRoute,
  isNoindex,
  linkRel,
  meta,
  property,
  titleWithoutBrand,
  walkHtml,
} from "./lib/built-html.mjs"

const PUBLIC = path.join(process.cwd(), "public")
const STANDARDS = path.join(PUBLIC, "standards")
const START = "<!-- CERT-STANDARDS-JSONLD-START -->"
const END = "<!-- CERT-STANDARDS-JSONLD-END -->"
const ORG = {
  "@type": "Organization",
  "@id": CERT_ORGANIZATION_ID,
  name: "Heavy Metal Tested & Certified",
}

function breadcrumb(url, title) {
  const items = [
    { "@type": "ListItem", position: 1, name: "Home", item: CERT_BASE },
    { "@type": "ListItem", position: 2, name: "Standards", item: `${CERT_BASE}/standards` },
  ]
  if (url !== `${CERT_BASE}/standards`) {
    items.push({ "@type": "ListItem", position: 3, name: title, item: url })
  }
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "@id": `${url}#breadcrumbs`,
    itemListElement: items,
  }
}

function techArticle({ url, title, description }) {
  return {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    "@id": `${url}#article`,
    headline: title.slice(0, 110),
    name: title,
    description,
    inLanguage: "en",
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    isAccessibleForFree: true,
    author: ORG,
    publisher: ORG,
  }
}

if (!fs.existsSync(STANDARDS)) {
  console.log("postbuild-standards-jsonld: public/standards missing; skipping")
  process.exit(0)
}

let injected = 0
let skipped = 0
for (const file of walkHtml(STANDARDS)) {
  let html = fs.readFileSync(file, "utf8")
  if (isNoindex(html)) {
    skipped++
    continue
  }
  const route = htmlRoute(PUBLIC, file)
  const url = linkRel(html, "canonical") ?? expectedCanonical(route)
  const title = titleWithoutBrand(html) || "HMTc standard"
  const description = meta(html, "description") || property(html, "og:description") || title

  if (html.includes(START)) {
    html = html.replace(new RegExp(`${START}[\\s\\S]*?${END}\\n?`), "")
  } else if (html.includes(`${url}#article`)) {
    skipped++
    continue
  }

  const graphs = [techArticle({ url, title, description }), breadcrumb(url, title)]
  const block =
    `${START}` +
    graphs.map((g) => `<script type="application/ld+json">${JSON.stringify(g)}</script>`).join("") +
    `${END}`
  if (!html.includes("</head>")) {
    console.error(`postbuild-standards-jsonld: ${route} has no </head>; skipping`)
    continue
  }
  html = html.replace("</head>", `${block}</head>`)
  fs.writeFileSync(file, html, "utf8")
  injected++
}

console.log(
  `postbuild-standards-jsonld: injected TechArticle + BreadcrumbList into ${injected} standards page(s)` +
    (skipped ? `; skipped ${skipped}.` : "."),
)
