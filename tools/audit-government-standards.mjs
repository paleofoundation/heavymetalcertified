#!/usr/bin/env node

import fs from "node:fs"
import path from "node:path"

const REPO = process.cwd()
const DATA = path.join(REPO, "data/standards")
const OUT = path.join(REPO, "content/standards")
const report = JSON.parse(fs.readFileSync(path.join(DATA, "hmtc-category-completion.json"), "utf8"))
const sync = JSON.parse(fs.readFileSync(path.join(DATA, "government-standards-sync.json"), "utf8"))
const publicSlug = new Map([
  ["fruit-juice", "fruit-juice-not-canned"],
  ["infant-formula-rtf-liquid", "infant-formula-ready-to-feed"],
  ["root-vegetable-purees-single-ingredient", "root-vegetable-purees"],
  ["fruit-purees-general", "fruit-purees"],
])
const labels = [
  "Lead (Pb)", "Cadmium (Cd)", "Total arsenic (tAs)", "Inorganic arsenic (iAs)",
  "Total mercury (tHg)", "Methylmercury (MeHg)", "Nickel (Ni)", "Tin (Sn)",
  "Aluminium (Al)", "Total chromium (Cr)", "Hexavalent chromium (Cr-VI)",
]
const failures = []
let pageCount = 0
let panelRows = 0

for (const category of report.categories) {
  for (const row of category.rows) {
    pageCount += 1
    const slug = publicSlug.get(row.slug) || row.slug
    const file = path.join(OUT, `${slug}.md`)
    if (!fs.existsSync(file)) {
      failures.push(`${slug}: page missing`)
      continue
    }
    const text = fs.readFileSync(file, "utf8")
    const limits = text.match(/<section id="limits">([\s\S]*?)<\/section>/)?.[1] || ""
    if (!limits) failures.push(`${slug}: complete analyte panel section missing`)
    if (!text.includes(`source_snapshot_commit: "${sync.source_commit}"`)) failures.push(`${slug}: source snapshot commit missing or stale`)
    if (!text.includes("Required totals\", v: \"8 / 8 present")) failures.push(`${slug}: eight-total contract missing from snapshot`)
    if (text.includes("| Unresolved |") || text.includes(">Unresolved<")) failures.push(`${slug}: unresolved cell leaked into a resolved page`)
    for (const label of labels) {
      const count = limits.split(`| ${label} |`).length - 1
      if (count !== row.variants) failures.push(`${slug}: ${label} appears ${count} time(s), expected ${row.variants}`)
      panelRows += count
    }
  }
}

const index = fs.readFileSync(path.join(OUT, "index.md"), "utf8")
for (const category of report.categories) {
  for (const row of category.rows) {
    const slug = publicSlug.get(row.slug) || row.slug
    if (!index.includes(`](/standards/${slug})`)) failures.push(`standards index: missing link to ${slug}`)
  }
  for (const slug of category.unresolved_rows) {
    if (!index.includes(`<code>${slug}</code>`)) failures.push(`standards index: unresolved row ${slug} is not disclosed`)
  }
}
for (const category of report.policy_blocked_categories) {
  for (const slug of category.unresolvedRows) {
    if (!index.includes(`<code>${slug}</code>`)) failures.push(`standards index: policy-blocked row ${slug} is not disclosed`)
  }
}

const expectedPanelRows = report.categories.reduce((sum, category) => sum + category.compiled_variants * 11, 0)
if (pageCount !== 62) failures.push(`resolved page count is ${pageCount}, expected 62`)
if (panelRows !== expectedPanelRows) failures.push(`rendered panel rows are ${panelRows}, expected ${expectedPanelRows}`)

if (failures.length) {
  console.error(`audit-government-standards: FAIL — ${failures.length} defect(s)`)
  for (const failure of failures) console.error(`  - ${failure}`)
  process.exit(1)
}

console.log(`audit-government-standards: OK — ${pageCount} pages, ${panelRows} analyte rows, 8 totals + species on every variant`)
