// Runs a search from a `?q=` URL on the homepage, and from the hero's example
// query chips.
//
// The chips are real anchors to `./?q=…` rather than buttons, so they are
// crawlable, shareable and keyboard-native, and they keep working with JS off
// (landing on the homepage is a reasonable no-JS outcome). This script upgrades
// them: it opens the search modal and types the query in place, and it honours a
// `?q=` arrival from anywhere else — which is what makes the SearchAction in the
// homepage JSON-LD an honest declaration rather than a URL template that
// silently does nothing.
//
// Duplicate content is not a concern: Head.tsx derives the canonical from the
// slug, so every `?q=` variant self-canonicalizes to `/`.

function runQuery(q: string) {
  const button = document.querySelector<HTMLButtonElement>(".hmi-hero-search .search-button")
  const bar = document.querySelector<HTMLInputElement>(".hmi-hero-search .search-bar")
  if (!button || !bar) return
  button.click()
  bar.value = q
  // search.inline.ts binds its handler to `input`, so dispatching one is what
  // actually runs the search rather than just filling the field.
  bar.dispatchEvent(new Event("input", { bubbles: true }))
  bar.focus()
}

function setupHomeSearch() {
  if ((document.body.dataset.slug ?? "") !== "index") return

  const fromUrl = new URLSearchParams(window.location.search).get("q")
  if (fromUrl) {
    // Let search.inline.ts finish binding before driving it.
    window.setTimeout(() => runQuery(fromUrl), 0)
  }

  const chips = Array.from(document.querySelectorAll<HTMLAnchorElement>(".hmi-hero-examples a"))
  const onClick = (e: Event) => {
    const a = (e.currentTarget as HTMLAnchorElement) ?? null
    if (!a) return
    const q = new URL(a.href, window.location.href).searchParams.get("q")
    if (!q) return
    e.preventDefault()
    window.history.replaceState({}, "", `?q=${encodeURIComponent(q)}`)
    runQuery(q)
  }

  for (const chip of chips) chip.addEventListener("click", onClick)
  window.addCleanup(() => {
    for (const chip of chips) chip.removeEventListener("click", onClick)
  })
}

document.addEventListener("nav", setupHomeSearch)
