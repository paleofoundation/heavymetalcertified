#!/usr/bin/env node
// Emit a marker-bounded "Update history" footer on standards, regulation, and
// manual pages, rendered from `git log --follow` for each file. Brand-legal and
// regulatory-affairs readers get the transparent change history — dates, change
// class, and what changed — in-page, without git access.
//
// Canonical pattern ported from heavymetalindex.com (tools/build-page-changelogs)
// with the HMTc palette (markdown tables inherit the site theme, so the colours
// come for free) and this repo's GitHub base. Marker-bounded and idempotent:
// re-runs replace the block, they never append. Regeneration/infra commits are
// skipped so the history reads as substantive edits only.
//
// This is the cert site, so certification-program vocabulary is native here — no
// firewall normalization is applied (the one-way firewall only guards the Index).

import fs from "node:fs"
import path from "node:path"
import { execSync } from "node:child_process"

const repoRoot = process.cwd()
const BEGIN = "<!-- BEGIN: hmtc-page-history -->"
const END = "<!-- END: hmtc-page-history -->"
const GITHUB = "https://github.com/paleofoundation/heavymetalcertified/commit"
const MAX = 6
const TARGETS = ["content/standards", "content/regulations", "content/manuals"]

const SKIP = /^(chore|build|ci|regen|regenerate|wip|merge)\b/i
function classify(subject) {
  if (/\b(fix|correct|corrected|corrects)\b/i.test(subject)) return "correction"
  if (/^feat\b|major|new standard|initial/i.test(subject)) return "major"
  return "minor"
}
// A reader-facing description: drop the conventional-commit prefix, take the first
// clause, tidy it. The linked commit stays authoritative for the full detail.
function describe(subject) {
  let s = subject.replace(/^[a-z]+(\([^)]*\))?:\s*/i, "")
  s = s.split(/[—-]{1,2}\s|;\s/)[0].trim()
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function historyFor(relPath) {
  let out
  try {
    out = execSync(
      `git log --follow --format="%h|%ad|%s" --date=short -- "${relPath}"`,
      { cwd: repoRoot, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 },
    )
  } catch {
    return []
  }
  const rows = []
  for (const line of out.split("\n")) {
    if (!line.trim()) continue
    const [sha, date, ...rest] = line.split("|")
    const subject = rest.join("|")
    if (SKIP.test(subject)) continue
    rows.push({ sha, date, type: classify(subject), description: describe(subject) })
    if (rows.length >= MAX) break
  }
  return rows
}

function block(rows) {
  if (!rows.length) {
    return `${BEGIN}\n## Update history\n\nThis page has no substantive edit history yet. Every future revision is recorded here, dated, and linked to its commit; the full record lives in [git](https://github.com/paleofoundation/heavymetalcertified).\n${END}`
  }
  const body = rows
    .map((e) => `| [${e.sha}](${GITHUB}/${e.sha}) | ${e.date} | ${e.type} | ${e.description.replace(/\|/g, "\\|")} |`)
    .join("\n")
  return `${BEGIN}
## Update history

The most recent substantive edits to this document, classified **major** (a limit, scope, or method changed), **correction** (a published value or statement was wrong and has been fixed), or **minor** (wording changed without moving the underlying evidence). Each is dated and linked to its commit — the authoritative record — so a regulator can reconstruct exactly what this standard required on any date. Version-pinned DOIs will link here once Zenodo minting lands.

| Commit | Date | Change | Description |
| --- | --- | --- | --- |
${body}
${END}`
}

const reMarker = new RegExp(`\\n*${BEGIN.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\s\\S]*?${END.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\n*$`)
let updated = 0
for (const dir of TARGETS) {
  const abs = path.join(repoRoot, dir)
  if (!fs.existsSync(abs)) continue
  for (const f of fs.readdirSync(abs)) {
    if (!f.endsWith(".md") || f === "index.md") continue
    const rel = `${dir}/${f}`
    const absF = path.join(repoRoot, rel)
    const raw = fs.readFileSync(absF, "utf8")
    if (!/^---\n[\s\S]*?\n---\n/.test(raw)) continue
    const b = block(historyFor(rel))
    const next = reMarker.test(raw) ? raw.replace(reMarker, `\n\n${b}\n`) : `${raw.replace(/\n+$/, "")}\n\n${b}\n`
    if (next !== raw) { fs.writeFileSync(absF, next, "utf8"); updated++ }
  }
}
console.log(`build-cert-page-history: updated ${updated} pages`)
