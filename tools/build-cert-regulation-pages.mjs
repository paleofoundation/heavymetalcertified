#!/usr/bin/env node
// Build per-instrument regulation reference pages for heavymetalcertified.com,
// in the v3 design canon (Heavy Metal Certified v3.dc.html — the "Regulation
// references" and "Regulation reference — GB 2762" screens).
//
// INPUT  : data/regulations/infant-instruments.json  (the verified infant-food
//          limits each cited government instrument sets, exported from the Heavy
//          Metal Index regulatory register)
//        + data/standards/{cat1,seafood}-pages.json  (the published standards)
//          and data/standards/{cat1,seafood}-compiled/<record>.json  (their
//          per-analyte binding jurisdiction) — used ONLY to derive, per
//          instrument, which published standards it binds ("Where HMTc cites it").
// OUTPUT : content/regulations/<slug>.md  — one page per instrument + index.md.
//          The v3 chrome (red hero band, "On this page" rail, Connections rail)
//          is emitted by the HeroBand / Snav / Rail components from the
//          frontmatter this file writes; the body is the centre-column sections.
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
// Canonical analyte order for grouping the limits table (HMTc panel order).
const ANALYTE_ORDER = ["Pb", "iAs", "tAs", "Cd", "tHg", "MeHg", "Ni", "Al", "Sn", "Cr-total", "Cr-VI", "Cr"]
const aIdx = (a) => { const i = ANALYTE_ORDER.indexOf(a); return i === -1 ? 99 : i }

const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
const disp = (a) => ANALYTE_DISP[a] || a
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

// ── Shared inline style tokens (ported from the v3 comp) ─────────────────────
const H2 = "font-family:Lora,serif;font-weight:400;font-size:30px;line-height:1.2;color:#2b1f1f;border-bottom:1px solid #e8e1db;padding-bottom:10px;margin:0 0 20px"
const P = "font-size:16.5px;line-height:1.78;color:#3f3a3a;margin:0 0 18px;max-width:72ch"
const PSUB = "font-size:13.5px;line-height:1.7;color:#736b6b;margin:0 0 20px;max-width:84ch"
const CARD = "border:1px solid #e8e1db;background:#fffdfb"
const CALLOUT = "border-left:3px solid #9f2727;background:#fdf4f3;padding:18px 22px"
const CALLOUT_P = "font-size:15.5px;line-height:1.75;color:#5a4141;margin:0"
const MONO = "font-family:'IBM Plex Mono',monospace"

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

