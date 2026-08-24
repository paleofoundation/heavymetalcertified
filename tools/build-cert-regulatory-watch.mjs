#!/usr/bin/env node
import fs from "node:fs"
import path from "node:path"

const repo = process.cwd()
const snapshot = JSON.parse(fs.readFileSync(path.join(repo, "data/regulations/cert-regulatory-watch-snapshot.json"), "utf8"))
const impactFile = path.join(repo, "data/regulations/cert-regulatory-watch-impact.json")
if (!fs.existsSync(impactFile)) throw new Error("Run regulatory:watch:impact before regulatory:watch:build")
const impacts = new Map(JSON.parse(fs.readFileSync(impactFile, "utf8")).impacts.map((item) => [item.event_id, item]))
const out = path.join(repo, "content/articles/regulatory-watch.md")
const staticDir = path.join(repo, "content/static/data")
fs.mkdirSync(path.dirname(out), { recursive: true })
fs.mkdirSync(staticDir, { recursive: true })

const esc = (s) => String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
const label = (s) => String(s || "").replace(/-/g, " ")
const dateLine = (event) => event.dates.transition || event.dates.effective || event.dates.consultation_close || event.dates.next_review || "No fixed date"
const hmiUrl = (route) => `https://heavymetalindex.com/${route}`

function sourceLinks(event) {
  const official = (event.official_sources || []).map((source) => `<a href="${esc(source.url)}">${esc(source.title)}</a>`)
  const hmi = [...(event.hmi_routes.regulations || []), ...(event.hmi_routes.sources || [])].map((route) => `<a href="${hmiUrl(route)}">Heavy Metal Index: ${esc(route.split("/").pop())}</a>`)
  return [...official, ...hmi].join(" &middot; ") || "Primary source not yet verified; see the documented gap."
}

function card(event) {
  const impact = impacts.get(event.event_id)
  const gaps = (event.gaps || []).length ? `<p style="font-size:13.5px;line-height:1.65;color:#736b6b;margin:12px 0 0"><span style="font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:#9f2727">Open evidence gap</span><br>${esc(event.gaps.join(" "))}</p>` : ""
  const articles = (event.article_slugs || []).map((slug) => `<a href="/articles/${slug}">analysis</a>`).join(" &middot; ")
  return `<article id="${event.event_id}" data-event-id="${event.event_id}" style="border:1px solid #e8e1db;background:#fffdfb;padding:22px 24px;margin:0 0 18px">
  <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:10px"><span style="font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.09em;text-transform:uppercase;color:#fff;background:#9f2727;border-radius:3px;padding:6px 9px">${esc(label(event.status))}</span><span style="font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:#736b6b">${esc(event.event_id)} &middot; ${esc(label(event.verification.state))}</span></div>
  <h3 style="font-family:Lora,serif;font-size:22px;line-height:1.3;font-weight:400;color:#2b1f1f;margin:0 0 10px">${esc(event.title)}</h3>
  <p style="font-size:15px;line-height:1.72;color:#3f3a3a;margin:0 0 16px">${esc(event.summary)}</p>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;border-top:1px solid #f2ece7;padding-top:14px">
    <p style="font-size:13px;line-height:1.6;color:#5a4141;margin:0"><span style="font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.08em;text-transform:uppercase;color:#9f2727">Applicable / review date</span><br>${esc(dateLine(event))}</p>
    <p style="font-size:13px;line-height:1.6;color:#5a4141;margin:0"><span style="font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.08em;text-transform:uppercase;color:#9f2727">Metals and scope</span><br>${esc(event.analytes.join(", "))}; ${esc(event.product_scopes.join(", "))}</p>
    <p style="font-size:13px;line-height:1.6;color:#5a4141;margin:0"><span style="font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.08em;text-transform:uppercase;color:#9f2727">Who is affected</span><br>${esc(event.jurisdictions.join(", "))}; ${esc(event.authorities.join(", "))}</p>
    <p style="font-size:13px;line-height:1.6;color:#5a4141;margin:0"><span style="font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.08em;text-transform:uppercase;color:#9f2727">HMTc impact</span><br>${esc(label(impact.impact_class))}. ${esc(impact.rationale)}</p>
  </div>
  <p style="font-size:13px;line-height:1.65;color:#5a4141;margin:14px 0 0"><span style="font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.08em;text-transform:uppercase;color:#9f2727">What does not change</span><br>${esc(impact.what_does_not_change)}</p>
  ${gaps}
  <p style="font-size:12.5px;line-height:1.65;color:#736b6b;margin:14px 0 0"><span style="font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.08em;text-transform:uppercase;color:#9f2727">Evidence last verified</span> ${esc(event.verification.verified_on)} &middot; ${sourceLinks(event)}${articles ? ` &middot; ${articles}` : ""}</p>
</article>`
}

