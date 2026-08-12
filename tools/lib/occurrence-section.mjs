// occurrence-section.mjs — shared renderer for the standards-page
// "Occurrence context and regulatory basis" section.
//
// Occurrence findings are cited one way to the Heavy Metal Index. Under the
// August 2026 Program Manual they are context only: they never select an initial
// certification limit or determine status. Initial HMTc values must resolve to a
// sovereign government maximum or disclosed regulatory read-across. The separate
// post-publication ratchet uses HMTc certified-lot data, not Index occurrence data.

import fs from "node:fs"

export function loadOccurrenceEvidence(dir) {
  try { return JSON.parse(fs.readFileSync(`${dir}/occurrence-evidence.json`, "utf8")) }
  catch { return { cells: {} } }
}

export function loadToxAnchors(dir) {
  try { return JSON.parse(fs.readFileSync(`${dir}/analyte-tox-anchors.json`, "utf8")) }
  catch { return { analytes: {} } }
}

const esc = (s) => String(s == null ? "" : s)
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
const round = (n, d = 0) => { const m = 10 ** d; return Math.round(n * m) / m }

function conc(ppb) {
  if (ppb == null) return null
  if (Math.abs(ppb) >= 1000) return `${round(ppb / 1000, ppb >= 100000 ? 0 : 1)} mg/kg`
  if (Math.abs(ppb) >= 100) return `${round(ppb, 0)} ppb`
  return `${round(ppb, ppb < 10 ? 1 : 0)} ppb`
}

const S = {
  h2: "font-family:Lora,serif;font-weight:400;font-size:30px;line-height:1.2;color:#2b1f1f;border-bottom:1px solid #e8e1db;padding-bottom:10px;margin:0 0 20px",
  lede: "font-size:13.5px;line-height:1.7;color:#736b6b;max-width:84ch;margin:0 0 22px",
  block: "margin:0 0 26px;padding:2px 0 2px 16px;border-left:2px solid #e4dcd5",
  label: "font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:.07em;text-transform:uppercase;color:#9a8f8f;margin:0 0 8px",
  p: "font-size:14.5px;line-height:1.7;color:#3f3a3a;max-width:84ch;margin:0 0 10px",
  figs: "font-family:'IBM Plex Mono',monospace;font-size:11.5px;color:#8a7f7f;margin:0 0 10px",
  a: "color:#1c43ad;text-decoration:none",
  none: "font-family:'IBM Plex Mono',monospace;font-size:11.5px;color:#b7aeae;margin:0",
}

function citeList(sources, max = 8) {
  const links = sources.slice(0, max).map((source) => {
    const href = source.doi_url || source.source_url
    const title = source.title ? ` title="${esc(source.title)}"` : ""
    return `<a href="${esc(href)}"${title} style="${S.a}">${esc(source.cite)}</a>`
  })
  const tail = sources.length > max ? ` and ${sources.length - max} more` : ""
  return links.join(", ") + tail
}

function fmtLimit(opts, der = {}) {
  if (opts.limitPpb != null) return conc(opts.limitPpb)
  if (opts.limitDisplay != null && opts.limitDisplay !== "") {
    const needsUnit = typeof opts.limitDisplay === "number" || /^\d/.test(String(opts.limitDisplay))
    const unit = opts.limitUnit ? ` ${opts.limitUnit}` : (needsUnit ? " ppb" : "")
    return `${opts.limitDisplay}${unit}`
  }
  if (der.government_ml && der.government_ml.value_ppb != null) return conc(der.government_ml.value_ppb)
  if (der.read_across && der.read_across.value_ppb != null) return conc(der.read_across.value_ppb)
  return null
}

function withoutRetiredSelectionProse(value) {
  const text = String(value || "").trim()
  if (!text) return text
  const retiredTag = ["literature", "baseline"].join("-")
  return text
    .split(/(?<=[.!?])\s+/)
    .filter((sentence) => !/\bp(?:45|97)\b|pooled percentile|occurrence[- ](?:set|selected) limit/i.test(sentence)
      && !sentence.toLowerCase().includes(retiredTag))
    .join(" ")
    .trim()
}

