#!/usr/bin/env node
// Renderer: compiled Cat-1 standard records -> canonical cert standard pages.
//
// Input:  data/standards/cat1-compiled/<slug>.json  (frozen derivations copied from the index
//         repo's deterministic compiler; every number traces to a named register row).
//         data/standards/cat1-pages.json             (per-page metadata: which variant records
//         group onto one taxonomy-row page, display names, connections).
// Output: content/standards/<page-slug>.md            (custom_page:true, protected from the catalog
//         generator, matching the deployed infant-formula-powder.md template exactly).
//
// The numbers are NOT authored here — they come verbatim from the compiled records. This renderer
// only lays them into the canonical design. Run after the index compiler + the copy step.

import fs from "node:fs"
import path from "node:path"
import { loadOccurrenceEvidence, loadToxAnchors, descriptorFromCompiledCell, occurrenceRationaleSection } from "./lib/occurrence-section.mjs"
import { renderRiskFlagForStandard } from "./lib/struggle-section.mjs"

const REPO = process.cwd()
const COMPILED = path.join(REPO, "data/standards/cat1-compiled")
const PAGES = JSON.parse(fs.readFileSync(path.join(REPO, "data/standards/cat1-pages.json"), "utf8"))
const OUT = path.join(REPO, "content/standards")
const OCC = loadOccurrenceEvidence(path.join(REPO, "data/standards"))
const TOX = loadToxAnchors(path.join(REPO, "data/standards"))

const JUR2REG = { EU: "eu-2023-915", UK: "uk-1881-2006", CODEX: "codex-cxs-193", CA: "canada-contaminants", CN: "china-gb-2762", IN: "india-fssai", BR: "brazil-anvisa", GSO: "gso-193", "AU-NZ": "au-nz-fsanz", US: "us-fda-c2z" }
const JUR_LABEL = { EU: "EU", UK: "UK", CODEX: "Codex", CA: "Canada", CN: "China", IN: "India", BR: "Brazil", GSO: "GSO", "AU-NZ": "AU/NZ", US: "FDA", "US-CA": "US-CA", "US-WA": "US-WA", EC: "Ecuador", MX: "Mexico", TR: "Türkiye", international: "Intl" }
const JUR_ORDER = ["EU", "UK", "CODEX", "CA", "CN", "IN", "BR", "GSO", "AU-NZ", "US"]
const ANALYTE = {
  Pb: { label: "Lead (Pb)", tier: "Tier 1" }, iAs: { label: "Inorganic arsenic (iAs)", tier: "Tier 1" },
  tHg: { label: "Mercury (tHg)", tier: "Tier 1" }, Cd: { label: "Cadmium (Cd)", tier: "Tier 1" },
  Cr: { label: "Total chromium (Cr)", tier: "Tier 2" }, Ni: { label: "Nickel (Ni)", tier: "Tier 2" },
  Sn: { label: "Tin (Sn)", tier: "Tier 2" }, Al: { label: "Aluminium (Al)", tier: "Tier 2" },
  tAs: { label: "Total arsenic (tAs)", tier: "Tier 2" },
}
// The canonical analyte contract (heavy-metal-index docs/governance/hmtc-governing-principles.md,
// "Canonical analyte contract"; CLAUDE.md Part 19) requires the eight-total laboratory panel — Pb,
// Cd, tAs, tHg, Ni, Sn, Al, total Cr — on every certification row, with species cells ADDITIONAL
// to, never substituted for, their parent total: "A category compiler that substitutes iAs for
// tAs, MeHg for tHg, or Cr-VI for total Cr is incomplete." Cat 1 adds iAs as the core species
// cell, so the rendered panel is nine cells, not eight.
//
// tAs was previously missing from this array while every compiled Cat-1 record carried a tAs cell,
// so a published ceiling (India FSSAI tAs 50, row in_tas_infant-milk-substitute-and-infant-foods_50)
// was silently dropped from all nine standard pages at render time. Ordering keeps the two arsenic
// cells adjacent, matching seafood / grains / cat16 / cat27-29; the tier follows every other
// category's _meta, where tAs is Tier 2 and iAs is Tier 1.
const PANEL = ["Pb", "iAs", "tAs", "tHg", "Cd", "Cr", "Ni", "Sn", "Al"]

