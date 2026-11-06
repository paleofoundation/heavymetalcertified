#!/usr/bin/env node
// First page of each committed standard PDF, as a WebP thumbnail for the hero.
// Vercel does not rasterize PDFs. These files are committed next to the PDFs.
//
// Usage: node tools/render-standard-thumbs.mjs
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { execFileSync } from "node:child_process"
import sharp from "sharp"

const REPO = process.cwd()
const PDF_DIR = path.join(REPO, "content/static/standards")
const CONTENT = path.join(REPO, "content/standards")
const OUT = path.join(PDF_DIR, "thumbs")
const WIDTH = 480
// poppler rasterizes these react-pdf letter pages onto a tall canvas. Fit the
// pixels back to the 612×792 media box so the hero is a page, not a stretched strip.
const HEIGHT = Math.round(WIDTH * 792 / 612)

fs.mkdirSync(OUT, { recursive: true })
const pdfs = fs.readdirSync(PDF_DIR).filter((f) => /^[a-z0-9][a-z0-9-]*\.pdf$/.test(f) && fs.existsSync(path.join(CONTENT, f.replace(/\.pdf$/, ".md")))).sort()
const manifest = {}
let n = 0
for (const f of pdfs) {
  const slug = f.replace(/\.pdf$/, "")
  const tmpBase = path.join(os.tmpdir(), `hmtc-thumb-${slug}`)
  execFileSync("pdftoppm", ["-f", "1", "-l", "1", "-png", "-scale-to-x", String(WIDTH), "-singlefile", path.join(PDF_DIR, f), tmpBase], { stdio: "ignore" })
  const png = `${tmpBase}.png`
  await sharp(png).resize(WIDTH, HEIGHT, { fit: "fill" }).webp({ quality: 80 }).toFile(path.join(OUT, `${slug}.webp`))
  fs.rmSync(png, { force: true })
  manifest[slug] = { width: WIDTH, height: HEIGHT }
  n++
  if (n % 40 === 0) console.log(`thumbs: ${n}/${pdfs.length}`)
}
fs.writeFileSync(path.join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n")
console.log(`thumbs: wrote ${n} webp files`)
