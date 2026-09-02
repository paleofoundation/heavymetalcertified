import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"

const repo = process.cwd()
const snapshot = JSON.parse(fs.readFileSync(path.join(repo, "data/regulations/cert-regulatory-watch-snapshot.json"), "utf8"))
const impact = JSON.parse(fs.readFileSync(path.join(repo, "data/regulations/cert-regulatory-watch-impact.json"), "utf8"))
const events = new Map(snapshot.events.map((event) => [event.event_id, event]))
const impacts = new Map(impact.impacts.map((item) => [item.event_id, item]))

test("all 21 intake clusters have one audited disposition", () => {
  assert.equal(snapshot.events.length, 21)
  assert.deepEqual([...new Set(snapshot.events.map((event) => event.cluster))].sort((a, b) => a - b), Array.from({ length: 21 }, (_, index) => index + 1))
  for (const event of snapshot.events) assert.match(event.disposition, /^(full-article|hub-only|covered-existing|unverified-gap)$/)
})

test("only primary-verified events are eligible for public output", () => {
  const publicEvents = snapshot.events.filter((event) => event.public_eligible)
  assert.equal(publicEvents.length, 19)
  for (const event of publicEvents) assert.equal(event.verification.state, "verified-primary")
  assert.deepEqual(snapshot.events.filter((event) => !event.public_eligible).map((event) => event.event_id), [
    "rw-2026-20-thailand-food-contact",
    "rw-2026-21-echa-organotin-rumor",
  ])
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

test("India future fish-oil rule is verified and numerically compared", () => {
  const event = events.get("rw-2026-06-india-2026-amendment")
  assert.equal(event.status, "adopted-not-effective")
  assert.equal(event.dates.effective, "2026-12-01")
  assert.deepEqual(event.analytes, ["Pb", "Cd", "iAs", "tAs"])
  const item = impacts.get(event.event_id)
  assert.equal(item.impact_class, "future-binding-limit-candidate")
  const comparison = item.comparisons.find((candidate) => candidate.regulatory_limit_id === "in_fssai2026_ias_fish_oils_100")
  assert.equal(comparison.regulatory_value_ug_kg, 100)
  assert.equal(comparison.hmtc_value_ug_kg, 10)
  assert.equal(comparison.relation, "hmtc-stricter")
})

test("Vietnam health-supplement rule has exact species-preserving comparisons", () => {
  const event = events.get("rw-2026-11-vietnam-amendment")
  assert.equal(event.status, "in-force")
  assert.ok(event.analytes.includes("tAs"))
  assert.ok(event.analytes.includes("iAs"))
  const item = impacts.get(event.event_id)
  assert.equal(item.comparisons.length, 6)
  assert.equal(item.comparison_summary.hmtc_stricter, 6)
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

test("every numerical comparison is same-basis and never looser than law", () => {
  const comparisons = impact.impacts.flatMap((item) => item.comparisons)
  assert.equal(comparisons.length, 14)
  for (const comparison of comparisons) {
    assert.equal(comparison.basis_relation, "same-mass-fraction")
    assert.ok(["equal", "hmtc-stricter"].includes(comparison.relation))
    assert.ok(comparison.hmtc_value_ug_kg <= comparison.regulatory_value_ug_kg)
  }
})
