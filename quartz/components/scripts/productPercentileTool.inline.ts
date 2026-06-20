// Brand-facing Lab Result Comparator. Renders a literature-native view:
// reported concentration range across cited sources, applicable regulatory cap,
// source count and confidence rating, with an optional basis conversion when
// the brand's lab basis differs from the cited literature or regulatory ceiling.
// Threshold-selection percentile arithmetic (p10/p30/p50/p90/p95/p100) is not
// displayed to brands — it lives on the staff Standards Workbench tree only.

type ComparatorRow = {
  row_slug: string
  row_label: string
  hmtc_row: number | null
  hmtc_category: number | null
  category_label: string
  variant_type: string
  product_url: string
}

type AnalyteSpec = {
  code: string
  label: string
  wiki_link: string
  mitigation_link: string
  remediation_note: string
}

type BasisOption = {
  code: string
  label: string
}

type LitContextEntry = {
  row_slug: string
  metal: string
  basis: string
  unit: string
  range_low: number | null
  range_high: number | null
  central_low: number | null
  central_high: number | null
  n_sources: number
  confidence: "data gap" | "low" | "medium" | "high"
  coverage_note?: string
  source_summaries: { source_id: string; n: number | null; basis: string }[]
}

type RegCapEntry = {
  row_slug: string
  metal: string
  value_ppb: number
  basis: string
  scope: string
  regulation_id: string
  page: string | null
  authority: string
  status: string
}

type ComparatorContext = {
  schema: string
  rows: ComparatorRow[]
  analytes: AnalyteSpec[]
  basis_vocab: BasisOption[]
  lit_context: LitContextEntry[]
  reg_caps: RegCapEntry[]
}

const RECONSTITUTION_FACTOR = 8

let comparatorContextCache: Promise<ComparatorContext> | undefined
const stateByRoot = new WeakMap<HTMLElement, ComparatorState>()

type ComparatorState = {
  context: ComparatorContext
  rowSlug: string
  basis: string
}

function loadComparatorContext() {
  comparatorContextCache ??= fetch("/static/hmi-lab-comparator-context.json").then((response) => {
    if (!response.ok) throw new Error("Lab comparator context unavailable")
    return response.json() as Promise<ComparatorContext>
  })
  return comparatorContextCache
}

function escapeComparatorHTML(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function formatNumber(value: number | null | undefined) {
  if (value === null || typeof value === "undefined" || !Number.isFinite(value)) return "—"
  if (value === 0) return "0"
  if (Math.abs(value) >= 100) return String(Math.round(value))
  if (Math.abs(value) >= 10) return value.toFixed(1).replace(/\.0$/, "")
  if (Math.abs(value) >= 1) return value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "")
  return value.toFixed(3).replace(/0+$/, "").replace(/\.$/, "")
}

function rowLabel(row: ComparatorRow) {
  const prefix = row.hmtc_row ? `Row ${row.hmtc_row}: ` : ""
  return `${prefix}${row.row_label}`
}

function rowsAvailable(context: ComparatorContext) {
  return [...context.rows].sort((a, b) => a.row_label.localeCompare(b.row_label))
}

function findLitContext(context: ComparatorContext, rowSlug: string, metal: string, basis: string): LitContextEntry | null {
  const exact = context.lit_context.find(
    (entry) => entry.row_slug === rowSlug && entry.metal === metal && entry.basis === basis,
  )
  if (exact) return exact
  return context.lit_context.find((entry) => entry.row_slug === rowSlug && entry.metal === metal) ?? null
}

function findRegCap(context: ComparatorContext, rowSlug: string, metal: string): RegCapEntry | null {
  return context.reg_caps.find((entry) => entry.row_slug === rowSlug && entry.metal === metal) ?? null
}

function basisLabel(context: ComparatorContext, code: string) {
  if (!code) return "unspecified basis"
  const known = context.basis_vocab.find((entry) => entry.code === code)
  if (known) return known.label
  return code.replace(/_/g, " ")
}

