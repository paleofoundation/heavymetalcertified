#!/usr/bin/env node
// build-why-limited-pages.mjs — the per-metal "why we limit this metal" synthesis
// pages: the connective narrative tissue of the certification site.
//
// WHAT THESE ARE (and are NOT). The site already carries, per metal:
//   · /analytes/<metal>   — the neutral REFERENCE: the agency-by-agency assessment
//                            table, the toxicological basis, the occurrence tables.
//   · /standards/<cat>    — the numeric LIMITS + the Occurrence & Derivation section.
//   · /articles/<finding> — one-way coverage of individual Heavy Metal Index findings.
// None of those answer, in one readable authored page, the question a parent, a
// buyer, or an answer engine actually asks: "why does HMTc limit this metal in
// food at all?" These pages are that answer — a synthesis that pulls the
// toxicological endpoint, the exposure reality, the vulnerable populations, and
// the case for a certification ceiling into one argument, and LINKS to the
// reference surfaces above rather than reproducing them. Distinct document class,
// distinct SEO/LLMO intent (question + FAQ rich result), distinct register
// (authored, program-voice) from the neutral analyte reference.
//
// FIREWALL (CLAUDE.md Part 2): cert content cites the Heavy Metal Index ONE WAY
// (heavymetalcertified.com -> heavymetalindex.com, never the reverse). The
// occurrence corpus and per-source records live on the Index; these pages point to
// them. No `type: source`, no re-hosted corpus tables.
//
// DESIGN CANON (docs/design-canon/, AGENTS.md §3): NO BOLD on the reading surface —
// this file emits font-weight 400 only (500 for a mono label). Accent #9f2727,
// link #1c43ad, Lora headings, IBM Plex Mono labels/measured values. If you add
// markup here, keep it bold-free or design-lint (--all) flags it.
//
// SOURCE OF TRUTH is the per-metal spec at data/why-limited/<slug>.json (authored
// and grounded against analyte-tox-anchors.json, the /analytes pages, and
// data/method/method-v2.json). This generator only stamps the fixed apparatus so
// the design never drifts page to page. The FAQ here also drives the FAQPage
// JSON-LD in tools/postbuild-why-limited-jsonld.mjs (same spec file — the visible
// page and the structured data never diverge).

import fs from "node:fs"
import path from "node:path"

const repoRoot = process.cwd()
const SPEC_DIR = path.join(repoRoot, "data/why-limited")
const OUT = path.join(repoRoot, "content/why-we-limit")
const BASE = "https://heavymetalcertified.com"
const LINK = "#1c43ad"
const ACCENT = "#9f2727"

if (!fs.existsSync(SPEC_DIR)) {
  console.log("build-why-limited-pages: no data/why-limited dir; nothing to build.")
  process.exit(0)
}
fs.mkdirSync(OUT, { recursive: true })