function occurrenceHtml(occ, nameLc, category, isNotMaterial, published) {
  const nStudies = occ.n_studies || 0
  const nSamples = occ.n_samples
  const studyWord = nStudies === 1 ? "study" : "studies"
  const observedMax = occ.observed_max_ppb
  const unverifiedDevelopmentPool = published === false && observedMax == null
  const poolOk = !!(occ.pool && !unverifiedDevelopmentPool
    && (observedMax == null
      || ((occ.pool.p50 == null || occ.pool.p50 <= observedMax)
        && (occ.pool.p95 == null || occ.pool.p95 <= observedMax))))

  if (!occ.has_data || nStudies === 0) {
    return `<p style="${S.none}">No citable primary occurrence measurement is routed to this cell in the contextual corpus.</p>`
  }

  const cites = citeList(occ.sources || [])
  if (poolOk && !isNotMaterial) {
    const median = conc(occ.pool.p50)
    const p95 = conc(occ.pool.p95)
    const showMax = observedMax != null && (occ.pool.p95 == null || occ.pool.p95 <= observedMax)
    const maxClause = showMax ? `, with a measured maximum of ${conc(observedMax)}` : ""
    const sampleText = nSamples != null ? ` across ${nSamples} literature samples` : ""
    const medianBelowFloor = occ.pool.p50 != null && round(occ.pool.p50, 1) === 0
    const medianProse = medianBelowFloor ? "a median below the reporting floor" : `a median of ${median}`
    const medianFigure = medianBelowFloor ? "median &lt;floor" : `median ${median}`
    return `<p style="${S.p}">${nStudies} ${studyWord} in the contextual corpus measured ${esc(nameLc)} in ${esc(category)}${sampleText}. The descriptive distribution centres on ${medianProse} and reaches ${p95} at the 95th percentile${maxClause}. ${cites}.</p>`
      + `<div style="${S.figs}">${nStudies} ${studyWord}${nSamples != null ? ` · ${nSamples} samples` : ""} · ${medianFigure} · P95 ${p95} · context only</div>`
  }

  const measurementWord = nStudies === 1 ? "measurement" : "measurements"
  const sampleText = nSamples != null ? ` (${nSamples} samples reported across those studies)` : ""
  const frame = isNotMaterial
    ? `The contextual corpus holds ${nStudies} ${measurementWord} of ${esc(nameLc)} in ${esc(category)}${sampleText}, against which the determination below can be checked`
    : `${nStudies} ${studyWord} in the contextual corpus measured ${esc(nameLc)} in ${esc(category)}${sampleText}`
  let observedClause = ""
  const observedMin = occ.observed_min_ppb
  const observedMedian = occ.observed_median_ppb
  if (observedMin != null && observedMax != null && observedMax > observedMin) {
    observedClause = ` Reported concentrations range from ${conc(observedMin)} to ${conc(observedMax)}${observedMedian != null ? `, with a typical value of ${conc(observedMedian)}` : ""}.`
  } else if (observedMax != null) {
    observedClause = ` Reported concentrations reach ${conc(observedMax)}.`
  }
  return `<p style="${S.p}">${frame}: ${cites}.${observedClause}</p>`
    + `<div style="${S.figs}">${nStudies} ${studyWord}${nSamples != null ? ` · ${nSamples} samples` : ""} in the contextual corpus${observedMax != null ? ` · measured max ${conc(observedMax)}` : ""}</div>`
}

export function analyteOccurrenceBlock(opts) {
  const { cell, tox, analyte } = opts
  if (!cell) return ""
  const occ = cell.occurrence || {}
  const der = cell.derivation || {}
  const name = (tox && tox.name) || analyte
  const nameLc = name.charAt(0).toLowerCase() + name.slice(1)
  const category = cell.row_label ? cell.row_label.replace(/\s*\(.*?\)\s*$/, "") : "this category"
  const isNotMaterial = opts.isNotMaterial || !!der.not_material
  const context = occurrenceHtml(occ, nameLc, category, isNotMaterial, opts.published)
  const whyLink = tox && tox.page
    ? ` <a href="/analytes/${esc(tox.page)}" style="${S.a}">Why ${esc(nameLc)} is limited →</a>`
    : ""
  const stripDot = (value) => esc(String(value || "").replace(/\.\s*$/, ""))
  const government = opts.governmentMl || der.government_ml || null
  let rationale = ""

  if (isNotMaterial) {
    const nm = der.not_material || {}
    const basis = withoutRetiredSelectionProse(nm.rationale || opts.notMaterialProse)
      || "The analyte is controlled rather than capped with a standalone number."
    const referenceMethod = nm.reference_method || opts.notMaterialMethod || null
    const method = referenceMethod
      ? ` The control is ${stripDot(referenceMethod)}, not a standalone number.`
      : ""
    const contradiction = der.contradiction
      ? " The n/m determination is rebuttable and is checked against measured evidence and pathway chemistry."
      : ""
    rationale = `<p style="${S.p}">HMTc publishes no standalone ${esc(nameLc)} limit for ${esc(category)}. ${esc(basis)}${method}${contradiction}${whyLink}</p>`
  } else if (opts.published === false) {
    const governmentClause = government && government.value_ppb != null
      ? ` The current government crosswalk identifies ${conc(government.value_ppb)}; publication still awaits the remaining shipping gates and source verification.`
      : " The cell requires a documented sovereign read-across or an n/m determination before any firm value can publish."
    rationale = `<p style="${S.p}">No firm HMTc limit is published for ${esc(nameLc)} in ${esc(category)} yet.${governmentClause} Occurrence evidence cannot fill that gap.${whyLink}</p>`
  } else if (opts.basisKind === "read_across" || (der.read_across && opts.basisKind !== "government")) {
    const label = opts.readAcrossLabel || (der.read_across ? der.read_across.label : "")
    const value = fmtLimit(opts, der)
    rationale = `<p style="${S.p}">HMTc applies ${esc(value || "the disclosed value")} by regulatory read-across${label ? `: ${stripDot(label)}` : ""}.${whyLink}</p>`
  } else if (der.special) {
    const unit = der.special.unit && der.special.unit !== "ppb" ? ` ${esc(der.special.unit)}` : ""
    rationale = `<p style="${S.p}">HMTc applies ${esc(String(der.special.value))}${unit}: ${stripDot(der.special.label)}.${whyLink}</p>`
  } else if (government) {
    const value = fmtLimit(opts, der)
    const source = government.source ? ` Source: ${stripDot(government.source)}.` : ""
    rationale = `<p style="${S.p}">HMTc applies ${esc(value || "the published value")}: the strictest applicable sovereign government maximum for this product form, expressed in its native basis.${source}${whyLink}</p>`
  } else {
    rationale = `<p style="${S.p}">This cell has no verified government-limit or read-across basis in the current record, so no firm HMTc value may be asserted until that basis is resolved. Occurrence evidence remains contextual only.${whyLink}</p>`
  }

  return `<div style="${S.block}"><div style="${S.label}">${esc(name)}</div>${context}${rationale}</div>`
}

