#!/usr/bin/env node

// Enforces the public brand-system boundaries across every source page. This is
// intentionally narrow: it blocks specific retired promises and labels without
// treating ordinary scientific uses of words such as "clean" as a brand claim.

import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const contentRoot = path.join(root, "content")
const readinessPath = path.join(root, "data/category-readiness.json")

const requiredPages = [
  "index.md",
  "for-brands.md",
  "readiness.md",
  "what-if-we-dont-pass.md",
  "cost-and-timing.md",
  "trust.md",
  "brand-bill-of-rights.md",
  "what-happens-to-your-data.md",
  "standard-stability.md",
  "category-readiness.md",
  "mark.md",
  "verify.md",
  "brands.md",
  "portal.md",
  "program/structure.md",
  "program/two-pathways.md",
  "program/remediation.md",
]

const rules = [
  {
    id: "retired-pathway-label",
    re: /\b(?:clean|dirty)[ -]subcategory\b|\bP97-clean\b|\bP45-dirty\b|\bk:\s*["']Pathway["'][^\n]{0,32}\bv:\s*["'](?:Clean|Dirty)["']|\bPathway\s*[·:]\s*(?:Clean|Dirty)\b/i,
    why: "Use Lower-Burden Category Pathway or Category Improvement Pathway on public surfaces.",
  },
  {
    id: "brand-wide-certification",
    re: /\bCertified brands\b|\bBecome a certified brand\b|\bcertified-brand directory\b/i,
    why: "Certification is product- and form-specific, never brand-wide.",
  },
  {
    id: "certificate-preservation-promise",
    re: /\bkeeps? (?:its|the) certificate\b|\bcertificate is unaffected\b|\bcertificate impact[^.\n]{0,48}\bnone while\b/i,
    why: "Do not promise that remediation or voluntary disclosure preserves a certificate.",
  },
  {
    id: "unratified-public-promise",
    re: /\bfinal Stability Covenant should\b|\bfinal data-governance policy should\b|\bunratified artwork\b/i,
    why: "State the current honest rule or the exact remaining operational dependency.",
  },
  {
    id: "commercial-opening-overclaim",
    re: /\b(?:category|categories|standards?) (?:is|are) open for applications?\b/i,
    why: "A published technical standard is not proof that commercial certification has opened.",
  },
]

const files = []
const failures = []

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full)
    else if (entry.name.endsWith(".md")) files.push(full)
  }
}

for (const rel of requiredPages) {
  if (!fs.existsSync(path.join(contentRoot, rel))) failures.push(`missing required public page: content/${rel}`)
}

walk(contentRoot)
for (const file of files) {
  const rel = path.relative(root, file)
  const lines = fs.readFileSync(file, "utf8").split("\n")
  if (!lines.some((line) => /^title:\s*\S/.test(line))) failures.push(`${rel}: missing title in frontmatter`)
  for (const [index, line] of lines.entries()) {
    for (const rule of rules) {
      if (rule.re.test(line)) failures.push(`${rel}:${index + 1} [${rule.id}] ${rule.why}`)
    }
  }
}

const readiness = JSON.parse(fs.readFileSync(readinessPath, "utf8"))
const validStates = new Set(Object.keys(readiness.states || {}))
if (!Array.isArray(readiness.categories) || readiness.categories.length === 0) {
  failures.push("data/category-readiness.json: categories must be a non-empty array")
} else {
  const names = new Set()
  for (const category of readiness.categories) {
    if (!category.name || names.has(category.name)) failures.push(`data/category-readiness.json: missing or duplicate category name: ${category.name || "(blank)"}`)
    names.add(category.name)
    if (!validStates.has(category.state)) failures.push(`data/category-readiness.json: ${category.name} has unknown state ${category.state}`)
    if (category.state === "open" && category.release_gates_complete !== true) {
      failures.push(`data/category-readiness.json: ${category.name} cannot be open without release_gates_complete: true`)
    }
    if (!category.note) failures.push(`data/category-readiness.json: ${category.name} is missing an explanatory note`)
  }
}

const mark = fs.readFileSync(path.join(contentRoot, "mark.md"), "utf8")
for (const token of ["product-specific", "Clear space", "Minimum print width", "QR", "Suspension", "Revocation"]) {
  if (!mark.toLowerCase().includes(token.toLowerCase())) failures.push(`content/mark.md: required mark-control topic missing: ${token}`)
}

const portal = fs.readFileSync(path.join(contentRoot, "portal.md"), "utf8")
if (!/^noindex:\s*true$/m.test(portal) || !/nonfunctional/i.test(portal)) {
  failures.push("content/portal.md: control-room specimen must remain noindex and explicitly nonfunctional")
}

const readinessPage = fs.readFileSync(path.join(contentRoot, "readiness.md"), "utf8")
if (!/stores? and transmits? no answers|not transmitted/i.test(readinessPage)) {
  failures.push("content/readiness.md: on-device no-transmission boundary is missing")
}
if (/\{#[a-z0-9-]+\}/i.test(readinessPage)) {
  failures.push("content/readiness.md: unsupported explicit heading-anchor syntax would become visible copy")
}

if (failures.length) {
  console.error(`brand-direction-lint: ${failures.length} failure(s)`)
  for (const failure of failures) console.error(`  ✗ ${failure}`)
  process.exit(1)
}

console.log(`brand-direction-lint: OK — ${files.length} public source pages audited; ${readiness.categories.length} category states validated.`)
