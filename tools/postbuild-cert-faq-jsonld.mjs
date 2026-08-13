#!/usr/bin/env node
// postbuild-cert-faq-jsonld.mjs — inject FAQPage JSON-LD into every built page
// that carries the canonical `.qa` accordion (CollapsibleQuestions emits the
// `data-hmi-faq` contract). This is the answer-engine / rich-result (LLMO) layer
// for the briefings, whose "## Frequently asked questions" sections have no
// spec-driven JSON-LD of their own.
//
// The synthesis ARTICLES already get an Article+FAQPage block from
// postbuild-article-jsonld.mjs (built from their data/articles/synthesis/*.json
// spec). To avoid emitting a second, competing FAQPage on those pages, this pass
// SKIPS any page that already contains an `"@type":"FAQPage"` object — so it
// composes with the article emitter rather than colliding with it, and only the
// accordion pages that lack structured data (the briefings) get one here.
//
// The acceptedAnswer is the VISIBLE verbatim answer text (the first <p> inside
// the accordion's answer div), so the structured answer is exactly what a human
// reads — never a separate summary that could drift from, or over-claim beyond,
// the page. Each candidate answer AND question is re-checked against the shared
// faq-firewall-guard; a tripping item is dropped (skip honestly), so a derived
// HMTc value can never reach the structured layer even from a stale block.
//
// Runs after `quartz build` (and after postbuild-article-jsonld). Idempotent —
// the injected block is marker-bounded with CERT-FAQ-JSONLD-START/END.

import fs from "node:fs"
import path from "node:path"
import { answerTripsFirewall } from "./lib/faq-firewall-guard.mjs"

const PUBLIC = path.join(process.cwd(), "public")
const CERT_BASE = "https://heavymetalcertified.com"
const WEBSITE = { "@type": "WebSite", name: "Heavy Metal Tested & Certified", url: CERT_BASE }
const START = "<!-- CERT-FAQ-JSONLD-START -->"
const END = "<!-- CERT-FAQ-JSONLD-END -->"

if (!fs.existsSync(PUBLIC)) {
  console.log("postbuild-cert-faq-jsonld: public/ not present yet (skipping; ran before quartz build)")
  process.exit(0)
}

let injected = 0
let skippedHasFaq = 0
let alreadyHasBlock = 0

for (const htmlPath of walkHtml(PUBLIC)) {
  let html = fs.readFileSync(htmlPath, "utf8")
  if (!html.includes("data-hmi-faq")) continue
  if (html.includes(START)) { alreadyHasBlock += 1; continue }
  // Dedupe: a page that already declares an FAQPage (e.g. the articles, from
  // postbuild-article-jsonld) is left untouched.
  if (/"@type"\s*:\s*"FAQPage"/.test(html)) { skippedHasFaq += 1; continue }

  const pageUrl = pageUrlOf(htmlPath)
  const faq = buildFaqPage(html, pageUrl)
  if (!faq) continue

  const block = `${START}\n<script type="application/ld+json">${JSON.stringify(faq)}</script>\n${END}`
  const next = html.includes("</head>")
    ? html.replace("</head>", `${block}\n</head>`)
    : html.includes("</body>")
      ? html.replace("</body>", `${block}\n</body>`)
      : `${html}\n${block}\n`
  fs.writeFileSync(htmlPath, next, "utf8")
  injected += 1
}

console.log(`postbuild-cert-faq-jsonld:`)
console.log(`  injected FAQPage:      ${injected}`)
console.log(`  skipped (has FAQPage): ${skippedHasFaq}`)
console.log(`  already-present:       ${alreadyHasBlock}`)

function* walkHtml(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) yield* walkHtml(full)
    else if (entry.isFile() && entry.name.endsWith(".html")) yield full
  }
}

// public/briefings/foo.html        -> https://heavymetalcertified.com/briefings/foo
// public/briefings/foo/index.html  -> https://heavymetalcertified.com/briefings/foo
// public/index.html                -> https://heavymetalcertified.com/
function pageUrlOf(htmlPath) {
  let rel = path.relative(PUBLIC, htmlPath).split(path.sep).join("/")
  rel = rel.replace(/index\.html$/, "").replace(/\.html$/, "")
  rel = rel.replace(/\/$/, "")
  return rel ? `${CERT_BASE}/${rel}` : `${CERT_BASE}/`
}

// Build an FAQPage object from the rendered accordion, mirroring the visible
// answer text. Returns null unless at least two clean Q&As survive the firewall.
function buildFaqPage(html, pageUrl) {
  const mainEntity = []
  for (const it of extractAccordionItems(html)) {
    if (!it.question || !it.answer) continue
    if (answerTripsFirewall(it.answer) || answerTripsFirewall(it.question)) continue
    mainEntity.push({
      "@type": "Question",
      name: it.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: it.answer,
        url: it.anchor ? `${pageUrl}#${it.anchor}` : pageUrl,
      },
    })
  }
  if (mainEntity.length < 2) return null

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${pageUrl}#faq`,
    url: pageUrl,
    isPartOf: WEBSITE,
    inLanguage: "en",
    mainEntity,
  }
}

// Parse `<details … data-hmi-faq …>` blocks out of rendered HTML. Reads
// data-question / data-anchor (authored by the transformer) and the visible
// answer = first <p> inside the answer div. Decodes entities and strips tags so
// the JSON text matches what the reader sees.
function extractAccordionItems(html) {
  const items = []
  const blockRe = /<details\b[^>]*\bdata-hmi-faq=[^>]*>([\s\S]*?)<\/details>/gi
  let bm
  while ((bm = blockRe.exec(html)) !== null) {
    const block = bm[0]
    const inner = bm[1]
    const question =
      attrOf(block, "data-question") ?? textOf(inner.match(/<summary[^>]*>([\s\S]*?)<\/summary>/i)?.[1])
    const anchor = attrOf(block, "data-anchor")
    const answerScope = inner.match(/<div\b[^>]*data-hmi-faq-answer[^>]*>([\s\S]*?)<\/div>/i)?.[1] ?? inner
    const firstP = answerScope.match(/<p\b[^>]*>([\s\S]*?)<\/p>/i)?.[1]
    const answer = textOf(firstP)
    items.push({ question, anchor, answer })
  }
  return items
}

function attrOf(html, attr) {
  const m = html.match(new RegExp(`${attr}="([^"]*)"`, "i"))
  return m ? decodeEntities(m[1]) : undefined
}
function textOf(htmlFragment) {
  if (!htmlFragment) return undefined
  const stripped = htmlFragment.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim()
  return stripped ? decodeEntities(stripped) : undefined
}
function decodeEntities(s) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/gi, "'")
}
