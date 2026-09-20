// occurrence-section.mjs  —  shared renderer for the standards-page
// "Occurrence & Derivation Rationale" section.
//
// One renderer, called by every standards-page generator (the three cert-repo
// generators and the two heavy-metal-index generators that write into the cert
// repo), so the section scales across every subcategory instead of being
// hand-authored per page.
//
// It consumes the firewall-clean snapshot data/standards/occurrence-evidence.json
// (exported one-way from the index by tools/evidence/export-cert-occurrence-evidence.mjs)
// plus data/standards/analyte-tox-anchors.json.
//
// FIREWALL (this is the CERT plane): the occurrence FINDINGS are cited one-way to
// the public index source pages; the DERIVATION (pooled percentile -> limit ->
// rationale) renders here and only here. Nothing this module emits may appear on
// a heavymetalindex.com URL.
//
// DESIGN CANON (docs/design-canon/CONTENT-RULES.md — BLOCKING on content/standards):
//   - NO bold: no <strong>/<b>, no font-weight >= 600. Emphasis is the type system.
//   - The limit value is rendered here as PLAIN prose, never the `data-firm-ppb`
//     marker or a **bold ppb** run — the firm pass/fail value is rendered exactly
//     once, in the master table, and firewall-cert-lint counts those. A second
//     firm render would break that count.

import fs from "node:fs"

export function loadOccurrenceEvidence(dir) {
  const p = `${dir}/occurrence-evidence.json`
  try { return JSON.parse(fs.readFileSync(p, "utf8")) } catch { return { cells: {} } }
}
export function loadToxAnchors(dir) {
  const p = `${dir}/analyte-tox-anchors.json`
  try { return JSON.parse(fs.readFileSync(p, "utf8")) } catch { return { analytes: {} } }
}

// ---------- formatting helpers ----------
const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
const round = (n, d = 0) => { const m = 10 ** d; return Math.round(n * m) / m }
// keep occurrence numbers readable: sub-mg/kg stays in ppb, larger switches to mg/kg
function conc(ppb) {
  if (ppb == null) return null
  if (Math.abs(ppb) >= 1000) return `${round(ppb / 1000, ppb >= 100000 ? 0 : 1)} mg/kg`
  if (Math.abs(ppb) >= 100) return `${round(ppb, 0)} ppb`
  return `${round(ppb, ppb < 10 ? 1 : 0)} ppb`
}
function rangeText(r) {
  if (!r || r[0] == null || r[1] == null) return null
  return `${conc(r[0])}–${conc(r[1])}`.replace(/ mg\/kg–/, "–") // collapse dup unit on same-unit range
}

// style tokens shared with the analyte / standards pages. The section-heading
// canon (docs/design-canon/CONTENT-RULES.md): Lora 30px, border-bottom 1px
// #e8e1db, pb 10px, mb 20px, top:0 — the 52px space ABOVE the heading comes from
// the preceding section's `margin-bottom:52px` wrapper, not the heading itself.
const S = {
  h2: "font-family:Lora,serif;font-weight:400;font-size:30px;line-height:1.2;color:#2b1f1f;border-bottom:1px solid #e8e1db;padding-bottom:10px",
  lede: "font-size:13.5px;line-height:1.7;color:#736b6b;max-width:84ch;margin:0 0 22px",
  block: "margin:0 0 26px;padding:2px 0 2px 16px;border-left:2px solid #e4dcd5",
  label: "font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:.07em;text-transform:uppercase;color:#9a8f8f;margin:0 0 8px",
  p: "font-size:14.5px;line-height:1.7;color:#3f3a3a;max-width:84ch;margin:0 0 10px",
  figs: "font-family:'IBM Plex Mono',monospace;font-size:11.5px;color:#8a7f7f;margin:0 0 10px",
  a: "color:#1c43ad;text-decoration:none",
  none: "font-family:'IBM Plex Mono',monospace;font-size:11.5px;color:#b7aeae;margin:0",
}

