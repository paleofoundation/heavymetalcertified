#!/usr/bin/env node
// build-cat1-manual-pdf.mjs — render the consolidated Infant and Child Foods
// (Category 1) HMTc PROGRAM MANUAL to a real paginated PDF, in the approved HMTc
// scholarly design (Lora headings, IBM Plex Mono for measured values, burgundy
// #9f2727), at content/static/manuals/HMTc-Infant-and-Child-Foods-Program-Manual-2026-v2.pdf.
//
// Manual v3, thin TOC (not the retired V1 Zenodo dump):
//   Cover · Contents
//   Part 1  Governing Principles         data/manuals/cat1-manual/part1-why.md
//   Part 2  Lifecycle + instruments      data/manuals/cat1-manual/part2-program.md
//   Part 3  Cat-1 Standards Register     tools/lib/cat1-manual-v3.mjs  ← live SoT
//   Part 4  Lot Testing Schedule         data/manuals/cat1-manual/part4-lot-testing.md
//   Part 5  Method + glossary            data/manuals/cat1-manual/part5-backmatter.md
//   Edition record
// No per-analyte master-table walls. No CC BY. react-pdf only.
//
// HOW IT CANNOT DRIFT. Part 3 is the live Cat-1 Standards Register from
// tools/lib/cat1-manual-v3.mjs (same module the web page reads). Parts 1/2/4/5
// are authored, reconciled cert-plane content (data/manuals/cat1-manual/*.md)
// checked by tools/audit-cat1-manual-consistency.mjs. FIREWALL: government-limit
// only — no percentile-selection arithmetic anywhere (audited).
//
// LOCAL-ONLY, COMMITTED ARTIFACT. Like build-briefing-pdf.mjs, this needs
// @react-pdf/renderer (present in node_modules, deliberately NOT in package.json so
// the Vercel `npm ci` stays in sync — the deploy just serves the committed PDF). If
// node_modules is cleaned, run `npm i -D @react-pdf/renderer` to regenerate.
//
// Usage:  node tools/build-cat1-manual-pdf.mjs

import fs from "node:fs"
import path from "node:path"
import React from "react"
import { Document, Page, View, Text, StyleSheet, renderToFile } from "@react-pdf/renderer"
import { registerFonts } from "./pdf/fonts.mjs"
import { buildRegister, snapshotFromRegister, apaCite, COPYRIGHT, ZENODO_VERSION_DOI, readExistingHouseDoi } from "./lib/cat1-manual-v3.mjs"
import { houseFooterCite } from "./lib/house-cite.mjs"

registerFonts()
const h = React.createElement
const REPO = process.cwd()

const OUT_DIR = path.join(REPO, "content/static/manuals")
const OUT_FILE = "HMTc-Infant-and-Child-Foods-Program-Manual-v3.pdf"
const OUT = path.join(OUT_DIR, OUT_FILE)
const CONTENT_DIR = path.join(REPO, "data/manuals/cat1-manual")
const VH = JSON.parse(fs.readFileSync(path.join(REPO, "data/standards/version-history/infant-and-child-foods.json"), "utf8"))
const HOUSE_DOI = readExistingHouseDoi()

// ── colours (the approved scholarly palette, HMTc red) ───────────────────────
const INK_TITLE = "#1e1418"
const INK_BODY = "#241c20"
const INK_SUB = "#2b1f24"
const BURGUNDY = "#9f2727"
const MUTE = "#4a4246"
const FAINT = "#8a8288"
const ABSTRACT_BG = "#fdf4f3"
const RULE_MED = "#e8e1db"
const ZEBRA = "#fbf7f5"

const current = VH.versions.find((v) => v.status === "current") || VH.versions[0]
const EDITION_LABEL = current.label
const EDITION_DATE = current.date

