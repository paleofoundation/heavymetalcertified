import { currentDocumentDoi } from "./DocumentDoi"

export const DOCUMENT_TYPES = new Set(["standard", "standard-in-development", "public-briefing", "article", "analyte", "rationale", "regulation", "program", "guide", "comparison", "manual"])
export function isDocument(fm: Record<string, unknown>, slug: string): boolean {
  return DOCUMENT_TYPES.has(String(fm.type)) && !slug.endsWith("/index")
}
export function documentPdf(fm: Record<string, unknown>, slug: string): string {
  // Current web-edition PDFs are printed from the same built HTML, including tables.
  return isDocument(fm, slug) ? `/${slug}.pdf` : ""
}
export function dateLabel(value: unknown): string | undefined {
  if (!value) return undefined
  const s = value instanceof Date ? value.toISOString() : String(value)
  return /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : s
}
export const ELEMENTS: Record<string, { symbol: string; number: number; name: string }> = {
  lead: { symbol: "Pb", number: 82, name: "Lead" },
  cadmium: { symbol: "Cd", number: 48, name: "Cadmium" },
  arsenic: { symbol: "As", number: 33, name: "Arsenic" },
  mercury: { symbol: "Hg", number: 80, name: "Mercury" },
  nickel: { symbol: "Ni", number: 28, name: "Nickel" },
  tin: { symbol: "Sn", number: 50, name: "Tin" },
  aluminum: { symbol: "Al", number: 13, name: "Aluminum" },
  chromium: { symbol: "Cr", number: 24, name: "Chromium" },
}
export function pageElement(slug: string) {
  return /^(analytes|why-we-limit)\//.test(slug) ? ELEMENTS[slug.split("/")[1]] : undefined
}
export function pageSnapshot(fm: Record<string, any>, slug: string, kind: string): [string, string][] {
  // Governing-instrument pages opt out of register-chrome snapshot rows.
  // An omitted `snapshot` must not fall through to the type:standard defaults.
  if (fm.hero_snapshot === false) return []
  const rows: [string, string][] = []
  if (Array.isArray(fm.snapshot)) {
    for (const row of fm.snapshot) {
      const pair = Array.isArray(row) ? row : [row.k ?? row.label, row.v ?? row.value]
      if (pair[0] != null && pair[1] != null && !/^doi$/i.test(String(pair[0]))) rows.push([String(pair[0]), String(pair[1])])
    }
    if (rows.length) return rows
  }
  const add = (label: string, value: unknown) => { if (value != null && value !== "") rows.push([label, String(value)]) }
  const element = pageElement(slug)
  if (element) {
    add("Element", element.name)
    add("Symbol", fm.analyte_symbol ?? element.symbol)
    add("Atomic number", fm.atomic_number ?? element.number)
    add("Document type", fm.type === "rationale" ? "Rationale" : "Analyte reference")
  } else if (String(fm.type).startsWith("standard")) {
    add("Standard version", fm.standard_version ?? fm.version)
    add("Category", fm.category_name)
    add("Native basis", fm.native_basis)
    add("Firm analyte limits", fm.firm_analytes)
    add("Effective", dateLabel(fm.effective_date))
  } else {
    add("Document type", kind)
    add("Series", fm.section)
    add("Published", dateLabel(fm.briefing_date ?? fm.date))
    add("Status", fm.status)
    add("Effective", dateLabel(fm.effective_date))
    add("Updated", dateLabel(fm.updated))
  }
  if (rows.length < 2) add("Publisher", "Heavy Metal Certified")
  return rows
}
export { currentDocumentDoi }