export function descriptorFromCompiledCell(cell, analyte) {
  const descriptor = { analyte }
  if (!cell) return descriptor
  const value = cell.value != null ? Number(cell.value) : null
  if (cell.type === "gov") {
    descriptor.basisKind = "government"
    descriptor.rationaleTag = "regulatory-alignment"
    if (value != null) descriptor.limitPpb = value
    descriptor.governmentMl = {
      value_ppb: value,
      source: cell.binding_id || "",
      jurisdiction: cell.binding_jurisdiction || null,
    }
  } else if (cell.type === "read_across") {
    if (cell.basis_kind === "occurrence" || cell.basis_kind === "precautionary") {
      descriptor.published = false
      descriptor.basisKind = "unresolved"
    } else {
      descriptor.basisKind = "read_across"
      descriptor.readAcrossLabel = cell.label || ""
      if (value != null) descriptor.limitPpb = value
    }
  } else if (cell.type === "not_material") {
    descriptor.isNotMaterial = true
    descriptor.notMaterialProse = cell.control || cell.rationale || ""
    descriptor.notMaterialMethod = cell.reference_method || null
  } else if (cell.type === "special") {
    descriptor.basisKind = "read_across"
    descriptor.readAcrossLabel = cell.label || ""
    if (value != null) descriptor.limitPpb = value
  }
  return descriptor
}

export function descriptorFromCatalogAnalyte(record, analyte) {
  const descriptor = { analyte }
  if (!record) return descriptor
  const legacyOccurrenceTag = ["literature", "baseline"].join("-")
  const retiredBasis = record.rationale_tag === legacyOccurrenceTag
    || record.rationale_tag === "precautionary"
    || record.rationale_tag === "feasibility-driven"
  descriptor.published = record.status === "published" && !retiredBasis
  if (descriptor.published && record.published_limit_ppb != null) {
    descriptor.limitPpb = Number(record.published_limit_ppb)
  }
  if (record.regulatory_cap_ppb != null) {
    descriptor.basisKind = "government"
    descriptor.rationaleTag = "regulatory-alignment"
    descriptor.governmentMl = {
      value_ppb: Number(record.regulatory_cap_ppb),
      source: record.regulatory_cap_source || "",
      jurisdiction: null,
    }
  } else if (retiredBasis) {
    descriptor.basisKind = "unresolved"
  }
  return descriptor
}

export function occurrenceRationaleSection(opts) {
  const { evidence, toxAnchors, rowSlug } = opts
  if (!evidence || !evidence.cells) return ""
  const blocks = []
  for (const analyte of opts.analytes || []) {
    const cell = evidence.cells[`${rowSlug}|${analyte.analyte}`]
    if (!cell) continue
    const tox = (toxAnchors && toxAnchors.analytes && toxAnchors.analytes[analyte.analyte]) || null
    const block = analyteOccurrenceBlock({ ...analyte, cell, tox })
    if (block) blocks.push(block)
  }
  if (!blocks.length) return ""
  return `<section id="occurrence-derivation" style="margin-bottom:52px">`
    + `<h2 style="${S.h2}">Occurrence context and regulatory basis</h2>`
    + `<p style="${S.lede}">For each analyte: what the peer-reviewed and survey literature measured, cited one way to the Heavy Metal Index, and the sovereign-government basis for the initial HMTc value. Index occurrence figures provide category context only; they never select the initial limit or determine status. Post-publication tightening follows the separate <a href="/program/ratchet" style="${S.a}">Standards Ratchet</a> using eligible HMTc certified-lot data.</p>`
    + blocks.join("")
    + `</section>`
}
