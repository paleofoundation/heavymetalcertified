#!/usr/bin/env node
import fs from "node:fs"
import path from "node:path"

const repo = process.cwd()
const errors = []
const read = (file) => JSON.parse(fs.readFileSync(path.join(repo, file), "utf8"))
const snapshot = read("data/regulations/cert-regulatory-watch-snapshot.json")
const impact = read("data/regulations/cert-regulatory-watch-impact.json")
const feed = read("content/static/data/regulatory-watch.json")
const hub = fs.readFileSync(path.join(repo, "content/articles/regulatory-watch.md"), "utf8")
const specDir = path.join(repo, "data/articles/regulatory-watch")
const expectedSlugs = ["worldwide-heavy-metal-regulatory-watch-2026","us-baby-food-heavy-metal-laws-states-fda","eu-food-limits-arsenic-seafood-nickel-deadlines","hexavalent-chromium-four-regimes","market-access-rules-gulf-asia","testing-disclosure-packaging-rules"]
const publicEvents = snapshot.events.filter((event) => event.public_eligible && event.verification.state === "verified-primary")
const excluded = snapshot.events.filter((event) => !event.public_eligible || event.verification.state !== "verified-primary")

if (snapshot.event_count !== 23 || snapshot.events.length !== 23) errors.push(`private snapshot must reconcile 23 events, found ${snapshot.events.length}`)
if (impact.impacts.length !== snapshot.events.length) errors.push("impact count does not match private snapshot")
if (feed.events.length !== publicEvents.length) errors.push(`public feed must contain ${publicEvents.length} verified events, found ${feed.events.length}`)
if (Object.hasOwn(feed, "excluded_unverified_count")) errors.push("public feed exposes private unverified-lead accounting")
if (impact.quarter !== "2026-Q2" || !hub.includes("Q2 2026")) errors.push("Q2 reporting period is not explicit in data and visible content")
if (!impact.comparison_count || impact.comparison_count !== impact.impacts.reduce((sum, item) => sum + item.comparisons.length, 0)) errors.push("comparison count is missing or inconsistent")
if (feed.comparison_count !== impact.comparison_count || !Array.isArray(feed.comparisons) || feed.comparisons.length !== impact.comparison_count) errors.push("public comparison feed is missing or inconsistent")

for (const event of snapshot.events) {
  const marker = `data-event-id="${event.event_id}"`
  const occurrences = hub.split(marker).length - 1
  if (event.public_eligible && event.verification.state === "verified-primary") {
    if (occurrences !== 1) errors.push(`${event.event_id}: expected exactly one visible card, found ${occurrences}`)
    if (!(event.official_sources || []).length) errors.push(`${event.event_id}: verified event lacks official source`)
  } else if (occurrences) errors.push(`${event.event_id}: unverified event leaked onto the public hub`)
  const item = impact.impacts.find((candidate) => candidate.event_id === event.event_id)
  if (!item) { errors.push(`${event.event_id}: impact record missing`); continue }
  if (["proposed","consultation","monitor-only","litigation"].includes(event.status) && item.impact_class.includes("binding-limit")) errors.push(`${event.event_id}: non-final event treated as binding`)
  if (event.disposition === "full-article" && event.verification.state !== "verified-primary") errors.push(`${event.event_id}: full article is not primary-verified`)
  for (const comparison of item.comparisons) {
    if (!snapshot.regulatory_limits.some((limit) => limit.regulatory_limit_id === comparison.regulatory_limit_id)) errors.push(`${event.event_id}: comparison limit is absent from neutral snapshot`)
    if (comparison.analyte === "iAs" && /total arsenic/i.test(comparison.product_scope)) errors.push(`${event.event_id}: arsenic species appears conflated`)
    if (comparison.relation === "regulatory-tighter-review") errors.push(`${event.event_id}: legal ceiling is tighter than the published HMTc cell; governance review required before publication`)
    const standardPage = path.join(repo, "content", comparison.hmtc_standard_url.replace(/^\//, "") + ".md")
    if (!fs.existsSync(standardPage)) errors.push(`${event.event_id}: published standard link is missing (${comparison.hmtc_standard_url})`)
  }
}

for (const event of feed.events) {
  if (event.verification.state !== "verified-primary") errors.push(`${event.event_id}: public feed includes non-primary evidence`)
  if (Object.hasOwn(event, "gaps")) errors.push(`${event.event_id}: internal gap text leaked into public feed`)
}
if (/Open evidence gap|unverified gap means/i.test(hub)) errors.push("internal research-queue language leaked into the public experience")
if (!hub.includes("Direct law-to-HMTc comparisons") || !hub.includes("Executive action register")) errors.push("public hub lacks the action and numerical-comparison surfaces")

const seoTitles = new Set()
const descriptions = new Set()
for (const slug of expectedSlugs) {
  const file = path.join(specDir, `${slug}.json`)
  if (!fs.existsSync(file)) { errors.push(`${slug}: missing article spec`); continue }
  const spec = JSON.parse(fs.readFileSync(file, "utf8"))
  for (const key of ["seoTitle","description","socialDescription","published","modified","evidence_verified","series","series_url"]) if (!spec[key]) errors.push(`${slug}: missing ${key}`)
  if (!Array.isArray(spec.event_ids) || !spec.event_ids.length) errors.push(`${slug}: missing event_ids`)
  if (!Array.isArray(spec.isBasedOn) || !spec.isBasedOn.length) errors.push(`${slug}: missing isBasedOn`)
  if (!Array.isArray(spec.citation) || !spec.citation.length) errors.push(`${slug}: missing citation`)
  if (seoTitles.has(spec.seoTitle)) errors.push(`${slug}: duplicate seoTitle`)
  if (descriptions.has(spec.description)) errors.push(`${slug}: duplicate description`)
  seoTitles.add(spec.seoTitle); descriptions.add(spec.description)
  if (spec.description.length < 110 || spec.description.length > 170) errors.push(`${slug}: description should be 110-170 characters, found ${spec.description.length}`)
  if (!fs.existsSync(path.join(repo, "content/articles", `${slug}.md`))) errors.push(`${slug}: generated article missing`)
}

if (errors.length) {
  console.error(`regulatory:watch:check failed (${errors.length})`)
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}
console.log(`regulatory:watch:check ok: 23 leads reconciled privately, ${publicEvents.length} verified public events, ${impact.comparison_count} direct comparisons, 6 citable analyses`)
