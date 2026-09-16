// Certification exports use only the compiled value and its disclosed source.
// Occurrence evidence never supplies a missing ceiling.
const clean = (s) => s ? String(s).replace(/\s+/g, " ").trim() : null
const numeric = (v) => typeof v === "number" && Number.isFinite(v) ? v : null
const PARENT_TOTAL = { iAs: "tAs", MeHg: "tHg", "Cr-VI": "Cr" }
const isPpbUnit = (unit) => /^(?:ug\/kg|µg\/kg|μg\/kg|ppb)$/i.test(unit || "")
function sourceUnit(cell, nativeBasis) {
  if (cell.unit) return String(cell.unit)
  const bases = [cell.basis, nativeBasis].filter(Boolean).map(String)
  // A descriptive cell basis must not hide a vetted record-level schema basis.
  if (bases.some((basis) => /dm2|dm²|per.area|TWO native bases|ug\/day|µg\/day|μg\/day/i.test(basis))) return null
  if (bases.some((basis) => /^(?:as_sold|as_sold_dry|as_consumed|dry_as_sold|drained_as_sold|powder_as_placed|prepared_for_feeding|reconstituted|wet_weight)$/.test(basis))) return "ug/kg"
  if (bases.some((basis) => /(?:ug|µg|μg)\/kg/i.test(basis))) return "ug/kg"
  return null
}

