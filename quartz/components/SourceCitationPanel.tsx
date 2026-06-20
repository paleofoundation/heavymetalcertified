import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import style from "./styles/sourceCitationPanel.scss"

function frontmatterString(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined
  const normalized = String(value).trim()
  return normalized && normalized.toLowerCase() !== "null" ? normalized : undefined
}

function frontmatterList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) => {
      const normalized = frontmatterString(item)
      return normalized ? [normalized] : []
    })
  }

  const normalized = frontmatterString(value)
  return normalized ? [normalized] : []
}

function doiUrl(doi: string): string {
  return doi.startsWith("http://") || doi.startsWith("https://") ? doi : `https://doi.org/${doi}`
}

export default (() => {
  const SourceCitationPanel: QuartzComponent = ({ fileData }: QuartzComponentProps) => {
    const frontmatter = fileData.frontmatter as Record<string, unknown> | undefined
    const isSourcePage = frontmatter?.type === "source" || fileData.slug?.startsWith("sources/")
    if (!frontmatter || !isSourcePage) return null

    const doi = frontmatterString(frontmatter.doi)
    const accessUrl = frontmatterString(frontmatter.access_url)
    const publication = frontmatterString(frontmatter.publication)
    const sourceType = frontmatterString(frontmatter.source_type)
    const year = frontmatterString(frontmatter.year)
    const reviewState = frontmatterString(frontmatter.review_state)
    const license = frontmatterString(frontmatter.license)
    const authors = frontmatterList(frontmatter.authors)
    const doiHref = doi ? doiUrl(doi) : undefined

    return (
      <section class="hmi-source-citation-panel" aria-label="Source citation and access">
        <div>
          <p class="hmi-source-citation-kicker">Source access</p>
          <dl class="hmi-source-citation-facts">
            {doiHref ? (
              <div>
                <dt>DOI</dt>
                <dd>
                  <a href={doiHref} target="_blank" rel="noopener noreferrer">
                    {doi}
                  </a>
                </dd>
              </div>
            ) : accessUrl ? (
              <div>
                <dt>Source URL</dt>
                <dd>
                  <a href={accessUrl} target="_blank" rel="noopener noreferrer">
                    {accessUrl}
                  </a>
                </dd>
              </div>
            ) : null}
            {publication ? (
              <div>
                <dt>Publication</dt>
                <dd>{publication}</dd>
              </div>
            ) : null}
            {year ? (
              <div>
                <dt>Year</dt>
                <dd>{year}</dd>
              </div>
            ) : null}
            {authors.length > 0 ? (
              <div>
                <dt>Authors</dt>
                <dd>{authors.slice(0, 4).join("; ")}</dd>
              </div>
            ) : null}
            {sourceType ? (
              <div>
                <dt>Source type</dt>
                <dd>{sourceType.replace(/-/g, " ")}</dd>
              </div>
            ) : null}
            {reviewState ? (
              <div>
                <dt>Review state</dt>
                <dd>{reviewState.replace(/_/g, " ")}</dd>
              </div>
            ) : null}
            {license ? (
              <div>
                <dt>License</dt>
                <dd>{license.replace(/-/g, " ")}</dd>
              </div>
            ) : null}
          </dl>
        </div>
      </section>
    )
  }

  SourceCitationPanel.css = style
  return SourceCitationPanel
}) satisfies QuartzComponentConstructor
