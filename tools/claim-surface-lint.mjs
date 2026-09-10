#!/usr/bin/env node
// claim-surface-lint.mjs — fail-closed gate on claim-surface LIMIT cells.
//
// ORDER S-DOI-FORCE-1 / PANEL-CLAIM-1. Wired into prebuild. A blank, monitored,
// subsumed, n/a, or dashed LIMIT cell on a claim-surface analyte must not ship.
// Reflex speciation governs lab assay timing only — it does not blank a claim.
//
// Fail-closed (exit 1):
//   1. Rice / infant-cereal canary (*rice* except *non-rice*, baby-cereal rice
//      variants, baby-cereals-dry): claim-surface LIMIT tokens, missing numeric
//      iAs (compiled + rendered), incomplete N-of-M headers.
//   2. Sitewide headers matching "7/8" or "N/M analytes with a published limit"
//      where N < the required claim-surface panel (8 totals; 9 on rice).
//   3. Pages that claim full completeness ("Every analyte carries a firm
//      ceiling" / N/N) while a claim-surface LIMIT cell is banned.
//
// The rest of the corpus is written to data/standards/claim-surface-fail-list.json
// as the WARN→STRICT backlog (never classified COMPLETE). Destination is
// --strict-corpus on this lint.
//
// Usage: node tools/claim-surface-lint.mjs [--strict-corpus] [--quiet]

import fs from "node:fs"
import path from "node:path"
import {
  evaluateClaimSurface, loadCompiledRecords, isRiceInfantCereal, isRiceCerealCanary,
  isBannedLimitText, classifyPanelHeader, parseMasterLimitRows, requiredPanelSize,
  requiredClaimSurface, isTotalsOnlySlug, speciesParentViolations, CLAIM_TOTALS,
} from "./lib/claim-surface.mjs"

const REPO = process.cwd()
const DATA = path.join(REPO, "data/standards")
const CONTENT = path.join(REPO, "content/standards")
const args = new Set(process.argv.slice(2))
const STRICT_CORPUS = args.has("--strict-corpus")
const QUIET = args.has("--quiet")

const fail = []
const warn = []

function add(list, msg) { list.push(msg) }

function requiredForPage(slug, cells) {
  return new Set(requiredClaimSurface(slug, cells || {}, slug))
}

const compiled = loadCompiledRecords(DATA)
const bySlug = new Map(compiled.map((r) => [r.slug, r]))

for (const row of compiled) {
  const ev = evaluateClaimSurface(row)
  if (ev.rice && ev.rice_missing_ias) {
    add(fail, `compiled ${row.slug}: rice/infant cereal missing numeric iAs`)
  }
  if (isRiceCerealCanary(row.slug) && ev.claim_empty.length) {
    add(fail, `compiled ${row.slug}: claim-surface empty ${ev.claim_empty.join(", ")}`)
  }
  const caps = speciesParentViolations(row.cells)
  if (caps.length) {
    add(fail, `compiled ${row.slug}: species>parent ${caps.map((h) => `${h.species}=${h.species_value} > ${h.parent}=${h.parent_value}`).join("; ")}`)
  }
  if (isTotalsOnlySlug(row.slug) && ev.claim_empty.length) {
    add(fail, `compiled ${row.slug}: totals-only claim-surface empty ${ev.claim_empty.join(", ")}`)
  }
}

