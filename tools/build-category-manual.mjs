#!/usr/bin/env node
// Generalized Program Manual builder: render a category's manual landing page (master matrix of all
// subcategories × panel) in the canonical v3 design, from the compiled records + the category pages
// file's _meta block. Numbers come from data/standards/<compiled_dir>/<record>.json — deterministic,
// nothing authored here.
//
// The PAGE STRUCTURE is produced by the SHARED tools/lib/manual-page.mjs renderer — identical to
// build-cat1-manual.mjs — so every Program Manual is byte-identical in design; only the data differs.
// See [[project_manual_v3_canonical_design]].
//
// Usage: node tools/build-category-manual.mjs --pages=data/standards/seafood-pages.json

import fs from "node:fs"
import path from "node:path"
import { renderStruggleSection } from "./lib/struggle-section.mjs"
import { renderManualPage } from "./lib/manual-page.mjs"
import { resolveCover, resolveOgImage } from "./lib/document-cover.mjs"
import { resolveManualCertDoi, depositedCopy } from "./lib/manual-doi.mjs"

const REPO = process.cwd()
const args = new Map((process.argv.slice(2)).map((a) => { const [k, v] = a.replace(/^--/, "").split("="); return [k, v ?? true] }))
const argPath = (key) => {
  const v = args.get(key)
  if (!v || v === true) return null
  return path.resolve(REPO, v)
}
const pagesFile = argPath("pages")
if (!pagesFile) {
  console.error("build-category-manual: --pages= is required")
  process.exit(1)
}
const DOC = JSON.parse(fs.readFileSync(pagesFile, "utf8"))
const META = DOC._meta
const COMPILED = path.join(REPO, "data/standards", META.compiled_dir)
const OUT = argPath("out") || path.join(REPO, `content/manuals/${META.manual_slug}.md`)
const EXISTING = argPath("existing") || path.join(REPO, `content/manuals/${META.manual_slug}.md`)
const MANIFEST = argPath("manifest") || path.join(REPO, "data/manuals/manifest.json")
const VERSION_HISTORY = argPath("version-history") || path.join(REPO, "data/standards/version-history", `${META.manual_slug}.json`)

function readPageCertDoi(file) {
  if (!file || !fs.existsSync(file)) return null
  const m = fs.readFileSync(file, "utf8").match(/^cert_doi:\s*(.+)\s*$/m)
  return m ? m[1] : null
}
function readManifestDoi(file, slug) {
  if (!file || !fs.existsSync(file)) return null
  const man = JSON.parse(fs.readFileSync(file, "utf8"))
  const row = (man.manuals || []).find((m) => m.slug === slug)
  return row ? row.doi : null
}
function readVersionDoi(file) {
  if (!file || !fs.existsSync(file)) return null
  const vh = JSON.parse(fs.readFileSync(file, "utf8"))
  const cur = (vh.versions || []).find((v) => v.status === "current") || (vh.versions || [])[0]
  return cur ? cur.doi : null
}

const certDoi = resolveManualCertDoi({
  pageDoi: readPageCertDoi(EXISTING),
  configDoi: META.cert_doi,
  manifestDoi: readManifestDoi(MANIFEST, META.manual_slug),
  versionDoi: readVersionDoi(VERSION_HISTORY),
})
const OCC = JSON.parse(fs.readFileSync(path.join(REPO, "data/standards/occurrence-evidence.json"), "utf8"))
const LINK = "#1c43ad", ACCENT = "#9f2727"

const SHORT = { Pb: "Pb", iAs: "iAs", tAs: "tAs", tHg: "Hg", MeHg: "MeHg", Cd: "Cd", Cr: "Cr", "Cr-VI": "Cr-VI", Ni: "Ni", Sn: "Sn", Al: "Al" }
const PANEL = META.panel
const cell = (c) => (c == null ? "—" : c.value == null ? (c.type === "not_material" ? "n/m" : "—") : String(c.value))

const recCache = new Map()
const readRec = (r) => { if (!recCache.has(r)) recCache.set(r, JSON.parse(fs.readFileSync(path.join(COMPILED, `${r}.json`), "utf8"))); return recCache.get(r) }

function cellsOf(rec, variant) {
  // Cat 26 (and other flat compilers) store one `cells` object. Variant maps stay the default.
  if (rec.variants && typeof rec.variants === "object") {
    return rec.variants[variant] || rec.variants[Object.keys(rec.variants)[0]] || {}
  }
  return rec.cells || {}
}

function valuesFor(page) {
  const parts = page.variants.map((v) => { const rec = readRec(v.record); return { label: v.label, cells: cellsOf(rec, v.variant), native: rec.native_basis } })
  const out = {}
  for (const a of PANEL) {
    const vals = parts.map((p) => ({ label: p.label, v: cell(p.cells[a]) }))
    const uniq = [...new Set(vals.map((x) => x.v))]
    out[a] = uniq.length === 1 ? uniq[0] : vals.map((x) => `${x.v} ${x.label}`).join(" / ")
  }
  const basis = parts[0].native === "as_sold" ? "as sold" : "as consumed"
  return { out, basis }
}

const rows = DOC.pages.map((page) => {
  const { out, basis } = valuesFor(page)
  return { slug: page.slug, name: page.name, cells: out, basis }
})

