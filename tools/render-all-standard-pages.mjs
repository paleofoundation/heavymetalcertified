#!/usr/bin/env node
// render-all-standard-pages.mjs — render every category standard manifest in data/standards/.
//
// The prebuild used to name each manifest in its own `node tools/build-category-standard-pages.mjs
// --pages=...` invocation, sixteen of them by the time the pantry categories shipped. That list is a
// standing failure mode: a category whose manifest exists but whose line was never added to
// package.json compiles, passes its gate, and then silently never renders. Publishing the remaining
// fifteen categories would have taken the list to thirty entries.
//
// So the driver discovers manifests instead. Any data/standards/*-pages.json carrying a `_meta` block
// is rendered through the generalized renderer. A manifest WITHOUT `_meta` belongs to a
// category-specific renderer (Category 1 keeps build-cat1-standard-pages.mjs) and is skipped by that
// self-describing rule rather than by a hardcoded exclusion list.
//
// Usage:
//   node tools/render-all-standard-pages.mjs            render every discovered manifest
//   node tools/render-all-standard-pages.mjs --list     report what would render, write nothing

import fs from "node:fs"
import path from "node:path"
import { execFileSync } from "node:child_process"

const REPO = process.cwd()
const args = new Set(process.argv.slice(2))
const LIST = args.has("--list")

const dir = path.join(REPO, "data/standards")
const manifests = fs.readdirSync(dir)
  .filter((f) => f.endsWith("-pages.json"))
  .sort()
  .map((f) => {
    const rel = path.join("data/standards", f)
    let doc
    try { doc = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")) }
    catch (e) { return { rel, skip: `unparseable: ${e.message}` } }
    if (!doc._meta) return { rel, skip: "no _meta block — belongs to a category-specific renderer" }
    if (!doc._meta.compiled_dir) return { rel, skip: "_meta names no compiled_dir" }
    if (!fs.existsSync(path.join(dir, doc._meta.compiled_dir))) {
      return { rel, skip: `compiled_dir ${doc._meta.compiled_dir} is missing` }
    }
    return { rel, category: doc._meta.category, name: doc._meta.category_name, pages: (doc.pages || []).length }
  })

const renderable = manifests.filter((m) => !m.skip)
const skipped = manifests.filter((m) => m.skip)

for (const s of skipped) console.log(`  skip  ${s.rel} — ${s.skip}`)

if (LIST) {
  for (const m of renderable) console.log(`  would render  ${m.rel} — category ${m.category} (${m.name}), ${m.pages} page(s)`)
  console.log(`render-all-standard-pages --list: ${renderable.length} manifest(s) renderable, ${skipped.length} skipped`)
  process.exit(0)
}

// A manifest whose compiled_dir is present but whose render fails is a hard error: shipping a partial
// standards set is worse than failing the build, because the missing pages are invisible on the index.
let pages = 0
for (const m of renderable) {
  try {
    const out = execFileSync("node", ["tools/build-category-standard-pages.mjs", `--pages=${m.rel}`], { cwd: REPO, encoding: "utf8" })
    const last = out.trim().split("\n").pop()
    console.log(`  ${last}`)
    pages += m.pages
  } catch (e) {
    console.error(`render-all-standard-pages: FAILED on ${m.rel}`)
    console.error(e.stdout || "")
    console.error(e.stderr || "")
    process.exit(1)
  }
}
console.log(`render-all-standard-pages: rendered ${renderable.length} category manifest(s), ${pages} page(s)`)
