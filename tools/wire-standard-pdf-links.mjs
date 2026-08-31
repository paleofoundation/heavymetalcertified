#!/usr/bin/env node
// wire-standard-pdf-links.mjs — deterministic, no react-pdf. Runs in the Vercel
// prebuild AFTER the standard renderers regenerate content/standards/*.md. For every
// standard page whose committed static PDF exists (content/static/standards/<slug>.pdf),
// inject the frontmatter that turns on the Rail Download-PDF button and the Google
// Scholar / citation_pdf_url meta:  pdf, scholar_pdf, scholar_pdf_url.
//
// One tool covers every category regardless of which renderer produced the page, so
// no per-renderer edits are needed. A standard with no committed PDF is left untouched
// (button stays off) — the DOI ⇒ PDF requirement is satisfied per-standard as its PDF
// is generated + committed by tools/build-standard-pdf.mjs (local, react-pdf).
import fs from "node:fs"
import path from "node:path"
const REPO = process.cwd()
const CONTENT = path.join(REPO, "content/standards")
const STATIC = path.join(REPO, "content/static/standards")
const BASE = "https://heavymetalcertified.com"
if (!fs.existsSync(CONTENT)) process.exit(0)
let wired = 0
for (const f of fs.readdirSync(CONTENT)) {
  if (!f.endsWith(".md") || f === "index.md") continue
  const slug = f.replace(/\.md$/, "")
  if (!fs.existsSync(path.join(STATIC, `${slug}.pdf`))) continue
  const p = path.join(CONTENT, f)
  let src = fs.readFileSync(p, "utf8")
  const fmMatch = src.match(/^---\n([\s\S]*?)\n---/)
  if (!fmMatch) continue
  let fm = fmMatch[1]
  const rel = `/standards/${slug}.pdf`
  // Remove any prior injected keys (idempotent), then set them fresh.
  fm = fm.split("\n").filter((l) => !/^(pdf|scholar_pdf|scholar_pdf_url):/.test(l)).join("\n")
  fm += `\npdf: "${rel}"\nscholar_pdf: true\nscholar_pdf_url: "${BASE}${rel}"`
  const next = `---\n${fm}\n---` + src.slice(fmMatch[0].length)
  if (next !== src) { fs.writeFileSync(p, next); wired++ }
}
console.log(`wire-standard-pdf-links: wired Download-PDF button + citation meta on ${wired} standard page(s)`)
