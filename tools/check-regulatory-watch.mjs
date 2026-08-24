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

if (snapshot.event_count !== 21 || snapshot.events.length !== 21) errors.push(`snapshot must reconcile 21 events, found ${snapshot.events.length}`)
if (impact.impacts.length !== snapshot.events.length) errors.push("impact count does not match snapshot")
if (feed.events.length !== snapshot.events.length) errors.push("feed count does not match snapshot")
for (const event of snapshot.events) {
  if (!hub.includes(`data-event-id="${event.event_id}"`)) errors.push(`${event.event_id}: missing from visible hub`)
  if (event.verification.state === "verified-primary" && !(event.official_sources || []).length) errors.push(`${event.event_id}: verified event lacks official source`)
  if (["proposed","consultation","monitor-only","litigation"].includes(event.status) && impact.impacts.find((item) => item.event_id === event.event_id)?.impact_class.includes("binding-limit")) errors.push(`${event.event_id}: non-final event treated as binding`)
  if (event.disposition === "full-article" && event.verification.state !== "verified-primary") errors.push(`${event.event_id}: full article is not primary-verified`)
}

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
console.log(`regulatory:watch:check ok: 21 tracker events, 6 citable analyses, feeds and visible hub agree`)
