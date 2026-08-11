// Citation-detail panel — click an inline citation, read that source's full
// record in the right rail.
//
// Cert pages carry no source pages of their own (the one-way firewall: citations
// link OUT to the Heavy Metal Index), so a citation's "full details" live in the
// page's own "## References" list. This script indexes that list and, when an
// inline citation is clicked, fills and reveals the rail panel (rendered hidden
// by SourceCitationPanel.tsx) with the matching entry.
//
// Two citation shapes exist across the corpus and both are wired:
//   • articles / long-form:  <sup class="cite"><a href="#ref-N">N</a></sup>
//                            with reference rows carrying id="ref-N".
//   • briefings / prose:     a plain "[N]" the SuperscriptCitations transformer
//                            wraps as <sup class="hmtc-cite">[N]</sup>; its
//                            reference rows carry no id.
// So references are indexed by the "[N]" grid-row signature, id-independent, and
// citations are matched by number rather than by anchor. Render-time DOM only —
// the build and content are untouched. Falls back to the ordinary anchor jump
// wherever the rail is collapsed (narrow viewports) so nothing is ever dead.

type CitationPanelRef = {
  num: string
  title: string
  href: string
  detail: string
  kind: string
}

// The reference rows both generators emit share this exact grid signature. Keying
// off it (rather than id="ref-N") indexes briefings — whose rows carry no id —
// and articles alike.
const ROW_SELECTOR = 'div[style*="grid-template-columns:42px minmax(0,1fr) 128px"]'
const NUM_RE = /^\[(\d{1,3})\]$/

function citationPanelTextOf(el: Element | null | undefined): string {
  return (el?.textContent || "").replace(/\s+/g, " ").trim()
}

function indexCitationPanelReferences(content: Element): Map<string, CitationPanelRef> {
  const map = new Map<string, CitationPanelRef>()
  content.querySelectorAll(ROW_SELECTOR).forEach((row) => {
    const numSpan = row.children[0]
    const m = citationPanelTextOf(numSpan).match(NUM_RE)
    if (!m) return
    const num = m[1]
    const mid = row.children[1] as Element | undefined
    const kindEl = row.children[2] as Element | undefined

    let title = ""
    let href = ""
    let detail = ""
    if (mid) {
      const titleLink = mid.querySelector(":scope > a") as HTMLAnchorElement | null
      const titleSpan = mid.querySelector(":scope > span") as HTMLElement | null
      title = citationPanelTextOf(titleLink) || citationPanelTextOf(titleSpan)
      href = titleLink?.getAttribute("href") || ""
      const p = mid.querySelector("p")
      detail = citationPanelTextOf(p)
      if (!href) {
        // Unlinked title (legal document, standard): fall back to any external
        // link the detail line carries (e.g. the doi.org domain link).
        const doiLink = p?.querySelector('a[href^="http"]') as HTMLAnchorElement | null
        href = doiLink?.getAttribute("href") || ""
      }
    }
    map.set(num, { num, title, href, detail, kind: citationPanelTextOf(kindEl) })
  })
  return map
}

function railVisible(): boolean {
  const rail = document.querySelector("aside.rail")
  // getClientRects() is empty when the rail is display:none (narrow viewports),
  // so citations fall back to the plain #ref-N anchor jump there.
  return !!(rail && (rail as HTMLElement).getClientRects().length > 0)
}

function closePanel(panel: HTMLElement) {
  panel.hidden = true
  panel.classList.remove("is-open")
  panel.setAttribute("aria-hidden", "true")
}

function openPanel(panel: HTMLElement, ref: CitationPanelRef) {
  const body = panel.querySelector("[data-cite-panel-body]") as HTMLElement | null
  if (!body) return

  const frag = document.createDocumentFragment()

  const num = document.createElement("div")
  num.className = "hmtc-cite-panel-num"
  num.textContent = `[${ref.num}]`
  frag.appendChild(num)

  const title = document.createElement("div")
  title.className = "hmtc-cite-panel-title"
  if (ref.href) {
    const a = document.createElement("a")
    a.href = ref.href
    a.textContent = ref.title || ref.href
    if (/^https?:\/\//.test(ref.href)) {
      a.target = "_blank"
      a.rel = "noopener noreferrer"
    }
    title.appendChild(a)
  } else {
    title.textContent = ref.title
  }
  frag.appendChild(title)

  if (ref.detail) {
    const p = document.createElement("p")
    p.className = "hmtc-cite-panel-detail"
    p.textContent = ref.detail
    frag.appendChild(p)
  }

  if (ref.kind) {
    const kind = document.createElement("div")
    kind.className = "hmtc-cite-panel-kind"
    kind.textContent = ref.kind
    frag.appendChild(kind)
  }

  if (ref.href && /^https?:\/\//.test(ref.href)) {
    const go = document.createElement("a")
    go.className = "hmtc-cite-panel-go"
    go.href = ref.href
    go.target = "_blank"
    go.rel = "noopener noreferrer"
    go.textContent = "Read source →"
    frag.appendChild(go)
  }

  body.replaceChildren(frag)
  panel.hidden = false
  panel.classList.add("is-open")
  panel.setAttribute("aria-hidden", "false")
}

function wireCitations(
  content: Element,
  refs: Map<string, CitationPanelRef>,
  panel: HTMLElement,
) {
  const cites = content.querySelectorAll<HTMLElement>(
    'sup.cite > a[href^="#ref-"], sup.hmtc-cite',
  )
  cites.forEach((el) => {
    if (el.dataset.citePanelWired === "1") return
    const isAnchor = el.tagName === "A"
    const num = isAnchor
      ? (el.getAttribute("href") || "").replace(/^#ref-/, "")
      : (citationPanelTextOf(el).match(/\d{1,3}/) || [""])[0]
    const ref = refs.get(num)
    if (!ref) return // no matching entry — leave the default behaviour intact
    el.dataset.citePanelWired = "1"
    el.style.cursor = "pointer"
    el.addEventListener("click", (e) => {
      if (!railVisible()) return // narrow viewport: let the anchor jump happen
      e.preventDefault()
      openPanel(panel, ref)
    })
  })
}

let escBound = false

function setupCitationPanel() {
  const content = document.querySelector(".wiki-content")
  const panel = document.querySelector("[data-cite-panel]") as HTMLElement | null
  if (!content || !panel) return

  // Fresh page: start closed.
  closePanel(panel)

  const closeBtn = panel.querySelector("[data-cite-panel-close]") as HTMLElement | null
  if (closeBtn) closeBtn.onclick = () => closePanel(panel)

  const refs = indexCitationPanelReferences(content)
  if (refs.size > 0) wireCitations(content, refs, panel)

  if (!escBound) {
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return
      const p = document.querySelector("[data-cite-panel]") as HTMLElement | null
      if (p && !p.hidden) closePanel(p)
    })
    escBound = true
  }
}

document.addEventListener("nav", setupCitationPanel)
