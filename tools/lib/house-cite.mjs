// house-cite.mjs — APA cite lock for standards (S-DOI-CITE-APA-1) and Program Manuals
// (HMTC-MANUAL-CITE-NO-STANDARD-NO-1).
//
// Standards (when cert_doi set): Standard No. = cert_doi, URL = https://doi.org/<cert_doi>.
// Manuals (when cert_doi set): APA title + publisher + https://doi.org/<cert_doi>.
// Manuals NEVER emit "Standard No." or "Manual No." — that label is standards-only.
// Never page URL as cite URL. Never registration-pending. Never CC BY on the cite line.

export const HOUSE_COPYRIGHT =
  "© 2026 Institute of Contaminant Standards / Heavy Metal Certified. All rights reserved."

export function normalizeHouseDoi(raw) {
  if (raw == null) return null
  const doi = String(raw).trim()
  if (!doi || doi.toLowerCase() === "null") return null
  if (!/^10\.\d{4,9}\/\S+$/.test(doi)) return null
  return doi
}

export function houseDoiUrl(doi) {
  const d = normalizeHouseDoi(doi)
  return d ? `https://doi.org/${d}` : null
}

/** Manuals never take the Standard No. label. Infer from kind, DOI suffix, or title. */
export function isManualCite({ kind, doi, title } = {}) {
  if (kind === "manual") return true
  const d = normalizeHouseDoi(doi)
  if (d && /\/hmtc\.manual\./.test(d)) return true
  if (typeof title === "string" && /Program Manual/i.test(title)) return true
  return false
}

export function houseApaCite({ title, year = "2026", doi = null, kind = null } = {}) {
  const d = normalizeHouseDoi(doi)
  const url = d ? ` ${houseDoiUrl(d)}` : ""
  // Standard No. is standards-only (S-DOI-CITE-APA-1). Never Standard No. / Manual No. on a manual.
  const stdNo = d && !isManualCite({ kind, doi: d, title }) ? ` (Standard No. ${d})` : ""
  return `Pendergrass, K. (${year}). ${title}${stdNo}. Institute of Contaminant Standards.${url}`
}

export function houseFooterCite({
  label,
  edition,
  doi,
  reserved = "All rights reserved",
  kind = null,
  title = null,
} = {}) {
  const d = normalizeHouseDoi(doi)
  const bits = [label, edition]
  if (d) {
    if (!isManualCite({ kind, doi: d, title: title || label })) {
      bits.push(`Standard No. ${d}`)
    }
    bits.push(houseDoiUrl(d))
  }
  bits.push(reserved)
  return bits.filter(Boolean).join("  ·  ")
}
