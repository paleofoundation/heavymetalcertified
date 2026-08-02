import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
// @ts-ignore — inline script resolved by Quartz's esbuild loader
import scrollSpy from "./scripts/snavScrollSpy.inline"

// The v3 "On this page" left rail (Heavy Metal Certified v3.dc.html 641–663):
// a header ("On this page" + "N rails"), then one numbered rail per top-level
// section, with the in-view section marked active (red border + red text). The
// numbers are positional two-digit labels. Emits `.hmtc-onpage-*` / `.hmtc-rail`
// markup styled to the comp in cert-chrome.scss; no index Snav structure remains.

const two = (n: number) => String(n).padStart(2, "0")

export default (() => {
  const Snav: QuartzComponent = ({ fileData }: QuartzComponentProps) => {
    const toc = fileData.toc ?? []
    if (!toc.length) return null

    // Sections = the shallowest heading level, but skip a lone leading title
    // (the generated <h1>, which the hero band already shows) and use the H2s.
    let minDepth = Math.min(...toc.map((e) => e.depth))
    let sections = toc.filter((e) => e.depth === minDepth)
    if (sections.length === 1 && toc.length > 1) {
      const rest = toc.filter((e) => e.depth > minDepth)
      if (rest.length) {
        minDepth = Math.min(...rest.map((e) => e.depth))
        sections = rest.filter((e) => e.depth === minDepth)
      }
    }
    if (!sections.length) return null

    return (
      <>
        <div class="hmtc-onpage-head">
          <span class="hmtc-onpage-label">On this page</span>
          <span class="hmtc-onpage-count">
            {sections.length} rail{sections.length === 1 ? "" : "s"}
          </span>
        </div>
        <nav class="hmtc-onpage-nav" aria-label="On this page">
          {sections.map((s, i) => (
            <a
              class={i === 0 ? "hmtc-rail active" : "hmtc-rail"}
              href={`#${s.slug}`}
              data-for={s.slug}
            >
              <span class="hmtc-rail-num">{two(i + 1)}</span>
              <span class="hmtc-rail-label">{s.text}</span>
            </a>
          ))}
        </nav>
      </>
    )
  }
  Snav.afterDOMLoaded = scrollSpy
  return Snav
}) satisfies QuartzComponentConstructor
