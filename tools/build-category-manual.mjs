#!/usr/bin/env node
// Generalized manual builder: render a category's Program Manual landing page (master matrix of all
// subcategories x panel) from the compiled records + the category pages file's _meta block. Category-
// driven successor to build-cat1-manual.mjs (which stays as-is for Cat-1). Numbers come from
// data/standards/<compiled_dir>/<record>.json — deterministic, nothing authored here.
//
// Usage: node tools/build-category-manual.mjs --pages=data/standards/seafood-pages.json

import fs from "node:fs"
import path from "node:path"

const REPO = process.cwd()
const args = new Map((process.argv.slice(2)).map((a) => { const [k, v] = a.replace(/^--/, "").split("="); return [k, v ?? true] }))
const DOC = JSON.parse(fs.readFileSync(path.join(REPO, args.get("pages")), "utf8"))
const META = DOC._meta
const COMPILED = path.join(REPO, "data/standards", META.compiled_dir)
const OUT = path.join(REPO, `content/manuals/${META.manual_slug}.md`)

const SHORT = { Pb: "Pb", iAs: "iAs", tAs: "tAs", tHg: "Hg", MeHg: "MeHg", Cd: "Cd", Cr: "Cr", "Cr-VI": "Cr-VI", Ni: "Ni", Sn: "Sn", Al: "Al" }
const PANEL = META.panel
const ACCENT = "#9f2727", LINK = "#1c43ad"
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

const th = (t, a) => `<th style="text-align:${a || "right"};padding:9px 10px;font-family:'IBM Plex Mono',monospace;font-size:9.5px;font-weight:500;letter-spacing:.06em">${t}</th>`
let bodyRows = ""
for (const page of DOC.pages) {
  const { out, basis } = valuesFor(page)
  const tds = PANEL.map((a) => `<td style="padding:9px 10px;text-align:right;font-family:'IBM Plex Mono',monospace;color:#2b1f1f">${out[a]}</td>`).join("")
  bodyRows += `<tr style="border-bottom:1px solid #f2ece7"><td style="padding:9px 12px"><a href="/standards/${page.slug}" style="color:${LINK};text-decoration:none">${page.name}</a></td>${tds}<td style="padding:9px 10px;font-size:11px;color:#a9a1a1">${basis}</td></tr>\n`
}
const matrix = `<div style="overflow-x:auto"><table style="width:100%;font-size:12.5px;border:1px solid #e8e1db;min-width:56rem;border-collapse:collapse"><thead><tr style="background:${ACCENT};color:#fff">${th("Subcategory", "left")}${PANEL.map((a) => th(SHORT[a] || a)).join("")}${th("Basis", "left")}</tr></thead><tbody>\n${bodyRows}</tbody></table></div>`

const n = DOC.pages.length
const numWord = { 1: "one", 2: "two", 3: "three", 4: "four", 5: "five", 6: "six", 7: "seven", 8: "eight", 9: "nine", 10: "ten", 11: "eleven", 12: "twelve" }[n] || String(n)

const fm = [
  "---",
  `title: "${META.category_name} — HMTc Program Manual"`,
  "type: standard",
  "custom_page: true",
  `category: ${META.category}`,
  "scholar_eligible: true",
  "cert_doi: null",
  "effective_date: 2026",
  "audience: [regulator, brand-legal, retailer-compliance, certifier]",
  "rail_box:",
  '  title: "Document versions"',
  `  body: "Web edition current — ${numWord} subcategories, ${META.effective_date} (Method v2.0). A consolidated, version-pinned PDF is in preparation and a DOI is minted on deposit. Full edition history below."`,
  "---",
].join("\n")

const body = `
<section style="margin-bottom:44px"><h1 style="font-family:Lora,serif;font-weight:400;font-size:34px;line-height:1.15;color:#2b1f1f;margin:0 0 14px">${META.category_name} — HMTc Program Manual</h1>
<p style="font-size:16px;line-height:1.7;color:#3f3a3a;max-width:80ch;margin:0 0 14px">The complete Heavy Metal Tested &amp; Certified standard for Category&nbsp;${META.category}, ${META.category_name}, edition 2026. Each initial limit is the strictest maximum level set by a credible sovereign government, converted to the product&rsquo;s native basis, with disclosed regulatory read-across where the exact cell is unregulated. After publication, a later edition may be lower only through the <a href="/program/ratchet" style="color:${LINK};text-decoration:none">Standards Ratchet</a> using eligible HMTc certified-lot results.</p>
<p style="font-size:13.5px;line-height:1.7;color:#736b6b;max-width:80ch;margin:0">Method: <a href="/program/structure" style="color:${LINK};text-decoration:none">government-limit-only (Method v2.0)</a>. ${META.manual_method_note}</p></section>

<section style="margin-bottom:44px"><h2 style="font-family:Lora,serif;font-weight:400;font-size:28px;color:#2b1f1f;border-bottom:1px solid #e8e1db;padding-bottom:10px;margin:0 0 18px">Master limit matrix — all ${numWord} subcategories</h2>
<p style="font-size:11.5px;color:#a9a1a1;margin:0 0 12px">All values ppb (µg/kg) in each row&rsquo;s native basis. Click any subcategory for its full government-by-government derivation. <span style="font-weight:500">n/m</span> = not material in the matrix; controlled by screen or reflex speciation, not a number.</p>
${matrix}</section>

<section style="margin-bottom:20px"><h2 style="font-family:Lora,serif;font-weight:400;font-size:28px;color:#2b1f1f;border-bottom:1px solid #e8e1db;padding-bottom:10px;margin:0 0 18px">About this edition</h2>
<p style="font-size:13.5px;line-height:1.7;color:#736b6b;max-width:80ch;margin:0 0 12px">Standards are living, versioned documents; each subcategory page carries its own version history and dated change log. This is the current web edition. A consolidated, version-pinned PDF of the full manual is in preparation and will be linked here on release; until then each subcategory page is individually citable.</p>
<p style="font-size:12.5px;line-height:1.65;color:#a9a1a1;max-width:80ch;margin:0">Descriptive occurrence evidence is maintained independently at the <a href="https://heavymetalindex.com" style="color:${LINK}">Heavy Metal Index</a>. It provides context only and does not select an initial limit or certification status; initial limits come from the government-limit-only compiler and later tightening may use only eligible HMTc certified-lot data under the Standards Ratchet.</p></section>
`

fs.mkdirSync(path.dirname(OUT), { recursive: true })
fs.writeFileSync(OUT, fm + "\n" + body)
console.log(`build-category-manual [${META.category_name}]: wrote ${path.relative(REPO, OUT)} (${n} subcategories)`)
