#!/usr/bin/env node

import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"

const REPO = process.cwd()
const args = new Map(process.argv.slice(2).map((arg) => {
  const [key, value] = arg.replace(/^--/, "").split("=")
  return [key, value ?? true]
}))
const sourceRoot = args.get("source") ? path.resolve(String(args.get("source"))) : null

if (!sourceRoot) {
  console.error("sync-government-standards: --source=<heavy-metal-index checkout> is required")
  process.exit(2)
}

const reportPath = path.join(sourceRoot, "data/workbench/standards/hmtc-category-completion.json")
if (!fs.existsSync(reportPath)) {
  console.error(`sync-government-standards: completion report not found: ${reportPath}`)
  process.exit(2)
}

const report = JSON.parse(fs.readFileSync(reportPath, "utf8"))
const expectedTotals = ["Pb", "Cd", "tAs", "tHg", "Ni", "Sn", "Al", "Cr"]
if (JSON.stringify(report.canonical_panel?.totals) !== JSON.stringify(expectedTotals)) {
  throw new Error("source snapshot does not carry the canonical eight-total panel")
}

const destinationByCategory = new Map([
  [1, "cat1-compiled"],
  [3, "cat3-compiled"],
  [6, "seafood-compiled"],
  [7, "cat7-compiled"],
  [9, "cat9-compiled"],
  [24, "cat24-compiled"],
  [25, "cat25-compiled"],
])
const standardsDir = path.join(REPO, "data/standards")
let copied = 0

for (const category of report.categories) {
  const destinationName = destinationByCategory.get(Number(category.category))
  if (!destinationName) throw new Error(`no certification destination for Category ${category.category}`)
  const destinationDir = path.join(standardsDir, destinationName)
  fs.mkdirSync(destinationDir, { recursive: true })
  const expectedFiles = new Set()

  for (const row of category.rows) {
    const sourceFile = path.join(sourceRoot, category.output_directory, `${row.slug}.json`)
    if (!fs.existsSync(sourceFile)) throw new Error(`compiled record missing: ${sourceFile}`)
    const record = JSON.parse(fs.readFileSync(sourceFile, "utf8"))
    if (record.slug !== row.slug) throw new Error(`record slug mismatch in ${sourceFile}`)
    const destinationFile = path.join(destinationDir, `${row.slug}.json`)
    fs.writeFileSync(destinationFile, `${JSON.stringify(record, null, 2)}\n`)
    expectedFiles.add(`${row.slug}.json`)
    copied += 1
  }

  for (const name of fs.readdirSync(destinationDir)) {
    if (name.endsWith(".json") && !expectedFiles.has(name)) fs.rmSync(path.join(destinationDir, name))
  }
}

let sourceCommit = "unknown"
try {
  sourceCommit = execFileSync("git", ["rev-parse", "HEAD"], { cwd: sourceRoot, encoding: "utf8" }).trim()
} catch {
  // The frozen report still supplies content provenance when the source is not a Git checkout.
}

fs.writeFileSync(path.join(standardsDir, "hmtc-category-completion.json"), `${JSON.stringify(report, null, 2)}\n`)
fs.writeFileSync(path.join(standardsDir, "government-standards-sync.json"), `${JSON.stringify({
  schema_version: 1,
  source_repository: "heavy-metal-index",
  source_commit: sourceCommit,
  source_report: "data/workbench/standards/hmtc-category-completion.json",
  source_generated_on: report.generated_on,
  categories: report.categories.map((category) => ({
    category: category.category,
    rows: category.compiled_rows,
    status: category.status,
  })),
  records_copied: copied,
}, null, 2)}\n`)

console.log(`sync-government-standards: copied ${copied} compiled records from ${sourceCommit.slice(0, 12)}`)
