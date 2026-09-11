import FlexSearch, { type Document } from "flexsearch"

type SearchRecord = {
  id: number
  slug: string
  title: string
  content: string
  tags: string[]
}

// One lazily prepared index, shared across SPA visits. Bind the UI immediately;
// queries await this promise instead of racing an asynchronously installed handler.
let prepared: Promise<{ index: Document<SearchRecord>; records: SearchRecord[] }> | undefined
function prepareSearch() {
  return prepared ??= (async () => {
    const response = await fetch("/static/contentIndex.json")
    if (!response.ok) throw new Error("Search index unavailable")
    const data: ContentIndex = await response.json()
    const records = Object.entries(data).map(([slug, item], id) => ({
      id, slug, title: item.title ?? "", content: item.content ?? "", tags: item.tags ?? [],
    }))
    const index = new FlexSearch.Document<SearchRecord>({
      encode: (value: string) => value.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean),
      document: {
        id: "id",
        index: (["title", "content", "tags"] as const).map(field => ({ field, tokenize: "forward" as const })),
      },
    })
    await Promise.all(records.map(record => index.addAsync(record.id, record)))
    return { index, records }
  })().catch(error => {
    prepared = undefined // a later submit can retry a failed connection
    throw error
  })
}

function excerpt(content: string, query: string) {
  const text = content.replace(/\s+/g, " ").trim()
  const term = query.toLowerCase().split(/\s+/).find(Boolean) ?? ""
  const start = Math.max(0, text.toLowerCase().indexOf(term) - 60)
  const end = Math.min(text.length, start + 190)
  return `${start ? "…" : ""}${text.slice(start, end)}${end < text.length ? "…" : ""}`
}

