#!/usr/bin/env node
// import-briefings.mjs — import the 10 Standards Briefings from the workbench
// snapshot (data/briefings/*.md) into the cert site (content/briefings/) in the
// CANONICAL briefing design.
//
// Every briefing renders the same v3 design (Karen: "the data may change, but
// the design should not"): a hero Page snapshot, an Abstract, the argument
// prose, a structured References list, a Bibliographic record, and a Cite box.
// The per-briefing data — abstract, the parsed reference rows, the series label
// — lives in data/briefings/briefing-meta.json (produced from each briefing's
// own text). The argument prose is passed through from the source unchanged.
//
// content/briefings/index.md is hand-authored (the ported design directory) and
// is NOT emitted here.

import fs from "node:fs"
import path from "node:path"

const repoRoot = process.cwd()
const SRC = path.join(repoRoot, "data/briefings")
const OUT = path.join(repoRoot, "content/briefings")
const META_FILE = path.join(repoRoot, "data/briefings/briefing-meta.json")
const PDF_DIR = path.join(repoRoot, "content/static/briefings")
fs.mkdirSync(OUT, { recursive: true })

// 6.F mapping: file slug → { page title override, section }
const MAP = {
  "brief-4-cost-of-being-uncertified": { title: "The Cost of Being Uncertified", section: "Business case" },
  "hmtc-primer": { title: "What HMTc Is", section: "Program" },
  "defense-counsel-briefing": { title: "The Evidence a Jury Will See", section: "Litigation" },
  "after-palmquist": { title: "After Palmquist", section: "Litigation" },
  "brief-7-four-vs-eight": { title: "Four Metals Is No Longer Enough", section: "Scope & standards" },
  "brief-8-surveillance-protocol": { title: "The Surveillance Protocol", section: "Program" },
  "brief-2-open-category": { title: "The Open Category", section: "Positioning" },
  "brief-3-what-organic-doesnt-say": { title: "What Organic Doesn't Say", section: "Positioning" },
  "brief-5-retailer-as-anchor": { title: "The Retailer as Anchor", section: "Retailer" },
  "brief-6-premium-promise": { title: "The Premium Promise", section: "Positioning" },
  "the-prop-65-gap": { title: "Named as a Hazard, Left Unlimited", section: "Scope & standards" },
}

// Parsed per-briefing metadata (abstract, references, series). Keyed by slug.
let META = {}
if (fs.existsSync(META_FILE)) {
  try {
    const arr = JSON.parse(fs.readFileSync(META_FILE, "utf8"))
    for (const m of Array.isArray(arr) ? arr : arr.briefings || []) META[m.slug] = m
  } catch (e) {
    console.warn(`  WARNING: could not read ${META_FILE}: ${e.message}`)
  }
}

// Hand-authored featured layer, kept separate from the auto-parsed META so a
// re-parse never clobbers it. { <slug>: { claim: "..." } } drives the design's
// "THE CLAIM" callout; an optional data/briefings/featured/<slug>.md replaces
// the pass-through prose with a curated design body (tables, boxes, callouts).
let FEAT = {}
const FEAT_FILE = path.join(repoRoot, "data/briefings/briefing-featured.json")
if (fs.existsSync(FEAT_FILE)) {
  try {
    FEAT = JSON.parse(fs.readFileSync(FEAT_FILE, "utf8"))
  } catch (e) {
    console.warn(`  WARNING: could not read ${FEAT_FILE}: ${e.message}`)
  }
}

