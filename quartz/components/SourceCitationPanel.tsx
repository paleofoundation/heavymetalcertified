import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
// @ts-ignore
import script from "./scripts/citationPanel.inline"
import style from "./styles/sourceCitationPanel.scss"

// Citation-detail slide-over for the cert.
//
// The cert hosts no source pages of its own (the one-way firewall sends citations
// OUT to the Heavy Metal Index / DOI), so — unlike the Index build, whose panel
// renders a source page's own access record — here the panel is a CLICK TARGET: it
// renders hidden, and citationPanel.inline.ts fills and reveals it with the clicked
// citation's full record, read from the page's own "## References" list. Mounting
// this component is what ships that script (a component's inline script only ships
// when the component is in the layout).
//
// Shape: a fixed backdrop scrim + a right-anchored role="dialog" panel that slides
// in over the scrim. It is mounted TOP-LEVEL (quartz.layout.ts afterBody), NOT in
// the right rail — the rail is display:none on mobile, and a fixed overlay nested
// under a display:none ancestor would never render there. The shell renders on every
// interior page and stays hidden until a citation is clicked; pages with no reference
// apparatus simply never trigger it. The homepage carries no citations and opts out.
export default (() => {
  const SourceCitationPanel: QuartzComponent = ({ fileData }: QuartzComponentProps) => {
    const slug = String(fileData.slug ?? "")
    if (slug === "index" || slug === "") return null

    return (
      <div class="hmtc-cite-overlay">
        {/* Backdrop — click dismisses; decorative, so hidden from the a11y tree. */}
        <div class="hmtc-cite-scrim" data-cite-panel-scrim aria-hidden="true"></div>
        {/* The drawer. aria-labelledby points at the record title the script mints
            into the body (id="hmtc-cite-panel-title") on open. */}
        <div
          class="hmtc-cite-panel"
          data-cite-panel
          role="dialog"
          aria-modal="true"
          aria-labelledby="hmtc-cite-panel-title"
          aria-hidden="true"
        >
          <div class="hmtc-cite-panel-top">
            <button
              type="button"
              class="hmtc-cite-panel-close"
              data-cite-panel-close
              aria-label="Close source record"
            >
              ×
            </button>
          </div>
          <div class="hmtc-cite-panel-body" data-cite-panel-body></div>
        </div>
      </div>
    )
  }

  SourceCitationPanel.afterDOMLoaded = script
  SourceCitationPanel.css = style
  return SourceCitationPanel
}) satisfies QuartzComponentConstructor
