// Citation-detail slide-over — click an inline citation, read that source's full
// record in a right-anchored drawer over a scrim.
//
// Cert pages carry no source pages of their own (the one-way firewall: citations
// link OUT to the Heavy Metal Index / DOI), so a citation's "full details" live in
// the page's own "## References" list. This script indexes that list and, when an
// inline citation is clicked, fills and reveals the overlay panel (rendered hidden
// by SourceCitationPanel.tsx) with the matching entry.
//
// Two citation shapes exist across the corpus and both are wired:
//   • articles / long-form:  <sup class="cite"><a href="#ref-N">N</a></sup>
//                            with reference rows carrying id="ref-N".
//   • briefings / prose:     a plain "[N]" the SuperscriptCitations transformer
//                            wraps as <sup class="hmtc-cite">[N]</sup>; its
//                            reference rows carry no id.
// So references are indexed by the "[N]" grid-row signature, id-independent, and
// citations are matched by number rather than by anchor. Render-time DOM only — the
// build and content are untouched.
//
// The drawer is a modal: it opens at every width (no rail gate), preventing the
// #ref-N anchor jump so the reader's scroll is preserved; it locks body scroll,
// moves focus to the close button, traps Tab inside, restores focus to the marker
// on close, and dismisses on the × button, Esc, or a scrim click. The slide is
// disabled under prefers-reduced-motion (handled in sourceCitationPanel.scss).

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

// --- overlay state -----------------------------------------------------------
// Module-scoped and alive for the SPA session. Document-level listeners are bound
// once (globalsBound); the afterBody panel survives micromorph across navs, so its
// per-open handlers must not re-stack — they are bound to `document`, not the node.

let lastTrigger: HTMLElement | null = null
let savedScrollY = 0
let globalsBound = false

// Tier B — the DOI → Heavy Metal Index source-page map, fetched once per session
// from the PUBLIC Index open-data surface. This is the one-way direction the
// firewall allows (cert consumes the published Index like any reader; it never
// reads Index private data), and it only ever enhances: every panel works fully
// with `sourcesMap` still null. `citationOpenSeq` guards the async upgrade so a
// late-arriving map only patches the drawer if it is still open for that citation.
type CitationSourceRec = { slug: string; tier?: string | null; year?: number | null }
type CitationSourcesMap = Record<string, CitationSourceRec>
const HMI_SITE = "https://heavymetalindex.com"
const HMI_SOURCES_URL = `${HMI_SITE}/static/data/sources.json`
let sourcesMap: CitationSourcesMap | null = null
let sourcesMapPromise: Promise<CitationSourcesMap | null> | null = null
let citationOpenSeq = 0

function scrimEl(): HTMLElement | null {
  return document.querySelector("[data-cite-panel-scrim]")
}

