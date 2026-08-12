#!/usr/bin/env node

// Generated source historically repeated the canonical table-head background
// inline. Remove those local color declarations after generation so every
// table inherits the one .wiki-content table system from cert-chrome.scss.

import fs from "node:fs"
import path from "node:path"

const root = path.join(process.cwd(), "content")
let pagesChanged = 0
let headsChanged = 0

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full)
    else if (entry.name.endsWith(".md")) normalize(full)
  }
}

function normalize(file) {
  const source = fs.readFileSync(file, "utf8")
  const next = source.replace(/<thead[\s>][\s\S]*?<\/thead>/gi, (head) => {
    const cleaned = head.replace(/\sstyle=(["'])(.*?)\1/gi, (attribute, quote, value) => {
      const declarations = value
        .split(";")
        .map((part) => part.trim())
        .filter(Boolean)
        .filter((part) => !/^(?:background(?:-color)?|color)\s*:/i.test(part))
      return declarations.length ? ` style=${quote}${declarations.join(";")}${quote}` : ""
    })
    if (cleaned !== head) headsChanged++
    return cleaned
  })
  if (next !== source) {
    fs.writeFileSync(file, next)
    pagesChanged++
  }
}

walk(root)
console.log(`canonical-table-heads: normalized ${headsChanged} table head(s) across ${pagesChanged} page(s).`)
