#!/usr/bin/env node
// build-manuals-page.mjs — the "publish a standards manual when it's ready" mechanism
// (Karen 2026-06-20: "once a manual hits, a page that publishes the standards + the
// downloadable PDF; it's ok if we're waiting on adjudication for others").
//
// Reads data/manuals/manifest.json. A manual goes LIVE — downloadable, with Scholar
// technical-report metadata + DOI eligibility — ONLY when status == 'published' AND
// its PDF is present at data/manuals/<pdf>. 'pending_refresh' manuals are listed
// honestly as "in preparation" with NO download and NO citation metadata (publishing
// a stale/contaminated standard, or claiming scholarly status for one, is the Daubert
// self-harm the firewall exists to prevent).
//
// OUTPUT: content/manuals/index.md (+ one landing page per published manual) and
//         copies each published PDF into static/ for download.

import fs from "node:fs"
import path from "node:path"

const repoRoot = process.cwd()
const MANIFEST = path.join(repoRoot, "data/manuals/manifest.json")
const PDF_DIR = path.join(repoRoot, "data/manuals")
const OUT_DIR = path.join(repoRoot, "content/manuals")
const STATIC_DIR = path.join(repoRoot, "content/static/manuals")

const manifest = JSON.parse(fs.readFileSync(MANIFEST, "utf8"))
fs.mkdirSync(OUT_DIR, { recursive: true })

// A manual's live download is its served `download_pdf` (a consolidated PDF committed
// under content/static/manuals/) when present, else the copied `pdf`. It counts as
// published when either exists — so a custom_landing manual whose web edition has moved
// ahead of the deposited volume goes live on the served v2, not on the stale deposit.
const servedDownload = (m) =>
  m.download_pdf && fs.existsSync(path.join(STATIC_DIR, m.download_pdf)) ? `/static/manuals/${m.download_pdf}` : null

const published = []
const pending = []
for (const m of manifest.manuals) {
  const depositExists = fs.existsSync(path.join(PDF_DIR, m.pdf))
  const live = m.status === "published" && (servedDownload(m) || depositExists)
  if (m.status === "published" && !servedDownload(m) && !depositExists) {
    console.warn(`  WARNING: ${m.slug} is status:published but neither a served download_pdf nor data/manuals/${m.pdf} exists — listing as pending.`)
  }
  if (live) published.push(m)
  else pending.push(m)
}

// Copy published PDFs into the served static dir + write a landing page each.
if (published.length) fs.mkdirSync(STATIC_DIR, { recursive: true })
for (const m of published) {
  // A custom_landing manual renders its own rich landing page (a dedicated generator owns it) and
  // does NOT ship the manifest PDF — used when the web edition has moved ahead of the consolidated
  // PDF. Skip the stub write and the stale-PDF copy; it still appears in the index below, linking to
  // its page instead of a download.
  if (m.custom_landing) continue
  fs.copyFileSync(path.join(PDF_DIR, m.pdf), path.join(STATIC_DIR, m.pdf))
  const pdfUrl = `/static/manuals/${m.pdf}`
  const fm = [
    "---",
    `title: "${m.title} — HMTc Program Manual"`,
    "type: standard",
    "scholar_eligible: true",
    m.doi ? `cert_doi: ${m.doi}` : null,
    "scholar_pdf: true",
    `effective_date: ${m.edition}`,
    "audience: [regulator, brand-legal, retailer-compliance, certifier]",
    "---",
    "",
  ].filter((l) => l !== null).join("\n")
  const body = [
    `# ${m.title} — HMTc Program Manual`,
    "",
    `The published Heavy Metal Tested & Certified standard for ${m.title} (edition ${m.edition}), a citable technical document.`,
    "",
    `**[Download the PDF](${pdfUrl})**`,
    "",
    `Standards are living, versioned documents in their native basis; this is the ${m.edition} edition. The methodology is described in [Program Structure](../program/structure); the per-subcategory limits also render in the live [Standards index](../standards/).`,
    "",
  ].join("\n")
  fs.writeFileSync(path.join(OUT_DIR, `${m.slug}.md`), fm + body, "utf8")
}

// ---- The manuals index (ported v3 design: inline-HTML sections) ------------
// The design mock shows five published volumes / 1,358 pp; the manifest is the
// source of truth. Only status:"published" + PDF-present manuals render as
// downloadable editions with a bibliographic record; every count in the hero
// snapshot and the "Published editions" list is derived from that set. Pending
// manuals list under "Forthcoming" with no download and no DOI (the honest-
// gating rule — publishing a stale standard is the Daubert self-harm the
// firewall exists to prevent).
const H2 =
  'style="font-family:Lora,serif;font-weight:400;font-size:30px;line-height:1.2;color:#2b1f1f;border-bottom:1px solid #e8e1db;padding-bottom:10px;margin:0 0 20px"'
