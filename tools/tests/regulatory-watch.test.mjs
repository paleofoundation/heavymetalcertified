import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"

const repo = process.cwd()
const snapshot = JSON.parse(fs.readFileSync(path.join(repo, "data/regulations/cert-regulatory-watch-snapshot.json"), "utf8"))
const impact = JSON.parse(fs.readFileSync(path.join(repo, "data/regulations/cert-regulatory-watch-impact.json"), "utf8"))
const events = new Map(snapshot.events.map((event) => [event.event_id, event]))
const impacts = new Map(impact.impacts.map((item) => [item.event_id, item]))

test("all 21 intake clusters have one public disposition", () => {
  assert.equal(snapshot.events.length, 21)
  assert.deepEqual([...new Set(snapshot.events.map((event) => event.cluster))].sort((a, b) => a - b), Array.from({ length: 21 }, (_, index) => index + 1))
  for (const event of snapshot.events) assert.match(event.disposition, /^(full-article|hub-only|covered-existing|unverified-gap)$/)
})

test("future amendment is not treated as a current binding limit", () => {
  const event = events.get("rw-2026-03-china-gb2762-2025")
  assert.equal(event.status, "adopted-not-effective")
  assert.equal(event.dates.effective, "2026-09-02")
  assert.equal(impacts.get(event.event_id).impact_class, "future-binding-limit-candidate")
})

test("multi-instrument Asian event preserves separate primary sources", () => {
  const event = events.get("rw-2026-07-korea-taiwan-hong-kong")
  assert.equal(event.instrument_ids.length, 3)
  assert.equal(event.official_sources.length, 3)
  assert.equal(impacts.get(event.event_id).impact_class, "testing-panel-or-analytical-method-change")
})

test("proposal and consultation events remain non-binding", () => {
  const event = events.get("rw-2026-12-echa-crvi-restriction")
  assert.equal(event.status, "consultation")
  assert.equal(impacts.get(event.event_id).impact_class, "context-with-no-direct-hmtc-change")
})

test("testing and non-food events cannot become food concentration changes", () => {
  assert.equal(impacts.get("rw-2026-15-california-crvi-water").impact_class, "testing-panel-or-analytical-method-change")
  assert.equal(impacts.get("rw-2026-16-eu-packaging-mercury").impact_class, "supply-chain-or-market-access-consequence")
})

test("species distinctions remain explicit", () => {
  const arsenic = events.get("rw-2026-01-eu-ias-seafood")
  assert.ok(arsenic.analytes.includes("iAs"))
  assert.ok(arsenic.analytes.includes("tAs"))
  for (const event of snapshot.events) assert.ok(!(event.analytes.includes("Cr-VI") && event.analytes.includes("Cr-total")))
})
