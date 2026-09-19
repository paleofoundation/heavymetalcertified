// home-stats.mjs — homepage "Program at a glance" metrics.
//
// Every count is derived from the live SoT:
//   * content/standards/*.md frontmatter (register / in-force / cert_doi)
//   * data/standards/*-compiled + claim-surface helpers (COMPLETE / firm cells)
//   * data/manuals/manifest.json (program edition year)
//
// Do not invent ppb. Do not count ALL-CAPS TODO, monitored, subsumed-null,
// control, or not-material cells as firm. Do not treat draft/scaffold pages
// as in force. Chocolate-style incomplete claim surfaces are not COMPLETE.

import fs from "node:fs"
import path from "node:path"
import {
  CLAIM_TOTALS,
  cellKind,
  evaluateClaimSurface,
  isFirmNumeric,
  loadCompiledRecords,
  numericCeiling,
} from "./claim-surface.mjs"
import { loadPageJoins, pageChildRecords } from "./page-record-join.mjs"

// Live register pages. Aligns with tools/build-standards-pages.mjs: a page is
// in force when it is a published standard, not a hub, finder, draft, or scaffold.
export const IN_FORCE_TYPE = "standard"
export const EXCLUDED_PAGE_TYPES = Object.freeze([
  "standard-in-development",
  "draft",
  "scaffold",
  "standards-index",
  "standards-finder",
])
export const EXCLUDED_SLUGS = Object.freeze(["index", "finder"])

// Same sandbox prefixes as tools/standard-readiness-lint.mjs. A test DOI is
// not a live production DataCite record.
export const TEST_DOI_PREFIXES = Object.freeze(["10.5072", "10.82", "10.84435"])

// firm_analyte_limits: numeric metal×standard cells that are a government floor
// or a disclosed read-across. form_split is a gov_floor presentation (the
// compiler already placed the strictest form value on the cell). special,
// subsumed, monitored, control, not-material, and TODO tokens are excluded.
export const FIRM_LIMIT_KINDS = Object.freeze(["gov", "read_across", "form_split"])

const INCOMPLETE_TOKEN = /^(?:TODO|TBD|FIXME|WIP|PLACEHOLDER|INCOMPLETE)$/i

export function parseFrontmatter(raw) {
  const end = raw.indexOf("\n---", 4)
  return end > 0 ? raw.slice(0, end) : raw
}

