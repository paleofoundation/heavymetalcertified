#!/usr/bin/env node
// Compose, render, and audit one finished-category Program Manual.
// Usage: node tools/run-category-program-manual.mjs --cat=27

import fs from "node:fs"
import path from "node:path"
import { spawnSync, execFileSync } from "node:child_process"
import { writeLetterboxOg } from "./lib/document-cover.mjs"
import {
  loadCategory,
  buildManualConfig,
  partFiles,
  versionHistory,
  manifestRow,
} from "./lib/category-program-manual.mjs"

const REPO = process.cwd()
const arg = process.argv.slice(2).find((a) => a.startsWith("--cat="))
const category = arg ? Number(arg.split("=")[1]) : NaN
const facts = loadCategory(category)
if (!facts.ok) {
  console.error(`DROP cat ${category}: ${facts.reason}`)
  process.exit(2)
}

const manualPath = path.join(REPO, "data/standards", `cat${facts.category}-manual.json`)
fs.writeFileSync(manualPath, JSON.stringify(buildManualConfig(facts), null, 2) + "\n")

const partDir = path.join(REPO, "data/manuals", `cat${facts.category}-manual`)
fs.mkdirSync(partDir, { recursive: true })
for (const [file, text] of Object.entries(partFiles(facts))) {
  fs.writeFileSync(path.join(partDir, file), text.endsWith("\n") ? text : `${text}\n`)
}
fs.writeFileSync(
  path.join(REPO, "data/standards/version-history", `${facts.slug}.json`),
  JSON.stringify(versionHistory(facts), null, 2) + "\n",
)

const pagesPath = path.join(REPO, "data/standards", `cat${facts.category}-pages.json`)
let raw = fs.readFileSync(pagesPath, "utf8")
if (raw.includes('"manual_slug"')) {
  raw = raw.replace(/"manual_slug":\s*"[^"]*"/, `"manual_slug": "${facts.slug}"`)
  raw = raw.replace(/"download_pdf":\s*"[^"]*"/, `"download_pdf": "${facts.pdf}"`)
} else {
  raw = raw.replace(
    /("compiled_dir":\s*"[^"]+")/,
    `$1,\n    "manual_slug": "${facts.slug}",\n    "download_pdf": "${facts.pdf}"`,
  )
}
fs.writeFileSync(pagesPath, raw)

const manPath = path.join(REPO, "data/manuals/manifest.json")
const man = JSON.parse(fs.readFileSync(manPath, "utf8"))
const row = manifestRow(facts, null)
const idx = man.manuals.findIndex((m) => m.slug === facts.slug)
if (idx === -1) man.manuals.push(row)
else man.manuals[idx] = row
fs.writeFileSync(manPath, JSON.stringify(man, null, 2) + "\n")

function run(script) {
  const r = spawnSync(process.execPath, [script, `--cat=${facts.category}`], { cwd: REPO, encoding: "utf8" })
  if (r.stdout) process.stdout.write(r.stdout)
  if (r.stderr) process.stderr.write(r.stderr)
  if (r.status !== 0) process.exit(r.status || 1)
}

run("tools/build-category-program-manual-pdf.mjs")

const info = spawnSync("pdfinfo", [path.join(REPO, "content/static/manuals", facts.pdf)], { encoding: "utf8" })
const pages = Number((info.stdout.match(/Pages:\s+(\d+)/) || [])[1])
if (!pages) {
  console.error("pdfinfo did not report a page count")
  process.exit(1)
}
const man2 = JSON.parse(fs.readFileSync(manPath, "utf8"))
const row2 = man2.manuals.find((m) => m.slug === facts.slug)
row2.pages = pages
fs.writeFileSync(manPath, JSON.stringify(man2, null, 2) + "\n")

const stem = path.join(REPO, "content/static/manuals/covers", `${facts.slug}-v1`)
fs.mkdirSync(path.dirname(stem), { recursive: true })
execFileSync("pdftoppm", ["-png", "-f", "1", "-l", "1", "-r", "120", "-singlefile", path.join(REPO, "content/static/manuals", facts.pdf), stem], { stdio: "inherit" })
await writeLetterboxOg(`${stem}.png`, `${stem}-og.png`)

const landing = spawnSync(process.execPath, ["tools/build-category-manual.mjs", `--pages=data/standards/cat${facts.category}-manual.json`], { cwd: REPO, encoding: "utf8" })
if (landing.stdout) process.stdout.write(landing.stdout)
if (landing.stderr) process.stderr.write(landing.stderr)
if (landing.status !== 0) process.exit(landing.status || 1)

const index = spawnSync(process.execPath, ["tools/build-manuals-page.mjs"], { cwd: REPO, encoding: "utf8" })
if (index.stdout) process.stdout.write(index.stdout)
if (index.stderr) process.stderr.write(index.stderr)
if (index.status !== 0) process.exit(index.status || 1)

run("tools/audit-category-manual-consistency.mjs")
run("tools/audit-category-manual-pdf.mjs")

console.log(`OK cat ${facts.category} ${facts.slug} pages=${pages} pdf=${facts.pdf}`)
