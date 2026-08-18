#!/usr/bin/env node
// build-cat17-manual-pdf.mjs — render the Pet Foods (Category 17) HMTc PROGRAM
// MANUAL to a paginated PDF at content/static/manuals/HMTc-Pet-Foods-Program-Manual-2026.pdf,
// in the approved HMTc scholarly design (Lora headings, IBM Plex Mono values, burgundy #9f2727).
//
// PROVISIONAL EDITION. Unlike the Cat-1 manual this carries NO DOI — the values are
// current and identical to the live web edition (heavymetalcertified.com/manuals/pet-foods),
// but a version-pinned, DOI-registered deposit has not yet occurred. The cover says so
// honestly; nothing here claims a registered/citable status it does not have.
//
// HOW IT CANNOT DRIFT. Every number comes from the SAME compiled records the web
// manual + /standards pages read — data/standards/cat17-compiled/*.json — so the PDF,
// the web manual, and the per-subcategory standard pages cannot disagree. Government-limit
// method only (human-grade over-compliance): each limit is the strictest human-food sovereign
// maximum for the nearest analog; the laxer pet-FEED floor is disclosed for contrast and never
// selects the number.
//
// LOCAL-ONLY GENERATION, COMMITTED ARTIFACT. Needs @react-pdf/renderer (install locally with
// `npm i -D @react-pdf/renderer`); the deploy just serves the committed PDF.
//
// Usage:  node tools/build-cat17-manual-pdf.mjs

import fs from "node:fs"
import path from "node:path"
import React from "react"
import { Document, Page, View, Text, StyleSheet, renderToFile } from "@react-pdf/renderer"
import { registerFonts } from "./pdf/fonts.mjs"

registerFonts()
const h = React.createElement
const REPO = process.cwd()

const CFG = JSON.parse(fs.readFileSync(path.join(REPO, "data/standards/cat17-manual.json"), "utf8"))
const META = CFG._meta
const COMPILED = path.join(REPO, "data/standards", META.compiled_dir)
const OUT_DIR = path.join(REPO, "content/static/manuals")
const OUT = path.join(OUT_DIR, "HMTc-Pet-Foods-Program-Manual-2026.pdf")
const BASE_URL = "https://heavymetalcertified.com/manuals/pet-foods"
const EDITION_DATE = META.effective_date || "2026"

const recFor = (slug) => JSON.parse(fs.readFileSync(path.join(COMPILED, `${slug}.json`), "utf8"))
const PAGES = CFG.pages.map((p) => ({ slug: p.slug, name: p.name, rec: recFor(p.variants[0].record), variant: p.variants[0].variant }))

// ── palette (approved scholarly, HMTc red) ───────────────────────────────────
const INK_TITLE = "#1e1418", INK_BODY = "#241c20", INK_SUB = "#2b1f24"
const BURGUNDY = "#9f2727", MUTE = "#4a4246", FAINT = "#8a8288"
const ABSTRACT_BG = "#fdf4f3", ZEBRA = "#fbf7f5"