function parse(text) {
  if (!text.startsWith("---")) return { fm: {}, body: text }
  const end = text.indexOf("\n---", 3)
  if (end < 0) return { fm: {}, body: text }
  const fmText = text.slice(3, end)
  const body = text.slice(end + 4).replace(/^\n+/, "")
  const fm = {}
  for (const line of fmText.split("\n")) {
    const m = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/)
    if (m) fm[m[1]] = m[2].trim().replace(/^["']|["']$/g, "")
  }
  return { fm, body }
}

// The argument prose = the source body from its first "## " heading up to the
// "## References" / "## Sources" section. What precedes the first heading is the
// abstract source (rendered from META instead); the references section is
// rendered structurally from META instead.
function extractProse(body) {
  const firstH2 = body.search(/^##\s/m)
  let prose = firstH2 >= 0 ? body.slice(firstH2) : body
  const refsIdx = prose.search(/^##\s+(References|Sources)\s*$/m)
  if (refsIdx >= 0) prose = prose.slice(0, refsIdx)
  return prose.trimEnd()
}

const H2 =
  'style="font-family:Lora,serif;font-weight:400;font-size:30px;line-height:1.2;color:#2b1f1f;border-bottom:1px solid #e8e1db;padding-bottom:10px;margin:0 0 20px"'

function styleAbstract(html) {
  // Give each <p> the design's abstract treatment.
  return String(html || "").replace(
    /<p>/g,
    '<p style="font-size:16.5px;line-height:1.78;color:#3f3a3a;margin:0 0 18px;max-width:72ch">',
  )
}

// Primary legal / standards documents that do not sit in the Heavy Metal Index
// corpus — their title is not a corpus link, and they carry the design's
// "no source record" note.
const NO_RECORD_TYPES = new Set(["Case", "Litigation", "Legal", "Standard"])
function domainOf(href) {
  if (!href) return ""
  try {
    return new URL(href).hostname.replace(/^www\./, "")
  } catch {
    return ""
  }
}
function renderRefs(refs) {
  if (!refs || !refs.length) return ""
  const rows = refs
    .map((r) => {
      const noRecord = NO_RECORD_TYPES.has(r.type)
      const titleEl = r.href && !noRecord
        ? `<a href="${r.href}" style="font-size:16.5px;line-height:1.4;color:#1c43ad;text-decoration:none">${r.title}</a>`
        : `<span style="font-size:16.5px;line-height:1.4;color:#2b1f1f">${r.title}</span>`
      // The design meta is "{detail} · {domain}↗": clean citation text, then the
      // linked domain with a superscript arrow. Strip any inline link the parse
      // left in the detail so the domain is the single link.
      const metaText = String(r.meta_html || "").replace(/<a\b[^>]*>(.*?)<\/a>/g, "$1")
      const dom = domainOf(r.href)
      const domLink = dom
        ? `${metaText.trim() ? " &middot; " : ""}<a href="${r.href}" style="color:#736b6b">${dom}<span style="font-family:'IBM Plex Mono',monospace;font-size:10px;vertical-align:super">&#8599;</span></a>`
        : ""
      const meta =
        metaText.trim() || dom
          ? `<p style="font-size:13.5px;line-height:1.6;color:#736b6b;margin:6px 0 0">${metaText}${domLink}</p>`
          : ""
      // Type-appropriate wording: a standards body's document is not a "legal
      // document", so an ISO/ASTM/AOAC entry gets its own note rather than the
      // court-case one. Both say the same thing — named, but not a corpus row.
      const noRecReason = r.type === "Standard"
        ? "published standard, not corpus literature"
        : "primary legal document, not corpus literature"
      const noRecNote = noRecord
        ? `<p style="font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:#c3b9b9;margin:6px 0 0">No source record &mdash; ${noRecReason}</p>`
        : ""
      return `    <div style="display:grid;grid-template-columns:42px minmax(0,1fr) 128px;gap:16px;align-items:start;padding:14px 0;border-bottom:1px dotted #f2ece7"><span style="font-family:'IBM Plex Mono',monospace;font-size:12px;color:#9f2727;white-space:nowrap">[${r.n}]</span><div style="min-width:0">${titleEl}${meta}${noRecNote}</div><span style="font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:#a9a1a1;text-align:right;white-space:nowrap">${r.type || ""}</span></div>`
    })
    .join("\n")
  return `  <p style="font-size:13.5px;line-height:1.7;color:#736b6b;margin:0 0 20px;max-width:84ch">Works cited in this briefing&rsquo;s text, in first-appearance order. This is not the full evidence base for the underlying standard; it is only what the prose above draws on. Every range in the briefing is a model built on one of these published anchors. Where a work carries a DOI or a public URL, its title and domain link to it; primary legal documents and published standards are named but not linked to a corpus record.</p>
  <div style="border-top:1px solid #e8e1db">
${rows}
  </div>`
}

// Markdown emphasis (_x_ / *x*) -> <em> for HTML contexts (case names such as
// _Palmquist_ must render italic, not as literal underscores). plain() strips
// the markers for meta/SEO contexts. Both collapse whitespace runs so a stray
// double space in a source subtitle does not survive into the page.
function emph(s) {
  return String(s || "").replace(/\s+/g, " ").replace(/[_*]([^_*\n]+)[_*]/g, "<em>$1</em>").trim()
}
function plain(s) {
  return String(s || "").replace(/\s+/g, " ").replace(/[_*]([^_*\n]+)[_*]/g, "$1").trim()
}

// Bibliographic-record row. Label column is fixed (min 96px, up to its content
// width) and the value column takes the rest and WRAPS — the old
// `minmax(0,1fr) auto` let a long value (the subtitle) grow unbounded and
// collapse the label to zero width, so "Subtitle" slid under its own value.
function recordRow(label, value) {
  return `    <div style="display:grid;grid-template-columns:minmax(96px,max-content) minmax(0,1fr);gap:24px;align-items:baseline;padding:10px 0;border-bottom:1px dotted #f2ece7"><span style="font-size:13px;line-height:1.5;color:#3f3a3a">${label}</span><span style="font-family:'IBM Plex Mono',monospace;font-size:12.5px;line-height:1.5;color:#9f2727;text-align:right">${value}</span></div>`
}

// The design's "THE CLAIM" lead callout — a red pill + kicker + the briefing's
// one-sentence thesis in Lora. Rendered on every briefing that carries a claim.
function renderClaim(text, seriesName, date) {
  const kicker = `Technical report &middot; ${seriesName}${date ? " &middot; " + date : ""}`
  return `<div style="border:1px solid #f2dcda;background:#fdf4f3;padding:24px 26px;margin-bottom:52px">
  <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center;margin-bottom:14px"><span style="font-family:'IBM Plex Mono',monospace;font-size:15px;color:#fff;background:#9f2727;border-radius:3px;padding:7px 13px">THE CLAIM</span><span style="font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#9f2727">${kicker}</span></div>
  <p style="font-family:Lora,serif;font-size:24px;line-height:1.45;color:#2b1f1f;margin:0">${text}</p>
</div>`
}

console.log("import-briefings: rendering canonical briefing design")
const imported = []
const missingMeta = []
for (const file of fs.readdirSync(SRC).filter((f) => f.endsWith(".md"))) {
  const slug = file.replace(/\.md$/, "")
  const map = MAP[slug]
  if (!map) {
    console.warn(`  skip ${file} — not in the 10-briefing map`)
    continue
  }
  const { fm, body } = parse(fs.readFileSync(path.join(SRC, file), "utf8"))
  const title = map.title || fm.title || slug
  const subtitle = (fm.subtitle || "").replace(/\\/g, "").replace(/\s+/g, " ").trim()
  const subtitleHtml = emph(subtitle) // <em> for display (hero dek, bib record, cite)
  const subtitlePlain = plain(subtitle) // markers stripped, for the meta description
  const m = META[slug]
  if (!m) missingMeta.push(slug)

  const year = (fm.date && fm.date.match(/\d{4}/)) ? fm.date.match(/\d{4}/)[0] : "2026"
  const seriesLabel = m?.series || "Briefing"
  const briefNum = seriesLabel.match(/Brief\s+(\d+)/i)
  const seriesName = briefNum ? `HMTc Standards Briefing ${briefNum[1]}` : "HMTc Standards Briefing"
  const refCount = m?.references?.length || 0
  const pdfRel = fs.existsSync(path.join(PDF_DIR, `${slug}.pdf`)) ? `/static/briefings/${slug}.pdf` : null

  // ---- frontmatter (chrome the shared HeroBand + Rail read) ----------------
  const front = [
    "---",
    `title: "${title.replace(/"/g, '\\"')}"`,
    subtitle ? `description: "${subtitlePlain.replace(/"/g, '\\"').slice(0, 200)}"` : null,
    subtitle ? `dek_html: "${subtitleHtml.replace(/"/g, '\\"')}"` : null,
    "type: public-briefing",
    `section: "${map.section}"`,
    `briefing_slug: ${slug}`,
    fm.author ? `author: "${fm.author.replace(/"/g, '\\"')}"` : `author: "Karen Pendergrass"`,
    "orcid: 0000-0002-2348-7259",
    fm.date ? `briefing_date: "${fm.date}"` : null,
    fm.date ? `updated: "${fm.date}"` : null,
    // Scholar-eligible only when a PDF exists to be the citable artifact; a
    // scholar-eligible page with no PDF emits a dangling citation_pdf_url.
    `scholar_eligible: ${pdfRel ? "true" : "false"}`,
    // The PDF edition is declared in frontmatter and rendered by the right-rail
    // (Rail.tsx reads `pdf`); no inline download card in the body.
    pdfRel ? `pdf: "${pdfRel}"` : null,
    "audience: [regulator, brand-legal, brand-finance, retailer-compliance]",
    "snapshot:",
    `  - { k: "Series number", v: "${seriesLabel}" }`,
    fm.date ? `  - { k: "Published", v: "${fm.date}" }` : null,
    `  - { k: "Document type", v: "Report" }`,
    `  - { k: "References", v: "${refCount}" }`,
    "connections:",
    '  - { label: "HMTc Standards register", href: "/standards" }',
    '  - { label: "How limits are derived", href: "/program/structure" }',
    '  - { label: "All Standards Briefings", href: "/briefings" }',
    '  - { label: "Heavy Metal Index — evidence base", href: "https://heavymetalindex.com" }',
    "---",
    "",
  ].filter((l) => l !== null)

  // ---- body: Abstract · prose · References · Bibliographic record · Cite ----
  const abstractHtml = m?.abstract_html
    ? styleAbstract(m.abstract_html)
    : subtitle
      ? `<p style="font-size:16.5px;line-height:1.78;color:#3f3a3a;margin:0;max-width:72ch">${subtitleHtml}</p>`
      : ""
  const prose = extractProse(body)

  // Featured layer: a "THE CLAIM" callout (from the claim field) plus, when a
  // curated body exists at data/briefings/featured/<slug>.md, the design's
  // tables/boxes/callouts in place of the pass-through prose.
  const claim = FEAT[slug]?.claim || null
  const claimCallout = claim ? renderClaim(claim, seriesName, fm.date) : ""
  const featuredPath = path.join(repoRoot, "data/briefings/featured", `${slug}.md`)
  const featuredBody = fs.existsSync(featuredPath) ? fs.readFileSync(featuredPath, "utf8").trim() : null
  const argument = featuredBody || prose

  const recordRows = [
    recordRow("Title", title),
    subtitle ? recordRow("Subtitle", subtitleHtml) : null,
    recordRow("Author", (fm.author || "Karen Pendergrass").split(" ").reverse().join(", ").replace(/^, /, "")),
    recordRow("ORCID", "0000-0002-2348-7259"),
    recordRow("Author institution", "Heavy Metal Tested &amp; Certified, Institute of Contaminant Standards (ICS)"),
    recordRow("Publisher", "Institute of Contaminant Standards (ICS)"),
    recordRow("Series", seriesName),
    recordRow("Document type", "Technical report"),
    fm.date ? recordRow("Publication date", fm.date) : null,
    recordRow("Language", "en"),
    recordRow("DOI", "not yet assigned"),
  ].filter(Boolean).join("\n")
  const licenseRowLast = `    <div style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:16px;align-items:baseline;padding:10px 0"><span style="font-size:13px;line-height:1.5;color:#3f3a3a">License</span><span style="font-family:'IBM Plex Mono',monospace;font-size:12.5px;color:#9f2727;text-align:right">CC BY 4.0 (prose)</span></div>`

  const citeStr =`Pendergrass, K. (${year}). <em style="font-style:normal">${title}${subtitle ? ": " + subtitleHtml : ""}</em> (${seriesName}). Institute of Contaminant Standards (ICS).`

  const bodyStr = `## Abstract

${abstractHtml}

${claimCallout ? claimCallout + "\n\n" : ""}${argument}

## References

${renderRefs(m?.references)}

## Bibliographic record

  <p style="font-size:13.5px;line-height:1.7;color:#736b6b;margin:0 0 20px;max-width:84ch">The fields an indexing service reads. Title, named first author and year are the three that carry the record; a briefing missing any one of them is treated as carrying no metadata at all.</p>
  <div style="border:1px solid #e8e1db;background:#fffdfb;padding:16px 18px;margin-bottom:16px">
${recordRows}
${licenseRowLast}
  </div>
  <div style="border:1px dotted #e8e1db;background:#faf7f4;padding:15px 18px">
    <div style="font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:#a9a1a1;margin-bottom:7px">No DOI on this series</div>
    <p style="font-size:13px;line-height:1.65;color:#a9a1a1;margin:0">The three peer-track preprints are deposited with DOIs; the briefing series is not. Depositing the briefings would make each independently resolvable after any URL change &mdash; worth doing for the documents most likely to be cited.</p>
  </div>

## Cite this briefing

  <div style="border:1px solid #e8e1db;background:#fffdfb">
    <div style="padding:11px 15px;border-bottom:1px solid #e8e1db;background:#fdf4f3;font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;color:#9f2727">Reuse this briefing</div>
    <div style="padding:14px 15px">
      <p style="font-family:'IBM Plex Mono',monospace;font-size:11px;line-height:1.75;color:#5a4141;margin:0 0 14px">${citeStr}</p>
      <p style="font-size:11.5px;line-height:1.55;color:#a9a1a1;max-width:84ch;margin:0">Prose CC BY 4.0. Direct reproduction of substantial portions requires written permission from Institute of Contaminant Standards (ICS)</p>
    </div>
  </div>
`

  fs.writeFileSync(path.join(OUT, `${slug}.md`), front.join("\n") + "\n" + bodyStr, "utf8")
  imported.push({ slug, title, section: map.section, refs: refCount })
}

console.log(
  `import-briefings: rendered ${imported.length} briefings in the canonical design (index.md hand-authored, not emitted)`,
)
if (missingMeta.length) {
  console.warn(`  WARNING: no parsed metadata for: ${missingMeta.join(", ")} — abstract/references fell back to minimal.`)
}
if (imported.length !== Object.keys(MAP).length) {
  console.warn(`  WARNING: expected ${Object.keys(MAP).length}, imported ${imported.length}`)
}
