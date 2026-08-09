#!/usr/bin/env node
// build-cat1-manual-pdf.mjs — render the consolidated Infant and Child Foods
// (Category 1) Program Manual to a real paginated PDF, in the approved HMTc
// scholarly design (Lora headings, IBM Plex Mono for measured values, burgundy
// #9f2727), at content/static/manuals/HMTc-Infant-and-Child-Foods-Program-Manual-2026-v2.pdf.
//
// WHY IT EXISTS. The web manual (content/manuals/infant-and-child-foods.md) is the
// current 9-subcategory Method v2.0 edition; the only deposited PDF is the stale
// 384-page single-subcategory volume, which must never be served against it. This
// generates the CURRENT edition as a downloadable, citable, self-contained artifact.
//
// HOW IT CANNOT DRIFT. Every number — the master matrix and every per-subcategory
// government-by-government derivation — comes from tools/lib/cat1-manual-data.mjs,
// the exact module the web renderers read. The two are the same arrays.
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
import { ANALYTES, masterMatrix, allDerivations, JUR_LABEL } from "./lib/cat1-manual-data.mjs"

registerFonts()
const h = React.createElement
const REPO = process.cwd()

const OUT_DIR = path.join(REPO, "content/static/manuals")
const OUT_FILE = "HMTc-Infant-and-Child-Foods-Program-Manual-2026-v2.pdf"
const OUT = path.join(OUT_DIR, OUT_FILE)
const VH = JSON.parse(fs.readFileSync(path.join(REPO, "data/standards/version-history/infant-and-child-foods.json"), "utf8"))
const BASE_URL = "https://heavymetalcertified.com/manuals/infant-and-child-foods"

// ── colours (the approved scholarly palette, HMTc red) ───────────────────────
const INK_TITLE = "#1e1418"
const INK_BODY = "#241c20"
const INK_SUB = "#2b1f24"
const BURGUNDY = "#9f2727"
const BURGUNDY_DK = "#7d1f1f"
const MUTE = "#4a4246"
const FAINT = "#8a8288"
const ABSTRACT_BG = "#fdf4f3"
const RULE_FAINT = "#f2ece7"
const RULE_MED = "#e8e1db"
const ZEBRA = "#fbf7f5"

// The current edition's date + label, read from the version record (deterministic —
// no Date.now(), which react-pdf's builder forbids).
const current = VH.versions.find((v) => v.status === "current") || VH.versions[0]
const EDITION_LABEL = current.label
const EDITION_DATE = current.date

