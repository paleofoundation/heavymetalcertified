#!/usr/bin/env node
// build-cert-analyte-pages.mjs — dedicated reference pages for the 8 HMTc analytes.
//
// Purpose: the homepage "analyte panel" advertises eight metals with real
// toxicological/regulatory substance, and every card used to dead-end. These are
// the destinations: one page per analyte explaining, from the government/agency
// assessments, WHY the metal is limited — the regulatory rationale a regulator or
// brand-legal reader wants.
//
// Firewall (CLAUDE.md Part 2): these are INDEPENDENT REFERENCE pages, not HMTc
// marketing. The cert site APPLIES the science; heavymetalindex.com REPORTS the
// literature. So: neutral reference register, one-way link out to the Index metal
// page for the deep literature baseline, and NO scholar_eligible (they are not
// citable technical-report standards — emitting citation_* would overclaim).
//
// Content is assembled + adversarially verified + self-repaired by the
// cert-analyte-pages / cert-analyte-finalize workflows and lands in
// data/analytes/analytes.json. This generator only renders it into the cert design.

import fs from "node:fs"
import path from "node:path"

const REPO = process.cwd()
const DATA = JSON.parse(fs.readFileSync(path.join(REPO, "data/analytes/analytes.json"), "utf8"))
const OUT = path.join(REPO, "content/analytes")
fs.mkdirSync(OUT, { recursive: true })

const ACCENT = "#9f2727"
const LINK = "#1c43ad"

// ── Government maximum-levels register (worldwide) ────────────────────────────
// The same firewall-clean snapshot the /regulations pages render (HMI exports it,
// it is committed here, this build reads the local copy; one-way HMI -> cert). Each
// instrument carries { slug -> /regulations/<slug>, jurisdiction, authority, name,
// primary_url, limits[] } and each limit row { analyte, value_ug_kg, basis, scope,
// status, url, notes }. It is the source for the per-analyte "Government maximum
// levels" comparison section: what the LAW says, never an HMTc threshold (Part 2).
const REG_SNAPSHOT = path.join(REPO, "data/regulations/cert-regulation-snapshot.json")
const REG = fs.existsSync(REG_SNAPSHOT)
  ? JSON.parse(fs.readFileSync(REG_SNAPSHOT, "utf8"))
  : { instruments: [] }

// analyte code -> [{ inst, l }] across every instrument in the register. Codes are
// the register's own vocabulary (Pb, tAs, iAs, Cd, tHg, MeHg, iHg, Ni, Al, Sn, Cr,
// Cr-total, Cr-VI, ...); an analyte PAGE maps to one or more of them (arsenic ->
// iAs+tAs, mercury -> tHg+MeHg+iHg, chromium -> Cr-total+Cr+Cr-VI).
const LIMITS_BY_CODE = (() => {
  const m = new Map()
  for (const inst of REG.instruments || []) {
    for (const l of inst.limits || []) {
      if (typeof l.value_ug_kg !== "number") continue
      if (!m.has(l.analyte)) m.set(l.analyte, [])
      m.get(l.analyte).push({ inst, l })
    }
  }
  return m
})()

// Which register code(s) each analyte page draws, in the order they render, with
// the speciation-correct display label. Arsenic and mercury split by species so a
// total limit is never compared against a speciated one; chromium separates total
// chromium from any hexavalent-chromium (Cr-VI) food limit.
const PAGE_CODES = {
  lead: [{ code: "Pb", label: "Lead (Pb)" }],
  cadmium: [{ code: "Cd", label: "Cadmium (Cd)" }],
  arsenic: [
    { code: "iAs", label: "Inorganic arsenic (iAs)" },
    { code: "tAs", label: "Total arsenic (tAs)" },
  ],
  mercury: [
    { code: "tHg", label: "Total mercury (tHg)" },
    { code: "MeHg", label: "Methylmercury (MeHg)" },
    { code: "iHg", label: "Inorganic mercury (iHg)" },
  ],
  nickel: [{ code: "Ni", label: "Nickel (Ni)" }],
  tin: [{ code: "Sn", label: "Tin (Sn)" }],
  aluminum: [{ code: "Al", label: "Aluminum (Al)" }],
  chromium: [
    { code: "Cr-total", label: "Total chromium (Cr)" },
    { code: "Cr", label: "Chromium (Cr, unspeciated)" },
    { code: "Cr-VI", label: "Hexavalent chromium (Cr-VI)" },
  ],
}

