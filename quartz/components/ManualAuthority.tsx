import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { type FullSlug } from "../util/path"

function frontmatterString(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined
  const s = String(value).trim()
  return s && s.toLowerCase() !== "null" ? s : undefined
}

export function isManualAuthorityPage(slug: string, fm: Record<string, unknown>): boolean {
  if (!slug.startsWith("manuals/") || slug === "manuals/index") return false
  return fm.type === "standard" || fm.type === "manual" || Boolean(fm.pdf || fm.edition)
}

export function manualEditionChip(fm: Record<string, unknown>): string {
  return (
    frontmatterString(fm.edition_chip) ||
    [frontmatterString(fm.edition), /v2/i.test(String(fm.methodology_version ?? "")) ? "Method v2" : null]
      .filter(Boolean)
      .join(" · ") ||
    "Program Manual"
  )
}

/** Plain edition metadata beneath the manual cover. Actions live in the center hero pane. */
export function ManualAuthorityStrip({ fm }: { fm: Record<string, unknown> }) {
  const editionChip = manualEditionChip(fm)

  return (
    <div class="hmtc-manual-authority" data-manual-authority="1">
      {editionChip ? <div class="hmtc-manual-edition">{editionChip}</div> : null}
    </div>
  )
}

const ManualAuthority: QuartzComponent = ({ fileData }: QuartzComponentProps) => {
  const slug = String((fileData.slug ?? "") as FullSlug)
  const fm = (fileData.frontmatter ?? {}) as Record<string, unknown>
  if (!isManualAuthorityPage(slug, fm)) return null
  return <ManualAuthorityStrip fm={fm} />
}

export default (() => ManualAuthority) satisfies QuartzComponentConstructor
