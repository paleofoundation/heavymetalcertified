// Scholarly-PDF renderer — the "Content Page PDF v2" design, rendered to a real
// paginated PDF with @react-pdf/renderer.
//
// This replaces the earlier pdfkit typesetter. pdfkit gave a flat, single-column
// approximation with ASCII-folded units; the design Karen approved is a
// two-column scholarly report (masthead, title, two-column front matter, tinted
// abstract, numbered "N | Heading" sections in mono, real tables, bracketed
// references, two-column back matter). react-pdf renders that faithfully with
// flexbox layout, auto-pagination, and embedded Unicode fonts (so "µg/kg" and
// diacritics render as themselves).
//
// It is still pure JS — no headless browser — so it runs on the Vercel/CI
// builder deterministically, the same property the pdfkit version had.
//
// Design tokens (colours, sizes, the three families, the "N | Heading" section
// format, the 342:236 front-matter split) were measured from the standalone
// mockup's computed styles; see fonts.mjs for the font roles.

import React from "react"
import {
  Document,
  Page,
  View,
  Text,
  Link,
  Svg,
  Path,
  StyleSheet,
  renderToFile,
} from "@react-pdf/renderer"
import { registerFonts } from "./fonts.mjs"
import { houseApaCite, houseFooterCite } from "../lib/house-cite.mjs"

registerFonts()

const h = React.createElement
const BASE = "https://heavymetalcertified.com"

// ── colours (measured from the mockup) ──────────────────────────────────────
const INK_TITLE = "#1e1418"
const INK_BODY = "#241c20"
const INK_SUB = "#2b1f24"
const BURGUNDY = "#9f2727"
const MUTE = "#4a4246"
const FAINT = "#8a8288"
const ABSTRACT_BG = "#fdf4f3"
const RULE_FAINT = "#f2ece7"
const RULE_MED = "#e8e1db"

// ── text normalisation ──────────────────────────────────────────────────────
// The embedded fonts cover Latin, Latin-Extended, the micro sign and Cyrillic,
// so almost everything passes through as itself. Only the handful of symbols
// outside the display serif (arrows, a couple of maths glyphs) are mapped, so a
// stray one in a heading can never render as a .notdef box.
function normalizeSymbols(s) {
  return String(s)
    .replace(/→/g, "->").replace(/←/g, "<-").replace(/↔/g, "<->")
    .replace(/⟨/g, "<").replace(/⟩/g, ">")
    .replace(/ /g, " ")
}

