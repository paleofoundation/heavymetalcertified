import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { type FullSlug } from "../util/path"

function frontmatterString(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined
  const s = String(value).trim()
  return s && s.toLowerCase() !== "null" ? s : undefined
}

function isManualPage(slug: string, fm: Record<string, unknown>): boolean {
  if (!slug.startsWith("manuals/") || slug === "manuals/index") return false
  return fm.type === "standard" || fm.type === "manual" || Boolean(fm.pdf || fm.edition)
}

const ManualAuthority: QuartzComponent = ({ fileData }: QuartzComponentProps) => {
  const slug = String((fileData.slug ?? "") as FullSlug)
  const fm = (fileData.frontmatter ?? {}) as Record<string, unknown>
  if (!isManualPage(slug, fm)) return null

  const pdfHref = frontmatterString(fm.pdf)
  const coverHref = frontmatterString(fm.pdf_cover)
  const editionChip =
    frontmatterString(fm.edition_chip) ||
    [frontmatterString(fm.edition), /v2/i.test(String(fm.methodology_version ?? "")) ? "Method v2" : null]
      .filter(Boolean)
      .join(" · ") ||
    "Program Manual"
  const title = frontmatterString(fm.title) || "Program Manual"

  return (
    <div class="hmtc-manual-authority" data-manual-authority="1">
      <div class="hmtc-manual-authority-label">Governing instrument</div>
      {coverHref && pdfHref ? (
        <a class="hmtc-manual-cover" href={pdfHref} aria-label={`Open PDF: ${title}`}>
          <img src={coverHref} alt={`Cover of ${title}`} width="720" height="1018" />
        </a>
      ) : coverHref ? (
        <div class="hmtc-manual-cover">
          <img src={coverHref} alt={`Cover of ${title}`} width="720" height="1018" />
        </div>
      ) : null}
      {editionChip ? <div class="hmtc-edition-chip">{editionChip}</div> : null}
      <div class="hmtc-manual-authority-actions">
        {pdfHref ? (
          <a class="hmtc-manual-dl" href={pdfHref} download>
            Download PDF
          </a>
        ) : null}
        <a class="hmtc-manual-cite" href="#hmtc-page-citation">
          Cite
        </a>
      </div>
    </div>
  )
}

export default (() => ManualAuthority) satisfies QuartzComponentConstructor
