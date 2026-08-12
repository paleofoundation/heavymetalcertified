#!/usr/bin/env node

import fs from "node:fs"
import path from "node:path"

const REPO = process.cwd()
const STANDARDS_DIR = path.join(REPO, "content/standards")
const CONFIG_PATH = path.join(REPO, "data/standards/required-analytes.json")
const REPORT_PATH = path.join(REPO, "data/standards/standards-panel-audit.json")
const AUDIT_PAGE_PATH = path.join(STANDARDS_DIR, "completeness-audit.md")
const INDEX_PATH = path.join(STANDARDS_DIR, "index.md")
const FAIL_INCOMPLETE = process.argv.includes("--fail-incomplete")

const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"))
const required = config.required
const requiredKeys = required.map((item) => item.key)
const labelFor = new Map(required.map((item) => [item.key, `${item.label} (${item.key})`]))

const BEGIN = "<!-- BEGIN: HMTC:PANEL-AUDIT -->"
const END = "<!-- END: HMTC:PANEL-AUDIT -->"
const BLOCK_RE = new RegExp(`${BEGIN.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\s\\S]*?${END.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\n?`, "g")

function decodeHtml(value) {
  return String(value)
    .replace(/<sup\b[^>]*>[\s\S]*?<\/sup>/gi, "")
    .replace(/<br\s*\/?>/gi, " / ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&micro;|&#181;|&#xB5;/gi, "µ")
    .replace(/&mdash;|&#8212;|&#x2014;/gi, "—")
    .replace(/&ndash;|&#8211;|&#x2013;/gi, "–")
    .replace(/&times;/gi, "×")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, " ")
    .trim()
}

function esc(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function canonicalAnalyte(value) {
  const text = decodeHtml(value).toLowerCase().replace(/[−–—]/g, "-")
  const compact = text.replace(/\s+/g, "")
  if (/hexavalent|chromium\s*(?:\(?vi\)?|6)|cr[-\s]*\(?vi\)?|cr-?6/.test(text) || compact.includes("cr(vi)")) return "Cr-VI"
  if (/inorganic\s+arsenic|\bias\b/.test(text) || compact === "ias") return "iAs"
  if (/total\s+arsenic|\btas\b/.test(text) || compact === "tas" || compact === "arsenic(as)") return "tAs"
  if (/methylmercury|mehg/.test(text)) return "MeHg"
  if (/total\s+mercury|mercury.*\bt?hg\b|\bt?hg\b/.test(text) || compact === "hg") return "tHg"
  if (/lead|\bpb\b/.test(text) || compact === "pb") return "Pb"
  if (/cadmium|\bcd\b/.test(text) || compact === "cd") return "Cd"
  if (/nickel|\bni\b/.test(text) || compact === "ni") return "Ni"
  if (/\btin\b|\bsn\b/.test(text) || compact === "sn") return "Sn"
  if (/aluminium|aluminum|\bal\b/.test(text) || compact === "al") return "Al"
  if (/total\s+chromium|chromium|\bcr\b/.test(text) || compact === "cr") return "Cr"
  return null
}

function extractMasterRows(raw, file) {
  const section = raw.match(/<section\b[^>]*id=["']limits["'][^>]*>([\s\S]*?)<\/section>/i)?.[1]
  if (!section) throw new Error(`${file}: missing <section id="limits">`)
  const table = section.match(/<table\b[^>]*>([\s\S]*?)<\/table>/i)?.[1]
  if (!table) throw new Error(`${file}: limits section has no table`)
  const rows = [...table.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map((match) =>
    [...match[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((cell) => decodeHtml(cell[1])),
  )
  if (rows.length < 2) throw new Error(`${file}: Master Limit Table has no data rows`)
  const header = rows[0].map((cell) => cell.toLowerCase())
  let limitColumn = header.findIndex((cell) => cell.includes("hmtc") && cell.includes("limit"))
  if (limitColumn < 0) limitColumn = header.findIndex((cell) => cell === "limit" || cell.includes("maximum"))
  if (limitColumn < 0) limitColumn = 2
  return rows.slice(1).map((cells) => ({
    analyte_raw: cells[0] || "",
    analyte: canonicalAnalyte(cells[0] || ""),
    value: cells[limitColumn] || "",
    row_text: cells.join(" | "),
  }))
}

function numericValues(value) {
  const cleaned = String(value).replace(/,/g, "")
  if (/\bn\s*\/\s*m\b|not\s+material|monitored|pending|tbd|not\s+set/i.test(cleaned)) return []
  return [...cleaned.matchAll(/(?:^|[^A-Za-z])([0-9]+(?:\.[0-9]+)?)/g)].map((match) => Number(match[1]))
}

function auditStandard(raw, slug, filename) {
  const methodologyVersion = raw.match(/^methodology_version:\s*["']?([^\n"']+)/m)?.[1]?.trim() || "not declared"
  const rows = extractMasterRows(raw, filename)
  const byKey = new Map()
  const duplicates = []
  for (const row of rows) {
    if (!row.analyte) continue
    if (byKey.has(row.analyte)) duplicates.push(row.analyte)
    else byKey.set(row.analyte, row)
  }

  const missing = requiredKeys.filter((key) => !byKey.has(key))
  const nonNumeric = []
  const notMaterial = []
  const numeric = []
  const extremeValueReview = []

  for (const key of requiredKeys) {
    const row = byKey.get(key)
    if (!row) continue
    const values = numericValues(row.value)
    if (/\bn\s*\/\s*m\b|not\s+material/i.test(row.row_text)) notMaterial.push(key)
    if (!values.length) nonNumeric.push({ key, value: row.value || "blank" })
    else {
      numeric.push(key)
      const largest = Math.max(...values)
      if (largest >= 100000) extremeValueReview.push({ key, value: row.value, largest })
    }
  }

  const warnings = []
  if (notMaterial.length) warnings.push("not-material-is-incomplete")
  if (extremeValueReview.length) warnings.push("extreme-limit-review")
  if (duplicates.length) warnings.push("duplicate-analyte-row")

  const snapshot = raw.match(/k:\s*["']Analytes (?:limited|published)["'],\s*v:\s*["'](\d+)\s*\/\s*(\d+)["']/i)
  if (snapshot) {
    const shown = Number(snapshot[1])
    const denominator = Number(snapshot[2])
    if (denominator !== requiredKeys.length) warnings.push("legacy-panel-denominator")
    if (shown === denominator && numeric.length !== requiredKeys.length) {
      warnings.push("published-completeness-claim-conflicts-with-table")
    }
    if (shown !== numeric.length) warnings.push("published-count-does-not-match-required-panel")
  }
  if (/Every analyte carries a firm ceiling/i.test(raw) && numeric.length !== requiredKeys.length) {
    warnings.push("firm-ceiling-claim-conflicts-with-table")
  }

  const complete = numeric.length === requiredKeys.length && !missing.length && !nonNumeric.length && !duplicates.length
  return {
    slug,
    path: `/standards/${slug}`,
    source_file: `content/standards/${filename}`,
    methodology_version: methodologyVersion,
    complete,
    numeric_limits: numeric.length,
    required_limits: requiredKeys.length,
    numeric,
    missing,
    non_numeric: nonNumeric,
    not_material: notMaterial,
    duplicates: [...new Set(duplicates)],
    extreme_value_review: extremeValueReview,
    warnings: [...new Set(warnings)],
  }
}

function injectAfterFrontmatter(raw, block) {
  const cleaned = raw.replace(BLOCK_RE, "")
  const match = cleaned.match(/^---\n[\s\S]*?\n---\n/)
  if (!match) return `${block}\n${cleaned}`
  return `${match[0]}\n${block}\n${cleaned.slice(match[0].length).replace(/^\n+/, "")}`
}

function listLabels(keys) {
  return keys.length ? keys.map((key) => labelFor.get(key) || key).join(", ") : "none"
}

function warningLabel(code) {
  return ({
    "not-material-is-incomplete": "“not material” is incomplete",
    "extreme-limit-review": "published value requires a magnitude review",
    "duplicate-analyte-row": "duplicate analyte rows require a material/basis review",
    "legacy-panel-denominator": "snapshot uses a legacy panel denominator",
    "published-completeness-claim-conflicts-with-table": "published completeness claim conflicts with the table",
    "published-count-does-not-match-required-panel": "published analyte count does not match the required panel",
    "firm-ceiling-claim-conflicts-with-table": "firm-ceiling claim conflicts with the table",
  })[code] || code
}

function flagBlock(result) {
  const nonNumericKeys = result.non_numeric.map((item) => item.key)
  const sentences = [
    `This standard is incomplete against the required ten-analyte panel: ${result.numeric_limits} of ${result.required_limits} required numeric limits are published.`,
    result.missing.length ? `Missing rows: ${listLabels(result.missing)}.` : "",
    nonNumericKeys.length ? `Rows without numeric limits: ${listLabels(nonNumericKeys)}.` : "",
    result.not_material.length
      ? `“Not material” appears for ${listLabels(result.not_material)}; that designation does not satisfy the standard.`
      : "",
    "Regulatory silence does not establish immateriality. Do not treat this page as certification-ready until every required value is resolved through the governed standards method.",
  ].filter(Boolean).join(" ")
  return `${BEGIN}\n<section data-panel-audit="incomplete" style="margin:0 0 40px;padding:18px 20px;border:1px solid #e6c8c4;border-left:4px solid #9f2727;background:#fdf4f3"><div style="font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:#9f2727;margin:0 0 8px">Standards completeness flag</div><p style="font-size:14px;line-height:1.7;color:#3f3a3a;margin:0;max-width:84ch">${esc(sentences)}</p><p style="font-size:12.5px;line-height:1.65;margin:10px 0 0"><a href="/standards/completeness-audit" style="color:#1c43ad">See the complete panel audit</a></p></section>\n${END}`
}

const files = fs.readdirSync(STANDARDS_DIR)
  .filter((file) => file.endsWith(".md") && !["index.md", "completeness-audit.md"].includes(file))
  .sort()

const pages = []
let changed = 0
for (const filename of files) {
  const filePath = path.join(STANDARDS_DIR, filename)
  const raw = fs.readFileSync(filePath, "utf8")
  const slug = filename.replace(/\.md$/, "")
  const result = auditStandard(raw, slug, filename)
  pages.push(result)
  const next = result.complete ? raw.replace(BLOCK_RE, "") : injectAfterFrontmatter(raw, flagBlock(result))
  if (next !== raw) {
    fs.writeFileSync(filePath, next, "utf8")
    changed++
  }
}

const summary = {
  pages_audited: pages.length,
  complete: pages.filter((page) => page.complete).length,
  incomplete: pages.filter((page) => !page.complete).length,
  missing_rows: pages.reduce((sum, page) => sum + page.missing.length, 0),
  non_numeric_rows: pages.reduce((sum, page) => sum + page.non_numeric.length, 0),
  not_material_rows: pages.reduce((sum, page) => sum + page.not_material.length, 0),
  extreme_value_reviews: pages.reduce((sum, page) => sum + page.extreme_value_review.length, 0),
  government_default_pages: pages.filter((page) =>
    /government-limit default|strictest credible government limit|strictest government maximum/i.test(page.methodology_version),
  ).length,
  selective_occurrence_pages: pages.filter((page) => page.methodology_version.includes("selective occurrence")).length,
}

const methodologyCounts = Object.fromEntries(
  [...new Set(pages.map((page) => page.methodology_version))]
    .sort()
    .map((methodology) => [methodology, pages.filter((page) => page.methodology_version === methodology).length]),
)

const report = {
  generated_on: new Date().toISOString().slice(0, 10),
  panel_version: config.panel_version,
  completion_rule: config.completion_rule,
  required_analytes: required,
  summary,
  methodology_counts: methodologyCounts,
  methodology_finding: "The preview declares a government-limit-default method on every standard page, while the locked HMTc standards math uses P97 for clean subcategories and P45 for dirty subcategories, with the final value capped at the lowest applicable loaded regulatory ceiling. The public method text and generators require governance reconciliation.",
  pages,
}
fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, "utf8")

const summaryBlock = `${BEGIN}\n<section data-panel-audit="summary" style="margin:0 0 40px;padding:18px 20px;border:1px solid #e6c8c4;border-left:4px solid #9f2727;background:#fdf4f3"><div style="font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:#9f2727;margin:0 0 8px">Ten-analyte completeness audit</div><p style="font-size:14px;line-height:1.7;color:#3f3a3a;margin:0;max-width:84ch">${summary.incomplete} of ${summary.pages_audited} standards in this preview are incomplete. A dash, monitored-only entry, or “not material” designation does not count as a numeric limit.</p><p style="font-size:12.5px;line-height:1.65;margin:10px 0 0"><a href="/standards/completeness-audit" style="color:#1c43ad">Open the page-by-page findings</a></p></section>\n${END}`
if (fs.existsSync(INDEX_PATH)) {
  const raw = fs.readFileSync(INDEX_PATH, "utf8")
  const next = injectAfterFrontmatter(raw, summaryBlock)
  if (next !== raw) {
    fs.writeFileSync(INDEX_PATH, next, "utf8")
    changed++
  }
}

const rowHtml = pages.map((page, index) => {
  const zebra = index % 2 ? ";background:#fbf7f5" : ""
  const missing = listLabels(page.missing)
  const nonNumeric = page.non_numeric.length
    ? page.non_numeric.map((item) => `${labelFor.get(item.key)} = ${item.value}`).join("; ")
    : "none"
  const reviews = [
    ...page.warnings.map(warningLabel),
    ...page.extreme_value_review.map((item) => `${labelFor.get(item.key)} ${item.value} ppb — magnitude review`),
  ]
  return `<tr style="border-bottom:1px solid #f2ece7${zebra}"><td style="padding:10px 12px;vertical-align:top"><a href="${page.path}" style="color:#1c43ad">${esc(page.slug)}</a></td><td style="padding:10px 12px;vertical-align:top;text-align:right;font-family:'IBM Plex Mono',monospace;white-space:nowrap">${page.numeric_limits} / ${page.required_limits}</td><td style="padding:10px 12px;vertical-align:top;color:#736b6b;line-height:1.55">${esc(missing)}</td><td style="padding:10px 12px;vertical-align:top;color:#736b6b;line-height:1.55">${esc(nonNumeric)}</td><td style="padding:10px 12px;vertical-align:top;color:#736b6b;line-height:1.55">${esc(reviews.length ? reviews.join("; ") : "none")}</td></tr>`
}).join("")

const auditPageContent = `---
title: "Standards completeness audit — required ten-analyte panel"
type: standard
custom_page: true
description: "A page-by-page audit of whether each HMTc product standard publishes numeric limits for lead, cadmium, total and inorganic arsenic, total mercury, nickel, tin, aluminum, total chromium, and hexavalent chromium."
audience: [regulator, brand-legal, retailer-compliance, certifier]
snapshot:
  - { k: "Standards audited", v: "${summary.pages_audited}" }
  - { k: "Complete", v: "${summary.complete}" }
  - { k: "Incomplete", v: "${summary.incomplete}" }
  - { k: "Panel", v: "10 required analytes" }
connections:
  - { label: "Standards register", href: "/standards" }
  - { label: "Analyte panel", href: "/analytes" }
---
<section style="margin-bottom:40px"><h1 style="font-family:Lora,serif;font-weight:400;font-size:38px;line-height:1.1;color:#2b1f1f;margin:0 0 12px">Standards completeness audit</h1><p style="font-size:16px;line-height:1.7;color:#3f3a3a;margin:0;max-width:84ch">A standard is complete only when its Master Limit Table publishes a numeric limit for Pb, Cd, total As, inorganic As, total Hg, Ni, Sn, Al, total Cr, and Cr(VI), in the product row’s native basis. Methylmercury may be an additional category requirement, but it does not replace total mercury. Regulatory silence, monitoring language, reflex testing, and “not material” do not satisfy a missing limit.</p></section>
<section id="method-audit" style="margin-bottom:52px"><h2 style="font-family:Lora,serif;font-weight:400;font-size:30px;line-height:1.2;color:#2b1f1f;border-bottom:1px solid #e8e1db;padding-bottom:10px;margin:0 0 20px">Method audit</h2><p style="font-size:15.5px;line-height:1.75;color:#3f3a3a;margin:0 0 16px;max-width:84ch">All ${summary.government_default_pages} standards in this preview declare a government-limit-default method; ${summary.selective_occurrence_pages} of those also mention selective occurrence pooling. The locked HMTc standards math, however, sets clean-subcategory limits at pooled P97 and dirty-subcategory limits at pooled P45, then caps the result at the lowest applicable loaded regulatory ceiling in the row’s native basis. The public method text and the current generators therefore require governance reconciliation before the figures can be represented as one system-wide method.</p><p style="font-size:15.5px;line-height:1.75;color:#3f3a3a;margin:0 0 16px;max-width:84ch">The public method pages also describe the dirty-subcategory P45 outcome as roughly 40% and cite a 42% validation result, while the governing target is approximately 30% joint row pass. That is a published numeric conflict: the target, validation population, and calculation need to be reconciled before either percentage is presented as the governing figure.</p><p style="font-size:15.5px;line-height:1.75;color:#3f3a3a;margin:0;max-width:84ch">This matters most in unregulated cells: the program’s own structure page says occurrence math applies where government supplies no number, while ${summary.not_material_rows} current table cells use “not material” instead. Those cells are flagged as unresolved, not exempted.</p></section>
<section style="margin-bottom:52px"><h2 style="font-family:Lora,serif;font-weight:400;font-size:30px;line-height:1.2;color:#2b1f1f;border-bottom:1px solid #e8e1db;padding-bottom:10px;margin:0 0 20px">Audit result</h2><p style="font-size:14px;line-height:1.7;color:#736b6b;margin:0 0 16px;max-width:84ch">${summary.incomplete} of ${summary.pages_audited} standards in this preview are incomplete. The audit found ${summary.missing_rows} absent required rows, ${summary.non_numeric_rows} present-but-nonnumeric rows, ${summary.not_material_rows} “not material” entries, and ${summary.extreme_value_reviews} published values requiring a magnitude check. “Review” flags a figure for source-and-unit verification; it does not by itself assert the figure is wrong.</p><div style="overflow-x:auto"><table style="width:100%;font-size:12.5px;border:1px solid #e8e1db;min-width:72rem;border-collapse:collapse"><thead><tr style="background:#9f2727;color:#fff"><th style="text-align:left;padding:9px 12px;font-family:'IBM Plex Mono',monospace;font-size:9.5px;font-weight:500;letter-spacing:.08em;text-transform:uppercase">Standard</th><th style="text-align:right;padding:9px 12px;font-family:'IBM Plex Mono',monospace;font-size:9.5px;font-weight:500;letter-spacing:.08em;text-transform:uppercase">Numeric</th><th style="text-align:left;padding:9px 12px;font-family:'IBM Plex Mono',monospace;font-size:9.5px;font-weight:500;letter-spacing:.08em;text-transform:uppercase">Missing rows</th><th style="text-align:left;padding:9px 12px;font-family:'IBM Plex Mono',monospace;font-size:9.5px;font-weight:500;letter-spacing:.08em;text-transform:uppercase">Nonnumeric rows</th><th style="text-align:left;padding:9px 12px;font-family:'IBM Plex Mono',monospace;font-size:9.5px;font-weight:500;letter-spacing:.08em;text-transform:uppercase">Review flags</th></tr></thead><tbody>${rowHtml}</tbody></table></div></section>
<section style="margin-bottom:20px"><h2 style="font-family:Lora,serif;font-weight:400;font-size:30px;line-height:1.2;color:#2b1f1f;border-bottom:1px solid #e8e1db;padding-bottom:10px;margin:0 0 20px">How to clear a flag</h2><p style="font-size:15.5px;line-height:1.75;color:#3f3a3a;margin:0 0 16px;max-width:84ch">Add the missing analyte row and derive a numeric limit through the governed HMTc standards engine, preserving product row, market, native basis, analyte species, and regulatory-cap provenance. Total arsenic cannot substitute for inorganic arsenic; total chromium cannot substitute for Cr(VI). Re-run the audit after regenerating the standard. The flag clears automatically only when all ten required rows are numeric.</p></section>
`
fs.writeFileSync(AUDIT_PAGE_PATH, auditPageContent, "utf8")

console.log(`standards-panel audit: ${summary.complete}/${summary.pages_audited} complete; ${summary.missing_rows} missing rows; ${summary.non_numeric_rows} nonnumeric rows; ${summary.not_material_rows} n/m; ${summary.extreme_value_reviews} magnitude reviews; ${changed} flag file(s) updated`)
if (FAIL_INCOMPLETE && summary.incomplete) process.exitCode = 1
