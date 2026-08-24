#!/usr/bin/env node
import fs from "node:fs"
import path from "node:path"

const repo = process.cwd()
const input = path.join(repo, "data/regulations/cert-regulatory-watch-snapshot.json")
const crosswalkPath = path.join(repo, "data/regulations/regulatory-watch-crosswalk.json")
const output = path.join(repo, "data/regulations/cert-regulatory-watch-impact.json")
if (!fs.existsSync(input)) throw new Error(`Missing ${path.relative(repo, input)}. Export the firewall-clean HMI snapshot first.`)
if (!fs.existsSync(crosswalkPath)) throw new Error(`Missing ${path.relative(repo, crosswalkPath)}. Numerical comparisons require an explicit crosswalk.`)

const snapshot = JSON.parse(fs.readFileSync(input, "utf8"))
const crosswalk = JSON.parse(fs.readFileSync(crosswalkPath, "utf8"))
const limits = new Map((snapshot.regulatory_limits || []).map((item) => [item.regulatory_limit_id, item]))
const asOf = new Date(`${snapshot.generated}T00:00:00Z`)
const quarterStart = new Date("2026-04-01T00:00:00Z")
const quarterEnd = new Date("2026-06-30T23:59:59Z")

function filesUnder(directory) {
  if (!fs.existsSync(directory)) return []
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name)
    return entry.isDirectory() ? filesUnder(file) : [file]
  })
}

const compiled = new Map()
for (const file of filesUnder(path.join(repo, "data/standards")).filter((item) => /-compiled\/[^/]+\.json$/.test(item))) {
  const record = JSON.parse(fs.readFileSync(file, "utf8"))
  if (record.slug) compiled.set(record.slug, { record, file })
}

function standardCell(mapping) {
  const found = compiled.get(mapping.standard_slug)
  if (!found) throw new Error(`${mapping.event_id}: compiled standard '${mapping.standard_slug}' not found`)
  const { record, file } = found
  const cell = record.variants
    ? record.variants[mapping.variant]?.[mapping.analyte]
    : record.cells?.[mapping.analyte]
  if (!cell) throw new Error(`${mapping.event_id}: ${mapping.standard_slug}/${mapping.variant || "cells"}/${mapping.analyte} not found in ${path.relative(repo, file)}`)
  const value = cell.value_exact ?? cell.value
  return { record, cell, value: Number.isFinite(value) ? value : null }
}

function compare(mapping) {
  const limit = limits.get(mapping.regulatory_limit_id)
  if (!limit) throw new Error(`${mapping.event_id}: regulatory limit '${mapping.regulatory_limit_id}' is absent from the neutral snapshot`)
  if (limit.analyte !== mapping.analyte) throw new Error(`${mapping.event_id}: analyte mismatch ${limit.analyte} != ${mapping.analyte}`)
  const { record, cell, value } = standardCell(mapping)
  let relation = "not-comparable"
  if (mapping.basis_relation === "same-mass-fraction" && value !== null) {
    if (value < limit.value_ug_kg) relation = "hmtc-stricter"
    else if (value === limit.value_ug_kg) relation = "equal"
    else relation = "regulatory-tighter-review"
  } else if (value === null) relation = "no-numeric-hmtc-cell"
  else relation = "not-comparable-basis"
  return {
    event_id: mapping.event_id,
    regulatory_limit_id: limit.regulatory_limit_id,
    jurisdiction: limit.jurisdiction,
    analyte: limit.analyte,
    product_scope: limit.product_scope,
    regulatory_value_ug_kg: limit.value_ug_kg,
    regulatory_basis: limit.basis,
    legal_status: limit.legal_status,
    hmtc_standard_slug: record.slug,
    hmtc_standard_name: record.name,
    hmtc_standard_url: mapping.published_standard_url || `/standards/${record.slug}`,
    hmtc_variant: mapping.variant,
    hmtc_value_ug_kg: value,
    hmtc_cell_type: cell.type || cell.cell_kind || null,
    hmtc_basis: record.native_basis_label || record.native_basis || cell.basis || null,
    basis_relation: mapping.basis_relation,
    relation,
    scope_note: mapping.scope_note,
    regulation_url: limit.regulation_route ? `https://heavymetalindex.com/${limit.regulation_route}` : limit.official_url,
  }
}

const comparisonsByEvent = new Map()
for (const mapping of crosswalk.mappings) {
  const item = compare(mapping)
  if (!comparisonsByEvent.has(mapping.event_id)) comparisonsByEvent.set(mapping.event_id, [])
  comparisonsByEvent.get(mapping.event_id).push(item)
}

function classify(event) {
  if (event.verification.state !== "verified-primary") return "insufficient-evidence"
  if (["proposed", "consultation", "litigation", "monitor-only"].includes(event.status)) return "context-with-no-direct-hmtc-change"
  if (event.event_type === "testing-method") return "testing-panel-or-analytical-method-change"
  if (event.event_type === "disclosure") return "disclosure-reporting-requirement"
  if (["market-restriction", "alignment"].includes(event.event_type)) return "supply-chain-or-market-access-consequence"
  if (event.event_type === "limit-change" && event.status === "adopted-not-effective") return "future-binding-limit-candidate"
  if (event.event_type === "limit-change" && (event.hmi_routes.regulatory_limit_ids || []).length) return "current-binding-limit-change"
  return "context-with-no-direct-hmtc-change"
}