const s = StyleSheet.create({
  pagePortrait: { paddingTop: 54, paddingBottom: 52, paddingHorizontal: 60, fontFamily: "Inter", fontSize: 9.5, color: INK_BODY, lineHeight: 1.5 },
  pageLand: { paddingTop: 44, paddingBottom: 46, paddingHorizontal: 46, fontFamily: "Inter", fontSize: 9, color: INK_BODY, lineHeight: 1.45 },
  masthead: { fontFamily: "IBMPlexMono", fontSize: 8, color: BURGUNDY, letterSpacing: 1.2, textTransform: "uppercase" },
  ruleBurgundy: { borderTopWidth: 1.5, borderTopColor: BURGUNDY, marginTop: 8, marginBottom: 20 },
  coverTitle: { fontFamily: "Lora", fontSize: 34, color: INK_TITLE, lineHeight: 1.12, letterSpacing: -0.3, marginBottom: 12 },
  coverSub: { fontFamily: "Lora", fontSize: 15, color: INK_SUB, marginBottom: 22 },
  coverMethod: { fontFamily: "IBMPlexMono", fontSize: 9, color: BURGUNDY, letterSpacing: 0.4, marginBottom: 24 },
  label: { fontFamily: "IBMPlexMono", fontSize: 7, color: BURGUNDY, letterSpacing: 0.9, textTransform: "uppercase", marginBottom: 4 },
  coverBlock: { marginBottom: 14 },
  coverText: { fontFamily: "Inter", fontSize: 9, color: MUTE, lineHeight: 1.55 },
  provBox: { borderWidth: 0.8, borderColor: BURGUNDY, borderStyle: "solid", paddingVertical: 11, paddingHorizontal: 15, marginTop: 6, marginBottom: 12 },
  provLabel: { fontFamily: "IBMPlexMono", fontSize: 7, color: BURGUNDY, letterSpacing: 0.9, textTransform: "uppercase", marginBottom: 5 },
  provText: { fontFamily: "Inter", fontSize: 8.6, color: INK_BODY, lineHeight: 1.5 },
  abstractBox: { backgroundColor: ABSTRACT_BG, paddingVertical: 16, paddingHorizontal: 20, marginTop: 4, marginBottom: 8 },
  abstractLabel: { fontFamily: "Lora", fontSize: 13, color: BURGUNDY, marginBottom: 7 },
  abstractBody: { fontFamily: "Inter", fontSize: 9.4, color: INK_BODY, lineHeight: 1.55 },
  partNum: { fontFamily: "IBMPlexMono", fontSize: 8, color: BURGUNDY, letterSpacing: 1.4, textTransform: "uppercase", marginBottom: 6 },
  partTitle: { fontFamily: "Lora", fontSize: 22, color: INK_TITLE, lineHeight: 1.15, letterSpacing: -0.2, marginBottom: 4 },
  partRule: { borderTopWidth: 1.2, borderTopColor: BURGUNDY, marginTop: 10, marginBottom: 14 },
  h2: { fontFamily: "Lora", fontSize: 14, color: INK_TITLE, marginTop: 14, marginBottom: 7 },
  h3: { fontFamily: "Inter", fontSize: 9.6, fontWeight: 600, color: BURGUNDY, marginTop: 10, marginBottom: 4 },
  para: { fontFamily: "Inter", fontSize: 9.5, color: INK_BODY, lineHeight: 1.55, marginBottom: 8, maxWidth: 660 },
  bold: { fontWeight: 500 },
  caption: { fontFamily: "Inter", fontSize: 8, color: FAINT, lineHeight: 1.4, marginBottom: 6, maxWidth: 760 },
  subHead: { fontFamily: "Lora", fontSize: 12.5, color: INK_TITLE, marginTop: 4, marginBottom: 1 },
  subMeta: { fontFamily: "IBMPlexMono", fontSize: 7.4, color: MUTE, letterSpacing: 0.3, marginBottom: 5 },
  table: { borderTopWidth: 1.3, borderTopColor: BURGUNDY, borderBottomWidth: 1.3, borderBottomColor: BURGUNDY, marginTop: 5, marginBottom: 12 },
  thRow: { flexDirection: "row", backgroundColor: BURGUNDY },
  tdRow: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: "#f2ece7" },
  tdRowZebra: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: "#f2ece7", backgroundColor: ZEBRA },
  th: { fontFamily: "IBMPlexMono", fontSize: 6.8, color: "#fff", letterSpacing: 0.3 },
  tdText: { fontFamily: "Inter", fontSize: 8, color: INK_SUB, lineHeight: 1.3 },
  tdMono: { fontFamily: "IBMPlexMono", fontSize: 8, color: "#2b1f1f", lineHeight: 1.25 },
  tdMonoMute: { fontFamily: "IBMPlexMono", fontSize: 7.6, color: MUTE, lineHeight: 1.25 },
  tdHmtc: { fontFamily: "IBMPlexMono", fontSize: 8.2, color: BURGUNDY, fontWeight: 500, lineHeight: 1.25 },
  footer: { position: "absolute", bottom: 24, left: 46, right: 46, fontFamily: "IBMPlexMono", fontSize: 6.6, color: FAINT, textAlign: "center" },
})

// ── NaN-safe table primitives ────────────────────────────────────────────────
const pct = (w) => { const t = w.reduce((a, b) => a + b, 0); return w.map((x) => `${(x / t) * 100}%`) }
const alignFor = (a) => (a === "right" ? "flex-end" : a === "center" ? "center" : "flex-start")
const Cell = (content, width, align, textStyle, key) =>
  h(View, { key, style: { width, paddingVertical: 3.2, paddingHorizontal: 5, flexDirection: "row", justifyContent: alignFor(align) } },
    Array.isArray(content) ? content : h(Text, { style: [textStyle, { textAlign: align || "left" }] }, content))