const s = StyleSheet.create({
  pagePortrait: { paddingTop: 54, paddingBottom: 54, paddingHorizontal: 58, fontFamily: "Inter", fontSize: 9.5, color: INK_BODY, lineHeight: 1.5 },
  pageLand: { paddingTop: 44, paddingBottom: 46, paddingHorizontal: 46, fontFamily: "Inter", fontSize: 9, color: INK_BODY, lineHeight: 1.45 },

  masthead: { fontFamily: "IBMPlexMono", fontSize: 8, color: BURGUNDY, letterSpacing: 1.2, textTransform: "uppercase" },
  ruleBurgundy: { borderTopWidth: 1.5, borderTopColor: BURGUNDY, marginTop: 8, marginBottom: 20 },
  ruleThin: { borderTopWidth: 0.75, borderTopColor: RULE_MED, marginTop: 16, marginBottom: 14 },

  coverTitle: { fontFamily: "Lora", fontSize: 34, color: INK_TITLE, lineHeight: 1.12, letterSpacing: -0.3, marginBottom: 12 },
  coverSub: { fontFamily: "Lora", fontSize: 15, color: INK_SUB, marginBottom: 22 },
  coverMethod: { fontFamily: "IBMPlexMono", fontSize: 9, color: BURGUNDY, letterSpacing: 0.4, marginBottom: 26 },
  label: { fontFamily: "IBMPlexMono", fontSize: 7, color: BURGUNDY, letterSpacing: 0.9, textTransform: "uppercase", marginBottom: 4 },
  coverBlock: { marginBottom: 14 },
  coverText: { fontFamily: "Inter", fontSize: 9, color: MUTE, lineHeight: 1.55 },

  abstractBox: { backgroundColor: ABSTRACT_BG, paddingVertical: 16, paddingHorizontal: 20, marginTop: 6, marginBottom: 8 },
  abstractLabel: { fontFamily: "Lora", fontSize: 13, color: BURGUNDY, marginBottom: 7 },
  abstractBody: { fontFamily: "Inter", fontSize: 9.6, color: INK_BODY, lineHeight: 1.55 },

  h2: { fontFamily: "Lora", fontSize: 17, color: INK_TITLE, marginTop: 6, marginBottom: 9 },
  sectionHead: { fontFamily: "IBMPlexMono", fontSize: 9.5, color: BURGUNDY, letterSpacing: 0.4, marginBottom: 5, marginTop: 4 },
  para: { fontFamily: "Inter", fontSize: 9.5, color: INK_BODY, lineHeight: 1.55, marginBottom: 8, maxWidth: 560 },
  paraLand: { fontFamily: "Inter", fontSize: 9, color: INK_BODY, lineHeight: 1.5, marginBottom: 6 },
  caption: { fontFamily: "Inter", fontSize: 8, color: FAINT, lineHeight: 1.4, marginBottom: 5, maxWidth: 700 },
  footnote: { fontFamily: "IBMPlexMono", fontSize: 7.2, color: FAINT, lineHeight: 1.55, marginTop: 7, maxWidth: 680 },
  variantNote: { fontFamily: "Inter", fontStyle: "italic", fontSize: 8, color: MUTE, lineHeight: 1.45, marginTop: 6, maxWidth: 680 },

  // tables
  table: { borderTopWidth: 1.4, borderTopColor: BURGUNDY, borderBottomWidth: 1.4, borderBottomColor: BURGUNDY, marginTop: 5, marginBottom: 4 },
  thRow: { flexDirection: "row", backgroundColor: BURGUNDY },
  tdRow: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: RULE_FAINT },
  tdRowZebra: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: RULE_FAINT, backgroundColor: ZEBRA },
  th: { fontFamily: "IBMPlexMono", fontSize: 7, color: "#fff", letterSpacing: 0.3 },
  thHmtc: { fontFamily: "IBMPlexMono", fontSize: 7, color: "#fff", letterSpacing: 0.3 },
  tdText: { fontFamily: "Inter", fontSize: 8, color: INK_SUB, lineHeight: 1.2 },
  tdMono: { fontFamily: "IBMPlexMono", fontSize: 8, color: "#2b1f1f", lineHeight: 1.2 },
  tdMonoMute: { fontFamily: "IBMPlexMono", fontSize: 8, color: MUTE, lineHeight: 1.2 },
  tdMonoFaint: { fontFamily: "IBMPlexMono", fontSize: 8, color: "#d8cfca", lineHeight: 1.2 },
  tdHmtc: { fontFamily: "IBMPlexMono", fontSize: 8, color: "#2b1f1f", fontWeight: 500, lineHeight: 1.2 },

  footer: { position: "absolute", bottom: 24, left: 46, right: 46, fontFamily: "IBMPlexMono", fontSize: 6.6, color: FAINT, textAlign: "center" },
  footerP: { position: "absolute", bottom: 28, left: 58, right: 58, fontFamily: "IBMPlexMono", fontSize: 6.6, color: FAINT, textAlign: "center" },
})

// ── NaN-safe table primitives (idiom from tools/pdf/scholarly-pdf.mjs) ────────
// Percentage widths (never flexGrow/flexBasis:0, which Yoga can resolve to NaN);
// each cell is a width-bearing View wrapping an auto-width Text; rows are wrap:false.
const pct = (weights) => {
  const total = weights.reduce((a, b) => a + b, 0)
  return weights.map((w) => `${(w / total) * 100}%`)
}
const alignFor = (a) => (a === "right" ? "flex-end" : a === "center" ? "center" : "flex-start")
function Cell(content, width, align, textStyle, key) {
  return h(
    View,
    { key, style: { width, paddingVertical: 2.6, paddingHorizontal: 6, flexDirection: "row", justifyContent: alignFor(align) } },
    h(Text, { style: [textStyle, { textAlign: align || "left" }] }, content),
  )
}
function Row(cells, widths, rowStyle, key) {
  return h(
    View,
    { key, style: rowStyle, wrap: false },
    cells.map((c, i) => Cell(c.t, widths[i], c.a, c.s, i)),
  )
}

// ── superscript markers (¹ converted · ² read-across · ³ not-material) ────────
const SUP = { conv: "¹", read: "²", nm: "³" }

// ── model built from the shared lib (identical to the web edition) ───────────
const MATRIX = masterMatrix()
const DERIV = allDerivations()