const num = (n) => Number(n || 0).toLocaleString("en-US")
const pubCount = published.length
const totalSubcats = published.reduce((s, m) => s + (m.subcategories || 0), 0)
const totalPages = published.reduce((s, m) => s + (m.pages || 0), 0)
const primary = published[0] || null
const edition = primary ? primary.edition : "2026"

// Published-editions rows + the shared bibliographic record (from the primary
// published manual). Empty-state if nothing is published yet.
const pubRows = published
  .map((m) => {
    const meta = `${m.edition} Edition &middot; ${num(m.subcategories)} subcategor${m.subcategories === 1 ? "y" : "ies"} &middot; ${num(m.pages)} pp`
    const dl = servedDownload(m)
    const btnStyle = `font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.08em;text-transform:uppercase;color:#9f2727;border:1px solid #f2dcda;background:#fdf4f3;border-radius:2px;padding:5px 10px;text-decoration:none;white-space:nowrap`
    // Title links to the landing page for a custom_landing manual; the button is the live
    // download (served v2 when present), so the row offers the download IN ADDITION to the
    // title's page link — matching the /standards card.
    const title = m.custom_landing
      ? `<a href="/manuals/${m.slug}" style="color:#2b1f1f;text-decoration:none">${m.title}</a>`
      : m.title
    const button = dl
      ? `<a href="${dl}" download="download" style="${btnStyle}">Download PDF</a>`
      : m.custom_landing
        ? `<a href="/manuals/${m.slug}" style="${btnStyle}">Read the standard</a>`
        : `<a href="/static/manuals/${m.pdf}" download="download" style="${btnStyle}">Download PDF</a>`
    return `    <div style="display:flex;align-items:baseline;justify-content:space-between;gap:20px;flex-wrap:wrap;padding:15px 18px;border-bottom:1px solid #f2ece7">
      <div style="min-width:0">
        <div style="font-family:Lora,serif;font-size:19px;line-height:1.3;color:#2b1f1f">${title}</div>
        <div style="font-family:'IBM Plex Mono',monospace;font-size:10.5px;letter-spacing:.06em;text-transform:uppercase;color:#a9a1a1;margin-top:4px">${meta}</div>
      </div>
      ${button}
    </div>`
  })
  .join("\n")

