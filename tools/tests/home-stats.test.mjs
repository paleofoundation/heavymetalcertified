import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import {
  CLAIM_TOTALS,
  evaluateClaimSurface,
} from "../lib/claim-surface.mjs"
import {
  assertHomeStats,
  computeHomeStats,
  countFirmAnalyteLimits,
  currentEditionYear,
  isGovFloorOrReadAcross,
  isInForcePage,
  productionDoi,
} from "../lib/home-stats.mjs"

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..")

const completeCells = () => ({
  Pb: { type: "gov", value: 20 },
  tAs: { type: "gov", value: 30 },
  Cd: { type: "read_across", value: 10 },
  tHg: { type: "gov", value: 5 },
  Ni: { type: "gov", value: 100 },
  Sn: { type: "gov", value: 200 },
  Al: { type: "gov", value: 50 },
  Cr: { type: "gov", value: 15 },
})

test("gov_floor and read_across numeric cells count; TODO and empty kinds do not", () => {
  assert.equal(isGovFloorOrReadAcross({ type: "gov", value: 20 }), true)
  assert.equal(isGovFloorOrReadAcross({ type: "read_across", value: 20 }), true)
  assert.equal(isGovFloorOrReadAcross({ type: "form_split", value: 200, strictest_form_value: 200 }), true)
  assert.equal(isGovFloorOrReadAcross({ type: "special", value: 20 }), false)
  assert.equal(isGovFloorOrReadAcross({ type: "subsumed", value: null, binding_total: 50 }), false)
  assert.equal(isGovFloorOrReadAcross({ type: "monitored", value: null }), false)
  assert.equal(isGovFloorOrReadAcross({ type: "control", value: null }), false)
  assert.equal(isGovFloorOrReadAcross({ type: "not_material", value: null }), false)
  assert.equal(isGovFloorOrReadAcross({ type: "gov", value: "TODO" }), false)
  assert.equal(isGovFloorOrReadAcross({ type: "TODO", value: 20 }), false)
  assert.equal(isGovFloorOrReadAcross({ type: "gov", value: "" }), false)
  assert.equal(
    countFirmAnalyteLimits({
      Pb: { type: "gov", value: 20 },
      iAs: { type: "monitored", value: null },
      Sn: { type: "TODO", value: "TODO" },
      Al: { type: "form_split", forms: [{ value: 10 }, { value: 30 }], strictest_form_value: 10 },
    }),
    2,
  )
})

test("in-force pages exclude draft, scaffold, finder, and in-development", () => {
  assert.equal(isInForcePage({ slug: "olive-oil", type: "standard" }), true)
  assert.equal(isInForcePage({ slug: "butter-and-ghee", type: "standard-in-development" }), false)
  assert.equal(isInForcePage({ slug: "draft-row", type: "draft" }), false)
  assert.equal(isInForcePage({ slug: "scaffold-row", type: "scaffold" }), false)
  assert.equal(isInForcePage({ slug: "finder", type: "standards-finder" }), false)
  assert.equal(isInForcePage({ slug: "index", type: "standards-index" }), false)
  assert.equal(isInForcePage({ slug: "index", type: "standard" }), false)
})

test("sandbox DOIs are not live production DOIs", () => {
  assert.equal(productionDoi("10.83138/hmtc.std.33.chocolate"), "10.83138/hmtc.std.33.chocolate")
  assert.equal(productionDoi("10.5072/example"), null)
  assert.equal(productionDoi("null"), null)
  assert.equal(productionDoi(""), null)
})

test("edition year comes from manuals manifest, not a hardcoded homepage year", () => {
  assert.equal(currentEditionYear({ manuals: [{ edition: "2026" }, { edition: "2026 Edition" }] }), "2026")
  assert.throws(() => currentEditionYear({ manuals: [] }), /no program edition/)
})