const struggleHtml = META.risk_note_html
  ? `<section class="hmtc-section"><h2 id="hard" class="hmtc-h2" style="font-family:Lora,serif;font-weight:400;font-size:30px;line-height:1.2;color:#2b1f1f;border-bottom:1px solid #e8e1db;padding-bottom:10px">Risk Flag</h2>${META.risk_note_html}</section>`
  : renderStruggleSection({
    compiledDir: COMPILED, occurrence: OCC, categoryDirName: META.compiled_dir,
    categoryName: META.category_name, LINK, ACCENT,
  })

// A provisional PDF edition is offered ONLY when the config names one AND the file is present under
// content/static/manuals/. Values are current and identical to this page; the deposit just hasn't
// happened yet. Manuals without a download_pdf keep the "in preparation" language.
const pdfFile = META.download_pdf && fs.existsSync(path.join(REPO, "content/static/manuals", META.download_pdf)) ? META.download_pdf : null
const pdfHref = pdfFile ? `/static/manuals/${pdfFile}` : null
const cover = pdfFile ? resolveCover({ typeName: "manuals", slug: META.manual_slug }) : null
const og = pdfFile ? resolveOgImage({ typeName: "manuals", slug: META.manual_slug }) : null

const n = rows.length
const numWord = { 1: "one", 2: "two", 3: "three", 4: "four", 5: "five", 6: "six", 7: "seven", 8: "eight", 9: "nine", 10: "ten", 11: "eleven", 12: "twelve" }[n] || String(n)

const railBody = depositedCopy(META.rail_body || (pdfFile
  ? `Web edition current — ${numWord} subcategories, ${META.effective_date} (Method v2.0). A provisional PDF edition (values current, DOI pending) is downloadable here; a version-pinned, DOI-registered edition follows. Full edition history below.`
  : `Web edition current — ${numWord} subcategories, ${META.effective_date} (Method v2.0). A consolidated, version-pinned PDF is in preparation and a DOI is minted on deposit. Full edition history below.`), certDoi)

const editionPdfLine = depositedCopy(META.edition_pdf_line || (pdfFile
  ? `A provisional PDF edition of the full manual is available in the rail — its values are current and identical to these pages; a version-pinned, DOI-registered edition is in preparation.`
  : `A consolidated, version-pinned PDF of the full manual is in preparation and will be linked here on release; until then each subcategory page is individually citable.`), certDoi)

const scholarAbstract = depositedCopy(META.scholar_abstract || null, certDoi)

const extraFm = []
if (typeof META.doi_suffix === "string" && META.doi_suffix.trim()) {
  extraFm.push(`doi_suffix: ${JSON.stringify(META.doi_suffix.trim())}`)
  extraFm.push(`edition: ${JSON.stringify(META.edition || "Manual v1")}`)
  if (pdfFile) extraFm.push("scholar_pdf: true")
  if (META.methodology_version) extraFm.push(`methodology_version: ${JSON.stringify(META.methodology_version)}`)
}

const page = renderManualPage({
  title: META.page_title || `${META.category_name} — HMTc Program Manual`,
  category: META.category,
  categoryName: META.category_name,
  description: META.description || `The complete Heavy Metal Tested & Certified standard for Category ${META.category}, ${META.category_name}, edition 2026.`,
  scholarAbstract,
  keywords: Array.isArray(META.keywords) ? META.keywords : [],
  snapshot: [
    { k: "Subcategories", v: String(n) },
    { k: "Analyte panel", v: `${PANEL.length} analytes` },
    { k: "Method", v: META.method_snapshot || "Strictest government ML" },
    { k: "Web edition", v: String(META.effective_date) },
  ],
  connections: META.connections || [
    { label: "The standards register", href: "/standards" },
    { label: "Method v1 to Method v2", href: "/program/method" },
    { label: "How limits are derived", href: "/program/structure" },
    { label: "Verify a certificate", href: "/verify" },
    { label: "All Program Manuals", href: "/manuals" },
    { label: "Heavy Metal Index — literature baseline", href: "https://heavymetalindex.com" },
  ],
  certDoi,
  reportNumber: (typeof META.doi_suffix === "string" && META.doi_suffix.trim()) ? META.doi_suffix.trim() : undefined,
  extraFm,
  scopeLeadHtml: META.scope_lead_html,
  pdfHref,
  pdfCover: cover?.rel ?? null,
  socialImage: og?.rel ?? null,
  ogImageWidth: og?.width ?? (og ? 1200 : null),
  ogImageHeight: og?.height ?? (og ? 630 : null),
  editionChip: META.edition_chip || "2026 edition · Method v2",
  manualSlug: META.manual_slug,
  pdfLabel: META.pdf_label || `Download PDF · ${META.effective_date}`,
  railBody,
  effectiveDate: String(META.effective_date),
  updated: String(META.effective_date),
  methodNoteHtml: META.manual_method_note,
  matrix: {
    analytes: PANEL.map((a) => ({ key: a, col: SHORT[a] || a })),
    rows,
    note: META.matrix_note || `All values ppb (&micro;g/kg) in each row&rsquo;s native basis. Click any subcategory for its full government-by-government derivation. n/m = not material in the matrix; controlled by screen or reflex speciation, not a number.`,
  },
  struggleHtml,
  editionPdfLine,
})

fs.mkdirSync(path.dirname(OUT), { recursive: true })
fs.writeFileSync(OUT, page)
console.log(`build-category-manual [${META.category_name}]: wrote ${path.relative(REPO, OUT)} (${n} subcategories, pdf ${pdfFile ? "served" : "pending"}, doi ${certDoi || "null"})`)
