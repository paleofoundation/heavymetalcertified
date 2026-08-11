import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
// @ts-ignore
import script from "./scripts/citationPanel.inline"
import style from "./styles/sourceCitationPanel.scss"

// Citation-detail panel for the cert right rail.
//
// The cert hosts no source pages of its own (the one-way firewall sends
// citations OUT to the Heavy Metal Index), so — unlike the Index build, whose
// SourceCitationPanel renders a source page's own access record — here the panel
// is a CLICK TARGET: it renders hidden, and citationPanel.inline.ts fills and
// reveals it with the clicked citation's full record, read from the page's own
// "## References" list. Mounting this component is what ships that script (a
// component's inline script only ships when the component is in the layout).
//
// The shell is rendered on every interior page and stays hidden until a citation
// is clicked; pages with no reference apparatus simply never trigger it. The
// homepage carries no citations and keeps a clean rail, so it opts out.
export default (() => {
  const SourceCitationPanel: QuartzComponent = ({ fileData }: QuartzComponentProps) => {
    const slug = String(fileData.slug ?? "")
    if (slug === "index" || slug === "") return null

    return (
      <aside
        class="hmtc-cite-panel"
        data-cite-panel
        hidden
        aria-hidden="true"
        aria-label="Cited source detail"
      >
        <div class="hmtc-cite-panel-top">
          <span class="hmtc-cite-panel-kicker">Cited source</span>
          <button
            type="button"
            class="hmtc-cite-panel-close"
            data-cite-panel-close
            aria-label="Close citation detail"
          >
            ×
          </button>
        </div>
        <div class="hmtc-cite-panel-body" data-cite-panel-body></div>
      </aside>
    )
  }

  SourceCitationPanel.afterDOMLoaded = script
  SourceCitationPanel.css = style
  return SourceCitationPanel
}) satisfies QuartzComponentConstructor