// A cell is "firm" (carries a standalone published ceiling) only when it resolves to a number via a
// sovereign lookup, a disclosed read-across, or a special-basis limit. control / not_material cells
// are governed and still mandatorily tested, but carry NO standalone number, so they must not be
// counted as firm ceilings. The count feeds the master-table cap note, the front-matter
// firm_analytes, and the /standards index "N firm" badge. Kept byte-identical to isFirm() in
// build-category-standard-pages.mjs so both renderers agree.
const isFirm = (cell) => !!(cell && cell.value != null && (cell.type === "gov" || cell.type === "read_across" || cell.type === "special" || cell.type === "form_split"))
const ACCENT = "#9f2727", LINK = "#1c43ad"

const reg = (j) => JUR2REG[j] ? `/regulations/${JUR2REG[j]}` : null
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

// Self-heal against the regen-wipe landmine: mint-dois.mjs writes the minted production `cert_doi`
// into the rendered page's frontmatter, but this generator rewrites that page from cat1-pages.json
// on every prebuild. If cat1-pages.json has not also been updated, a plain regen would silently
// erase a live, already-deposited DOI. So the minted cert_doi already on the page is read back as a
// fallback, and a committed static PDF turns the inline download button on even when page.pdf is
// unset — the generator reflects committed reality instead of clobbering it. A production DOI only;
// test/sandbox prefixes are ignored so a non-resolvable DOI can never be re-stamped onto a page.
const TEST_PREFIXES = ["10.5072", "10.82", "10.84435"]
function existingCertDoi(slug) {
  const f = path.join(OUT, `${slug}.md`)
  if (!fs.existsSync(f)) return null
  const m = fs.readFileSync(f, "utf8").match(/^cert_doi:\s*"?(10\.\d{4,9}\/[^\s"']+)"?/mi)
  if (!m) return null
  return TEST_PREFIXES.some((p) => m[1].startsWith(p)) ? null : m[1]
}
function committedPdfHref(slug) {
  return fs.existsSync(path.join(REPO, "content/static/standards", `${slug}.pdf`)) ? `/static/standards/${slug}.pdf` : null
}

// --- binding-basis label per cell ---------------------------------------------
function bindingLabel(cell) {
  if (cell.type === "gov") {
    const href = reg(cell.binding_jurisdiction)
    const txt = `strictest government ML (${JUR_LABEL[cell.binding_jurisdiction] || cell.binding_jurisdiction})`
    return href ? `<a href="${href}" style="color:${LINK};text-decoration:none">${txt}</a>` : txt
  }
  if (cell.type === "read_across") {
    const href = reg(cell.source_jurisdiction)
    const label = esc(cell.label || `government read-across (${JUR_LABEL[cell.source_jurisdiction] || cell.source_jurisdiction})`)
    return href ? `<a href="${href}" style="color:${LINK};text-decoration:none">${label}</a>` : label
  }
  if (cell.type === "not_material") return "not material — controlled analyte (see note)"
  return "—"
}

// Collapse the same analyte across variants into one display value.
// variants = [{label, cells}]; returns "X" or "X lab1 / Y lab2".
function limitDisplay(analyte, variants) {
  const parts = variants.map((v) => ({ label: v.label, val: v.cells[analyte] }))
  const vals = parts.map((p) => (p.val.value == null ? (p.val.type === "not_material" ? "n/m" : "—") : String(p.val.value)))
  if (vals.every((x) => x === vals[0])) return vals[0]
  return parts.map((p, i) => `${vals[i]} ${p.label}`).join(" / ")
}

// --- Master Limit Table -------------------------------------------------------
function masterTable(variants, basisWord, firmCount) {
  const rows = PANEL.map((a, i) => {
    const cell0 = variants[0].cells[a]
    const zebra = i % 2 === 1 ? ";background:#fbf7f5" : ""
    return `<tr style="border-bottom:1px solid #f2ece7${zebra}"><td style="padding:10px 15px;color:#2b1f1f">${ANALYTE[a].label}</td><td style="padding:10px 15px;color:#736b6b;font-size:12px">${ANALYTE[a].tier}</td><td style="padding:10px 15px;text-align:right;font-family:'IBM Plex Mono',monospace;color:#2b1f1f">${limitDisplay(a, variants)}</td><td style="padding:10px 15px;color:#736b6b;font-size:12.5px">${bindingLabel(cell0)}</td></tr>`
  }).join("")
  // Honest cap note: only a fully-numeric subcategory may state that every analyte carries a firm
  // ceiling. A partially-numeric one states the firm count and that the remainder are governed
  // controls with no standalone number, so the page never overclaims a ceiling it does not
  // publish. Matches the wording in build-category-standard-pages.mjs.
  const capNote = firmCount >= PANEL.length
    ? "Every analyte carries a firm ceiling. A brand meeting every value on a like-for-like basis qualifies for the mark."
    : `${firmCount} of ${PANEL.length} analytes carry a firm ceiling; the remainder are governed by mandatory control or the total-metal screen with no standalone number, itemised in the derivation below. A brand meeting every firm value on a like-for-like basis, and passing every control, qualifies for the mark.`
  return `<section id="limits" style="margin-bottom:52px"><h2 style="font-family:Lora,serif;font-weight:400;font-size:30px;line-height:1.2;color:#2b1f1f;border-bottom:1px solid #e8e1db;padding-bottom:10px;margin:0 0 20px">Master Limit Table</h2><p style="font-size:11.5px;line-height:1.55;color:#a9a1a1;max-width:84ch;margin:0 0 14px">All values in ppb (&micro;g/kg), ${basisWord} basis. ${capNote}</p><div style="overflow-x:auto"><table style="width:100%;font-size:13.5px;border:1px solid #e8e1db;min-width:48rem;border-collapse:collapse"><thead><tr style="background:${ACCENT};color:#fff"><th style="text-align:left;padding:11px 15px;font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:500;letter-spacing:.1em;text-transform:uppercase">Analyte</th><th style="text-align:left;padding:11px 15px;font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:500;letter-spacing:.1em;text-transform:uppercase">Tier</th><th style="text-align:right;padding:11px 15px;font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:500;letter-spacing:.1em;text-transform:uppercase">HMTc limit</th><th style="text-align:left;padding:11px 15px;font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:500;letter-spacing:.1em;text-transform:uppercase">Binding basis</th></tr></thead><tbody>${rows}</tbody></table></div><p style="font-size:11.5px;line-height:1.55;color:#a9a1a1;max-width:84ch;margin:14px 0 0">Tier 1 (Pb, Cd, iAs, Hg) are zero-tolerance toxics with no established safe threshold. Tier 2 (tAs, Ni, Al, Sn, Cr) carry a 150% transitional allowance under the program&rsquo;s Status A&ndash;E framework. Arsenic is limited in both forms: total arsenic (tAs) and inorganic arsenic (iAs) are separate ceilings that must both be met, and the species result never replaces the parent total. Total chromium is limited as shown; hexavalent chromium is controlled through it &mdash; mandatory Cr-VI speciation on any total-chromium result above 100 ppb, and any quantifiable Cr-VI fails.</p></section>`
}

// --- Derivation (per-country) table -------------------------------------------
function derivationTable(primary, basisWord, subName, otherNote) {
  // Which jurisdiction columns to show: canonical order, only those that appear in any cell.
  const present = new Set()
  for (const a of PANEL) { const c = primary.cells[a]; if (c.per_country) Object.keys(c.per_country).forEach((j) => present.add(j)) }
  const cols = JUR_ORDER.filter((j) => present.has(j))
  const th = cols.map((j) => { const h = reg(j); const lbl = JUR_LABEL[j] || j; return `<th style="text-align:right;padding:9px 10px;font-family:'IBM Plex Mono',monospace;font-size:9.5px;font-weight:500">${h ? `<a href="${h}" style="color:#fff;text-decoration:underline;text-underline-offset:2px">${lbl}</a>` : lbl}</th>` }).join("")
  const body = PANEL.map((a) => {
    const c = primary.cells[a]
    const tds = cols.map((j) => {
      const pc = c.per_country && c.per_country[j]
      if (!pc) return `<td style="padding:9px 10px;text-align:right;color:#d8cfca">&mdash;</td>`
      const conv = pc.converted ? "&sup1;" : ""
      const strict = c.type === "gov" && c.binding_jurisdiction === j
      const color = strict ? `${ACCENT};font-weight:400` : "#736b6b"
      return `<td style="padding:9px 10px;text-align:right;font-family:'IBM Plex Mono',monospace;color:${color}">${pc.value}${conv}</td>`
    }).join("")
    let hmtc, binds
    if (c.type === "read_across") { hmtc = `${c.value}&sup2;`; binds = "read-across" }
    else if (c.type === "not_material") { hmtc = "n/m&sup3;"; binds = "controlled" }
    else { hmtc = String(c.value); const h = reg(c.binding_jurisdiction); binds = h ? `<a href="${h}" style="color:${LINK};text-decoration:none">${JUR_LABEL[c.binding_jurisdiction] || c.binding_jurisdiction}</a>` : (JUR_LABEL[c.binding_jurisdiction] || c.binding_jurisdiction) }
    return `<tr style="border-bottom:1px solid #f2ece7"><td style="padding:9px 12px;color:#2b1f1f">${ANALYTE[a].label}</td>${tds}<td style="padding:9px 12px;text-align:right;font-family:'IBM Plex Mono',monospace;color:#2b1f1f;font-weight:500;background:#fbf7f5">${hmtc}</td><td style="padding:9px 12px;color:#736b6b;font-size:11.5px">${binds}</td></tr>`
  }).join("")
  const foot = `All values &micro;g/kg (ppb), ${basisWord} basis. &sup1; basis-converted at the 8:1 powder-to-liquid ratio &mdash; the only such ratio a government legislates (China GB 2762 footnote c). &sup2; read-across: no government sets this analyte for this exact product; the value is read across from the nearest government value for an analogous product. &sup3; not material in this matrix: measured but with no standalone number, controlled by the total-metal screen, not an invented value. ${otherNote || ""}`
  return `<section id="derivation" style="margin-bottom:52px"><h2 style="font-family:Lora,serif;font-weight:400;font-size:30px;line-height:1.2;color:#2b1f1f;border-bottom:1px solid #e8e1db;padding-bottom:10px;margin:0 0 20px">Derivation</h2><p style="font-size:13.5px;line-height:1.7;color:#736b6b;max-width:84ch;margin:0 0 16px">The full derivation for ${esc(subName)}. Each row lists every government maximum level in force worldwide, converted to the ${basisWord} basis; the HMTc limit is the strictest of them, and the last column names which sovereign law binds. A blank cell means that government sets no limit for this analyte in this product.</p><div style="overflow-x:auto"><table style="width:100%;font-size:12.5px;border:1px solid #e8e1db;min-width:56rem;border-collapse:collapse"><thead><tr style="background:${ACCENT};color:#fff"><th style="text-align:left;padding:9px 12px;font-family:'IBM Plex Mono',monospace;font-size:9.5px;font-weight:500;letter-spacing:.08em;text-transform:uppercase">Analyte</th>${th}<th style="text-align:right;padding:9px 12px;font-family:'IBM Plex Mono',monospace;font-size:9.5px;font-weight:500;background:#7d1f1f">HMTc</th><th style="text-align:left;padding:9px 12px;font-family:'IBM Plex Mono',monospace;font-size:9.5px;font-weight:500">Binds</th></tr></thead><tbody>${body}</tbody></table></div><p style="font-family:'IBM Plex Mono',monospace;font-size:10.5px;line-height:1.7;color:#a9a1a1;max-width:84ch;margin:14px 0 0">${foot}</p></section>`
}

function methodSection(subName, basisWord, pdfHref, version) {
  const dl = pdfHref ? `<div style="margin:4px 0 0"><a href="${pdfHref}" style="display:inline-block;background:${ACCENT};color:#fff;font-family:&#39;IBM Plex Mono&#39;,monospace;font-size:12px;letter-spacing:.04em;text-decoration:none;padding:11px 18px;border-radius:4px">&#8595; Download this standard (PDF, v${version})</a> <span style="font-size:11.5px;color:#a9a1a1">Versioned, citable, self-contained.</span></div>` : ""
  return `<section id="method" style="margin-bottom:52px"><h2 style="font-family:Lora,serif;font-weight:400;font-size:30px;line-height:1.2;color:#2b1f1f;border-bottom:1px solid #e8e1db;padding-bottom:10px;margin:0 0 20px">How limits are set</h2><p style="font-size:15.5px;line-height:1.75;color:#3f3a3a;margin:0 0 16px;max-width:84ch">The standard for each analyte is the strictest maximum level set by any credible government regulator &mdash; the European Union, the United Kingdom, Codex Alimentarius, Health Canada, China, India, Brazil, the Gulf states (GSO), Australia/New Zealand, and the US FDA &mdash; converted into ${esc(subName)}&rsquo;s own ${basisWord} basis. It is a lookup of sovereign law, carrying at most one disclosed basis conversion where the law is written in another basis, and an explicit read-across where no government regulates the exact product. A certified product sits at or below every applicable sovereign limit at once.</p><p style="font-size:15.5px;line-height:1.75;color:#3f3a3a;margin:0 0 16px;max-width:84ch">Where <em>no</em> government regulates the exact product for an analyte, the standard does not go blank or invent a number: the limit is read across from the nearest government value for an analogous product, so a certified product still sits at or below a real sovereign limit. The ratchet tightens these after publication as surveillance warrants.</p>${dl}</section>`
}

function citeSection(subName, version, hmiLink, doi) {
  const hmi = hmiLink ? `<a href="${hmiLink}" style="color:${LINK}">Heavy Metal Index</a>` : "Heavy Metal Index"
  // A real DOI renders as a resolvable doi.org link. Until one is assigned the
  // line reads "registration pending" — agency-neutral on purpose: the DOI
  // self-identifies once minted, and hard-coding the agency in page text is
  // exactly what went stale (the old "(Zenodo)" after the plan moved to
  // Crossref). The registration agency lives in the deposit config, not on the
  // public page. Standards are deposited as Crossref posted-content/reports; the
  // already-published Program Manual and Journal articles keep their real Zenodo DOIs.
  // APA "Standard No." form, network-locked to All-rights-reserved (ORDER S-DOI-CITE-LICENSE-1):
  // Standard No. = cert_doi, URL = doi.org only (never the page URL, never "registration pending"),
  // no licence glued onto the cite line. The licence line is a separate row below.
  const stdNo = doi ? ` (Standard No. ${doi})` : ""
  const doiUrl = doi ? ` <a href="https://doi.org/${doi}" style="color:${LINK}">https://doi.org/${doi}</a>` : ""
  return `<section id="cite" style="margin-bottom:20px"><h2 style="font-family:Lora,serif;font-weight:400;font-size:30px;line-height:1.2;color:#2b1f1f;border-bottom:1px solid #e8e1db;padding-bottom:10px;margin:0 0 20px">Cite this standard</h2><p style="font-family:'IBM Plex Mono',monospace;font-size:11px;line-height:1.75;color:#5a4141;margin:0 0 10px;max-width:84ch">Pendergrass, K. (2026). <em style="font-style:italic">${esc(subName)}: HMTc standard</em>${stdNo}. Institute of Contaminant Standards.${doiUrl}</p><p style="font-size:11px;line-height:1.6;color:#736b6b;max-width:84ch;margin:0 0 14px">&copy; 2026 Institute of Contaminant Standards / Heavy Metal Certified. All rights reserved.</p><p style="font-size:12.5px;line-height:1.65;color:#a9a1a1;max-width:84ch;margin:0">The literature baseline for every analyte is maintained independently at the ${hmi}. This certification standard applies those findings; the two are kept editorially separate by design.</p></section>`
}

// --- drive --------------------------------------------------------------------
let n = 0
for (const page of PAGES.pages) {
  const variants = page.variants.map((v) => {
    const rec = JSON.parse(fs.readFileSync(path.join(COMPILED, `${v.record}.json`), "utf8"))
    const cells = rec.variants[v.variant] || rec.variants[Object.keys(rec.variants)[0]]
    return { label: v.label, cells, native_basis: rec.native_basis }
  })
  const basisWord = variants[0].native_basis === "as_sold" ? "as-sold" : "as-consumed"
  const version = page.version || "1.0 (2026-08-06)"
  const vshort = version.split(" ")[0]
  const pdfHref = page.pdf || committedPdfHref(page.slug)
  // Real DOI once deposited; set per page in cat1-pages.json when assigned, else read back from the
  // minted page frontmatter (see existingCertDoi above — this is the regen-wipe guard). Flows into
  // both the citation <meta> (via cert_doi frontmatter → Head.tsx) and the visible cite line.
  const certDoi = page.cert_doi || existingCertDoi(page.slug) || null

  const otherNote = variants.length > 1
    ? `Variants on this page: ${variants.map((v) => v.label).join(" and ")}. Where a cell differs between them the Master Limit Table shows both; the derivation above is for ${variants[0].label}.`
    : ""

  const firmCount = PANEL.filter((a) => isFirm(variants[0].cells[a])).length

  const fm = [
    "---",
    `title: "${page.name} — HMTc Standard"`,
    "type: standard",
    `description: "${page.description}"`,
    "category: 1",
    'category_name: "Infant and Child Foods"',
    `product_slug: ${page.slug}`,
    "custom_page: true",
    `subcategory: "${page.name}"`,
    `firm_analytes: ${firmCount}`,
    `native_basis: ${variants[0].native_basis}`,
    `standard_version: "${version}"`,
    'methodology_version: "Method v2.0 — government-limit default (CLAUDE.md Part 19, Governing Principles v2.0)"',
    `variant_type: ${page.variant_type || "whole_row_platform"}`,
    ...(page.hmi_link ? [`hmi_literature_link: ${page.hmi_link}`] : []),
    "effective_date: 2026-08-06",
    // Normative certification specification, not a scholarly work (2026-08-17).
    "scholar_eligible: false",
    `cert_doi: ${certDoi ? JSON.stringify(certDoi) : "null"}`,
    "audience: [regulator, brand-legal, retailer-compliance, certifier]",
    "rail_box:",
    '  title: "Document versions"',
    `  body: "v${vshort} · 2026-08-06 · current. Every edition is dated and kept at a stable permalink; earlier editions and their DOIs appear here as the standard revises. Full change history below."`,
    ...(pdfHref ? [`  cta_label: "Download v${vshort} (PDF)"`, `  cta_href: "${pdfHref}"`] : []),
    "snapshot:",
    `  - { k: "Analytes limited", v: "${firmCount} / ${PANEL.length}" }`,
    '  - { k: "Method", v: "Strictest government ML" }',
    `  - { k: "Native basis", v: "${basisWord}" }`,
    `  - { k: "Standard version", v: "${version}" }`,
    "connections:",
    ...(page.connections || []).map((c) => `  - { label: "${c.label}", href: "${c.href}" }`),
    "---",
  ].join("\n")

  // Occurrence keyed by the compiled RECORD slug (== aggregate product_slug),
  // which for a grouped multi-variant page differs from page.slug.
  const occSection = occurrenceRationaleSection({
    evidence: OCC, toxAnchors: TOX, rowSlug: page.variants[0].record,
    analytes: PANEL.map((a) => descriptorFromCompiledCell(variants[0].cells[a], a)),
  })

  const riskFlag = renderRiskFlagForStandard({
    slug: page.variants[0].record, name: page.name, cells: variants[0].cells,
    occurrence: OCC, categoryDirName: "cat1-compiled", LINK, ACCENT,
  })
  const body = [
    methodSection(page.name, basisWord, pdfHref, vshort),
    masterTable(variants, basisWord, firmCount),
    derivationTable(variants[0], basisWord, page.name, otherNote),
    occSection,
    riskFlag,
    citeSection(page.name, vshort, page.hmi_link, certDoi),
  ].join("\n")

  fs.writeFileSync(path.join(OUT, `${page.slug}.md`), `${fm}\n${body}\n`)
  n++
  console.log(`  rendered ${page.slug}.md  (${variants.length} variant${variants.length > 1 ? "s" : ""})`)
}
console.log(`build-cat1-standard-pages: wrote ${n} page(s)`)