const s = StyleSheet.create({
  pagePortrait: { paddingTop: 54, paddingBottom: 50, paddingHorizontal: 60, fontFamily: "Inter", fontSize: 9.5, color: INK_BODY, lineHeight: 1.5 },
  pageLand: { paddingTop: 44, paddingBottom: 44, paddingHorizontal: 46, fontFamily: "Inter", fontSize: 9, color: INK_BODY, lineHeight: 1.45 },

  masthead: { fontFamily: "IBMPlexMono", fontSize: 8, color: BURGUNDY, letterSpacing: 1.2, textTransform: "uppercase" },
  ruleBurgundy: { borderTopWidth: 1.5, borderTopColor: BURGUNDY, marginTop: 8, marginBottom: 20 },

  coverTitle: { fontFamily: "Lora", fontSize: 34, color: INK_TITLE, lineHeight: 1.12, letterSpacing: -0.3, marginBottom: 12 },
  coverSub: { fontFamily: "Lora", fontSize: 15, color: INK_SUB, marginBottom: 22 },
  coverMethod: { fontFamily: "IBMPlexMono", fontSize: 9, color: BURGUNDY, letterSpacing: 0.4, marginBottom: 26 },
  label: { fontFamily: "IBMPlexMono", fontSize: 7, color: BURGUNDY, letterSpacing: 0.9, textTransform: "uppercase", marginBottom: 4 },
  coverBlock: { marginBottom: 14 },
  coverText: { fontFamily: "Inter", fontSize: 9, color: MUTE, lineHeight: 1.55 },

  abstractBox: { backgroundColor: ABSTRACT_BG, paddingVertical: 16, paddingHorizontal: 20, marginTop: 6, marginBottom: 8 },
  abstractLabel: { fontFamily: "Lora", fontSize: 13, color: BURGUNDY, marginBottom: 7 },
  abstractBody: { fontFamily: "Inter", fontSize: 9.6, color: INK_BODY, lineHeight: 1.55 },

  // part + section headings
  partNum: { fontFamily: "IBMPlexMono", fontSize: 8, color: BURGUNDY, letterSpacing: 1.4, textTransform: "uppercase", marginBottom: 6 },
  partTitle: { fontFamily: "Lora", fontSize: 24, color: INK_TITLE, lineHeight: 1.15, letterSpacing: -0.2, marginBottom: 4 },
  partRule: { borderTopWidth: 1.2, borderTopColor: BURGUNDY, marginTop: 10, marginBottom: 16 },
  h2: { fontFamily: "Lora", fontSize: 14, color: INK_TITLE, marginTop: 14, marginBottom: 7 },
  h3: { fontFamily: "Inter", fontSize: 9.5, fontWeight: 600, color: BURGUNDY, marginTop: 8, marginBottom: 4 },

  para: { fontFamily: "Inter", fontSize: 9.5, color: INK_BODY, lineHeight: 1.55, marginBottom: 8, maxWidth: 640 },
  bold: { fontWeight: 500 },
  listRow: { flexDirection: "row", marginBottom: 3, maxWidth: 640 },
  bullet: { fontFamily: "Inter", fontSize: 9.5, color: BURGUNDY, width: 14 },
  listText: { fontFamily: "Inter", fontSize: 9.5, color: INK_BODY, lineHeight: 1.5, flex: 1 },

  // TOC
  tocPart: { fontFamily: "Lora", fontSize: 12, color: INK_TITLE, marginTop: 10, marginBottom: 3 },
  tocSec: { fontFamily: "Inter", fontSize: 9, color: MUTE, marginBottom: 2, marginLeft: 14, lineHeight: 1.4 },

  caption: { fontFamily: "Inter", fontSize: 8, color: FAINT, lineHeight: 1.4, marginBottom: 6, maxWidth: 720 },

  // tables (NaN-safe idiom from tools/pdf/scholarly-pdf.mjs)
  table: { borderTopWidth: 1.3, borderTopColor: BURGUNDY, borderBottomWidth: 1.3, borderBottomColor: BURGUNDY, marginTop: 6, marginBottom: 10 },
  thRow: { flexDirection: "row", backgroundColor: BURGUNDY },
  tdRow: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: "#f2ece7" },
  tdRowZebra: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: "#f2ece7", backgroundColor: ZEBRA },
  th: { fontFamily: "IBMPlexMono", fontSize: 7, color: "#fff", letterSpacing: 0.3 },
  tdText: { fontFamily: "Inter", fontSize: 8, color: INK_SUB, lineHeight: 1.3 },
  tdMono: { fontFamily: "IBMPlexMono", fontSize: 8, color: "#2b1f1f", lineHeight: 1.25 },
  tdMonoMute: { fontFamily: "IBMPlexMono", fontSize: 8, color: MUTE, lineHeight: 1.25 },
  tdMonoFaint: { fontFamily: "IBMPlexMono", fontSize: 8, color: "#d8cfca" },
  tdHmtc: { fontFamily: "IBMPlexMono", fontSize: 8, color: "#2b1f1f", fontWeight: 500, lineHeight: 1.25 },

  footer: { position: "absolute", bottom: 22, left: 46, right: 46, fontFamily: "IBMPlexMono", fontSize: 6.6, color: FAINT, textAlign: "center" },
  footerP: { position: "absolute", bottom: 26, left: 60, right: 60, fontFamily: "IBMPlexMono", fontSize: 6.6, color: FAINT, textAlign: "center" },
})

