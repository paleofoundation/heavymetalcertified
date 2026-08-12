#!/usr/bin/env node

import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const dataPath = path.join(root, "data/category-readiness.json")
const pagePath = path.join(root, "content/category-readiness.md")
const publicDataPath = path.join(root, "content/static/category-readiness.json")
const start = "<!-- BEGIN: generated-category-readiness -->"
const end = "<!-- END: generated-category-readiness -->"

const data = JSON.parse(fs.readFileSync(dataPath, "utf8"))
const rows = data.categories
  .map((category) => `| ${category.name} | ${data.states[category.state]} | ${category.note} |`)
  .join("\n")
const block = `${start}\n\n_As of ${data.as_of}. This table is generated from \`data/category-readiness.json\`; it is the commercial-state source of truth._\n\n| Category | Current state | Why |\n|---|---|---|\n${rows}\n\n${end}`

const page = fs.readFileSync(pagePath, "utf8")
if (!page.includes(start) || !page.includes(end)) {
  throw new Error(`Missing generated readiness markers in ${pagePath}`)
}

const next = page.replace(new RegExp(`${start}[\\s\\S]*?${end}`), block)
fs.writeFileSync(pagePath, next)
fs.copyFileSync(dataPath, publicDataPath)
console.log(`category-readiness: ${data.categories.length} categories, ${data.as_of}`)