function convertForBasis(
  value: number,
  from: string,
  to: string,
): { value: number; explanation: string } | null {
  if (!from || !to) return null
  if (from === to) return { value, explanation: "matched basis; no conversion applied" }
  const preparedAliases = new Set(["prepared_for_feeding", "as_consumed"])
  const powderAliases = new Set(["as_sold", "as_sold_or_source_reported", "dry_weight"])
  if (preparedAliases.has(from) && powderAliases.has(to)) {
    return {
      value: value * RECONSTITUTION_FACTOR,
      explanation: `prepared-for-feeding to powder-as-placed at the conservative 1:${RECONSTITUTION_FACTOR - 1} reconstitution (1 g powder per ${RECONSTITUTION_FACTOR - 1} g water)`,
    }
  }
  if (powderAliases.has(from) && preparedAliases.has(to)) {
    return {
      value: value / RECONSTITUTION_FACTOR,
      explanation: `powder-as-placed to prepared-for-feeding at the conservative 1:${RECONSTITUTION_FACTOR - 1} reconstitution`,
    }
  }
  return null
}

function valuePositionPercent(value: number, low: number, high: number) {
  if (high <= low) return 50
  const clamped = Math.min(Math.max(value, low), high)
  return ((clamped - low) / (high - low)) * 100
}

function renderRangeBar(
  brandValue: number | null,
  low: number | null,
  high: number | null,
  regCap: number | null,
) {
  if (!Number.isFinite(low) || !Number.isFinite(high) || low === null || high === null) {
    return ""
  }
  const upper = Math.max(high, regCap ?? -Infinity, brandValue ?? -Infinity)
  const lower = Math.min(low, 0, regCap !== null && regCap > 0 ? 0 : low)
  const litLeft = valuePositionPercent(low, lower, upper)
  const litWidth = valuePositionPercent(high, lower, upper) - litLeft
  const brandPosition = brandValue !== null ? valuePositionPercent(brandValue, lower, upper) : null
  const capPosition = regCap !== null && regCap > 0 ? valuePositionPercent(regCap, lower, upper) : null

  return `<div class="hmi-comparator-rangebar" aria-hidden="true">
    <div class="hmi-comparator-rangebar-track">
      <div class="hmi-comparator-rangebar-literature" style="left:${litLeft}%; width:${litWidth}%"></div>
      ${capPosition !== null ? `<div class="hmi-comparator-rangebar-cap" style="left:${capPosition}%" title="Regulatory cap"></div>` : ""}
      ${brandPosition !== null ? `<div class="hmi-comparator-rangebar-brand" style="left:${brandPosition}%" title="Your value"></div>` : ""}
    </div>
    <div class="hmi-comparator-rangebar-axis">
      <span>${formatNumber(lower)} ppb</span>
      <span>${formatNumber(upper)} ppb</span>
    </div>
  </div>`
}

