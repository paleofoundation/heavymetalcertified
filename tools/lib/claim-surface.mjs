// claim-surface.mjs — shared Certification-Readiness / PANEL-CLAIM-1 helpers.
//
// Claim-surface analytes are the eight totals (Pb, tAs, Cd, tHg, Ni, Sn, Al, Cr).
// Species are numeric when they define a pathway or a species-only ML; rice /
// infant-cereal rows make iAs mandatory-numeric. Reflex speciation governs lab
// assay timing only — it must never blank a claim cell.
//
// A cell is COMPLETE only when it carries a firm numeric limit (gov floor,
// disclosed read-across, or an explicit numeric ceiling on the cell itself,
// e.g. binding_total equal to the parent total). type/provenance
// subsumed|monitored|control|not-material with value:null is EMPTY.

import fs from "node:fs"
import path from "node:path"

export const CLAIM_TOTALS = Object.freeze(["Pb", "tAs", "Cd", "tHg", "Ni", "Sn", "Al", "Cr"])
export const SPECIES = Object.freeze(["iAs", "MeHg", "Cr-VI"])
export const NULLISH_KINDS = Object.freeze([
  "subsumed", "monitored", "control", "not_material", "not-material",
])

export function isFirmNumeric(value) {
  if (value === null || value === undefined || value === "") return false
  const n = Number(value)
  return Number.isFinite(n)
}

export function cellKind(c) {
  if (!c || typeof c !== "object") return ""
  return String(c.type || c.cell_kind || "").toLowerCase()
}

export function cellProvenance(c) {
  if (!c || typeof c !== "object") return ""
  return String(c.provenance || c.provenance_tag || "").toLowerCase()
}

// Numeric ceiling that lives ON the cell. Parent-total inheritance does not
// count unless the compiler copied the number onto this cell (value or
// binding_total). That is the escape hatch this ruling closes.
export function numericCeiling(c) {
  if (!c || typeof c !== "object") return null
  if (isFirmNumeric(c.value)) return Number(c.value)
  if (isFirmNumeric(c.binding_total)) return Number(c.binding_total)
  return null
}

export function isNullishKind(c) {
  const t = cellKind(c)
  const p = cellProvenance(c)
  return NULLISH_KINDS.includes(t) || NULLISH_KINDS.includes(p)
}

// COMPLETE requires a firm numeric value. subsumed/monitored/control/not-material
// with value:null are EMPTY, even when a parent total exists elsewhere.
export function cellState(c) {
  if (!c || typeof c !== "object") return "EMPTY"
  if (numericCeiling(c) != null) return "firm"
  return "EMPTY"
}

export function cellsOf(rec) {
  if (!rec || typeof rec !== "object") return null
  if (rec.variants && typeof rec.variants === "object") {
    const vs = rec.variants
    return vs.default || Object.values(vs)[0] || {}
  }
  if (rec.cells && typeof rec.cells === "object") return rec.cells
  return null
}

export function cellMaps(rec) {
  if (rec && rec.variants && typeof rec.variants === "object") return Object.entries(rec.variants)
  if (rec && rec.cells && typeof rec.cells === "object") return [["-", rec.cells]]
  return []
}

// Slug-only: *rice* except *non-rice*, plus baby-cereals-dry. Do not scan the
// display name — "Vinegar (… cider, rice)" is not a rice cereal.
export function isRiceInfantCereal(slug, name = "") {
  const s = String(slug || "").toLowerCase()
  if (/non-rice/.test(s)) return false
  if (/baby-cereals/.test(s)) return true
  if (/(^|-)rice(-|$)/.test(s) || /rice-based|rice-containing|rice-milk|rice-grain|rice-bulk|rice-snack|rice-noodle/.test(s)) return true
  return false
}

// The fail-closed canary: infant/grain rice cereals — the path that shipped a
// 7/8 PDF with iAs monitored/subsumed. Rice-named beverages with a known
// empty-total backlog (e.g. plant-milks-rice-based) stay on the WARN list.
export function isRiceCerealCanary(slug, name = "") {
  const s = String(slug || "").toLowerCase()
  if (/non-rice/.test(s)) return false
  if (/baby-cereals/.test(s)) return true
  if (/teething-and-snacks-rice/.test(s) || /mixed-meals-rice/.test(s)) return true
  if (/breakfast-cereal-rice/.test(s) || /pasta-rice/.test(s)) return true
  if (/^rice-/.test(s) || /rice-bulk|rice-noodle|rice-snack|rice-grain|rice-beverage/.test(s)) return true
  return false
}

