import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { resolveRelative, type SimpleSlug, type FullSlug } from "../util/path"
// @ts-ignore — inline script resolved by Quartz's esbuild loader
import pageHistoryTimeline from "./scripts/pageHistoryTimeline.inline"

// The proof's curated left section-nav (.snav): core sections as `.sec` with
// their sub-sections as `.sub`, secondary sections folded under "Further detail",
// then the icon utility links. Emits the proof's exact classes so proof.css
// styles it identically to hmi-real-content. Renders the inner content only;
// renderPage wraps it in <aside class="snav">.
//
// Metal pages additionally get a fixed IA: the orientation
// sections are grouped under one expandable "Overview", and the critical layers
// "Vulnerable populations", "Open questions" and "Frequently asked questions"
// are promoted to their own top-level headers. This is imposed at render time
// over the page's existing H2s, so it applies to every metal page uniformly
// without restructuring content. See the metal branch below.

const DROP = /^(sources|references|page history|update history)$/i // apparatus — reached via the icon utility links
// Secondary / non-reader-primary sections, folded under "Further detail".
const FOLD = /app-?\s?layer|planned sections|^status$|metal pages|further detail/i

// Metal-page IA: H2s matching these are promoted to their own top-level nav
// header (rendered in this order). Everything else groups under "Overview".
const MAIN_VULN = /^vulnerable populations$/i
const MAIN_OPEN = /^open questions$/i
const MAIN_FAQ = /^(frequently asked questions|faqs?)$/i

// Index-site icon utilities (Evidence Database, Research Feed, Source Corpus)
// pointed at corpus pages that do not exist on the cert site. Emptied for the
// first cert pass; the left rail shows the per-page section nav + cross-reference
// counts only.
const UTIL: { to?: string; anchor?: string; label: string; d: string }[] = []

type Sec = { slug?: string; text?: string; subs: any[]; fold: boolean }

function Icons({ slug }: { slug: FullSlug }) {
  return (
    <>
      <div class="divider" />
      {UTIL.map((u) => (
        <a class="icon" href={u.to ? resolveRelative(slug, u.to as SimpleSlug) : `#${u.anchor}`}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.7"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d={u.d} />
          </svg>
          <span>{u.label}</span>
        </a>
      ))}
    </>
  )
}

export default (() => {
  const Snav: QuartzComponent = ({ fileData }: QuartzComponentProps) => {
    const slug = (fileData.slug ?? "index") as FullSlug
    const toc = fileData.toc ?? []

    let entries = toc.filter((e) => !DROP.test((e.text ?? "").trim()))
    const sections: Sec[] = []
    if (entries.length) {
      const minD = Math.min(...entries.map((e) => e.depth))
      const topCount = entries.filter((e) => e.depth === minD).length
      if (topCount === 1 && entries.length > 1) entries = entries.filter((e) => e.depth > minD)
      const secD = Math.min(...entries.map((e) => e.depth))
      let cur: Sec | null = null
      for (const e of entries) {
        if (e.depth === secD || !cur) {
          cur = { slug: e.slug, text: e.text, subs: [] as any[], fold: FOLD.test(e.text ?? "") }
          sections.push(cur)
        } else {
          cur.subs.push(e)
        }
      }
    }

    // ---- Metal-page IA: one "Overview" group + promoted critical headers ----
    if (slug.startsWith("metals/")) {
      const title = ((fileData.frontmatter?.title as string) ?? slug.split("/").pop() ?? "this metal").trim()
      const metalName = title.charAt(0).toLowerCase() + title.slice(1)

      const overview: Sec[] = []
      let vuln: Sec | null = null
      let open: Sec | null = null
      let faq: Sec | null = null
      const folded: Sec[] = []
      for (const s of sections) {
        const t = (s.text ?? "").trim()
        if (s.fold) folded.push(s)
        else if (MAIN_VULN.test(t)) vuln = s
        else if (MAIN_OPEN.test(t)) open = s
        else if (MAIN_FAQ.test(t)) faq = s
        else overview.push(s)
      }
      const mains = [vuln, open, faq].filter(Boolean) as Sec[]
      const firstSlug = overview[0]?.slug

      return (
        <>
          {overview.length > 0 && (
            <div class="grp snav-overview">
              <a class="sec" href={`#${firstSlug}`} data-for={firstSlug}>
                Overview
              </a>
              {overview.map((s) => {
                // an un-renamed "Overview" H2 reads as the lede question
                const label = /^overview$/i.test((s.text ?? "").trim())
                  ? `What is ${metalName}?`
                  : s.text
                return (
                  <a class="sub" href={`#${s.slug}`} data-for={s.slug}>
                    {label}
                  </a>
                )
              })}
            </div>
          )}
          {mains.map((s) => (
            <div class="grp">
              <a class="sec" href={`#${s.slug}`} data-for={s.slug}>
                {s.text}
              </a>
            </div>
          ))}
          {folded.length > 0 && (
            <details class="grp snav-further">
              <summary class="sec">Further detail</summary>
              {folded.map((s) => (
                <a class="sub" href={`#${s.slug}`} data-for={s.slug}>
                  {s.text}
                </a>
              ))}
            </details>
          )}
          <Icons slug={slug} />
        </>
      )
    }

    // ---- Generic pages: core sections + "Further detail" + icons ----
    const core = sections.filter((s) => !s.fold)
    const further = sections.filter((s) => s.fold)

    return (
      <>
        {core.map((s) => (
          <div class="grp">
            <a class="sec" href={`#${s.slug}`} data-for={s.slug}>
              {s.text}
            </a>
            {s.subs.map((c: any) => (
              <a class="sub" href={`#${c.slug}`} data-for={c.slug}>
                {c.text}
              </a>
            ))}
          </div>
        ))}
        {further.length > 0 && (
          <details class="grp snav-further">
            <summary class="sec">Further detail</summary>
            {further.map((s) => (
              <a class="sub" href={`#${s.slug}`} data-for={s.slug}>
                {s.text}
              </a>
            ))}
          </details>
        )}
        <Icons slug={slug} />
      </>
    )
  }
  Snav.afterDOMLoaded = pageHistoryTimeline
  return Snav
}) satisfies QuartzComponentConstructor