function focusablesIn(panel: HTMLElement): HTMLElement[] {
  return Array.from(
    panel.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((el) => el.offsetParent !== null || el === document.activeElement)
}

function closePanel(panel: HTMLElement) {
  const wasOpen = panel.classList.contains("is-open")
  panel.classList.remove("is-open")
  panel.setAttribute("aria-hidden", "true")
  scrimEl()?.classList.remove("is-open")

  // Release the scroll lock (mirror of the pin in openPanel).
  const body = document.body
  body.style.position = ""
  body.style.top = ""
  body.style.left = ""
  body.style.right = ""
  body.style.overflow = ""
  body.style.paddingRight = ""

  if (wasOpen) {
    // Restore the exact offset with no smooth animation (scroll-behavior is smooth
    // sitewide), and return focus to the marker without nudging the page.
    const prevBehavior = document.documentElement.style.scrollBehavior
    document.documentElement.style.scrollBehavior = "auto"
    window.scrollTo(0, savedScrollY)
    document.documentElement.style.scrollBehavior = prevBehavior
    if (lastTrigger && document.contains(lastTrigger)) {
      lastTrigger.focus({ preventScroll: true })
    }
  }
  lastTrigger = null
}

// The authority tell — how much weight a citation carries, at a glance. The row's
// own kind label (Government, Journal, Preprint, Case, …) IS the signal; this maps
// it to a broad tier class so the badge can read stronger for binding law / peer-
// reviewed science than for a preprint, without inventing a rating the data lacks.
function citationAuthorityTier(kind: string): string {
  const k = kind.toLowerCase()
  if (/govern|regulation|legislation|statute|directive|law/.test(k)) return "law"
  if (/standard/.test(k)) return "standard"
  if (/peer|journal|study/.test(k)) return "peer"
  if (/assess|review|synthesis|opinion|evaluation|monograph/.test(k)) return "expert"
  if (/case|litig|legal|court|docket/.test(k)) return "case"
  if (/preprint/.test(k)) return "preprint"
  if (/data/.test(k)) return "data"
  if (/industry/.test(k)) return "industry"
  return "report"
}

// Label the outbound action by where it actually goes, so the reader knows before
// they click. Tier B will route corpus-literature citations to their Heavy Metal
// Index source page; the heavymetalindex.com branch already labels that correctly.
function citationGoLabel(href: string): string {
  if (/(^|\/\/|\.)heavymetalindex\.com/.test(href)) return "View on the Heavy Metal Index →"
  if (/doi\.org|zenodo\.org/.test(href)) return "Open the DOI →"
  if (/\.gov(\/|$|:)|europa\.eu|eur-lex|efsa\.|who\.int|fao\.org|legislation\.gov|oehha|fsanz|foodstandards/.test(href))
    return "Open the official document →"
  return "Open the source →"
}

// --- Tier B: corpus deep-linking ---------------------------------------------
// Normalize a DOI to the bare, lowercased key the Index map uses. DOIs are
// case-insensitive, so both sides must lowercase; this mirrors normalizeDoi in
// the Index's tools/build-open-data.mjs so a citation's DOI and the map key agree.
function citationNormalizeDoi(raw: string | null | undefined): string | null {
  if (!raw) return null
  let s = String(raw).trim().replace(/^["']|["']$/g, "").trim().toLowerCase()
  s = s
    .replace(/^https?:\/\/(dx\.)?doi\.org\//, "")
    .replace(/^doi:\s*/, "")
    .trim()
    .replace(/[).,;>\]]+$/, "")
  return /^10\.\d{4,9}\/\S+$/.test(s) ? s : null
}

// A citation's DOI comes from its outbound href (a doi.org link) first, else from
// a DOI printed in the reference detail line (unlinked gov/standard rows).
function citationExtractDoi(ref: CitationPanelRef): string | null {
  const fromHref = citationNormalizeDoi(ref.href)
  if (fromHref) return fromHref
  const m = `${ref.href} ${ref.detail}`.match(/\b10\.\d{4,9}\/[^\s"'<>)\]]+/i)
  return m ? citationNormalizeDoi(m[0]) : null
}

// Fetch the public Index map once per SPA session. Enhancement-only: any failure
// (offline, CORS, 404 before the Index has deployed the file) resolves to null and
// the panel simply keeps its Tier A behaviour.
function loadSourcesMap(): Promise<CitationSourcesMap | null> {
  if (sourcesMapPromise) return sourcesMapPromise
  sourcesMapPromise = fetch(HMI_SOURCES_URL, { mode: "cors", credentials: "omit" })
    .then((r) => (r.ok ? r.json() : null))
    .then((j) => {
      sourcesMap = j && j.by_doi ? (j.by_doi as CitationSourcesMap) : null
      return sourcesMap
    })
    .catch(() => null)
  return sourcesMapPromise
}

// Resolve a citation to its Index source-page URL, or null when the DOI is not in
// the corpus (or the map has not loaded yet).
function citationHmiDeepLink(map: CitationSourcesMap | null, ref: CitationPanelRef): string | null {
  if (!map) return null
  const doi = citationExtractDoi(ref)
  if (!doi) return null
  const rec = map[doi]
  return rec && rec.slug ? `${HMI_SITE}/sources/${rec.slug}` : null
}

function citationActionLink(href: string, label: string, variant: "primary" | "alt"): HTMLAnchorElement {
  const a = document.createElement("a")
  a.className = variant === "primary" ? "hmtc-cite-panel-go" : "hmtc-cite-panel-alt"
  a.href = href
  a.target = "_blank"
  a.rel = "noopener noreferrer"
  a.textContent = label
  return a
}

function citationCopyButton(copyText: string): HTMLButtonElement {
  const copy = document.createElement("button")
  copy.type = "button"
  copy.className = "hmtc-cite-panel-copy"
  copy.textContent = "Copy citation"
  copy.addEventListener("click", () => {
    navigator.clipboard.writeText(copyText).then(
      () => {
        copy.textContent = "Copied"
        window.setTimeout(() => {
          copy.textContent = "Copy citation"
        }, 1600)
      },
      () => {},
    )
  })
  return copy
}

// Build (or rebuild, on async upgrade) the panel's action row. With a corpus deep
// link the filled action goes to the Index source record and the original document
// drops to a secondary outlined action; without one it falls back to Tier A (the
// row's own outbound link, or the evidence base when the row is unlinked).
function citationRenderActions(actions: HTMLElement, ref: CitationPanelRef, deepLink: string | null) {
  const kids: Node[] = []
  const hasExternal = !!ref.href && /^https?:\/\//.test(ref.href)
  if (deepLink) {
    kids.push(citationActionLink(deepLink, "View on the Heavy Metal Index →", "primary"))
    if (hasExternal) kids.push(citationActionLink(ref.href, citationGoLabel(ref.href), "alt"))
  } else if (hasExternal) {
    kids.push(citationActionLink(ref.href, citationGoLabel(ref.href), "primary"))
  } else {
    kids.push(citationActionLink(HMI_SITE, "Explore the evidence base →", "primary"))
  }
  const copyText = [ref.num ? `[${ref.num}]` : "", ref.title, ref.detail].filter(Boolean).join(" ").trim()
  if (copyText && navigator.clipboard) kids.push(citationCopyButton(copyText))
  actions.replaceChildren(...kids)
}

function openPanel(panel: HTMLElement, ref: CitationPanelRef, trigger: HTMLElement | null) {
  const body = panel.querySelector("[data-cite-panel-body]") as HTMLElement | null
  if (!body) return

  const frag = document.createDocumentFragment()

  // Kicker — SOURCE RECORD [n].
  const kicker = document.createElement("div")
  kicker.className = "hmtc-cite-panel-kicker"
  kicker.textContent = `Source record [${ref.num}]`
  frag.appendChild(kicker)

  // Authority badge — the "how much weight does this carry" tell, up top where a
  // regulator or opposing expert looks first. The row's kind IS the label; the tier
  // class weights the styling (binding law / peer-reviewed read stronger).
  if (ref.kind) {
    const authority = document.createElement("div")
    authority.className = `hmtc-cite-panel-authority tier-${citationAuthorityTier(ref.kind)}`
    authority.textContent = ref.kind
    frag.appendChild(authority)
  }

  // Title — the drawer's accessible name (aria-labelledby). Outbound #1c43ad link
  // when the row carries a URL; plain dark serif otherwise.
  const title = document.createElement("div")
  title.className = "hmtc-cite-panel-title"
  title.id = "hmtc-cite-panel-title"
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

  // The finding, front and centre — what this source actually establishes, so the
  // reader can verify the claim without leaving. This is the substance; the title
  // above is only which document it came from.
  if (ref.detail) {
    const label = document.createElement("div")
    label.className = "hmtc-cite-panel-finding-label"
    label.textContent = "What it establishes"
    frag.appendChild(label)
    const p = document.createElement("p")
    p.className = "hmtc-cite-panel-finding"
    p.textContent = ref.detail
    frag.appendChild(p)
  }

  // Actions: the primary way deeper + copy. Tier B — when the citation's DOI is in
  // the Heavy Metal Index corpus, the filled action routes to that source's Index
  // record (richer than a raw DOI landing: our extracted values, routing, tier) and
  // the original document drops to a secondary action. Consults the PUBLIC Index
  // open-data map (the one-way direction the firewall allows); the panel is fully
  // functional with the map absent, and upgrades in place if it arrives mid-open.
  const seq = ++citationOpenSeq
  const actions = document.createElement("div")
  actions.className = "hmtc-cite-panel-actions"
  citationRenderActions(actions, ref, citationHmiDeepLink(sourcesMap, ref))
  frag.appendChild(actions)
  if (!sourcesMap) {
    loadSourcesMap().then(() => {
      if (seq !== citationOpenSeq || !panel.classList.contains("is-open")) return
      const dl = citationHmiDeepLink(sourcesMap, ref)
      if (dl) citationRenderActions(actions, ref, dl)
    })
  }

  body.replaceChildren(frag)

  // Remember what to return focus to, and lock the underlying page in place —
  // jump-free. This build scrolls <html>, and overflow:hidden on the root resets
  // scroll to 0; so pin <body> at its current offset with position:fixed instead.
  // The page stays visually put and cannot scroll while the modal is open, and the
  // fixed scrim/panel are unaffected (position:fixed is viewport-relative — <body>
  // being fixed does not become their containing block). Compensate for any
  // vanished scrollbar so nothing shifts horizontally.
  lastTrigger = trigger || (document.activeElement as HTMLElement | null)
  savedScrollY = window.scrollY
  const scrollbar = window.innerWidth - document.documentElement.clientWidth
  const pageBody = document.body
  pageBody.style.position = "fixed"
  pageBody.style.top = `-${savedScrollY}px`
  pageBody.style.left = "0"
  pageBody.style.right = "0"
  pageBody.style.overflow = "hidden"
  if (scrollbar > 0) pageBody.style.paddingRight = `${scrollbar}px`

  scrimEl()?.classList.add("is-open")
  panel.classList.add("is-open")
  panel.setAttribute("aria-hidden", "false")

  // Move focus into the drawer without nudging the page.
  const closeBtn = panel.querySelector("[data-cite-panel-close]") as HTMLElement | null
  closeBtn?.focus({ preventScroll: true })
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

    // The bracketed [N] marker is a plain <sup>: make it a real, focusable control
    // so keyboard readers can open it and focus can return here on close. The
    // anchor shape is already focusable and keyboard-activatable (Enter → click).
    if (!isAnchor) {
      el.setAttribute("tabindex", "0")
      el.setAttribute("role", "button")
      el.setAttribute("aria-label", `Open source record ${num}`)
    }

    el.addEventListener("click", (e) => {
      // preventDefault: no native #ref-N anchor jump. stopPropagation: keep the event
      // away from the SPA router's window-level click handler, which otherwise
      // scrollIntoView()s the reference row and pushStates the #ref-N hash — it does
      // NOT check defaultPrevented (spa.inline.ts). Together they preserve the scroll.
      e.preventDefault()
      e.stopPropagation()
      openPanel(panel, ref, el)
    })
    if (!isAnchor) {
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          e.stopPropagation()
          openPanel(panel, ref, el)
        }
      })
    }
  })
}