const Row = (cells, widths, rowStyle, key) => h(View, { key, style: rowStyle, wrap: false }, cells.map((c, i) => Cell(c.t, widths[i], c.a, c.s, i)))

function runs(str) {
  const out = []; const re = /\*\*([^*]+)\*\*/g; let last = 0, m
  while ((m = re.exec(str))) { if (m.index > last) out.push({ t: str.slice(last, m.index) }); out.push({ t: m[1], b: true }); last = re.lastIndex }
  if (last < str.length) out.push({ t: str.slice(last) })
  return out.length ? out : [{ t: str }]
}
const Inline = (str, style, key) => h(Text, { key, style }, runs(str).map((r, i) => h(Text, { key: i, style: r.b ? s.bold : undefined }, r.t)))
const Para = (str, key) => Inline(str, s.para, key)

// ── cell semantics from a compiled record ────────────────────────────────────
const SHORT = { Pb: "Pb", iAs: "iAs", tAs: "tAs", tHg: "Hg", MeHg: "MeHg", Cd: "Cd", Cr: "Cr", "Cr-VI": "Cr-VI", Ni: "Ni", Sn: "Sn", Al: "Al" }
const PANEL = META.panel
const TIER1 = new Set(META.tier1 || []), TIER2 = new Set(META.tier2 || [])
const basisWord = (b) => (b === "as_sold" ? "as sold" : "as consumed")
const cellVal = (c) => (c == null ? "—" : c.value == null ? (c.type === "not_material" ? "n/m" : c.type === "control" ? "ctrl" : "—") : String(c.value))
function feedFloor(c) {
  if (!c || !Array.isArray(c.feed_floor) || !c.feed_floor.length) return "—"
  const m = c.feed_floor.reduce((a, b) => (a && Number(a.value) <= Number(b.value) ? a : b))
  return `${m.jurisdiction} ${Number(m.value).toLocaleString("en-US")}`
}
function derivBasis(c) {
  if (c == null) return "—"
  if (c.type === "read_across") {
    const scope = (c.analog_scope || c.analog_label || "").replace(/\s+/g, " ").trim()
    const jur = c.source_jurisdiction || "?"
    return scope ? `${jur} · ${scope.length > 62 ? scope.slice(0, 60) + "…" : scope}` : jur
  }
  if (c.type === "not_material") return "not material — controlled by reflex speciation"
  if (c.type === "control") return "measured surveillance control (no sovereign ceiling)"
  return "—"
}

// ── cover ────────────────────────────────────────────────────────────────────
const Cover = () => [
  h(Text, { key: "m", style: s.masthead }, "Heavy Metal Tested & Certified  ·  Program Manual"),
  h(View, { key: "r", style: s.ruleBurgundy }),
  h(Text, { key: "t", style: s.coverTitle }, "Pet Foods"),
  h(Text, { key: "sub", style: s.coverSub }, "Category 17 · 2026 Edition · 10 subcategories"),
  h(Text, { key: "meth", style: s.coverMethod }, "Human-grade over-compliance — Method v2.0"),
  h(View, { key: "prov", style: s.provBox }, [
    h(Text, { key: "l", style: s.provLabel }, "Provisional edition — not yet DOI-registered"),
    h(Text, { key: "t", style: s.provText },
      "This is a provisional edition issued ahead of formal registration. Every limit is current and identical to the live standard at heavymetalcertified.com/manuals/pet-foods and to the per-subcategory standard pages; a version-pinned edition with a registered DOI is in preparation. Cite the URL, not a DOI, until the registered edition is released."),
  ]),
  h(View, { key: "auth", style: s.coverBlock }, [
    h(Text, { key: "l", style: s.label }, "Author & publisher"),
    h(Text, { key: "t", style: s.coverText }, "Karen Pendergrass · ORCID 0000-0002-2348-7259\nInstitute of Contaminant Standards (ICS) · Heavy Metal Tested & Certified"),
  ]),
  h(View, { key: "ed", style: s.coverBlock }, [
    h(Text, { key: "l", style: s.label }, "Edition"),
    h(Text, { key: "t", style: s.coverText }, `2026 Edition · effective ${EDITION_DATE} · 10 subcategories · 11 analytes (Pb, Cd, tAs, iAs, tHg, MeHg, Ni, Sn, Al, Cr, Cr-VI)`),
  ]),
  h(View, { key: "ab", style: s.abstractBox }, [
    h(Text, { key: "l", style: s.abstractLabel }, "About this standard"),
    h(Text, { key: "b", style: s.abstractBody },
      "The Heavy Metal Tested & Certified standard for Category 17, Pet Foods. Pet food is legally feed, whose heavy-metal ceilings run well above human food; HMTc does not certify to that feed floor. Each limit is the strictest human-food sovereign maximum for the nearest analog, adopted as a voluntary human-grade over-compliance — the pet-feed floor is disclosed on every analyte and never selects the number. This volume states the methodology, the master limit matrix for all ten subcategories, and each subcategory's per-analyte derivation. Every number is identical to the web edition; nothing is selected from measured data."),
  ]),
  h(Text, { key: "cite", style: [s.coverText, { marginTop: 8 }] }, `Cite as: Pendergrass, K. HMTc Pet Foods Program Manual (provisional edition). Institute of Contaminant Standards (ICS), 2026. ${BASE_URL}. CC BY 4.0.`),
]