let disposeSearch = () => {}
function setupSiteSearch() {
  disposeSearch()
  const scope = document.querySelector<HTMLElement>("#site-search")
  const form = scope?.querySelector<HTMLFormElement>("form")
  const input = scope?.querySelector<HTMLInputElement>("input")
  const status = scope?.querySelector<HTMLElement>("#site-search-status")
  const panel = scope?.querySelector<HTMLElement>(".hmtc-search-response")
  const results = scope?.querySelector<HTMLUListElement>("#site-search-results")
  const navLink = document.querySelector<HTMLAnchorElement>(".hmtc-search-link")
  let revision = 0
  let timer: ReturnType<typeof setTimeout> | undefined

  function focusSearch() {
    if (input && scope) {
      scope.scrollIntoView({ block: "center" })
      input.focus({ preventScroll: true })
    } else {
      navLink?.click()
    }
  }

  function shortcut(event: KeyboardEvent) {
    const target = event.target as HTMLElement | null
    if (event.isComposing || target?.closest("input, textarea, select, [contenteditable]:not([contenteditable=false])")) return
    const slash = event.key === "/" && !event.ctrlKey && !event.metaKey && !event.altKey
    const commandK = event.key.toLowerCase() === "k" && (event.ctrlKey || event.metaKey) && !event.altKey && !event.shiftKey
    if (slash || commandK) {
      event.preventDefault()
      focusSearch()
    }
  }

  function clearResults() {
    if (!results || !status) return
    results.replaceChildren()
    results.hidden = true
    results.removeAttribute("aria-busy")
    status.textContent = ""
    if (panel) panel.hidden = true
  }

  async function search(query: string, request: number) {
    if (!results || !status || !input) return
    results.setAttribute("aria-busy", "true")
    if (panel) panel.hidden = false
    status.textContent = "Searching…"
    try {
      const { index, records } = await prepareSearch()
      if (request !== revision) return
      const tagsOnly = query.startsWith("#")
      const found = await index.searchAsync({
        query: tagsOnly ? query.slice(1) : query,
        index: tagsOnly ? ["tags"] : ["title", "content"],
        limit: 8,
      })
      if (request !== revision) return
      const ids = [...new Set(["title", "content", "tags"].flatMap(field =>
        found.filter(group => group.field === field).flatMap(group => group.result as number[]),
      ))].slice(0, 8)
      results.replaceChildren()
      const sections: Record<string, string> = { standards: "Standard", analytes: "Analyte", articles: "Research", briefings: "Briefing", manuals: "Manual", regulations: "Regulation", program: "Program" }
      for (const id of ids) {
        const record = records[id]
        const item = document.createElement("li")
        const link = document.createElement("a")
        link.href = record.slug === "index" ? "/" : `/${record.slug.replace(/\/index$/, "")}`
        const section = document.createElement("span")
        section.className = "hmtc-search-result-section"
        section.textContent = sections[record.slug.split("/")[0]] ?? "Page"
        const title = document.createElement("span")
        title.className = "hmtc-search-result-title"
        title.textContent = record.title
        const description = document.createElement("span")
        description.className = "hmtc-search-result-description"
        description.textContent = excerpt(record.content, query)
        link.append(section, title)
        // Body excerpts are useful when the title alone does not explain a match.
        const words = query.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean)
        if (!words.every(word => record.title.toLowerCase().includes(word))) link.append(description)
        item.append(link)
        results.append(item)
      }
      results.hidden = ids.length === 0
      status.textContent = ids.length ? `Showing ${ids.length} result${ids.length === 1 ? "" : "s"} for “${query}”.` : `No results for “${query}”. Try another term.`
    } catch {
      if (request !== revision) return
      results.hidden = true
      status.textContent = "Search could not load. Please try again."
    } finally {
      if (request === revision) results.removeAttribute("aria-busy")
    }
  }

  function update(immediate = false) {
    clearTimeout(timer)
    const request = ++revision
    const query = input?.value.trim() ?? ""
    clearResults()
    if (query.replace(/^#/, "").length < 2) {
      if (query && status && panel) {
        panel.hidden = false
        status.textContent = "Enter at least two characters."
      }
      return
    }
    if (immediate) void search(query, request)
    else timer = setTimeout(() => void search(query, request), 150)
  }

  const onInput = () => update()
  const onSubmit = (event: SubmitEvent) => {
    event.preventDefault()
    if (input) {
      const url = new URL(location.href)
      if (input.value.trim()) url.searchParams.set("q", input.value.trim())
      else url.searchParams.delete("q")
      history.replaceState(history.state, "", url)
    }
    update(true)
  }
  const onKey = (event: KeyboardEvent) => {
    if (event.isComposing || !input || !results) return
    const links = [...results.querySelectorAll<HTMLAnchorElement>("a")]
    const selected = links.indexOf(document.activeElement as HTMLAnchorElement)
    if (event.key === "ArrowDown" && links.length && (event.target === input || selected >= 0)) {
      event.preventDefault()
      links[Math.min(selected + 1, links.length - 1)].focus()
    } else if (event.key === "ArrowUp" && selected >= 0) {
      event.preventDefault()
      if (selected === 0) input.focus()
      else links[selected - 1].focus()
    } else if (event.key === "Escape" && (results.childElementCount || status?.textContent)) {
      event.preventDefault()
      clearTimeout(timer)
      revision++
      clearResults()
      input.focus({ preventScroll: true })
    }
    // Normal Tab and native Enter on result links remain browser-owned.
  }
  const onHash = () => { if (location.hash === "#site-search") focusSearch() }
  const onOutside = (event: PointerEvent) => {
    if (scope && !scope.contains(event.target as Node)) {
      clearTimeout(timer)
      revision++
      clearResults()
    }
  }

  document.addEventListener("keydown", shortcut)
  form?.addEventListener("submit", onSubmit)
  input?.addEventListener("input", onInput)
  scope?.addEventListener("keydown", onKey)
  window.addEventListener("hashchange", onHash)
  document.addEventListener("pointerdown", onOutside)
  disposeSearch = () => {
    revision++
    clearTimeout(timer)
    document.removeEventListener("keydown", shortcut)
    form?.removeEventListener("submit", onSubmit)
    input?.removeEventListener("input", onInput)
    scope?.removeEventListener("keydown", onKey)
    window.removeEventListener("hashchange", onHash)
    document.removeEventListener("pointerdown", onOutside)
  }
  window.addCleanup(disposeSearch)

  if (input) {
    input.value = new URLSearchParams(location.search).get("q") ?? ""
    clearResults()
    if (input.value) update(true)
    if (input.value || location.hash === "#site-search") focusSearch()
  }
}

document.addEventListener("nav", setupSiteSearch)
queueMicrotask(setupSiteSearch)
