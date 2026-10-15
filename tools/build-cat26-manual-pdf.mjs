#!/usr/bin/env node
// build-cat26-manual-pdf.mjs — Category 26 Program Manual v1, house react-pdf.
//
//   Cover · Contents
//   Part 1  Why                         data/manuals/cat26-manual/part1-why.md
//   Part 2  Program                     data/manuals/cat26-manual/part2-program.md
//   Part 3  Standards register          tools/lib/cat26-manual.mjs
//   Part 4  Lot testing                 data/manuals/cat26-manual/part4-lot-testing.md
//   Part 5  Method + glossary           data/manuals/cat26-manual/part5-backmatter.md
//   Edition record
//
// A Chromium / Skia print is a hard fail. This file is the only producer.
// Analyte ceilings printed in the method box are read from the compiled records.
//
// Usage: node tools/build-cat26-manual-pdf.mjs

import fs from "node:fs"
import path from "node:path"
import React from "react"
import { Document, Page, View, Text, StyleSheet, renderToFile } from "@react-pdf/renderer"
import { registerFonts } from "./pdf/fonts.mjs"
import {
  buildRegister,
  limitGroups,
  apaCite,
  COPYRIGHT,
  readExistingHouseDoi,
  CITATION_TITLE,
  EDITION,
  EDITION_DATE,
  PDF_FILE,
} from "./lib/cat26-manual.mjs"
import { houseFooterCite } from "./lib/house-cite.mjs"

registerFonts()
const h = React.createElement
const REPO = process.cwd()
const OUT_DIR = path.join(REPO, "content/static/manuals")
const OUT = path.join(OUT_DIR, PDF_FILE)
const CONTENT_DIR = path.join(REPO, "data/manuals/cat26-manual")
const VH = JSON.parse(fs.readFileSync(path.join(REPO, "data/standards/version-history/peptides-sarms-and-research-chemicals.json"), "utf8"))
const HOUSE_DOI = readExistingHouseDoi()
const LIMITS = limitGroups()
const REGISTER = buildRegister()

const INK_TITLE = "#1e1418"
const INK_BODY = "#241c20"
const INK_SUB = "#2b1f24"
const BURGUNDY = "#9f2727"
const MUTE = "#4a4246"
const FAINT = "#8a8288"
const ABSTRACT_BG = "#fdf4f3"
const ZEBRA = "#fbf7f5"

const current = VH.versions.find((v) => v.status === "current") || VH.versions[0]