test("fixture corpus: incomplete chocolate-style row is not carrying a firm limit", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "home-stats-"))
  const contentDir = path.join(root, "content")
  const dataDir = path.join(root, "data")
  const compiledDir = path.join(dataDir, "cat33-compiled")
  fs.mkdirSync(contentDir, { recursive: true })
  fs.mkdirSync(compiledDir, { recursive: true })
  fs.writeFileSync(path.join(dataDir, "cat33-pages.json"), JSON.stringify({
    _meta: { category: 33, panel: [...CLAIM_TOTALS] },
    pages: [],
  }))
  fs.writeFileSync(path.join(contentDir, "complete-oil.md"), "---\ntype: standard\ncert_doi: \"10.83138/hmtc.std.30.complete-oil\"\n---\n")
  fs.writeFileSync(path.join(contentDir, "chocolate.md"), "---\ntype: standard\ncert_doi: null\n---\n")
  fs.writeFileSync(path.join(contentDir, "draft-row.md"), "---\ntype: standard-in-development\n---\n")
  fs.writeFileSync(path.join(contentDir, "finder.md"), "---\ntype: standards-finder\n---\n")
  fs.writeFileSync(path.join(compiledDir, "complete-oil.json"), JSON.stringify({
    slug: "complete-oil",
    name: "Complete oil",
    category: 30,
    cells: completeCells(),
  }))
  fs.writeFileSync(path.join(compiledDir, "chocolate.json"), JSON.stringify({
    slug: "chocolate",
    name: "Chocolate",
    category: 33,
    cells: {
      Pb: { type: "form_split", value: 200, strictest_form_value: 200, forms: [{ value: 200 }, { value: 400 }] },
      tAs: { type: "form_split", value: 200, strictest_form_value: 200 },
      Cd: { type: "form_split", value: 100, strictest_form_value: 100 },
      tHg: { type: "gov", value: 50 },
      Ni: { type: "form_split", value: 2500, strictest_form_value: 2500 },
      Sn: { type: "not_material", value: null },
      Al: { type: "not_material", value: null },
      Cr: { type: "control", value: null },
      iAs: { type: "control", value: null },
    },
  }))

  const manualsPath = path.join(root, "manifest.json")
  fs.writeFileSync(manualsPath, JSON.stringify({ manuals: [{ edition: "2026", status: "published" }] }))

  const stats = computeHomeStats({ contentDir, dataDir, manualsPath, now: new Date("2026-09-19T12:00:00Z") })
  assert.equal(stats.metrics.subcategory_standards_in_force, 2)
  assert.equal(stats.metrics.carrying_firm_limit, 1)
  assert.equal(stats.exclusions.chocolate_carrying_firm_limit, false)
  assert.equal(evaluateClaimSurface({
    slug: "chocolate",
    cells: JSON.parse(fs.readFileSync(path.join(compiledDir, "chocolate.json"), "utf8")).cells,
  }).complete, false)
  assert.equal(stats.metrics.firm_analyte_limits, 8 + 5) // complete 8 totals + chocolate's 5 gov/form_split
  assert.equal(stats.metrics.certified_analyte_panel, 8)
  assert.equal(stats.metrics.priority_metals, 8)
  assert.equal(stats.metrics.live_dois, 1)
  assert.equal(stats.metrics.current_edition, "2026")
  assert.equal(stats.as_of, "2026-09-19")
  assert.ok(stats.metrics.subcategory_standards_in_force >= 0)
  assert.ok(stats.metrics.carrying_firm_limit >= 0)
  assert.ok(stats.metrics.firm_analyte_limits >= 0)
  assertHomeStats(stats)
  fs.rmSync(root, { recursive: true, force: true })
})

test("live corpus: counts are non-negative and chocolate is not carrying a firm limit", () => {
  const stats = computeHomeStats({
    contentDir: path.join(REPO, "content/standards"),
    dataDir: path.join(REPO, "data/standards"),
    manualsPath: path.join(REPO, "data/manuals/manifest.json"),
  })
  assertHomeStats(stats)
  assert.ok(stats.metrics.subcategory_standards_in_force >= 0)
  assert.ok(stats.metrics.carrying_firm_limit >= 0)
  assert.ok(stats.metrics.firm_analyte_limits >= 0)
  assert.ok(stats.metrics.live_dois >= 0)
  assert.equal(stats.metrics.certified_analyte_panel, CLAIM_TOTALS.length)
  assert.notEqual(stats.metrics.certified_analyte_panel, 10)
  assert.equal(stats.exclusions.chocolate_carrying_firm_limit, false)
})
