#!/usr/bin/env node
// Render page 1 of each served Program Manual PDF to a static cover preview.
// Used by the manuals left-rail authority register. Not a PDF viewer mock —
// a first-page raster. Standards pages never consume these assets.

import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const PDF_DIR = path.join(REPO, "content/static/manuals")
const OUT_DIR = path.join(PDF_DIR, "covers")

const JOBS = [
  { slug: "infant-and-child-foods", pdf: "HMTc-Infant-and-Child-Foods-Program-Manual-v3.pdf", stem: "infant-and-child-foods-v3" },
  { slug: "pet-foods", pdf: "HMTc-Pet-Foods-Program-Manual-2026.pdf", stem: "pet-foods-2026" },
]

function havePdftoppm() {
  try {
    execFileSync("pdftoppm", ["-v"], { stdio: "ignore" })
    return true
  } catch {
    return false
  }
}

function renderFirstPage(pdfPath, destPng) {
  const stem = destPng.replace(/\.png$/, "")
  execFileSync("pdftoppm", ["-png", "-f", "1", "-l", "1", "-r", "120", "-singlefile", pdfPath, stem], {
    stdio: "inherit",
  })
}

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true })
  if (!havePdftoppm()) {
    const missing = JOBS.filter((j) => !fs.existsSync(path.join(OUT_DIR, `${j.stem}.png`)))
    if (missing.length) {
      console.error("render-manual-pdf-cover: pdftoppm not found and cover assets missing:")
      for (const j of missing) console.error(`  ${j.stem}.png`)
      process.exit(1)
    }
    console.log("render-manual-pdf-cover: pdftoppm missing; committed covers present — skip")
    return
  }

  let n = 0
  for (const job of JOBS) {
    const pdfPath = path.join(PDF_DIR, job.pdf)
    const dest = path.join(OUT_DIR, `${job.stem}.png`)
    if (!fs.existsSync(pdfPath)) {
      console.log(`render-manual-pdf-cover: skip ${job.slug} (no PDF)`)
      continue
    }
    renderFirstPage(pdfPath, dest)
    if (!fs.existsSync(dest)) {
      console.error(`render-manual-pdf-cover: pdftoppm wrote nothing for ${job.pdf}`)
      process.exit(1)
    }
    n++
    console.log(`render-manual-pdf-cover: ${path.relative(REPO, dest)} (${Math.round(fs.statSync(dest).size / 1024)} KB)`)
  }
  console.log(`render-manual-pdf-cover: ${n} cover(s)`)
}

main()