// Human-readable jurisdiction names for the register's ISO-ish jurisdiction codes,
// so the comparison scans as places, not codes. Any unmapped code falls back to
// the code itself (honest — never invents a country).
const JURISDICTION_NAMES = {
  "AU-NZ": "Australia & New Zealand", BA: "Bosnia & Herzegovina", BR: "Brazil",
  CA: "Canada", CH: "Switzerland", CL: "Chile", CN: "China", CO: "Colombia",
  CODEX: "Codex Alimentarius", CR: "Costa Rica", CU: "Cuba", EC: "Ecuador",
  EU: "European Union", FJ: "Fiji", GSO: "Gulf (GSO)", GY: "Guyana",
  HK: "Hong Kong", IL: "Israel", IN: "India", JP: "Japan", MA: "Morocco",
  MERCOSUR: "Mercosur", MX: "Mexico", PA: "Panama", PH: "Philippines",
  PY: "Paraguay", SG: "Singapore", TH: "Thailand", TR: "Türkiye",
  TT: "Trinidad & Tobago", UK: "United Kingdom", US: "United States",
  UY: "Uruguay", VN: "Vietnam",
}
const jurName = (code) => JURISDICTION_NAMES[code] || String(code || "").trim()

// A short citation handle for an instrument, for the Instrument column: cut the
// descriptive tail of the (often verbose) official name at the first structural
// separator, cap the length, and fall back to the jurisdiction code when the name
// is empty or a bare number. Ported from build-cert-regulation-pages.mjs so the
// two surfaces name the same instrument the same way.
function shortHandle(ref, jur) {
  let r = String(ref || "").trim()
  r = r.split(/\s+—\s+|\s+–\s+|\s+-\s+/)[0].trim()
  const head = r.split(/\s+(?:of|on)\s+/i)[0].trim()
  if (head.length >= 14) r = head
  r = r.replace(/[;,]\s*$/, "").trim()
  if (r.length > 46) r = r.slice(0, 45).trim() + "…"
  if (r.length < 4 || /^[\d.]+$/.test(r)) return jur
  return r
}

// µg/kg value formatted with thousands separators so 250000 reads as 250,000 and
// the column is scannable; preserves any decimal the register carries.
const fmtVal = (v) => Number(v).toLocaleString("en-US", { maximumFractionDigits: 3 })

// The HMTc analytes California has listed under Proposition 65 (see
// content/regulations/ca-prop65.md). Cr-VI maps to the chromium page, iAs to arsenic.
const PROP65_LISTED = new Set(["lead", "cadmium", "arsenic", "chromium", "nickel"])

const esc = (s) =>
  String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")

// Linkify the known cross-references the prose carries (Index URLs, and cert
// /regulations//standards//analytes paths) into <a>, on already-escaped text.
function linkify(s) {
  let t = esc(s)
  t = t.replace(
    /https?:\/\/heavymetalindex\.com\/[^\s)]+/g,
    (m) => `<a href="${m}" style="color:${LINK}">${m.replace(/^https?:\/\//, "")}</a>`,
  )
  t = t.replace(
    /(^|[\s(])(\/(?:regulations|standards|analytes)\/[a-z0-9-]+)/g,
    (_m, pre, url) => `${pre}<a href="${url}" style="color:${LINK}">${url}</a>`,
  )
  return t
}

const H2 = (t) =>
  `<h2 style="font-family:Lora,serif;font-weight:400;font-size:30px;line-height:1.2;color:#2b1f1f;border-bottom:1px solid #e8e1db;padding-bottom:10px;margin:0 0 20px">${t}</h2>`
const PROSE = (html) =>
  `<p style="font-size:15.5px;line-height:1.75;color:#3f3a3a;margin:0 0 16px;max-width:84ch">${html}</p>`
const MONO_TH = (t, align = "left") =>
  `<th style="text-align:${align};padding:9px 12px;font-family:'IBM Plex Mono',monospace;font-size:9.5px;font-weight:500;letter-spacing:.08em;text-transform:uppercase">${t}</th>`

