import test from "node:test"
import assert from "node:assert/strict"
import { normalizeCompiledCell as normalize, isFirmExportCell } from "../lib/standard-export-cell.mjs"

test("precautionary values use the same ppb field consumed by CSV", () => {
  const c = normalize({ type: "precautionary", value: 15, sovereign_floor: { value: 20, id: "fixture" }, rationale: "Existing retained value" }, "as_sold")
  assert.equal(c.value_ppb, 15)
  assert.equal(c.control_basis, "precautionary")
  assert.match(c.limit_of_record, /15/)
})
test("subsumed species copies only its recorded parent ceiling", () => {
  const siblings = { tAs: { type: "read_across", value: 100, source_id: "fixture" }, iAs: { type: "subsumed", subsumed_by: "tAs" } }
  const c = normalize(siblings.iAs, "as_sold", siblings, "iAs")
  assert.equal(c.value_ppb, 100)
  assert.equal(c.control_basis, "subsumed")
  assert.equal(c.controlling_instrument, "fixture")
})
test("a control-bound species gets a disclosed condition without an invented number", () => {
  const siblings = { tHg: { type: "control", reference_method: "Recorded method and review condition" }, MeHg: { type: "subsumed", subsumed_by: "tHg" } }
  const c = normalize(siblings.MeHg, "as_sold", siblings, "MeHg")
  assert.equal(c.value_ppb, null)
  assert.match(c.limit_of_record, /Bounded by tHg: Recorded method/)
})
test("missing, cyclic or incoherent parents fail closed", () => {
  assert.throws(() => normalize({ type: "subsumed", subsumed_by: "tAs" }, "as_sold", {}, "iAs"), /Missing subsumption parent/)
  const cyclic = { tAs: { type: "subsumed", subsumed_by: "iAs" }, iAs: { type: "subsumed", subsumed_by: "tAs" } }
  assert.throws(() => normalize(cyclic.iAs, "as_sold", cyclic, "iAs"), /Invalid species parent|cyclic/)
  assert.throws(() => normalize({ type: "subsumed", value: 20, subsumed_by: "tAs" }, "as_sold", { tAs: { type: "gov", value: 10 } }, "iAs"), /exceeds parent/)
})
test("form-specific limits retain every recorded form without computing an envelope", () => {
  const c = normalize({ cell_kind: "form_split", value: 10, strictest_form_value: 10, forms: [{ form: "A", value: 10, binding_id: "source-a" }, { form: "B", value: 30, binding_id: "source-b" }] }, "as_sold")
  assert.equal(c.value_ppb, null)
  assert.equal(c.value_record, null)
  assert.deepEqual(c.forms.map((f) => f.value_ppb), [10, 30])
  assert.match(c.limit_of_record, /A: 10.*B: 30/)
})
test("screen and control provenance survives export", () => {
  const s = normalize({ type: "screen", provenance: "read-across", value: 50, source_id: "screen-source" }, "migration")
  assert.equal(s.status, "screen")
  assert.equal(s.control_basis, "government-read-across")
  const c = normalize({ type: "control", reference_method: "Named existing method" }, "as_sold")
  assert.equal(c.value_ppb, null)
  assert.equal(c.control_basis, "control")
  assert.equal(c.limit_of_record, "Named existing method")
  assert.throws(() => normalize({ type: "read_across", basis_kind: "occurrence", value: 5 }, "as_sold"), /Retired/)
})

