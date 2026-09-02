#!/usr/bin/env node
// Postbuild: render each citable Article and Standards Briefing to a clean
// preprint-style PDF beside its HTML page, and let Head.tsx point
// citation_pdf_url at it for Google Scholar. This is the Heavy Metal Certified
// sibling of the Heavy Metal Index synthesis-PDF generator: SAME layout,
// DIFFERENT entity posting (Heavy Metal Certified / Institute of Contaminant Standards (ICS),
// operated by the Institute of Contaminant Standards) and DIFFERENT on-brand
// accent — the HMTc red (#9f2727, the v3 design accent) shows on the eyebrow,
// title, section headings and the rule, where the Index build is monochrome.
//
// Pure-JS (pdfkit) — no headless browser — so it's deterministic, fast and
// verifiable locally. Mirrors tools/postbuild-synthesis-pdf.mjs on the Index.

import PDFDocument from "pdfkit"
import { readFileSync, readdirSync, createWriteStream, mkdirSync, existsSync } from "node:fs"
import { join } from "node:path"

const BASE = "https://heavymetalcertified.com"
const JOBS = [
  { src: "content/articles", out: "public/articles", path: "articles", label: "RESEARCH ANALYSIS" },
  { src: "content/briefings", out: "public/briefings", path: "briefings", label: "STANDARDS BRIEFING" },
]

// Brand tokens — the cert-side rebrand of the Index generator.
const RED = "#9f2727" // HMTc red (quartz.config secondary); the accent that must show
const INK = "#1a1d24" // body ink
const MUTE = "#555555"
const FAINT = "#777777"
const FOOT = "#999999"
const ENTITY = "Heavy Metal Certified"
const OWNER = "Institute of Contaminant Standards (ICS)"

