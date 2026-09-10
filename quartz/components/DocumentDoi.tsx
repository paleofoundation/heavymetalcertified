import manualManifest from "../../data/manuals/manifest.json"

import infantManualHistory from "../../data/standards/version-history/infant-and-child-foods.json"

// Display only a deposited edition actually recorded in the version history.
const earlierManualEdition = infantManualHistory.versions.find(
  (edition) => edition.status === "superseded" && normalizeDoi(edition.doi),
)
const manualSlug = "manuals/infant-and-child-foods"

export function currentDocumentDoi(slug: string, fm: Record<string, unknown>): string | null {
  if (slug.startsWith("manuals/")) {
    const manual = manualManifest.manuals.find((item) => `manuals/${item.slug}` === slug)
    if (!manual || manual.status !== "published") return null
    return normalizeDoi(manual.doi)
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
      {historical && <p class="hmtc-doi-note">{historical.date} · Superseded. This DOI cites the earlier deposited manual; the current web edition has no DOI.</p>}
    </section>
  )
}
