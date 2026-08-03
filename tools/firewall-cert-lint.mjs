#!/usr/bin/env node
// firewall-cert-lint.mjs — the cert-side firewall (the INVERSE of the index lint).
//
// The cert site is ALLOWED to publish thresholds, clean/dirty pathways, and
// percentile methodology — that is its job. The firewall risks on this side are
// different, and build-blocking:
//
//   1. NO CORPUS. The cert site must never re-host the literature index's
//      content (the WikiBiome / paleofoundation cannibalization lesson). No
//      `type: source` pages, no metals/ingredients/sources content trees.
//   2. NO JOURNAL OVERCLAIM. Standards + briefings are Scholar-eligible as
//      TECHNICAL REPORTS only; `citation_journal_title` must never appear (plan
//      6.D / B4 — a certifier's own documents are not peer-reviewed journal
//      articles).
//   3. FIRM-VALUE INTEGRITY. A bold firm "N ppb" limit may render on a standards
//      page only for an analyte cell the catalog marks status:published. The
//      generator enforces this; this lint is the regression guard.
//   4. SELF-CANONICAL OUTBOUND ONLY. Content links to the index are one-way
//      citations; the cert site never imports index pages. (Cross-domain
//      canonical is checked at deploy by the parent-infra crawler, which can see
//      rendered output across origins; this lint catches source-level drift.)
//
// Exit non-zero on any violation (build-blocking in the cert prebuild).

import fs from "node:fs"
import path from "node:path"

const repoRoot = process.cwd()
const CONTENT = path.join(repoRoot, "content")
const CATALOG = path.join(repoRoot, "data/standards/hmtc_standards_catalog.json")

const errors = []

// ---- 1. No corpus -----------------------------------------------------------
const FORBIDDEN_DIRS = ["metals", "ingredients", "sources", "dossiers"]
for (const d of FORBIDDEN_DIRS) {
  if (fs.existsSync(path.join(CONTENT, d))) {
    errors.push(`CORPUS_LEAK: content/${d}/ exists — the cert site must not re-host the index corpus.`)
  }
}

const allMd = []
walk(CONTENT, (f) => {
  if (f.endsWith(".md")) allMd.push(f)
})

for (const f of allMd) {
  const text = fs.readFileSync(f, "utf8")
  const rel = path.relative(repoRoot, f)
  // type: source anywhere = corpus leak
  if (/^type:\s*source\b/m.test(text)) {
    errors.push(`CORPUS_LEAK: ${rel} declares type: source.`)
  }
  // 2. journal overclaim
  if (/citation_journal_title/.test(text)) {
    errors.push(`JOURNAL_OVERCLAIM: ${rel} contains citation_journal_title (cert docs are technical reports, not journal articles).`)
  }
  // 4. cross-domain canonical hardcoded in frontmatter
  const canon = text.match(/^canonical:\s*(\S+)/m)
  if (canon && !canon[1].includes("heavymetalcertified.com") && /^https?:/.test(canon[1])) {
    errors.push(`CROSS_DOMAIN_CANONICAL: ${rel} sets canonical to ${canon[1]} (must be self-canonical to heavymetalcertified.com).`)
  }
}

// ---- 3. Firm-value integrity ------------------------------------------------
if (fs.existsSync(CATALOG)) {
  const catalog = JSON.parse(fs.readFileSync(CATALOG, "utf8"))
  const publishedCells = catalog.rows.flatMap((r) =>
    Object.entries(r.analytes || {})
      .filter(([, a]) => a.status === "published")
      .map(([k]) => `${r.product_slug}:${k}`),
  )
  // Count bold-firm ppb renders across standards pages.
  let renderedFirm = 0
  const stdDir = path.join(CONTENT, "standards")
  if (fs.existsSync(stdDir)) {
    for (const f of fs.readdirSync(stdDir).filter((x) => x.endsWith(".md") && x !== "index.md")) {
      const text = fs.readFileSync(path.join(stdDir, f), "utf8")
      // Legacy markdown-bold render (**N ppb**) and the current HTML render
      // (a firm value carries an explicit data-firm-ppb marker) both count.
      const md = text.match(/\*\*\d[\d.,]*\s*ppb\*\*/g)
      if (md) renderedFirm += md.length
      const html = text.match(/data-firm-ppb/g)
      if (html) renderedFirm += html.length
    }
  }
  if (renderedFirm !== publishedCells.length) {
    errors.push(
      `FIRM_VALUE_MISMATCH: ${renderedFirm} bold firm ppb value(s) rendered but the catalog has ${publishedCells.length} published cell(s) (${publishedCells.join(", ")}). A firm value on a non-published cell is a firewall/integrity defect.`,
    )
  } else {
    console.log(`  firm-value integrity OK: ${renderedFirm} firm value(s) == ${publishedCells.length} published cell(s)`)
  }
} else {
  errors.push(`MISSING_CATALOG: ${path.relative(repoRoot, CATALOG)} not found.`)
}

// ---- report -----------------------------------------------------------------
if (errors.length) {
  console.error(`firewall-cert-lint: ${errors.length} violation(s):`)
  for (const e of errors) console.error(`  ✗ ${e}`)
  process.exit(1)
}
console.log(`firewall-cert-lint: OK (${allMd.length} content pages scanned, no corpus leak, no journal overclaim, firm values match the catalog).`)
process.exit(0)

function walk(dir, cb) {
  if (!fs.existsSync(dir)) return
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) walk(full, cb)
    else cb(full)
  }
}
