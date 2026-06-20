import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
// @ts-ignore
import script from "./scripts/citeThisPage.inline"
import style from "./styles/citeThisPage.scss"

// Per-page "Cite this page" footer block. Visible only on public reference
// pages (ingredients/, products/, metals/, regulations/, synthesis/,
// sources/, mitigation/, supply-chain/, testing/, microbiome/, health/,
// methodology, editorial-standards, roadmap, errata, coverage, licensing,
// curators, trust). Hidden on the homepage, the chat surface, and any
// staff/internal page.
//
// Reveals the canonical citation, a "Copy citation" button, and a download
// link to /api/evidence-packet?slug=<slug>&download=1 for brand-legal and
// regulatory readers who need a signed manifest of the page as published.

const PUBLIC_PREFIXES = [
  "ingredients/",
  "products/",
  "metals/",
  "regulations/",
  "synthesis/",
  "sources/",
  "mitigation/",
  "supply-chain/",
  "testing/",
  "microbiome/",
  "health/",
]
const PUBLIC_EXACT = new Set([
  "methodology",
  "editorial-standards",
  "errata",
  "licensing",
  "curators",
  "roadmap",
  "coverage",
  "trust",
])
const PRIVATE_PREFIXES = [
  "app/",
  "certification/",
  "courses/",
  "lint/",
  "queries/",
  "tags/",
  "staff/",
  "workbench/",
  "audits/",
  "batch-reports/",
  "studies/",
  "advisory/",
]
const HIDDEN_EXACT = new Set([
  "index",
  "ask",
  "log",
  "contact",
  "about",
  "overview",
  "privacy",
  "terms",
  "sprint-status",
  "synthesis",
])

function isCitable(slug: string | undefined): boolean {
  if (!slug) return false
  if (PRIVATE_PREFIXES.some((p) => slug.startsWith(p))) return false
  if (HIDDEN_EXACT.has(slug)) return false
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
  const canonicalUrl = `https://heavymetalindex.com/${slug}`
  const packetUrl = `/api/evidence-packet?slug=${encodeURIComponent(slug as string)}&download=1`
  const today = todayIsoDate()

  const citationLine = wikiDoi
    ? `Heavy Metal Index. "${title}". ${canonicalUrl} (DOI: ${wikiDoi}). Retrieved ${today}. CC BY 4.0.`
    : `Heavy Metal Index. "${title}". ${canonicalUrl}. Retrieved ${today}. CC BY 4.0.`

  // Year for reference-manager records: prefer the page's updated/established
  // year, fall back to the retrieval year.
  const updated = frontmatter
    ? frontmatterString(frontmatter.updated) ?? frontmatterString(frontmatter.established)
    : undefined
  const year = (updated ?? today).slice(0, 4)
  const shareText = `${title} — Heavy Metal Index`

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
            Prose CC BY 4.0. Structured data EU database rights reserved (
            <a href="/licensing">licensing</a>).
          </span>
        </div>
        <div class="hmi-cite-actions">
          <button type="button" data-hmi-cite-toggle aria-expanded="true">
            Hide citation
          </button>
          <a
            class="hmi-cite-download"
            href={packetUrl}
            download
            title="Download a JSON evidence packet — pins this page at its current git commit for litigation, regulatory, or peer-review use."
          >
            Download evidence packet
          </a>
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
          The evidence packet is a JSON manifest pinning this page to its current
          published git commit, with the SHA-256 of the body and the contributing
          source list. It is designed for use as a litigation exhibit, regulatory
          submission, or peer-review supplementary record. See{" "}
          <a href="/methodology">methodology</a> and{" "}
          <a href="/errata">errata</a> for how the underlying evidence is selected
          and corrected.
        </p>
      </div>
    </aside>
  )
}

CiteThisPage.afterDOMLoaded = script
CiteThisPage.css = style

export default (() => CiteThisPage) satisfies QuartzComponentConstructor