// The "Why it is limited" evidence table — the regulatory rationale, one row per
// agency assessment. Same red-header table language as the standard pages.
function whyLimitedTable(rows) {
  const head = `<tr style="background:${ACCENT};color:#fff">${MONO_TH("Body")}${MONO_TH("Year")}${MONO_TH("Assessment")}${MONO_TH("What it concluded")}</tr>`
  const body = rows
    .map((r, i) => {
      const zebra = i % 2 ? ";background:#fbf7f5" : ""
      return `<tr style="border-bottom:1px solid #f2ece7${zebra}"><td style="padding:10px 12px;font-family:'IBM Plex Mono',monospace;font-size:12px;color:#2b1f1f;white-space:nowrap">${esc(r.agency)}</td><td style="padding:10px 12px;color:#736b6b;font-size:12.5px">${esc(r.year || "—")}</td><td style="padding:10px 12px;color:#5a4141;font-size:13px">${esc(r.document || "—")}</td><td style="padding:10px 12px;color:#3f3a3a;font-size:13px;line-height:1.6">${linkify(r.finding)}</td></tr>`
    })
    .join("")
  return `<div style="overflow-x:auto"><table style="width:100%;font-size:13px;border:1px solid #e8e1db;min-width:52rem;border-collapse:collapse"><thead>${head}</thead><tbody>${body}</tbody></table></div>`
}

const CAPTION = (t) =>
  `<p style="font-size:11.5px;line-height:1.55;color:#a9a1a2;max-width:84ch;margin:0 0 10px">${linkify(t)}</p>`

// Generic burgundy-header data table — ports whyLimitedTable's exact styling.
// opts.mono = column indices whose cells render as IBM Plex Mono measured values
// (a number in a table cell, never in a prose sentence — COMPONENTS.md atom);
// opts.right = right-aligned column indices; opts.minWidth overrides the 52rem floor.
function dataTable(columns, rows, opts = {}) {
  const mono = new Set(opts.mono || [])
  const right = new Set(opts.right || [])
  const minWidth = opts.minWidth || "52rem"
  const head = `<tr style="background:${ACCENT};color:#fff">${columns
    .map((c, i) => MONO_TH(c, right.has(i) ? "right" : "left"))
    .join("")}</tr>`
  const body = rows
    .map((cells, ri) => {
      const zebra = ri % 2 ? ";background:#fbf7f5" : ""
      const tds = cells
        .map((cell, ci) => {
          const align = right.has(ci) ? "text-align:right;" : ""
          return mono.has(ci)
            ? `<td style="padding:10px 12px;${align}font-family:'IBM Plex Mono',monospace;font-size:12.5px;color:#2b1f1f;white-space:nowrap;line-height:1.6">${esc(cell)}</td>`
            : `<td style="padding:10px 12px;${align}color:#3f3a3a;font-size:13px;line-height:1.6">${esc(cell)}</td>`
        })
        .join("")
      return `<tr style="border-bottom:1px solid #f2ece7${zebra}">${tds}</tr>`
    })
    .join("")
  return `<div style="overflow-x:auto"><table style="width:100%;font-size:13px;border:1px solid #e8e1db;min-width:${minWidth};border-collapse:collapse"><thead>${head}</thead><tbody>${body}</tbody></table></div>`
}

// Occurrence & exposure — the empirical layer. Answers "how much of the analyte
// does food actually carry, and how close does dietary exposure run to the health
// guidance value" — the substantiation for why the program monitors the analyte,
// as reported occurrence data (firewall register: report, do not market). Renders
// only when the analyte carries an `occurrence` block, so analytes still awaiting
// the data are unaffected.
function occurrenceSection(a) {
  const o = a.occurrence
  if (!o) return ""
  const idxUrl = `https://heavymetalindex.com/metals/${a.index_link_slug}`
  const parts = [
    `<section id="occurrence" style="margin-bottom:52px">`,
    H2("Occurrence &amp; exposure"),
    `<p style="font-size:13.5px;line-height:1.7;color:#736b6b;max-width:84ch;margin:0 0 20px">${linkify(o.intro)}</p>`,
  ]
  // One or more data tables, each with its own caption, columns, rows, and
  // mono/right column sets — so each analyte can carry the table shape its data
  // and toxicology call for (a "% of TWI" exposure table for a threshold metal,
  // a prevalence/exceedance table for a no-threshold carcinogen).
  ;(o.tables || []).forEach((t, i) => {
    if (i > 0) parts.push(`<div style="height:28px"></div>`)
    if (t.caption) parts.push(CAPTION(t.caption))
    parts.push(dataTable(t.columns, t.rows, { mono: t.mono || [], right: t.right || [], minWidth: t.minWidth }))
  })
  parts.push(`<div style="height:10px"></div>`)
  ;(o.prose || []).forEach((p) => parts.push(PROSE(linkify(p))))
  if (o.source_note) {
    parts.push(
      `<p style="font-size:12px;line-height:1.6;color:#a9a1a2;max-width:84ch;margin:8px 0 0">${linkify(o.source_note)} The full occurrence corpus is on the <a href="${idxUrl}" style="color:${LINK}">Heavy Metal Index</a>.</p>`,
    )
  }
  parts.push(`</section>`)
  return parts.join("")
}