function renderAnalyteCard(state: ComparatorState, analyte: AnalyteSpec) {
  const { context, rowSlug, basis } = state
  const lit = findLitContext(context, rowSlug, analyte.code, basis)
  const cap = findRegCap(context, rowSlug, analyte.code)
  const litRangeText = lit && lit.range_low !== null && lit.range_high !== null
    ? `${formatNumber(lit.range_low)} to ${formatNumber(lit.range_high)} ppb`
    : "no numeric range loaded"
  const centralText = lit && lit.central_low !== null && lit.central_high !== null
    ? lit.central_low === lit.central_high
      ? `central tendency ${formatNumber(lit.central_low)} ppb`
      : `central tendency ${formatNumber(lit.central_low)} to ${formatNumber(lit.central_high)} ppb`
    : null

  const sourceCountText = lit
    ? `${lit.n_sources} source${lit.n_sources === 1 ? "" : "s"} cited on this basis`
    : "no cited sources on this basis"
  const litBasisNote = lit && lit.basis && lit.basis !== basis
    ? ` (cited literature on ${basisLabel(context, lit.basis)} basis)`
    : ""

  const capText = cap
    ? `${formatNumber(cap.value_ppb)} ppb cap; ${cap.authority || "regulatory authority"}, basis: ${cap.basis}`
    : "no regulatory cap loaded for this product / analyte"
  const capLinkText = cap?.page
    ? ` <a href="${escapeComparatorHTML(cap.page)}">View regulation</a>.`
    : ""

  const confidenceText = lit ? lit.confidence : "data gap"
  const confidenceSlug = confidenceText.replace(/\s+/g, "-")

  return `<div class="hmi-comparator-analyte" data-analyte="${escapeComparatorHTML(analyte.code)}">
    <div class="hmi-comparator-analyte-header">
      <div>
        <strong>${escapeComparatorHTML(analyte.label)} (${escapeComparatorHTML(analyte.code)})</strong>
        <a class="hmi-comparator-analyte-link" href="${escapeComparatorHTML(analyte.wiki_link)}">about this metal</a>
      </div>
      <div class="hmi-comparator-confidence hmi-comparator-confidence-${escapeComparatorHTML(confidenceSlug)}">
        ${escapeComparatorHTML(confidenceText)} confidence
      </div>
    </div>

    <dl class="hmi-comparator-facts">
      <div>
        <dt>Reported range across cited sources</dt>
        <dd>${escapeComparatorHTML(litRangeText)}${centralText ? `; ${escapeComparatorHTML(centralText)}` : ""}${escapeComparatorHTML(litBasisNote)}</dd>
      </div>
      <div>
        <dt>Cited sources on this basis</dt>
        <dd>${escapeComparatorHTML(sourceCountText)}</dd>
      </div>
      <div>
        <dt>Applicable regulatory cap</dt>
        <dd>${escapeComparatorHTML(capText)}.${capLinkText}</dd>
      </div>
    </dl>

    <div class="hmi-comparator-rangebar-wrap" data-rangebar></div>

    <form class="hmi-comparator-input" data-analyte-form>
      <label>
        Your lab result (ppb)
        <input type="number" min="0" step="any" inputmode="decimal" data-analyte-input placeholder="—" />
      </label>
      <button type="submit">Check this value</button>
    </form>

    <div class="hmi-comparator-result" data-analyte-result>
      ${lit?.coverage_note ? `<p class="hmi-comparator-coverage-note">${escapeComparatorHTML(lit.coverage_note)}</p>` : ""}
    </div>

    <details class="hmi-comparator-remediation">
      <summary>What to do if your value is high</summary>
      <p>${escapeComparatorHTML(analyte.remediation_note)}</p>
      <p><a href="${escapeComparatorHTML(analyte.mitigation_link)}">Open the ${escapeComparatorHTML(analyte.label)} mitigation guide</a>.</p>
    </details>
  </div>`
}

function renderTool(root: HTMLElement, state: ComparatorState) {
  const container = root.querySelector("[data-comparator-grid]")
  if (!container) return
  container.innerHTML = state.context.analytes.map((analyte) => renderAnalyteCard(state, analyte)).join("")

  for (const card of [...container.querySelectorAll<HTMLElement>(".hmi-comparator-analyte")]) {
    const analyteCode = card.dataset.analyte ?? ""
    const analyte = state.context.analytes.find((entry) => entry.code === analyteCode)
    if (!analyte) continue
    const lit = findLitContext(state.context, state.rowSlug, analyteCode, state.basis)
    const cap = findRegCap(state.context, state.rowSlug, analyteCode)
    const rangebar = card.querySelector("[data-rangebar]")
    if (rangebar) {
      rangebar.innerHTML = renderRangeBar(null, lit?.range_low ?? null, lit?.range_high ?? null, cap?.value_ppb ?? null)
    }
    const form = card.querySelector("[data-analyte-form]") as HTMLFormElement | null
    if (!form) continue
    form.addEventListener("submit", (event) => {
      event.preventDefault()
      const input = form.querySelector("[data-analyte-input]") as HTMLInputElement | null
      if (!input) return
      const numeric = Number(input.value)
      if (!input.value || !Number.isFinite(numeric)) return
      handleAnalyteSubmit(card, state, analyte, numeric)
    })
  }
}