// ── methodology note (Method v2.0), mirroring /program/structure + the web lede
const METHOD_PARAS = [
  "Every limit in this manual is the strictest maximum level (ML) set by any credible government regulator worldwide — the European Union, the United Kingdom, Codex Alimentarius, Health Canada, China, India, Brazil, the Gulf states (GSO), Australia/New Zealand, the US FDA, and others — expressed in the product's own native basis. It is a lookup of sovereign law, not a modelled or negotiated figure: a certified product sits at or below every applicable government limit at once.",
  "The powder-to-liquid conversion is applied at the single 8:1 ratio a government actually legislates (China GB 2762), and only within infant formula, where powder and ready-to-feed forms are the same product at two dilutions. Every other subcategory takes government limits at face value in its own basis; no reconstitution factor is invented for a food that is eaten as sold.",
  "The eight analytes are tiered. Tier 1 — lead, cadmium, inorganic arsenic and mercury — are zero-tolerance toxics with no established safe threshold and carry no transitional allowance at any margin. Tier 2 — nickel, aluminium, tin and total chromium — carry the program's 150% transitional allowance under the Status A–E framework, with a stated end date and corrective action.",
  "Chromium is screened as total chromium at the limit shown; hexavalent chromium, the toxic species, is controlled through it — mandatory Cr(VI) speciation on any total-chromium result above the screening trigger, and any quantifiable Cr(VI) is a hard fail. Where an analyte is not regulated for a product and is not material in that matrix it is marked n/m and controlled by this reflex speciation, not assigned an invented number.",
  "Where no government regulates the exact product for an analyte, the limit is read across from the nearest government value for an analogous product, disclosed as such, so a certified product still sits at or below a real sovereign limit rather than an unbounded gap. Limits tighten after publication through the Standards Ratchet as surveillance warrants; they do not loosen.",
]

// ── cover ────────────────────────────────────────────────────────────────────
function Cover() {
  return [
    h(Text, { key: "m", style: s.masthead }, "Heavy Metal Tested & Certified  ·  Program Manual"),
    h(View, { key: "r", style: s.ruleBurgundy }),
    h(Text, { key: "t", style: s.coverTitle }, "Infant and Child Foods"),
    h(Text, { key: "sub", style: s.coverSub }, "Category 1 · Ages 0–5 · 2026 Edition"),
    h(Text, { key: "meth", style: s.coverMethod }, "Government-limit default — Method v2.0"),
    h(View, { key: "auth", style: s.coverBlock }, [
      h(Text, { key: "l", style: s.label }, "Author & publisher"),
      h(Text, { key: "t", style: s.coverText }, "Karen Pendergrass · ORCID 0000-0002-2348-7259\nInstitute of Contaminant Standards (ICS) · Heavy Metal Tested & Certified"),
    ]),
    h(View, { key: "ed", style: s.coverBlock }, [
      h(Text, { key: "l", style: s.label }, "Edition"),
      h(Text, { key: "t", style: s.coverText }, `${EDITION_LABEL} · ${EDITION_DATE} · nine subcategories · eight analytes (Pb, iAs, Hg, Cd, Cr, Ni, Sn, Al)`),
    ]),
    h(View, { key: "ab", style: s.abstractBox }, [
      h(Text, { key: "l", style: s.abstractLabel }, "About this manual"),
      h(
        Text,
        { key: "b", style: s.abstractBody },
        "The complete Heavy Metal Tested & Certified standard for Category 1, Infant and Child Foods. It presents all nine subcategory standards as one master limit matrix and gives each its full derivation, government by government. Every number traces to a named sovereign limit; nothing is invented. This is the current web edition rendered as a citable, self-contained volume — the numbers are identical to heavymetalcertified.com/manuals/infant-and-child-foods.",
      ),
    ]),
    h(Text, { key: "cite", style: [s.coverText, { marginTop: 10 }] }, `Cite as: Pendergrass, K. HMTc Infant and Child Foods Program Manual. ${EDITION_LABEL}. Institute of Contaminant Standards (ICS), 2026. ${BASE_URL}. CC BY 4.0 (prose).`),
  ]
}

// ── methodology ───────────────────────────────────────────────────────────────
function Methodology() {
  const children = [h(Text, { key: "hd", style: s.h2 }, "Method v2.0 — how every number is set")]
  METHOD_PARAS.forEach((p, i) => children.push(h(Text, { key: `p${i}`, style: s.para }, p)))
  children.push(
    h(Text, { key: "leg", style: s.footnote },
      `Notation used throughout the derivations. ${SUP.conv} basis-converted at the 8:1 powder-to-liquid ratio (China GB 2762). ${SUP.read} read-across: no government sets this analyte for this exact product; the value is read across from the nearest government value for an analogous product. ${SUP.nm} n/m — not material in this matrix; controlled by reflex Cr(VI) speciation, not a standalone number. All values in µg/kg (ppb).`),
  )
  return h(View, { key: "method" }, children)
}

