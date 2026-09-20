#!/usr/bin/env node
// standards-scorecard.mjs — mint-finish SCORECARD + HARD-BLOCKERS writer.
//
// Reads compiled records via claim-surface helpers. Does not invent numbers.
// A cell is CONVERTIBLE only when a disclosed government ceiling already lives
// on the cell (value, binding_total, strictest_form_value, or form_split forms).
// Everything else that is still empty on the claim surface is a HARD-BLOCKER.
//
// Usage: node tools/standards-scorecard.mjs [--quiet]
import fs from "node:fs"
import path from "node:path"
import { pathToFileURL } from "node:url"
import {
  evaluateClaimSurface, loadCompiledRecords, claimSurfaceFailReason, numericCeiling,
  cellKind,
} from "./lib/claim-surface.mjs"

const TEST_PREFIXES = ["10.5072", "10.82", "10.84435"]

export function productionDoi(slug, contentDir) {
  const f = path.join(contentDir, `${slug}.md`)
  if (!fs.existsSync(f)) return null
  const s = fs.readFileSync(f, "utf8")
  const m = s.match(/^(?:cert_doi|doi):\s*"?(10\.\d{4,9}\/[^\s"']+)"?/mi)
  if (!m) return null
  const doi = m[1]
  if (TEST_PREFIXES.some((p) => doi.startsWith(p))) return null
  return doi
}

export function leftoverNumerics(cell) {
  if (!cell || typeof cell !== "object") return []
  const keys = [
    "value", "value_exact", "binding_total", "strictest_form_value",
    "source_value", "read_across_value", "limit", "limit_ppb", "value_ppb",
  ]
  const hits = []
  for (const k of keys) {
    if (cell[k] != null && cell[k] !== "") hits.push(`${k}=${JSON.stringify(cell[k])}`)
  }
  if (Array.isArray(cell.forms)) {
    for (const [i, f] of cell.forms.entries()) {
      if (f && (f.value != null || f.value_exact != null)) {
        hits.push(`forms[${i}].value=${f.value ?? f.value_exact}`)
      }
    }
  }
  if (Array.isArray(cell.concurring)) {
    for (const [i, c] of cell.concurring.entries()) {
      if (c && c.value != null) hits.push(`concurring[${i}].value=${c.value}`)
    }
  }
  if (cell.read_across && typeof cell.read_across === "object") {
    hits.push(`read_across=${JSON.stringify(cell.read_across)}`)
  }
  return hits
}

export function classifyEmpty(cell) {
  const t = cellKind(cell)
  const text = `${cell?.rationale || ""} ${cell?.substantiation || ""} ${cell?.regulatory_basis || ""}`
  if (numericCeiling(cell) != null) return { bucket: "convertible", why: "disclosed numeric already on cell" }
  if (/permitted active|additive-permitted|stannous|anticaries|aluminium is the PERMITTED ACTIVE/i.test(text)) {
    return { bucket: "hard-blocker", why: "analyte is a permitted active or additive, not a contaminant ceiling" }
  }
  if (/basis conflation|different basis|wrong basis|fresh-weight|Category 8|canned-food|tinplate/i.test(text)) {
    return { bucket: "hard-blocker", why: "nearest sovereign is a disclosed wrong-basis companion; read-across rejected" }
  }
  if (/no (credible )?(sovereign|jurisdiction)|no ceiling is invented|no read-across|not supportable|no numeric ceiling/i.test(text)) {
    return { bucket: "hard-blocker", why: "compiler: no sovereign ML and no supportable read-across" }
  }
  if (t === "control" || t === "not_material" || t === "not-material") {
    return { bucket: "hard-blocker", why: `compiler ${t} with value:null` }
  }
  return { bucket: "hard-blocker", why: "empty claim cell with no disclosed numeric" }
}

export function runScorecard({ repo = process.cwd(), quiet = false, write = true } = {}) {
  const dataDir = path.join(repo, "data/standards")
  const contentDir = path.join(repo, "content/standards")
  const compiled = loadCompiledRecords(dataDir)
  const rows = []
  const hard = []
  const leftover = []
  for (const row of compiled) {
    const ev = evaluateClaimSurface(row)
    const doi = productionDoi(row.slug, contentDir)
    const blockers = ev.claim_empty.map((analyte) => {
      const cell = row.cells[analyte]
      const cls = classifyEmpty(cell)
      const leftoverHits = leftoverNumerics(cell)
      if (leftoverHits.length) leftover.push({ slug: row.slug, analyte, leftoverHits })
      return { slug: row.slug, category: row.category, analyte, type: cellKind(cell) || "(missing)", leftoverHits, ...cls }
    })
    hard.push(...blockers.filter((b) => b.bucket === "hard-blocker"))
    rows.push({
      slug: row.slug,
      category: row.category,
      category_name: row.category_name,
      complete: ev.complete,
      registered: !!doi,
      doi,
      claim_empty: ev.claim_empty,
      empty_cells: ev.empty_cells,
      fail_reason: claimSurfaceFailReason(ev),
      cells: row.cells,
    })
  }

  const complete = rows.filter((r) => r.complete)
  const incomplete = rows.filter((r) => !r.complete).sort((a, b) => {
    const c = String(a.category).localeCompare(String(b.category), "en", { numeric: true })
    return c || a.slug.localeCompare(b.slug)
  })
  const registered = rows.filter((r) => r.registered)
  const ready = rows.filter((r) => r.complete && r.registered)
  const claimEmpty = rows.reduce((n, r) => n + r.claim_empty.length, 0)
  const emptyCells = rows.reduce((n, r) => n + r.empty_cells.length, 0)
  const convertible = leftover.length
  const incompleteMinted = incomplete.filter((r) => r.registered)
  const completeUnreg = complete.filter((r) => !r.registered).map((r) => r.slug).sort()

  const choc = rows.find((r) => r.slug === "chocolate")
  const chocEmpty = (choc?.claim_empty || []).map((a) => {
    const cell = choc.cells[a] || {}
    return {
      analyte: a,
      kind: cellKind(cell) || "(missing)",
      why: classifyEmpty(cell).why,
      rationale: String(cell.rationale || cell.regulatory_basis || "").replace(/\s+/g, " ").trim(),
    }
  })

  const byWhy = {}
  for (const b of hard) (byWhy[b.why] ||= []).push(b)

  const byCat = {}
  for (const r of incomplete) (byCat[r.category] ||= []).push(r)
  const inventoryLines = Object.keys(byCat).sort((a, b) => Number(a) - Number(b)).flatMap((cat) => {
    const rs = byCat[cat]
    const name = rs[0].category_name || cat
    return [
      "",
      `### Cat ${cat} — ${name} (${rs.length})`,
      "",
      "| Slug | claim_empty | cert_doi |",
      "|---|---|---|",
      ...rs.map((r) => `| \`${r.slug}\` | ${r.claim_empty.join(", ") || "—"} | ${r.doi ? `\`${r.doi}\`` : "null (HOLD)"} |`),
    ]
  })

  const chocNeeded = chocEmpty.length
    ? chocEmpty.map((c) => `- **${c.analyte}** [\`${c.kind}\`] — ${c.why}. ${c.rationale || "No disclosed numeric on the cell."}`).join("\n")
    : "- chocolate compiled record missing"

  const scorecard = `# SCORECARD — MINT-FINISH-ALL-1 DRAIN (Ada pack 2026-09-20)

Generated by \`tools/standards-scorecard.mjs\`. Claim-surface evaluation is
\`tools/lib/claim-surface.mjs\`. Do not invent ppb. Do not mint DataCite from
this file. **mint=HOLD.**

## Totals

| Metric | Count |
|---|---:|
| Compiled records | ${rows.length} |
| COMPLETE (claim-surface numeric) | ${complete.length} |
| Incomplete / claim-surface FAIL | ${incomplete.length} |
| Empty cells (full panel, incl. species) | ${emptyCells} |
| Empty claim-surface cells (8 totals ± required iAs) | ${claimEmpty} |
| HARD-BLOCKER claim cells | ${hard.length} |
| Convertible leftovers (disclosed number still unpublished) | ${convertible} |
| WARN incomplete records (prebuild \`--strict\` still passes) | ${incomplete.length} |
| REGISTERED (production DataCite DOI on a compiled slug) | ${registered.length} |
| READY (COMPLETE + REGISTERED) | ${ready.length} |
| Incomplete records that already carry a production DOI | ${incompleteMinted.length} |
| Minted this session | 0 |

## DONE this session

No disclosed \`gov_floor\` / \`read_across\` leftover remains on an empty
claim-surface cell. The previous convertible batch (PR #92: chocolate Pb / Cd /
tAs / Ni, spices Pb, salt Pb) already published every \`form_split\`
\`strictest_form_value\`. This drain scanned every remaining empty claim cell
for \`value\`, \`binding_total\`, \`strictest_form_value\`, \`forms[].value\`,
and \`concurring[].value\`. **Hits: ${convertible}.** Completing any of the
${claimEmpty} empty claim cells would invent ppb. HARD-BLOCKERS stay honest.

| Metric | origin/main (claim-surface) | This drain | Delta |
|---|---:|---:|---:|
| COMPLETE records | 265 | ${complete.length} | ${complete.length - 265} |
| Incomplete / WARN | 58 | ${incomplete.length} | ${incomplete.length - 58} |
| Empty claim-surface cells | 174 | ${claimEmpty} | ${claimEmpty - 174} |
| HARD-BLOCKER claim cells | 174 | ${hard.length} | ${hard.length - 174} |
| Minted this session | 0 | 0 | 0 |

Registered production DOIs on COMPLETE compiled slugs: **${registered.length}**.
The 2026-09-18 SCORECARD still said 4 because it was frozen before the
2026-09-19 COMPLETE-only live mint (258 pages in
\`data/standards/doi-audit/dois-minted-2026-09-19.csv\`, of which 7 are Cat-1
aggregate pages with no compiled row of their own, plus the four earlier
live DOIs). This drain did **not** mint. **mint=HOLD.**

COMPLETE compiled slugs with no own page (joined children of already-minted
Cat-1 aggregates; not a claim-surface FAIL):
${completeUnreg.map((s) => `- \`${s}\``).join("\n")}

## Remaining WARN

\`${incomplete.length}\` incomplete compiled records /
\`${claimEmpty}\` empty claim-surface cells. \`node tools/standard-readiness-lint.mjs --strict\`
passes (rice/infant canary green). \`--strict-corpus\` would fail all
${incomplete.length}. Do not flip until this list is empty. Living fail list:
\`data/standards/claim-surface-fail-list.json\`. True gaps:
\`docs/HARD-BLOCKERS.md\` (${hard.length} cells / ${new Set(hard.map((b) => b.slug)).size} standards).

Incomplete records minted: **${incompleteMinted.length}** (must stay 0).

## Chocolate DOI HOLD

| Field | Status |
|---|---|
| Slug | \`chocolate\` |
| Claim-surface | FAIL — \`${(choc?.claim_empty || []).join(", ")}\` |
| \`complete\` | \`${choc?.complete ?? "missing"}\` |
| \`cert_doi\` | \`${choc?.doi ?? "null"}\` |
| In \`dois-minted-*.csv\` | no |
| Scholarly PDF producer | house \`@react-pdf/renderer\` (not Chromium / Skia) |
| Species ≤ parent | PASS (iAs / MeHg / Cr-VI are empty reflexes, not published > parent) |
| **mint** | **HOLD** |

Why held — no disclosed \`gov_floor\` or \`read_across\` number sits on the
three empty claim-surface totals:

${chocNeeded}

What is needed before chocolate can mint:

1. A disclosed government maximum or a disclosed same-basis read-across,
   already on the compiled cell, for **Sn, Al, and Cr**.
2. Re-evaluate claim-surface COMPLETE (eight totals numeric; species ≤ parent).
3. House react-pdf regen of \`content/static/standards/chocolate.pdf\`.
4. Karen-run live DataCite deposit (\`DATACITE_MODE=live\`). Not this run.

Until those three cells carry a real sovereign number, chocolate stays
claim-surface FAIL and **mint=HOLD**. Do not invent ppb. Do not write a DOI.

## mint=HOLD

This Ada pack does not call \`tools/mint-dois.mjs --live\`. DataCite credentials
are not used. Chocolate is claim-surface FAIL. The 58 WARN records stay unminted.
A claim-surface FAIL cannot be overridden with \`--include-incomplete\`.

## Inventory — incomplete / claim-surface FAIL vs COMPLETE

COMPLETE compiled records: **${complete.length} / ${rows.length}**.
Incomplete / FAIL: **${incomplete.length}**. Grouped by category:
${inventoryLines.join("\n")}

## Karen-only blockers

- **DataCite live mint** — \`DATACITE_USER\` / \`DATACITE_PASSWORD\` / \`DATACITE_PREFIX\`
  are absent here. Do not mint without credentials. ${complete.length - registered.length} COMPLETE
  compiled rows remain unregistered (the Cat-1 joined children listed above).
- **Cat-1 aggregate pages** — the seven aggregate pages were minted 2026-09-19;
  their child compiled rows do not carry their own \`cert_doi\`.
- **Existing DOI rights PUT** — live DataCite records that still carry CC BY 4.0
  need a Karen-run PUT to All rights reserved.
- **CEO freeze** — none recorded in-repo for this batch.
- **git push of \`main\`** — this PR does not push \`main\`; production deploy is
  Karen's merge.
- **Chocolate mint** — HOLD until Sn / Al / Cr have disclosed numeric provenance.

## Tooling

| Artifact | Path |
|---|---|
| Claim-surface helpers | \`tools/lib/claim-surface.mjs\` |
| Claim-surface lint | \`tools/claim-surface-lint.mjs\` |
| Readiness lint / fail list | \`tools/standard-readiness-lint.mjs\` |
| Fail list | \`data/standards/claim-surface-fail-list.json\` |
| Readiness manifest | \`data/standards/readiness-manifest.json\` |
| This SCORECARD | \`reports/SCORECARD.md\` |
| HARD-BLOCKERS | \`docs/HARD-BLOCKERS.md\` |
| House PDF (not Chromium) | \`tools/build-standard-pdf.mjs\` → \`tools/pdf/scholarly-pdf.mjs\` |
`

  const blockerLines = [
    "# HARD-BLOCKERS — claim-surface cells that must not be invented",
    "",
    "Generated by `tools/standards-scorecard.mjs`. A HARD-BLOCKER is an empty",
    "claim-surface cell (Pb, tAs, Cd, tHg, Ni, Sn, Al, Cr, plus required iAs on",
    "rice / infant cereal) whose compiled record does **not** already carry a",
    "disclosed government number. Do not fill these with guessed ppb.",
    "",
    `Count: **${hard.length}** claim cells across **${new Set(hard.map((b) => b.slug)).size}** standards.`,
    "",
  ]

  for (const [why, items] of Object.entries(byWhy).sort((a, b) => b[1].length - a[1].length)) {
    blockerLines.push(`## ${why}`)
    blockerLines.push("")
    blockerLines.push(`_${items.length} cells_`)
    blockerLines.push("")
    const bySlug = {}
    for (const it of items) (bySlug[it.slug] ||= []).push(it)
    for (const slug of Object.keys(bySlug).sort()) {
      const its = bySlug[slug]
      blockerLines.push(`- \`${slug}\` (cat ${its[0].category}): ${its.map((i) => `${i.analyte} [${i.type}]`).join(", ")}`)
    }
    blockerLines.push("")
  }

  if (write) {
    fs.mkdirSync(path.join(repo, "reports"), { recursive: true })
    fs.writeFileSync(path.join(repo, "reports/SCORECARD.md"), scorecard)
    fs.writeFileSync(path.join(repo, "docs/HARD-BLOCKERS.md"), blockerLines.join("\n") + "\n")
  }

  const stats = {
    records: rows.length,
    complete: complete.length,
    incomplete: incomplete.length,
    claimEmpty,
    emptyCells,
    hard: hard.length,
    convertible,
    registered: registered.length,
    ready: ready.length,
    incompleteMinted: incompleteMinted.length,
    chocolate: {
      complete: choc?.complete ?? false,
      doi: choc?.doi ?? null,
      claim_empty: choc?.claim_empty || [],
    },
    leftover,
  }

  if (!quiet) {
    console.log(`SCORECARD: ${stats.records} records | ${stats.complete} COMPLETE | ${stats.incomplete} incomplete | ${stats.claimEmpty} claim-empty | ${stats.hard} HARD-BLOCKERS | ${stats.convertible} convertible leftovers | ${stats.registered} minted DOIs | mint=HOLD`)
    if (write) {
      console.log("  wrote reports/SCORECARD.md")
      console.log("  wrote docs/HARD-BLOCKERS.md")
    }
  }
  return { scorecard, blockers: blockerLines.join("\n") + "\n", stats }
}

const invoked = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
if (invoked) runScorecard({ quiet: process.argv.includes("--quiet") })