function parse(md) {
  const m = md.match(/^---\n([\s\S]*?)\n---\n?/)
  const fm = {}
  let body = md
  if (m) {
    body = md.slice(m[0].length)
    for (const line of m[1].split("\n")) {
      const mm = line.match(/^([A-Za-z_]+):\s*(.+)$/)
      if (mm) fm[mm[1]] = mm[2].replace(/^["']|["']$/g, "").trim()
    }
  }
  return { fm, body }
}

function stripInline(s) {
  return s
    .replace(/<sup[^>]*class="cite"[^>]*>\s*<a[^>]*>(\d+)<\/a>\s*<\/sup>/g, "[$1]") // canonical inline citation -> [N]
    .replace(/<[^>]+>/g, "") // strip any remaining inline HTML
    .replace(/\[\[[^\]|#]*#?[^\]|]*\|([^\]]+)\]\]/g, "$1") // [[t|alias]] -> alias
    .replace(/\[\[([^\]|#]+)[^\]]*\]\]/g, (_, p) => p.split("/").pop()) // [[t]] -> basename
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // [text](url) -> text
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/(?<![A-Za-z0-9])[_*]([^_*\n]+)[_*](?![A-Za-z0-9])/g, "$1")
    .replace(/\\([\\`*_{}[\]()#+\-.!])/g, "$1")
}

// The official ORCID iD icon (green disc + white "iD") drawn as vector paths at
// (x,y) sized `size` pt; the caller adds the link annotation over the same box.
// Even-odd fill on the white glyph keeps the "D" counter transparent so the green
// disc shows through. This replaces the spelled-out identifier in the byline.
function drawOrcidIcon(doc, x, y, size) {
  const DISC =
    "M256,128c0,70.7-57.3,128-128,128C57.3,256,0,198.7,0,128C0,57.3,57.3,0,128,0C198.7,0,256,57.3,256,128z"
  const GLYPH =
    "M86.3,186.2H70.9V79.1h15.4v48.4V186.2z " +
    "M108.9,79.1h41.6c39.6,0,57,28.3,57,53.6c0,27.5-21.5,53.6-56.8,53.6h-41.8V79.1z M124.3,172.4h24.5c34.9,0,42.9-26.5,42.9-39.7c0-21.5-13.7-39.7-43.7-39.7h-23.7V172.4z " +
    "M88.7,56.8c0,5.5-4.5,10.1-10.1,10.1c-5.6,0-10.1-4.6-10.1-10.1c0-5.6,4.5-10.1,10.1-10.1C84.2,46.7,88.7,51.3,88.7,56.8z"
  doc.save()
  doc.translate(x, y).scale(size / 256)
  doc.path(DISC).fill("#A6CE39")
  doc.path(GLYPH).fill("#FFFFFF", "even-odd")
  doc.restore()
}

function renderOne(file, job) {
  const slug = file.replace(/\.md$/, "")
  const { fm, body } = parse(readFileSync(join(job.src, file), "utf8"))
  const title = fm.title || slug
  const author = fm.author || "Karen Pendergrass"
  const orcid = fm.orcid || "0000-0002-2348-7259"
  const date = fm.date || fm.briefing_date || fm.updated || ""
  const url = `${BASE}/${job.path}/${slug}`
  const doi = fm.doi && fm.doi.toLowerCase() !== "null" ? fm.doi : null

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "LETTER",
      bufferPages: true,
      margins: { top: 72, bottom: 64, left: 72, right: 72 },
      info: {
        Title: title,
        Author: author,
        Subject: `${ENTITY} — ${OWNER}`,
        Keywords: "heavy metals, food safety, contamination, certification",
      },
    })
    const stream = createWriteStream(join(job.out, `${slug}.pdf`))
    doc.pipe(stream)
    stream.on("finish", resolve)
    stream.on("error", reject)
    const right = doc.page.width - 72

    // Eyebrow: entity + kind, in the brand red so the rebrand is unmistakable.
    doc
      .font("Helvetica-Bold")
      .fontSize(8)
      .fillColor(RED)
      .text(`${ENTITY.toUpperCase()}  ·  ${job.label}`, { characterSpacing: 1.2 })
    doc.moveDown(0.35)

    doc.font("Helvetica-Bold").fontSize(17).fillColor(RED).text(title, { lineGap: 2 })
    doc.moveDown(0.4)
    // Byline: name · [ORCID iD icon, linked] · entity · date. The icon replaces
    // the spelled-out identifier; it is drawn inline and given a link annotation.
    doc.font("Helvetica").fontSize(9).fillColor(MUTE)
    const bylineY = doc.y
    const bylineX = doc.page.margins.left
    const bylinePre = `${author}  ·  `
    const bylinePost = `  ·  ${ENTITY}${date ? "  ·  " + date : ""}`
    doc.text(bylinePre, bylineX, bylineY, { lineBreak: false })
    const iconSize = 9
    const iconX = bylineX + doc.widthOfString(bylinePre)
    const iconY = bylineY + 1
    drawOrcidIcon(doc, iconX, iconY, iconSize)
    doc.link(iconX, iconY, iconSize, iconSize, `https://orcid.org/${orcid}`)
    doc.fillColor(MUTE).text(bylinePost, iconX + iconSize, bylineY, { lineBreak: false })
    doc.x = bylineX
    doc.y = bylineY + doc.currentLineHeight()
    doc.moveDown(0.3)
    doc
      .font("Helvetica-Oblique")
      .fontSize(8)
      .fillColor(FAINT)
      .text(
        `Cite as: ${ENTITY}. "${title}". ${url}${doi ? " (DOI: " + doi + ")" : ""}. CC BY 4.0.`,
      )
    doc.moveDown(0.5)
    // Rule in the brand red (Index uses #cccccc; cert shows the accent).
    doc.strokeColor(RED).lineWidth(1).moveTo(72, doc.y).lineTo(right, doc.y).stroke()
    doc.moveDown(0.6)

    let inRefs = false
    for (const raw of body.split("\n")) {
      const line = raw.replace(/\s+$/, "")
      const t = line.trim()
      if (!t) {
        doc.moveDown(0.35)
        continue
      }
      if (t.startsWith("<!--")) continue
      let m
      // Canonical reference-grid row -> extract [N], title and note into a clean PDF line.
      if (inRefs && t.startsWith("<") && /\[\d+\]/.test(t)) {
        const clean = (s) =>
          (s || "")
            .replace(/<[^>]+>/g, " ")
            .replace(/&amp;/g, "&").replace(/&middot;/g, "·").replace(/&mdash;/g, "—")
            .replace(/&ndash;/g, "–").replace(/&micro;/g, "µ").replace(/&rsquo;/g, "'")
            .replace(/&#8599;/g, "").replace(/\s+/g, " ").trim()
        const num = (t.match(/\[(\d+)\]/) || [])[1] || ""
        const tm = t.match(/font-size:16\.5px[^>]*>([\s\S]*?)<\/(?:a|span)>/)
        const dm = t.match(/<p[^>]*>([\s\S]*?)<\/p>/)
        let refLine = `[${num}]  ${clean(tm && tm[1])}. ${clean(dm && dm[1])}`
          .replace(/\s*·\s*doi\.org\s*$/i, "")
          .replace(/\s+([.,])/g, "$1")
          .trim()
        doc.font("Times-Roman").fontSize(9.5).fillColor(INK).text(refLine, { indent: 16, lineGap: 1 })
        doc.moveDown(0.15)
        continue
      }
      if (t.startsWith("<")) continue // skip other web-only HTML flourishes
      if (/^#\s+/.test(t)) continue // page H1 == title, already shown
      if ((m = t.match(/^##\s+(.+)/))) {
        inRefs = /^references$/i.test(stripInline(m[1]).trim())
        doc.moveDown(0.4)
        doc.font("Helvetica-Bold").fontSize(13).fillColor(RED).text(stripInline(m[1]))
        doc.moveDown(0.2)
        continue
      }
      if ((m = t.match(/^###\s+(.+)/))) {
        doc.moveDown(0.3)
        doc.font("Helvetica-Bold").fontSize(11).fillColor(INK).text(stripInline(m[1]))
        doc.moveDown(0.15)
        continue
      }
      if (t.startsWith("|")) {
        if (/^\|[\s:|-]+\|?$/.test(t)) continue // table separator row
        const cells = t.replace(/^\||\|$/g, "").split("|").map((c) => stripInline(c.trim()))
        doc.font("Helvetica").fontSize(9).fillColor("#333").text(cells.join("    ·    "))
        continue
      }
      if ((m = t.match(/^[-*]\s+(.+)/))) {
        doc
          .font("Times-Roman")
          .fontSize(10.5)
          .fillColor(INK)
          .text("•  " + stripInline(m[1]), { indent: 12, lineGap: 1 })
        continue
      }
      if ((m = t.match(/^>\s?(.*)/))) {
        doc.font("Times-Italic").fontSize(10.5).fillColor("#444").text(stripInline(m[1]), { indent: 12 })
        continue
      }
      doc.font("Times-Roman").fontSize(11).fillColor(INK).text(stripInline(t), { lineGap: 1.5 })
    }

    // Footer on every page — cert entity posting.
    const range = doc.bufferedPageRange()
    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(range.start + i)
      doc
        .font("Helvetica")
        .fontSize(7)
        .fillColor(FOOT)
        .text(
          `${url}  ·  © ${new Date().getFullYear()} ${OWNER}  ·  CC BY 4.0  ·  ${i + 1} / ${range.count}`,
          72,
          doc.page.height - 46,
          { width: right - 72, align: "center" },
        )
    }

    doc.end()
  })
}

async function main() {
  for (const job of JOBS) {
    if (!existsSync(job.src)) {
      console.log(`scholar-pdf: no ${job.src} dir; skipping`)
      continue
    }
    mkdirSync(job.out, { recursive: true })
    const files = readdirSync(job.src).filter((f) => {
      if (!f.endsWith(".md") || f === "index.md") return false
      const { fm } = parse(readFileSync(join(job.src, f), "utf8"))
      // Render for every page that advertises a download (`pdf:` points at
      // <job.path>/<slug>.pdf, which only this step produces) as well as every
      // scholar-tagged page. import-briefings emits `pdf:` for all briefings;
      // rendering only the scholar subset left nine live download links at 404.
      const advertised = typeof fm.pdf === "string" && fm.pdf === `/${job.path}/${f.replace(/\.md$/, "")}.pdf`
      return advertised || /^(true|yes|1)$/i.test(String(fm.scholar_pdf || ""))
    })
    let n = 0
    for (const f of files) {
      try {
        await renderOne(f, job)
        n++
      } catch (err) {
        console.error(`scholar-pdf: failed on ${job.path}/${f}:`, err.message)
      }
    }
    console.log(`scholar-pdf: rendered ${n}/${files.length} ${job.path} PDFs`)
  }
}

main()
