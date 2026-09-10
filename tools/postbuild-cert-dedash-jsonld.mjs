#!/usr/bin/env node
// postbuild-cert-dedash-jsonld.mjs — extend the sitewide "avoid em dashes" rule to
// the schema.org metadata injected into built HTML.
//
// WHY A SECOND SWEEP. tools/dedash-content.mjs cleans em dashes at the content
// layer (content/**/*.md) before the build. But the JSON-LD graphs (Article, FAQPage,
// DataCatalog, …) are injected in POSTBUILD by a set of generators
// (postbuild-article-jsonld, postbuild-cert-faq-jsonld, postbuild-why-limited-jsonld,
// postbuild-cert-briefing-jsonld, postbuild-cert-page-jsonld, postbuild-cert-data-jsonld,
// postbuild-cert-jsonld, postbuild-standards-jsonld), and several of those read from spec .json sources the
// content sweep never touches. The result is prose-derived metadata (FAQ answers,
// article deks, dataset names) that still carries em dashes the visible page no
// longer does — text that search engines and AI answerers read. Rather than patch
// each generator, this runs LAST in postbuild and normalises every JSON-LD block in
// one place, so it stays clean as generators are added or changed. Idempotent.
//
// SAFETY. Only PROSE fields are rewritten (an allowlist of keys). Entity and
// citation subtrees (author, publisher, citation, isBasedOn, sameAs, identifier)
// are left untouched, honouring the rule's "citation text is exempt" carve-out.
// The shared transform is tools/lib/dedash.mjs (same as the content sweep).

import fs from "node:fs"
import path from "node:path"
import { dedashText } from "./lib/dedash.mjs"

const repoRoot = process.cwd()
const PUBLIC = path.join(repoRoot, "public")

// Keys whose string values are reader/AI-facing prose and are safe to dedash.
const PROSE_KEYS = new Set(["text", "description", "name", "headline", "articleBody", "abstract", "alternativeHeadline"])
// Subtrees to leave alone: proper-noun entity names, identifiers, and citation
// edges (a cited work's own title may legitimately carry an em dash).
const SKIP_SUBTREE = new Set(["citation", "isBasedOn", "author", "publisher", "sameAs", "identifier"])

let touched = 0 // string values rewritten
function walk(node, inSkip) {
  if (Array.isArray(node)) {
    for (const x of node) walk(x, inSkip)
    return
  }
  if (node && typeof node === "object") {
    for (const [k, v] of Object.entries(node)) {
      if (typeof v === "string") {
        if (!inSkip && PROSE_KEYS.has(k) && /—|&mdash;/.test(v)) {
          const next = dedashText(v)
          if (next !== v) {
            node[k] = next
            touched++
          }
        }
      } else {
        walk(v, inSkip || SKIP_SUBTREE.has(k))
      }
    }
  }
}

function walkFiles(dir, out = []) {
  if (!fs.existsSync(dir)) return out
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) walkFiles(full, out)
    else if (e.name.endsWith(".html")) out.push(full)
  }
  return out
}

const BLOCK = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g
let filesChanged = 0
let blocks = 0
for (const f of walkFiles(PUBLIC)) {
  const raw = fs.readFileSync(f, "utf8")
  let changed = false
  const next = raw.replace(BLOCK, (whole, json) => {
    blocks++
    let graph
    try {
      graph = JSON.parse(json)
    } catch {
      return whole // malformed / not our shape — leave as is
    }
    const before = touched
    walk(graph, false)
    if (touched === before) return whole
    changed = true
    return `<script type="application/ld+json">${JSON.stringify(graph)}</script>`
  })
  if (changed) {
    fs.writeFileSync(f, next, "utf8")
    filesChanged++
  }
}

console.log(
  `postbuild-cert-dedash-jsonld: normalised ${touched} em-dashed prose value(s) across ${blocks} JSON-LD block(s) in ${filesChanged} file(s) (citation/entity subtrees exempt).`,
)
