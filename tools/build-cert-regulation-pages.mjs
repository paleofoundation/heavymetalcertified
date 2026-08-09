#!/usr/bin/env node
// Build per-instrument regulation reference pages for heavymetalcertified.com,
// in the v3 design canon (Heavy Metal Certified v3.dc.html — the "Regulation
// references" and "Regulation reference — GB 2762" screens).
//
// INPUT  : data/regulations/infant-instruments.json  (the verified infant-food
//          limits each cited government instrument sets, exported from the Heavy
//          Metal Index regulatory register)
//        + data/regulations/instrument-notes.json  (the editorial SIDECAR: each
//          instrument's legal nature and CURATED one-way cert→index cross-links;
//          the register is exported data and must not carry editorial prose, so
//          anything a re-export would clobber lives here. All fields optional.)
//        + data/standards/{cat1,seafood}-pages.json  (the published standards)
//          and data/standards/{cat1,seafood}-compiled/<record>.json  (their
//          per-analyte binding jurisdiction) — used ONLY to derive, per
//          instrument, which published standards it binds ("Where HMTc cites it").
// OUTPUT : content/regulations/<slug>.md  — one page per instrument + index.md.
//          The v3 chrome (red hero band, "On this page" rail, Connections rail)
//          is emitted by the HeroBand / Snav / Rail components from the
//          frontmatter this file writes; the body is the centre-column sections.
//
// DEPTH (2026-08): these pages carry the same seven-rail depth as the Heavy Metal
// Index regulator pages (the /regulators/oehha model) — Quick read, Mandate &
// scope, the limits table with a per-metal positions strip, a cross-instrument
// "Where it diverges" section, "Where HMTc cites it", and Key documents &
// references — with dense internal cross-linking: every sibling instrument, every
// analyte page, and one-way outbound citations to the Heavy Metal Index deep
// dives. The divergence tables are derived entirely from the register, so they
// scale as instruments are added; the sidecar only supplies the curated index
// links a machine cannot infer.
//
// These pages are the "receipts" behind the standards: every number a standard's
// derivation cites resolves to the instrument page that sets it, with the primary
// citation and retrieval date. They RECORD sovereign law; they do not set or
// justify HMTc thresholds (that is the standard's job) — a one-way, firewall-clean
// reference. Government limits render as plain IBM Plex Mono numbers, never as a
// bold `**N ppb**` or a `data-firm-ppb` marker (both trip firewall-cert-lint /
// design-lint). `ca-prop65.md` is hand-authored and is not written by this tool.

import fs from "node:fs"
import path from "node:path"

const repoRoot = process.cwd()
const DATA = path.join(repoRoot, "data/regulations/infant-instruments.json")
const NOTES = path.join(repoRoot, "data/regulations/instrument-notes.json")
const OUT = path.join(repoRoot, "content/regulations")
const STD_DIRS = [
  { pages: "data/standards/cat1-pages.json", compiled: "data/standards/cat1-compiled" },
  { pages: "data/standards/seafood-pages.json", compiled: "data/standards/seafood-compiled" },
]
const STD_CONTENT = path.join(repoRoot, "content/standards")

const ANALYTE_DISP = {
  Pb: "Lead (Pb)", iAs: "Inorganic arsenic (iAs)", tAs: "Total arsenic (tAs)",
  Cd: "Cadmium (Cd)", tHg: "Mercury, total (tHg)", MeHg: "Methylmercury (MeHg)",
  Ni: "Nickel (Ni)", Al: "Aluminium (Al)", Sn: "Tin (Sn)", "Cr-total": "Total chromium (Cr)",
  "Cr-VI": "Hexavalent chromium (Cr-VI)", Cr: "Chromium (Cr)",
}
// Short prose name for the metal, for the quick read and the divergence leads.
const ANALYTE_SHORT = {
  Pb: "lead", iAs: "inorganic arsenic", tAs: "total arsenic", Cd: "cadmium",
  tHg: "mercury", MeHg: "methylmercury", Ni: "nickel", Al: "aluminium", Sn: "tin",
  "Cr-total": "total chromium", "Cr-VI": "hexavalent chromium", Cr: "chromium",
}
// analyte token -> the shared slug used by BOTH the cert analyte page
// (/analytes/<slug>) and the Heavy Metal Index per-metal page (/metals/<slug>).
// The index uses the US spelling "aluminum"; cert content/analytes matches it.
const ANALYTE_SLUG = {
  Pb: "lead", iAs: "arsenic", tAs: "arsenic", Cd: "cadmium", tHg: "mercury",
  MeHg: "mercury", Ni: "nickel", Al: "aluminum", Sn: "tin",
  "Cr-total": "chromium", "Cr-VI": "chromium", Cr: "chromium",
}
// Long jurisdiction name for the quick-read nature clause.
const JUR_LONG = {
  EU: "the European Union", UK: "Great Britain", CODEX: "the Codex Alimentarius (FAO/WHO)",
  CA: "Canada", CN: "China", IN: "India", BR: "Brazil", GSO: "the GCC states",
  "AU-NZ": "Australia and New Zealand", US: "the United States",
}
const INDEX = "https://heavymetalindex.com"
// Canonical analyte order for grouping the limits table (HMTc panel order).
const ANALYTE_ORDER = ["Pb", "iAs", "tAs", "Cd", "tHg", "MeHg", "Ni", "Al", "Sn", "Cr-total", "Cr-VI", "Cr"]
const aIdx = (a) => { const i = ANALYTE_ORDER.indexOf(a); return i === -1 ? 99 : i }