// ── master limit matrix (landscape) ──────────────────────────────────────────
function MasterMatrix() {
  // Subcategory + 8 analytes + Basis. Subcategory + Basis get extra weight.
  const widths = pct([3.1, 1, 1, 1, 1, 1, 1.35, 1, 1.35, 1.5])
  const header = [
    { t: "Subcategory", a: "left", s: s.th },
    ...ANALYTES.map((a) => ({ t: a.col, a: "right", s: s.th })),
    { t: "Basis", a: "left", s: s.th },
  ]
  const rows = MATRIX.map((row, ri) => {
    const cells = [
      { t: row.name, a: "left", s: s.tdText },
      ...ANALYTES.map((a) => ({ t: row.cells[a.key], a: "right", s: s.tdMono })),
      { t: row.basis, a: "left", s: s.tdMonoMute },
    ]
    return Row(cells, widths, ri % 2 ? s.tdRowZebra : s.tdRow, `r${ri}`)
  })
  // break: start the matrix on a fresh landscape page so its header is at the top
  // (never stranded at a previous page foot) and the whole 9-row table stays together.
  return h(View, { key: "mm", break: true }, [
    h(Text, { key: "hd", style: s.h2 }, "Master limit matrix — all nine subcategories"),
    h(Text, { key: "cap", style: s.caption },
      "All values in µg/kg (ppb) in each row's native basis. Split cells show the formulation or matrix variants (cow/soy, rice/non-rice); n/m marks a not-material analyte controlled by reflex speciation. Each subcategory's full derivation follows."),
    h(View, { key: "t", style: s.table }, [
      Row(header, widths, s.thRow, "h"),
      ...rows,
    ]),
  ])
}

// ── per-subcategory derivations (landscape) ──────────────────────────────────
function Derivation(d, idx) {
  // Analyte + jurisdiction columns present + HMTc + Binds.
  const jurW = d.cols.map(() => 1)
  const widths = pct([2.5, ...jurW, 1.1, 1.5])
  const header = [
    { t: "Analyte", a: "left", s: s.th },
    ...d.cols.map((j) => ({ t: JUR_LABEL[j] || j, a: "right", s: s.th })),
    { t: "HMTc", a: "right", s: s.thHmtc },
    { t: "Binds", a: "left", s: s.th },
  ]
  const bodyRows = d.rows.map((row, ri) => {
    const jurCells = d.cols.map((j) => {
      const pc = row.perCountry[j]
      if (!pc) return { t: "—", a: "right", s: s.tdMonoFaint }
      const strict = row.type === "gov" && row.bindingJur === j
      return { t: pc.value + (pc.converted ? SUP.conv : ""), a: "right", s: strict ? [s.tdMono, { color: BURGUNDY }] : s.tdMonoMute }
    })
    const hmtcMark = row.type === "read_across" ? SUP.read : row.type === "not_material" ? SUP.nm : ""
    const cells = [
      { t: row.analyte, a: "left", s: s.tdText },
      ...jurCells,
      { t: (row.type === "not_material" ? "n/m" : String(row.hmtc)) + hmtcMark, a: "right", s: [s.tdHmtc, { backgroundColor: ZEBRA }] },
      { t: row.binds, a: "left", s: s.tdMonoMute },
    ]
    return Row(cells, widths, ri % 2 ? s.tdRowZebra : s.tdRow, `r${ri}`)
  })
  const children = [
    h(View, { key: "hdg", wrap: false }, [
      h(Text, { key: "hd", style: s.sectionHead }, `${idx + 1}  |  ${d.name}  (${d.basisWord})`),
      h(Text, { key: "cap", style: s.caption },
        `Every government maximum in force worldwide, in the ${d.basisWord} basis; the HMTc limit is the strictest and the Binds column names the law that sets it. A blank cell means that government sets no limit for this analyte in this product.`),
    ]),
    h(View, { key: "t", style: s.table }, [Row(header, widths, s.thRow, "h"), ...bodyRows]),
  ]
  if (d.variantNote) children.push(h(Text, { key: "vn", style: s.variantNote }, d.variantNote))
  // wrap:false keeps a subcategory's heading, caption and full table on one page —
  // never a stranded header or a table split mid-analyte. Each derivation is well
  // under a landscape page's height, so this is safe (no page-overflow crash).
  return h(View, { key: `d${idx}`, wrap: false, style: { marginBottom: 14 } }, children)
}