// One instrument's contribution to a species: min/max limit, scope list, link. The
// register carries many limit rows per instrument (one per product class); the
// analyte page compares at the instrument level, then links out to /regulations/<slug>
// for the full per-matrix breakdown, so a 700-row national register does not have to
// be re-dumped here.
function instrumentSummary(rows) {
  const vals = rows.map((r) => r.l.value_ug_kg)
  const scopes = [...new Set(rows.map((r) => String(r.l.scope || "").trim()).filter(Boolean))]
  return { min: Math.min(...vals), max: Math.max(...vals), scopes, n: rows.length }
}

// The comparison table for one species (register code): one row per instrument,
// sorted by strictest value ascending, so the tightest regimes rise to the top and
// the µg/kg column reads as a like-for-like ladder. Columns: Jurisdiction,
// Instrument (-> /regulations/<slug>), Product scope, Limit µg/kg.
function govLimitsTable(pairs) {
  // Group the analyte's rows by instrument slug.
  const byInst = new Map()
  for (const p of pairs) {
    if (!byInst.has(p.inst.slug)) byInst.set(p.inst.slug, { inst: p.inst, rows: [] })
    byInst.get(p.inst.slug).rows.push(p)
  }
  const instRows = [...byInst.values()].map(({ inst, rows }) => ({ inst, ...instrumentSummary(rows) }))
  instRows.sort((x, y) => x.min - y.min || jurName(x.inst.jurisdiction).localeCompare(jurName(y.inst.jurisdiction)))

  const thBase = `text-align:left;padding:9px 12px;font-family:'IBM Plex Mono',monospace;font-size:9.5px;font-weight:500;letter-spacing:.08em;text-transform:uppercase`
  const head =
    `<tr style="background:${ACCENT};color:#fff">` +
    `<th style="${thBase}">Jurisdiction</th>` +
    `<th style="${thBase}">Instrument</th>` +
    `<th style="${thBase}">Product scope</th>` +
    `<th style="${thBase};text-align:right;white-space:nowrap">Limit &micro;g/kg</th></tr>`
  const body = instRows
    .map((r, i) => {
      const zebra = i % 2 ? ";background:#fbf7f5" : ""
      const jn = jurName(r.inst.jurisdiction)
      const jcell =
        jn === r.inst.jurisdiction
          ? esc(jn)
          : `${esc(jn)} <span style="color:#b7aeae">(${esc(r.inst.jurisdiction)})</span>`
      // Product scope: list the actual product classes when an instrument sets only
      // a few for this analyte (the sparse metals and most non-EU registers), else a
      // count — the full list is on the linked instrument page either way.
      const scopeCell =
        r.scopes.length === 0
          ? "&mdash;"
          : r.scopes.length <= 3
            ? esc(r.scopes.join("; "))
            : `${r.scopes.length} product classes`
      const limitCell = r.min === r.max ? fmtVal(r.min) : `${fmtVal(r.min)} &ndash; ${fmtVal(r.max)}`
      const handle = shortHandle(r.inst.name, r.inst.jurisdiction)
      const instCell = `<a href="/regulations/${esc(r.inst.slug)}" style="color:${LINK}">${esc(handle)}</a>`
      return (
        `<tr style="border-bottom:1px solid #f2ece7${zebra}">` +
        `<td style="padding:10px 12px;font-family:'IBM Plex Mono',monospace;font-size:12px;color:#2b1f1f;line-height:1.5;vertical-align:top;white-space:nowrap">${jcell}</td>` +
        `<td style="padding:10px 12px;font-size:12.5px;line-height:1.55;vertical-align:top">${instCell}</td>` +
        `<td style="padding:10px 12px;font-size:13px;color:#2b1f1f;line-height:1.55;vertical-align:top">${scopeCell}</td>` +
        `<td style="padding:10px 12px;text-align:right;font-family:'IBM Plex Mono',monospace;font-size:12.5px;color:#2b1f1f;white-space:nowrap;line-height:1.6;vertical-align:top;font-variant-numeric:tabular-nums">${limitCell}</td>` +
        `</tr>`
      )
    })
    .join("")
  return {
    html: `<div style="overflow-x:auto"><table style="width:100%;font-size:13px;border:1px solid #e8e1db;min-width:48rem;border-collapse:collapse"><thead>${head}</thead><tbody>${body}</tbody></table></div>`,
    nInstruments: instRows.length,
    nJurisdictions: new Set(instRows.map((r) => r.inst.jurisdiction)).size,
    min: Math.min(...instRows.map((r) => r.min)),
    max: Math.max(...instRows.map((r) => r.max)),
  }
}

