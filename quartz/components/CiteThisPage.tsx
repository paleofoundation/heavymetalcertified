import { currentDocumentDoi, isDocument } from "./documentMetadata"
import { KAREN, isKarenAuthor } from "./authorIdentity"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
// @ts-ignore
import script from "./scripts/citeThisPage.inline"
import style from "./styles/citeThisPage.scss"

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
  const frontmatter = fileData.frontmatter as Record<string, unknown> | undefined
  if (!slug || !frontmatter || !isDocument(frontmatter, slug)) return null
  const title = frontmatter?.title ? String(frontmatter.title) : (slug as string)
  const certDoi = currentDocumentDoi(slug, frontmatter)
  const author = isKarenAuthor(frontmatter, slug) ? KAREN.name : String(frontmatter.author ?? "Heavy Metal Certified")
  const sourceUrl = frontmatter ? frontmatterString(frontmatter.source_url) : undefined
  const canonicalUrl = `https://heavymetalcertified.com/${slug}`
  const today = todayIsoDate()

  const citationLine = certDoi
    ? `${author}. "${title}". ${canonicalUrl} (DOI: ${certDoi}). Retrieved ${today}.`
    : `${author}. "${title}". ${canonicalUrl}. Retrieved ${today}.`

  // Year for reference-manager records: prefer the page's updated/established
  // year, fall back to the retrieval year.
  const updated = frontmatter
    ? frontmatterString(frontmatter.updated) ?? frontmatterString(frontmatter.established)
    : undefined
  const year = (updated ?? today).match(/\b(19|20)\d{2}\b/)?.[0] ?? today.slice(0, 4)
  const shareText = `${title}, Heavy Metal Certified`

  return (
    <aside
      id="hmtc-page-citation"
      class="hmi-cite-page"
      data-cite-author={author}
      aria-label="Cite this page"
      data-cite-title={title}
      data-cite-url={canonicalUrl}
      data-cite-year={year}
      data-cite-doi={certDoi ?? ""}
      data-cite-today={today}
      data-cite-slug={slug as string}
    >
      <div class="hmi-cite-summary">
        <div>
          <span class="hmi-cite-label">Cite this page.</span>{" "}
          <span class="hmi-cite-meta">
            The current web edition, with reference-manager exports.
          </span>
        </div>
        <div class="hmi-cite-actions">
          <button type="button" data-hmi-cite-toggle aria-expanded="true">
            Hide citation
          </button>
          {sourceUrl && (
            <a class="hmi-cite-download" href={sourceUrl} target="_blank" rel="noopener noreferrer">
              Open primary source ↗
            </a>
          )}
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
        <p class="hmi-cite-note">Cite this web edition by its title and URL. A DOI is included when the current edition has a deposited record. Earlier-edition DOIs remain identified separately in the sidebar.</p>
      </div>
    </aside>
  )
}

CiteThisPage.afterDOMLoaded = script
CiteThisPage.css = style

export default (() => CiteThisPage) satisfies QuartzComponentConstructor