export function requiredClaimSurface(slug, cells = {}, name = "") {
  const req = [...CLAIM_TOTALS]
  if (isRiceInfantCereal(slug, name)) {
    if (!req.includes("iAs")) req.push("iAs")
  }
  // A species that already carries a defining ML (gov / read-across / special)
  // is on the claim surface: blanking it is a species-only-ML hole.
  for (const sp of SPECIES) {
    const c = cells[sp]
    if (!c) continue
    const t = cellKind(c)
    if ((t === "gov" || t === "read_across" || t === "special" || t === "form_split") && !req.includes(sp)) {
      req.push(sp)
    }
  }
  return req
}

export function evaluateClaimSurface({ slug, name = "", cells, panel }) {
  const map = cells && typeof cells === "object" ? cells : {}
  const required = requiredClaimSurface(slug, map, name)
  const panelList = Array.isArray(panel) && panel.length
    ? panel
    : [...new Set([...required, ...Object.keys(map)])]
  const emptyCells = panelList.filter((a) => cellState(map[a]) === "EMPTY")
  const claimEmpty = required.filter((a) => cellState(map[a]) === "EMPTY")
  const rice = isRiceInfantCereal(slug, name)
  const iAsNumeric = numericCeiling(map.iAs) != null
  const riceMissingIas = rice && !iAsNumeric
  const complete = claimEmpty.length === 0 && !riceMissingIas
  return {
    slug,
    name,
    required,
    panel: panelList,
    empty_cells: emptyCells,
    claim_empty: claimEmpty,
    complete,
    rice,
    rice_missing_ias: riceMissingIas,
    iAs_numeric: iAsNumeric,
  }
}

