// Row and reference text for the standard PDF. Pure: no react-pdf, so the
// olive-oil assertions can run in CI, which does not install the renderer.
// Numbers are read from the compiled cell. Nothing here invents a ceiling.

const JUR = { EU: "European Union", UK: "United Kingdom", CODEX: "Codex Alimentarius", US: "US FDA", CA: "Canada", "AU-NZ": "Australia / New Zealand", CN: "China", IN: "India", BR: "Brazil", GSO: "Gulf (GSO)", KR: "South Korea", MX: "Mexico", TR: "Türkiye", PY: "Paraguay", MERCOSUR: "Mercosur", IL: "Israel", TH: "Thailand", VN: "Vietnam", PH: "Philippines", SG: "Singapore", CL: "Chile", CO: "Colombia", PA: "Panama", HK: "Hong Kong", MA: "Morocco", international: "Codex / international" }
const jl = (j) => JUR[j] || j || ""
export const fmtNum = (v) => (typeof v === "number" && Number.isFinite(v) ? v.toLocaleString("en-US") : String(v))

export function publishedValue(c) {
  if (!c) return null
  if (c.value != null) return c.value
  if (c.strictest_form_value != null) return c.strictest_form_value
  const vals = (c.forms || []).map((f) => f && f.value).filter((v) => v != null)
  return vals.length ? Math.min(...vals) : null
}
export function cellKindOf(c) {
  return String((c && (c.type || c.cell_kind)) || "").toLowerCase()
}
function disclosedBasis(c) {
  return c && c.binding_short ? String(c.binding_short).replace(/\|/g, "/") : ""
}
// Named sovereign instruments, matched on source_id / binding_id (and the
// instrument path). Jurisdiction alone is not enough: three EU read-across
// cells are three different regulations, and GSO / Israel / Codex are the
// binding names, not "Gulf (GSO)" or "Codex Alimentarius".
const INSTRUMENT_PATTERNS = [
  { re: /2024[_/-]?1987|eu2024_ni|eu-2024-1987/, name: "EU 2024/1987" },
  { re: /gb[_-]?2762/, name: "GB 2762" },
  { re: /swrcb/, name: "CA SWRCB" },
  { re: /(?:^|[^0-9])10[_/-]?2011|eu_10_2011|eu-10-2011/, name: "EU 10/2011" },
  { re: /2023[_/-]?915|eu2023_|eu2023-contaminants/, name: "EU 2023/915" },
  { re: /gso[_-]?193|gso-193/, name: "GSO" },
  { re: /codex/, name: "Codex" },
]
const JURISDICTION_NAMES = { GSO: "GSO", IL: "Israel", CODEX: "Codex" }
function instrumentBlob(c) {
  return [c && c.source_id, c && c.binding_id, c && c.binding_instrument, c && c.binding_page].filter(Boolean).join(" ")
}
// The public name of the instrument that sets the cell. Reads source_id (read-across)
// and binding_id, then binding_jurisdiction / source_jurisdiction. binding_short wins
// only when no instrument name resolves, so a disclosed ecolabel sentence is kept
// and a bare "European Union" does not hide EU 2024/1987 vs EU 2023/915 vs EU 10/2011.
export function sourceName(c) {
  if (!c) return ""
  const blob = instrumentBlob(c)
  for (const { re, name } of INSTRUMENT_PATTERNS) if (re.test(blob)) return name
  const jur = c.binding_jurisdiction || c.source_jurisdiction || ""
  if (JURISDICTION_NAMES[jur]) return JURISDICTION_NAMES[jur]
  const disclosed = disclosedBasis(c)
  if (disclosed) return disclosed
  return jl(jur)
}
function basisPhrase(c) {
  const name = sourceName(c)
  const t = cellKindOf(c)
  const disclosed = disclosedBasis(c)
  if (disclosed && name === disclosed) return disclosed
  if (t === "read_across") return name ? `read-across (${name})` : `human-grade read-across (${jl(c.source_jurisdiction)})`
  if (t === "gov") return name ? `government maximum level (${name})` : "government maximum level"
  if (t === "form_split") return name ? `strictest government ML, set by product form (${name})` : "strictest government ML, set by product form"
  if (t === "screen") return `screening ceiling (${name || jl(c.binding_jurisdiction || c.source_jurisdiction)})`
  return name ? `sovereign maximum level (${name})` : "sovereign maximum level"
}
// A null species value is not a published ceiling. binding_total is the parent
// total, and printing it makes iAs look like its own 100 ppb limit. Print the
// inequality instead: iAs ≤ tAs, MeHg ≤ tHg.
export function speciesShown(c) {
  const parent = c.subsumed_by || c.bounded_by || "parent"
  if (c.value == null) return `≤ ${parent}`
  return fmtNum(c.value)
}
export function cellRow([k, label], c, limitOverride) {
  if (!c) return `| ${label} | ${limitOverride ?? "—"} | not compiled |`
  const t = cellKindOf(c)
  const published = publishedValue(c)
  if (published != null && t !== "subsumed") {
    return `| ${label} | ${limitOverride ?? fmtNum(published)} | ${basisPhrase(c)} |`
  }
  if (limitOverride && t !== "subsumed") return `| ${label} | ${limitOverride} | bounded by parent / per-variant (see derivation) |`
  if (t === "subsumed") {
    const parent = c.subsumed_by || c.bounded_by || "parent"
    return `| ${label} | ${limitOverride ?? speciesShown(c)} | bounded by ${parent} (reflex speciation) |`
  }
  if (t === "control") return `| ${label} | control | measured every lot; no human-food maximum |`
  if (t === "not_material" || t === "not-material") return `| ${label} | n/m | not material in this matrix |`
  return `| ${label} | — | — |`
}
export function derivRow([k, label], c) {
  if (!c) return `| ${label} | — | not compiled |`
  const t = cellKindOf(c)
  const published = publishedValue(c)
  if (published != null && t !== "subsumed") {
    const scope = String(c.binding_scope || c.source_scope || c.analog_scope || c.analog_label || "").replace(/\|/g, "/")
    const name = sourceName(c)
    const src = scope && name && name !== disclosedBasis(c) ? `${basisPhrase(c)}; ${scope}` : basisPhrase(c)
    return `| ${label} | ${fmtNum(published)} | ${src} |`
  }
  if (t === "subsumed") {
    const parent = c.subsumed_by || c.bounded_by || "parent"
    return `| ${label} | ${speciesShown(c)} | bounded by ${parent} (reflex speciation) |`
  }
  if (t === "control") return `| ${label} | control | ${(c.control || c.rationale || "mandatory surveillance control").replace(/\|/g, "/")} |`
  if (t === "not_material" || t === "not-material") return `| ${label} | n/m | ${(c.control || c.rationale || "not material").replace(/\|/g, "/")} |`
  return `| ${label} | — | — |`
}
// One reference per real instrument, in panel order, so Cd and tHg share Israel
// and the three EU read-across cells stay distinct. Subsumed species cite their
// parent, not a second source.
const REF_ANALYTE_ORDER = ["Pb", "Cd", "tAs", "tHg", "Ni", "Cr", "Cr-VI", "Sn", "Al", "iAs", "MeHg", "Sb"]
export function references(cells) {
  const map = cells && typeof cells === "object" ? cells : {}
  const keys = REF_ANALYTE_ORDER.concat(Object.keys(map).filter((k) => !REF_ANALYTE_ORDER.includes(k)))
  const seen = new Map()
  const order = []
  for (const k of keys) {
    const c = map[k]
    if (!c) continue
    const t = cellKindOf(c)
    if (t === "subsumed" || t === "control" || t === "not_material" || t === "not-material") continue
    if (publishedValue(c) == null && !disclosedBasis(c)) continue
    const name = sourceName(c)
    if (!name) continue
    if (!seen.has(name)) {
      const scope = String(c.binding_scope || c.source_scope || "").replace(/\|/g, "/").trim()
      seen.set(name, { name, ks: [], scope, readAcross: t === "read_across" })
      order.push(name)
    }
    const g = seen.get(name)
    g.ks.push(k)
    if (t !== "read_across") g.readAcross = false
  }
  return order.map((name, i) => {
    const g = seen.get(name)
    const scope = g.scope ? ` ${g.scope}.` : ""
    return {
      n: i + 1,
      head: name,
      meta: `Binds ${g.ks.join(", ")}.${scope}`,
      tag: g.readAcross ? "Read-across" : "Maximum level",
    }
  })
}

// For an aggregate page, collapse one analyte across variants into the page's display convention:
// null when every variant agrees (caller uses the normal single-value row), else "X label1 / Y label2".
export function collapseLimitCell(variants, k) {
  const show = (c) => {
    if (!c) return "—"
    if (cellKindOf(c) === "subsumed") return speciesShown(c)
    if (publishedValue(c) != null) return fmtNum(publishedValue(c))
    if (c.type === "control") return "control"
    if (c.type === "not_material") return "n/m"
    return "—"
  }
  const vals = variants.map((v) => show(v.cells[k]))
  if (vals.every((x) => x === vals[0])) return null
  return variants.map((v, i) => `${vals[i]} ${v.label}`).join(" / ")
}