export function normalizeCompiledCell(cell, nativeBasis, siblings = {}, analyte = "", visited = new Set()) {
  if (!cell || visited.has(analyte)) throw new Error(`Missing/cyclic compiled export cell: ${analyte}`)
  const trail = new Set(visited).add(analyte)
  const type = cell.type || cell.cell_kind || cell.provenance
  const unit = sourceUnit(cell, nativeBasis)
  const common = { value_record: numeric(cell.value), value_exact_record: numeric(cell.value_exact) ?? numeric(cell.value), unit, value_unit: unit || "compiled normalized units; see source basis", source_native_basis: nativeBasis, value_ppb: isPpbUnit(unit) ? numeric(cell.value) : null, value_exact_ppb: isPpbUnit(unit) ? numeric(cell.value_exact) ?? numeric(cell.value) : null, native_basis: nativeBasis, basis_note: cell.basis_note || cell.basis || null }
  const citation = { controlling_jurisdiction: cell.binding_jurisdiction || cell.source_jurisdiction || null, controlling_instrument: cell.binding_id || cell.source_id || null }
  let result
  if (type === "precautionary" || cell.provenance === "precautionary") {
    result = { ...common, status: "precautionary", control_basis: "precautionary", rationale_tag: "precautionary", sovereign_floor: cell.sovereign_floor || null, rationale: clean(cell.rationale || cell.label), ...citation }
  } else if (type === "subsumed" || cell.provenance === "subsumed") {
    const parent = cell.subsumed_by || cell.bounded_by
    if (!parent || !siblings[parent]) throw new Error(`Missing subsumption parent: ${analyte} -> ${parent || "missing"}`)
    if (PARENT_TOTAL[analyte] !== parent) throw new Error(`Invalid species parent: ${analyte} -> ${parent}`)
    const bound = normalizeCompiledCell(siblings[parent], nativeBasis, siblings, parent, trail)
    // Use the recorded parent value directly; do not estimate or aggregate it.
    const parentControls = ["control", "not_material"].includes(bound.status)
    if (numeric(cell.value) != null && (parentControls || bound.value_record == null)) throw new Error(`Numeric species bound lacks a numeric parent ceiling: ${analyte} -> ${parent}`)
    if (numeric(cell.value) != null && common.unit !== bound.unit) throw new Error(`Species and parent units differ: ${analyte} -> ${parent}`)
    const value = parentControls ? null : numeric(cell.value) ?? bound.value_record
    if (value != null && bound.value_record != null && value > bound.value_record) throw new Error(`Species ceiling exceeds parent: ${analyte} > ${parent}`)
    result = { ...common, unit: bound.unit, value_unit: bound.value_unit, value_record: value, value_exact_record: value, value_ppb: isPpbUnit(bound.unit) ? value : null, value_exact_ppb: isPpbUnit(bound.unit) ? value : null, status: "subsumed", control_basis: "subsumed", rationale_tag: "subsumed", subsumed_by: parent, parent_limit_ppb: bound.value_ppb, parent_limit_of_record: bound.limit_of_record, rationale: clean(cell.rationale || cell.label), reference_method: cell.reference_method || null, controlling_jurisdiction: bound.controlling_jurisdiction || null, controlling_instrument: bound.controlling_instrument || bound.sovereign_floor?.id || null }
  } else if (["control", "not_material", "not-material"].includes(type)) {
    result = { ...common, status: type === "control" ? "control" : "not_material", control_basis: type === "control" ? "control" : "not-material", rationale_tag: type === "control" ? "control" : "not-material", rationale: clean(cell.control || cell.rationale || cell.label), reference_method: cell.reference_method || null, ...citation }
  } else if (type === "baseline_screen" || cell.provenance === "baseline-screen") {
    result = { ...common, status: "baseline_screen", control_basis: "baseline-screen-method-loq", rationale_tag: "baseline-screen", rationale: clean(cell.label || cell.no_pathway_rationale), reference_method: cell.reference_method || null, loq_source_id: cell.loq_source_id || null, ...citation }
  } else if (type === "form_split") {
    result = { ...common, status: "published", value_record: null, value_exact_record: null, value_ppb: null, value_exact_ppb: null, control_basis: "government-limit-form-split", rationale_tag: "regulatory-alignment", rationale: "Form-specific finalized government limits; each form retains its own value and citation.", ...citation, forms: (cell.forms || []).map((f) => ({ form: f.form, value_record: f.value, unit: sourceUnit(f, nativeBasis) || unit, value_unit: unit || "compiled normalized units; see source basis", source_native_basis: nativeBasis, value_ppb: isPpbUnit(sourceUnit(f, nativeBasis) || unit) ? f.value : null, basis: f.basis || nativeBasis, jurisdiction: f.binding_jurisdiction || null, instrument: f.binding_id || null })) }
  } else if (type === "screen" || (cell.screen === true && ["gov", "regulatory-alignment", "read_across", "read-across"].includes(type))) {
    const isReadAcross = cell.provenance === "read-across"
    result = { ...common, status: "screen", control_basis: isReadAcross ? "government-read-across" : "government-limit", rationale_tag: cell.provenance || "regulatory-alignment", rationale: clean(cell.label || cell.screen_note), screen_note: cell.screen_note || null, reference_method: cell.reference_method || null, ...citation }
  } else if (["read_across", "read-across"].includes(type)) {
    if (cell.basis_kind === "occurrence") throw new Error(`Retired occurrence-derived export cell: ${analyte}`)
    result = { ...common, status: "published", control_basis: "government-read-across", rationale_tag: "read-across", rationale: clean(cell.label || cell.rationale), ...citation }
  } else if (["gov", "regulatory-alignment"].includes(type)) {
    result = { ...common, status: "published", control_basis: "government-limit", rationale_tag: "regulatory-alignment", rationale: "Strictest applicable finalized government maximum level on the row's native basis (Method v2.0).", ...citation, per_country: cell.per_country && Object.keys(cell.per_country).length ? cell.per_country : undefined }
  } else {
    throw new Error(`Unsupported compiled export kind: ${analyte}/${type || "missing"}`)
  }
  // Forms have priority over every summary scalar. Each remains independently addressable.
  result.limit_of_record = result.forms?.length ? result.forms.map((f) => `${f.form}: ${f.value_record} ${f.unit || "compiled normalized units; see source basis"}`).join("; ")
    : result.value_record != null ? `${result.value_record} ${result.value_unit}; ${result.control_basis}`
    : result.status === "subsumed" ? `Bounded by ${result.subsumed_by}: ${result.parent_limit_of_record}`
    : result.reference_method || result.rationale || "Unresolved source: mint blocked"

  return result
}

export function isFirmExportCell(cell) {
  if (!["published", "precautionary", "subsumed", "baseline_screen"].includes(cell.status)) return false
  if (cell.status === "baseline_screen" && (!cell.reference_method || !cell.loq_source_id)) return false
  if (cell.forms?.length) return cell.forms.every((form) => numeric(form.value_record) != null)
  return numeric(cell.value_record ?? cell.value_ppb) != null
}