const s = StyleSheet.create({
  pagePortrait: { paddingTop: 54, paddingBottom: 50, paddingHorizontal: 60, fontFamily: "Inter", fontSize: 9.5, color: INK_BODY, lineHeight: 1.5 },
  masthead: { fontFamily: "IBMPlexMono", fontSize: 8, color: BURGUNDY, letterSpacing: 1.2, textTransform: "uppercase" },
  ruleBurgundy: { borderTopWidth: 1.5, borderTopColor: BURGUNDY, marginTop: 8, marginBottom: 20 },
  coverTitle: { fontFamily: "Lora", fontSize: 28, color: INK_TITLE, lineHeight: 1.15, marginBottom: 12 },
  coverSub: { fontFamily: "Lora", fontSize: 13, color: INK_SUB, marginBottom: 16 },
  coverMethod: { fontFamily: "IBMPlexMono", fontSize: 8.5, color: BURGUNDY, marginBottom: 18 },
  label: { fontFamily: "IBMPlexMono", fontSize: 7, color: BURGUNDY, letterSpacing: 0.9, textTransform: "uppercase", marginBottom: 4 },
  coverBlock: { marginBottom: 12 },
  coverText: { fontFamily: "Inter", fontSize: 9, color: MUTE, lineHeight: 1.55 },
  abstractBox: { backgroundColor: ABSTRACT_BG, paddingVertical: 14, paddingHorizontal: 16, marginTop: 4, marginBottom: 8 },
  abstractLabel: { fontFamily: "Lora", fontSize: 13, color: BURGUNDY, marginBottom: 6 },
  abstractBody: { fontFamily: "Inter", fontSize: 9.4, color: INK_BODY, lineHeight: 1.5 },
  partNum: { fontFamily: "IBMPlexMono", fontSize: 8, color: BURGUNDY, letterSpacing: 1.4, textTransform: "uppercase", marginBottom: 6 },
  partTitle: { fontFamily: "Lora", fontSize: 22, color: INK_TITLE, lineHeight: 1.15, marginBottom: 4 },
  partRule: { borderTopWidth: 1.2, borderTopColor: BURGUNDY, marginTop: 8, marginBottom: 14 },
  h2: { fontFamily: "Lora", fontSize: 13, color: INK_TITLE, marginTop: 12, marginBottom: 6 },
  h3: { fontFamily: "Inter", fontSize: 9.5, fontWeight: 500, color: BURGUNDY, marginTop: 8, marginBottom: 4 },
  para: { fontFamily: "Inter", fontSize: 9.5, color: INK_BODY, lineHeight: 1.5, marginBottom: 7 },
  bold: { fontWeight: 500 },
  listRow: { flexDirection: "row", marginBottom: 3 },
  bullet: { fontFamily: "Inter", fontSize: 9.5, color: BURGUNDY, width: 16 },
  listText: { fontFamily: "Inter", fontSize: 9.5, color: INK_BODY, lineHeight: 1.45, flex: 1 },
  tocPart: { fontFamily: "Lora", fontSize: 12, color: INK_TITLE, marginTop: 8, marginBottom: 2 },
  tocSec: { fontFamily: "Inter", fontSize: 9, color: MUTE, marginBottom: 2, marginLeft: 12 },
  caption: { fontFamily: "Inter", fontSize: 8, color: FAINT, lineHeight: 1.4, marginBottom: 6 },
  table: { borderTopWidth: 1.3, borderTopColor: BURGUNDY, borderBottomWidth: 1.3, borderBottomColor: BURGUNDY, marginTop: 4, marginBottom: 8 },
  thRow: { flexDirection: "row", backgroundColor: BURGUNDY },
  tdRow: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: "#f2ece7" },
  tdRowZebra: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: "#f2ece7", backgroundColor: ZEBRA },
  th: { fontFamily: "IBMPlexMono", fontSize: 7, color: "#fff" },
  tdText: { fontFamily: "Inter", fontSize: 8, color: INK_SUB, lineHeight: 1.3 },
  tdMono: { fontFamily: "IBMPlexMono", fontSize: 7.5, color: "#2b1f1f", lineHeight: 1.3 },
  tdMonoMute: { fontFamily: "IBMPlexMono", fontSize: 7.5, color: MUTE, lineHeight: 1.3 },
  footerP: { position: "absolute", bottom: 22, left: 60, right: 60, fontFamily: "IBMPlexMono", fontSize: 6.5, color: FAINT, textAlign: "center" },
})

const pct = (weights) => {
  const total = weights.reduce((a, b) => a + b, 0)
  return weights.map((w) => `${(w / total) * 100}%`)
}
const alignFor = (a) => (a === "right" ? "flex-end" : a === "center" ? "center" : "flex-start")
function Cell(content, width, align, textStyle, key) {
  return h(View, { key, style: { width, paddingVertical: 3, paddingHorizontal: 5, flexDirection: "row", justifyContent: alignFor(align) } },
    h(Text, { style: [textStyle, { textAlign: align || "left" }], hyphenationCallback: (w) => [w] }, content))
}
function Row(cells, widths, rowStyle, key) {
  return h(View, { key, style: rowStyle, wrap: false }, cells.map((c, i) => Cell(c.t, widths[i], c.a, c.s, i)))
}

function runs(str) {
  const out = []
  const re = /\*\*([^*]+)\*\*/g
  let last = 0
  let m
  while ((m = re.exec(str))) {
    if (m.index > last) out.push({ t: str.slice(last, m.index) })
    out.push({ t: m[1], b: true })
    last = re.lastIndex
  }
  if (last < str.length) out.push({ t: str.slice(last) })
  return out.length ? out : [{ t: str }]
}
function Inline(str, style, key) {
  return h(Text, { key, style }, runs(str).map((r, i) => h(Text, { key: i, style: r.b ? s.bold : undefined }, r.t)))
}

