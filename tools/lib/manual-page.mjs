// manual-page.mjs — the SINGLE canonical renderer for every HMTc Program Manual
// landing page. The design is ported verbatim from the approved Claude Design
// canvas "Heavy Metal Certified v3.dc.html" (project af74967e-…, `isManual`
// screen). Both build-cat1-manual.mjs and build-category-manual.mjs call
// renderManualPage() so every category's manual is byte-identical in design; only
// the data differs. See [[project_manual_v3_canonical_design]] in memory and
// docs/design-canon/MANUAL-PAGE.md.
//
// CANONICAL RULE (do not regress): the hero band, the "On this page" rail, the
// Connections / Document-versions / PDF rail are the site's v3 components
// (HeroBand.tsx · Snav.tsx · Rail.tsx), driven ENTIRELY by the frontmatter this
// module emits — NEVER hand-rolled in content. A hand-rolled <h1> in content was
// the old duplicate-title defect; this renderer emits no <h1>. The body carries
// the canonical sections as raw-HTML <section> blocks whose <h2> carries the
// anchor id (scope/matrix/hard/edition) with the v3 inline styles — the id lives
// on the <h2>, not the <section>, so snavScrollSpy's h2 pass also picks up the
// markdown-injected `## Version history` and the "On this page" rail is complete.
// Version history is appended separately by build-cert-version-history.mjs.

// ── v3 tokens (verbatim from the canvas) ──────────────────────────────────────
const ACCENT = "#9f2727"
const LINK = "#1c43ad"
const INK = "#2b1f1f"
const BODY = "#3f3a3a"
const MUTE = "#736b6b"
const FAINT = "#a9a1a1"
const BORDER = "#e8e1db"
const ROWB = "#f2ece7"
const CELLB = "#f4eee9"
const TINT = "#fdf4f3"

// Section H2 — verbatim from the canvas (Lora 400 30px, hairline underline).
const H2 = `font-family:Lora,serif;font-weight:400;font-size:30px;line-height:1.2;color:${INK};border-bottom:1px solid ${BORDER};padding-bottom:10px;margin:0 0 20px`