// ── The grouped-by-analyte limits table (v3 detail #reglimits) ───────────────
function limitsTable(limits) {
  const byAnalyte = new Map()
  for (const l of limits) {
    if (!byAnalyte.has(l.analyte)) byAnalyte.set(l.analyte, [])
    byAnalyte.get(l.analyte).push(l)
  }
  const groups = [...byAnalyte.keys()].sort((a, b) => aIdx(a) - aIdx(b))
  const thBase = `text-align:left;padding:11px 15px;${MONO};font-size:10px;font-weight:500;letter-spacing:.1em;text-transform:uppercase`
  let bodyRows = ""
  for (const a of groups) {
    const rows = byAnalyte.get(a).sort((x, y) => (x.value_ug_kg || 0) - (y.value_ug_kg || 0))
    const n = rows.length
    bodyRows += `<tr><td colspan="4" style="padding:11px 15px;background:#faf7f4;border-top:1px solid #e8e1db;border-bottom:1px solid #f2ece7"><span style="${MONO};font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:#9f2727">${esc(disp(a))}</span><span style="${MONO};font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:#c3b9b9;margin-left:10px">${n} limit${n === 1 ? "" : "s"}</span></td></tr>`
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
        `<div style="min-width:0"><a href="${esc(s.href)}" style="font-size:15px;line-height:1.4;color:#1c43ad;text-decoration:none">${esc(s.name)}</a>` +
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

// ── One instrument page ──────────────────────────────────────────────────────
function page(inst, citeMap, generated) {
  const nLimits = inst.infant_limits.length
  const bases = [...new Set(inst.infant_limits.map((l) => l.basis).filter(Boolean))]
  const heroMeta = inst.verified
    ? [`PRIMARY-VERIFIED${inst.retrieved ? " · " + inst.retrieved : ""}`, `UPDATED ${generated}`]
    : ["VALUES CONFIRMED", `UPDATED ${generated}`]
  const snapRows = [
    ["Jurisdiction", inst.jurisdiction],
    ["Reference", inst.reference || inst.name],
    ["In force", String(inst.year || inst.retrieved || "—")],
    ["Limits recorded", String(nLimits)],
  ]

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
    `  - { label: "All regulation references", href: "/regulations" }`,
    `  - { label: "How limits are derived", href: "/program/structure" }`,
    `  - { label: "The standards register", href: "/standards" }`,
    `  - { label: "Verify a certificate", href: "/verify" }`,
    "audience: [regulator, brand-legal, retailer-compliance, certifier]",
    "---",
  ].filter(Boolean)
  const fm = fmLines.join("\n")

  const issued = [esc(inst.body), inst.year].filter(Boolean).join(", ")
  const instrumentSec =
    `<section id="instrument" style="margin-bottom:52px"><h2 style="${H2}">The instrument</h2>` +
    `<p style="${P}">This page records the infant and child food heavy-metal maximum levels set by ${esc(inst.name)}${inst.reference ? ` (${esc(inst.reference)})` : ""}${issued ? `, the instrument of ${issued}` : ""}. Every value below is transcribed from the primary text and is the value an HMTc standard cites when this jurisdiction binds a certification limit. It is a record of law, not an HMTc threshold.</p>` +
    (inst.url
      ? `<div style="${CARD};padding:16px 18px;display:flex;align-items:center;justify-content:space-between;gap:18px;flex-wrap:wrap"><div style="min-width:0"><div style="font-family:Lora,serif;font-size:17px;line-height:1.35;color:#2b1f1f">${esc(shortHandle(inst.reference, inst.jurisdiction))}, official text</div><div style="font-size:12.5px;line-height:1.6;color:#a9a1a1;margin-top:3px">Published by ${esc(inst.body || "the issuing authority")}${inst.retrieved ? `; retrieved ${esc(inst.retrieved)}` : ""}.</div></div><a href="${esc(inst.url)}" style="${MONO};font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;color:#fff;background:#9f2727;border:1px solid #9f2727;border-radius:2px;padding:8px 15px;text-decoration:none;white-space:nowrap" target="_blank" rel="noopener">Primary source &nearr;</a></div>`
      : "") +
    `</section>`

  const basisNote = bases.length > 1
    ? `<div style="display:grid;grid-template-columns:auto minmax(0,1fr);gap:10px 12px;margin-top:18px;padding-top:16px;border-top:1px solid #e8e1db"><span style="${MONO};font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:#9f2727;white-space:nowrap">Basis</span><span style="font-size:12.5px;line-height:1.6;color:#736b6b">Values appear in the basis the instrument states; no conversion is applied on this page. A standard citing a value in a different basis discloses the conversion on its own derivation table.</span></div>`
    : ""
  const limitsSec =
    `<section id="reglimits" style="margin-bottom:52px"><h2 style="${H2}">Infant &amp; child food limits</h2>` +
    `<p style="font-size:11.5px;line-height:1.55;color:#a9a1a1;max-width:84ch;margin:0 0 14px">All values &micro;g/kg (ppb), in the basis the instrument states. ${nLimits} limit${nLimits === 1 ? "" : "s"} for infant and child food categories, grouped by analyte and ordered by limit.</p>` +
    `${limitsTable(inst.infant_limits)}${basisNote}</section>`

  const citedSec = citedSection(inst, citeMap)

  const interactionSec =
    `<section id="reginteraction" style="margin-bottom:20px"><h2 style="${H2}">How this interacts with HMTc</h2>` +
    `<p style="${P}">HMTc certification standards adopt the <em>strictest</em> maximum level set by any credible government worldwide. Where this instrument holds the strictest value for a (product, analyte) cell, it binds the HMTc limit and the standard cites this page. This page does not set or justify any HMTc threshold; it records the sovereign requirement the program measures against.</p>` +
    `<div style="${CALLOUT}"><p style="${CALLOUT_P}">A reference page is a record of law, not an HMTc threshold. It states what a government requires; the standard page states what the program requires, and names which instrument binds each cell.</p></div></section>`

  const body = [instrumentSec, limitsSec, citedSec, interactionSec].join("\n")
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
        `<div style="min-width:0"><a href="/regulations/${i.slug}" style="font-size:15px;line-height:1.4;color:#1c43ad;text-decoration:none">${esc(shortHandle(i.reference, i.jurisdiction))}</a>${citedTag}<div style="font-size:12.5px;line-height:1.6;color:#a9a1a1;margin-top:5px">${esc(i.name)}</div></div>` +
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
  fs.mkdirSync(OUT, { recursive: true })

  // jurisdiction code -> regulation slug, from the tracked instruments only.
  const jurToSlug = {}
  for (const i of instruments) if (i.jurisdiction && i.slug) jurToSlug[i.jurisdiction] = i.slug
  const citeMap = buildCitationMap(jurToSlug)

  let n = 0
  for (const inst of instruments) {
    if (!inst.infant_limits.length) continue
    fs.writeFileSync(path.join(OUT, `${inst.slug}.md`), page(inst, citeMap, generated))
    n++
  }
  fs.writeFileSync(path.join(OUT, "index.md"), indexPage(instruments, citeMap, generated))

  const cited = Object.fromEntries(Object.entries(citeMap).map(([k, v]) => [k, v.size]))
  console.log(`built ${n} regulation pages + index in content/regulations/ (v3)`)
  console.log(`  cited-by counts:`, JSON.stringify(cited))
}

main()
