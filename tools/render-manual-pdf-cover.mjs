#!/usr/bin/env node
// Render page 1 of each served Program Manual PDF to a static cover preview,
// plus a 1200×630 letterboxed OG derivative for unfurlers.
//
//   <stem>.png     — tall first page. Hero left-column cover only.
//   <stem>-og.png  — 1200×630 letterbox on #fffdfb. og:image / twitter:image
//                    and DataCite relatedIdentifiers Image URL.
//
// Not a PDF viewer mock. Standards pages never consume these as on-page chrome.

import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { MANUAL_COVER_JOBS, writeLetterboxOg } from "./lib/document-cover.mjs"

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const PDF_DIR = path.join(REPO, "content/static/manuals")
const OUT_DIR = path.join(PDF_DIR, "covers")
const JOBS = MANUAL_COVER_JOBS

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

async function writeOgFromTall(tallPng, destOg) {
  await writeLetterboxOg(tallPng, destOg)
  console.log(`render-manual-pdf-cover: ${path.relative(REPO, destOg)} (1200x630 letterbox, ${Math.round(fs.statSync(destOg).size / 1024)} KB)`)
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true })
  const pdftoppm = havePdftoppm()
  if (!pdftoppm) {
    const missingTall = JOBS.filter((j) => !fs.existsSync(path.join(OUT_DIR, `${j.stem}.png`)))
    if (missingTall.length) {
      console.error("render-manual-pdf-cover: pdftoppm not found and cover assets missing:")
      for (const j of missingTall) console.error(`  ${j.stem}.png`)
      process.exit(1)
    }
    console.log("render-manual-pdf-cover: pdftoppm missing; committed tall covers present — skip raster")
  }

  let n = 0
  let og = 0
  for (const job of JOBS) {
    const pdfPath = path.join(PDF_DIR, job.pdf)
    const dest = path.join(OUT_DIR, `${job.stem}.png`)
    const destOg = path.join(OUT_DIR, `${job.stem}-og.png`)
    if (pdftoppm) {
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
    if (!fs.existsSync(dest)) {
      console.error(`render-manual-pdf-cover: no tall cover for ${job.slug}`)
      process.exit(1)
    }
    await writeOgFromTall(dest, destOg)
    og++
  }
  console.log(`render-manual-pdf-cover: ${n} tall cover(s), ${og} OG 1200x630`)
}

await main()