const biblio = primary
  ? `  <div style="border:1px solid #e8e1db;background:#fffdfb;padding:16px 18px;margin-bottom:16px">
    <div style="font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:#9f2727;margin-bottom:8px">Bibliographic record${pubCount > 1 ? " — " + primary.title : ""}</div>
    <div style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:16px;align-items:baseline;padding:10px 0;border-bottom:1px dotted #f2ece7"><span style="font-size:13px;line-height:1.5;color:#3f3a3a">Author</span><span style="font-family:'IBM Plex Mono',monospace;font-size:12.5px;color:#9f2727;white-space:nowrap">Karen Pendergrass</span></div>
    <div style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:16px;align-items:baseline;padding:10px 0;border-bottom:1px dotted #f2ece7"><span style="font-size:13px;line-height:1.5;color:#3f3a3a">ORCID</span><span style="font-family:'IBM Plex Mono',monospace;font-size:12.5px;color:#9f2727;white-space:nowrap">0000-0002-2348-7259</span></div>
    <div style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:16px;align-items:baseline;padding:10px 0;border-bottom:1px dotted #f2ece7"><span style="font-size:13px;line-height:1.5;color:#3f3a3a">Publisher</span><span style="font-family:'IBM Plex Mono',monospace;font-size:12.5px;color:#9f2727;white-space:nowrap">Institute of Contaminant Standards (ICS)</span></div>
    <div style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:16px;align-items:baseline;padding:10px 0;border-bottom:1px dotted #f2ece7"><span style="font-size:13px;line-height:1.5;color:#3f3a3a">Edition</span><span style="font-family:'IBM Plex Mono',monospace;font-size:12.5px;color:#9f2727;white-space:nowrap">${primary.edition}</span></div>
    ${primary.published_date ? `<div style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:16px;align-items:baseline;padding:10px 0;border-bottom:1px dotted #f2ece7"><span style="font-size:13px;line-height:1.5;color:#3f3a3a">Published</span><span style="font-family:'IBM Plex Mono',monospace;font-size:12.5px;color:#9f2727;white-space:nowrap">${primary.published_date}</span></div>\n    ` : ""}${primary.revised_date ? `<div style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:16px;align-items:baseline;padding:10px 0;border-bottom:1px dotted #f2ece7"><span style="font-size:13px;line-height:1.5;color:#3f3a3a">Revised</span><span style="font-family:'IBM Plex Mono',monospace;font-size:12.5px;color:#9f2727;white-space:nowrap">${primary.revised_date}</span></div>\n    ` : ""}${primary.doi ? `<div style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:16px;align-items:baseline;padding:10px 0;border-bottom:1px dotted #f2ece7"><span style="font-size:13px;line-height:1.5;color:#3f3a3a">DOI</span><span style="font-family:'IBM Plex Mono',monospace;font-size:12.5px;color:#9f2727;white-space:nowrap">${primary.doi}</span></div>\n    ` : ""}<div style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:16px;align-items:baseline;padding:10px 0"><span style="font-size:13px;line-height:1.5;color:#3f3a3a">License</span><span style="font-family:'IBM Plex Mono',monospace;font-size:12.5px;color:#9f2727;white-space:nowrap">CC BY 4.0 (prose)</span></div>
  </div>`
  : `  <div style="border:1px dotted #e8e1db;background:#faf7f4;padding:18px 20px;margin-bottom:16px"><div style="font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:#a9a1a1;margin-bottom:7px">No manual published yet</div><p style="font-size:13px;line-height:1.65;color:#a9a1a1;margin:0">The first category manual publishes here once its every value is defensibly current and it has been deposited with a DOI.</p></div>`

const forthcomingCards = pending
  .map(
    (m) => `    <div style="background:#fffdfb;padding:16px 18px">
      <div style="font-size:14.5px;line-height:1.45;color:#2b1f1f">${m.title}</div>
      <div style="font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:#a9a1a1;margin-top:5px">In preparation</div>
    </div>`,
  )
  .join("\n")

const pubIntro =
  pubCount === 1
    ? `The ${primary.title} manual is the first category volume in force for the ${edition} edition, carrying ${num(totalSubcats)} subcategory standards. The manual is the bound, citable volume for its category; the web pages carry the same content per subcategory.`
    : `${num(pubCount)} categories are in force for the ${edition} edition, carrying ${num(totalSubcats)} subcategory standards between them. Each manual is the bound, citable volume for its category; the web pages are the same content per subcategory.`

const idxFront = [
  "---",
  'title: "Program Manuals"',
  "type: manuals-index",
  "audience: [regulator, brand-legal, retailer-compliance, certifier]",
  `description: "The bound, citable edition of a category's standards. Each manual carries a DOI, a named author, a revision date, and the full derivation of every limit it publishes — so a limit can be cited in a filing years after the web page has moved on."`,
  "snapshot:",
  `  - { k: "Published manuals", v: "${num(pubCount)}" }`,
  `  - { k: "Subcategory standards", v: "${num(totalSubcats)}" }`,
  `  - { k: "Pages", v: "${num(totalPages)}" }`,
  `  - { k: "Current edition", v: "${edition}" }`,
  "connections:",
  '  - { label: "The subcategory standards register", href: "/standards" }',
  '  - { label: "Program structure", href: "/program/structure" }',
  '  - { label: "Standards briefings", href: "/briefings" }',
  '  - { label: "Heavy Metal Index", href: "https://heavymetalindex.com" }',
  ...(primary
    ? [
        "rail_box:",
        "  variant: note",
        '  title: "Cite the manual"',
        `  body: "Pendergrass, K. HMTc ${primary.title} Program Manual. ${primary.edition} Edition. Institute of Contaminant Standards (ICS), ${primary.edition}.${primary.doi ? " doi:" + primary.doi : ""}"`,
      ]
    : []),
  "---",
  "",
].join("\n")

const idxBody = `<section id="published" style="margin-bottom:52px">
  <h2 ${H2}>Published editions</h2>
  <p style="font-size:13.5px;line-height:1.7;color:#736b6b;margin:0 0 20px;max-width:84ch">${pubIntro}</p>
  <div style="border:1px solid #e8e1db;background:#fffdfb;margin-bottom:20px">
${pubRows}
  </div>
${biblio}
</section>