// Speciation note per page: why a total and a speciated limit are not comparable,
// rendered under the sub-heading. Empty for single-species metals.
const SPECIATION_NOTE = {
  iAs: "Inorganic arsenic is the toxicologically governing species and the basis most food limits are now set on. It is bounded by total arsenic (iAs ≤ tAs); an inorganic-arsenic limit is not comparable to a total-arsenic limit for the same product.",
  tAs: "Total arsenic includes the less-toxic organic forms and is the older basis; where a jurisdiction sets both, the inorganic-arsenic limit governs.",
  tHg: "Total mercury is the general limit basis for most foods.",
  MeHg: "Methylmercury is the toxicologically governing species in fish and seafood and is bounded by total mercury (MeHg ≤ tHg); a methylmercury limit is not comparable to a total-mercury limit for the same product.",
  iHg: "Inorganic mercury limits are set for a narrow set of matrices and are distinct from both total mercury and methylmercury.",
  "Cr-total": "These are limits on total chromium. Food-specific hexavalent-chromium (Cr-VI) maximum levels are rare; where a jurisdiction regulates only total chromium, Cr-VI is controlled downstream, not by a separate food limit.",
  Cr: "Reported by the instrument as chromium without a stated oxidation state; read as total chromium.",
  "Cr-VI": "Hexavalent chromium, the toxicologically governing species, is bounded by total chromium (Cr-VI ≤ total Cr).",
}

// "Government maximum levels" — the comparison of what governments limit this
// analyte to, for what, at what value, in one normalized unit (µg/kg = ppb).
// Reports the LAW (Part 2 firewall: never an HMTc threshold). Renders only for the
// register codes the page maps to; a code with no rows is skipped, so a sparse
// analyte (aluminium, chromium) shows what exists without a manufactured gap.
function govLimitsSection(a) {
  const codes = PAGE_CODES[a.slug] || []
  const present = codes.filter((c) => (LIMITS_BY_CODE.get(c.code) || []).length > 0)
  if (!present.length) return ""
  const multi = present.length > 1

  const parts = [
    `<section id="gov-limits" style="margin-bottom:52px">`,
    H2("Government maximum levels"),
    `<p style="font-size:13.5px;line-height:1.7;color:#736b6b;max-width:84ch;margin:0 0 20px">The maximum levels credible governments set for ${esc(a.name.toLowerCase())} in food, drawn from the worldwide contaminant register. Every value is shown in &micro;g/kg (equivalent to ppb), normalized to one unit so the limits can be compared directly, each in the basis its instrument states and linked to the source instrument. This is the government record; the Heavy Metal Tested &amp; Certified program applies these limits, it does not set them, and the certification thresholds are not shown on this page.</p>`,
  ]

  for (const { code, label } of present) {
    const pairs = LIMITS_BY_CODE.get(code)
    const t = govLimitsTable(pairs)
    if (multi) {
      parts.push(
        `<h3 style="font-family:Lora,serif;font-weight:400;font-size:21px;line-height:1.2;color:#2b1f1f;margin:28px 0 8px">${esc(label)}</h3>`,
      )
      if (SPECIATION_NOTE[code]) {
        parts.push(
          `<p style="font-size:13px;line-height:1.65;color:#736b6b;max-width:84ch;margin:0 0 12px">${esc(SPECIATION_NOTE[code])}</p>`,
        )
      }
    }
    const range = t.min === t.max ? `${fmtVal(t.min)}` : `${fmtVal(t.min)} to ${fmtVal(t.max)}`
    parts.push(
      `<p style="font-size:11.5px;line-height:1.55;color:#a9a1a2;max-width:84ch;margin:0 0 10px">${esc(label)}: ${t.nInstruments} instrument${t.nInstruments === 1 ? "" : "s"} across ${t.nJurisdictions} jurisdiction${t.nJurisdictions === 1 ? "" : "s"}; values range ${range} &micro;g/kg. One row per instrument, sorted by the strictest limit it sets; a range spans the instrument's product classes.</p>`,
    )
    parts.push(t.html)
    if (multi) parts.push(`<div style="height:20px"></div>`)
  }

  parts.push(
    `<p style="font-size:12px;line-height:1.6;color:#a9a1a2;max-width:84ch;margin:16px 0 0">Each instrument's full per-product-class breakdown, with every provision, is on its <a href="/regulations" style="color:${LINK}">regulation reference</a> page (linked in the Instrument column). The complete cross-jurisdiction derivation is maintained independently on the <a href="https://heavymetalindex.com/metals/${a.index_link_slug}" style="color:${LINK}">Heavy Metal Index</a>.</p>`,
  )
  parts.push(`</section>`)
  return parts.join("")
}

