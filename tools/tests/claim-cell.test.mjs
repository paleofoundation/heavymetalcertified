import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import {
  cellState,
  classifyLimitDisplay,
  isFirmNumeric,
  isIncompleteNM,
  pdfLimitDisplay,
  requiresNumericIas,
} from "../lib/claim-cell.mjs"

test("subsumed + value:null is EMPTY, not COMPLETE/bounded", () => {
  assert.equal(cellState({ type: "subsumed", value: null, provenance: "subsumed", subsumed_by: "tAs" }), "EMPTY")
  assert.equal(isFirmNumeric({ type: "subsumed", value: null, subsumed_by: "tAs" }), false)
})

test("monitored is EMPTY even with a number", () => {
  assert.equal(cellState({ type: "monitored", value: 10 }), "EMPTY")
  assert.equal(cellState({ cell_kind: "monitored", value: null }), "EMPTY")
})

test("null / missing / control / not_material are EMPTY", () => {
  assert.equal(cellState(null), "EMPTY")
  assert.equal(cellState({ type: "gov", value: null }), "EMPTY")
  assert.equal(cellState({ type: "control", value: null }), "EMPTY")
  assert.equal(cellState({ type: "not_material", value: null }), "EMPTY")
})

test("gov and read-across with a number are firm", () => {
  assert.equal(cellState({ type: "gov", value: 20, binding_jurisdiction: "EU" }), "firm")
  assert.equal(cellState({ type: "read_across", value: 20, source_jurisdiction: "EU" }), "firm")
  assert.equal(cellState({ type: "screen", value: 1000 }), "firm")
})

test("LIMIT display: monitored/subsumed/dashes/empty fail; numbers pass", () => {
  assert.equal(classifyLimitDisplay(""), "empty")
  assert.equal(classifyLimitDisplay("—"), "dash")
  assert.equal(classifyLimitDisplay("&mdash;"), "dash")
  assert.equal(classifyLimitDisplay("bounded"), "subsumed")
  assert.equal(classifyLimitDisplay("subsumed"), "subsumed")
  assert.equal(classifyLimitDisplay("monitored"), "monitored")
  assert.equal(classifyLimitDisplay("control"), "control")
  assert.equal(classifyLimitDisplay("n/m"), "empty")
  assert.equal(classifyLimitDisplay("20"), null)
  assert.equal(classifyLimitDisplay("20 rice / 20 non-rice"), null)
})

test("incomplete N/M headers fail; complete N==M does not", () => {
  assert.equal(isIncompleteNM(8, 11), true)
  assert.equal(isIncompleteNM(9, 9), false)
  assert.equal(isIncompleteNM(11, 11), false)
})

test("rice / infant / baby cereal / Cat-1 require numeric iAs", () => {
  assert.equal(requiresNumericIas({ category: 1, slug: "fruit-purees" }), true)
  assert.equal(requiresNumericIas({ slug: "baby-cereals-dry", name: "Baby cereals" }), true)
  assert.equal(requiresNumericIas({ slug: "rice-bulk-grain", name: "Rice: bulk grain" }), true)
  assert.equal(requiresNumericIas({ slug: "breakfast-cereal-rice-based" }), true)
  assert.equal(requiresNumericIas({ slug: "flour-non-rice", name: "Flour (non-rice)" }), false)
  assert.equal(requiresNumericIas({ slug: "vinegar", name: "Vinegar (distilled, wine, balsamic, cider, rice)", category: 32 }), false)
  assert.equal(requiresNumericIas({ slug: "baby-shampoo-body-wash", category: 2 }), false)
})

test("PDF LIMIT column treats subsumed/null as a banned display", () => {
  assert.equal(classifyLimitDisplay(pdfLimitDisplay({ type: "subsumed", value: null, subsumed_by: "tAs" })), "empty")
  assert.equal(classifyLimitDisplay(pdfLimitDisplay({ type: "gov", value: 20 })), null)
})

test("known bug fixture: coffee iAs subsumed+null is no longer COMPLETE", () => {
  const rec = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data/standards/cat5-compiled/coffee.json"), "utf8"))
  const ias = rec.cells?.iAs || rec.iAs
  assert.equal(ias.type, "subsumed")
  assert.equal(ias.value, null)
  assert.equal(cellState(ias), "EMPTY")
})