<section id="inside" style="margin-bottom:52px">
  <h2 ${H2}>What is inside</h2>
  <p style="font-size:13.5px;line-height:1.7;color:#736b6b;margin:0 0 20px;max-width:84ch">Five parts. The standards themselves are Part 3; everything around them exists so a reader can check them.</p>
  <div style="border:1px solid #e8e1db;background:#fffdfb">
    <div style="padding:17px 19px;border-bottom:1px solid #f2ece7"><div style="display:flex;align-items:baseline;gap:14px;flex-wrap:wrap;margin-bottom:8px"><span style="font-family:'IBM Plex Mono',monospace;font-size:11px;color:#9f2727;white-space:nowrap">Part 1</span><span style="font-family:Lora,serif;font-size:19px;line-height:1.3;color:#2b1f1f">Why HMTc Exists</span></div><p style="font-size:14px;line-height:1.7;color:#3f3a3a;margin:0;max-width:74ch">The argument for the program: why a four-metal panel is no longer defensible, what the litigation record changed, and why a category-wide limit is the wrong instrument.</p></div>
    <div style="padding:17px 19px;border-bottom:1px solid #f2ece7"><div style="display:flex;align-items:baseline;gap:14px;flex-wrap:wrap;margin-bottom:8px"><span style="font-family:'IBM Plex Mono',monospace;font-size:11px;color:#9f2727;white-space:nowrap">Part 2</span><span style="font-family:Lora,serif;font-size:19px;line-height:1.3;color:#2b1f1f">The HMTc Program</span></div><p style="font-size:14px;line-height:1.7;color:#3f3a3a;margin:0;max-width:74ch">Operational policy. Analyte tiering, the five certification statuses, transitional variance conditions, the three-lot baseline, the Confidential Remediation Track, and how to use heavymetalindex.com as the evidence base.</p></div>
    <div style="padding:17px 19px;border-bottom:1px solid #f2ece7"><div style="display:flex;align-items:baseline;gap:14px;flex-wrap:wrap;margin-bottom:8px"><span style="font-family:'IBM Plex Mono',monospace;font-size:11px;color:#9f2727;white-space:nowrap">Part 3</span><span style="font-family:Lora,serif;font-size:19px;line-height:1.3;color:#2b1f1f">The Standards</span></div><p style="font-size:14px;line-height:1.7;color:#3f3a3a;margin:0;max-width:74ch">One chapter per subcategory. Each carries its audience routing, Master Limit Table, methodology, per-analyte sections, adversarial read, sources cited, cross-references and provenance footer.</p></div>
    <div style="padding:17px 19px;border-bottom:1px solid #f2ece7"><div style="display:flex;align-items:baseline;gap:14px;flex-wrap:wrap;margin-bottom:8px"><span style="font-family:'IBM Plex Mono',monospace;font-size:11px;color:#9f2727;white-space:nowrap">Part 4</span><span style="font-family:Lora,serif;font-size:19px;line-height:1.3;color:#2b1f1f">The Lot Testing Schedule</span></div><p style="font-size:14px;line-height:1.7;color:#3f3a3a;margin:0;max-width:74ch">Surveillance protocols per status, reflex testing triggers, speciation requirements, sampling methodology and chain of custody, decision rules under measurement uncertainty, and CAPA timelines.</p></div>
    <div style="padding:17px 19px"><div style="display:flex;align-items:baseline;gap:14px;flex-wrap:wrap;margin-bottom:8px"><span style="font-family:'IBM Plex Mono',monospace;font-size:11px;color:#9f2727;white-space:nowrap">Part 5</span><span style="font-family:Lora,serif;font-size:19px;line-height:1.3;color:#2b1f1f">Methodology and adversarial read</span></div><p style="font-size:14px;line-height:1.7;color:#3f3a3a;margin:0;max-width:74ch">How HMTc standards are set, why the methodology is defensible, the program-level adversarial read, and the glossary.</p></div>
  </div>
</section>

