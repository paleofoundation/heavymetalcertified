#!/usr/bin/env node
// Postbuild: render each cert Article (content/articles/<slug>.md) to a clean
// preprint-style PDF at public/articles/<slug>.pdf, and let Head.tsx point
// citation_pdf_url at it for Google Scholar. This is the Heavy Metal Certified
// sibling of the Heavy Metal Index synthesis-PDF generator: SAME layout,
// DIFFERENT entity posting (Heavy Metal Certified / Paleo Certified, Inc.,
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
const SRC = "content/articles"
const OUT = "public/articles"

// Brand tokens — the cert-side rebrand of the Index generator.
const RED = "#9f2727" // HMTc red (quartz.config secondary); the accent that must show
const INK = "#1a1d24" // body ink
const MUTE = "#555555"
const FAINT = "#777777"
const FOOT = "#999999"
const ENTITY = "Heavy Metal Certified"
const OWNER = "Paleo Certified, Inc."

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

function renderOne(file) {
  const slug = file.replace(/\.md$/, "")
  const { fm, body } = parse(readFileSync(join(SRC, file), "utf8"))
  const title = fm.title || slug
  const author = fm.author || "Karen Pendergrass"
  const orcid = fm.orcid || "0000-0002-2348-7259"
  const date = fm.date || fm.briefing_date || fm.updated || ""
  const url = `${BASE}/articles/${slug}`
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
    const stream = createWriteStream(join(OUT, `${slug}.pdf`))
    doc.pipe(stream)
    stream.on("finish", resolve)
    stream.on("error", reject)
    const right = doc.page.width - 72

    // Eyebrow: entity + kind, in the brand red so the rebrand is unmistakable.
    doc
      .font("Helvetica-Bold")
      .fontSize(8)
      .fillColor(RED)
      .text(`${ENTITY.toUpperCase()}  ·  RESEARCH ANALYSIS`, { characterSpacing: 1.2 })
    doc.moveDown(0.35)

    doc.font("Helvetica-Bold").fontSize(17).fillColor(RED).text(title, { lineGap: 2 })
    doc.moveDown(0.4)
    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor(MUTE)
      .text(
        `${author}  ·  ORCID ${orcid}  ·  ${ENTITY}${date ? "  ·  " + date : ""}`,
      )
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
  if (!existsSync(SRC)) {
    console.log("article-pdf: no content/articles dir; skipping")
    return
  }
  mkdirSync(OUT, { recursive: true })
  const files = readdirSync(SRC).filter((f) => f.endsWith(".md") && f !== "index.md")
  let n = 0
  for (const f of files) {
    try {
      await renderOne(f)
      n++
    } catch (err) {
      console.error(`article-pdf: failed on ${f}:`, err.message)
    }
  }
  console.log(`article-pdf: rendered ${n}/${files.length} cert article PDFs`)
}

main()
