#!/usr/bin/env node
// postbuild-cert-search-index.mjs — slim the client search index at build.
//
// public/static/contentIndex.json is emitted by the shared Quartz ContentIndex
// emitter, which serves BOTH sites. On the index site it also feeds the graph
// and explorer, so it carries a per-doc `links` array and `filePath`. The cert
// layout ships NEITHER graph nor explorer (quartz.layout.ts) — only the top-bar
// search reads this file, and search.inline.ts uses only title/content/tags.
// So `links` + `filePath` are dead weight here: this step rewrites the file to
// a search-only shape.
//
// It also caps any single doc's body at MAX_CONTENT_CHARS as a GUARDRAIL, not a
// trim: the program's 384-page manual deposit and other outsized generated
// pages must never bloat the client index (the "never serve the deposit" rule).
// The cap sits well above the current largest page, so today it is a no-op that
// only fires if a runaway page later enters the index.
//
// Content is otherwise kept in FULL. This is a reference site whose legal/QA
// audience searches for specific terms deep in long standards and regulation
// pages; truncating body text would silently drop recall. The win here is
// removing graph payload the cert can't use plus the runaway-page guardrail —
// not lossy compression. The file is fetched lazily (only when a visitor opens
// search), so it is never on the page-load critical path.

import fs from "node:fs"
import path from "node:path"
import zlib from "node:zlib"

const FILE = path.join(process.cwd(), "public", "static", "contentIndex.json")
// ~10k above the current largest page (~29k). A guardrail against a runaway
// page, not a trim of real content — see the header note.
const MAX_CONTENT_CHARS = 40000

if (!fs.existsSync(FILE)) {
  console.error("postbuild-cert-search-index: contentIndex.json not found; run the build first.")
  process.exit(1)
}

const before = fs.readFileSync(FILE, "utf8")

let idx
try {
  idx = JSON.parse(before)
} catch (err) {
  console.error("postbuild-cert-search-index: contentIndex.json is not valid JSON —", err.message)
  process.exit(1)
}

let capped = 0
const slim = {}
for (const [slug, d] of Object.entries(idx)) {
  let content = typeof d.content === "string" ? d.content : ""
  if (content.length > MAX_CONTENT_CHARS) {
    content = content.slice(0, MAX_CONTENT_CHARS)
    capped++
  }
  // Match the exact shape search.inline.ts fillDocument() reads.
  slim[slug] = {
    slug: d.slug ?? slug,
    title: d.title ?? "",
    tags: Array.isArray(d.tags) ? d.tags : [],
    content,
  }
}

const after = JSON.stringify(slim)
fs.writeFileSync(FILE, after, "utf8")

const gzip = (s) => zlib.gzipSync(Buffer.from(s)).length
const pct = before.length ? (100 * (1 - after.length / before.length)).toFixed(1) : "0.0"
console.log(
  `postbuild-cert-search-index: slimmed ${Object.keys(slim).length} docs to search-only shape — ` +
    `${before.length}→${after.length} B (${pct}% smaller; ~${gzip(after)} B gzip); ` +
    `dropped links+filePath; ${capped} doc(s) capped at ${MAX_CONTENT_CHARS} chars.`,
)