const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
const disp = (a) => ANALYTE_DISP[a] || a
const shortName = (a) => ANALYTE_SHORT[a] || a
const analyteHref = (a) => `/analytes/${ANALYTE_SLUG[a] || "index"}`
const indexMetalHref = (a) => `${INDEX}/metals/${ANALYTE_SLUG[a] || ""}`
// The `source` field carries the provision reference followed by a retrieval
// URL ("Table 1 (Lead), footnote c. Sources: https://…"). The Provision column
// shows the reference only; the primary-source URL already lives in the hero and
// the "The instrument" callout, so the raw link is dropped here to keep the cell
// legible.
// A short, clean citation handle for the breadcrumb leaf and the register list,
// derived from the (sometimes verbose) `reference` field: drop the consolidation
// / amendment / compilation parentheticals and trailing notes, cap the length,
// and fall back to the jurisdiction code when the reference is empty or a bare
// number (a few register rows carry only a table index).
function shortHandle(ref, jur) {
  let r = String(ref || "").split(/;|\s+\((?:consolidated|current|last amended|Edition|Metal|inorganic|version|as amended)/i)[0].trim()
  r = r.replace(/[;,]\s*$/, "").trim()
  if (r.length > 34) r = r.slice(0, 33).trim() + "…"
  if (r.length < 4 || /^[\d.]+$/.test(r)) return jur
  return r
}
function provision(s) {
  // Cut the retrieval URL / "Sources:" tail; keep the provision reference (which
  // may itself follow "Ref:"). Strip a stray leading "table." / "Ref:" artifact
  // some rows carry, so the cell reads as the table/clause reference alone.
  let t = String(s == null ? "" : s).split(/\s+(?:Sources?:|PRIMARY|https?:\/\/)/i)[0].trim()
  t = t.replace(/^table\.\s*/i, "").replace(/^Refs?:\s*/i, "").trim().replace(/[;,]\s*$/, "")
  return t || String(s == null ? "" : s).trim()
}
const yq = (s) => `"${String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"` // YAML double-quoted scalar
// Join a list into an English series ("a, b, and c").
function series(items) {
  const a = items.filter(Boolean)
  if (a.length <= 1) return a[0] || ""
  if (a.length === 2) return `${a[0]} and ${a[1]}`
  return `${a.slice(0, -1).join(", ")}, and ${a[a.length - 1]}`
}

// ── Shared inline style tokens (ported from the v3 comp) ─────────────────────
const H2 = "font-family:Lora,serif;font-weight:400;font-size:30px;line-height:1.2;color:#2b1f1f;border-bottom:1px solid #e8e1db;padding-bottom:10px;margin:0 0 20px"
const P = "font-size:16.5px;line-height:1.78;color:#3f3a3a;margin:0 0 18px;max-width:72ch"
const PSUB = "font-size:13.5px;line-height:1.7;color:#736b6b;margin:0 0 20px;max-width:84ch"
const CARD = "border:1px solid #e8e1db;background:#fffdfb"
const CALLOUT = "border-left:3px solid #9f2727;background:#fdf4f3;padding:18px 22px"
const CALLOUT_P = "font-size:15.5px;line-height:1.75;color:#5a4141;margin:0"
const MONO = "font-family:'IBM Plex Mono',monospace"
const LINK = "color:#1c43ad;text-decoration:none"
const LABEL = `${MONO};font-size:10px;font-weight:500;letter-spacing:.1em;text-transform:uppercase`

// ── "Where HMTc cites it": derive, per instrument slug, the published standards
//    it binds, from each standard's own compiled binding_jurisdiction. ─────────
function buildCitationMap(jurToSlug) {
  const map = {} // regSlug -> Map(standardSlug -> { name, href, analytes:Set })
  for (const { pages, compiled } of STD_DIRS) {
    const pagesPath = path.join(repoRoot, pages)
    const compiledDir = path.join(repoRoot, compiled)
    if (!fs.existsSync(pagesPath)) continue
    const doc = JSON.parse(fs.readFileSync(pagesPath, "utf8"))
    const list = Array.isArray(doc) ? doc : doc.pages || []
    for (const pg of list) {
      if (!pg || !pg.slug) continue
      // Only credit a standard that has a published page (mockup: rows appear
      // only once the citing standard is published).
      if (!fs.existsSync(path.join(STD_CONTENT, `${pg.slug}.md`))) continue
      const href = `/standards/${pg.slug}`
      for (const v of pg.variants || []) {
        const recSlug = typeof v.record === "string" ? v.record : v.record && v.record.slug
        if (!recSlug) continue
        const recPath = path.join(compiledDir, `${recSlug}.json`)
        if (!fs.existsSync(recPath)) continue
        const rec = JSON.parse(fs.readFileSync(recPath, "utf8"))
        const cells = (rec.variants && rec.variants[v.variant]) || {}
        for (const [analyte, cell] of Object.entries(cells)) {
          if (!cell || typeof cell !== "object") continue
          if (cell.type !== "gov" || !cell.binding_jurisdiction) continue
          const regSlug = jurToSlug[cell.binding_jurisdiction]
          if (!regSlug) continue // binding jurisdiction has no tracked instrument page
          if (!map[regSlug]) map[regSlug] = new Map()
          const byStd = map[regSlug]
          if (!byStd.has(pg.slug)) byStd.set(pg.slug, { name: pg.name || pg.slug, href, analytes: new Set() })
          byStd.get(pg.slug).analytes.add(analyte)
        }
      }
    }
  }
  return map
}

// ── The cross-instrument world: per analyte, each binding instrument's strictest
//    infant/child value, sorted strictest-first. Drives the divergence tables and
//    the positions strip; derived entirely from the register so it scales. ──────
function buildAnalyteWorld(instruments) {
  const world = {} // analyte -> [{ slug, jurisdiction, name, value, basis, scope }]
  for (const i of instruments) {
    if (!i.infant_limits.length) continue
    const best = {} // analyte -> strictest limit object for this instrument
    for (const l of i.infant_limits) {
      const a = l.analyte
      if (!best[a] || l.value_ug_kg < best[a].value_ug_kg) best[a] = l
    }
    for (const [a, l] of Object.entries(best)) {
      ;(world[a] ||= []).push({ slug: i.slug, jurisdiction: i.jurisdiction, name: i.name, value: l.value_ug_kg, basis: l.basis, scope: l.scope })
    }
  }
  for (const a of Object.keys(world)) world[a].sort((x, y) => x.value - y.value)
  return world
}

// ── The grouped-by-analyte limits table (v3 detail #reglimits) ───────────────
function limitsTable(limits) {
  const byAnalyte = new Map()
  for (const l of limits) {
    if (!byAnalyte.has(l.analyte)) byAnalyte.set(l.analyte, [])
    byAnalyte.get(l.analyte).push(l)
  }
  const groups = [...byAnalyte.keys()].sort((a, b) => aIdx(a) - aIdx(b))
  const thBase = `text-align:left;padding:11px 15px;${LABEL}`
  let bodyRows = ""
  for (const a of groups) {
    const rows = byAnalyte.get(a).sort((x, y) => (x.value_ug_kg || 0) - (y.value_ug_kg || 0))
    const n = rows.length
    bodyRows += `<tr><td colspan="4" style="padding:11px 15px;background:#faf7f4;border-top:1px solid #e8e1db;border-bottom:1px solid #f2ece7"><a href="${analyteHref(a)}" style="${MONO};font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:#9f2727;text-decoration:none">${esc(disp(a))}</a><span style="${MONO};font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:#c3b9b9;margin-left:10px">${n} limit${n === 1 ? "" : "s"}</span></td></tr>`
    for (const l of rows) {
      bodyRows += `<tr>` +
        `<td style="padding:12px 15px;border-bottom:1px solid #f2ece7;text-align:right;${MONO};font-size:14px;color:#9f2727;background:#fdf4f3;white-space:nowrap;font-variant-numeric:tabular-nums;vertical-align:top">${l.value_ug_kg}</td>` +
        `<td style="padding:12px 15px;border-bottom:1px solid #f2ece7;border-left:1px solid #f4eee9;${MONO};font-size:11px;letter-spacing:.03em;color:#736b6b;line-height:1.5;vertical-align:top">${esc(l.basis || "")}</td>` +
        `<td style="padding:12px 15px;border-bottom:1px solid #f2ece7;border-left:1px solid #f4eee9;font-size:13.5px;color:#2b1f1f;line-height:1.55;vertical-align:top">${esc(l.scope)}</td>` +
        `<td style="padding:12px 15px;border-bottom:1px solid #f2ece7;border-left:1px solid #f4eee9;font-size:12.5px;color:#736b6b;line-height:1.55;vertical-align:top">${esc(provision(l.source))}</td>` +
        `</tr>`
    }
  }
  return `<div style="overflow-x:auto"><table style="width:100%;border:1px solid #e8e1db;border-collapse:collapse;min-width:56rem"><thead><tr style="background:#9f2727;color:#fff"><th style="${thBase};text-align:right;white-space:nowrap">Limit &micro;g/kg</th><th style="${thBase};white-space:nowrap">Basis</th><th style="${thBase}">Product scope</th><th style="${thBase}">Provision</th></tr></thead><tbody>${bodyRows}</tbody></table></div>`
}

// Where this instrument sits for one analyte, in words.
function rankPhrase(myValue, world) {
  const vals = world.map((w) => w.value)
  const min = Math.min(...vals)
  const max = Math.max(...vals)
  const nAtMin = vals.filter((v) => v === min).length
  if (world.length === 1) return "the only body tracked here that sets a level for it"
  if (myValue === min) return nAtMin > 1 ? `tied for the strictest of the ${world.length}` : `the strictest of the ${world.length}`
  if (myValue === max) return `the most permissive of the ${world.length}`
  return `mid-range of the ${world.length} (${min}–${max} &micro;g/kg)`
}

// ── Positions strip: one chip per metal the instrument limits, with its strictest
//    value and where that value ranks against the world. Echoes the index's
//    "Positions across metals" summary. ─────────────────────────────────────────
function positionsStrip(inst, world) {
  const mine = {} // analyte -> my strictest value
  for (const l of inst.infant_limits) {
    if (mine[l.analyte] == null || l.value_ug_kg < mine[l.analyte]) mine[l.analyte] = l.value_ug_kg
  }
  const chips = Object.keys(mine)
    .sort((a, b) => aIdx(a) - aIdx(b))
    .map((a) => {
      const w = world[a] || []
      const rank = w.findIndex((x) => x.slug === inst.slug) + 1
      const tag = w.length > 1 ? `${rank} of ${w.length} bodies` : "only body tracked"
      return `<div style="border:1px solid #e8e1db;background:#fffdfb;padding:11px 13px;min-width:8.5rem">` +
        `<a href="${analyteHref(a)}" style="${MONO};font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:#9f2727;text-decoration:none">${esc(disp(a))}</a>` +
        `<div style="${MONO};font-size:17px;color:#2b1f1f;font-variant-numeric:tabular-nums;margin-top:6px">${mine[a]}<span style="font-size:10px;color:#a9a1a1;margin-left:4px">&micro;g/kg</span></div>` +
        `<div style="${MONO};font-size:9px;letter-spacing:.06em;text-transform:uppercase;color:#a9a1a1;margin-top:4px">${tag}</div></div>`
    })
    .join("")
  return `<div style="display:flex;flex-wrap:wrap;gap:10px;margin:0 0 22px">${chips}</div>`
}

// ── "Where it diverges": for each analyte the instrument sets, a cross-instrument
//    table of every tracked body's strictest infant/child value, this one marked.
//    Dense internal linking: each sibling → its /regulations page, each metal →
//    its /analytes page and its Heavy Metal Index /metals deep dive. ────────────
function divergenceSection(inst, world) {
  const myAnalytes = [...new Set(inst.infant_limits.map((l) => l.analyte))].sort((a, b) => aIdx(a) - aIdx(b))
  const thBase = `text-align:left;padding:10px 14px;${LABEL}`
  const blocks = myAnalytes
    .map((a) => {
      const w = world[a] || []
      const mine = w.find((x) => x.slug === inst.slug)
      const myValue = mine ? mine.value : null
      const lead =
        w.length === 1
          ? `${esc(inst.jurisdiction)} is the only body tracked here that sets an infant or child food level for ${shortName(a)}; there is nothing to diverge from.`
          : `Of the ${w.length} tracked bodies that set an infant or child food level for ${shortName(a)}, ${esc(inst.jurisdiction)}'s strictest is ${myValue} &micro;g/kg — ${rankPhrase(myValue, w)}.`
      const rows = w
        .map((x) => {
          const self = x.slug === inst.slug
          const cell = self
            ? `<span style="font-size:13.5px;color:#2b1f1f">${esc(shortHandle(x.name, x.jurisdiction))}</span><span style="${MONO};font-size:9px;letter-spacing:.08em;text-transform:uppercase;color:#9f2727;margin-left:9px">This instrument</span>`
            : `<a href="/regulations/${x.slug}" style="font-size:13.5px;${LINK}">${esc(shortHandle(x.name, x.jurisdiction))}</a>`
          const rowBg = self ? "background:#fdf4f3" : ""
          const valColor = self ? "#9f2727" : "#736b6b"
          return `<tr style="${rowBg}">` +
            `<td style="padding:10px 14px;border-bottom:1px solid #f2ece7;${self ? "border-left:2px solid #9f2727;" : ""}${MONO};font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:#9f2727;white-space:nowrap;vertical-align:top">${esc(x.jurisdiction)}</td>` +
            `<td style="padding:10px 14px;border-bottom:1px solid #f2ece7;border-left:1px solid #f4eee9;vertical-align:top">${cell}</td>` +
            `<td style="padding:10px 14px;border-bottom:1px solid #f2ece7;border-left:1px solid #f4eee9;text-align:right;${MONO};font-size:13.5px;color:${valColor};font-variant-numeric:tabular-nums;white-space:nowrap;vertical-align:top">${x.value}</td>` +
            `<td style="padding:10px 14px;border-bottom:1px solid #f2ece7;border-left:1px solid #f4eee9;${MONO};font-size:11px;color:#a9a1a1;line-height:1.5;vertical-align:top">${esc(x.basis || "")}</td>` +
            `</tr>`
        })
        .join("")
      const table =
        `<div style="overflow-x:auto"><table style="width:100%;border:1px solid #e8e1db;border-collapse:collapse;min-width:44rem"><thead><tr style="background:#9f2727;color:#fff">` +
        `<th style="${thBase};white-space:nowrap">Jur.</th><th style="${thBase}">Instrument</th><th style="${thBase};text-align:right;white-space:nowrap">Strictest &micro;g/kg</th><th style="${thBase}">Basis</th>` +
        `</tr></thead><tbody>${rows}</tbody></table></div>`
      return `<div style="margin:0 0 30px">` +
        `<div style="display:flex;align-items:baseline;gap:14px;flex-wrap:wrap;margin:0 0 9px"><a href="${analyteHref(a)}" style="font-family:Lora,serif;font-size:19px;color:#2b1f1f;text-decoration:none">${esc(disp(a))}</a>` +
        `<a href="${indexMetalHref(a)}" style="${MONO};font-size:9.5px;letter-spacing:.06em;text-transform:uppercase;color:#1c43ad;text-decoration:none" target="_blank" rel="noopener">${shortName(a)} on the Heavy Metal Index &nearr;</a></div>` +
        `<p style="font-size:14px;line-height:1.65;color:#5a4141;margin:0 0 12px;max-width:80ch">${lead}</p>${table}</div>`
    })
    .join("")
  return `<section id="divergence" style="margin-bottom:52px"><h2 style="${H2}">Where it diverges</h2>` +
    `<p style="${PSUB}">For each metal this instrument limits, the strictest infant or child food value every tracked body sets, this one marked. Bodies state values in different bases and for different product scopes, so a lower number is not always a stricter rule for the same food — read this as orientation, and follow each instrument to its page for the provision and scope. The full toxicological and regulatory record for each metal is on the Heavy Metal Index.</p>` +
    `${blocks}</section>`
}

// ── "Where HMTc cites it" section body ───────────────────────────────────────
function citedSection(inst, citeMap) {
  const byStd = citeMap[inst.slug]
  const head = `<h2 style="${H2}">Where HMTc cites it</h2>`
  if (!byStd || byStd.size === 0) {
    return `<section id="cited" style="margin-bottom:52px">${head}` +
      `<p style="${PSUB}">Cells where this instrument holds the strictest government value in force worldwide, and therefore binds a published HMTc limit.</p>` +
      `<div style="border:1px dotted #e8e1db;background:#faf7f4;padding:16px 18px">` +
      `<div style="${MONO};font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:#a9a1a1;margin-bottom:7px">No published standard is bound by this instrument yet</div>` +
      `<p style="font-size:13px;line-height:1.65;color:#a9a1a1;margin:0">A limit recorded above binds nothing today only because another government holds a stricter value for every published cell. It may still bind later, as other jurisdictions relax or as a new subcategory is published.</p>` +
      `</div></section>`
  }
  const rows = [...byStd.entries()]
    .map(([, s]) => {
      const analytes = [...s.analytes].sort((a, b) => aIdx(a) - aIdx(b)).map(disp).join(" &middot; ")
      return `<div style="display:flex;align-items:baseline;justify-content:space-between;gap:18px;flex-wrap:wrap;padding:15px 18px;border-bottom:1px solid #f2ece7">` +
        `<div style="min-width:0"><a href="${esc(s.href)}" style="font-size:15px;line-height:1.4;${LINK}">${esc(s.name)}</a>` +
        `<div style="${MONO};font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:#a9a1a1;margin-top:5px">Binds ${analytes}</div></div>` +
        `<span style="${MONO};font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#9f2727;white-space:nowrap">Strictest</span></div>`
    })
    .join("")
  const nStd = byStd.size
  return `<section id="cited" style="margin-bottom:52px">${head}` +
    `<p style="${PSUB}">Cells where this instrument holds the strictest government value in force worldwide, and therefore binds a published HMTc limit. ${nStd} published standard${nStd === 1 ? "" : "s"} cite${nStd === 1 ? "s" : ""} it.</p>` +
    `<div style="${CARD}">${rows}</div>` +
    `<p style="font-size:12.5px;line-height:1.65;color:#a9a1a1;margin:14px 0 0;max-width:84ch">Rows appear here only once the citing standard is published. A limit recorded above that binds nothing today may still bind later, as other jurisdictions relax or as a new subcategory is published.</p>` +
    `</section>`
}

// ── "Key documents & references": the primary text, the curated one-way index
//    cross-links, and a provenance note. ───────────────────────────────────────
function keyDocsSection(inst, note) {
  const docRow = (title, sub, href, external) =>
    `<div style="display:flex;align-items:center;justify-content:space-between;gap:18px;flex-wrap:wrap;padding:15px 18px;border-bottom:1px solid #f2ece7">` +
    `<div style="min-width:0"><a href="${esc(href)}" style="font-size:15px;line-height:1.4;${LINK}"${external ? ' target="_blank" rel="noopener"' : ""}>${esc(title)}${external ? " &nearr;" : ""}</a>` +
    (sub ? `<div style="font-size:12.5px;line-height:1.6;color:#a9a1a1;margin-top:4px">${esc(sub)}</div>` : "") +
    `</div></div>`
  const rows = []
  if (inst.url) {
    rows.push(
      docRow(
        `${shortHandle(inst.reference, inst.jurisdiction)} — official text`,
        `Primary source, published by ${inst.body || "the issuing authority"}${inst.retrieved ? `; retrieved ${inst.retrieved}` : ""}.`,
        inst.url,
        true,
      ),
    )
  }
  if (note && note.index_regulator && note.index_regulator.href) {
    rows.push(docRow(note.index_regulator.label || "On the Heavy Metal Index", "One-way citation — the evidence base this instrument's values are transcribed from.", note.index_regulator.href, true))
  }
  for (const d of (note && note.index_deepdives) || []) {
    if (d && d.href) rows.push(docRow(d.label || d.href, "Heavy Metal Index deep dive.", d.href, true))
  }
  return `<section id="keydocs" style="margin-bottom:52px"><h2 style="${H2}">Key documents &amp; references</h2>` +
    `<p style="${PSUB}">The primary text this page transcribes, and the Heavy Metal Index records behind it. Links to the Index are one-way citations; the certification site records what these bodies publish and never re-hosts the evidence base.</p>` +
    `<div style="${CARD}">${rows.join("")}</div>` +
    `<p style="font-size:12.5px;line-height:1.65;color:#a9a1a1;margin:14px 0 0;max-width:84ch">Values on this page are transcribed from the primary instrument via the Heavy Metal Index regulatory register and were verified against the primary text${inst.retrieved ? ` on ${esc(inst.retrieved)}` : ""}. The page reports what the body requires; it does not endorse it, and it does not set or justify any HMTc threshold.</p>` +
    `</section>`
}

// ── One instrument page ──────────────────────────────────────────────────────
function page(inst, citeMap, world, notes, generated) {
  const note = notes[inst.slug] || {}
  const nLimits = inst.infant_limits.length
  const analytes = [...new Set(inst.infant_limits.map((l) => l.analyte))].sort((a, b) => aIdx(a) - aIdx(b))
  const bases = [...new Set(inst.infant_limits.map((l) => l.basis).filter(Boolean))]
  const heroMeta = inst.verified
    ? [`PRIMARY-VERIFIED${inst.retrieved ? " · " + inst.retrieved : ""}`, `UPDATED ${generated}`]
    : ["VALUES CONFIRMED", `UPDATED ${generated}`]
  const snapRows = [
    ["Jurisdiction", inst.jurisdiction],
    ["Reference", inst.reference || inst.name],
    ["In force", String(inst.year || inst.retrieved || "—")],
    ["Metals limited", String(analytes.length)],
    ["Limits recorded", String(nLimits)],
  ]

  const connections = [
    `  - { label: "All regulation references", href: "/regulations" }`,
  ]
  if (note.index_regulator && note.index_regulator.href) {
    connections.push(`  - { label: ${yq(note.index_regulator.label || "Heavy Metal Index")}, href: ${yq(note.index_regulator.href)} }`)
  }
  connections.push(
    `  - { label: "How limits are derived", href: "/program/structure" }`,
    `  - { label: "The standards register", href: "/standards" }`,
    `  - { label: "Verify a certificate", href: "/verify" }`,
  )

  const fmLines = [
    "---",
    `title: ${yq(inst.name)}`,
    "type: regulation",
    `description: ${yq(`The infant and child food heavy-metal maximum levels set by ${inst.name} (${inst.jurisdiction}), as cited by HMTc certification standards. Records sovereign law; does not set HMTc thresholds.`)}`,
    `jurisdiction: ${inst.jurisdiction}`,
    `reference: ${yq(inst.reference || "")}`,
    inst.reference ? `breadcrumb_leaf: ${yq(shortHandle(inst.reference, inst.jurisdiction))}` : "",
    `instrument_status: ${inst.status || "in-force"}`,
    `regulation_slug: ${inst.slug}`,
    inst.url ? `source_url: ${inst.url}` : "",
    "snapshot_title: Instrument",
    "snapshot:",
    ...snapRows.map(([k, v]) => `  - { k: ${yq(k)}, v: ${yq(v)} }`),
    "hero_meta:",
    ...heroMeta.map((s) => `  - ${yq(s)}`),
    inst.url ? "hero_action:" : "",
    inst.url ? `  label: "Primary source ↗"` : "",
    inst.url ? `  href: ${inst.url}` : "",
    "connections:",
    ...connections,
    "audience: [regulator, brand-legal, retailer-compliance, certifier]",
    "---",
  ].filter(Boolean)
  const fm = fmLines.join("\n")

  // #quick — Quick read
  const natureClause = {
    guidance: `a set of ${JUR_LONG[inst.jurisdiction] || inst.jurisdiction} action levels issued as guidance rather than binding maximum levels`,
    "reference-standard": `the international reference standard adopted by ${esc(inst.body || "the issuing body")}`,
    "regional-standard": `a regional contaminants standard for ${JUR_LONG[inst.jurisdiction] || inst.jurisdiction}`,
    binding: `a binding contaminant standard in force in ${JUR_LONG[inst.jurisdiction] || inst.jurisdiction}`,
  }[note.nature || "binding"]
  // Nature-accurate noun for the "record of ___" phrasing: guidance and reference
  // standards are not "law", so the FDA and Codex pages must not call them that.
  const recordThe = { guidance: "the guidance", "reference-standard": "the reference standard", "regional-standard": "the law", binding: "the law" }[note.nature || "binding"]
  const recordA = { guidance: "guidance", "reference-standard": "a reference standard", "regional-standard": "law", binding: "law" }[note.nature || "binding"]
  const metalsProse = series(analytes.map(shortName))
  const quickSec =
    `<section id="quick" style="margin-bottom:52px"><h2 style="${H2}">Quick read</h2>` +
    `<p style="${P}">${esc(inst.name)} is ${natureClause}. It sets ${nLimits} infant and child food maximum level${nLimits === 1 ? "" : "s"} across ${analytes.length} of the eight HMTc metals — ${metalsProse} — transcribed here from ${esc(inst.reference || "the primary text")}. HMTc records it because a certification standard adopts the strictest maximum level any credible government sets worldwide, and cites this instrument wherever it holds that value. This page records ${recordThe}; it does not set or justify any HMTc threshold.</p></section>`

  // #instrument — Mandate & scope
  const issued = [esc(inst.body), inst.year].filter(Boolean).join(", ")
  const mandateSec =
    `<section id="instrument" style="margin-bottom:52px"><h2 style="${H2}">Mandate &amp; scope</h2>` +
    `<p style="${P}">This page records the infant and child food heavy-metal maximum levels set by ${esc(inst.name)}${inst.reference ? ` (${esc(inst.reference)})` : ""}${issued ? `, the instrument of ${issued}` : ""}. Every value below is transcribed from the primary text and is the value an HMTc standard cites when this jurisdiction binds a certification limit. It is a record of ${recordA}, not an HMTc threshold.</p>` +
    (note.scope_extra ? `<p style="${P}">${esc(note.scope_extra)}</p>` : "") +
    (inst.url
      ? `<div style="${CARD};padding:16px 18px;display:flex;align-items:center;justify-content:space-between;gap:18px;flex-wrap:wrap"><div style="min-width:0"><div style="font-family:Lora,serif;font-size:17px;line-height:1.35;color:#2b1f1f">${esc(shortHandle(inst.reference, inst.jurisdiction))}, official text</div><div style="font-size:12.5px;line-height:1.6;color:#a9a1a1;margin-top:3px">Published by ${esc(inst.body || "the issuing authority")}${inst.retrieved ? `; retrieved ${esc(inst.retrieved)}` : ""}.</div></div><a href="${esc(inst.url)}" style="${MONO};font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;color:#fff;background:#9f2727;border:1px solid #9f2727;border-radius:2px;padding:8px 15px;text-decoration:none;white-space:nowrap" target="_blank" rel="noopener">Primary source &nearr;</a></div>`
      : "") +
    `</section>`

  // #reglimits — the limits table, led by the per-metal positions strip
  const basisNote = bases.length > 1
    ? `<div style="display:grid;grid-template-columns:auto minmax(0,1fr);gap:10px 12px;margin-top:18px;padding-top:16px;border-top:1px solid #e8e1db"><span style="${MONO};font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:#9f2727;white-space:nowrap">Basis</span><span style="font-size:12.5px;line-height:1.6;color:#736b6b">Values appear in the basis the instrument states; no conversion is applied on this page. A standard citing a value in a different basis discloses the conversion on its own derivation table.</span></div>`
    : ""
  const limitsSec =
    `<section id="reglimits" style="margin-bottom:52px"><h2 style="${H2}">Infant &amp; child food limits</h2>` +
    `<p style="${PSUB}">Positions across the ${analytes.length} metal${analytes.length === 1 ? "" : "s"} this instrument limits — the strictest value it sets for each, and where that sits among the bodies tracked here.</p>` +
    `${positionsStrip(inst, world)}` +
    `<p style="font-size:11.5px;line-height:1.55;color:#a9a1a1;max-width:84ch;margin:0 0 14px">All values &micro;g/kg (ppb), in the basis the instrument states. ${nLimits} limit${nLimits === 1 ? "" : "s"} for infant and child food categories, grouped by analyte and ordered by limit.</p>` +
    `${limitsTable(inst.infant_limits)}${basisNote}</section>`

  const divergenceSec = divergenceSection(inst, world)
  const citedSec = citedSection(inst, citeMap)
  const keyDocsSec = keyDocsSection(inst, note)

  const interactionSec =
    `<section id="reginteraction" style="margin-bottom:20px"><h2 style="${H2}">How this interacts with HMTc</h2>` +
    `<p style="${P}">HMTc certification standards adopt the <em>strictest</em> maximum level set by any credible government worldwide. Where this instrument holds the strictest value for a (product, analyte) cell, it binds the HMTc limit and the standard cites this page. This page does not set or justify any HMTc threshold; it records the sovereign requirement the program measures against.</p>` +
    `<div style="${CALLOUT}"><p style="${CALLOUT_P}">A reference page is a record of law, not an HMTc threshold. It states what a government requires; the standard page states what the program requires, and names which instrument binds each cell.</p></div></section>`

  const body = [quickSec, mandateSec, limitsSec, divergenceSec, citedSec, keyDocsSec, interactionSec].join("\n")
  return `${fm}\n${body}\n`
}

// ── The index / register page ────────────────────────────────────────────────
function indexPage(instruments, citeMap, generated) {
  const binding = instruments.filter((i) => i.infant_limits.length)
  const totalLimits = binding.reduce((s, i) => s + i.infant_limits.length, 0)
  const nInstruments = instruments.length
  const maxCount = Math.max(...binding.map((i) => i.infant_limits.length), 1)

  const fm = [
    "---",
    `title: "Regulation references"`,
    "type: regulation-index",
    `description: ${yq("The government instruments HMTc infant and child food standards cite, each with its infant-food maximum levels transcribed from the primary text. Each records the primary-source maximum levels a standard adopts when that jurisdiction binds a limit. None of them sets an HMTc threshold.")}`,
    "snapshot:",
    `  - { k: "Instruments tracked", v: ${yq(String(nInstruments))} }`,
    `  - { k: "Binding instruments", v: ${yq(String(binding.length))} }`,
    `  - { k: "Limits recorded", v: ${yq(String(totalLimits))} }`,
    `  - { k: "Provenance", v: "Primary-verified" }`,
    "hero_meta:",
    `  - ${yq(`UPDATED ${generated}`)}`,
    `  - "ALL PRIMARY-VERIFIED"`,
    "hero_action:",
    `  label: "The standards register"`,
    `  href: "/standards"`,
    "connections:",
    `  - { label: "The standards register", href: "/standards" }`,
    `  - { label: "How limits are derived", href: "/program/structure" }`,
    `  - { label: "Program structure and gates", href: "/program/structure" }`,
    `  - { label: "Heavy Metal Index — evidence base", href: "https://heavymetalindex.com" }`,
    "audience: [regulator, brand-legal, certifier]",
    "---",
  ].join("\n")

  // #what
  const whatSec =
    `<section id="what" style="margin-bottom:52px"><h2 style="${H2}">What this collection records</h2>` +
    `<p style="${P}">An HMTc standard adopts the strictest maximum level set by any credible government worldwide. That claim is only checkable if the underlying government values are published in one place, in the basis each instrument states, with the provision that carries them. These pages are that place.</p>` +
    `<p style="${P}">${esc(String(nInstruments))} instruments are tracked. ${esc(String(binding.length))} bind at least one infant or child food limit; California Proposition 65 lists several of the eight metals as hazards but, as a right-to-know warning statute, sets no maximum level in food, and is recorded here for that gap alone.</p>` +
    `<div style="${CALLOUT}"><p style="${CALLOUT_P}">A reference page is a record of law, not an HMTc threshold. It states what a government requires; the standard page states what the program requires, and names which of these instruments binds each cell.</p></div></section>`

  // #instruments — linked list with counts
  const instRows = binding
    .map((i) => {
      const nCited = citeMap[i.slug] ? citeMap[i.slug].size : 0
      const citedTag = nCited > 0
        ? `<span style="${MONO};font-size:9.5px;letter-spacing:.06em;text-transform:uppercase;color:#2c6e49;margin-left:10px">binds ${nCited}</span>`
        : ""
      return `<div style="display:grid;grid-template-columns:5.5rem minmax(0,1fr) auto;gap:6px 18px;align-items:baseline;padding:15px 18px;border-bottom:1px solid #f2ece7">` +
        `<span style="${MONO};font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:#9f2727;border:1px solid #f2dcda;background:#fdf4f3;border-radius:2px;padding:4px 7px;justify-self:start;white-space:nowrap">${esc(i.jurisdiction)}</span>` +
        `<div style="min-width:0"><a href="/regulations/${i.slug}" style="font-size:15px;line-height:1.4;${LINK}">${esc(shortHandle(i.reference, i.jurisdiction))}</a>${citedTag}<div style="font-size:12.5px;line-height:1.6;color:#a9a1a1;margin-top:5px">${esc(i.name)}</div></div>` +
        `<div style="text-align:right;white-space:nowrap"><div style="${MONO};font-size:14px;color:#9f2727;font-variant-numeric:tabular-nums">${i.infant_limits.length}</div><div style="${MONO};font-size:9.5px;letter-spacing:.08em;text-transform:uppercase;color:#c3b9b9;margin-top:3px">limits</div></div>` +
        `</div>`
    })
    .join("")
  const instrumentsSec =
    `<section id="instruments" style="margin-bottom:52px"><h2 style="${H2}">The instruments</h2>` +
    `<p style="${PSUB}">Official titles are given in full, as cited. The count is the number of infant and child food maximum levels the instrument sets, not its total.</p>` +
    `<div style="${CARD}">${instRows}</div></section>`

  // #coverage — horizontal bars
  const bars = binding
    .slice()
    .sort((a, b) => b.infant_limits.length - a.infant_limits.length)
    .map((i) => {
      const w = Math.round((i.infant_limits.length / maxCount) * 100)
      return `<div style="display:flex;align-items:center;gap:14px;padding:9px 0;border-bottom:1px dotted #f2ece7"><span style="${MONO};font-size:10.5px;letter-spacing:.06em;text-transform:uppercase;color:#736b6b;flex:0 0 5.5rem">${esc(i.jurisdiction)}</span><div style="flex:1 1 auto;min-width:0;height:9px;background:#f4eee9"><div style="height:9px;background:#9f2727;width:${w}%"></div></div><span style="${MONO};font-size:12px;color:#9f2727;font-variant-numeric:tabular-nums;flex:0 0 2.5rem;text-align:right">${i.infant_limits.length}</span></div>`
    })
    .join("")
  const coverageSec =
    `<section id="coverage" style="margin-bottom:52px"><h2 style="${H2}">Limits recorded, by instrument</h2>` +
    `<p style="${PSUB}">${totalLimits} infant and child food maximum levels across ${binding.length} binding instruments. A high count is breadth of product categories covered, not strictness; a single value from a narrow instrument can still be the strictest in the world and bind the HMTc limit.</p>` +
    `<div style="${CARD};padding:8px 18px 14px">${bars}</div></section>`

  // #interaction
  const interactionSec =
    `<section id="interaction" style="margin-bottom:20px"><h2 style="${H2}">How these interact with HMTc</h2>` +
    `<p style="${P}">HMTc certification standards adopt the <em>strictest</em> maximum level set by any credible government worldwide. Where an instrument holds the strictest value for a (product, analyte) cell, it binds the HMTc limit and the standard cites its page. These pages do not set or justify any HMTc threshold; they record the sovereign requirement the program measures against.</p>` +
    `<div style="${CARD};padding:16px 18px;display:flex;align-items:center;justify-content:space-between;gap:18px;flex-wrap:wrap"><div style="min-width:0"><div style="font-family:Lora,serif;font-size:17px;line-height:1.35;color:#2b1f1f">See a derivation that uses them</div><div style="font-size:12.5px;line-height:1.6;color:#a9a1a1;margin-top:3px">Each standard lists every government value side by side and names which one binds.</div></div><a href="/standards" style="${MONO};font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;color:#fff;background:#9f2727;border:1px solid #9f2727;border-radius:2px;padding:8px 15px;text-decoration:none;white-space:nowrap">Open the register</a></div></section>`

  const body = [whatSec, instrumentsSec, coverageSec, interactionSec].join("\n")
  return `${fm}\n${body}\n`
}

function main() {
  const data = JSON.parse(fs.readFileSync(DATA, "utf8"))
  const instruments = data.instruments
  const generated = data.generated || "—"
  const notes = fs.existsSync(NOTES) ? JSON.parse(fs.readFileSync(NOTES, "utf8")).instruments || {} : {}
  fs.mkdirSync(OUT, { recursive: true })

  // jurisdiction code -> regulation slug, from the tracked instruments only.
  const jurToSlug = {}
  for (const i of instruments) if (i.jurisdiction && i.slug) jurToSlug[i.jurisdiction] = i.slug
  const citeMap = buildCitationMap(jurToSlug)
  const world = buildAnalyteWorld(instruments)

  let n = 0
  for (const inst of instruments) {
    if (!inst.infant_limits.length) continue
    fs.writeFileSync(path.join(OUT, `${inst.slug}.md`), page(inst, citeMap, world, notes, generated))
    n++
  }
  fs.writeFileSync(path.join(OUT, "index.md"), indexPage(instruments, citeMap, generated))

  const cited = Object.fromEntries(Object.entries(citeMap).map(([k, v]) => [k, v.size]))
  console.log(`built ${n} regulation pages + index in content/regulations/ (v3, 7-rail depth)`)
  console.log(`  cited-by counts:`, JSON.stringify(cited))
}

main()
