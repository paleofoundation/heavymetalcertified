#!/usr/bin/env node
// Render the Infant & Child Foods (Category 1) manual landing page from the compiled records +
// page metadata. This is the citable web edition: it presents the complete 9-subcategory standard
// set as one master matrix and links each subcategory to its full derivation page. Numbers come
// from data/standards/cat1-compiled/<record>.json (deterministic; no authored values).
//
// Not manifest-managed (kept out of manifest.json so build-manuals-page.mjs does not overwrite it).
// The downloadable PDF is intentionally omitted until it is regenerated against the expanded set —
// shipping the old single-subcategory PDF against a 9-subcategory web edition would be a stale-
// standard Daubert self-harm (manifest honesty rule).

import fs from "node:fs"
import path from "node:path"

const REPO = process.cwd()
const COMPILED = path.join(REPO, "data/standards/cat1-compiled")
const PAGES = JSON.parse(fs.readFileSync(path.join(REPO, "data/standards/cat1-pages.json"), "utf8"))
const OUT = path.join(REPO, "content/manuals/infant-and-child-foods.md")

const PANEL = [["Pb", "Lead"], ["iAs", "iAs"], ["tHg", "Hg"], ["Cd", "Cd"], ["Cr", "Cr"], ["Ni", "Ni"], ["Sn", "Sn"], ["Al", "Al"]]
const ACCENT = "#9f2727", LINK = "#1c43ad"
const cell = (c) => (c == null ? "—" : c.value == null ? (c.type === "not_material" ? "n/m" : "—") : String(c.value))

// The deployed formula-powder page is row 1; the 8 rendered pages (from cat1-pages.json) are 2-9.
// Uniform shape: { slug, name, variants: [{label, variant, record}] }.
const ROWS = [
  { slug: "infant-formula-powder", name: "Infant formula (powder)", variants: [{ label: "cow", variant: "cow", record: "infant-formula-powder" }, { label: "soy", variant: "soy", record: "infant-formula-powder" }] },
  ...PAGES.pages.map((p) => ({ slug: p.slug, name: p.name, variants: p.variants })),
]

const recCache = new Map()
const readRec = (r) => { if (!recCache.has(r)) recCache.set(r, JSON.parse(fs.readFileSync(path.join(COMPILED, `${r}.json`), "utf8"))); return recCache.get(r) }

function valuesFor(row) {
  const parts = row.variants.map((v) => ({ label: v.label, rec: readRec(v.record), variant: v.variant }))
  const out = {}
  for (const [a] of PANEL) {
    const vals = parts.map((p) => ({ label: p.label, v: cell(p.rec.variants[p.variant][a]) }))
    const uniq = [...new Set(vals.map((x) => x.v))]
    out[a] = uniq.length === 1 ? uniq[0] : vals.map((x) => `${x.v} ${x.label}`).join(" / ")
  }
  const basis = parts[0].rec.native_basis === "as_sold" ? "as sold" : "as consumed"
  return { out, basis }
}

const th = (t) => `<th style="text-align:${t.a || "right"};padding:9px 10px;font-family:'IBM Plex Mono',monospace;font-size:9.5px;font-weight:500;letter-spacing:.06em">${t.t}</th>`
let bodyRows = ""
for (const row of ROWS) {
  const { out, basis } = valuesFor(row)
  const href = `/standards/${row.slug}`
  const tds = PANEL.map(([a]) => `<td style="padding:9px 10px;text-align:right;font-family:'IBM Plex Mono',monospace;color:#2b1f1f">${out[a]}</td>`).join("")
  bodyRows += `<tr style="border-bottom:1px solid #f2ece7"><td style="padding:9px 12px"><a href="${href}" style="color:${LINK};text-decoration:none">${row.name}</a></td>${tds}<td style="padding:9px 10px;font-size:11px;color:#a9a1a1">${basis}</td></tr>\n`
}

const matrix = `<div style="overflow-x:auto"><table style="width:100%;font-size:12.5px;border:1px solid #e8e1db;min-width:56rem;border-collapse:collapse"><thead><tr style="background:${ACCENT};color:#fff">${th({ t: "Subcategory", a: "left" })}${PANEL.map(([, l]) => th({ t: l })).join("")}${th({ t: "Basis", a: "left" })}</tr></thead><tbody>\n${bodyRows}</tbody></table></div>`