// ── methodology + how-to-read ────────────────────────────────────────────────
const Methodology = () => [
  h(View, { key: "hd", wrap: false }, [
    h(Text, { key: "n", style: s.partNum }, "Part 1"),
    h(Text, { key: "t", style: s.partTitle }, "How the limits are set"),
    h(View, { key: "r", style: s.partRule }),
  ]),
  Para(META.manual_method_note.replace(/&mdash;/g, "—").replace(/&rsquo;/g, "’").replace(/&nbsp;/g, " "), "mn"),
  h(Text, { key: "h-read", style: s.h3 }, "How to read this standard"),
  Para("Every limit is a **maximum level for the finished product** in that subcategory's **native basis** — dry products as sold, wet products as consumed. A limit is not an ingredient specification: an ingredient (including a novel protein such as a precision-fermented, yeast-expressed animal-protein equivalent) is assessed by its **contribution to the finished product** at its inclusion rate. A supplier can back-calculate a defensible ingredient ceiling from the finished-product limit and the intended inclusion rate, and should control the heavy-metal load of its own feedstock and fermentation media accordingly.", "read1"),
  Para("**Tier 1 toxics (Pb, Cd, iAs, Hg)** are zero-tolerance — there is no safe threshold, so the limit is the compliance line. **Tier 2 (tAs, Ni, Cr, Al, Sn)** carry the program's 150% transitional allowance. **iAs** and **Cr-VI** are reflex speciation screens bounded by total arsenic and total chromium; **MeHg** has no terrestrial pathway and is bounded by total mercury; **tin** is material only for canned product, where it migrates from the tin-coated can. In the tables that follow, **n/m** marks a not-material analyte (controlled by reflex speciation, not a number) and **ctrl** a measured surveillance control for which no government sets a ceiling.", "read2"),
]

// ── master matrix (landscape) ────────────────────────────────────────────────
function MasterMatrix() {
  const widths = pct([3.0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.15, 1.5])
  const header = [{ t: "Subcategory", a: "left", s: s.th }, ...PANEL.map((a) => ({ t: SHORT[a] || a, a: "right", s: s.th })), { t: "Basis", a: "left", s: s.th }]
  const rows = PAGES.map((p, ri) => {
    const v = p.rec.variants[p.variant] || p.rec.variants[Object.keys(p.rec.variants)[0]]
    const cells = [{ t: p.name, a: "left", s: s.tdText }, ...PANEL.map((a) => ({ t: cellVal(v[a]), a: "right", s: s.tdMono })), { t: basisWord(p.rec.native_basis), a: "left", s: s.tdMonoMute }]
    return Row(cells, widths, ri % 2 ? s.tdRowZebra : s.tdRow, `r${ri}`)
  })
  return [
    h(View, { key: "hd", wrap: false }, [
      h(Text, { key: "n", style: s.partNum }, "Part 2"),
      h(Text, { key: "t", style: s.partTitle }, "Master limit matrix"),
      h(View, { key: "r", style: s.partRule }),
      h(Text, { key: "cap", style: s.caption }, "All values µg/kg (ppb) in each row's native basis. n/m = not material (reflex speciation); ctrl = measured surveillance control, no numeric ceiling; — = not applicable. Each subcategory's full derivation follows in Part 3."),
    ]),
    h(View, { key: "t", style: s.table }, [Row(header, widths, s.thRow, "h"), ...rows]),
  ]
}

