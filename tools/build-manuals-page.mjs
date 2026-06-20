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

const published = []
const pending = []
for (const m of manifest.manuals) {
  const pdfPath = path.join(PDF_DIR, m.pdf)
  const live = m.status === "published" && fs.existsSync(pdfPath)
  if (m.status === "published" && !fs.existsSync(pdfPath)) {
    console.warn(`  WARNING: ${m.slug} is status:published but PDF missing at ${m.pdf} — listing as pending.`)
  }
  if (live) published.push(m)
  else pending.push(m)
}

// Copy published PDFs into the served static dir + write a landing page each.
if (published.length) fs.mkdirSync(STATIC_DIR, { recursive: true })
for (const m of published) {
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

// The manuals index.
const idx = [
  "---",
  'title: "Program Manuals"',
  "type: manuals-index",
  "audience: [regulator, brand-legal, retailer-compliance, certifier]",
  "---",
  "",
  "# Program Manuals",
  "",
  "Each category's Heavy Metal Tested & Certified standard is published as a citable, versioned program manual — the full standard plus the methodology and evidence-state notes — and is downloadable as a PDF. Manuals publish per category as each becomes defensibly ready; the live per-subcategory limits are always available in the [Standards index](../standards/).",
  "",
]
if (published.length) {
  idx.push("## Published editions", "")
  for (const m of published) {
    idx.push(`- [${m.title} (${m.edition})](${m.slug}) — [PDF](/static/manuals/${m.pdf})`)
  }
  idx.push("")
}
if (pending.length) {
  idx.push("## In preparation", "")
  idx.push(
    "These manuals are being brought to the current standard before publication (a manual is not published until every value in it is defensibly current):",
    "",
  )
  for (const m of pending) {
    idx.push(`- **${m.title}** — in preparation.`)
  }
  idx.push("")
}
fs.writeFileSync(path.join(OUT_DIR, "index.md"), idx.join("\n"), "utf8")

console.log(
  `build-manuals-page: ${published.length} published (downloadable), ${pending.length} pending_refresh (listed as in preparation).`,
)