function pageBody(a) {
  const idxUrl = `https://heavymetalindex.com/metals/${a.index_link_slug}`
  const header = `<section style="margin-bottom:40px"><h1 style="font-family:Lora,serif;font-weight:400;font-size:38px;line-height:1.1;color:#2b1f1f;margin:0 0 8px">${esc(a.name)}</h1><div style="font-family:'IBM Plex Mono',monospace;font-size:12px;letter-spacing:.04em;color:#b7aeae;margin:0 0 18px">${a.z} &middot; ${esc(a.sym)} &middot; ${esc(a.species)}</div><p style="font-size:17px;line-height:1.7;color:#3f3a3a;margin:0;max-width:80ch">${linkify(a.thesis)}</p></section>`

  const why = `<section id="why-limited" style="margin-bottom:52px">${H2("Why it is limited")}<p style="font-size:13.5px;line-height:1.7;color:#736b6b;max-width:84ch;margin:0 0 16px">The government and expert-body assessments that underpin limiting ${esc(a.name.toLowerCase())} in food, and what each concluded. The maximum levels in force apply these findings; this page is the rationale, not the certification threshold.</p>${whyLimitedTable(a.why_limited || [])}</section>`

  // Toxicological basis: a deep `toxicology` array (paragraphs — the case for WHY
  // the science warrants regulation) when present; otherwise the legacy one-line
  // `toxicology_summary`. Optional `toxicology_intro` renders as a muted lead-in
  // (same register as the "Why it is limited" section intro).
  const toxParas = Array.isArray(a.toxicology) && a.toxicology.length
    ? a.toxicology
    : [a.toxicology_summary]
  const toxLead = a.toxicology_intro
    ? `<p style="font-size:13.5px;line-height:1.7;color:#736b6b;max-width:84ch;margin:0 0 16px">${linkify(a.toxicology_intro)}</p>`
    : ""
  const tox = `<section id="toxicology" style="margin-bottom:52px">${H2("Toxicological basis")}${toxLead}${toxParas
    .filter(Boolean)
    .map((p) => PROSE(linkify(p)))
    .join("")}</section>`

  const reg = `<section id="regulation" style="margin-bottom:52px">${H2("How it is regulated")}${PROSE(linkify(a.how_regulated))}</section>`

  const hmtc = `<section id="hmtc" style="margin-bottom:52px">${H2("How the HMTc program treats it")}${PROSE(linkify(a.hmtc_treatment))}</section>`

  const baseline = `<section id="baseline" style="margin-bottom:20px">${H2("Literature baseline")}<p style="font-size:13.5px;line-height:1.7;color:#736b6b;max-width:84ch;margin:0">The complete peer-reviewed and regulatory literature for ${esc(a.name.toLowerCase())} is maintained independently at the <a href="${idxUrl}" style="color:${LINK}">Heavy Metal Index</a>. That reference reports what the literature says; this certification site applies it. The two are kept editorially separate by design.</p></section>`

  const occ = occurrenceSection(a)
  const gov = govLimitsSection(a)
  return [header, why, tox, occ, reg, gov, hmtc, baseline].filter(Boolean).join("\n")
}

function frontmatter(a) {
  const desc = `Why ${a.name} (${a.sym}) is limited in infant and child foods: the government and expert-body assessments behind the maximum levels, the toxicological basis, and how the Heavy Metal Tested & Certified program treats the analyte. Reference page; the literature baseline is maintained independently at the Heavy Metal Index.`
  return [
    "---",
    `title: "${a.name} (${a.sym}) — HMTc analyte"`,
    "type: analyte",
    "custom_page: true",
    `analyte_symbol: ${a.sym}`,
    `atomic_number: ${a.z}`,
    `description: "${desc.replace(/"/g, "'")}"`,
    "audience: [regulator, brand-legal, retailer-compliance, certifier, educator]",
    "connections:",
    `  - { label: "The analyte panel", href: "/analytes" }`,
    // The one-way "why we limit" rationale synthesis for this metal — the authored,
    // question-intent companion to this neutral reference page.
    `  - { label: "Why we limit ${a.name.toLowerCase()}", href: "/why-we-limit/${a.slug}" }`,
    `  - { label: "The standards register", href: "/standards" }`,
    `  - { label: "Regulation references (source documents)", href: "/regulations" }`,
    // California Prop 65 listing cross-link, only for the analytes California has
    // listed (lead, cadmium, inorganic arsenic, hexavalent chromium, nickel).
    ...(PROP65_LISTED.has(a.slug)
      ? [`  - { label: "California Proposition 65 listing", href: "/regulations/ca-prop65" }`]
      : []),
    `  - { label: "Heavy Metal Index — ${a.name} literature", href: "https://heavymetalindex.com/metals/${a.index_link_slug}" }`,
    "rail_box:",
    '  title: "The analyte panel"',
    '  body: "Eight metals, ten analytes. Each page states why the metal is limited from the government record; the maximum levels themselves live on the standards, and the deep literature on the Heavy Metal Index."',
    "---",
  ].join("\n")
}