// ── per-subcategory derivations (landscape) ──────────────────────────────────
function SubDeriv(p, idx) {
  const v = p.rec.variants[p.variant] || p.rec.variants[Object.keys(p.rec.variants)[0]]
  const widths = pct([1.25, 0.7, 0.95, 3.4, 1.25])
  const header = [
    { t: "Analyte", a: "left", s: s.th }, { t: "Tier", a: "left", s: s.th },
    { t: "HMTc limit", a: "right", s: s.th }, { t: "Human-food basis of the limit (read-across analog)", a: "left", s: s.th },
    { t: "Pet-feed floor", a: "right", s: s.th },
  ]
  const rows = PANEL.map((a, ri) => {
    const c = v[a]
    const tier = TIER1.has(a) ? "1" : TIER2.has(a) ? "2" : ""
    const cells = [
      { t: `${SHORT[a] || a}`, a: "left", s: s.tdText }, { t: tier, a: "left", s: s.tdMonoMute },
      { t: cellVal(c), a: "right", s: s.tdHmtc }, { t: derivBasis(c), a: "left", s: s.tdText },
      { t: feedFloor(c), a: "right", s: s.tdMonoMute },
    ]
    return Row(cells, widths, ri % 2 ? s.tdRowZebra : s.tdRow, `r${ri}`)
  })
  return h(View, { key: `d${idx}`, wrap: false, style: { marginBottom: 15 } }, [
    h(Text, { key: "nm", style: s.subHead }, `3.${idx + 1}  ${p.name}`),
    h(Text, { key: "mt", style: s.subMeta }, `${basisWord(p.rec.native_basis)} · human-grade over-compliance · feed floor disclosed`),
    h(View, { key: "t", style: s.table }, [Row(header, widths, s.thRow, "h"), ...rows]),
  ])
}

const PartThreeHead = () => h(View, { key: "p3", wrap: false }, [
  h(Text, { key: "n", style: s.partNum }, "Part 3"),
  h(Text, { key: "t", style: s.partTitle }, "Per-subcategory derivations"),
  h(View, { key: "r", style: s.partRule }),
  h(Text, { key: "cap", style: s.caption }, "For each subcategory, every analyte's HMTc limit, the human-food sovereign maximum it is read across from, and the pet-FEED floor it beats (disclosed for contrast, never selected). Values in µg/kg, native basis stated per subcategory."),
])

// ── document ─────────────────────────────────────────────────────────────────
const footer = (label) => h(Text, { key: "footer", style: s.footer, fixed: true, render: ({ pageNumber, totalPages }) => `${label}   ·   ${pageNumber} / ${totalPages}   ·   ${BASE_URL}` })

const doc = h(Document, { title: "HMTc Pet Foods Program Manual (provisional)", author: "Karen Pendergrass", subject: "Heavy Metal Certified", creator: "Heavy Metal Certified" }, [
  h(Page, { key: "cover", size: "A4", style: s.pagePortrait }, [...Cover(), footer("HMTc Pet Foods · Provisional edition")]),
  h(Page, { key: "method", size: "A4", style: s.pagePortrait }, [...Methodology(), footer("HMTc Pet Foods · Provisional edition")]),
  h(Page, { key: "matrix", size: "A4", orientation: "landscape", style: s.pageLand }, [...MasterMatrix(), footer("HMTc Pet Foods · Master matrix")]),
  h(Page, { key: "deriv", size: "A4", orientation: "landscape", style: s.pageLand }, [PartThreeHead(), ...PAGES.map((p, i) => SubDeriv(p, i)), footer("HMTc Pet Foods · Derivations")]),
])

fs.mkdirSync(OUT_DIR, { recursive: true })
await renderToFile(doc, OUT)
const kb = (fs.statSync(OUT).size / 1024).toFixed(0)
console.log(`build-cat17-manual-pdf: wrote ${path.relative(REPO, OUT)} (${kb} KB, ${PAGES.length} subcategories)`)