if (fs.existsSync(CONTENT)) {
  for (const f of fs.readdirSync(CONTENT).filter((x) => x.endsWith(".md") && x !== "index.md" && !x.startsWith("_"))) {
    const slug = f.replace(/\.md$/, "")
    const raw = fs.readFileSync(path.join(CONTENT, f), "utf8")
    const start = raw.indexOf('id="limits"')
    if (start < 0) continue
    const { header, rows } = parseMasterLimitRows(raw)
    const rec = bySlug.get(slug)
    const rice = isRiceCerealCanary(slug) || [...bySlug.values()].some((r) => r.slug.startsWith(slug) && isRiceCerealCanary(r.slug))
    const riceIas = isRiceInfantCereal(slug) || [...bySlug.values()].some((r) => r.slug.startsWith(slug) && isRiceInfantCereal(r.slug))
    const totalsOnly = isTotalsOnlySlug(slug)
    const cells = rec?.cells || {}
    const required = requiredForPage(slug, cells)
    const need = requiredPanelSize(slug, rec?.name)
    const claimsFull = /Every analyte carries a firm ceiling/i.test(raw)
    const caps = speciesParentViolations(cells)
    if (caps.length) {
      add(fail, `${slug}: species>parent ${caps.map((h) => `${h.species}=${h.species_value} > ${h.parent}=${h.parent_value}`).join("; ")}`)
    }

    for (const h of classifyPanelHeader(header, { slug, name: rec?.name, required: need })) {
      const msg = `${slug}: header "${h.text}" (${h.n}/${h.m} < required ${h.required} claim-surface)`
      if (h.kind === "fail" || rice || STRICT_CORPUS) add(fail, msg)
      else add(warn, msg)
    }

    for (const row of rows) {
      const banned = isBannedLimitText(row.limit)
      if (!banned) continue
      const onClaim = required.has(row.key) || (rice && row.key === "iAs") || (totalsOnly && (required.has(row.key) || row.key === "iAs" || row.key === "MeHg"))
      if (!onClaim) continue
      const msg = `${slug}: LIMIT ${row.key}="${row.limit}" (${banned})`
      if (rice || totalsOnly || claimsFull || STRICT_CORPUS || banned === "monitored" || (banned === "subsumed" && rice)) {
        add(fail, msg)
      } else {
        add(warn, msg)
      }
    }

    if (totalsOnly) {
      for (const key of CLAIM_TOTALS) {
        const tr = rows.find((r) => r.key === key)
        if (!tr) add(fail, `${slug}: totals-only Master Limit Table missing ${key}`)
        else if (isBannedLimitText(tr.limit) || !/\d/.test(tr.limit)) {
          add(fail, `${slug}: totals-only ${key} LIMIT is not numeric ("${tr.limit}")`)
        }
      }
      for (const sp of ["iAs", "MeHg"]) {
        const tr = rows.find((r) => r.key === sp)
        if (!tr) continue
        if (isBannedLimitText(tr.limit) || !/\d/.test(tr.limit)) {
          add(fail, `${slug}: totals-only ${sp} on claim table is not numeric ("${tr.limit}") — omit or publish ≤ parent`)
        }
      }
    }

    if (riceIas) {
      const iAsRow = rows.find((r) => r.key === "iAs")
      if (!iAsRow) add(fail, `${slug}: rice/infant cereal Master Limit Table missing iAs row`)
      else if (isBannedLimitText(iAsRow.limit) || !/\d/.test(iAsRow.limit)) {
        add(fail, `${slug}: rice/infant cereal iAs LIMIT is not numeric ("${iAsRow.limit}")`)
      }
    }
  }
}

const unique = (arr) => [...new Set(arr)]
const fails = unique(fail)
const warns = unique(warn)

if (!QUIET) {
  console.log(`claim-surface-lint: ${fails.length} FAIL | ${warns.length} WARN (backlog) | compiled ${compiled.length}`)
  if (warns.length && !STRICT_CORPUS) {
    console.log(`\n  WARN (WARN→STRICT backlog — see data/standards/claim-surface-fail-list.json):`)
    for (const w of warns.slice(0, 40)) console.log(`    · ${w}`)
    if (warns.length > 40) console.log(`    … ${warns.length - 40} more`)
  }
}

if (fails.length) {
  console.error(`\nclaim-surface-lint: ${fails.length} FAIL-CLOSED:`)
  for (const x of fails) console.error(`  ✗ ${x}`)
  console.error(`\nBlank/monitored/subsumed claim cells cannot ship. Reflex speciation does not blank a LIMIT.`)
  console.error(`See docs/claim-surface-strict-rollout.md.`)
  process.exit(1)
}

console.log(`claim-surface-lint: OK — rice/infant canary + 7/8 headers + claims-full pages are numeric on the claim surface.`)
process.exit(0)