export function frontmatterField(fm, key) {
  const m = fm.match(new RegExp(`^${key}:\\s*(.+)$`, "m"))
  if (!m) return ""
  return m[1].trim().replace(/^["']|["']$/g, "")
}

export function productionDoi(value) {
  const doi = String(value || "").trim()
  if (!/^10\.\d{4,9}\/\S+$/.test(doi)) return null
  if (TEST_DOI_PREFIXES.some((p) => doi.startsWith(p))) return null
  return doi
}

export function isIncompleteToken(cell) {
  if (!cell || typeof cell !== "object") return true
  const bits = [cell.value, cell.type, cell.cell_kind, cell.provenance, cell.limit]
  return bits.some((v) => typeof v === "string" && INCOMPLETE_TOKEN.test(v.trim()))
}

// One metal×standard cell. form_split counts once (the row), not once per form.
export function isGovFloorOrReadAcross(cell) {
  if (!cell || typeof cell !== "object") return false
  if (isIncompleteToken(cell)) return false
  if (numericCeiling(cell) == null) return false
  if (!isFirmNumeric(numericCeiling(cell))) return false
  return FIRM_LIMIT_KINDS.includes(cellKind(cell))
}

export function countFirmAnalyteLimits(cells) {
  const map = cells && typeof cells === "object" ? cells : {}
  return Object.values(map).filter(isGovFloorOrReadAcross).length
}

export function listStandardPages(contentDir) {
  if (!fs.existsSync(contentDir)) return []
  return fs.readdirSync(contentDir)
    .filter((f) => f.endsWith(".md") && !f.startsWith("_"))
    .map((f) => {
      const slug = f.replace(/\.md$/, "")
      const raw = fs.readFileSync(path.join(contentDir, f), "utf8")
      const fm = parseFrontmatter(raw)
      return {
        slug,
        type: frontmatterField(fm, "type"),
        cert_doi: productionDoi(frontmatterField(fm, "cert_doi") || frontmatterField(fm, "doi")),
      }
    })
}

export function isInForcePage(page) {
  if (!page || EXCLUDED_SLUGS.includes(page.slug)) return false
  if (EXCLUDED_PAGE_TYPES.includes(page.type)) return false
  return page.type === IN_FORCE_TYPE
}

export function currentEditionYear(manifest) {
  const manuals = Array.isArray(manifest?.manuals) ? manifest.manuals : []
  const years = manuals
    .map((m) => String(m.edition || ""))
    .map((s) => (s.match(/(\d{4})/) || [])[1])
    .filter(Boolean)
    .map(Number)
  if (!years.length) {
    throw new Error("home-stats: no program edition year in manuals manifest")
  }
  return String(Math.max(...years))
}

export function resolvePageRecords(slug, compiledBySlug, joins) {
  if (compiledBySlug.has(slug)) return [compiledBySlug.get(slug)]
  const children = pageChildRecords(slug, joins)
  if (!children) return []
  return children.map((s) => compiledBySlug.get(s)).filter(Boolean)
}

export function formatCount(n) {
  return Number(n).toLocaleString("en-US")
}

// Homepage glance lock (HMTC-HOME-GLANCE-THIN-1). Cut metrics stay in
// `metrics` for SCORECARD/tests and must never appear in snapshot_rows.
export const GLANCE_ROW_LABELS = Object.freeze([
  "Subcategory standards in force",
  "Live DOIs",
  "Priority metals",
])

export const CUT_GLANCE_LABELS = Object.freeze([
  "Certified analyte panel",
  "Firm analyte limits",
  "Current edition",
  "Carrying a firm limit",
])

export function snapshotRows(metrics) {
  return [
    ["Subcategory standards in force", formatCount(metrics.subcategory_standards_in_force)],
    ["Live DOIs", formatCount(metrics.live_dois)],
    ["Priority metals", formatCount(metrics.priority_metals)],
  ]
}

export const METRIC_DEFINITIONS = Object.freeze({
  subcategory_standards_in_force:
    "Count of live standard pages on the register: content/standards/*.md with type: standard. Excludes index, finder, draft, scaffold, and standard-in-development.",
  carrying_firm_limit:
    "In-force pages whose compiled claim surface is COMPLETE (tools/lib/claim-surface.mjs evaluateClaimSurface). Aggregate pages are COMPLETE only when every child record is COMPLETE. Incomplete chocolate-style rows are excluded.",
  firm_analyte_limits:
    "Count of numeric metal×standard limit cells whose kind is gov, read_across, or form_split (gov_floor presentation). One cell per analyte per compiled record. TODO / monitored / subsumed-null / control / not-material are excluded.",
  certified_analyte_panel:
    "Locked claim-surface panel size = CLAIM_TOTALS.length (Big-8 totals). Program Manual Part 2: eight limit analytes. Species are pathway reflexes, not extra panel seats. The retired homepage 10 was a miscount.",
  priority_metals:
    "Locked Big-8 (Pb, tAs, Cd, tHg, Ni, Sn, Al, Cr) = CLAIM_TOTALS.length.",
  current_edition:
    "Latest four-digit edition year from data/manuals/manifest.json (program edition SoT).",
  as_of:
    "ISO date of generate (YYYY-MM-DD). The homepage omits a frozen 'As of' line because the snapshot is live-at-build.",
  live_dois:
    "In-force pages whose cert_doi is a production DataCite DOI (not a sandbox/test prefix).",
})

export function computeHomeStats({
  contentDir,
  dataDir,
  manualsPath,
  now = new Date(),
} = {}) {
  const pages = listStandardPages(contentDir).filter(isInForcePage)
  const compiled = loadCompiledRecords(dataDir)
  const compiledBySlug = new Map(compiled.map((r) => [r.slug, r]))
  const joins = loadPageJoins(dataDir)
  const manifest = manualsPath && fs.existsSync(manualsPath)
    ? JSON.parse(fs.readFileSync(manualsPath, "utf8"))
    : { manuals: [] }

  const countedRecords = new Set()
  let firmCells = 0
  let carrying = 0
  let chocolateComplete = null

  for (const page of pages) {
    const records = resolvePageRecords(page.slug, compiledBySlug, joins)
    const complete = records.length > 0 && records.every((r) => evaluateClaimSurface(r).complete)
    if (complete) carrying += 1
    if (page.slug === "chocolate") chocolateComplete = complete
    for (const rec of records) {
      if (countedRecords.has(rec.slug)) continue
      countedRecords.add(rec.slug)
      firmCells += countFirmAnalyteLimits(rec.cells)
    }
  }

  const metrics = {
    subcategory_standards_in_force: pages.length,
    carrying_firm_limit: carrying,
    firm_analyte_limits: firmCells,
    certified_analyte_panel: CLAIM_TOTALS.length,
    priority_metals: CLAIM_TOTALS.length,
    current_edition: currentEditionYear(manifest),
    live_dois: pages.filter((p) => p.cert_doi).length,
  }

  const asOf = new Date(now)
  const as_of = Number.isNaN(asOf.getTime()) ? "" : asOf.toISOString().slice(0, 10)

  return {
    generated_by: "tools/build-home-stats.mjs",
    as_of,
    metrics,
    definitions: METRIC_DEFINITIONS,
    snapshot_rows: snapshotRows(metrics),
    exclusions: {
      chocolate_carrying_firm_limit: chocolateComplete,
    },
  }
}

export function assertHomeStats(stats) {
  const m = stats.metrics
  for (const [key, value] of Object.entries(m)) {
    if (typeof value === "number" && !(value >= 0)) {
      throw new Error(`home-stats: ${key} must be >= 0 (got ${value})`)
    }
  }
  if (m.certified_analyte_panel !== CLAIM_TOTALS.length) {
    throw new Error("home-stats: certified_analyte_panel must follow CLAIM_TOTALS (locked Big-8)")
  }
  if (m.priority_metals !== CLAIM_TOTALS.length) {
    throw new Error("home-stats: priority_metals must follow CLAIM_TOTALS (locked Big-8)")
  }
  if (stats.exclusions.chocolate_carrying_firm_limit === true) {
    throw new Error("home-stats: chocolate must not count as carrying_firm_limit (incomplete claim surface)")
  }
  if (m.carrying_firm_limit > m.subcategory_standards_in_force) {
    throw new Error("home-stats: carrying_firm_limit cannot exceed standards in force")
  }
  const labels = Array.isArray(stats.snapshot_rows) ? stats.snapshot_rows.map(([k]) => k) : []
  if (labels.length !== GLANCE_ROW_LABELS.length || labels.join("\0") !== GLANCE_ROW_LABELS.join("\0")) {
    throw new Error(
      `home-stats: glance must be exactly ${GLANCE_ROW_LABELS.join(" | ")} (got ${labels.join(" | ") || "none"})`,
    )
  }
  if (labels.some((k) => CUT_GLANCE_LABELS.includes(k) || /^As of\b/i.test(String(k)))) {
    throw new Error("home-stats: cut metrics must not appear in snapshot_rows")
  }
  return true
}
