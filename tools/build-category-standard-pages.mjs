#!/usr/bin/env node
// Generalized renderer: compiled per-category standard records -> canonical cert standard pages.
// Category-driven successor to build-cat1-standard-pages.mjs (which stays as-is for Cat-1). Every
// category-specific fact (panel, analyte tiering, jurisdictions, native basis, cite volume, whether
// an 8:1 reconstitution note applies) comes from the `_meta` block of the category's pages.json, so
// one renderer serves Category 6 (Seafood) now and the remaining categories later.
//
// Input:  data/standards/<compiled_dir>/<record>.json  (frozen derivations from the index repo's
//         deterministic compiler; every number traces to a named register row — nothing authored here)
//         data/standards/<cat>-pages.json               (_meta + per-page metadata)
// Output: content/standards/<page-slug>.md              (custom_page:true — protected from the catalog
//         generator, matching the deployed cert standard template)
//
// Usage:  node tools/build-category-standard-pages.mjs --pages=data/standards/seafood-pages.json

import fs from "node:fs"
import path from "node:path"

const REPO = process.cwd()
const args = new Map((process.argv.slice(2)).map((a) => { const [k, v] = a.replace(/^--/, "").split("="); return [k, v ?? true] }))
const PAGES_FILE = args.get("pages")
if (!PAGES_FILE) { console.error("build-category-standard-pages: --pages=<file> required"); process.exit(1) }
const DOC = JSON.parse(fs.readFileSync(path.join(REPO, PAGES_FILE), "utf8"))
const META = DOC._meta
const COMPILED = path.join(REPO, "data/standards", META.compiled_dir)
const OUT = path.join(REPO, "content/standards")
const REGDIR = path.join(REPO, "content/regulations")

const ACCENT = "#9f2727", LINK = "#1c43ad"
const PANEL = META.panel
const TIER1 = new Set(META.tier1 || [])

// Full analyte label bank (superset; only PANEL entries render).
const ANALYTE = {
  Pb: "Lead (Pb)", iAs: "Inorganic arsenic (iAs)", tAs: "Total arsenic (tAs)",
  tHg: "Mercury, total (tHg)", MeHg: "Methylmercury (MeHg)", Cd: "Cadmium (Cd)",
  Cr: "Total chromium (Cr)", "Cr-VI": "Hexavalent chromium (Cr-VI)", Ni: "Nickel (Ni)",
  Sn: "Tin (Sn)", Al: "Aluminium (Al)", U: "Uranium (U)", Sb: "Antimony (Sb)",
}
const tierOf = (a) => (TIER1.has(a) ? "Tier 1" : "Tier 2")

// Jurisdiction display labels + optional regulation-page slugs. A header/link renders only when the
// regulation page actually exists on disk (existsSync-gated), so no category can emit a broken link.
const JUR_LABEL = {
  EU: "EU", UK: "UK", CODEX: "Codex", CA: "Canada", CN: "China", IN: "India", BR: "Brazil",
  GSO: "GSO", "AU-NZ": "AU/NZ", US: "FDA", "US-CA": "US-CA", "US-WA": "US-WA", EC: "Ecuador",
  MX: "Mexico", TR: "Türkiye", CR: "Costa Rica", FJ: "Fiji", IL: "Israel", PA: "Panama",
  PY: "Paraguay", SG: "Singapore", TH: "Thailand", VN: "Vietnam", GY: "Guyana", MA: "Morocco",
  PH: "Philippines", TT: "Trinidad & Tobago", UY: "Uruguay", MERCOSUR: "Mercosur", international: "Intl",
}
const JUR2REG = {
  EU: "eu-2023-915", UK: "uk-1881-2006", CODEX: "codex-cxs-193", CA: "canada-contaminants",
  CN: "china-gb-2762", IN: "india-fssai", BR: "brazil-anvisa", GSO: "gso-193", "AU-NZ": "au-nz-fsanz",
  US: "us-fda-c2z",
}
// Column order: major bodies first, then everyone else alphabetically by label.
const JUR_ORDER = ["EU", "UK", "CODEX", "US", "AU-NZ", "GSO", "CA", "CN", "IN", "BR", "MERCOSUR",
  "CR", "EC", "FJ", "GY", "IL", "MA", "MX", "PA", "PH", "PY", "SG", "TH", "TT", "UY", "VN"]

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
const reg = (j) => {
  const slug = JUR2REG[j]
  if (slug && fs.existsSync(path.join(REGDIR, `${slug}.md`))) return `/regulations/${slug}`
  return null
}
const jlabel = (j) => JUR_LABEL[j] || j