// inline one-way citation list -> body <a> tags (these feed the cert link graph)
function citeList(sources, max = 8) {
  const shown = sources.slice(0, max)
  const links = shown.map((s) => {
    const href = s.doi_url || s.source_url
    const title = s.title ? ` title="${esc(s.title)}"` : ""
    return `<a href="${esc(href)}"${title} style="${S.a}">${esc(s.cite)}</a>`
  })
  let tail = ""
  if (sources.length > max) tail = ` and ${sources.length - max} more`
  return links.join(", ") + tail
}

// ---------- per-analyte block ----------
// opts: { cell, tox, analyte, limitDisplay, limitUnit, isNotMaterial }
export function analyteOccurrenceBlock(opts) {
  const { cell, tox, analyte } = opts
  if (!cell) return ""
  const occ = cell.occurrence || {}
  const der = cell.derivation || {}
  const name = (tox && tox.name) || analyte
  const nameLc = name.charAt(0).toLowerCase() + name.slice(1)
  const category = cell.row_label ? cell.row_label.replace(/\s*\(.*?\)\s*$/, "") : "this category"
  // Compiled / generator cell is authoritative for whether a standalone limit
  // exists. A stale occurrence-export `not_material` ledger must not overwrite
  // a firm gov / read-across ceiling (olive-oil Cd 30 and tHg 20 were the
  // canary: claim table numeric, occurrence still said "no standalone limit").
  const compiledFirm = opts.limitPpb != null
    || opts.basisKind === "government"
    || opts.basisKind === "read_across"
    || (opts.governmentMl && opts.governmentMl.value_ppb != null)
  const isNM = compiledFirm ? false : (opts.isNotMaterial || !!der.not_material)

  // ---- 1. OCCURRENCE EVIDENCE ----
  let occHtml = ""
  const nStud = occ.n_studies || 0
  const nSamp = occ.n_samples
  const studyWord = nStud === 1 ? "study" : "studies"
  // When to show the pooled distribution. Trust it EXCEPT:
  //  (a) the observed maximum contradicts it (median or P95 above the largest
  //      value actually measured — a runaway/fitted-tail artifact: chocolate Cd
  //      P97 3.1 > max 2.3), or
  //  (b) the cell is an IN-DEVELOPMENT catalog cell with no observed anchor to
  //      verify against (salt Pb: pooled median 244 vs source-body values <=211,
  //      undetectable from the structured data). In-development cells assert no
  //      firm limit, so their unverified pooled occurrence is held back.
  // Firm/published cells with no observed anchor keep their vetted pooled figures.
  const obsMax = occ.observed_max_ppb
  const inDevUnverified = opts.published === false && obsMax == null
  const poolOk = !!(occ.pool && !inDevUnverified
    && (obsMax == null
      || ((occ.pool.p50 == null || occ.pool.p50 <= obsMax) && (occ.pool.p95 == null || occ.pool.p95 <= obsMax))))
  if (occ.has_data && nStud > 0) {
    const cites = citeList(occ.sources || [])
    if (poolOk && !isNM) {
      // material cell with a trusted pooled distribution: lead with the pooled
      // figures. The measured-maximum clause is added only when a per-study max
      // is known AND does not contradict P95 (never pool.p100, a fitted tail).
      const med = conc(occ.pool.p50)
      const p95 = conc(occ.pool.p95)
      const showMax = obsMax != null && (occ.pool.p95 == null || occ.pool.p95 <= obsMax)
      const maxClause = showMax ? `, with a measured maximum of ${conc(obsMax)}` : ""
      const sampTxt = nSamp != null ? ` across ${nSamp} certified-market samples` : ""
      const medZero = occ.pool.p50 != null && Math.round(occ.pool.p50 * 10) / 10 === 0
      const medProse = medZero ? "a median below the reporting floor" : `a median of ${med}`
      const medFig = medZero ? "median &lt;floor" : `median ${med}`
      occHtml =
        `<p style="${S.p}">${nStud} ${studyWord} in the certified-market pool measured ${esc(nameLc)} in ${esc(category)}${sampTxt}. `
        + `The pooled distribution centres on ${medProse} and reaches ${p95} at the 95th percentile${maxClause}. `
        + `${cites}.</p>`
      occHtml += `<div style="${S.figs}">${nStud} ${studyWord} · ${nSamp} samples · ${medFig} · P95 ${p95}</div>`
    } else {
      // not-material or no-pool cell: the corpus DOES hold measurements of the
      // analyte in this matrix — the "the category contains this metal" evidence.
      // Framed as "holds measurements ... tested against" so it never contradicts
      // a ledger rationale that finds no occurrence usable for setting a limit.
      const measWord = nStud === 1 ? "measurement" : "measurements"
      // "reported across those studies" — for a routed-source (non-pooled) cell
      // the sample count is each study's own total; some studies measure the
      // analyte across a broader product set that includes this category, so the
      // count must not be read as category-specific measurements.
      const sampTxt = nSamp != null ? ` (${nSamp} samples reported across those studies)` : ""
      const frame = isNM
        ? `The corpus holds ${nStud} ${measWord} of ${esc(nameLc)} in ${esc(category)}${sampTxt}, which the determination below is tested against`
        : `${nStud} ${studyWord} in the corpus measured ${esc(nameLc)} in ${esc(category)}${sampTxt}`
      // Observed range/central from the MEASURED values (never the pool, which
      // reached this branch precisely because it was not range-valid).
      let obsClause = ""
      const omin = occ.observed_min_ppb, omax = occ.observed_max_ppb, omed = occ.observed_median_ppb
      if (omin != null && omax != null && omax > omin) obsClause = ` Reported concentrations range from ${conc(omin)} to ${conc(omax)}${omed != null ? `, with a typical value of ${conc(omed)}` : ""}.`
      else if (omax != null) obsClause = ` Reported concentrations reach ${conc(omax)}.`
      occHtml = `<p style="${S.p}">${frame}: ${cites}.${obsClause}</p>`
      occHtml += `<div style="${S.figs}">${nStud} ${studyWord}${nSamp != null ? ` · ${nSamp} samples` : ""} in the corpus${omax != null ? ` · measured max ${conc(omax)}` : ""}</div>`
    }
  } else {
    // Either genuinely no routed occurrence, or the only routed sources were
    // non-primary (reviews / no reported sample count) and were filtered out —
    // "citable" covers both without overclaiming an empty corpus.
    occHtml = `<p style="${S.none}">No citable primary occurrence measurement is routed to this cell in the corpus.</p>`
  }

  // ---- 2. THE LIMIT + RATIONALE ----
  let ratHtml = ""
  const whyLink = tox && tox.page ? ` <a href="/analytes/${esc(tox.page)}" style="${S.a}">Why ${esc(nameLc)} is limited →</a>` : ""
  const twoPath = `<a href="/program/two-pathways" style="${S.a}">the two pathways</a>`

  const tag = opts.rationaleTag || der.rationale_tag || null
  const stripDot = (s) => esc(String(s || "").replace(/\.\s*$/, ""))
  // Authoritative derivation inputs come from the GENERATOR's own cell (which
  // renders the master-table value), not the occurrence export — the export's
  // government-ML field is only as complete as the pooled aggregate's reg-cap
  // column, so a null there means "not in the pool", NOT "no government limit".
  const govMl = opts.governmentMl || der.government_ml || null
  // The "no government sets a limit" claim requires a POSITIVE no-ML signal
  // (basisKind occurrence/precautionary from the generator's cell, or a
  // not-material ledger row), never mere absence in the aggregate.
  const noGov = !govMl && (opts.basisKind === "occurrence" || opts.basisKind === "precautionary")
  // The pooled percentile is display-usable unless (a) it exceeds the observed
  // maximum (a fitted-tail artifact), or (b) it is an in-development catalog cell
  // with no observed anchor to verify against — mirroring the occurrence rule.
  const pctOk = !!(der.percentile && der.percentile.value_ppb != null
    && !(opts.published === false && occ.observed_max_ppb == null)
    && (occ.observed_max_ppb == null || der.percentile.value_ppb <= occ.observed_max_ppb))
  // A pooled percentile rendered in prose, with a "(provisional)" flag when the
  // pool's sensitivity band is unstable (its upper tail is a modeled estimate).
  const pPct = (p) => `${conc(p.value_ppb)}${p.sens_band === "provisional" ? " (provisional)" : ""}`
  if (isNM) {
    // Prefer the substantiated not-material ledger rationale (CSV, adversarially
    // gated); fall back to the generator's compiled-cell prose.
    const nm = der.not_material || {}
    const rationale = nm.rationale || opts.notMaterialProse || ""
    const refMethod = nm.reference_method || opts.notMaterialMethod || null
    const method = refMethod ? ` The analyte is controlled by ${stripDot(refMethod)}, not a standalone number.` : ""
    // A bounded species (subsumed under a numeric parent total) is a hard arithmetic
    // bound, not a rebuttable presumption — the "not-material determination" contradiction
    // note never applies to it (Ruling S-DOI-OLIVE-FINISH-1 §1: parent-bound species are
    // bounded-complete, not not-material).
    const contra = der.contradiction && !opts.bounded
      ? ` A not-material determination is a rebuttable presumption; it is tested against the measured evidence above and rests on the chemistry, not on an absence of data.`
      : ""
    const body = rationale
      ? ` ${esc(rationale)}`
      : ` The analyte is controlled rather than capped with a standalone number.`
    ratHtml =
      `<p style="${S.p}">HMTc sets no standalone ${esc(nameLc)} limit for ${esc(category)}.${body}${method}${contra}${whyLink}</p>`
  } else if (opts.published === false) {
    // Catalog cell in development — the master table shows "—". Show the
    // government context and the pooled figure, but never assert a firm limit.
    const p = der.percentile
    let govClause = ""
    if (govMl && govMl.value_ppb != null) govClause = ` The strictest applicable government maximum level is ${conc(govMl.value_ppb)}${tag ? ` (${esc(tag)})` : ""}, which the certification limit will adopt.`
    else if (noGov && p) govClause = ` No government sets a maximum level; the limit will be set from the certified-market occurrence distribution.`
    const poolClause = p && p.value_ppb != null && pctOk ? ` The certified-market pool's ${p.label} is ${pPct(p)}.` : ""
    ratHtml = `<p style="${S.p}">No firm HMTc limit is published for ${esc(nameLc)} in ${esc(category)} yet; the cell is in development pending the shipping gates.${govClause}${poolClause}${whyLink}</p>`
  } else if (opts.basisKind === "read_across" || (der.read_across && opts.basisKind !== "government")) {
    const label = opts.readAcrossLabel || (der.read_across ? der.read_across.label : "")
    // The binding value IS the read-across value — never government_ml, which for
    // a contact-product cell is a companion total-content ceiling in a different
    // basis (e.g. CPSIA 100 mg/kg total lead vs the EN 1400 23 mg/kg migration
    // limit that actually binds). fmtLimit's fallback prefers government_ml, so
    // pin the read-across value explicitly here.
    const raVal = opts.limitPpb != null ? conc(opts.limitPpb)
      : (der.read_across && der.read_across.value_ppb != null ? conc(der.read_across.value_ppb) : fmtLimit(opts, der))
    ratHtml = `<p style="${S.p}">HMTc sets ${esc(raVal)} by read-across${label ? `: ${stripDot(label)}` : ""}.${whyLink}</p>`
  } else if (der.special) {
    const u = der.special.unit && der.special.unit !== "ppb" ? ` ${esc(der.special.unit)}` : ""
    ratHtml = `<p style="${S.p}">HMTc sets ${esc(String(der.special.value))}${u}: ${stripDot(der.special.label)}.${whyLink}</p>`
  } else if (noGov && der.percentile) {
    // confirmed no government limit — the program sets the number from occurrence
    const p = der.percentile
    const pathway = p.label === "P45"
      ? `the dirty-subcategory pathway (P45), calibrated to admit roughly the cleaner 40% of an endemic category and put the rest on notice`
      : `the clean-subcategory pathway (P97), calibrated to admit roughly the cleanest 90% of the market and exclude the contaminated tail`
    const prov = p.sens_band === "provisional" ? " The value is held provisional pending a wider reference-method pool." : ""
    ratHtml =
      `<p style="${S.p}">No government sets a maximum level for ${esc(nameLc)} in ${esc(category)}. It is the program's role to set a limit where no government has, because ${esc((tox && tox.tox_anchor) || "the analyte carries a toxicological basis for control")}. `
      + `HMTc sets ${esc(fmtLimit(opts, der))} from the certified-market occurrence distribution — ${pathway} (${twoPath}).${prov}${whyLink}</p>`
  } else if (govMl) {
    // Method v2.0: government-limit default, with selective occurrence for the
    // Tier-1 toxics and no-ML cells. The LEAD is driven by the authoritative
    // rationale tag; the pool-vs-ceiling clause is driven by the ACTUAL numbers,
    // so a "binds" verb never contradicts the arithmetic (the compiled cell and
    // the pooled aggregate can disagree — state both, claim only what is true).
    const p = der.percentile
    const gov = govMl
    const govTxt = gov.value_ppb != null ? conc(gov.value_ppb) : null
    // factually-correct pool-vs-government clause
    const poolGov = () => {
      if (!p || p.value_ppb == null || !pctOk) return ""
      const px = pPct(p)
      if (govTxt == null) return ` The certified-market pool's ${p.label} is ${px}.`
      if (p.value_ppb >= gov.value_ppb && tag === "regulatory-alignment")
        return ` The certified-market pool's ${p.label} is ${px}, at or above the government ceiling of ${govTxt}, so the government maximum binds.`
      if (p.value_ppb <= gov.value_ppb && tag === "literature-baseline")
        return ` The pooled ${p.label} is ${px}, below the government ceiling of ${govTxt}, so the tighter occurrence value binds and the ratchet keeps room to work.`
      return ` The certified-market pool's ${p.label} is ${px}, against a government ceiling of ${govTxt}.`
    }
    let lead, numClause = ""
    if (tag === "literature-baseline" && p) {
      lead = "the certified-market occurrence value, which beats the strictest government ceiling — HMTc certifies to the cleaner number and the ratchet keeps room to work"
      numClause = poolGov()
    } else if (tag === "precautionary") {
      lead = "a precautionary value set below both the pooled occurrence percentile and the strictest government ceiling"
      if (p && p.value_ppb != null && govTxt) numClause = ` Pooled ${p.label} ${conc(p.value_ppb)}; government ceiling ${govTxt}.`
    } else if (tag === "feasibility-driven") {
      lead = "held above the tightest achievable value on documented feasibility grounds, with a sunset plan to tighten"
      if (p && p.value_ppb != null) numClause = ` Pooled ${p.label} ${conc(p.value_ppb)}.`
    } else {
      lead = "the strictest applicable government maximum level for this product form, adopted under Method v2.0 as the default certification standard"
      numClause = poolGov()
    }
    const tagTxt = tag ? ` (${esc(tag)})` : ""
    ratHtml = `<p style="${S.p}">HMTc sets ${esc(fmtLimit(opts, der))}${tagTxt}: ${lead}.${numClause}${whyLink}</p>`
  } else {
    // Neutral fallback: the generator did not supply an authoritative basis and
    // the export has no reg-cap for the cell. State the limit, tag, and pooled
    // figure factually — never claim a government limit is present OR absent.
    const p = der.percentile
    const tagTxt = tag ? ` (${esc(tag)})` : ""
    const disp = fmtLimit(opts, der)
    const numClause = p && p.value_ppb != null && pctOk ? ` The certified-market pool's ${p.label} is ${pPct(p)}.` : ""
    ratHtml = disp ? `<p style="${S.p}">HMTc sets ${esc(disp)}${tagTxt} under Method v2.0.${numClause}${whyLink}</p>` : ""
  }

  return `<div style="${S.block}">`
    + `<div style="${S.label}">${esc(name)}</div>`
    + occHtml
    + ratHtml
    + `</div>`
}

