#!/usr/bin/env node
import fs from "node:fs"
import path from "node:path"

const repo = process.cwd()
const snapshot = JSON.parse(fs.readFileSync(path.join(repo, "data/regulations/cert-regulatory-watch-snapshot.json"), "utf8"))
const impactFile = path.join(repo, "data/regulations/cert-regulatory-watch-impact.json")
if (!fs.existsSync(impactFile)) throw new Error("Run regulatory:watch:impact before regulatory:watch:build")
const impactData = JSON.parse(fs.readFileSync(impactFile, "utf8"))
const impacts = new Map(impactData.impacts.map((item) => [item.event_id, item]))
const out = path.join(repo, "content/articles/regulatory-watch.md")
const staticDir = path.join(repo, "content/static/data")
fs.mkdirSync(path.dirname(out), { recursive: true })
fs.mkdirSync(staticDir, { recursive: true })

const esc = (s) => String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
const label = (s) => String(s || "").replace(/-/g, " ")
const hmiUrl = (route) => `https://heavymetalindex.com/${route}`
const publicEvents = snapshot.events.filter((event) => event.public_eligible && event.verification.state === "verified-primary")
const excludedEvents = snapshot.events.filter((event) => !event.public_eligible || event.verification.state !== "verified-primary")
const publicImpacts = publicEvents.map((event) => ({ event, impact: impacts.get(event.event_id) }))
const q2Events = publicImpacts.filter(({ impact }) => impact.q2_relevance === "q2-development")
const comparisons = publicImpacts.flatMap(({ impact }) => impact.comparisons)

function dateLine(event) {
  return event.dates.transition || event.dates.effective || event.dates.consultation_close || "No fixed compliance date"
}

function sourceLinks(event) {
  const official = (event.official_sources || []).map((source) => `<a href="${esc(source.url)}">${esc(source.title)}</a>`)
  const hmi = [...(event.hmi_routes.regulations || []), ...(event.hmi_routes.sources || [])].map((route) => `<a href="${hmiUrl(route)}">Heavy Metal Index: ${esc(route.split("/").pop())}</a>`)
  return [...official, ...hmi].join(" &middot; ")
}

function relationText(comparison) {
  if (comparison.relation === "equal") return "Equal on mapped basis"
  if (comparison.relation === "hmtc-stricter") return "HMTc is stricter"
  if (comparison.relation === "regulatory-tighter-review") return "Governance review required"
  return "Not numerically comparable"
}

function comparisonTable(rows) {
  if (!rows.length) return ""
  return `<table>
  <thead><tr><th>Jurisdiction and scope</th><th>Analyte</th><th>Legal ceiling</th><th>Published HMTc</th><th>Relationship</th><th>Records</th></tr></thead>
  <tbody>${rows.map((item) => `<tr><td>${esc(item.jurisdiction)}: ${esc(item.product_scope)}</td><td>${esc(item.analyte)}</td><td>${esc(item.regulatory_value_ug_kg.toLocaleString("en-US"))} µg/kg</td><td>${item.hmtc_value_ug_kg === null ? "No numeric cell" : `${esc(item.hmtc_value_ug_kg.toLocaleString("en-US"))} µg/kg`}</td><td>${esc(relationText(item))}</td><td><a href="${esc(item.regulation_url)}">law</a> &middot; <a href="${esc(item.hmtc_standard_url)}">standard</a></td></tr>`).join("")}</tbody>
</table>
<p style="font-size:11.5px;line-height:1.55;color:#a9a1a1;margin:10px 0 30px">Only explicit same-mass-fraction mappings appear here. Product scope, species, and basis notes travel with each mapping; liquid mg/L applications are not converted into solid-product comparisons.</p>`
}

