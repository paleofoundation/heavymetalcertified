import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
// @ts-ignore
import script from "./scripts/citeThisPage.inline"
import style from "./styles/citeThisPage.scss"

// Cert-native per-page citation block. The original inherited Index component
// pointed certification pages at heavymetalindex.com and promised an evidence
// packet endpoint that does not exist on this deploy. The cert surface cites
// itself; underlying evidence remains a one-way outbound link to HMI.

const PUBLIC_PREFIXES = ["regulations/"]
const PUBLIC_EXACT = new Set(["trust"])

function isCitable(slug: string | undefined): boolean {
  if (!slug) return false
  if (PUBLIC_EXACT.has(slug)) return true
  return PUBLIC_PREFIXES.some((p) => slug.startsWith(p))
}

function frontmatterString(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined
  const s = String(value).trim()
  return s && s.toLowerCase() !== "null" ? s : undefined
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10)
}

const CiteThisPage: QuartzComponent = ({ fileData }: QuartzComponentProps) => {
  const slug = fileData.slug
  if (!isCitable(slug)) return null

  const frontmatter = fileData.frontmatter as Record<string, unknown> | undefined
  const title = frontmatter?.title ? String(frontmatter.title) : (slug as string)
  const wikiDoi = frontmatter ? frontmatterString(frontmatter.wiki_doi) : undefined
  const canonicalUrl = `https://heavymetalcertified.com/${slug}`
  const today = todayIsoDate()

  const citationLine = wikiDoi
    ? `Institute of Contaminant Standards. "${title}." Heavy Metal Tested & Certified. ${canonicalUrl} (DOI: ${wikiDoi}). Retrieved ${today}.`
    : `Institute of Contaminant Standards. "${title}." Heavy Metal Tested & Certified. ${canonicalUrl}. Retrieved ${today}.`

  // Year for reference-manager records: prefer the page's updated/established
  // year, fall back to the retrieval year.
  const updated = frontmatter
    ? frontmatterString(frontmatter.updated) ?? frontmatterString(frontmatter.established)
    : undefined
  const year = (updated ?? today).slice(0, 4)
  const shareText = `${title} — Heavy Metal Tested & Certified`

  return (
    <aside
      class="hmi-cite-page"
      aria-label="Cite this page"
      data-cite-title={title}
      data-cite-url={canonicalUrl}
      data-cite-year={year}
      data-cite-doi={wikiDoi ?? ""}
      data-cite-today={today}
      data-cite-slug={slug as string}
    >
      <div class="hmi-cite-summary">
        <div>
          <span class="hmi-cite-label">Cite this page.</span>{" "}
          <span class="hmi-cite-meta">
            Identify the named page, cert program, canonical URL, and retrieval date.
          </span>
        </div>
        <div class="hmi-cite-actions">
          <button type="button" data-hmi-cite-toggle aria-expanded="true">
            Hide citation
          </button>
        </div>
      </div>
      <div data-hmi-cite-detail>
        <p data-hmi-cite-text>{citationLine}</p>
        <div class="hmi-cite-detail-copy">
          <button type="button" data-hmi-cite-copy>Copy citation</button>
          <button type="button" data-hmi-cite-bibtex title="Download a BibTeX record for Zotero, Mendeley, EndNote, or LaTeX.">
            Download .bib
          </button>
          <button type="button" data-hmi-cite-ris title="Download an RIS record for reference managers.">
            Download .ris
          </button>
          <span data-hmi-cite-copy-status role="status" aria-live="polite"></span>
        </div>
        <div class="hmi-cite-share">
          <span class="hmi-cite-share-label">Share</span>
          <button type="button" data-hmi-cite-copylink>Copy link</button>
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(canonicalUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            X
          </a>
          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(canonicalUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            LinkedIn
          </a>
          <a
            href={`mailto:?subject=${encodeURIComponent(shareText)}&body=${encodeURIComponent(
              canonicalUrl,
            )}`}
          >
            Email
          </a>
        </div>
        <p class="hmi-cite-note">
          Certification rules, regulatory records, and source evidence are different layers. See the{" "}
          <a href="/trust">Trust Center</a> for the boundary and the{" "}
          <a href="/standard-stability">standard-stability record</a> for corrections and later editions.
        </p>
      </div>
    </aside>
  )
}

CiteThisPage.afterDOMLoaded = script
CiteThisPage.css = style

export default (() => CiteThisPage) satisfies QuartzComponentConstructor