// ── NaN-safe table primitives ────────────────────────────────────────────────
const pct = (weights) => {
  const total = weights.reduce((a, b) => a + b, 0)
  return weights.map((w) => `${(w / total) * 100}%`)
}
const alignFor = (a) => (a === "right" ? "flex-end" : a === "center" ? "center" : "flex-start")
function Cell(content, width, align, textStyle, key) {
  return h(
    View,
    { key, style: { width, paddingVertical: 3.2, paddingHorizontal: 6, flexDirection: "row", justifyContent: alignFor(align) } },
    Array.isArray(content) ? content : h(Text, { style: [textStyle, { textAlign: align || "left" }], hyphenationCallback: (w) => [w] }, content),
  )
}
function Row(cells, widths, rowStyle, key) {
  return h(View, { key, style: rowStyle, wrap: false }, cells.map((c, i) => Cell(c.t, widths[i], c.a, c.s, i)))
}

// ── inline runs (**bold** → weight 500) ──────────────────────────────────────
function runs(str) {
  const out = []
  const re = /\*\*([^*]+)\*\*/g
  let last = 0, m
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

// ── markdown content parser (the authored Parts 1/2/4/5) ─────────────────────
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

// weights: first column widest; label/number columns stay tight
function tableWeights(header) {
  const n = header.length
  return header.map((hh, i) => {
    if (i === 0) return n > 3 ? 1.5 : 1.4
    // long-text columns get more room
    if (/rule|designation|trigger|action|definition|requirement|specific|subcategor|form of|mark use/i.test(hh)) return 1.8
    return 1
  })
}

function ContentTable(b, key) {
  const widths = pct(tableWeights(b.header))
  const header = b.header.map((c, i) => ({ t: c, a: "left", s: s.th }))
  const bodyRows = b.rows.map((r, ri) => {
    const cells = b.header.map((_, ci) => {
      const val = r[ci] ?? ""
      // right-align pure numeric/percent cells for legibility
      const mono = /^[\d.,%±≤≥<>()/+\s–-]*$/.test(val) && /\d/.test(val)
      return { t: val, a: mono ? "right" : "left", s: mono ? s.tdMono : s.tdText }
    })
    return Row(cells, widths, ri % 2 ? s.tdRowZebra : s.tdRow, `r${ri}`)
  })
  // Let the table break between whole rows (rows are wrap:false) so pages pack
  // densely instead of stranding a whole table onto the next page.
  return h(View, { key, style: s.table }, [Row(header, widths, s.thRow, "h"), ...bodyRows])
}

// render a parsed content block
function Block(b, key) {
  if (b.type === "h2") return h(Text, { key, style: s.h2, bookmark: { title: b.text, fit: true } }, b.text)
  if (b.type === "h3") return h(Text, { key, style: s.h3 }, b.text)
  if (b.type === "para") return Inline(b.text, s.para, key)
  if (b.type === "ul" || b.type === "ol")
    return h(
      View,
      { key, style: { marginBottom: 8 } },
      b.items.map((it, i) =>
        h(View, { key: i, style: s.listRow, wrap: false }, [
          h(Text, { key: "b", style: s.bullet }, b.type === "ol" ? `${i + 1}.` : "•"),
          Inline(it, s.listText, "t"),
        ]),
      ),
    )
  if (b.type === "table") return ContentTable(b, key)
  return null
}

// render one authored Part from its content file. h1 becomes the part header.
function AuthoredPart(file, partLabel) {
  const blocks = parseContent(fs.readFileSync(path.join(CONTENT_DIR, file), "utf8"))
  const h1 = blocks.find((b) => b.type === "h1")
  const title = h1 ? h1.text.replace(/^Part\s+\d+\s*[—-]\s*/i, "") : partLabel
  const body = blocks.filter((b) => b !== h1)
  const head = h(View, { key: "hd", wrap: false, bookmark: { title: `${partLabel}: ${title}`, fit: true } }, [
    h(Text, { key: "n", style: s.partNum }, partLabel),
    h(Text, { key: "t", style: s.partTitle }, title),
    h(View, { key: "r", style: s.partRule }),
  ])
  return { head, body: body.map((b, i) => Block(b, i)), sections: body.filter((b) => b.type === "h2").map((b) => b.text), title }
}

// ── Part 3 — live Cat-1 Standards Register (same SoT as the web page) ────────
const REGISTER = buildRegister()
const SNAP = snapshotFromRegister(REGISTER)

function RegisterEntry(r, i) {
  return h(
    View,
    { key: r.slug, wrap: false, style: { borderBottomWidth: 0.5, borderBottomColor: "#f2ece7", paddingVertical: 8, backgroundColor: i % 2 ? ZEBRA : undefined } },
    [
      h(Text, { key: "n", style: s.tdText }, r.name),
      h(Text, { key: "s", style: s.tdMonoMute }, r.href ? `${r.href} · ${r.slug}` : r.slug),
      h(Text, { key: "st", style: r.cert_ready ? s.tdHmtc : s.tdMonoMute }, r.cert_ready ? `cert-ready · ${r.cert_doi}` : `HOLD · ${r.hold_reason || "not cert-ready"}`),
    ],
  )
}

function PartThree() {
  return [
    h(View, { key: "hd", wrap: false, bookmark: { title: "Part 3: Cat-1 Standards Register", fit: true } }, [
      h(Text, { key: "n", style: s.partNum }, "Part 3"),
      h(Text, { key: "t", style: s.partTitle }, "Cat-1 Standards Register"),
      h(View, { key: "r", style: s.partRule }),
      h(Text, { key: "lede", style: s.para },
        `Every Cat-1 compiled record and every live subcategory page. Cert-ready means the live page carries a house DOI under prefix 10.83138 and every joined compiled variant has a complete claim-surface. Incomplete cells stay listed as not cert-ready. Live pages ${SNAP.live_pages}; cert-ready ${SNAP.cert_ready} of ${SNAP.live_pages}; HOLD ${SNAP.hold}.`),
    ]),
    h(View, { key: "t", style: { borderTopWidth: 1.3, borderTopColor: BURGUNDY, borderBottomWidth: 1.3, borderBottomColor: BURGUNDY, marginTop: 6, marginBottom: 10 } },
      REGISTER.rows.map((r, i) => RegisterEntry(r, i))),
  ]
}

// ── cover, contents, edition record ──────────────────────────────────────────
function Cover() {
  return [
    h(Text, { key: "m", style: s.masthead }, "Heavy Metal Tested & Certified  ·  Program Manual"),
    h(View, { key: "r", style: s.ruleBurgundy }),
    h(Text, { key: "t", style: s.coverTitle }, "Infant and Child Foods"),
    h(Text, { key: "sub", style: s.coverSub }, "Category 1 · Ages 0–5 · Manual v3"),
    h(Text, { key: "meth", style: s.coverMethod }, "Method v2.0 — government-limit default (gov_floor | disclosed read_across)"),
    h(View, { key: "auth", style: s.coverBlock }, [
      h(Text, { key: "l", style: s.label }, "Author & publisher"),
      h(Text, { key: "t", style: s.coverText }, "Karen Pendergrass · ORCID 0000-0002-2348-7259\nInstitute of Contaminant Standards (ICS) · Heavy Metal Tested & Certified"),
    ]),
    h(View, { key: "ed", style: s.coverBlock }, [
      h(Text, { key: "l", style: s.label }, "Edition"),
      h(Text, { key: "t", style: s.coverText }, `${EDITION_LABEL} · ${EDITION_DATE}`),
    ]),
    h(View, { key: "ab", style: s.abstractBox }, [
      h(Text, { key: "l", style: s.abstractLabel }, "About this manual"),
      h(
        Text,
        { key: "b", style: s.abstractBody },
        "The Infant and Child Foods Program Manual is the published Category 1 instrument. Thin table of contents: the five Governing Principles; program lifecycle and statuses; mark, measurement uncertainty, CAPA, remediation, and the standards ratchet; the Lot Testing Schedule (lab-informed assignment and the 90% stay-in-program gate); and the live Cat-1 Standards Register. It does not reprint per-analyte master-table walls. The earlier Zenodo deposit is an earlier deposited edition only. Method edition is at /program/method.",
      ),
    ]),
    h(Text, { key: "cite", style: [s.coverText, { marginTop: 10 }] }, apaCite(HOUSE_DOI)),
    h(Text, { key: "cpr", style: [s.coverText, { marginTop: 6 }] }, COPYRIGHT),
  ]
}

function Contents(partSections) {
  // partSections: [{label, title, sections:[...]}]
  const children = [h(Text, { key: "hd", style: s.partTitle }, "Contents"), h(View, { key: "r", style: s.partRule })]
  for (const p of partSections) {
    children.push(h(Text, { key: `${p.label}-p`, style: s.tocPart }, `${p.label} — ${p.title}`))
    for (const sec of p.sections) children.push(h(Text, { key: `${p.label}-${sec}`, style: s.tocSec }, sec))
  }
  return children
}

function EditionRecord() {
  const widths = pct([1.7, 1.1, 1.1, 1.7, 3.4])
  const header = ["Edition", "Date", "Status", "DOI", "What changed"].map((t) => ({ t, a: "left", s: s.th }))
  const rows = VH.versions.map((v, ri) => {
    const cells = [
      { t: v.label, a: "left", s: s.tdText },
      { t: v.date, a: "left", s: s.tdMonoMute },
      { t: v.status === "current" ? "current" : v.status || "superseded", a: "left", s: v.status === "current" ? [s.tdMono, { color: BURGUNDY }] : s.tdMonoMute },
      { t: v.doi || v.doi_pending || "—", a: "left", s: s.tdMonoMute },
      { t: v.summary || "", a: "left", s: s.tdText },
    ]
    return Row(cells, widths, ri % 2 ? s.tdRowZebra : s.tdRow, `r${ri}`)
  })
  const children = [
    h(View, { key: "hd", wrap: false, bookmark: { title: "Edition record", fit: true } }, [
      h(Text, { key: "t", style: s.partTitle }, "Edition record"),
      h(View, { key: "r", style: s.partRule }),
    ]),
    h(Text, { key: "cap", style: s.caption },
      "The dated editions of this manual, each kept at a stable permalink. Manual v3 is current. Zenodo deposits are earlier deposited editions only."),
    h(View, { key: "t", style: s.table }, [Row(header, widths, s.thRow, "h"), ...rows]),
  ]
  if (VH.concept_doi) {
    const currentId = HOUSE_DOI ? ` The current house DOI is ${HOUSE_DOI}.` : ""
    children.push(h(Text, { key: "cd", style: s.caption }, `The Zenodo concept DOI ${VH.concept_doi} resolves to the latest Zenodo deposited edition, which is retired. It is not the current Manual v3 identifier.${currentId}`))
  }
  children.push(h(Text, { key: "cite", style: [s.para, { marginTop: 10 }] }, apaCite(HOUSE_DOI)))
  children.push(h(Text, { key: "cpr", style: s.caption }, COPYRIGHT))
  children.push(h(Text, { key: "zen", style: s.caption }, `Earlier deposited edition (retired): ${ZENODO_VERSION_DOI}.`))
  return children
}

// ── document ──────────────────────────────────────────────────────────────────
function ManualDocument() {
  const footerText = houseFooterCite({
    label: "Heavy Metal Certified  ·  Infant and Child Foods Program Manual",
    edition: EDITION_LABEL,
    doi: HOUSE_DOI,
  })
  const p1 = AuthoredPart("part1-why.md", "Part 1")
  const p2 = AuthoredPart("part2-program.md", "Part 2")
  const p4 = AuthoredPart("part4-lot-testing.md", "Part 4")
  const p5 = AuthoredPart("part5-backmatter.md", "Part 5")
  const toc = [
    { label: "Part 1", title: p1.title, sections: p1.sections },
    { label: "Part 2", title: p2.title, sections: p2.sections },
    { label: "Part 3", title: "Cat-1 Standards Register", sections: ["Live pages and compiled records", "cert_doi or HOLD reason"] },
    { label: "Part 4", title: p4.title, sections: p4.sections },
    { label: "Part 5", title: p5.title, sections: p5.sections },
  ]
  const foot = () => h(Text, { key: "f", style: s.footerP, fixed: true }, footerText)

  return h(
    Document,
    {
      title: "Infant and Child Foods: HMTc Program Manual",
      author: "Karen Pendergrass",
      subject: HOUSE_DOI
        ? `DOI ${HOUSE_DOI}`
        : "Heavy Metal Certified Category 1 Infant and Child Foods Program Manual",
      keywords: HOUSE_DOI
        ? `${HOUSE_DOI}, Infant and Child Foods, Manual v3, Method v2`
        : "Infant and Child Foods, Manual v3, Method v2",
      creator: "Institute of Contaminant Standards / Heavy Metal Certified",
      producer: "Heavy Metal Certified",
      language: "en-US",
    },
    [
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
    ],
  )
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true })
  await renderToFile(h(ManualDocument), OUT)
  console.log(`build-cat1-manual-pdf: wrote ${path.relative(REPO, OUT)} (Manual v3; ${REGISTER.pages.length} live pages, ${SNAP.cert_ready} cert-ready, ${REGISTER.orphans.length} orphan HOLD)`)
}

main().catch((err) => {
  console.error("build-cat1-manual-pdf: FAILED:", err.message)
  console.error(err.stack)
  process.exit(1)
})