// Markdown emphasis (_x_ / *x*) -> <em> for the dek; plain() strips it for meta.
function emph(s) {
  return String(s || "").replace(/\s+/g, " ").replace(/[_*]([^_*\n]+)[_*]/g, "<em>$1</em>").trim()
}
function plain(s) {
  return String(s || "").replace(/\s+/g, " ").replace(/[_*]([^_*\n]+)[_*]/g, "$1").trim()
}
const q = (s) => String(s || "").replace(/"/g, '\\"')

// THE RATIONALE lead callout — the burgundy pill + kicker + the one-sentence
// answer in Lora. Ports the article/briefing "THE CLAIM" language exactly (one
// design vocabulary across the authored document classes), relabelled because
// this page states a rationale, not a research claim.
function renderRationale(text, date) {
  const kicker = `Certification rationale &middot; Heavy Metal Certified${date ? " &middot; " + date : ""}`
  return `<div style="border:1px solid #f2dcda;background:#fdf4f3;padding:24px 26px;margin-bottom:52px">
  <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center;margin-bottom:14px"><span style="font-family:'IBM Plex Mono',monospace;font-size:15px;color:#fff;background:${ACCENT};border-radius:3px;padding:7px 13px">THE RATIONALE</span><span style="font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:${ACCENT}">${kicker}</span></div>
  <p style="font-family:Lora,serif;font-size:24px;line-height:1.45;color:#2b1f1f;margin:0">${text}</p>
</div>`
}

function renderFaq(faq) {
  if (!faq || !faq.length) return ""
  const blocks = faq.map((f) => `### ${f.q}\n\n${f.a.trim()}`).join("\n\n")
  return `## Frequently asked questions\n\n${blocks}\n\n`
}

// A compact list of the Index findings (rendered as /articles pages) that bear on
// this metal — the connective tissue between the standards derivation and the
// briefings/articles. Real body <a> per row, feeding the internal link graph.
function renderFindings(findings, name) {
  if (!findings || !findings.length) return ""
  const rows = findings
    .map(
      (f) =>
        `    <a href="${f.href}" style="display:block;padding:13px 0;border-bottom:1px dotted #f2ece7;text-decoration:none"><span style="font-family:Lora,serif;font-size:16.5px;line-height:1.4;color:${ACCENT}">${f.label}</span>${f.note ? `<span style="display:block;font-size:13px;line-height:1.6;color:#736b6b;margin-top:4px;max-width:80ch">${f.note}</span>` : ""}</a>`,
    )
    .join("\n")
  return `## Findings that bear on ${name}

  <p style="font-size:13.5px;line-height:1.7;color:#736b6b;margin:0 0 16px;max-width:84ch">Program analyses that trace how ${name.toLowerCase()} enters specific foods. Each covers a finding from the independent Heavy Metal Index and applies it to the certification question; the underlying occurrence record is on the Index.</p>
  <div style="border-top:1px solid #e8e1db">
${rows}
  </div>

`
}

// Oxford-style join for a short list of rendered link fragments.
function joinLinks(parts) {
  if (parts.length <= 1) return parts.join("")
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`
  return `${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}`
}

// The per-metal governing regulation(s): the sovereign maximum level(s) the
// certification floor is measured against, linked to the on-site /regulations/ page.
// Source is the metal's own rationale prose where it names an instrument (lead, arsenic,
// cadmium, mercury, nickel, tin), or the standards claim-surface
// (data/standards/*-compiled) for a metal whose prose names only intake bodies
// (aluminium -> AU-NZ + China; chromium -> China + Hong Kong). It links EXISTING
// /regulations/ pages only and invents no reference and no µg/kg value. Rendered as one
// row of the "Evidence and sources" table, it is also the citation-coverage gate's
// accepted no-invent claim-surface cite for these pages (HMTC-BIG8-DRAIN-27).
function renderRegRow(spec) {
  const regs = Array.isArray(spec.governing_regulations) ? spec.governing_regulations : []
  if (!regs.length) return ""
  const links = joinLinks(regs.map((r) => `<a href="${r.href}" style="color:${LINK}">${r.label}</a>`))
  return `    <div style="display:grid;grid-template-columns:minmax(0,1fr) 150px;gap:16px;align-items:baseline;padding:13px 16px;border-bottom:1px dotted #f2ece7"><span style="font-size:14px;line-height:1.55;color:#3f3a3a">The sovereign maximum levels the certification floor is measured against — ${links}</span><span style="font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.08em;text-transform:uppercase;color:#a9a1a1;text-align:right">Regulation</span></div>
`
}

// The light provenance note — no numbered references grid (that is the /articles
// apparatus; these pages carry no fabricated DOIs). Instead: where the evidence
// lives and the one-way firewall stated plainly.
function renderSources(spec) {
  const idx = `https://heavymetalindex.com/metals/${spec.index_slug}`
  const analyte = `/analytes/${spec.analyte_slug}`
  return `## Evidence and sources

  <p style="font-size:13.5px;line-height:1.7;color:#736b6b;margin:0 0 12px;max-width:84ch">This page synthesises three surfaces that carry the underlying evidence, and links to them rather than re-hosting them:</p>
  <div style="border:1px solid #e8e1db;background:#fffdfb">
    <div style="display:grid;grid-template-columns:minmax(0,1fr) 150px;gap:16px;align-items:baseline;padding:13px 16px;border-bottom:1px dotted #f2ece7"><span style="font-size:14px;line-height:1.55;color:#3f3a3a">The government and expert-body assessments, agency by agency, with the toxicological reference points — <a href="${analyte}" style="color:${LINK}">the ${spec.name} analyte reference</a></span><span style="font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.08em;text-transform:uppercase;color:#a9a1a1;text-align:right">Reference</span></div>
    <div style="display:grid;grid-template-columns:minmax(0,1fr) 150px;gap:16px;align-items:baseline;padding:13px 16px;border-bottom:1px dotted #f2ece7"><span style="font-size:14px;line-height:1.55;color:#3f3a3a">The certification limits in force, and the Method v2.0 derivation behind each — <a href="/standards" style="color:${LINK}">the HMTc standards register</a></span><span style="font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.08em;text-transform:uppercase;color:#a9a1a1;text-align:right">Standard</span></div>
${renderRegRow(spec)}    <div style="display:grid;grid-template-columns:minmax(0,1fr) 150px;gap:16px;align-items:baseline;padding:13px 16px"><span style="font-size:14px;line-height:1.55;color:#3f3a3a">The complete peer-reviewed and regulatory literature and the occurrence corpus — <a href="${idx}" style="color:${LINK}">${spec.name} on the Heavy Metal Index<span style="font-family:'IBM Plex Mono',monospace;font-size:10px;vertical-align:super">&#8599;</span></a></span><span style="font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.08em;text-transform:uppercase;color:#a9a1a1;text-align:right">Index &middot; one-way</span></div>
  </div>
  <p style="font-size:11.5px;line-height:1.55;color:#a9a1a2;max-width:84ch;margin:12px 0 0">The Heavy Metal Index is an independent literature reference; this certification site cites it one way and applies its evidence to the certification question. The Index never cites back — that is what keeps it a disinterested source.</p>

`
}

// Rights line for the cite box. A spec with `rights: "all-rights-reserved"`
// prints the house All-rights-reserved notice instead of the CC BY prose line.
const ARR_NOTICE = "© 2026 Institute of Contaminant Standards / Heavy Metal Certified. All rights reserved."
function rightsLine(spec) {
  return spec.rights === "all-rights-reserved"
    ? `${ARR_NOTICE} The underlying evidence base is the independent Heavy Metal Index, cited one way; this page applies that evidence to the certification question.`
    : "Prose under CC BY 4.0. The underlying evidence base is the independent Heavy Metal Index, cited one way; this page applies that evidence to the certification question."
}

function renderCite(title, year, url, spec) {
  return `## Cite this page

  <div style="border:1px solid #e8e1db;background:#fffdfb">
    <div style="padding:11px 15px;border-bottom:1px solid #e8e1db;background:#fdf4f3;font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;color:${ACCENT}">Reuse this analysis</div>
    <div style="padding:14px 15px">
      <p style="font-family:'IBM Plex Mono',monospace;font-size:11px;line-height:1.75;color:#5a4141;margin:0 0 14px">Pendergrass, K. (${year}). <em style="font-style:normal">${title}</em>. Heavy Metal Certified, Institute of Contaminant Standards (ICS). ${url}</p>
      <p style="font-size:11.5px;line-height:1.55;color:#a9a1a1;max-width:84ch;margin:0">${rightsLine(spec)}</p>
    </div>
  </div>
`
}

function build(spec) {
  const slug = spec.slug
  const title = spec.title
  const date = spec.date || "August 2026"
  const year = (String(date).match(/\d{4}/) || ["2026"])[0]
  const url = `${BASE}/why-we-limit/${slug}`
  const metals = Array.isArray(spec.metals) ? spec.metals.join(", ") : String(spec.metals || "")

  const front = [
    "---",
    `title: "${q(title)}"`,
    spec.description ? `description: "${q(plain(spec.description)).slice(0, 200)}"` : null,
    spec.dek ? `dek_html: "${q(emph(spec.dek))}"` : null,
    "type: rationale",
    "custom_page: true",
    `section: "Why we limit"`,
    `author: "Karen Pendergrass"`,
    "orcid: 0000-0002-2348-7259",
    `date: "${date}"`,
    `updated: "${date}"`,
    "audience: [consumer, regulator, brand-legal, retailer-compliance, educator]",
    "snapshot:",
    ...(spec.snapshot || []).map((r) => `  - { k: "${q(r.k)}", v: "${q(r.v)}" }`),
    "connections:",
    ...(spec.connections || []).map((c) => `  - { label: "${q(c.label)}", href: "${q(c.href)}" }`),
    "rail_box:",
    `  title: "Why we limit each metal"`,
    // `rail_body` lets a metal limited outside food (antimony: baby wipes) state
    // its own scope instead of the food framing.
    `  body: "${q(spec.rail_body || "One page per metal on the panel, each answering why HMTc limits it in food — the toxicological basis, the exposure reality, and the case for a certification ceiling. The numeric limits live on the standards; the full literature on the Heavy Metal Index.")}"`,
    "---",
    "",
  ].filter((l) => l !== null)

  const sections = (spec.sections || [])
    .map((s) => `## ${s.h2}\n\n${String(s.body).trim()}`)
    .join("\n\n")

  const body = [
    renderRationale(spec.lead_answer, date),
    "",
    "## In brief",
    "",
    String(spec.brief).trim(),
    "",
    sections,
    "",
    renderFindings(spec.related_findings, spec.name),
    renderFaq(spec.faq),
    renderSources(spec),
    renderCite(title, year, url, spec),
  ].join("\n")

  fs.writeFileSync(path.join(OUT, `${slug}.md`), front.join("\n") + "\n" + body, "utf8")
  return {
    slug,
    name: spec.name,
    sym: spec.sym,
    species: spec.species,
    title,
    dek: plain(spec.dek || spec.description || ""),
    metals: Array.isArray(spec.metals) ? spec.metals : [],
    order: spec.order ?? 99,
    productSpecific: spec.product_specific || null,
  }
}

// content/why-we-limit/index.md — GENERATED here so every per-metal page is linked
// (the section can never orphan its own pages) and the directory never goes stale.
// Ordered by the panel's own order (priority toxics first), bold-free, a real body
// <a> per row for the internal link graph.
function card(a) {
  return `    <a href="/why-we-limit/${a.slug}" style="display:grid;grid-template-columns:64px minmax(0,1fr) 150px;gap:20px;align-items:start;padding:22px 0;border-bottom:1px solid #f2ece7;text-decoration:none">
      <span style="font-family:'IBM Plex Mono',monospace;font-size:13px;color:${ACCENT};border:1px solid #f2dcda;background:#fdf4f3;border-radius:2px;padding:8px 0;text-align:center">${a.sym}</span>
      <span style="min-width:0">
        <span style="display:block;font-family:Lora,serif;font-size:20px;line-height:1.3;color:${ACCENT}">Why we limit ${a.name.toLowerCase()}</span>
        <span style="display:block;font-size:14px;line-height:1.6;color:#3f3a3a;max-width:66ch;margin-top:7px">${a.dek}</span>
      </span>
      <span style="font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.06em;text-transform:uppercase;color:#9f2727;text-align:right">${a.species}</span>
    </a>`
}

function writeIndex(built) {
  const rows = [...built].sort((a, b) => a.order - b.order).map(card).join("\n")
  // Metals limited only in a named non-food standard (antimony: baby wipes) are
  // listed after the claim analytes, with their scope stated.
  const specific = built.filter((a) => a.productSpecific)
  const specificNote = specific.length
    ? `, then ${specific.map((a) => `${a.name.toLowerCase()}, limited only in the ${a.productSpecific}`).join(" and ")}`
    : ""
  const front = [
    "---",
    'title: "Why we limit each metal"',
    "type: rationale-index",
    "custom_page: true",
    'description: "Why the Heavy Metal Tested & Certified program limits each metal on its panel, in food and, for antimony, in baby wipes: one synthesis page per metal, tying the toxicological basis, the exposure reality, and the vulnerable populations to the case for a certification limit."',
    "audience: [consumer, regulator, brand-legal, retailer-compliance, educator]",
    "connections:",
    '  - { label: "The analyte panel (agency reference)", href: "/analytes" }',
    '  - { label: "The standards register (the limits)", href: "/standards" }',
    '  - { label: "How limits are derived", href: "/program/structure" }',
    '  - { label: "Heavy Metal Index — the evidence base", href: "https://heavymetalindex.com" }',
    "---",
    "",
  ].join("\n")
  const body = `<section style="margin-bottom:8px"><p style="font-size:16px;line-height:1.7;color:#3f3a3a;max-width:80ch;margin:0 0 8px">Every metal on the HMTc panel is limited for a reason that can be stated from the government and expert-body record. These pages give that reason, one metal at a time: the toxicological endpoint and the authoritative basis, which foods, and one non-food product (baby wipes), carry the metal and roughly how much, the people the exposure reaches, and why a certification limit is warranted where a label claim is not. The agency-by-agency assessments are on the <a href="/analytes" style="color:${LINK}">analyte panel</a>; the numeric limits are on the <a href="/standards" style="color:${LINK}">standards register</a>; the complete literature is on the <a href="https://heavymetalindex.com" style="color:${LINK}">Heavy Metal Index</a>.</p></section>

<section style="margin:36px 0 8px">
  <h2 style="font-family:Lora,serif;font-weight:400;font-size:30px;line-height:1.2;color:#2b1f1f;border-bottom:1px solid #e8e1db;padding-bottom:10px;margin:0 0 8px">The panel, metal by metal</h2>
  <p style="font-size:13.5px;line-height:1.7;color:#736b6b;margin:0 0 14px;max-width:84ch">${built.length} metals, ordered as the panel is listed: the four priority toxics first, then the four additional claim analytes${specificNote}. Every claim analyte is equal at the gate.</p>
  <div style="display:flex;flex-direction:column">
${rows}
  </div>
</section>
`
  fs.writeFileSync(path.join(OUT, "index.md"), front + body, "utf8")
}

const specs = fs.readdirSync(SPEC_DIR).filter((f) => f.endsWith(".json"))
const built = []
for (const f of specs) {
  let spec
  try {
    spec = JSON.parse(fs.readFileSync(path.join(SPEC_DIR, f), "utf8"))
  } catch (e) {
    console.error(`build-why-limited-pages: bad JSON in ${f}: ${e.message}`)
    process.exit(1)
  }
  if (!spec.slug || !spec.title || !spec.name) {
    console.error(`build-why-limited-pages: ${f} missing slug/title/name`)
    process.exit(1)
  }
  built.push(build(spec))
}
writeIndex(built)
console.log(
  `build-why-limited-pages: stamped ${built.length} per-metal rationale page(s) + generated index.md (priority toxics first; the section cannot orphan its own pages).`,
)