// Per-analyte pages.
let n = 0
for (const a of DATA.analytes) {
  fs.writeFileSync(path.join(OUT, `${a.slug}.md`), `${frontmatter(a)}\n${pageBody(a)}\n`, "utf8")
  n++
}

// The /analytes index — "the analyte panel" page, ported VERBATIM from the approved
// Claude Design canvas `isAnalytes` screen (Heavy Metal Certified v3.dc.html). The
// hero band, "On this page" rail, and Connections/rail are driven by frontmatter
// (HeroBand / Snav / Rail) — no hand-rolled hero. Body = four sections: Scope of the
// panel, The panel at a glance (Analyte·Symbol·Reported-as·Tier table), Tier 1
// (accordion), Tier 2 (accordion). The Tier accordions reuse the .hmtc-mhard
// component in cert-chrome.scss. See [[project_manual_v3_canonical_design]].
const H2S = `font-family:Lora,serif;font-weight:400;font-size:30px;line-height:1.2;color:#2b1f1f;border-bottom:1px solid #e8e1db;padding-bottom:10px;margin:0 0 20px`
// Tier per metal (the toxic-species tier the canvas assigns): Pb·Cd·As·Hg = Tier 1,
// Ni·Sn·Al·Cr = Tier 2.
const ANALYTE_TIER = { lead: 1, cadmium: 1, arsenic: 1, mercury: 1, nickel: 2, tin: 2, aluminum: 2, chromium: 2 }

function tierPill(t) {
  return t === 1
    ? `<span style="font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;color:#9f2727;border:1px solid #f2dcda;background:#fdf4f3;border-radius:2px;padding:3px 7px">Tier 1</span>`
    : `<span style="font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;color:#8a7f7f;border:1px solid #e8e1db;background:#faf7f4;border-radius:2px;padding:3px 7px">Tier 2</span>`
}

// One <details> accordion per analyte (canvas tier1Rows/tier2Rows). Reuses the
// .hmtc-mhard component: a +/− sign + Lora name summary, then meta · why · Reference.
function analyteAccordion(list, openState) {
  return list
    .map(
      (a) => `<details class="hmtc-mhard"${openState ? " open" : ""}>
<summary class="hmtc-mhard-sum"><span class="hmtc-mhard-sign" aria-hidden="true"></span><span class="hmtc-mhard-name">${esc(a.name)}</span></summary>
<div class="hmtc-mhard-panel">
<div style="font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:.06em;color:#a9a1a1;margin-bottom:10px">${esc(a.sym)} &middot; ${esc(a.species)}</div>
<p>${esc(a.thesis)}</p>
<a href="/analytes/${a.slug}" style="display:inline-block;margin-top:16px;font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:${LINK};text-decoration:none">Reference page &rarr;</a>
</div>
</details>`,
    )
    .join("\n")
}