test("species-parent mapping is fixed and a control cannot supply a numeric species ceiling", () => {
  assert.throws(() => normalize({ type: "subsumed", subsumed_by: "Cd" }, "as_sold", { Cd: { type: "gov", value: 10 } }, "iAs"), /Invalid species parent/)
  assert.throws(() => normalize({ type: "subsumed", subsumed_by: "tHg", value: 10 }, "as_sold", { tHg: { type: "control", value: 20 } }, "MeHg"), /lacks a numeric parent ceiling/)
  assert.throws(() => normalize({ type: "subsumed", subsumed_by: "tHg", value: 10 }, "as_sold", { tHg: { type: "gov", value: null } }, "MeHg"), /lacks a numeric parent ceiling/)
})
test("per-area and daily-dose source units never become ppb", () => {
  for (const unit of ["ug/dm2", "ug/day"]) {
    const c = normalize({ type: "gov", value: 9, unit }, "source native basis")
    assert.equal(c.value_record, 9)
    assert.equal(c.value_ppb, null)
    assert.equal(c.unit, unit)
    assert.match(c.limit_of_record, new RegExp(unit))
  }
})
test("ambiguous mg/kg basis cannot relabel a normalized source value", () => {
  const basis = "total content of the component, expressed as mg/kg"
  const c = normalize({ type: "read_across", value: 90000 }, basis)
  assert.equal(c.value_record, 90000)
  assert.equal(c.value_ppb, null)
  assert.equal(c.unit, null)
  assert.equal(c.source_native_basis, basis)
  assert.match(c.limit_of_record, /90000 compiled normalized units/)
  assert.doesNotMatch(c.limit_of_record, /90000 mg\/kg/)
})
test("firm-cell counts exclude screens and controls, retain separate published forms", () => {
  assert.equal(isFirmExportCell(normalize({ type: "screen", value: 50 }, "as_sold")), false)
  assert.equal(isFirmExportCell(normalize({ type: "control", value: 50 }, "as_sold")), false)
  assert.equal(isFirmExportCell(normalize({ cell_kind: "form_split", strictest_form_value: 10, forms: [{ form: "A", value: 10 }, { form: "B", value: 30 }] }, "as_sold")), true)
})

test("descriptive cell basis preserves the vetted record unit; baseline screens need named methods", () => {
  assert.equal(normalize({ type: "gov", value: 5000, basis: "as sold, dry matcha powder" }, "as_sold").value_ppb, 5000)
  assert.equal(isFirmExportCell(normalize({ type: "baseline_screen", value: 2 }, "as_sold")), false)
  assert.equal(isFirmExportCell(normalize({ type: "baseline_screen", value: 2, reference_method: "Named source method", loq_source_id: "source-1" }, "as_sold")), true)
})

test("the locked antimony cell exports 30000 ug/kg as a government floor", () => {
  const c = normalize({
    type: "gov",
    disposition: "government-floor",
    value: 30000,
    value_exact: 30000,
    pass_fail: true,
    unit: "ug/kg",
    voluntary: true,
    binding_jurisdiction: "EU",
    binding_id: "eu_2023_1809_ahp_7_3_8",
    provenance: "regulatory-alignment. Antimony < 30 mg/kg. https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32023D1809",
  }, "finished product, total antimony content, measurable directly on a wipe (ug/kg)", {}, "Sb")
  assert.equal(c.status, "published")
  assert.equal(c.value_ppb, 30000)
  assert.equal(c.value_exact_ppb, 30000)
  assert.equal(c.control_basis, "government-limit")
  assert.equal(c.controlling_instrument, "eu_2023_1809_ahp_7_3_8")
  assert.equal(isFirmExportCell(c), true)
})

test("a pending cell exports no ceiling and cannot pass or fail", () => {
  const c = normalize({
    type: "pending",
    pending: true,
    pass_fail: false,
    value: null,
    value_exact: null,
    unit: "ug/kg",
    pending_marker: "PENDING CEO DECISION",
    label: "PENDING CEO DECISION. Excluded from pass/fail until a value is set.",
  }, "finished cosmetic as placed on market (total content, ug/kg of product as sold)", {}, "Sb")
  assert.equal(c.status, "pending")
  assert.equal(c.value_ppb, null)
  assert.equal(c.value_record, null)
  assert.equal(c.pass_fail, false)
  assert.equal(c.control_basis, "excluded-from-pass-fail")
  assert.equal(isFirmExportCell(c), false)
  const leaked = normalize({ type: "pending", pending: true, pass_fail: false, value: 30, unit: "ug/kg" }, "as_sold", {}, "Sb")
  assert.equal(leaked.value_ppb, null)
  assert.equal(isFirmExportCell(leaked), false)
  assert.throws(() => normalize({ type: "pending", pass_fail: true, value: 30 }, "as_sold", {}, "Sb"), /cannot be included in pass\/fail/)
})

test("the screen flag preserves screening even in a provenance-schema record", () => {
  const c = normalize({ provenance: "regulatory-alignment", screen: true, value: 50 }, "as_sold")
  assert.equal(c.status, "screen")
  assert.equal(isFirmExportCell(c), false)
  const control = normalize({ type: "control", screen: true, reference_method: "Method" }, "as_sold")
  assert.equal(control.status, "control")
})