// ── edition record (portrait) ─────────────────────────────────────────────────
function EditionRecord() {
  const widths = pct([1.7, 1.1, 1.1, 1.7, 3.4])
  const header = [
    { t: "Edition", a: "left", s: s.th },
    { t: "Date", a: "left", s: s.th },
    { t: "Status", a: "left", s: s.th },
    { t: "DOI", a: "left", s: s.th },
    { t: "What changed", a: "left", s: s.th },
  ]
  const rows = VH.versions.map((v, ri) => {
    const doi = v.doi || v.doi_pending || "—"
    const cells = [
      { t: v.label, a: "left", s: s.tdText },
      { t: v.date, a: "left", s: s.tdMonoMute },
      { t: v.status === "current" ? "current" : v.status || "superseded", a: "left", s: v.status === "current" ? [s.tdMono, { color: BURGUNDY }] : s.tdMonoMute },
      { t: doi, a: "left", s: s.tdMonoMute },
      { t: v.summary || "", a: "left", s: s.tdText },
    ]
    return Row(cells, widths, ri % 2 ? s.tdRowZebra : s.tdRow, `r${ri}`)
  })
  const children = [
    h(Text, { key: "hd", style: s.h2 }, "Edition record"),
    h(Text, { key: "cap", style: s.caption },
      "The dated editions of this manual. Each is kept at a stable permalink so a regulator or brand can reconstruct exactly what the manual required on any date. This 2026 web edition is the current standard set; the 384-page deposited editions are prior, superseded volumes and are not served against it."),
    h(View, { key: "t", style: s.table }, [Row(header, widths, s.thRow, "h"), ...rows]),
  ]
  if (VH.concept_doi)
    children.push(h(Text, { key: "cd", style: s.footnote }, `The concept DOI ${VH.concept_doi} always resolves to the latest deposited edition. The current 2026 web edition has no DOI yet (Crossref deposit pending); this manual is citable by its permalink in the meantime.`))
  children.push(h(Text, { key: "cite", style: [s.para, { marginTop: 14 }] }, `Cite as: Pendergrass, K. HMTc Infant and Child Foods Program Manual. ${EDITION_LABEL}. Institute of Contaminant Standards (ICS), 2026. ${BASE_URL}. CC BY 4.0 (prose).`))
  return h(View, { key: "er" }, children)
}

// ── document ──────────────────────────────────────────────────────────────────
function ManualDocument() {
  const footerText = `Heavy Metal Certified  ·  Infant and Child Foods Program Manual  ·  ${EDITION_LABEL}  ·  ${BASE_URL}  ·  CC BY 4.0`
  return h(
    Document,
    { title: "HMTc Infant and Child Foods Program Manual", author: "Karen Pendergrass", subject: "Heavy Metal Certified", creator: "Heavy Metal Certified" },
    [
      // Cover — portrait
      h(Page, { key: "cover", size: "LETTER", style: s.pagePortrait }, [
        ...Cover(),
        h(Text, { key: "f", style: s.footerP, fixed: true }, footerText),
      ]),
      // Methodology + master matrix + derivations — landscape (wide tables). Each
      // major section starts a fresh page (break) rather than being separated by a
      // rule, so no header strands at a page foot and no table splits mid-row.
      h(Page, { key: "body", size: "LETTER", orientation: "landscape", style: s.pageLand }, [
        h(Methodology, { key: "method" }),
        h(MasterMatrix, { key: "mm" }),
        h(Text, { key: "dh", style: s.h2, break: true }, "Per-subcategory derivations"),
        ...DERIV.map((d, i) => Derivation(d, i)),
        h(Text, { key: "f", style: s.footer, fixed: true }, footerText),
      ]),
      // Edition record — portrait
      h(Page, { key: "edition", size: "LETTER", style: s.pagePortrait }, [
        h(EditionRecord, { key: "er" }),
        h(Text, { key: "f", style: s.footerP, fixed: true }, footerText),
      ]),
    ],
  )
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true })
  await renderToFile(h(ManualDocument), OUT)
  console.log(`build-cat1-manual-pdf: wrote ${path.relative(REPO, OUT)} (${MATRIX.length} subcategories, ${DERIV.length} derivations)`)
}

main().catch((err) => {
  console.error("build-cat1-manual-pdf: FAILED:", err.message)
  process.exit(1)
})
