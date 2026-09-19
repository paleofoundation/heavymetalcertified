#!/usr/bin/env node
// Emit a marker-bounded "Version history" section on standards pages, rendered from the DOCUMENT
// version records at data/standards/version-history/<slug>.json — the dated editions of the standard
// (v1.0, v2.0, v3.0 …), each with what changed and a permalink/PDF.
//
// This is where heavymetalcertified.com deliberately DIFFERS from heavymetalindex.com. The index
// shows a git-derived page-history changelog (every substantive edit, by commit). A certification
// standard is a versioned legal-facing document: what a regulator or brand needs is the edition
// history — which version was in force on which date and what it required — not the editorial commit
// trail. So this replaces the ported page-history footer with a document-version history, and strips
// the old git-derived block wherever it still sits (standards, regulations, manuals).

import fs from "node:fs"
import path from "node:path"

const repoRoot = process.cwd()
const VH_DIR = path.join(repoRoot, "data/standards/version-history")
const TARGETS = ["content/standards", "content/regulations", "content/manuals"]

const OLD_BEGIN = "<!-- BEGIN: hmtc-page-history -->"
const OLD_END = "<!-- END: hmtc-page-history -->"
const BEGIN = "<!-- BEGIN: hmtc-version-history -->"
const END = "<!-- END: hmtc-version-history -->"
const esc = (s) => String(s).replace(/\|/g, "\\|")
const rx = (a, b) => new RegExp(`\\n*${a.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\s\\S]*?${b.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\n*`, "g")

function versionBlock(rec) {
  const noun = rec.document_noun || "standard"
  // A DOI column appears only when at least one edition carries a DOI (real or
  // pending) — so the 9 standard pages (records without DOIs) render unchanged,
  // and the manual (records with two real Zenodo DOIs + one pending) gets it.
  const hasDoi = rec.versions.some((v) => v.doi || v.doi_pending)
  const head = hasDoi
    ? "| Version | Date | Status | DOI | What changed |\n| --- | --- | --- | --- | --- |"
    : "| Version | Date | Status | What changed |\n| --- | --- | --- | --- |"
  const rows = rec.versions
    .map((v) => {
      // `label` overrides the default `v<version>` (the manual uses edition
      // labels, not "v1.0"); a `pdf` still links the label when one is served.
      const base = v.label || `v${v.version}`
      const label = v.pdf ? `[${base}](${v.pdf})` : base
      const status = v.status === "current" ? "**current**" : v.status || "superseded"
      const doiCell = v.doi ? `[${v.doi}](https://doi.org/${v.doi})` : v.doi_pending || "-"
      return hasDoi
        ? `| ${label} | ${v.date} | ${status} | ${doiCell} | ${esc(v.summary || "")} |`
        : `| ${label} | ${v.date} | ${status} | ${esc(v.summary || "")} |`
    })
    .join("\n")
  const conceptNote = rec.concept_doi_note
    ? `\n\n${rec.concept_doi_note}`
    : rec.concept_doi
    ? `\n\nThe concept DOI [${rec.concept_doi}](https://doi.org/${rec.concept_doi}) always resolves to the latest deposited edition.`
    : ""
  return `${BEGIN}
## Version history

The dated editions of this ${noun}. Each is kept at a stable permalink, so a regulator or brand can reconstruct exactly what the ${noun} required on any date: the edition record, not an editorial commit trail. Version-pinned DOIs link here once each edition is deposited.

${head}
${rows}${conceptNote}
${END}`
}

let added = 0
let stripped = 0
for (const dir of TARGETS) {
  const abs = path.join(repoRoot, dir)
  if (!fs.existsSync(abs)) continue
  for (const f of fs.readdirSync(abs)) {
    if (!f.endsWith(".md") || f === "index.md") continue
    const absF = path.join(abs, f)
    let raw = fs.readFileSync(absF, "utf8")
    const before = raw
    // Remove the deprecated git-derived page-history block and any prior version block (idempotent).
    if (rx(OLD_BEGIN, OLD_END).test(raw)) { raw = raw.replace(rx(OLD_BEGIN, OLD_END), "\n"); stripped++ }
    raw = raw.replace(rx(BEGIN, END), "\n")

    // Standards with a version record get the edition history appended.
    const slug = f.replace(/\.md$/, "")
    const recPath = path.join(VH_DIR, `${slug}.json`)
    // Any target file with a matching version record gets the edition history —
    // the 9 standards plus the Program Manual (content/manuals/infant-and-child-foods.md).
    if (fs.existsSync(recPath)) {
      const rec = JSON.parse(fs.readFileSync(recPath, "utf8"))
      raw = `${raw.replace(/\n+$/, "")}\n\n${versionBlock(rec)}\n`
      added++
    }
    if (raw !== before) fs.writeFileSync(absF, raw, "utf8")
  }
}
console.log(`build-cert-version-history: ${added} version-history section(s); stripped ${stripped} deprecated page-history block(s)`)