const ordered = [...snapshot.events].sort((a, b) => a.cluster - b.cluster)
const front = `---
title: "Regulatory Watch"
seoTitle: "Heavy Metal Regulatory Watch 2026 | HMTc"
description: "Track verified 2025-2026 heavy-metal regulations, deadlines, testing duties and evidence gaps across food, water, packaging and market access."
socialDescription: "A living, evidence-linked tracker of heavy-metal regulatory changes, deadlines, proposals and verification gaps, with HMTc consequences stated separately."
type: article-series
section: "Research"
updated: "${snapshot.generated}"
evidence_verified: "${snapshot.generated}"
scholar_eligible: false
scholar_pdf: false
audience: [regulator, brand-legal, brand-finance, retailer-compliance]
snapshot:
  - { k: "Coverage", v: "${snapshot.event_count} story clusters" }
  - { k: "Evidence date", v: "${snapshot.generated}" }
  - { k: "Full analyses", v: "6" }
  - { k: "Open gaps", v: "${ordered.filter((event) => event.disposition === "unverified-gap").length}" }
connections:
  - { label: "Download tracker JSON", href: "/static/data/regulatory-watch.json" }
  - { label: "Download tracker CSV", href: "/static/data/regulatory-watch.csv" }
  - { label: "Heavy Metal Index regulations", href: "https://heavymetalindex.com/regulations" }
---

<div style="border:1px solid #f2dcda;background:#fdf4f3;padding:24px 26px;margin-bottom:44px">
  <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center;margin-bottom:14px"><span style="font-family:'IBM Plex Mono',monospace;font-size:15px;color:#fff;background:#9f2727;border-radius:3px;padding:7px 13px">THE ASSERTION</span><span style="font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#9f2727">Living research series &middot; evidence verified ${snapshot.generated}</span></div>
  <p style="font-family:Lora,serif;font-size:24px;line-height:1.45;color:#2b1f1f;margin:0">A regulatory headline matters only after its instrument, legal status, dates, analyte species, product scope, and program consequence have been separated and verified.</p>
</div>

Regulatory Watch follows verified changes from official law to HMTc action. The [Heavy Metal Index](https://heavymetalindex.com) preserves the neutral evidence. This site explains certification and market consequences. A proposal remains a proposal, a drinking-water rule remains a drinking-water rule, and no tracker item silently changes a published standard.

## Six citable analyses

- [Worldwide Heavy Metal Regulatory Watch 2026](/articles/worldwide-heavy-metal-regulatory-watch-2026)
- [US Baby-Food Heavy-Metal Laws: States Move Ahead of FDA](/articles/us-baby-food-heavy-metal-laws-states-fda)
- [EU Food Limits: Inorganic Arsenic in Seafood and Nickel Deadlines](/articles/eu-food-limits-arsenic-seafood-nickel-deadlines)
- [Hexavalent Chromium: Four Regulatory Regimes That Must Not Be Confused](/articles/hexavalent-chromium-four-regimes)
- [New Market-Access Rules Across the Gulf and Asia](/articles/market-access-rules-gulf-asia)
- [Testing, Disclosure, and Packaging Rules Beyond Concentration Limits](/articles/testing-disclosure-packaging-rules)

## The tracker

Each entry carries the current legal status, change, operative date, metals and scope, affected parties, HMTc impact, what does not change, evidence date, and source trail. “Unverified gap” means the discovery claim is preserved for follow-up but not repeated as law.

${ordered.map(card).join("\n\n")}

## How this stays current

The machine-readable [JSON feed](/static/data/regulatory-watch.json) and [CSV feed](/static/data/regulatory-watch.csv) are generated from the same snapshot and impact records as this visible page. Human copy, structured data, and feeds therefore share one source of truth. Events graduate to a standalone analysis only when they have distinct search intent and enough verified evidence to support a substantive document.
`
fs.writeFileSync(out, front)

const feed = { schema_version: 1, generated: snapshot.generated, canonical: "https://heavymetalcertified.com/articles/regulatory-watch", source: "Heavy Metal Index firewall-clean snapshot", event_count: ordered.length, events: ordered.map((event) => ({ ...event, hmtc_impact: impacts.get(event.event_id) })) }
fs.writeFileSync(path.join(staticDir, "regulatory-watch.json"), JSON.stringify(feed, null, 2) + "\n")
const columns = ["event_id","title","status","verification","disposition","jurisdictions","analytes","effective_or_review_date","impact_class","evidence_verified","official_sources","hmi_routes"]
const csv = [columns.join(","), ...ordered.map((event) => {
  const impact = impacts.get(event.event_id)
  const values = [event.event_id,event.title,event.status,event.verification.state,event.disposition,event.jurisdictions.join(" | "),event.analytes.join(" | "),dateLine(event),impact.impact_class,event.verification.verified_on,(event.official_sources || []).map((s) => s.url).join(" | "),[...(event.hmi_routes.regulations || []),...(event.hmi_routes.sources || [])].map(hmiUrl).join(" | ")]
  return values.map((value) => `"${String(value || "").replace(/"/g, '""')}"`).join(",")
})].join("\n") + "\n"
fs.writeFileSync(path.join(staticDir, "regulatory-watch.csv"), csv)
console.log(`regulatory:watch:build wrote hub + JSON/CSV for ${ordered.length} events`)