function fmtLimit(opts, der) {
  // limitPpb: numeric ppb, formatted for readability (mg/kg for large values).
  if (opts.limitPpb != null) return conc(opts.limitPpb)
  // limitDisplay + limitUnit: raw value in the cell's own unit (e.g. Cat-9 mg/kg).
  if (opts.limitDisplay != null && opts.limitDisplay !== "") {
    const u = opts.limitUnit ? ` ${opts.limitUnit}` : (typeof opts.limitDisplay === "number" || /^\d/.test(String(opts.limitDisplay)) ? " ppb" : "")
    return `${opts.limitDisplay}${u}`
  }
  // Fallback (the generator normally passes the authoritative display): use the
  // binding value implied by the rationale tag.
  const d = der || {}
  const tag = opts.rationaleTag || d.rationale_tag
  let v = null
  if (tag === "literature-baseline" && d.percentile) v = d.percentile.value_ppb
  else if (d.government_ml) v = d.government_ml.value_ppb
  else if (d.read_across) v = d.read_across.value_ppb
  else if (d.percentile) v = d.percentile.value_ppb
  return v != null ? conc(v) : "the panel limit"
}

// ---------- cell -> descriptor mappers (keep the derivation authoritative) ----------

// Compiled record cell (cat1 / seafood / grains / infant-formula — all ppb).
// Returns the per-analyte descriptor the section consumes, so each generator
// wires the section in one line without re-deriving the branch logic.
export function descriptorFromCompiledCell(cell, analyte) {
  const d = { analyte }
  if (!cell) return d
  const v = cell.value != null ? Number(cell.value) : null
  if (cell.type === "gov") {
    d.basisKind = "government"
    d.rationaleTag = "regulatory-alignment"
    if (v != null) d.limitPpb = v
    d.governmentMl = { value_ppb: v, source: cell.binding_id || "", jurisdiction: cell.binding_jurisdiction || null }
  } else if (cell.type === "form_split") {
    // A form-specific sovereign limit: the strictest form value is the binding floor for the
    // occurrence rationale. Treat as a government cell so the block reads honestly.
    d.basisKind = "government"
    d.rationaleTag = "regulatory-alignment"
    if (v != null) d.limitPpb = v
    d.governmentMl = { value_ppb: v, source: "", jurisdiction: cell.binding_jurisdiction || null }
  } else if (cell.type === "read_across") {
    if (v != null) d.limitPpb = v
    if (cell.basis_kind === "occurrence") { d.basisKind = "occurrence"; d.rationaleTag = "literature-baseline" }
    else if (cell.basis_kind === "precautionary") { d.basisKind = "precautionary"; d.rationaleTag = "precautionary" }
    else { d.basisKind = "read_across"; d.readAcrossLabel = cell.label || "" }
  } else if (cell.type === "not_material") {
    d.isNotMaterial = true
    d.notMaterialProse = cell.control || cell.rationale || ""
    d.notMaterialMethod = cell.reference_method || null
  } else if (cell.type === "control") {
    // Mandatory nonnumeric control: no sovereign ML exists but a real pathway does, so the
    // analyte is screened, not capped with an invented number. Render it through the
    // no-standalone-limit path with the compiler's own control rationale + reference method.
    d.isNotMaterial = true
    d.notMaterialProse = cell.rationale || cell.control || ""
    d.notMaterialMethod = cell.reference_method || null
  } else if (cell.type === "subsumed") {
    // A species governed by and bounded by its parent total (iAs <= tAs, MeHg <= tHg): no
    // separate ceiling is published. Generate baseline-correct prose here rather than
    // inheriting the compiled label, so the manual reads correctly even for records not yet
    // recompiled: the total is MEASURED every lot (baseline), and the species is speciated only
    // on an ongoing total exceedance ("reflex" is the ongoing regime, never the baseline).
    // A parent-bounded species is COMPLETE (bounded-complete), never a not-material
    // determination: the parent-total ceiling IS the species ceiling (species <= parent),
    // a hard arithmetic bound, not a rebuttable presumption. Mark it `bounded` so the
    // renderer suppresses the not-material "rebuttable presumption" tail and a stale
    // occurrence-ledger not_material row cannot reclassify a compiled bounded finding.
    d.isNotMaterial = true
    d.bounded = true
    const total = cell.subsumed_by || "its parent total"
    d.notMaterialProse = `${analyte} is a component of ${total} and bounded by it (${analyte} <= ${total}), so the ${total} ceiling is the ${analyte} ceiling; no separate ${analyte} number is published. ${total} is measured on every lot, and ${analyte} is speciated only when ${total} exceeds its limit.`
    d.notMaterialMethod = cell.reference_method || null
  } else if (cell.type === "special") {
    if (v != null) d.limitPpb = v
    d.readAcrossLabel = cell.label || ""
    d.basisKind = "read_across"
  }
  return d
}