function decodeEntities(s) {
  return String(s || "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&mdash;/gi, "—")
    .replace(/&ndash;/gi, "–")
    .replace(/&le;/gi, "≤")
    .replace(/&amp;/gi, "&")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

// LIMIT-column tokens that must never ship on a claim-surface cell.
const BANNED_LIMIT = /^(?:monitored|subsumed|blank|n\/a|n\/m|n\.a\.|na|bounded|control|screen|empty|—|–|-|–|&mdash;|&ndash;)$/i

export function isBannedLimitText(raw) {
  const t = decodeEntities(raw).toLowerCase()
  if (!t) return "empty"
  if (BANNED_LIMIT.test(t)) return t === "—" || t === "–" || t === "-" ? "dashes" : t
  if (/^(monitored|subsumed|blank|bounded|control|n\/a|n\/m)\b/.test(t) && !/\d/.test(t)) {
    return (t.match(/^(monitored|subsumed|blank|bounded|control|n\/a|n\/m)/) || ["blank"])[0]
  }
  // "≤ parent total" / "≤ tAs" without a number is a dash-equivalent.
  if (/^(≤|<=|< =)\s*(parent|total|tas|thg|cr)\b/.test(t) && !/\d/.test(t)) return "subsumed"
  return null
}

export function requiredPanelSize(slug, name = "") {
  return isRiceInfantCereal(slug, name) ? CLAIM_TOTALS.length + 1 : CLAIM_TOTALS.length
}

// Incomplete panel headers: "7/8", "7 of 8", "N/M analytes with a published limit"
// where N < the required claim-surface panel.
export function classifyPanelHeader(text, { slug = "", name = "", required } = {}) {
  const s = decodeEntities(text)
  const need = required ?? requiredPanelSize(slug, name)
  const hits = []

  const published = s.match(/(\d+)\s*[\/]\s*(\d+)\s*analytes\s+with\s+a\s+published\s+limit/i)
    || s.match(/(\d+)\s+of\s+(\d+)\s+analytes\s+with\s+a\s+published\s+limit/i)
  if (published) {
    const n = Number(published[1]), m = Number(published[2])
    if (n < need || n < m) {
      hits.push({ kind: "fail", n, m, required: need, pattern: "published-limit", text: published[0] })
    }
  }

  const slashEight = s.match(/\b(\d+)\s*\/\s*(8)\b/)
  if (slashEight && Number(slashEight[1]) < 8) {
    hits.push({ kind: "fail", n: Number(slashEight[1]), m: 8, required: 8, pattern: "7/8", text: slashEight[0] })
  }

  const ofAnalytes = s.match(/(\d+)\s+of\s+(\d+)\s+analytes/i)
  if (ofAnalytes) {
    const n = Number(ofAnalytes[1]), m = Number(ofAnalytes[2])
    if (n < need) {
      hits.push({
        kind: isRiceCerealCanary(slug) || m === 8 ? "fail" : "warn",
        n, m, required: need, pattern: "n-of-m-analytes", text: ofAnalytes[0],
      })
    }
  }
  return hits
}

export function analyteKeyFromLabel(label) {
  const s = decodeEntities(label)
  const m = s.match(/\(([A-Za-z][A-Za-z-]*)\)\s*$/)
  if (m) return m[1]
  const map = {
    lead: "Pb", cadmium: "Cd", "total arsenic": "tAs", "inorganic arsenic": "iAs",
    "mercury, total": "tHg", "mercury (thg)": "tHg", mercury: "tHg",
    methylmercury: "MeHg", nickel: "Ni", tin: "Sn", aluminium: "Al", aluminum: "Al",
    "total chromium": "Cr", "chromium, total": "Cr", "hexavalent chromium": "Cr-VI",
  }
  const k = s.toLowerCase()
  for (const [name, key] of Object.entries(map)) {
    if (k.startsWith(name)) return key
  }
  return null
}

// Master Limit Table: Analyte | Tier | HMTc limit | Binding basis
export function parseMasterLimitRows(html) {
  const start = html.indexOf('id="limits"')
  if (start < 0) return { header: "", rows: [] }
  const from = html.lastIndexOf("<section", start)
  const end = html.indexOf("</section>", start)
  const sec = html.slice(from >= 0 ? from : start, end > 0 ? end + 10 : undefined)
  const cap = sec.match(/<p[^>]*>([\s\S]*?)<\/p>/)
  const header = cap ? decodeEntities(cap[1]) : ""
  const rows = []
  for (const tr of sec.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const tds = [...tr[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map((m) => decodeEntities(m[1]))
    if (tds.length < 3) continue
    const key = analyteKeyFromLabel(tds[0])
    if (!key) continue
    rows.push({ key, label: tds[0], limit: tds[2], raw: tds })
  }
  return { header, rows, section: sec }
}

export function loadCompiledRecords(dataDir) {
  const records = []
  if (!fs.existsSync(dataDir)) return records
  for (const dir of fs.readdirSync(dataDir).filter((d) => d.endsWith("-compiled"))) {
    const base = dir.replace(/-compiled$/, "")
    const pj = path.join(dataDir, `${base}-pages.json`)
    const meta = fs.existsSync(pj) ? (JSON.parse(fs.readFileSync(pj, "utf8"))._meta || {}) : {}
    const dp = path.join(dataDir, dir)
    for (const f of fs.readdirSync(dp).filter((x) => x.endsWith(".json") && !x.startsWith("derivation"))) {
      let rec
      try { rec = JSON.parse(fs.readFileSync(path.join(dp, f), "utf8")) } catch { continue }
      const cells = cellsOf(rec)
      if (!cells) continue
      const slug = rec.slug || f.replace(/\.json$/, "")
      const panel = (meta.panel && meta.panel.length) ? meta.panel : Object.keys(cells)
      records.push({
        category: rec.category ?? meta.category ?? base,
        category_name: rec.category_name || meta.category_name || base,
        compiled_dir: dir,
        slug,
        name: rec.name || slug,
        cells,
        panel,
        rec,
      })
    }
  }
  return records
}

export function claimSurfaceFailReason(ev) {
  if (ev.rice_missing_ias) return "rice/infant cereal missing numeric iAs"
  if (ev.claim_empty.length) return `claim-surface empty: ${ev.claim_empty.join(", ")}`
  return null
}
