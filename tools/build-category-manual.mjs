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

const REPO = process.cwd()
const args = new Map((process.argv.slice(2)).map((a) => { const [k, v] = a.replace(/^--/, "").split("="); return [k, v ?? true] }))
const DOC = JSON.parse(fs.readFileSync(path.join(REPO, args.get("pages")), "utf8"))
const META = DOC._meta
const COMPILED = path.join(REPO, "data/standards", META.compiled_dir)
const OUT = path.join(REPO, `content/manuals/${META.manual_slug}.md`)
const OCC = JSON.parse(fs.readFileSync(path.join(REPO, "data/standards/occurrence-evidence.json"), "utf8"))
const LINK = "#1c43ad", ACCENT = "#9f2727"

const SHORT = { Pb: "Pb", iAs: "iAs", tAs: "tAs", tHg: "Hg", MeHg: "MeHg", Cd: "Cd", Cr: "Cr", "Cr-VI": "Cr-VI", Ni: "Ni", Sn: "Sn", Al: "Al" }
const PANEL = META.panel
const cell = (c) => (c == null ? "—" : c.value == null ? (c.type === "not_material" ? "n/m" : "—") : String(c.value))

const recCache = new Map()
const readRec = (r) => { if (!recCache.has(r)) recCache.set(r, JSON.parse(fs.readFileSync(path.join(COMPILED, `${r}.json`), "utf8"))); return recCache.get(r) }

function valuesFor(page) {
  const parts = page.variants.map((v) => { const rec = readRec(v.record); return { label: v.label, cells: rec.variants[v.variant] || rec.variants[Object.keys(rec.variants)[0]], native: rec.native_basis } })
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

const struggleHtml = renderStruggleSection({
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

const railBody = pdfFile
  ? `Web edition current — ${numWord} subcategories, ${META.effective_date} (Method v2.0). A provisional PDF edition (values current, DOI pending) is downloadable here; a version-pinned, DOI-registered edition follows. Full edition history below.`
  : `Web edition current — ${numWord} subcategories, ${META.effective_date} (Method v2.0). A consolidated, version-pinned PDF is in preparation and a DOI is minted on deposit. Full edition history below.`

const editionPdfLine = pdfFile
  ? `A provisional PDF edition of the full manual is available in the rail — its values are current and identical to these pages; a version-pinned, DOI-registered edition is in preparation.`
  : `A consolidated, version-pinned PDF of the full manual is in preparation and will be linked here on release; until then each subcategory page is individually citable.`

const page = renderManualPage({
  title: `${META.category_name} — HMTc Program Manual`,
  category: META.category,
  categoryName: META.category_name,
  description: `The complete Heavy Metal Tested & Certified standard for Category ${META.category}, ${META.category_name}, edition 2026.`,
  snapshot: [
    { k: "Subcategories", v: String(n) },
    { k: "Analyte panel", v: `${PANEL.length} analytes` },
    { k: "Method", v: "Strictest government ML" },
    { k: "Web edition", v: String(META.effective_date) },
  ],
  connections: [
    { label: "The standards register", href: "/standards" },
    { label: "Method v1 to Method v2", href: "/program/method" },
    { label: "How limits are derived", href: "/program/structure" },
    { label: "Verify a certificate", href: "/verify" },
    { label: "All Program Manuals", href: "/manuals" },
    { label: "Heavy Metal Index — literature baseline", href: "https://heavymetalindex.com" },
  ],
  pdfHref,
  pdfCover: cover?.rel ?? null,
  socialImage: og?.rel ?? null,
  ogImageWidth: og?.width ?? (og ? 1200 : null),
  ogImageHeight: og?.height ?? (og ? 630 : null),
  editionChip: "2026 edition · Method v2",
  manualSlug: META.manual_slug,
  pdfLabel: `Download PDF · ${META.effective_date}`,
  railBody,
  effectiveDate: String(META.effective_date),
  updated: String(META.effective_date),
  methodNoteHtml: META.manual_method_note,
  matrix: {
    analytes: PANEL.map((a) => ({ key: a, col: SHORT[a] || a })),
    rows,
    note: `All values ppb (&micro;g/kg) in each row&rsquo;s native basis. Click any subcategory for its full government-by-government derivation. n/m = not material in the matrix; controlled by screen or reflex speciation, not a number.`,
  },
  struggleHtml,
  editionPdfLine,
})

fs.mkdirSync(path.dirname(OUT), { recursive: true })
fs.writeFileSync(OUT, page)
console.log(`build-category-manual [${META.category_name}]: wrote ${path.relative(REPO, OUT)} (${n} subcategories, pdf ${pdfFile ? "served" : "pending"})`)