function rationale(event, impactClass, comparisons) {
  if (impactClass === "insufficient-evidence") return "Excluded from public reporting until an official primary record verifies the claimed instrument."
  if (impactClass === "future-binding-limit-candidate") return `Prepare for the adopted effective date. ${comparisons.length} mapped HMTc comparison${comparisons.length === 1 ? " is" : "s are"} available; no threshold changes automatically.`
  if (impactClass === "current-binding-limit-change") return `${comparisons.length} mapped comparison${comparisons.length === 1 ? " shows" : "s show"} how the in-force legal ceiling relates to a published HMTc cell.`
  if (impactClass === "testing-panel-or-analytical-method-change") return "Review the laboratory specification and evidence package; the event changes measurement or compliance procedure, not a certification concentration limit by itself."
  if (impactClass === "disclosure-reporting-requirement") return "Review testing records, public disclosure, inventory, and communication duties even when the certification concentration limit is unchanged."
  if (impactClass === "supply-chain-or-market-access-consequence") return "Review formulation, packaging, authorization, or market-entry documentation for the named jurisdiction; no threshold changes automatically."
  return "Monitor the verified non-final or contextual development. It does not create a current HMTc threshold change."
}

function isoDate(value) { return value ? new Date(`${value}T00:00:00Z`) : null }
function deadlineFor(event) {
  if (event.status === "adopted-not-effective") return event.dates.effective || event.dates.transition || null
  if (["proposed", "consultation", "litigation"].includes(event.status)) return event.dates.consultation_close || null
  return event.dates.transition || event.dates.effective || event.dates.consultation_close || null
}

function quarterFields(event) {
  return ["adopted", "published", "effective", "transition", "consultation_close"].filter((key) => {
    const date = isoDate(event.dates[key])
    return date && date >= quarterStart && date <= quarterEnd
  })
}

function actionFor(event, impactClass, deadline) {
  if (impactClass === "insufficient-evidence") return { priority: "hold", label: "Do not rely on this claim", owner: "Evidence verification" }
  if (["proposed", "consultation", "litigation", "monitor-only"].includes(event.status)) return { priority: "monitor", label: "Monitor official status", owner: "Regulatory affairs" }
  const date = isoDate(deadline)
  if (event.status === "adopted-not-effective") return { priority: "prepare", label: "Complete readiness before the effective date", owner: "Regulatory and laboratory operations" }
  if (date && date < asOf) return { priority: "confirm-compliance", label: "Confirm the passed compliance date is implemented", owner: "Quality and regulatory operations" }
  if (date && date >= asOf) return { priority: "prepare", label: "Complete readiness before the listed date", owner: "Regulatory and quality operations" }
  if (impactClass === "current-binding-limit-change") return { priority: "act-now", label: "Confirm product and standard alignment", owner: "Standards governance and quality" }
  if (["testing-panel-or-analytical-method-change", "disclosure-reporting-requirement", "supply-chain-or-market-access-consequence"].includes(impactClass)) return { priority: "act-now", label: "Update the operating compliance file", owner: "Regulatory and quality operations" }
  return { priority: "no-direct-change", label: "Record context; no program change", owner: "Regulatory affairs" }
}

const impacts = snapshot.events.map((event) => {
  const impact_class = classify(event)
  const comparisons = comparisonsByEvent.get(event.event_id) || []
  const deadline = deadlineFor(event)
  const deadlineDate = isoDate(deadline)
  const q2_fields = quarterFields(event)
  return {
    event_id: event.event_id,
    impact_class,
    affected_analytes: event.analytes,
    affected_product_categories: [...new Set(comparisons.map((item) => item.hmtc_standard_name))],
    deadline,
    deadline_state: !deadlineDate ? "none" : deadlineDate < asOf ? "passed" : "upcoming",
    q2_relevance: q2_fields.length ? "q2-development" : deadlineDate && deadlineDate > quarterEnd ? "post-quarter-deadline" : "background",
    q2_date_fields: q2_fields,
    related_standard_urls: [...new Set(comparisons.map((item) => item.hmtc_standard_url))],
    comparisons,
    comparison_summary: {
      mapped: comparisons.length,
      hmtc_stricter: comparisons.filter((item) => item.relation === "hmtc-stricter").length,
      equal: comparisons.filter((item) => item.relation === "equal").length,
      governance_review: comparisons.filter((item) => item.relation === "regulatory-tighter-review").length,
      not_comparable: comparisons.filter((item) => item.relation.startsWith("not-comparable") || item.relation === "no-numeric-hmtc-cell").length,
    },
    rationale: rationale(event, impact_class, comparisons),
    what_does_not_change: "No published HMTc threshold changes automatically. A legal ceiling tighter than a published cell opens governance review; all revisions still require the existing compiler and approval process.",
    action: actionFor(event, impact_class, deadline),
    governance_queue: comparisons.some((item) => item.relation === "regulatory-tighter-review") || ["current-binding-limit-change", "future-binding-limit-candidate", "testing-panel-or-analytical-method-change"].includes(impact_class),
  }
})

const result = {
  schema_version: 2,
  generated: snapshot.generated,
  quarter: "2026-Q2",
  quarter_start: "2026-04-01",
  quarter_end: "2026-06-30",
  source_snapshot: "data/regulations/cert-regulatory-watch-snapshot.json",
  crosswalk: "data/regulations/regulatory-watch-crosswalk.json",
  impact_count: impacts.length,
  comparison_count: impacts.reduce((sum, item) => sum + item.comparisons.length, 0),
  impacts,
}
fs.writeFileSync(output, JSON.stringify(result, null, 2) + "\n")
console.log(`regulatory:watch:impact wrote ${impacts.length} impact records and ${result.comparison_count} numerical comparisons -> ${path.relative(repo, output)}`)