// --- binding-basis label per cell ---------------------------------------------
function bindingLabel(cell) {
  if (cell.type === "gov") {
    const href = reg(cell.binding_jurisdiction)
    const txt = `strictest government ML (${jlabel(cell.binding_jurisdiction)})`
    return href ? `<a href="${href}" style="color:${LINK};text-decoration:none">${txt}</a>` : txt
  }
  if (cell.type === "read_across") {
    const href = reg(cell.source_jurisdiction)
    const label = esc(cell.label && cell.label.length < 90 ? cell.label : `government read-across (${jlabel(cell.source_jurisdiction)})`)
    return href ? `<a href="${href}" style="color:${LINK};text-decoration:none">${label}</a>` : label
  }
  if (cell.type === "not_material") return "not material — controlled analyte (see note)"
  return "&mdash;"
}

// Collapse one analyte across variants into a single display value ("X" or "X lab1 / Y lab2").
function limitDisplay(analyte, variants) {
  const parts = variants.map((v) => ({ label: v.label, val: v.cells[analyte] }))
  const vals = parts.map((p) => (!p.val ? "&mdash;" : p.val.value == null ? (p.val.type === "not_material" ? "n/m" : "&mdash;") : String(p.val.value)))
  if (vals.every((x) => x === vals[0])) return vals[0]
  return parts.map((p, i) => `${vals[i]} ${p.label}`).join(" / ")
}

// --- Master Limit Table -------------------------------------------------------
function masterTable(variants, basisWord, tierNote) {
  const rows = PANEL.map((a, i) => {
    const cell0 = variants[0].cells[a]
    const zebra = i % 2 === 1 ? ";background:#fbf7f5" : ""
    return `<tr style="border-bottom:1px solid #f2ece7${zebra}"><td style="padding:10px 15px;color:#2b1f1f">${ANALYTE[a] || a}</td><td style="padding:10px 15px;color:#736b6b;font-size:12px">${tierOf(a)}</td><td style="padding:10px 15px;text-align:right;font-family:'IBM Plex Mono',monospace;color:#2b1f1f">${limitDisplay(a, variants)}</td><td style="padding:10px 15px;color:#736b6b;font-size:12.5px">${bindingLabel(cell0)}</td></tr>`
  }).join("")
  return `<section id="limits" style="margin-bottom:52px"><h2 style="font-family:Lora,serif;font-weight:400;font-size:30px;line-height:1.2;color:#2b1f1f;border-bottom:1px solid #e8e1db;padding-bottom:10px;margin:0 0 20px">Master Limit Table</h2><p style="font-size:11.5px;line-height:1.55;color:#a9a1a1;max-width:84ch;margin:0 0 14px">All values in ppb (&micro;g/kg), ${basisWord} basis. Every analyte carries a firm ceiling. A brand meeting every value on a like-for-like basis qualifies for the mark.</p><div style="overflow-x:auto"><table style="width:100%;font-size:13.5px;border:1px solid #e8e1db;min-width:48rem;border-collapse:collapse"><thead><tr style="background:${ACCENT};color:#fff"><th style="text-align:left;padding:11px 15px;font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:500;letter-spacing:.1em;text-transform:uppercase">Analyte</th><th style="text-align:left;padding:11px 15px;font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:500;letter-spacing:.1em;text-transform:uppercase">Tier</th><th style="text-align:right;padding:11px 15px;font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:500;letter-spacing:.1em;text-transform:uppercase">HMTc limit</th><th style="text-align:left;padding:11px 15px;font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:500;letter-spacing:.1em;text-transform:uppercase">Binding basis</th></tr></thead><tbody>${rows}</tbody></table></div><p style="font-size:11.5px;line-height:1.55;color:#a9a1a1;max-width:84ch;margin:14px 0 0">${tierNote}</p></section>`
}

