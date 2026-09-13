import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { analyteOccurrenceBlock, descriptorFromCompiledCell, descriptorFromCatalogAnalyte } from "../lib/occurrence-section.mjs"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..")
const read = (file) => JSON.parse(fs.readFileSync(path.join(root, file), "utf8"))
const evidence = read("data/standards/occurrence-evidence.json")
const render = (descriptor, rowSlug, analyte) => analyteOccurrenceBlock({ ...descriptor, cell: evidence.cells[`${rowSlug}|${analyte}`], analyte })

for (const [slug, variant, value] of [["infant-formula-powder", "cow", 15], ["infant-formula-powder", "soy", 15], ["mixed-meals-non-rice", "both", 8], ["mixed-meals-rice-containing", "both", 8]]) {
  test(`${slug}/${variant}: authoritative precautionary tHg survives stale percentile snapshot`, () => {
    const cell = read(`data/standards/cat1-compiled/${slug}.json`).variants[variant].tHg
    const before = JSON.stringify(cell)
    const descriptor = descriptorFromCompiledCell(cell, "tHg")
    assert.equal(descriptor.limitPpb, value)
    assert.equal(descriptor.rationaleTag, "precautionary")
    const html = render(descriptor, slug, "tHg")
    assert.match(html, new RegExp(`HMTc sets ${value}(?:\\.0)? ppb \\(precautionary\\)`))
    assert.doesNotMatch(html, /literature-baseline|cleaner number|occurrence value binds|HMTc sets 1 mg\/kg|HMTc sets 2\.7 ppb/)
    assert.equal(JSON.stringify(cell), before)
  })
}

test("butter Pb government context never inherits literature-baseline", () => {
  const record = read("data/standards/hmtc_standards_catalog.json").rows.find((r) => r.product_slug === "butter-and-ghee").analytes.Pb
  const descriptor = descriptorFromCatalogAnalyte(record, "Pb")
  const html = render(descriptor, "butter-and-ghee", "Pb")
  assert.match(html, /100 ppb \(regulatory-alignment\)/)
  assert.doesNotMatch(html, /literature-baseline|HMTc sets/)
})

test("occurrence snapshot cannot supply compliance values or stale materiality", () => {
  const legacy = { row_label: "Fixture", occurrence: { has_data: false }, derivation: { rationale_tag: "literature-baseline", percentile: { label: "P97", value_ppb: 999 }, government_ml: { value_ppb: 100 }, not_material: { rationale: "Historical no standalone limit" } } }
  const html = analyteOccurrenceBlock({ cell: legacy, analyte: "Pb" })
  assert.doesNotMatch(html, /999|100 ppb|HMTc sets|Historical no standalone|literature-baseline/)
})

test("descriptive occurrence percentiles remain descriptive", () => {
  const cell = { row_label: "Fixture", occurrence: { has_data: true, n_studies: 1, n_samples: 20, sources: [], pool: { p50: 1, p95: 4 }, observed_max_ppb: 8 }, derivation: { rationale_tag: "literature-baseline", percentile: { label: "P97", value_ppb: 5 } } }
  const html = analyteOccurrenceBlock({ cell, analyte: "Pb", ...descriptorFromCompiledCell({ type: "gov", value: 10 }, "Pb") })
  assert.match(html, /95th percentile/)
  assert.match(html, /HMTc sets 10 ppb \(regulatory-alignment\)/)
  assert.doesNotMatch(html, /literature-baseline|occurrence value binds/)
})

test("retired source types fail closed rather than get relabeled", () => {
  assert.throws(() => descriptorFromCompiledCell({ type: "read_across", basis_kind: "occurrence", value: 9 }, "Pb"), /Retired occurrence-derived/)
  assert.throws(() => descriptorFromCatalogAnalyte({ status: "published", rationale_tag: "literature-baseline", published_limit_ppb: 9 }, "Pb"), /Retired occurrence-derived/)
})
