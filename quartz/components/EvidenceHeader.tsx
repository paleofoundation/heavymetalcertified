import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import style from "./styles/evidenceHeader.scss"

// Compact authority strip rendered directly under the title on reference
// pages, so the evidence basis is the first thing a reader (or an AI answer
// engine extracting the page) sees — not buried in a collapsed footer.
//
//   - synthesis pages: the anchor sources that establish the finding, the
//     metals in scope, and the date the synthesis was established.
//   - metal pages: how many corpus sources report on the metal.
//
// Everything is read from existing frontmatter; the component renders nothing
// when the page carries no usable signal.

function asString(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined
  const s = String(value).trim()
  return s && s.toLowerCase() !== "null" ? s : undefined
}

function asList(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap((v) => (asString(v) ? [asString(v)!] : []))
  const s = asString(value)
  return s ? [s] : []
}

// "[[sources/foo|Foo 2024]]" -> { href: "/sources/foo", label: "Foo 2024" }
// "[[sources/foo]]"          -> { href: "/sources/foo", label: "foo" }
function parseWikilink(raw: string): { href: string; label: string } | null {
  const m = raw.match(/^\[\[([^\]]+)\]\]$/)
  const inner = m ? m[1] : raw
  const [target, alias] = inner.split("|")
  const path = target.trim().replace(/^\/+/, "")
  if (!path) return null
  const label = (alias ?? path.split("/").pop() ?? path).trim()
  return { href: `/${path}`, label }
}

export default (() => {
  const EvidenceHeader: QuartzComponent = ({ fileData }: QuartzComponentProps) => {
    const fm = fileData.frontmatter as Record<string, unknown> | undefined
    if (!fm) return null
    const type = asString(fm.type)
    const slug = fileData.slug ?? ""

    // Named, ORCID-identified authorship — the human accountability signal.
    const byline = (
      <div class="hmi-evidence-row">
        <span class="hmi-evidence-key">Author</span>
        <span class="hmi-evidence-value">
          Karen Pendergrass{" · "}
          <a href="https://orcid.org/0000-0002-2348-7259" target="_blank" rel="noopener noreferrer">
            ORCID
          </a>
          {" · Heavy Metal Index, Institute of Contaminant Standards (ICS)"}
        </span>
      </div>
    )

    if (type === "synthesis") {
      const anchors = asList(fm.anchor_sources)
        .map(parseWikilink)
        .filter((x): x is { href: string; label: string } => x !== null)
        .slice(0, 6)
      const metals = asList(fm.metals)
      const established = asString(fm.established)
      if (anchors.length === 0 && metals.length === 0 && !established) return null

      return (
        <section class="hmi-evidence-header" aria-label="Evidence basis">
          {byline}
          {metals.length > 0 ? (
            <div class="hmi-evidence-row">
              <span class="hmi-evidence-key">Metals</span>
              <span class="hmi-evidence-badges">
                {metals.map((m) => (
                  <span class="hmi-evidence-badge">{m}</span>
                ))}
              </span>
            </div>
          ) : null}
          {anchors.length > 0 ? (
            <div class="hmi-evidence-row">
              <span class="hmi-evidence-key">Anchor sources</span>
              <span class="hmi-evidence-links">
                {anchors.map((a) => (
                  <a href={a.href}>{a.label}</a>
                ))}
              </span>
            </div>
          ) : null}
          {established ? (
            <div class="hmi-evidence-row">
              <span class="hmi-evidence-key">Established</span>
              <span class="hmi-evidence-value">{established}</span>
            </div>
          ) : null}
        </section>
      )
    }

    if (type === "metal" && slug.startsWith("metals/")) {
      const count = asString(fm.sources)
      const symbol = asString(fm.symbol)
      if (!count) return null
      return (
        <section class="hmi-evidence-header" aria-label="Evidence basis">
          {byline}
          <div class="hmi-evidence-row">
            <span class="hmi-evidence-key">Evidence base</span>
            <span class="hmi-evidence-value">
              <a href="/sources">{count}</a> corpus sources report on this metal
              {symbol ? ` (${symbol})` : ""}.
            </span>
          </div>
        </section>
      )
    }

    return null
  }

  EvidenceHeader.css = style
  return EvidenceHeader
}) satisfies QuartzComponentConstructor