// --- Derivation (per-country) table -------------------------------------------
function derivationTable(primary, basisWord, subName, otherNote, reconNote) {
  const present = new Set()
  for (const a of PANEL) { const c = primary.cells[a]; if (c && c.per_country) Object.keys(c.per_country).forEach((j) => present.add(j)) }
  const cols = JUR_ORDER.filter((j) => present.has(j)).concat([...present].filter((j) => !JUR_ORDER.includes(j)))
  const th = cols.map((j) => { const h = reg(j); const lbl = jlabel(j); return `<th style="text-align:right;padding:9px 10px;font-family:'IBM Plex Mono',monospace;font-size:9.5px;font-weight:500">${h ? `<a href="${h}" style="color:#fff;text-decoration:underline;text-underline-offset:2px">${lbl}</a>` : lbl}</th>` }).join("")
  let anyConv = false
  const body = PANEL.map((a) => {
    const c = primary.cells[a]
    const tds = cols.map((j) => {
      const pc = c && c.per_country && c.per_country[j]
      if (!pc) return `<td style="padding:9px 10px;text-align:right;color:#d8cfca">&mdash;</td>`
      // The ¹ mark denotes a genuine basis conversion. It only ever applies to a category that
      // reconstitutes (the 8:1 formula case); the compiled record flags face-value cells as
      // "converted" too (their note is "face value", not "same basis"), so gate on reconstitution_note
      // to avoid a superscript with no conversion and no footnote on a face-value category like seafood.
      const isConv = reconNote && pc.converted
      const conv = isConv ? "&sup1;" : ""; if (isConv) anyConv = true
      const strict = c.type === "gov" && c.binding_jurisdiction === j
      const color = strict ? `${ACCENT};font-weight:400` : "#736b6b"
      return `<td style="padding:9px 10px;text-align:right;font-family:'IBM Plex Mono',monospace;color:${color}">${pc.value}${conv}</td>`
    }).join("")
    let hmtc, binds
    if (!c || c.value == null && c.type !== "not_material") { hmtc = "&mdash;"; binds = "&mdash;" }
    else if (c.type === "read_across") { hmtc = `${c.value}&sup2;`; binds = "read-across" }
    else if (c.type === "not_material") { hmtc = "n/m&sup3;"; binds = "controlled" }
    else { hmtc = String(c.value); const h = reg(c.binding_jurisdiction); binds = h ? `<a href="${h}" style="color:${LINK};text-decoration:none">${jlabel(c.binding_jurisdiction)}</a>` : jlabel(c.binding_jurisdiction) }
    return `<tr style="border-bottom:1px solid #f2ece7"><td style="padding:9px 12px;color:#2b1f1f">${ANALYTE[a] || a}</td>${tds}<td style="padding:9px 12px;text-align:right;font-family:'IBM Plex Mono',monospace;color:#2b1f1f;font-weight:500;background:#fbf7f5">${hmtc}</td><td style="padding:9px 12px;color:#736b6b;font-size:11.5px">${binds}</td></tr>`
  }).join("")
  const convNote = (anyConv && reconNote) ? "&sup1; basis-converted at the 8:1 powder-to-liquid ratio &mdash; the only such ratio a government legislates (China GB 2762 footnote c). " : ""
  const foot = `All values &micro;g/kg (ppb), ${basisWord} basis. ${convNote}&sup2; read-across: no government sets this analyte for this exact product; the value is read across from the nearest government value for an analogous product. &sup3; not material in this matrix: controlled by reflex speciation or packaging control, not a standalone number. ${otherNote || ""}`
  return `<section id="derivation" style="margin-bottom:52px"><h2 style="font-family:Lora,serif;font-weight:400;font-size:30px;line-height:1.2;color:#2b1f1f;border-bottom:1px solid #e8e1db;padding-bottom:10px;margin:0 0 20px">Derivation &mdash; every government&rsquo;s number, side by side</h2><p style="font-size:13.5px;line-height:1.7;color:#736b6b;max-width:84ch;margin:0 0 16px">The full derivation for ${esc(subName)}. Each row lists every government maximum level in force worldwide, converted to the ${basisWord} basis; the HMTc limit is the strictest of them, and the last column names which sovereign law binds. A blank cell means that government sets no limit for this analyte in this product.</p><div style="overflow-x:auto"><table style="width:100%;font-size:12.5px;border:1px solid #e8e1db;min-width:56rem;border-collapse:collapse"><thead><tr style="background:${ACCENT};color:#fff"><th style="text-align:left;padding:9px 12px;font-family:'IBM Plex Mono',monospace;font-size:9.5px;font-weight:500;letter-spacing:.08em;text-transform:uppercase">Analyte</th>${th}<th style="text-align:right;padding:9px 12px;font-family:'IBM Plex Mono',monospace;font-size:9.5px;font-weight:500;background:#7d1f1f">HMTc</th><th style="text-align:left;padding:9px 12px;font-family:'IBM Plex Mono',monospace;font-size:9.5px;font-weight:500">Binds</th></tr></thead><tbody>${body}</tbody></table></div><p style="font-family:'IBM Plex Mono',monospace;font-size:10.5px;line-height:1.7;color:#a9a1a1;max-width:84ch;margin:14px 0 0">${foot}</p></section>`
}