function handleAnalyteSubmit(card: HTMLElement, state: ComparatorState, analyte: AnalyteSpec, value: number) {
  const lit = findLitContext(state.context, state.rowSlug, analyte.code, state.basis)
  const cap = findRegCap(state.context, state.rowSlug, analyte.code)
  const result = card.querySelector("[data-analyte-result]")
  const rangebar = card.querySelector("[data-rangebar]")
  if (!result) return

  const lines: string[] = []

  if (lit && lit.range_low !== null && lit.range_high !== null) {
    if (value <= lit.range_high && value >= lit.range_low) {
      lines.push(`Inside the reported literature range (${formatNumber(lit.range_low)} to ${formatNumber(lit.range_high)} ppb).`)
    } else if (value > lit.range_high) {
      lines.push(`Above the highest reported value in cited literature (${formatNumber(lit.range_high)} ppb).`)
    } else {
      lines.push(`Below the lowest reported value in cited literature (${formatNumber(lit.range_low)} ppb); confirm detection limits and lab method.`)
    }
  } else {
    lines.push(`Literature is too thin on this matrix and basis to position the value inside a range. Treat this comparator as orientation only.`)
  }

  if (cap) {
    let capCompare: { value: number; explanation: string } | null = { value, explanation: "matched basis" }
    if (cap.basis && cap.basis !== state.basis) {
      capCompare = convertForBasis(value, state.basis, basisCodeForRegCap(cap.basis))
    }
    if (capCompare) {
      const verdict =
        capCompare.value <= cap.value_ppb
          ? `within the ${formatNumber(cap.value_ppb)} ppb regulatory cap`
          : `above the ${formatNumber(cap.value_ppb)} ppb regulatory cap`
      const conversionNote =
        capCompare.value === value
          ? ""
          : ` (converted ${formatNumber(value)} → ${formatNumber(capCompare.value)} ppb using ${capCompare.explanation})`
      lines.push(`${verdict}${conversionNote}.`)
    } else {
      lines.push(`Regulatory cap is ${formatNumber(cap.value_ppb)} ppb on a ${cap.basis} basis; no automatic conversion is offered for ${basisLabel(state.context, state.basis)}. Match the basis before drawing a compliance read.`)
    }
  } else {
    lines.push(`No applicable regulatory cap is loaded for this product and analyte.`)
  }

  if (lit) {
    const basisList = [...new Set(lit.source_summaries.map((s) => basisLabel(state.context, s.basis)).filter(Boolean))]
    const basisText = basisList.length > 0 ? ` Cited bases: ${basisList.join(", ")}.` : ""
    lines.push(
      `Confidence: ${lit.confidence} (${lit.n_sources} cited source${lit.n_sources === 1 ? "" : "s"}).${basisText}`,
    )
  }

  result.innerHTML = `<div class="hmi-comparator-result-card">
    <strong>Your value: ${formatNumber(value)} ppb (${escapeComparatorHTML(basisLabel(state.context, state.basis))})</strong>
    <ul>${lines.map((line) => `<li>${escapeComparatorHTML(line)}</li>`).join("")}</ul>
    <p class="hmi-comparator-disclaimer">This is a directional comparison against cited literature and the applicable regulatory ceiling. It is not a certification decision; HMT&amp;C certification still requires the full required analyte panel, lab documentation, LOD/LOQ review, lot sampling, and HMT&amp;C program review.</p>
  </div>`
  if (rangebar) {
    rangebar.innerHTML = renderRangeBar(value, lit?.range_low ?? null, lit?.range_high ?? null, cap?.value_ppb ?? null)
  }
}

