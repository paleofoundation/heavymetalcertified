import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
// @ts-ignore — inline script resolved by Quartz's esbuild loader
import scrollSpy from "./scripts/snavScrollSpy.inline"

// The v3 "On this page" left rail (Heavy Metal Certified v3.dc.html 641–663):
// a header ("On this page" + "N rails"), then one numbered rail per top-level
// section, with the in-view section marked active (red border + red text). The
// numbers are positional two-digit labels. Emits `.hmtc-onpage-*` / `.hmtc-rail`
// markup styled to the comp in cert-chrome.scss.
//
// Two population paths share one shell. Markdown pages (standards, briefings,
// program) get their sections from `fileData.toc` server-side. The comp-ported
// static pages (apply, verify, portal, brands) carry raw-HTML bodies whose
// headings never reach the markdown TOC, so the shell renders with `data-auto`
// and snavScrollSpy builds the rail from the rendered DOM — removing the shell
// entirely if the page turns out to have no sections.

const two = (n: number) => String(n).padStart(2, "0")

export default (() => {
  const Snav: QuartzComponent = ({ fileData }: QuartzComponentProps) => {
    const toc = fileData.toc ?? []

    // Server-side sections from the markdown TOC: the shallowest heading level,
    // skipping a lone leading title (the generated <h1>, already in the hero).
    let sections: { slug: string; text: string }[] = []
    if (toc.length) {
      let minDepth = Math.min(...toc.map((e) => e.depth))
      let secs = toc.filter((e) => e.depth === minDepth)
      if (secs.length === 1 && toc.length > 1) {
        const rest = toc.filter((e) => e.depth > minDepth)
        if (rest.length) {
          minDepth = Math.min(...rest.map((e) => e.depth))
          secs = rest.filter((e) => e.depth === minDepth)
        }
      }
      sections = secs.map((s) => ({ slug: s.slug, text: s.text }))
    }

    // No markdown TOC → raw-HTML body: emit the shell and let the client build it.
    const auto = sections.length === 0

    return (
      <div class="hmtc-onpage" data-auto={auto ? "1" : "0"}>
        <div class="hmtc-onpage-head">
          <span class="hmtc-onpage-label">On this page</span>
          <span class="hmtc-onpage-count">
            {auto ? "" : `${sections.length} rail${sections.length === 1 ? "" : "s"}`}
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
      </div>
    )
  }
  Snav.afterDOMLoaded = scrollSpy
  return Snav
}) satisfies QuartzComponentConstructor