function methodSection(subName, basisWord) {
  return `<section id="method" style="margin-bottom:52px"><h2 style="font-family:Lora,serif;font-weight:400;font-size:30px;line-height:1.2;color:#2b1f1f;border-bottom:1px solid #e8e1db;padding-bottom:10px;margin:0 0 20px">How every number on this page is set</h2><p style="font-size:15.5px;line-height:1.75;color:#3f3a3a;margin:0 0 16px;max-width:84ch">The standard for each analyte is the strictest maximum level set by any credible government regulator &mdash; among them the European Union, Codex Alimentarius, the US FDA, Australia/New Zealand, the Gulf states (GSO), and the national authorities of every jurisdiction that regulates the product &mdash; converted into ${esc(subName)}&rsquo;s own ${basisWord} basis. It is a lookup of sovereign law, carrying at most one disclosed basis conversion where the law is written in another basis, and an explicit read-across where no government regulates the exact product. A certified product sits at or below every applicable sovereign limit at once.</p><p style="font-size:15.5px;line-height:1.75;color:#3f3a3a;margin:0 0 16px;max-width:84ch">Where <em>no</em> government regulates the exact product for an analyte, the standard does not go blank or invent a number: the limit is read across from the nearest government value for an analogous product, so a certified product still sits at or below a real sovereign limit. The ratchet tightens these after publication as surveillance warrants.</p></section>`
}

function citeSection(subName, version, hmiLink, doi, volume) {
  const hmi = hmiLink ? `<a href="${hmiLink}" style="color:${LINK}">Heavy Metal Index</a>` : "Heavy Metal Index"
  const doiText = doi ? `<a href="https://doi.org/${doi}" style="color:${LINK}">https://doi.org/${doi}</a>` : "DOI: registration pending."
  return `<section id="cite" style="margin-bottom:20px"><h2 style="font-family:Lora,serif;font-weight:400;font-size:30px;line-height:1.2;color:#2b1f1f;border-bottom:1px solid #e8e1db;padding-bottom:10px;margin:0 0 20px">Cite this standard</h2><p style="font-family:'IBM Plex Mono',monospace;font-size:11px;line-height:1.75;color:#5a4141;margin:0 0 14px;max-width:84ch">Pendergrass, K. &ldquo;${esc(subName)}.&rdquo; In Heavy Metal Tested &amp; Certified (HMTc) ${esc(volume)} standard, version ${version}. Institute of Contaminant Standards (ICS), 2026. ${doiText}</p><p style="font-size:12.5px;line-height:1.65;color:#a9a1a1;max-width:84ch;margin:0">The literature baseline for every analyte is maintained independently at the ${hmi}. This certification standard applies those findings; the two are kept editorially separate by design.</p></section>`
}

