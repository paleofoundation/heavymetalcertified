// house-cite.mjs — APA S-DOI-CITE-APA-1 lock for standards and Program Manuals.
// When cert_doi is set: Standard No. = cert_doi, URL = https://doi.org/<cert_doi>.
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

export function houseApaCite({ title, year = "2026", doi = null }) {
  const d = normalizeHouseDoi(doi)
  const stdNo = d ? ` (Standard No. ${d})` : ""
  const url = d ? ` ${houseDoiUrl(d)}` : ""
  return `Pendergrass, K. (${year}). ${title}${stdNo}. Institute of Contaminant Standards.${url}`
}

export function houseFooterCite({ label, edition, doi, reserved = "All rights reserved" }) {
  const d = normalizeHouseDoi(doi)
  const bits = [label, edition]
  if (d) {
    bits.push(`Standard No. ${d}`)
    bits.push(houseDoiUrl(d))
  }
  bits.push(reserved)
  return bits.filter(Boolean).join("  ·  ")
}