function parseContent(md) {
  const lines = md.replace(/\r/g, "").split("\n")
  const blocks = []
  let i = 0
  const isTable = (l) => /^\|.*\|\s*$/.test(l)
  const isSep = (l) => /^\|[\s:|-]+\|?\s*$/.test(l)
  while (i < lines.length) {
    const line = lines[i]
    const t = line.trim()
    if (!t) { i++; continue }
    let m
    if ((m = t.match(/^#\s+(.+)/))) { blocks.push({ type: "h1", text: m[1] }); i++; continue }
    if ((m = t.match(/^##\s+(.+)/))) { blocks.push({ type: "h2", text: m[1] }); i++; continue }
    if ((m = t.match(/^###\s+(.+)/))) { blocks.push({ type: "h3", text: m[1] }); i++; continue }
    if (isTable(t)) {
      const rows = []
      while (i < lines.length && isTable(lines[i].trim())) { rows.push(lines[i].trim()); i++ }
      const cells = (r) => r.replace(/^\||\|$/g, "").split("|").map((c) => c.trim())
      const body = rows.filter((r) => !isSep(r))
      if (body.length) blocks.push({ type: "table", header: cells(body[0]), rows: body.slice(1).map(cells) })
      continue
    }
    if (/^[-*]\s+/.test(t)) {
      const items = []
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) { items.push(lines[i].trim().replace(/^[-*]\s+/, "")); i++ }
      blocks.push({ type: "ul", items })
      continue
    }
    if (/^\d+\.\s+/.test(t)) {
      const items = []
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) { items.push(lines[i].trim().replace(/^\d+\.\s+/, "")); i++ }
      blocks.push({ type: "ol", items })
      continue
    }
    blocks.push({ type: "para", text: t })
    i++
  }
  return blocks
}

function tableWeights(header) {
  return header.map((hh, i) => {
    if (i === 0) return 1.4
    if (/condition|meaning|what|read|standards|input/i.test(hh)) return 2.2
    return 1.1
  })
}

function ContentTable(b, key) {
  const widths = pct(tableWeights(b.header))
  const header = b.header.map((c) => ({ t: c, a: "left", s: s.th }))
  const bodyRows = b.rows.map((r, ri) => {
    const cells = b.header.map((_, ci) => {
      const val = r[ci] ?? ""
      const mono = /^[\d.,%≤>=</+\s-]*$/.test(val) && /\d/.test(val)
      return { t: val, a: "left", s: mono ? s.tdMono : s.tdText }
    })
    return Row(cells, widths, ri % 2 ? s.tdRowZebra : s.tdRow, `r${ri}`)
  })
  return h(View, { key, style: s.table }, [Row(header, widths, s.thRow, "h"), ...bodyRows])
}

function Block(b, key) {
  if (b.type === "h2") return h(Text, { key, style: s.h2 }, b.text)
  if (b.type === "h3") return h(Text, { key, style: s.h3 }, b.text)
  if (b.type === "para") return Inline(b.text, s.para, key)
  if (b.type === "ul" || b.type === "ol") {
    return h(View, { key, style: { marginBottom: 6 } }, b.items.map((it, i) =>
      h(View, { key: i, style: s.listRow, wrap: false }, [
        h(Text, { key: "b", style: s.bullet }, b.type === "ol" ? `${i + 1}.` : "•"),
        Inline(it, s.listText, "t"),
      ])))
  }
  if (b.type === "table") return ContentTable(b, key)
  return null
}

function AuthoredPart(file, partLabel) {
  const blocks = parseContent(fs.readFileSync(path.join(CONTENT_DIR, file), "utf8"))
  const h1 = blocks.find((b) => b.type === "h1")
  const title = h1 ? h1.text.replace(/^Part\s+\d+\s*:\s*/i, "") : partLabel
  const body = blocks.filter((b) => b !== h1)
  const head = h(View, { key: "hd", wrap: false }, [
    h(Text, { key: "n", style: s.partNum }, partLabel),
    h(Text, { key: "t", style: s.partTitle }, title),
    h(View, { key: "r", style: s.partRule }),
  ])
  return { head, body: body.map((b, i) => Block(b, i)), sections: body.filter((b) => b.type === "h2").map((b) => b.text), title }
}

function PartThree() {
  const ready = REGISTER.rows.filter((r) => r.cert_ready).length
  return [
    h(View, { key: "hd", wrap: false }, [
      h(Text, { key: "n", style: s.partNum }, "Part 3"),
      h(Text, { key: "t", style: s.partTitle }, "Category 26 Standards Register"),
      h(View, { key: "r", style: s.partRule }),
      h(Text, { key: "lede", style: s.para },
        `Five live standards. Cert-ready means the page carries a house DOI under prefix 10.83138. ${ready} of ${REGISTER.rows.length} are cert-ready. Ceilings are not reprinted here. Aluminium on the parenteral group is ${LIMITS.parenteralAl}. Aluminium on the oral group is ${LIMITS.oralAl}. Both figures are read from the compiled records.`),
    ]),
    ...REGISTER.rows.map((r, i) => h(View, {
      key: r.slug,
      wrap: false,
      style: { borderBottomWidth: 0.4, borderBottomColor: "#f2ece7", paddingVertical: 6, backgroundColor: i % 2 ? ZEBRA : undefined },
    }, [
      h(Text, { key: "n", style: s.tdText }, r.name),
      h(Text, { key: "s", style: s.tdMonoMute }, `${r.href} · ${r.slug} · ${r.route_group}`),
      h(Text, { key: "d", style: s.tdMono }, r.cert_doi ? r.cert_doi : `HOLD · ${r.hold_reason || "not cert-ready"}`),
    ])),
  ]
}

function Cover() {
  const cite = apaCite(HOUSE_DOI)
  return [
    h(Text, { key: "m", style: s.masthead }, "Heavy Metal Tested & Certified  ·  Program Manual"),
    h(View, { key: "r", style: s.ruleBurgundy }),
    h(Text, { key: "t", style: s.coverTitle }, "Peptides, SARMs, and Research Chemicals"),
    h(Text, { key: "sub", style: s.coverSub }, "Category 26  ·  Manual v1"),
    h(Text, { key: "meth", style: s.coverMethod }, "Method v2.1: ICH Q3D read-across. Metal safety only."),
    h(View, { key: "auth", style: s.coverBlock }, [
      h(Text, { key: "l", style: s.label }, "Author and publisher"),
      h(Text, { key: "t", style: s.coverText }, "Karen Pendergrass, ORCID 0000-0002-2348-7259. Institute of Contaminant Standards. Heavy Metal Tested & Certified."),
    ]),
    h(View, { key: "ed", style: s.coverBlock }, [
      h(Text, { key: "l", style: s.label }, "Edition"),
      h(Text, { key: "t", style: s.coverText }, `${current.label} · ${EDITION_DATE}`),
    ]),
    h(View, { key: "ab", style: s.abstractBox }, [
      h(Text, { key: "l", style: s.abstractLabel }, "About this manual"),
      h(Text, { key: "b", style: s.abstractBody },
        `The Category 26 program manual. Seven metals (Pb, Cd, tAs, tHg, Ni, Sn, Cr) are read across from the ICH Q3D elemental-impurity limits. Aluminium uses the FDA injectable limit (${LIMITS.parenteralAl}) for the injectable and nasal standards and the EU drinking-water limit (${LIMITS.oralAl}) for raw powders and oral SARMs. Inorganic arsenic, methylmercury, and hexavalent chromium are capped at their parent totals and tested on the program retest schedule. Scope: metal safety only, not efficacy, legality, or approval status. The manual DOI is not deposited in this edition.`),
    ]),
    h(Text, { key: "cite", style: [s.coverText, { marginTop: 8 }] }, cite),
    h(Text, { key: "cpr", style: [s.coverText, { marginTop: 4 }] }, COPYRIGHT),
  ]
}

function Contents(partSections) {
  const children = [h(Text, { key: "hd", style: s.partTitle }, "Contents"), h(View, { key: "r", style: s.partRule })]
  for (const p of partSections) {
    children.push(h(Text, { key: `${p.label}-p`, style: s.tocPart }, `${p.label}: ${p.title}`))
    for (const sec of p.sections) children.push(h(Text, { key: `${p.label}-${sec}`, style: s.tocSec }, sec))
  }
  return children
}

function EditionRecord() {
  const widths = pct([1.4, 1.1, 1.1, 1.6, 3.2])
  const header = ["Edition", "Date", "Status", "DOI", "What changed"].map((t) => ({ t, a: "left", s: s.th }))
  const rows = VH.versions.map((v, ri) => Row([
    { t: v.label, a: "left", s: s.tdText },
    { t: v.date, a: "left", s: s.tdMonoMute },
    { t: v.status === "current" ? "current" : v.status || "superseded", a: "left", s: s.tdMonoMute },
    { t: v.doi || v.doi_pending || "empty", a: "left", s: s.tdMonoMute },
    { t: v.summary || "", a: "left", s: s.tdText },
  ], widths, ri % 2 ? s.tdRowZebra : s.tdRow, `r${ri}`))
  return [
    h(View, { key: "hd", wrap: false }, [
      h(Text, { key: "t", style: s.partTitle }, "Edition record"),
      h(View, { key: "r", style: s.partRule }),
    ]),
    h(Text, { key: "cap", style: s.caption }, "Manual v1 is current. The house DOI suffix hmtc.manual.peptides-sarms-and-research-chemicals is reserved for deposit. This edition does not carry a manual DOI."),
    h(View, { key: "t", style: s.table }, [Row(header, widths, s.thRow, "h"), ...rows]),
    h(Text, { key: "cite", style: [s.para, { marginTop: 8 }] }, apaCite(HOUSE_DOI)),
    h(Text, { key: "cpr", style: s.caption }, COPYRIGHT),
  ]
}

function ManualDocument() {
  const footerText = houseFooterCite({
    label: "Heavy Metal Certified  ·  Peptides, SARMs, and Research Chemicals Program Manual",
    edition: EDITION,
    doi: HOUSE_DOI,
    kind: "manual",
  })
  const p1 = AuthoredPart("part1-why.md", "Part 1")
  const p2 = AuthoredPart("part2-program.md", "Part 2")
  const p4 = AuthoredPart("part4-lot-testing.md", "Part 4")
  const p5 = AuthoredPart("part5-backmatter.md", "Part 5")
  const toc = [
    { label: "Part 1", title: p1.title, sections: p1.sections },
    { label: "Part 2", title: p2.title, sections: p2.sections },
    { label: "Part 3", title: "Category 26 Standards Register", sections: ["Five standards and their house DOIs"] },
    { label: "Part 4", title: p4.title, sections: p4.sections },
    { label: "Part 5", title: p5.title, sections: p5.sections },
  ]
  const foot = () => h(Text, { key: "f", style: s.footerP, fixed: true }, footerText)
  return h(Document, {
    title: CITATION_TITLE,
    author: "Karen Pendergrass",
    subject: "Heavy Metal Certified Category 26 Program Manual. Metal safety only.",
    keywords: "Peptides, SARMs, research chemicals, Category 26, Manual v1, ICH Q3D",
    creator: "Institute of Contaminant Standards / Heavy Metal Certified",
    producer: "react-pdf",
    language: "en-US",
  }, [
    h(Page, { key: "doc", size: "LETTER", style: s.pagePortrait }, [
      ...Cover(),
      h(View, { key: "toc", break: true }, Contents(toc)),
      h(View, { key: "p1", break: true }, [p1.head, ...p1.body]),
      h(View, { key: "p2", break: true }, [p2.head, ...p2.body]),
      h(View, { key: "p3", break: true }, PartThree()),
      h(View, { key: "p4", break: true }, [p4.head, ...p4.body]),
      h(View, { key: "p5", break: true }, [p5.head, ...p5.body]),
      h(View, { key: "er", break: true }, EditionRecord()),
      foot(),
    ]),
  ])
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true })
  await renderToFile(h(ManualDocument), OUT)
  const ready = REGISTER.rows.filter((r) => r.cert_ready).length
  console.log(`build-cat26-manual-pdf: wrote ${path.relative(REPO, OUT)} (${EDITION}; ${REGISTER.rows.length} standards, ${ready} cert-ready; Al ${LIMITS.parenteralAl}/${LIMITS.oralAl})`)
}

main().catch((err) => {
  console.error("build-cat26-manual-pdf: FAILED:", err.message)
  console.error(err.stack)
  process.exit(1)
})
