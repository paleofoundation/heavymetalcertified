// claim-cell.mjs — shared claim-surface cell classifier.
//
// CEO lock (Karen 2026-09-10, ORDER S-DOI-FORCE-1): a claim-surface LIMIT is
// COMPLETE only when it is a firm number. subsumed / monitored / null are EMPTY.
// Read-across is allowed when it carries a numeric value and provenance. Never blank.
// Inorganic arsenic blank on baby foods is a hard fail.

const EMPTY_KINDS = new Set(["subsumed", "monitored"])

export function cellsOf(rec) {
  if (rec.variants && typeof rec.variants === "object") {
    const vs = rec.variants
    return vs.default || Object.values(vs)[0] || {}
  }
  if (rec.cells && typeof rec.cells === "object") return rec.cells
  return null
}

export function allCellMaps(rec) {
  if (rec?.variants && typeof rec.variants === "object") return Object.entries(rec.variants)
  if (rec?.cells && typeof rec.cells === "object") return [["-", rec.cells]]
  return []
}

export function panelOf(meta, rec) {
  if (meta && Array.isArray(meta.panel) && meta.panel.length) return meta.panel
  return Object.keys(cellsOf(rec) || {})
}

function tagsOf(c) {
  return [c.type, c.cell_kind, c.provenance, c.provenance_tag]
    .filter((x) => x != null && x !== "")
    .map((x) => String(x).toLowerCase().replace(/_/g, "-"))
}

export function isNumericLimit(v) {
  if (typeof v === "number" && Number.isFinite(v)) return true
  if (typeof v === "string" && /^-?\d+(\.\d+)?$/.test(v.trim())) return true
  return false
}

function formSplitHasNumber(c) {
  const kind = String(c.type || c.cell_kind || "").toLowerCase()
  if (kind !== "form_split") return false
  if (isNumericLimit(c.strictest_form_value)) return true
  if (Array.isArray(c.forms) && c.forms.some((f) => f && isNumericLimit(f.value))) return true
  return false
}

// Firm numeric required. subsumed / monitored are EMPTY even if a parent bound exists.
// Read-across / gov / screen / special with a number are firm.
export function cellState(c) {
  if (!c || typeof c !== "object") return "EMPTY"
  if (tagsOf(c).some((t) => EMPTY_KINDS.has(t))) return "EMPTY"
  if (isNumericLimit(c.value)) return "firm"
  if (formSplitHasNumber(c)) return "firm"
  return "EMPTY"
}

export function isFirmNumeric(c) {
  return cellState(c) === "firm"
}

// Rice, infant/child foods (Cat 1), baby cereal — iAs must be a firm number.
// A parenthetical "rice" in another product name (e.g. vinegar including rice vinegar)
// is not a rice standard.
export function requiresNumericIas({ slug = "", name = "", category } = {}) {
  if (String(category) === "1") return true
  const slugL = String(slug).toLowerCase()
  const nameL = String(name).toLowerCase()
  const hay = `${slugL} ${nameL}`
  if (/baby[-_\s]?cereal|infant[-_\s]?cereal|infant[-_\s]?formula|baby[-_\s]?food/.test(hay)) return true
  if (/rice[-_\s]based/.test(hay) || /rice[-_\s]containing/.test(hay)) return true
  if (/(^|[-_/])rice([-_/]|$)/.test(slugL) && !/non-rice/.test(slugL)) return true
  if (/^rice\b|\brice:/.test(nameL) && !/non-rice/.test(nameL)) return true
  return false
}

const DASH_ONLY = /^(?:[-–—−]|---+|–+|—+|&mdash;|&ndash;)$/i
const BANNED_LIMIT_WORD = /^(?:monitored|subsumed|bounded|control|n\/m|nm|n-m|screen)$/i

// Classify a rendered LIMIT cell. Returns null when the cell is a firm number
// (digits present, no banned token). Otherwise a short reason.
export function classifyLimitDisplay(raw) {
  const text = String(raw ?? "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/&minus;/g, "−")
    .replace(/&le;|&#8804;|&#x2264;/gi, "≤")
    .replace(/&#8201;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim()
  if (!text) return "empty"
  if (DASH_ONLY.test(text)) return "dash"
  const lower = text.toLowerCase()
  if (/\bmonitored\b/.test(lower)) return "monitored"
  if (/\bsubsumed\b/.test(lower)) return "subsumed"
  if (/\bbounded\b/.test(lower)) return "subsumed"
  if (BANNED_LIMIT_WORD.test(lower)) return lower === "n/m" || lower === "nm" || lower === "n-m" ? "empty" : lower
  if (!/\d/.test(text)) return "empty"
  return null
}

export function isIncompleteNM(n, m) {
  const a = Number(n), b = Number(m)
  return Number.isFinite(a) && Number.isFinite(b) && b > 0 && a < b
}

// What the PDF builder writes into the HMTc-limit column (tools/build-standard-pdf.mjs cellRow).
export function pdfLimitDisplay(c) {
  if (!c) return "—"
  const t = c.type || c.cell_kind || ""
  if (c.value != null) return String(c.value)
  if (t === "subsumed") return `≤ ${c.subsumed_by || c.bounded_by || "parent total"}`
  if (t === "control") return "control"
  if (t === "not_material" || t === "not-material") return "n/m"
  if (t === "monitored") return "monitored"
  return "—"
}
