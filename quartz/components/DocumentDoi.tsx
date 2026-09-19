import manualManifest from "../../data/manuals/manifest.json"

import infantManualHistory from "../../data/standards/version-history/infant-and-child-foods.json"

// Display only a deposited edition actually recorded in the version history.
const earlierManualEdition = infantManualHistory.versions.find(
  (edition) => edition.status === "superseded" && normalizeDoi(edition.doi),
)
const manualSlug = "manuals/infant-and-child-foods"

function houseDoi(value: unknown): string | null {
  const doi = normalizeDoi(value)
  return doi && doi.startsWith("10.83138/") ? doi : null
}

export function currentDocumentDoi(slug: string, fm: Record<string, unknown>): string | null {
  if (slug.startsWith("manuals/")) {
    // Write-back path: a live house DOI on the page or in the manifest is current.
    // Zenodo 10.5281 deposits are earlier editions only and never become citation_doi.
    const fromFm = houseDoi(fm.cert_doi) || houseDoi(fm.manual_doi)
    if (fromFm) return fromFm
    const manual = manualManifest.manuals.find((item) => `manuals/${item.slug}` === slug)
    if (!manual || manual.status !== "published") return null
    return houseDoi(manual.doi)
  }
  // A source document's doi is not the DOI of our analysis of that document.
  return normalizeDoi(fm.cert_doi)
}
function normalizeDoi(value: unknown): string | null {
  if (typeof value !== "string") return null
  const doi = value.trim().replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, "")
  return /^10\.\d{4,9}\/\S+$/i.test(doi) && !/^(10\.5072|10\.84435)\//i.test(doi) ? doi : null
}
export function DocumentDoi({ slug, fm }: { slug: string; fm: Record<string, unknown> }) {
  const current = currentDocumentDoi(slug, fm)
  const historical = !current && slug === manualSlug && earlierManualEdition
  const doi = current ?? (historical ? normalizeDoi(historical.doi) : null)
  if (!doi) return null
  return (
    <section class="hmtc-document-doi" aria-label={historical ? "Earlier deposited edition" : "Document DOI"}>
      <p class="hmtc-doi-label">{historical ? "Earlier deposited edition" : "Document DOI"}</p>
      <a href={`https://doi.org/${doi}`} target="_blank" rel="noopener noreferrer">{doi}</a>
      {historical && <p class="hmtc-doi-note">{historical.date} · Earlier deposited edition only. V1 never certified a brand and is retired. The current Manual v3 is minted under prefix 10.83138 after CEO PASS; this page does not invent that DOI.</p>}
    </section>
  )
}