function bindGlobals() {
  if (globalsBound) return
  globalsBound = true

  // Esc to dismiss + Tab trapped inside the open drawer. Bound once on document
  // (the afterBody panel persists through micromorph, so node-level rebinds would
  // stack); state is read live from the DOM each keystroke.
  document.addEventListener("keydown", (e) => {
    const panel = document.querySelector("[data-cite-panel]") as HTMLElement | null
    if (!panel || !panel.classList.contains("is-open")) return

    if (e.key === "Escape") {
      e.preventDefault()
      closePanel(panel)
      return
    }
    if (e.key === "Tab") {
      const f = focusablesIn(panel)
      if (f.length === 0) {
        e.preventDefault()
        return
      }
      const first = f[0]
      const last = f[f.length - 1]
      const active = document.activeElement as HTMLElement | null
      if (!active || !panel.contains(active)) {
        e.preventDefault()
        first.focus({ preventScroll: true })
      } else if (e.shiftKey && active === first) {
        e.preventDefault()
        last.focus({ preventScroll: true })
      } else if (!e.shiftKey && active === last) {
        e.preventDefault()
        first.focus({ preventScroll: true })
      }
    }
  })

  // Close if the drawer is open when the reader navigates away, so the scroll lock
  // never survives a page change.
  document.addEventListener("prenav", () => {
    const panel = document.querySelector("[data-cite-panel]") as HTMLElement | null
    if (panel && panel.classList.contains("is-open")) closePanel(panel)
  })
}

