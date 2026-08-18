import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import style from "./styles/evidenceHeader.scss"

// The official ORCID iD icon (green disc + "iD"), the customary journal-byline
// way to surface an ORCID iD: the icon stands in for the spelled-out number,
// which lives on the link target and in the accessible label. Inline SVG so it
// survives the static build.
const OrcidIdIcon = () => (
  <svg
    class="orcid-id-icon"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 256 256"
    width="16"
    height="16"
    aria-hidden="true"
    focusable="false"
  >
    <path
      fill="#A6CE39"
      d="M256,128c0,70.7-57.3,128-128,128C57.3,256,0,198.7,0,128C0,57.3,57.3,0,128,0C198.7,0,256,57.3,256,128z"
    />
    <path fill="#FFFFFF" d="M86.3,186.2H70.9V79.1h15.4v48.4V186.2z" />
    <path
      fill="#FFFFFF"
      d="M108.9,79.1h41.6c39.6,0,57,28.3,57,53.6c0,27.5-21.5,53.6-56.8,53.6h-41.8V79.1z M124.3,172.4h24.5c34.9,0,42.9-26.5,42.9-39.7c0-21.5-13.7-39.7-43.7-39.7h-23.7V172.4z"
    />
    <path
      fill="#FFFFFF"
      d="M88.7,56.8c0,5.5-4.5,10.1-10.1,10.1c-5.6,0-10.1-4.6-10.1-10.1c0-5.6,4.5-10.1,10.1-10.1C84.2,46.7,88.7,51.3,88.7,56.8z"
    />
  </svg>
)

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
          Karen Pendergrass{" "}
          <a
            class="hmi-evidence-orcid"
            href="https://orcid.org/0000-0002-2348-7259"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="ORCID iD 0000-0002-2348-7259"
            title="ORCID iD 0000-0002-2348-7259"
          >
            <OrcidIdIcon />
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
