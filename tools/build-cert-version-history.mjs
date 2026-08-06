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
  const rows = rec.versions
    .map((v) => {
      const label = v.pdf ? `[v${v.version}](${v.pdf})` : `v${v.version}`
      const status = v.status === "current" ? "**current**" : v.status || "superseded"
      return `| ${label} | ${v.date} | ${status} | ${esc(v.summary || "")} |`
    })
    .join("\n")
  return `${BEGIN}
## Version history

The dated editions of this standard. Each is kept at a stable permalink, so a regulator or brand can reconstruct exactly what the standard required on any date — the edition record, not an editorial commit trail. Version-pinned DOIs link here once each edition is deposited.

| Version | Date | Status | What changed |
| --- | --- | --- | --- |
${rows}
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
    if (dir === "content/standards" && fs.existsSync(recPath)) {
      const rec = JSON.parse(fs.readFileSync(recPath, "utf8"))
      raw = `${raw.replace(/\n+$/, "")}\n\n${versionBlock(rec)}\n`
      added++
    }
    if (raw !== before) fs.writeFileSync(absF, raw, "utf8")
  }
}
console.log(`build-cert-version-history: ${added} version-history section(s); stripped ${stripped} deprecated page-history block(s)`)