// Resolve wiki/markdown link and code syntax to plain text, keeping emphasis
// markers for inlineRuns to consume.
function stripWiki(s) {
  return normalizeSymbols(s)
    .replace(/<\/?[a-z][a-z0-9]*\b[^>]*>/gi, "") // strip HTML tags (e.g. <span class="hmi-ref-meta">)
    .replace(/\[\[[^\]|#]*#?[^\]|]*\|([^\]]+)\]\]/g, "$1") // [[t|alias]] -> alias
    .replace(/\[\[([^\]|#]+)[^\]]*\]\]/g, (_, p) => p.split("/").pop()) // [[t]] -> basename
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // [text](url) -> text
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\\([\\`*_{}[\]()#+\-.!])/g, "$1")
}

function stripEmphasis(s) {
  return String(s)
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/(?<![A-Za-z0-9])[_*]([^_*\n]+)[_*](?![A-Za-z0-9])/g, "$1")
}

// Plain text: no links, no emphasis markers. For headings, labels, table cells.
const clean = (s) => stripEmphasis(stripWiki(s)).replace(/\s+/g, " ").trim()

// Split a line into styled runs, honouring **bold** and *italic* / _italic_,
// so body prose keeps its emphasis instead of flattening to one weight.
function inlineRuns(s) {
  const text = stripWiki(s)
  const runs = []
  const re = /\*\*([^*]+)\*\*|(?<![A-Za-z0-9])[_*]([^_*\n]+)[_*](?![A-Za-z0-9])/g
  let last = 0
  let m
  while ((m = re.exec(text))) {
    if (m.index > last) runs.push({ text: text.slice(last, m.index) })
    if (m[1] !== undefined) runs.push({ text: m[1], bold: true })
    else runs.push({ text: m[2], italic: true })
    last = re.lastIndex
  }
  if (last < text.length) runs.push({ text: text.slice(last) })
  return runs.length ? runs : [{ text }]
}

// ── frontmatter + body parsing ──────────────────────────────────────────────
export function parse(md) {
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

const isApparatus = (heading) =>
  /^(references|sources|update history|peer review state)$/i.test(heading)

// Everything before the first H2 is the lede; each H2 opens a section.
export function sectionize(body) {
  const clean_ = body
    .replace(/<!-- BEGIN: [\s\S]*?-->/g, "")
    .replace(/<!-- END: [\s\S]*?-->/g, "")
  const sections = []
  const preamble = []
  let cur = null
  for (const raw of clean_.split("\n")) {
    const t = raw.replace(/\s+$/, "")
    const hh = t.match(/^##\s+(.+)/)
    if (hh) {
      cur = { heading: clean(hh[1]), rawHeading: hh[1], lines: [] }
      sections.push(cur)
      continue
    }
    if (/^#\s+/.test(t)) continue // page H1 == title
    if (cur) cur.lines.push(t)
    else preamble.push(t)
  }
  return { sections, preamble }
}

function firstProsePara(lines) {
  return (lines ?? []).find((l) => {
    const t = l.trim()
    return (
      t &&
      !t.startsWith("#") &&
      !t.startsWith("|") &&
      !t.startsWith("-") &&
      !t.startsWith("*") &&
      !t.startsWith("<") &&
      !t.startsWith(">")
    )
  })
}

// Group a section's raw lines into typed blocks the renderer lays out.
function parseBlocks(lines, skipLine) {
  const blocks = []
  let i = 0
  const skip = skipLine ? skipLine.trim() : null
  while (i < lines.length) {
    const raw = lines[i]
    const t = raw.trim()
    if (!t || t === skip || t.startsWith("<")) {
      i++
      continue
    }
    let mm
    if (t.startsWith("|")) {
      const rows = []
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        rows.push(lines[i].trim())
        i++
      }
      const table = parseTable(rows)
      if (table) blocks.push({ type: "table", ...table })
      continue
    }
    if ((mm = t.match(/^###\s+(.+)/))) {
      blocks.push({ type: "h3", text: clean(mm[1]) })
      i++
      continue
    }
    if (/^[-*]\s+/.test(t)) {
      const items = []
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*]\s+/, ""))
        i++
      }
      blocks.push({ type: "list", items })
      continue
    }
    if (t.startsWith(">")) {
      const quote = []
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        quote.push(lines[i].trim().replace(/^>\s?/, ""))
        i++
      }
      blocks.push({ type: "quote", text: quote.join(" ") })
      continue
    }
    blocks.push({ type: "para", text: t })
    i++
  }
  return blocks
}

function parseTable(rows) {
  const isSep = (r) => /^\|[\s:|-]+\|?$/.test(r)
  // Split a row on genuine column delimiters only. A pipe that is escaped (\|)
  // or that sits inside a wikilink ([[target|alias]]) is content, not a column
  // break — splitting on it leaks a half-parsed "[[sources/…" into the cell.
  const SENTINEL = "\u0001"
  const cells = (r) => {
    const s = r
      .replace(/^\||\|$/g, "")
      .replace(/\\\|/g, SENTINEL) // escaped pipe \|
      .replace(/\[\[[^\]]*\]\]/g, (m) => m.replace(/\|/g, SENTINEL)) // wikilink alias pipe
    return s.split("|").map((c) => clean(c.split(SENTINEL).join("|")))
  }
  const body = rows.filter((r) => !isSep(r))
  if (!body.length) return null
  const header = cells(body[0])
  const dataRows = body.slice(1).map(cells)
  return { header, rows: dataRows }
}

// A reference line comes in the generated span format
//   N. [[sources/key|Title]]<span class="hmi-ref-meta">authors · journal · year · [link](url)</span><span class="hmi-ref-tag">Tag</span>
// (and, on some pages, the plainer "N. Authors (year). *Title*. …" form). Pull
// the title, the meta line and the tag out separately so the renderer can lay
// them out — and so the <span> markup never reaches the page as literal text.
function parseRefs(section) {
  if (!section) return []
  const out = []
  for (const raw of section.lines) {
    const t = raw.trim()
    const m = t.match(/^(\d+)\.\s+(.*)/)
    if (!m) continue
    const rest = m[2]
    const spanOf = (cls) => {
      const mm = rest.match(new RegExp(`<span[^>]*class="[^"]*${cls}[^"]*"[^>]*>([\\s\\S]*?)</span>`, "i"))
      return mm ? clean(mm[1]) : ""
    }
    const meta = spanOf("hmi-ref-meta")
    const tag = spanOf("hmi-ref-tag")
    // Head = everything before the first span (the title). In the span format the
    // title IS a [[sources/…|Title]] wikilink, so resolve it FIRST (clean), then
    // drop only a trailing "Source record" — the plain format's link affordance.
    // (Stripping the whole trailing [[sources/…]] before resolving would delete
    // the title itself.)
    const head = clean(rest.replace(/<span[\s\S]*$/, "")).replace(/\s*Source record\.?\s*$/i, "").trim()
    out.push({ n: Number(m[1]), head, meta, tag })
  }
  return out
}

// ── eligibility (mirrored in quartz/components/scholarlyPdf.ts) ──────────────
export const THIN_STATUS = new Set(["stub", "scaffold"])
export const MIN_BODY_SECTIONS = 3

export function substantiveSectionCount(body) {
  return body
    .replace(/<!-- BEGIN: [\s\S]*?-->/g, "")
    .replace(/<!-- END: [\s\S]*?-->/g, "")
    .split("\n")
    .filter((l) => /^###?\s+/.test(l.trim()))
    .filter((l) => !isApparatus(clean(l.trim().replace(/^###?\s+/, "")))).length
}

// ── model ───────────────────────────────────────────────────────────────────
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"]
function monthYear(d) {
  const m = String(d ?? "").match(/^(\d{4})-(\d{2})/)
  if (!m) return String(d ?? "").slice(0, 4)
  return `${MONTHS[Number(m[2]) - 1]} ${m[1]}`
}

function buildModel(fm, body, cfg) {
  const slug = cfg.slug
  const title = clean(fm.title || slug)
  const established = fm.established || ""
  const updated = fm.updated || established || ""
  const year = (established || updated || "").slice(0, 4)
  const url = `${BASE}/${cfg.pathSeg}/${slug}`
  // Certification standards carry `cert_doi`; the index carries `wiki_doi`. Accept either
  // (plus a plain `doi`) so the minted DOI prints on the PDF face (Cite as). (S-DOI-OLIVE-DOI-SURFACE-1)
  const rawDoi = fm.cert_doi || fm.wiki_doi || fm.doi
  const doi = rawDoi && String(rawDoi).toLowerCase() !== "null" ? String(rawDoi) : null
  const grade = String(fm.grade || "").toUpperCase()
  const GRADE_LABEL = { A: "Established", B: "Well supported", C: "Provisional", D: "Contested" }

  const metalList = (String(fm.metals || "").match(/\[([^\]]*)\]/) || [])[1]
  const kwMetals = metalList ? metalList.split(",").map((x) => x.trim().replace(/^["']|["']$/g, "")).filter(Boolean) : []
  const keywords = [...new Set([...kwMetals, "heavy metals", "food safety", "dietary exposure"])]

  const { sections, preamble } = sectionize(body)
  const overview = sections.find((s) => /^overview$/i.test(s.heading))
  const ledeFirst = firstProsePara(preamble)
  const overviewFirst = overview && firstProsePara(overview.lines)
  const abstract = clean(fm.dek || ledeFirst || overviewFirst || "")
  const skipLine = fm.dek ? null : ledeFirst || overviewFirst

  const ledeBlocks = parseBlocks(
    (skipLine ? preamble.filter((l) => l.trim() !== skipLine.trim()) : preamble).filter((l) => l.trim()),
    null,
  )

  const bodySections = sections
    .filter((s) => !isApparatus(s.heading))
    .map((s) => ({
      heading: s.heading,
      blocks: parseBlocks(s.lines, s === overview && !fm.dek ? skipLine : null),
    }))
    .filter((s) => s.blocks.length)

  const references = cfg.references || parseRefs(sections.find((s) => /^references$/i.test(s.heading)))

  // Certification standards are network-locked to All-rights-reserved
  // (ORDER S-DOI-CITE-LICENSE-1 / S-DOI-CITE-APA-1): Cite-as uses the APA
  // "Standard No." form with the doi.org URL only (never the page URL, never
  // "registration pending"), carries no CC BY, and never glues the licence
  // onto the cite line.
  // Program Manuals (HMTC-MANUAL-CITE-NO-STANDARD-NO-1): APA title + publisher
  // + doi.org. Never Standard No. / Manual No. Never page URL as cite URL.
  // Other scholarly PDFs (briefings) keep their APA prose cite + CC BY.
  const isManual = cfg.pathSeg === "manuals"
  const isStandard = cfg.pathSeg === "standards" || isManual
  const yr = year || "2026"
  const citeAs = isStandard
    ? houseApaCite({ title, year: yr, doi, kind: isManual ? "manual" : "standard" })
    : `Pendergrass, K.${year ? " (" + year + ")." : ""} ${title}. Heavy Metal Certified.${doi ? " https://doi.org/" + doi : (url ? " " + url : "")} CC BY 4.0.`
  const licenseLine = isStandard
    ? `© ${yr} Institute of Contaminant Standards / Heavy Metal Certified. All rights reserved.`
    : "CC BY 4.0"
  const footerLicense = isStandard ? "© All rights reserved" : "CC BY 4.0"
  const footerCite = isManual
    ? houseFooterCite({ label: "Heavy Metal Certified", edition: title, doi, reserved: footerLicense, kind: "manual" })
    : `Heavy Metal Certified  ·  ${url}  ·  ${footerLicense}`

  return {
    isStandard,
    licenseLine,
    footerLicense,
    masthead: cfg.masthead,
    dateLabel: monthYear(updated || established),
    title,
    // The ORCID iD is shown as the official green iD glyph linked to the record
    // (the journal-byline convention), not the spelled-out number; the
    // identifier lives on the link target. Rendered as a row in ScholarlyDocument.
    authorLine: {
      name: "Karen Pendergrass",
      affil: "Heavy Metal Tested & Certified, Institute of Contaminant Standards",
      orcid: "0000-0002-2348-7259",
    },
    gradeLine: grade && GRADE_LABEL[grade] ? `Confidence grade ${grade} — ${GRADE_LABEL[grade]} (preprint)` : null,
    citeAs,
    footerCite,
    keywords,
    firstPublished: established,
    revision: updated && updated !== established ? updated : null,
    abstract,
    ledeBlocks,
    bodySections,
    references,
    url,
    pathSeg: cfg.pathSeg,
  }
}

// ── styles ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page: {
    paddingTop: 52,
    paddingBottom: 56,
    paddingHorizontal: 58,
    fontFamily: "Inter",
    fontSize: 9.5,
    color: INK_BODY,
    lineHeight: 1.5,
  },
  mastheadRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  masthead: { fontFamily: "IBMPlexMono", fontSize: 7.5, color: BURGUNDY, letterSpacing: 1.1, textTransform: "uppercase" },
  mastheadDate: { fontFamily: "IBMPlexMono", fontSize: 7.5, color: MUTE, letterSpacing: 0.5 },
  ruleBurgundy: { borderTopWidth: 1.4, borderTopColor: BURGUNDY, marginTop: 5, marginBottom: 16 },
  ruleFaint: { borderTopWidth: 0.75, borderTopColor: RULE_MED, marginTop: 16, marginBottom: 14 },
  title: { fontFamily: "Lora", fontSize: 20, color: INK_TITLE, lineHeight: 1.2, letterSpacing: -0.2, marginBottom: 10 },
  authorLine: { fontFamily: "IBMPlexMono", fontSize: 7.6, color: MUTE, letterSpacing: 0.3, marginBottom: 4 },
  authorRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  authorText: { fontFamily: "IBMPlexMono", fontSize: 7.6, color: MUTE, letterSpacing: 0.3 },
  orcidBadge: { marginHorizontal: 3 },
  gradeLine: { fontFamily: "IBMPlexMono", fontSize: 7.6, color: BURGUNDY, letterSpacing: 0.3, marginBottom: 12 },

  frontRow: { flexDirection: "row", gap: 30, marginBottom: 18 },
  frontLeft: { flexGrow: 1.45, flexBasis: 0 },
  frontRight: { flexGrow: 1, flexBasis: 0 },
  label: { fontFamily: "IBMPlexMono", fontSize: 7, color: BURGUNDY, letterSpacing: 0.9, textTransform: "uppercase", marginBottom: 4 },
  frontText: { fontFamily: "Inter", fontSize: 8.2, color: MUTE, lineHeight: 1.5 },
  frontBlock: { marginBottom: 12 },
  keyword: { fontFamily: "Inter", fontSize: 8.2, color: INK_BODY, lineHeight: 1.55 },

  abstractBox: { backgroundColor: ABSTRACT_BG, paddingVertical: 16, paddingHorizontal: 20, marginBottom: 20 },
  abstractLabel: { fontFamily: "Lora", fontSize: 14, color: BURGUNDY, marginBottom: 7 },
  abstractBody: { fontFamily: "Inter", fontSize: 9.8, color: INK_BODY, lineHeight: 1.55 },

  para: { fontFamily: "Inter", fontSize: 9.5, color: INK_BODY, lineHeight: 1.55, marginBottom: 9 },
  sectionHead: { fontFamily: "IBMPlexMono", fontSize: 9.5, color: BURGUNDY, letterSpacing: 0.4, marginBottom: 8, marginTop: 6 },
  h3: { fontFamily: "Lora", fontSize: 11, color: INK_SUB, marginBottom: 6, marginTop: 4 },
  listItem: { flexDirection: "row", marginBottom: 4 },
  bullet: { fontFamily: "Inter", fontSize: 9.5, color: BURGUNDY, width: 12 },
  listText: { fontFamily: "Inter", fontSize: 9.5, color: INK_BODY, lineHeight: 1.5, flex: 1 },
  quote: { fontFamily: "Lora", fontStyle: "italic", fontSize: 10, color: MUTE, marginBottom: 9, paddingLeft: 12, borderLeftWidth: 2, borderLeftColor: RULE_MED, marginLeft: 2 },

  table: { borderTopWidth: 1.4, borderTopColor: BURGUNDY, borderBottomWidth: 1.4, borderBottomColor: BURGUNDY, marginVertical: 10 },
  thRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: RULE_MED },
  tdRow: { flexDirection: "row", borderBottomWidth: 0.6, borderBottomColor: RULE_FAINT },
  th: { fontFamily: "IBMPlexMono", fontSize: 6.8, color: BURGUNDY, letterSpacing: 0.6, textTransform: "uppercase" },
  td: { fontFamily: "Inter", fontSize: 8.2, color: INK_BODY, lineHeight: 1.4 },

  refsHead: { fontFamily: "Lora", fontSize: 13, color: INK_TITLE, marginTop: 8, marginBottom: 8 },
  refRow: { flexDirection: "row", marginBottom: 6 },
  refNum: { fontFamily: "IBMPlexMono", fontSize: 7.5, color: BURGUNDY, width: 22 },
  refText: { fontFamily: "Inter", fontSize: 8.2, color: INK_BODY, lineHeight: 1.4 },
  refMeta: { fontFamily: "Inter", fontSize: 7.3, color: MUTE, lineHeight: 1.4, marginTop: 1 },
  refTag: { fontFamily: "IBMPlexMono", fontSize: 6.4, color: BURGUNDY, letterSpacing: 0.4, textTransform: "uppercase", marginTop: 1 },

  backGrid: { flexDirection: "row", flexWrap: "wrap", marginTop: 4 },
  backBlock: { width: "50%", paddingRight: 22, marginBottom: 12 },
  backText: { fontFamily: "Inter", fontSize: 7.8, color: MUTE, lineHeight: 1.5 },

  footer: { position: "absolute", bottom: 30, left: 58, right: 58, fontFamily: "IBMPlexMono", fontSize: 6.8, color: FAINT, textAlign: "center" },
})

// ── inline text ─────────────────────────────────────────────────────────────
function InlineText(str, style, key) {
  const runs = inlineRuns(str)
  return h(
    Text,
    { key, style },
    runs.map((r, i) =>
      h(
        Text,
        { key: i, style: { fontWeight: r.bold ? 600 : 400, fontStyle: r.italic ? "italic" : "normal" } },
        r.text,
      ),
    ),
  )
}

// ── block renderers ─────────────────────────────────────────────────────────
function Block(b, key) {
  if (b.type === "para") return InlineText(b.text, s.para, key)
  if (b.type === "h3") return h(Text, { key, style: s.h3 }, b.text)
  if (b.type === "quote") return h(Text, { key, style: s.quote }, b.text)
  if (b.type === "list")
    return h(
      View,
      { key, style: { marginBottom: 9 } },
      b.items.map((it, i) =>
        h(View, { key: i, style: s.listItem, wrap: false }, [
          h(Text, { key: "b", style: s.bullet }, "•"),
          InlineText(it, s.listText, "t"),
        ]),
      ),
    )
  if (b.type === "table") return TableBlock(b, key)
  return null
}

// The table container is allowed to break across pages — a metal page's
// occurrence table can run to many rows and would otherwise exceed a single
// page and throw. Individual rows stay whole (wrap:false) so a row is never
// split mid-height. Columns use explicit percentage widths rather than
// flexGrow/flexBasis:0, which Yoga could resolve to NaN on some rows (the
// "unsupported number: -9.2e+21" crash).
function colWidths(n) {
  const weights = Array.from({ length: n }, (_, i) => (n > 2 && i === 0 ? 1.4 : 1))
  const total = weights.reduce((a, b) => a + b, 0)
  return weights.map((w) => `${(w / total) * 100}%`)
}

// Each cell is a width-bearing View wrapping a plain (auto-width) Text. Putting
// the percentage width on the Text itself is what produced the "-9.2e+21" NaN
// on the wide 4-column regulatory tables; the wrapping View is the stable
// react-pdf table idiom.
function TableBlock(b, key) {
  const n = b.header.length || 1
  const widths = colWidths(n)
  const cell = (content, ci, isHeader) =>
    h(
      View,
      { key: ci, style: { width: widths[ci], paddingVertical: 5, paddingHorizontal: 6 } },
      h(Text, { style: isHeader ? s.th : s.td }, content),
    )
  return h(View, { key, style: s.table }, [
    h(View, { key: "h", style: s.thRow, wrap: false }, b.header.map((c, i) => cell(c, i, true))),
    ...b.rows.map((row, ri) =>
      h(
        View,
        { key: ri, style: s.tdRow, wrap: false },
        Array.from({ length: n }).map((_, ci) => cell(row[ci] ?? "", ci, false)),
      ),
    ),
  ])
}

// A section's heading is kept with its first block so a heading never strands
// alone at the foot of a page — but only when that first block is short (a
// paragraph or subheading). Grouping a heading with a table or list under
// wrap:false could exceed a page and crash react-pdf, so those flow separately.
// (minPresenceAhead, the tidier tool for this, triggers a Yoga NaN on these
// pages and cannot be used.)
function Section(sec, idx) {
  const head = h(Text, { key: "hd", style: s.sectionHead }, `${idx + 1}  |  ${sec.heading}`)
  const first = sec.blocks[0]
  // Only group when the first block is genuinely short — an h3, or a paragraph
  // under ~360 characters. A long opening paragraph under wrap:false can exceed
  // a page and crash, so it flows normally (heading may occasionally sit at a
  // page foot, which is cosmetic).
  const keepTogether =
    first && (first.type === "h3" || (first.type === "para" && first.text.length < 360))
  const children = []
  if (keepTogether) {
    children.push(h(View, { key: "grp", wrap: false }, [head, Block(first, "b0")]))
    children.push(...sec.blocks.slice(1).map((b, i) => Block(b, i + 1)))
  } else {
    children.push(head)
    children.push(...sec.blocks.map((b, i) => Block(b, i)))
  }
  return h(View, { key: idx, style: { marginBottom: 4 } }, children)
}

function FrontMatter(m) {
  const left = [
    h(View, { key: "cite", style: s.frontBlock }, [
      h(Text, { key: "l", style: s.label }, "Cite as"),
      h(Text, { key: "t", style: s.frontText }, m.citeAs),
      ...(m.isStandard ? [h(Text, { key: "lic", style: [s.frontText, { marginTop: 4 }] }, m.licenseLine)] : []),
    ]),
    h(View, { key: "corr", style: s.frontBlock }, [
      h(Text, { key: "l", style: s.label }, "Correspondence"),
      h(
        Text,
        { key: "t", style: s.frontText },
        "Corrections are logged publicly on the article page, each with its date, the affected value, and the source that resolved it.",
      ),
    ]),
  ]
  const right = [
    h(View, { key: "kw", style: s.frontBlock }, [
      h(Text, { key: "l", style: s.label }, "Keywords"),
      h(Text, { key: "t", style: s.keyword }, m.keywords.join(", ")),
    ]),
  ]
  if (m.firstPublished || m.revision)
    right.push(
      h(View, { key: "ph", style: s.frontBlock }, [
        h(Text, { key: "l", style: s.label }, "Publication history"),
        h(
          Text,
          { key: "t", style: s.frontText },
          `${m.firstPublished ? "First published " + m.firstPublished + ". " : ""}${m.revision ? "This revision " + m.revision + "." : ""}`,
        ),
      ]),
    )
  return h(View, { style: s.frontRow }, [
    h(View, { key: "L", style: s.frontLeft }, left),
    h(View, { key: "R", style: s.frontRight }, right),
  ])
}

function BackMatter(m) {
  const finding = m.pathSeg === "synthesis" ? "finding" : m.pathSeg === "briefings" ? "briefing" : "reference"
  const blocks = [
    ["Status and licence", m.isStandard
      ? `A normative certification standard, editorially reviewed and version-controlled in-house; every value traces to a named sovereign maximum level, disclosed in the derivation. ${m.licenseLine}`
      : `Editorially reviewed in-house; no external peer review has been completed on this ${finding}. Published as a preprint with its review state tracked on the article page. Released under CC BY 4.0.`],
    ["Competing interests", "This briefing is published by the Heavy Metal Tested & Certified (HMTc) program, operated by the Institute of Contaminant Standards. Its statements about government regulations, toxicology, and occurrence are sourced to the cited primary and expert-body records and to the independently maintained Heavy Metal Index; the program's own certification thresholds are not used as evidence for any factual claim made here."],
    ["Data availability", `The works this ${finding} draws on are listed in full in the references above and on the briefing page at ${m.url}. Primary legal instruments and expert-body assessments are named with their public identifiers; the underlying occurrence and toxicology corpus is maintained on the Heavy Metal Index.`],
    ["Publication history", `${m.firstPublished ? "First published " + m.firstPublished + ". " : ""}${m.revision ? "This revision " + m.revision + ". " : ""}The full dated record is maintained at ${m.url}.`],
  ]
  return h(View, null, [
    h(View, { key: "r", style: s.ruleFaint }),
    h(
      View,
      { key: "g", style: s.backGrid },
      blocks.map(([label, text], i) =>
        h(View, { key: i, style: s.backBlock }, [
          h(Text, { key: "l", style: s.label }, label),
          h(Text, { key: "t", style: s.backText }, text),
        ]),
      ),
    ),
  ])
}

// The official ORCID iD icon (green disc + "iD") drawn with react-pdf vector
// primitives and wrapped in a Link to the record, so a reader clicks the glyph
// to reach the ORCID profile — the customary journal-PDF treatment, replacing
// the spelled-out identifier.
function OrcidBadge(orcid, key) {
  const SIZE = 8.5
  return h(
    Link,
    { key, src: `https://orcid.org/${orcid}`, style: s.orcidBadge },
    h(Svg, { width: SIZE, height: SIZE, viewBox: "0 0 256 256" }, [
      h(Path, {
        key: "disc",
        fill: "#A6CE39",
        d: "M256,128c0,70.7-57.3,128-128,128C57.3,256,0,198.7,0,128C0,57.3,57.3,0,128,0C198.7,0,256,57.3,256,128z",
      }),
      h(Path, { key: "i", fill: "#FFFFFF", d: "M86.3,186.2H70.9V79.1h15.4v48.4V186.2z" }),
      h(Path, {
        key: "d",
        fill: "#FFFFFF",
        d: "M108.9,79.1h41.6c39.6,0,57,28.3,57,53.6c0,27.5-21.5,53.6-56.8,53.6h-41.8V79.1z M124.3,172.4h24.5c34.9,0,42.9-26.5,42.9-39.7c0-21.5-13.7-39.7-43.7-39.7h-23.7V172.4z",
      }),
      h(Path, {
        key: "dot",
        fill: "#FFFFFF",
        d: "M88.7,56.8c0,5.5-4.5,10.1-10.1,10.1c-5.6,0-10.1-4.6-10.1-10.1c0-5.6,4.5-10.1,10.1-10.1C84.2,46.7,88.7,51.3,88.7,56.8z",
      }),
    ]),
  )
}

function ScholarlyDocument(m) {
  const children = [
    h(View, { key: "mr", style: s.mastheadRow }, [
      h(Text, { key: "m", style: s.masthead }, m.masthead),
      m.dateLabel ? h(Text, { key: "d", style: s.mastheadDate }, m.dateLabel) : null,
    ]),
    h(Text, { key: "t", style: s.title }, m.title),
    h(View, { key: "a", style: s.authorRow }, [
      h(Text, { key: "n", style: s.authorText }, `${m.authorLine.name} ·`),
      OrcidBadge(m.authorLine.orcid, "orcid"),
      h(Text, { key: "aff", style: s.authorText }, `· ${m.authorLine.affil}`),
    ]),
    m.gradeLine ? h(Text, { key: "g", style: s.gradeLine }, m.gradeLine) : null,
    h(View, { key: "rule", style: s.ruleBurgundy }),
    h(FrontMatter, { key: "fm", ...m }),
    m.abstract
      ? h(View, { key: "ab", style: s.abstractBox }, [
          h(Text, { key: "l", style: s.abstractLabel }, "Abstract"),
          h(Text, { key: "b", style: s.abstractBody }, m.abstract),
        ])
      : null,
    ...m.ledeBlocks.map((b, i) => Block(b, `lede-${i}`)),
    ...m.bodySections.map((sec, i) => Section(sec, i)),
  ]

  if (m.references.length) {
    children.push(h(Text, { key: "rh", style: s.refsHead }, "References"))
    m.references.forEach((r) =>
      children.push(
        h(View, { key: `ref-${r.n}`, style: s.refRow, wrap: false }, [
          h(Text, { key: "n", style: s.refNum }, `[${r.n}]`),
          h(View, { key: "t", style: { flex: 1 } }, [
            h(Text, { key: "h", style: s.refText }, r.head),
            r.meta ? h(Text, { key: "m", style: s.refMeta }, r.meta) : null,
            r.tag ? h(Text, { key: "g", style: s.refTag }, r.tag) : null,
          ]),
        ]),
      ),
    )
  }

  children.push(h(BackMatter, { key: "bm", ...m }))

  return h(
    Document,
    { title: m.title, author: "Karen Pendergrass", subject: "Heavy Metal Certified", creator: "Heavy Metal Certified" },
    h(Page, { size: "LETTER", style: s.page }, [
      ...children,
      // Static footer, repeated on every page. react-pdf's dynamic `render`
      // callback (the only way to print "page N / M") triggers a Yoga NaN crash
      // on the longer documents (cadmium, ~11 pages), so page numbers are
      // omitted in favour of a footer that never fails the build.
      h(Text, { key: "footer", style: s.footer, fixed: true }, m.footerCite || `Heavy Metal Certified  ·  ${m.url}  ·  ${m.footerLicense}`),
    ]),
  )
}

// ── public API ──────────────────────────────────────────────────────────────
export async function renderScholarlyPdf({ fm, body, outPath, cfg }) {
  const model = buildModel(fm, body, cfg)
  await renderToFile(h(ScholarlyDocument, model), outPath)
  return model
}