function basisCodeForRegCap(basis: string) {
  const value = basis.toLowerCase()
  if (value.includes("placed on the market") || value.includes("as sold")) return "as_sold"
  if (value.includes("prepared")) return "prepared_for_feeding"
  if (value.includes("as consumed") || value.includes("ready-to-eat")) return "as_consumed"
  if (value.includes("dry")) return "dry_weight"
  return basis
}

function defaultBasisFor(context: ComparatorContext, rowSlug: string) {
  const candidates = context.lit_context.filter((entry) => entry.row_slug === rowSlug)
  if (candidates.length === 0) return context.basis_vocab[0]?.code ?? "as_sold"
  const counts = new Map<string, number>()
  for (const entry of candidates) {
    counts.set(entry.basis, (counts.get(entry.basis) ?? 0) + 1)
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0]
}

function populateCategorySelect(root: HTMLElement, context: ComparatorContext, selectedSlug: string) {
  const select = root.querySelector("[data-comparator-row]") as HTMLSelectElement | null
  if (!select) return
  const rows = rowsAvailable(context)
  select.innerHTML = rows
    .map((row) => {
      const selected = row.row_slug === selectedSlug ? " selected" : ""
      return `<option value="${escapeComparatorHTML(row.row_slug)}"${selected}>${escapeComparatorHTML(rowLabel(row))}</option>`
    })
    .join("")
}

function populateBasisSelect(root: HTMLElement, context: ComparatorContext, selectedBasis: string) {
  const select = root.querySelector("[data-comparator-basis]") as HTMLSelectElement | null
  if (!select) return
  select.innerHTML = context.basis_vocab
    .map((option) => {
      const selected = option.code === selectedBasis ? " selected" : ""
      return `<option value="${escapeComparatorHTML(option.code)}"${selected}>${escapeComparatorHTML(option.label)}</option>`
    })
    .join("")
}

async function setupComparator(root: HTMLElement) {
  if (root.dataset.comparatorReady === "true") return
  root.dataset.comparatorReady = "true"

  const status = root.querySelector("[data-comparator-status]")
  try {
    const context = await loadComparatorContext()
    const rows = rowsAvailable(context)
    if (rows.length === 0) {
      if (status) status.textContent = "Lab comparator context is not loaded yet."
      return
    }
    const initialQueryRow = new URLSearchParams(window.location.search).get("category")
    const initialRow = rows.find((row) => row.row_slug === initialQueryRow)?.row_slug ?? rows[0].row_slug
    const initialBasis = defaultBasisFor(context, initialRow)
    const state: ComparatorState = { context, rowSlug: initialRow, basis: initialBasis }
    stateByRoot.set(root, state)

    populateCategorySelect(root, context, initialRow)
    populateBasisSelect(root, context, initialBasis)
    if (status) status.remove()
    renderTool(root, state)

    const rowSelect = root.querySelector("[data-comparator-row]") as HTMLSelectElement | null
    rowSelect?.addEventListener("change", () => {
      state.rowSlug = rowSelect.value
      state.basis = defaultBasisFor(context, state.rowSlug)
      populateBasisSelect(root, context, state.basis)
      renderTool(root, state)
      const url = new URL(window.location.href)
      url.searchParams.set("category", state.rowSlug)
      window.history.replaceState({}, "", url)
    })

    const basisSelect = root.querySelector("[data-comparator-basis]") as HTMLSelectElement | null
    basisSelect?.addEventListener("change", () => {
      state.basis = basisSelect.value
      renderTool(root, state)
    })
  } catch {
    if (status) status.textContent = "Lab comparator context could not be loaded."
  }
}

function setupAllComparators() {
  document.querySelectorAll<HTMLElement>("[data-percentile-tool]").forEach((tool) => {
    setupComparator(tool)
  })
}

document.addEventListener("nav", setupAllComparators)
queueMicrotask(setupAllComparators)