function indexPage() {
  const tier1 = DATA.analytes.filter((a) => ANALYTE_TIER[a.slug] === 1)
  const tier2 = DATA.analytes.filter((a) => ANALYTE_TIER[a.slug] === 2)
  // "The panel at a glance" table — canonical burgundy head (from .wiki-content
  // thead, not inline), first column tinted, symbol mono-red, tier pill.
  const tblRows = DATA.analytes
    .map(
      (a) =>
        `<tr><td style="background:#fdf4f3;white-space:nowrap"><a href="/analytes/${a.slug}" style="color:${LINK};text-decoration:none">${esc(a.name)}</a></td><td style="font-family:'IBM Plex Mono',monospace;color:#9f2727;border-left:1px solid #f4eee9">${esc(a.sym)}</td><td style="border-left:1px solid #f4eee9">${esc(a.species)}</td><td style="border-left:1px solid #f4eee9;white-space:nowrap">${tierPill(ANALYTE_TIER[a.slug])}</td></tr>`,
    )
    .join("")

  const fm = [
    "---",
    'title: "The analyte panel"',
    "type: analyte",
    "custom_page: true",
    'breadcrumb_leaf: "Analytes"',
    'description: "The ten analytes the Heavy Metal Tested & Certified program quantifies, and why each is limited — one reference page per metal, drawn from the government and expert-body record."',
    "updated: 2026-08-18",
    "audience: [regulator, brand-legal, retailer-compliance, certifier, educator]",
    'hero_action: { label: "Maximum levels in force", href: "/standards" }',
    "snapshot:",
    '  - { k: "Metals", v: "8" }',
    '  - { k: "Analytes quantified", v: "10" }',
    '  - { k: "Tier 1 — zero-tolerance", v: "4" }',
    '  - { k: "Reference pages", v: "8" }',
    "connections:",
    '  - { label: "The standards register", href: "/standards" }',
    '  - { label: "How limits are derived", href: "/program/structure" }',
    '  - { label: "Verify a certificate", href: "/verify" }',
    '  - { label: "All Program Manuals", href: "/manuals" }',
    "---",
  ].join("\n")

  const scope = `<section style="margin-bottom:52px">
<h2 id="scope-panel" style="${H2S}">Scope of the panel</h2>
<p style="font-size:17.5px;line-height:1.72;color:#2b1f1f;margin:0 0 18px;max-width:74ch">Eight metals, ten analytes: <a href="/analytes/arsenic" style="color:${LINK}">arsenic</a> and <a href="/analytes/mercury" style="color:${LINK}">mercury</a> are each reported in total and speciated form. Each page states, from the government and expert-body record, why the metal is limited.</p>
<p style="font-size:16.5px;line-height:1.78;color:#3f3a3a;margin:0 0 4px;max-width:74ch">For the plain-language rationale &mdash; the toxicological basis, the exposure reality, and the case for a certification limit, metal by metal &mdash; see <a href="/why-we-limit" style="color:${LINK}">why we limit each metal</a>. The maximum levels in force are on the <a href="/standards" style="color:${LINK}">standards</a>; the complete literature is on the <a href="https://heavymetalindex.com" style="color:${LINK}">Heavy Metal Index</a>.</p>
</section>`

  const glance = `<section style="margin-bottom:52px">
<h2 id="panel" style="${H2S}">The panel at a glance</h2>
<p style="font-size:13.5px;line-height:1.7;color:#736b6b;margin:0 0 20px;max-width:84ch">Eight metals, ten analytes. Arsenic is reported as total arsenic and inorganic arsenic; mercury as total mercury and methylmercury. Tier&nbsp;1 analytes are zero-tolerance; Tier&nbsp;2 analytes are capped to the government limit and carry the program&rsquo;s 150% transitional allowance under a stated remediation plan.</p>
<div style="overflow-x:auto;border:1px solid #e8e1db"><table style="width:100%;border-collapse:collapse;min-width:44rem"><thead><tr><th>Analyte</th><th>Symbol</th><th>Reported as</th><th>Tier</th></tr></thead><tbody>${tblRows}</tbody></table></div>
</section>`

  const t1 = `<section style="margin-bottom:52px">
<h2 id="tier1" style="${H2S}">Tier 1 &mdash; zero-tolerance toxics</h2>
<p style="font-size:13.5px;line-height:1.7;color:#736b6b;margin:0 0 20px;max-width:84ch">No transitional allowance applies to these four analytes. A lot that exceeds the limit cannot be certified while that result stands.</p>
<div class="hmtc-mhard-list">${analyteAccordion(tier1, false)}</div>
</section>`

  const t2 = `<section style="margin-bottom:20px">
<h2 id="tier2" style="${H2S}">Tier 2 &mdash; capped to the government limit</h2>
<p style="font-size:13.5px;line-height:1.7;color:#736b6b;margin:0 0 20px;max-width:84ch">These four are held to the strictest sovereign maximum level for the product, and carry the program&rsquo;s 150% transitional allowance under a stated remediation plan.</p>
<div class="hmtc-mhard-list">${analyteAccordion(tier2, true)}</div>
</section>`

  fs.writeFileSync(path.join(OUT, "index.md"), `${fm}\n${scope}\n${glance}\n${t1}\n${t2}\n`, "utf8")
}
indexPage()

console.log(`build-cert-analyte-pages: wrote ${n} analyte page(s) + index`)