// --- drive --------------------------------------------------------------------
const tier1Names = (META.tier1 || []).map((a) => (a === "tHg" ? "Hg" : a)).filter((v, i, arr) => arr.indexOf(v) === i).join(", ")
const tier2Names = (META.tier2 || []).join(", ")
const tierNote = `Tier 1 (${tier1Names}) are zero-tolerance toxics with no established safe threshold. Tier 2 (${tier2Names}) carry a 150% transitional allowance under the program&rsquo;s Status A&ndash;E framework. ${META.tier_footnote || ""}`.trim()

let n = 0
for (const page of DOC.pages) {
  const variants = page.variants.map((v) => {
    const rec = JSON.parse(fs.readFileSync(path.join(COMPILED, `${v.record}.json`), "utf8"))
    const cells = rec.variants[v.variant] || rec.variants[Object.keys(rec.variants)[0]]
    return { label: v.label, cells, native_basis: rec.native_basis }
  })
  const basisWord = variants[0].native_basis === "as_sold" ? "as-sold" : "as-consumed"
  const version = page.version || META.default_version
  const vshort = version.split(" ")[0]
  const certDoi = page.cert_doi || null
  const otherNote = variants.length > 1
    ? `Variants on this page: ${variants.map((v) => v.label).join(" and ")}. Where a cell differs between them the Master Limit Table shows both; the derivation above is for ${variants[0].label}.`
    : ""

  const fm = [
    "---",
    `title: "${page.name} — HMTc Standard"`,
    "type: standard",
    `description: "${page.description}"`,
    `category: ${META.category}`,
    `category_name: "${META.category_name}"`,
    `product_slug: ${page.slug}`,
    "custom_page: true",
    `subcategory: "${page.name}"`,
    `firm_analytes: ${PANEL.length}`,
    `native_basis: ${variants[0].native_basis}`,
    `standard_version: "${version}"`,
    `methodology_version: "${META.methodology_version}"`,
    `variant_type: ${page.variant_type || "whole_row_platform"}`,
    ...(page.hmi_link ? [`hmi_literature_link: ${page.hmi_link}`] : []),
    `effective_date: ${META.effective_date}`,
    "scholar_eligible: true",
    `cert_doi: ${certDoi ? JSON.stringify(certDoi) : "null"}`,
    "audience: [regulator, brand-legal, retailer-compliance, certifier]",
    "rail_box:",
    '  title: "Document versions"',
    `  body: "v${vshort} · ${META.effective_date} · current. Every edition is dated and kept at a stable permalink; earlier editions and their DOIs appear here as the standard revises. Full change history below."`,
    "snapshot:",
    `  - { k: "Analytes limited", v: "${PANEL.length} / ${PANEL.length}" }`,
    '  - { k: "Method", v: "Strictest government ML" }',
    `  - { k: "Native basis", v: "${basisWord}" }`,
    `  - { k: "Standard version", v: "${version}" }`,
    "connections:",
    ...(page.connections || []).map((c) => `  - { label: "${c.label}", href: "${c.href}" }`),
    "---",
  ].join("\n")

  const body = [
    methodSection(page.name, basisWord),
    masterTable(variants, basisWord, tierNote),
    derivationTable(variants[0], basisWord, page.name, otherNote, META.reconstitution_note),
    citeSection(page.name, vshort, page.hmi_link, certDoi, META.volume_name),
  ].join("\n")

  fs.writeFileSync(path.join(OUT, `${page.slug}.md`), `${fm}\n${body}\n`)
  n++
  console.log(`  rendered ${page.slug}.md  (${variants.length} variant${variants.length > 1 ? "s" : ""})`)
}
console.log(`build-category-standard-pages [${META.category_name}]: wrote ${n} page(s)`)