<section id="relation" style="margin-bottom:52px">
  <h2 ${H2}>Manual and web page</h2>
  <p style="font-size:16.5px;line-height:1.78;color:#3f3a3a;margin:0 0 18px;max-width:72ch">These are the same content at two granularities, not two sources of truth. The web pages are per subcategory and always reflect the current edition. The manual is the bound category volume, fixed at its revision date and citable as a single object.</p>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(17rem,1fr));gap:1px;background:#e8e1db;border:1px solid #e8e1db;margin-bottom:20px">
    <div style="background:#fffdfb;padding:19px">
      <div style="font-family:Lora,serif;font-size:19px;line-height:1.3;color:#2b1f1f;margin-bottom:10px">The web pages</div>
      <div style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:16px;align-items:baseline;padding:10px 0;border-bottom:1px dotted #f2ece7"><span style="font-size:13px;line-height:1.5;color:#3f3a3a">Granularity</span><span style="font-family:'IBM Plex Mono',monospace;font-size:12.5px;color:#9f2727;white-space:nowrap">per subcategory</span></div>
      <div style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:16px;align-items:baseline;padding:10px 0;border-bottom:1px dotted #f2ece7"><span style="font-size:13px;line-height:1.5;color:#3f3a3a">Currency</span><span style="font-family:'IBM Plex Mono',monospace;font-size:12.5px;color:#9f2727;white-space:nowrap">always current</span></div>
      <div style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:16px;align-items:baseline;padding:10px 0;border-bottom:1px dotted #f2ece7"><span style="font-size:13px;line-height:1.5;color:#3f3a3a">Citable object</span><span style="font-family:'IBM Plex Mono',monospace;font-size:12.5px;color:#9f2727;white-space:nowrap">the page</span></div>
      <div style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:16px;align-items:baseline;padding:10px 0"><span style="font-size:13px;line-height:1.5;color:#3f3a3a">Best for</span><span style="font-family:'IBM Plex Mono',monospace;font-size:12.5px;color:#9f2727;white-space:nowrap">lookup, search</span></div>
    </div>
    <div style="background:#fffdfb;padding:19px">
      <div style="font-family:Lora,serif;font-size:19px;line-height:1.3;color:#2b1f1f;margin-bottom:10px">The manual</div>
      <div style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:16px;align-items:baseline;padding:10px 0;border-bottom:1px dotted #f2ece7"><span style="font-size:13px;line-height:1.5;color:#3f3a3a">Granularity</span><span style="font-family:'IBM Plex Mono',monospace;font-size:12.5px;color:#9f2727;white-space:nowrap">per category</span></div>
      <div style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:16px;align-items:baseline;padding:10px 0;border-bottom:1px dotted #f2ece7"><span style="font-size:13px;line-height:1.5;color:#3f3a3a">Currency</span><span style="font-family:'IBM Plex Mono',monospace;font-size:12.5px;color:#9f2727;white-space:nowrap">fixed at revision</span></div>
      <div style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:16px;align-items:baseline;padding:10px 0;border-bottom:1px dotted #f2ece7"><span style="font-size:13px;line-height:1.5;color:#3f3a3a">Citable object</span><span style="font-family:'IBM Plex Mono',monospace;font-size:12.5px;color:#9f2727;white-space:nowrap">DOI</span></div>
      <div style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:16px;align-items:baseline;padding:10px 0"><span style="font-size:13px;line-height:1.5;color:#3f3a3a">Best for</span><span style="font-family:'IBM Plex Mono',monospace;font-size:12.5px;color:#9f2727;white-space:nowrap">filings, exhibits</span></div>
    </div>
  </div>
  <div style="border-left:3px solid #9f2727;background:#fdf4f3;padding:18px 22px">
    <p style="font-size:15.5px;line-height:1.75;color:#5a4141;margin:0">If the two ever disagree, the manual edition named on the certificate governs that certificate. A brand is held to the standard in force when it was tested, not to a later revision.</p>
  </div>
</section>

<section id="versioning" style="margin-bottom:52px">
  <h2 ${H2}>Editions and revisions</h2>
  <p style="font-size:16.5px;line-height:1.78;color:#3f3a3a;margin:0 0 18px;max-width:72ch">A manual is superseded, never quietly corrected. A new edition gets a new DOI and the prior edition stays resolvable, because a filing that cited the ${edition} edition must still be able to reach exactly what it cited.</p>
  <p style="font-size:16.5px;line-height:1.78;color:#3f3a3a;margin:0 0 18px;max-width:72ch">Substantive changes to a published limit go through the Standards Ratchet Mechanism, which caps how far a limit can move in one step and requires a stated trigger. Limits tighten as the evidence base and analytical feasibility improve; they do not loosen because a brand found them inconvenient.</p>
</section>

<section id="forthcoming">
  <h2 ${H2}>Forthcoming</h2>
  <p style="font-size:13.5px;line-height:1.7;color:#736b6b;margin:0 0 20px;max-width:84ch">A manual publishes when every subcategory in its category has a defensible standard. Categories in progress publish subcategory by subcategory on the web first.</p>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(13rem,1fr));gap:1px;background:#e8e1db;border:1px solid #e8e1db">
${forthcomingCards}
  </div>
</section>
`

fs.writeFileSync(path.join(OUT_DIR, "index.md"), idxFront + idxBody, "utf8")

console.log(
  `build-manuals-page: ${published.length} published (downloadable), ${pending.length} pending_refresh (listed as in preparation).`,
)