// Catalog analyte record (build-standards-pages: hmtc_standards_catalog.json rows).
export function descriptorFromCatalogAnalyte(rec, analyte) {
  const d = { analyte }
  if (!rec) return d
  // Only a PUBLISHED cell has a firm limit. Never fall back to precise_ppb — that
  // is the pooled occurrence figure, not the certification limit, and rendering it
  // as "HMTc sets N" both invents a number the master table shows as "—" and can
  // contradict the binding basis (e.g. salt Pb precise_ppb 182 vs the EU ML 1000).
  d.published = rec.status === "published"
  if (rec.published_limit_ppb != null) d.limitPpb = Number(rec.published_limit_ppb)
  d.rationaleTag = rec.rationale_tag || null
  if (rec.regulatory_cap_ppb != null) {
    d.basisKind = "government"
    d.governmentMl = { value_ppb: Number(rec.regulatory_cap_ppb), source: rec.regulatory_cap_source || "", jurisdiction: null }
  } else if (rec.rationale_tag === "literature-baseline") {
    d.basisKind = "occurrence"
  } else if (rec.rationale_tag === "precautionary") {
    d.basisKind = "precautionary"
  }
  return d
}

// ---------- whole section for a page ----------
// opts: { evidence, toxAnchors, rowSlug, analytes: [descriptor...], rowLabel }
export function occurrenceRationaleSection(opts) {
  const { evidence, toxAnchors, rowSlug } = opts
  if (!evidence || !evidence.cells) return ""
  const blocks = []
  for (const a of opts.analytes || []) {
    const cell = evidence.cells[`${rowSlug}|${a.analyte}`]
    if (!cell) continue
    const tox = (toxAnchors && toxAnchors.analytes && toxAnchors.analytes[a.analyte]) || null
    // spread the whole descriptor so every authoritative field (limitPpb,
    // governmentMl, readAcrossLabel, notMaterialProse, …) reaches the block
    const block = analyteOccurrenceBlock({ ...a, cell, tox })
    if (block) blocks.push(block)
  }
  if (!blocks.length) return ""
  return `<section id="occurrence-derivation" class="hmtc-section">`
    + `<h2 style="${S.h2}">Occurrence and derivation rationale</h2>`
    + `<p style="${S.lede}">For each analyte on the panel: what the peer-reviewed and survey literature measured in this category, cited one way to the Heavy Metal Index, and the Method v2.0 reasoning behind the certification limit — including, where no government sets a number, why the program sets one anyway. Occurrence figures are literature findings; the derivation is the certifier's.</p>`
    + blocks.join("")
    + `</section>`
}
