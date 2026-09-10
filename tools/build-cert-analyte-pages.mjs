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
      return `<tr style="border-bottom:1px solid #f2ece7${zebra}"><td style="padding:10px 12px;font-family:'IBM Plex Mono',monospace;font-size:12px;color:#2b1f1f">${esc(r.agency)}</td><td style="padding:10px 12px;color:#736b6b;font-size:12.5px">${esc(r.year || "—")}</td><td style="padding:10px 12px;color:#5a4141;font-size:13px">${esc(r.document || "—")}</td><td style="padding:10px 12px;color:#3f3a3a;font-size:13px;line-height:1.6">${linkify(r.finding)}</td></tr>`
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

function pageBody(a) {
  const idxUrl = `https://heavymetalindex.com/metals/${a.index_link_slug}`
  // The reference-page lead: a briefings-style badge row (matching the "THE CLAIM"
  // treatment on Standards Briefings) rather than a second <h1>. The page's real
  // <h1> is the hero band title (HeroBand.tsx `.hmtc-hb-title`); repeating the
  // element name here as an <h1> was a duplicate heading and, having no underline,
  // gave the center column no top line to align with the left/right rail dividers.
  // The badge is a bordered block at the top of the column, so it lands on the
  // shared three-column line the way a section heading does on standards pages.
  const header = `<section style="margin-bottom:40px"><div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center;margin-bottom:16px"><span style="font-family:'IBM Plex Mono',monospace;font-size:15px;color:#fff;background:#9f2727;border-radius:3px;padding:7px 13px">THE ANALYTE</span><span style="font-family:'IBM Plex Mono',monospace;font-size:12px;letter-spacing:.04em;color:#b7aeae">${a.z} &middot; ${esc(a.sym)} &middot; ${esc(a.species)}</span></div><p style="font-size:17px;line-height:1.7;color:#3f3a3a;margin:0;max-width:80ch">${linkify(a.thesis)}</p></section>`

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
  return [header, why, tox, occ, reg, hmtc, baseline].filter(Boolean).join("\n")
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