const fm = [
  "---",
  'title: "Infant and Child Foods — HMTc Program Manual"',
  "type: standard",
  "custom_page: true",
  "category: 1",
  "scholar_eligible: true",
  "cert_doi: null",  // assigned on deposit; standards go via Crossref (Karen, 2026-08-06). NB confirm edition/DOI: the briefings cite Zenodo 10.5281/zenodo.20270512 ("2026 Edition", a real Book record) as the current Program Manual, but this is the newer 9-subcategory web edition — decide whether it re-deposits (new DOI) or is the same edition.
  "effective_date: 2026",
  "audience: [regulator, brand-legal, retailer-compliance, certifier]",
  "---",
].join("\n")

const body = `
<section style="margin-bottom:44px"><h1 style="font-family:Lora,serif;font-weight:400;font-size:34px;line-height:1.15;color:#2b1f1f;margin:0 0 14px">Infant and Child Foods — HMTc Program Manual</h1>
<p style="font-size:16px;line-height:1.7;color:#3f3a3a;max-width:80ch;margin:0 0 14px">The complete Heavy Metal Tested &amp; Certified standard for Category&nbsp;1, Infant and Child Foods (ages 0–5), edition 2026. Every limit on every subcategory is the strictest maximum level set by any credible government worldwide, converted to the product&rsquo;s native basis, with a disclosed read-across from the nearest government value where no government regulates the exact product. Nothing is invented; every number traces to a named sovereign limit in the <a href="/regulations" style="color:${LINK};text-decoration:none">regulation references</a>.</p>
<p style="font-size:13.5px;line-height:1.7;color:#736b6b;max-width:80ch;margin:0">Method: <a href="/program/structure" style="color:${LINK};text-decoration:none">government-limit default (Method v2.0)</a>. The 8:1 powder-to-liquid basis conversion applies only within infant formula; every other subcategory takes government limits at face value. Tier&nbsp;1 toxics (Pb, Cd, iAs, Hg) are zero-tolerance; Tier&nbsp;2 (Ni, Al, Sn, Cr) carry the program&rsquo;s 150% transitional allowance. Where an analyte is not regulated for a product and is not material in that matrix, it is controlled — total-chromium screening with reflex hexavalent-chromium speciation, any quantifiable Cr(VI) a hard fail — rather than assigned an invented number.</p></section>

<section style="margin-bottom:44px"><h2 style="font-family:Lora,serif;font-weight:400;font-size:28px;color:#2b1f1f;border-bottom:1px solid #e8e1db;padding-bottom:10px;margin:0 0 18px">Master limit matrix — all nine subcategories</h2>
<p style="font-size:11.5px;color:#a9a1a1;margin:0 0 12px">All values ppb (µg/kg) in each row&rsquo;s native basis. Split cells show the formulation or matrix variants (cow/soy, rice/non-rice). Click any subcategory for its full government-by-government derivation. <span style="font-weight:500">n/m</span> = not material in the matrix; controlled by reflex speciation, not a number.</p>
${matrix}</section>

<section style="margin-bottom:20px"><h2 style="font-family:Lora,serif;font-weight:400;font-size:28px;color:#2b1f1f;border-bottom:1px solid #e8e1db;padding-bottom:10px;margin:0 0 18px">About this edition</h2>
<p style="font-size:13.5px;line-height:1.7;color:#736b6b;max-width:80ch;margin:0 0 12px">Standards are living, versioned documents; each subcategory page carries its own version history and dated change log. This is the current web edition. A consolidated, version-pinned PDF of the full expanded manual is in preparation and will be linked here on release; until then each subcategory page is individually downloadable and citable.</p>
<p style="font-size:12.5px;line-height:1.65;color:#a9a1a1;max-width:80ch;margin:0">The literature baseline underlying these certification limits is maintained independently at the <a href="https://heavymetalindex.com" style="color:${LINK}">Heavy Metal Index</a>. This certification standard applies those findings; the two are kept editorially separate by design.</p></section>
`

fs.writeFileSync(OUT, fm + "\n" + body)
console.log(`build-cat1-manual: wrote ${path.relative(REPO, OUT)} (${ROWS.length} subcategories)`)
