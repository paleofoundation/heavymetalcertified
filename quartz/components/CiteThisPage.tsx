import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
// @ts-ignore
import script from "./scripts/citeThisPage.inline"
import style from "./styles/citeThisPage.scss"

function isCitable(slug: string | undefined): boolean {
  return Boolean(slug?.startsWith("regulations/") && !slug.endsWith("/index"))
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
  const certDoi = frontmatter
    ? frontmatterString(frontmatter.cert_doi) ?? frontmatterString(frontmatter.doi)
    : undefined
  const sourceUrl = frontmatter ? frontmatterString(frontmatter.source_url) : undefined
  const canonicalUrl = `https://heavymetalcertified.com/${slug}`
  const today = todayIsoDate()

  const citationLine = certDoi
    ? `Heavy Metal Certified. "${title}". ${canonicalUrl} (DOI: ${certDoi}). Retrieved ${today}.`
    : `Heavy Metal Certified. "${title}". ${canonicalUrl}. Retrieved ${today}.`

  // Year for reference-manager records: prefer the page's updated/established
  // year, fall back to the retrieval year.
  const updated = frontmatter
    ? frontmatterString(frontmatter.updated) ?? frontmatterString(frontmatter.established)
    : undefined
  const year = (updated ?? today).slice(0, 4)
  const shareText = `${title}, Heavy Metal Certified`

  return (
    <aside
      class="hmi-cite-page"
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
            A published reference to the underlying government instrument.
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
        <p class="hmi-cite-note">
          This page records a regulatory source; it does not create or replace the
          cited law, rule, or guidance. See the{" "}
          <a href="/program/structure">program methodology</a>, or{" "}
          <a href={`mailto:karen@paleofoundation.com?subject=${encodeURIComponent(`Correction: ${title}`)}`}>
            report a correction
          </a>.
        </p>
      </div>
    </aside>
  )
}

CiteThisPage.afterDOMLoaded = script
CiteThisPage.css = style

export default (() => CiteThisPage) satisfies QuartzComponentConstructor
