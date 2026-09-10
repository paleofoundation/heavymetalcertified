#!/usr/bin/env node
// Fail the build if an indexable standards/article/about/program-hub page ships
// without Article/TechArticle/WebPage/AboutPage JSON-LD, or if any page mints a
// fake Review/AggregateRating. Organization @id must stay fused to
// https://heavymetalcertified.com/#organization.

import fs from "node:fs"
import path from "node:path"

import {
  hasJsonLdType,
  htmlRoute,
  isNoindex,
  walkHtml,
} from "./lib/built-html.mjs"

const PUBLIC = path.join(process.cwd(), "public")
const ORG_ID = "https://heavymetalcertified.com/#organization"
const PAGE_TYPES = ["AboutPage", "WebPage", "Article", "TechArticle", "CollectionPage"]
const errors = []

function jsonLdScripts(html) {
  return html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi) ?? []
}

function parseGraphs(html) {
  const out = []
  for (const block of jsonLdScripts(html)) {
    const raw = block.replace(/^<script[^>]*>/i, "").replace(/<\/script>$/i, "")
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) out.push(...parsed)
      else if (parsed && typeof parsed === "object") {
        out.push(parsed)
        if (Array.isArray(parsed["@graph"])) out.push(...parsed["@graph"])
      }
    } catch {
      out.push({ __invalid: true })
    }
  }
  return out
}

function requiresCoverage(route) {
  return (
    route === "/about" ||
    route === "/program" ||
    route.startsWith("/standards") ||
    (route.startsWith("/articles/") && route !== "/articles/index")
  )
}

if (!fs.existsSync(PUBLIC)) {
  console.error("lint-jsonld-coverage: public/ missing; run the build first")
  process.exit(1)
}

let checked = 0
for (const file of walkHtml(PUBLIC)) {
  if (path.basename(file) === "404.html") continue
  const html = fs.readFileSync(file, "utf8")
  const route = htmlRoute(PUBLIC, file)
  if (isNoindex(html) || !requiresCoverage(route)) continue
  checked++

  const graphs = parseGraphs(html)
  if (graphs.some((g) => g.__invalid)) {
    errors.push(`${route}: malformed JSON-LD`)
    continue
  }
  if (graphs.some((g) => g["@type"] === "Review" || g["@type"] === "AggregateRating")) {
    errors.push(`${route}: forbids Review/AggregateRating JSON-LD`)
  }
  const hasPage = PAGE_TYPES.some((type) => hasJsonLdType(html, type))
  if (!hasPage) {
    errors.push(`${route}: missing Article/TechArticle/WebPage/AboutPage JSON-LD`)
  }
  if (route === "/about" && !hasJsonLdType(html, "AboutPage") && !hasJsonLdType(html, "WebPage")) {
    errors.push(`${route}: AboutPage/WebPage JSON-LD required`)
  }
  if (hasPage && !html.includes(ORG_ID)) {
    errors.push(`${route}: JSON-LD must reuse ${ORG_ID}`)
  }
  if (hasPage && !hasJsonLdType(html, "BreadcrumbList") && route !== "/") {
    errors.push(`${route}: missing BreadcrumbList JSON-LD`)
  }
}

if (errors.length) {
  console.error(`lint-jsonld-coverage: FAILED (${errors.length} issue(s) across ${checked} page(s))`)
  for (const error of errors) console.error(`  - ${error}`)
  process.exit(1)
}

console.log(`lint-jsonld-coverage: PASS — ${checked} covered page(s) have page + breadcrumb JSON-LD`)