function card(event) {
  const impact = impacts.get(event.event_id)
  const mapped = impact.comparison_summary.mapped
  const relation = mapped
    ? `${mapped} mapped comparison${mapped === 1 ? "" : "s"}: ${impact.comparison_summary.equal} equal; ${impact.comparison_summary.hmtc_stricter} HMTc stricter; ${impact.comparison_summary.governance_review} governance review.`
    : "No same-basis numerical comparison is asserted for this event."
  const articles = (event.article_slugs || []).map((slug) => `<a href="/articles/${slug}">analysis</a>`).join(" &middot; ")
  return `<article id="${event.event_id}" data-event-id="${event.event_id}" style="border:1px solid #e8e1db;background:#fffdfb;padding:22px 24px;margin:0 0 18px">
  <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:10px"><span style="font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.09em;text-transform:uppercase;color:#fff;background:#9f2727;border-radius:3px;padding:6px 9px">${esc(label(event.status))}</span><span style="font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:#736b6b">${esc(label(impact.action.priority))} &middot; verified primary</span></div>
  <h3 style="font-family:Lora,serif;font-size:22px;line-height:1.3;font-weight:400;color:#2b1f1f;margin:0 0 10px">${esc(event.title)}</h3>
  <p style="font-size:15px;line-height:1.72;color:#3f3a3a;margin:0 0 16px">${esc(event.summary)}</p>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;border-top:1px solid #f2ece7;padding-top:14px">
    <p style="font-size:13px;line-height:1.6;color:#5a4141;margin:0"><span style="font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.08em;text-transform:uppercase;color:#9f2727">Action / date</span><br>${esc(impact.action.label)}<br>${esc(dateLine(event))}</p>
    <p style="font-size:13px;line-height:1.6;color:#5a4141;margin:0"><span style="font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.08em;text-transform:uppercase;color:#9f2727">Metals and scope</span><br>${esc(event.analytes.join(", "))}; ${esc(event.product_scopes.join(", "))}</p>
    <p style="font-size:13px;line-height:1.6;color:#5a4141;margin:0"><span style="font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.08em;text-transform:uppercase;color:#9f2727">Who owns the action</span><br>${esc(impact.action.owner)}<br>${esc(event.jurisdictions.join(", "))}</p>
    <p style="font-size:13px;line-height:1.6;color:#5a4141;margin:0"><span style="font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.08em;text-transform:uppercase;color:#9f2727">HMTc comparison</span><br>${esc(relation)}</p>
  </div>
  <p style="font-size:13px;line-height:1.65;color:#5a4141;margin:14px 0 0"><span style="font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.08em;text-transform:uppercase;color:#9f2727">Program consequence</span><br>${esc(impact.rationale)} ${esc(impact.what_does_not_change)}</p>
  <p style="font-size:12.5px;line-height:1.65;color:#736b6b;margin:14px 0 0"><span style="font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.08em;text-transform:uppercase;color:#9f2727">Evidence last verified</span> ${esc(event.verification.verified_on)} &middot; ${sourceLinks(event)}${articles ? ` &middot; ${articles}` : ""}</p>
</article>`
}

function actionTable(items) {
  const ranked = { "act-now": 0, "confirm-compliance": 1, prepare: 2, monitor: 3, "no-direct-change": 4 }
  const rows = [...items].filter(({ impact }) => impact.action.priority !== "no-direct-change").sort((a, b) => {
    const priority = (ranked[a.impact.action.priority] ?? 9) - (ranked[b.impact.action.priority] ?? 9)
    if (priority) return priority
    return String(a.impact.deadline || "9999-12-31").localeCompare(String(b.impact.deadline || "9999-12-31"))
  })
  return `<table>
  <thead><tr><th>Priority</th><th>Action</th><th>Date</th><th>Jurisdiction</th><th>Owner</th></tr></thead>
  <tbody>${rows.map(({ event, impact }) => `<tr><td>${esc(label(impact.action.priority))}</td><td><a href="#${event.event_id}">${esc(event.title)}</a><br>${esc(impact.action.label)}</td><td>${esc(impact.deadline || "Status monitoring")}</td><td>${esc(event.jurisdictions.join(", "))}</td><td>${esc(impact.action.owner)}</td></tr>`).join("")}</tbody>
</table>
<p style="font-size:11.5px;line-height:1.55;color:#a9a1a1;margin:10px 0 30px">Dates are legal effective, transition, or consultation dates from official records. “Confirm compliance” means the listed date has passed and implementation should already be documented.</p>`
}