const esc = (s) => String(s == null ? "" : s).replace(/&(?![a-z#0-9]+;)/gi, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
// YAML double-quoted scalar: escape backslashes and quotes only (entities/dashes pass through).
const yq = (s) => `"${String(s == null ? "" : s).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`
// "Pb, Cd, iAs and Hg"
const andList = (arr) => {
  const a = arr.filter(Boolean)
  if (a.length <= 1) return a.join("")
  return `${a.slice(0, -1).join(", ")} and ${a[a.length - 1]}`
}

// ── master limit matrix (canvas #matrix) ──────────────────────────────────────
// analytes: [{ key, col }]  rows: [{ slug, name, cells:{key:val}, basis }]
// tier1Labels/tier2Labels: display-label arrays (e.g. ["Pb","Cd","iAs","Hg"]).
export function renderMatrix({ analytes, rows, tier1Labels = [], tier2Labels = [], note }) {
  // The canonical `.wiki-content thead tr/th` rule (cert-chrome.scss) supplies the
  // burgundy head, white IBM Plex Mono th, and padding (all !important). We add ONLY
  // what the canon does not: right-alignment for numeric columns and the sticky
  // first column (its own #9f2727 bg so cells scroll under it cleanly). No inline
  // background on <thead>/<tr> — that keeps the design-lint table-backlog clean.
  const th = (label, { align = "right", sticky = false } = {}) =>
    `<th style="text-align:${align}${sticky ? `;position:sticky;left:0;background:${ACCENT};z-index:1` : ""}">${label}</th>`
  const head = `<tr>${th("Subcategory", { align: "left", sticky: true })}${analytes.map((a) => th(esc(a.col))).join("")}${th("Basis", { align: "left" })}</tr>`
  const bodyRows = rows
    .map((r) => {
      const nameCell = r.slug
        ? `<a href="/standards/${r.slug}" style="color:${LINK};text-decoration:none">${esc(r.name)}</a>`
        : `<span>${esc(r.name)}</span>`
      const first = `<td style="padding:11px 12px;border-bottom:1px solid ${ROWB};font-size:13.5px;line-height:1.45;color:${INK};position:sticky;left:0;background:${TINT};min-width:15rem">${nameCell}</td>`
      const cells = analytes
        .map((a) => {
          const raw = r.cells[a.key]
          const v = raw == null || raw === "" ? "—" : String(raw)
          const dim = v === "—" || v === "n/m"
          return `<td style="padding:11px 12px;border-bottom:1px solid ${ROWB};border-left:1px solid ${CELLB};font-family:'IBM Plex Mono',monospace;font-size:12.5px;line-height:1.5;color:${dim ? FAINT : INK};text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap">${esc(v)}</td>`
        })
        .join("")
      const basis = `<td style="padding:11px 12px;border-bottom:1px solid ${ROWB};border-left:1px solid ${CELLB};font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:.03em;color:${MUTE};white-space:nowrap">${esc(r.basis)}</td>`
      return `<tr>${first}${cells}${basis}</tr>`
    })
    .join("\n")

  const legendRows = []
  if (tier1Labels.length)
    legendRows.push(
      `<span style="font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:${ACCENT};white-space:nowrap">Tier 1</span><span style="font-size:12.5px;line-height:1.6;color:${MUTE}">${andList(tier1Labels)} are zero-tolerance: no transitional allowance applies to any value in those columns.</span>`,
    )
  if (tier2Labels.length)
    legendRows.push(
      `<span style="font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:${ACCENT};white-space:nowrap">Tier 2</span><span style="font-size:12.5px;line-height:1.6;color:${MUTE}">${andList(tier2Labels)} carry the program&rsquo;s 150% transitional allowance under a stated remediation plan.</span>`,
    )
  const legend = legendRows.length
    ? `<div style="display:grid;grid-template-columns:auto minmax(0,1fr);gap:9px 12px;margin-top:16px;padding-top:15px;border-top:1px solid ${BORDER}">${legendRows.join("")}</div>`
    : ""

  const defaultNote = `All values ppb (&micro;g/kg) in each row&rsquo;s native basis. Click any subcategory for its full government-by-government derivation. n/m = not material in the matrix: measured but with no standalone number, controlled by the total-metal screen or packaging control, not an invented value.`
  return `<section style="margin-bottom:52px">
<h2 id="matrix" style="${H2}">Master limit matrix</h2>
<p style="font-size:13.5px;line-height:1.7;color:${MUTE};margin:0 0 20px;max-width:84ch">${note || defaultNote}</p>
<div style="overflow-x:auto;border:1px solid ${BORDER}"><table style="width:100%;border-collapse:collapse;min-width:60rem"><thead>${head}</thead><tbody>
${bodyRows}
</tbody></table></div>${legend}
</section>`
}

// ── scope + method (canvas #scope) ────────────────────────────────────────────
// methodNoteHtml is HTML (may carry <a> and entities). scopeLeadHtml overrides the
// universal first paragraph when a category needs a bespoke lead.
export function renderScope({ methodNoteHtml, scopeLeadHtml }) {
  const lead =
    scopeLeadHtml ||
    `Every limit on every subcategory is the strictest maximum level set by any credible government worldwide, converted to the product&rsquo;s native basis, with a disclosed read-across from the nearest government value where no government regulates the exact product. Nothing is invented; every number traces to a named sovereign limit in the <a href="/regulations" style="color:${LINK}">regulation references</a>.`
  return `<section style="margin-bottom:52px">
<h2 id="scope" style="${H2}">Scope and method</h2>
<p style="font-size:17.5px;line-height:1.72;color:${INK};margin:0 0 18px;max-width:74ch">${lead}</p>
<p style="font-size:16.5px;line-height:1.78;color:${BODY};margin:0 0 4px;max-width:74ch">Method: <a href="/program/structure" style="color:${LINK}">government-limit default (Method v2.0)</a>. ${methodNoteHtml}</p>
</section>`
}

// ── about this edition (canvas #edition) ──────────────────────────────────────
export function renderEdition({ editionPdfLine }) {
  return `<section style="margin-bottom:52px">
<h2 id="edition" style="${H2}">About this edition</h2>
<p style="font-size:16.5px;line-height:1.78;color:${BODY};margin:0 0 18px;max-width:74ch">Standards are living, versioned documents; each subcategory page carries its own version history and dated change log. This is the current web edition. ${editionPdfLine}</p>
<div style="border-left:3px solid ${ACCENT};background:${TINT};padding:18px 22px">
<p style="font-size:15.5px;line-height:1.75;color:#5a4141;margin:0;max-width:74ch">The literature baseline underlying these certification limits is maintained independently at the <a href="https://heavymetalindex.com" style="color:${LINK}">Heavy Metal Index</a>. This certification standard applies those findings; the two are kept editorially separate by design.</p>
</div>
</section>`
}

// ── frontmatter (drives HeroBand + Rail + Snav) ───────────────────────────────
// The canonical manual frontmatter contract. Every field here maps to a v3
// component: description→hero dek, snapshot→hero card, author/orcid→hero byline,
// hero_action + pdf→download (hero link + rail card), connections→rail, rail_box
// →rail "Document versions" box, type:manual→"Program manual" badge.
export function renderManualFrontmatter({
  title,
  category,
  categoryName,
  description,
  snapshot = [],
  connections = [],
  author = "Karen Pendergrass",
  orcid = "0000-0002-2348-7259",
  pdfHref = null,
  pdfLabel = "Download PDF",
  railBody,
  effectiveDate = "2026",
  updated,
  certDoi = null,
  manualSlug = null,
  reportNumber = null,
}) {
  // Google Scholar indexes these pages as technical reports
  // (citation_technical_report_institution), and a technical report needs a
  // document identifier or the record is malformed. The number is stable across
  // editions (the edition date is carried by citation_publication_date) and
  // mirrors the DOI-manifest suffix scheme (hmtc.std.<cat>.<slug>).
  const reportNo =
    reportNumber ?? (manualSlug ? `hmtc.manual.${category}.${manualSlug}` : `hmtc.manual.${category}`)
  const lines = [
    "---",
    `title: ${yq(title)}`,
    // type:standard → HeroBand KIND badge "Standard" (matches the approved canvas
    // isManual chip) with zero side-effects; there is no `manual` KIND key and no
    // generator keys off a manual-specific type. The breadcrumb section comes from
    // the /manuals/ slug, not `type`.
    "type: standard",
    "custom_page: true",
    `category: ${category}`,
    `breadcrumb_leaf: ${yq(categoryName)}`,
    `description: ${yq(description)}`,
    "scholar_eligible: true",
    `cert_doi: ${certDoi == null ? "null" : yq(certDoi)}`,
    `effective_date: ${yq(effectiveDate)}`,
    `report_number: ${yq(reportNo)}`,
    ...(updated ? [`updated: ${yq(updated)}`] : []),
    `author: ${yq(author)}`,
    `orcid: ${yq(orcid)}`,
    "audience: [regulator, brand-legal, retailer-compliance, certifier]",
  ]
  if (pdfHref) {
    lines.push(`pdf: ${yq(pdfHref)}`)
    lines.push(`hero_action: { label: ${yq(pdfLabel)}, href: ${yq(pdfHref)} }`)
  }
  if (snapshot.length) {
    lines.push("snapshot:")
    for (const r of snapshot) lines.push(`  - { k: ${yq(r.k)}, v: ${yq(r.v)} }`)
  }
  if (connections.length) {
    lines.push("connections:")
    for (const c of connections) lines.push(`  - { label: ${yq(c.label)}, href: ${yq(c.href)} }`)
  }
  // rail_box carries NO cta: the PDF download is the rail PdfCard (from `pdf:`),
  // the site's single canonical download home, so a second rail button would be
  // redundant and would risk the gate's aside.rail a[download] == 1 assertion.
  lines.push("rail_box:")
  lines.push('  title: "Document versions"')
  lines.push(`  body: ${yq(railBody)}`)
  lines.push("---")
  return lines.join("\n")
}

// ── the whole page ────────────────────────────────────────────────────────────
// data: everything the frontmatter helper needs, PLUS the body inputs:
//   methodNoteHtml, scopeLeadHtml?, matrix{analytes,rows,tier1Labels,tier2Labels,note?},
//   struggleHtml (from tools/lib/struggle-section.mjs, id="hard"), editionPdfLine.
export function renderManualPage(data) {
  const fm = renderManualFrontmatter(data)
  const body = [
    renderScope({ methodNoteHtml: data.methodNoteHtml, scopeLeadHtml: data.scopeLeadHtml }),
    renderMatrix(data.matrix),
    data.struggleHtml || "",
    renderEdition({ editionPdfLine: data.editionPdfLine }),
  ].join("\n\n")
  return `${fm}\n\n${body}\n`
}