function setupCitationPanel() {
  const content = document.querySelector(".wiki-content")
  const panel = document.querySelector("[data-cite-panel]") as HTMLElement | null
  if (!content || !panel) return

  // Fresh page: start closed, scroll lock fully released.
  panel.classList.remove("is-open")
  panel.setAttribute("aria-hidden", "true")
  scrimEl()?.classList.remove("is-open")
  const body = document.body
  body.style.position = ""
  body.style.top = ""
  body.style.left = ""
  body.style.right = ""
  body.style.overflow = ""
  body.style.paddingRight = ""
  lastTrigger = null

  // Idempotent per-node wiring for the close button and scrim (property assignment
  // never stacks, even though these nodes survive micromorph).
  const closeBtn = panel.querySelector("[data-cite-panel-close]") as HTMLElement | null
  if (closeBtn) closeBtn.onclick = () => closePanel(panel)
  const scrim = scrimEl()
  if (scrim) scrim.onclick = () => closePanel(panel)

  const refs = indexCitationPanelReferences(content)
  if (refs.size > 0) {
    wireCitations(content, refs, panel)
    // Warm the corpus deep-link map now so it is usually ready by the first open.
    void loadSourcesMap()
  }

  bindGlobals()
}

document.addEventListener("nav", setupCitationPanel)