const current = publicEvents.filter((event) => event.status === "in-force")
const future = publicEvents.filter((event) => event.status === "adopted-not-effective")
const watch = publicEvents.filter((event) => !["in-force", "adopted-not-effective"].includes(event.status))
const futureDeadlines = publicImpacts.filter(({ impact }) => impact.deadline_state === "upcoming").sort((a, b) => a.impact.deadline.localeCompare(b.impact.deadline))
const displayedFutureDeadlines = futureDeadlines.filter(({ event }) => !q2Events.some(({ event: q2 }) => q2.event_id === event.event_id))
const front = `---
title: "Regulatory Watch: Q2 2026 Compliance Brief"
seoTitle: "Q2 2026 Heavy Metal Regulatory Watch | HMTc"
description: "Verified Q2 2026 heavy-metal regulatory actions, effective dates and direct comparisons with published HMTc standards for food, supplements and testing."
socialDescription: "A verified Q2 compliance brief with action owners, deadlines and direct law-to-HMTc standard comparisons."
type: article-series
section: "Research"
updated: "${snapshot.generated}"
evidence_verified: "${snapshot.generated}"
scholar_eligible: false
scholar_pdf: false
audience: [regulator, brand-legal, brand-finance, retailer-compliance]
snapshot:
  - { k: "Verified public events", v: "${publicEvents.length}" }
  - { k: "Q2 developments", v: "${q2Events.length}" }
  - { k: "Direct comparisons", v: "${comparisons.length}" }
  - { k: "Upcoming dates", v: "${futureDeadlines.length}" }
connections:
  - { label: "Download verified tracker JSON", href: "/static/data/regulatory-watch.json" }
  - { label: "Download verified tracker CSV", href: "/static/data/regulatory-watch.csv" }
  - { label: "Heavy Metal Index regulations", href: "https://heavymetalindex.com/regulations" }
---

<div style="border:1px solid #f2dcda;background:#fdf4f3;padding:24px 26px;margin-bottom:44px">
  <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center;margin-bottom:14px"><span style="font-family:'IBM Plex Mono',monospace;font-size:15px;color:#fff;background:#9f2727;border-radius:3px;padding:7px 13px">THE ASSERTION</span><span style="font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#9f2727">Q2 2026 &middot; evidence verified ${snapshot.generated}</span></div>
  <p style="font-family:Lora,serif;font-size:24px;line-height:1.45;color:#2b1f1f;margin:0">This watch is useful when it identifies what changed, who owns the response, which date controls, and whether the legal ceiling is equal to or looser than the published HMTc standard.</p>
</div>

This is the action layer built on the neutral [Heavy Metal Index regulatory record](https://heavymetalindex.com/regulations). It covers verified Q2 developments, deadlines visible from the quarter, and still-relevant in-force obligations. Candidate leads enter this public brief only after an official primary record supports the stated status, date, scope, and obligation.

## Executive action register

${actionTable(publicImpacts)}

## What changed in Q2 2026

${q2Events.map(({ event }) => card(event)).join("\n\n")}

## Direct law-to-HMTc comparisons

These are calculated from neutral regulatory-limit records and the current compiled published standards. The crosswalk is explicit by product, analyte, species, and basis. A value is not compared merely because two titles share a keyword.

${comparisonTable(comparisons)}

## Upcoming compliance dates

${displayedFutureDeadlines.length ? displayedFutureDeadlines.map(({ event }) => card(event)).join("\n\n") : "All upcoming fixed dates are attached to Q2 developments shown above."}

## Six citable analyses

- [Worldwide Heavy Metal Regulatory Watch 2026](/articles/worldwide-heavy-metal-regulatory-watch-2026)
- [US Baby-Food Heavy-Metal Laws: States Move Ahead of FDA](/articles/us-baby-food-heavy-metal-laws-states-fda)
- [EU Food Limits: Inorganic Arsenic in Seafood and Nickel Deadlines](/articles/eu-food-limits-arsenic-seafood-nickel-deadlines)
- [Hexavalent Chromium: Four Regulatory Regimes That Must Not Be Confused](/articles/hexavalent-chromium-four-regimes)
- [New Market-Access Rules Across the Gulf and Asia](/articles/market-access-rules-gulf-asia)
- [Testing, Disclosure, and Packaging Rules Beyond Concentration Limits](/articles/testing-disclosure-packaging-rules)

## Verified in-force tracker

${current.filter((event) => !q2Events.some(({ event: q2 }) => q2.event_id === event.event_id) && !futureDeadlines.some(({ event: dated }) => dated.event_id === event.event_id)).map(card).join("\n\n")}

## Adopted future rules

${future.filter((event) => !futureDeadlines.some(({ event: dated }) => dated.event_id === event.event_id)).map(card).join("\n\n") || "All adopted future rules with fixed dates appear in the upcoming compliance section."}

## Verified proposals and monitoring

${watch.filter((event) => !q2Events.some(({ event: q2 }) => q2.event_id === event.event_id) && !futureDeadlines.some(({ event: dated }) => dated.event_id === event.event_id)).map(card).join("\n\n")}

## How this stays current

The [JSON feed](/static/data/regulatory-watch.json), [CSV feed](/static/data/regulatory-watch.csv), visible cards, action register, and comparisons are generated together. The public outputs contain verified-primary events only. The private snapshot still reconciles every original lead, so exclusion does not mean the research queue was discarded. No event silently rewrites a threshold: any mapped legal ceiling tighter than HMTc fails the watch check and opens governance review.
`
fs.writeFileSync(out, front)

