#!/usr/bin/env node
import fs from "node:fs/promises"
import path from "node:path"
import { auditPages, buildIndex, importBatch, inventory, makeBatch, parseJson, readRecords, writeJson } from "./lib/citation-context.mjs"

const [command = "help", ...args] = process.argv.slice(2)
const options = {}
for (const arg of args) {
  const match = arg.match(/^--([a-z-]+)(?:=(.*))?$/)
  if (!match) throw new Error(`Use --name=value options; unexpected argument: ${arg}`)
  if (!new Set(["out", "page", "limit", "file", "write"]).has(match[1])) throw new Error(`Unknown option: ${arg}`)
  if (options[match[1]] !== undefined) throw new Error(`Duplicate option: ${arg}`)
  options[match[1]] = match[2] ?? true
}
const root = process.cwd()
try {
  if (command === "help" || command === "--help") {
    console.log("Citation context engine\n  audit [--page=slug] [--out=report.json]\n  batch [--limit=5] [--page=slug] [--out=batch.json]\n  import --file=reviewed-batch.json [--write] (dry run by default)\n  build (validates and writes data/source-panels/index.json)")
  } else if (command === "build") {
    const index = await buildIndex(root)
    console.log(`citation-context: built ${Object.keys(index).length} reviewed pages, ${Object.values(index).reduce((n, page) => n + Object.keys(page.refs).length, 0)} reference explanations`)
  } else if (command === "import") {
    if (typeof options.file !== "string") throw new Error("import requires --file=path")
    if (options.write !== undefined && options.write !== true) throw new Error("--write takes no value")
    const result = await importBatch(root, parseJson(await fs.readFile(path.resolve(root, options.file), "utf8")), { write: options.write === true })
    console.log(JSON.stringify(result, null, 2))
  } else if (command === "audit" || command === "batch") {
    const pages = await inventory(root)
    const records = await readRecords(root)
    if (options.page && !pages.some((page) => page.page === options.page)) throw new Error(`Unknown page: ${options.page}`)
    if (command === "audit") {
      const selected = options.page ? pages.filter((page) => page.page === options.page) : pages
      const report = auditPages(selected, options.page ? records.filter((record) => record.page === options.page) : records)
      if (typeof options.out === "string") await writeJson(path.resolve(root, options.out), report)
      console.log(JSON.stringify({ ...report.totals, invalidRecords: report.invalidRecords, scope: report.scope, ...(options.out ? { report: options.out } : {}) }, null, 2))
      if (report.invalidRecords.length) process.exitCode = 1
    } else {
      const batch = makeBatch(pages, records, { limit: options.limit === undefined ? 5 : Number(options.limit), page: options.page })
      const output = typeof options.out === "string" ? options.out : "reports/citation-context/batch.json"
      await writeJson(path.resolve(root, output), batch)
      console.log(`citation-context: queued ${batch.jobs.length} citation research jobs in ${output}; complete records with verified evidence before import`)
    }
  } else throw new Error(`Unknown command: ${command}`)
} catch (error) {
  console.error(`citation-context: ${error.message}`)
  process.exitCode = 1
}