const ordered = [...publicEvents].sort((a, b) => a.cluster - b.cluster)
const feed = {
  schema_version: 2,
  generated: snapshot.generated,
  quarter: impactData.quarter,
  quarter_start: impactData.quarter_start,
  quarter_end: impactData.quarter_end,
  canonical: "https://heavymetalcertified.com/articles/regulatory-watch",
  source: "Heavy Metal Index firewall-clean snapshot",
  verified_event_count: ordered.length,
  comparison_count: comparisons.length,
  comparisons,
  events: ordered.map((event) => ({ ...event, gaps: undefined, hmtc_impact: impacts.get(event.event_id) })),
}
fs.writeFileSync(path.join(staticDir, "regulatory-watch.json"), JSON.stringify(feed, null, 2) + "\n")
const columns = ["event_id","title","status","action_priority","action","jurisdictions","analytes","effective_or_review_date","impact_class","mapped_comparisons","evidence_verified","official_sources","hmi_routes"]
const csv = [columns.join(","), ...ordered.map((event) => {
  const impact = impacts.get(event.event_id)
  const values = [event.event_id,event.title,event.status,impact.action.priority,impact.action.label,event.jurisdictions.join(" | "),event.analytes.join(" | "),dateLine(event),impact.impact_class,impact.comparisons.length,event.verification.verified_on,(event.official_sources || []).map((s) => s.url).join(" | "),[...(event.hmi_routes.regulations || []),...(event.hmi_routes.sources || [])].map(hmiUrl).join(" | ")]
  return values.map((value) => `"${String(value || "").replace(/"/g, '""')}"`).join(",")
})].join("\n") + "\n"
fs.writeFileSync(path.join(staticDir, "regulatory-watch.csv"), csv)
console.log(`regulatory:watch:build wrote Q2 hub + verified JSON/CSV for ${ordered.length} events, excluding ${excludedEvents.length} unverified leads`)
