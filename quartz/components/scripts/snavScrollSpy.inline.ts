// The v3 "On this page" left rail: build + active-rail tracking.
//
// Build: comp-ported static pages carry raw-HTML bodies, so their section
// headings never reach the markdown TOC and the Snav shell renders empty with
// `data-auto="1"`. Here we populate it from the rendered DOM — one numbered
// rail per `<section id>` (or, failing that, per `<h2>`) — and remove the shell
// if the page has no sections at all.
//
// Track: mark the rail whose section is currently in view with `.active` (red
// border + red text), matching the design. Pure IntersectionObserver.

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function buildAutoRail() {
  const box = document.querySelector<HTMLElement>('.hmtc-onpage[data-auto="1"]')
  if (!box) return
  const content = document.querySelector(".wiki-content, .center, article")
  if (!content) {
    box.remove()
    return
  }

  // Prefer explicit <section id> wrappers (the ported comp bodies use them, and
  // the id is the scroll anchor). Fall back to <h2> headings, minting ids.
  const items: { id: string; text: string }[] = []
  const sections = Array.from(content.querySelectorAll<HTMLElement>("section[id]"))
  if (sections.length) {
    for (const sec of sections) {
      const h = sec.querySelector("h2, h3")
      const text = (h?.textContent ?? sec.getAttribute("aria-label") ?? "").trim()
      if (text && sec.id) items.push({ id: sec.id, text })
    }
  }
  if (!items.length) {
    const heads = Array.from(content.querySelectorAll<HTMLElement>("h2"))
    for (const h of heads) {
      let id = h.id
      if (!id) {
        id = slugify(h.textContent ?? "")
        if (id) h.id = id
      }
      const text = (h.textContent ?? "").trim()
      if (id && text) items.push({ id, text })
    }
  }

  if (!items.length) {
    box.remove()
    return
  }

  const nav = box.querySelector<HTMLElement>(".hmtc-onpage-nav")
  const count = box.querySelector<HTMLElement>(".hmtc-onpage-count")
  if (!nav) return
  nav.replaceChildren()
  items.forEach((it, i) => {
    const a = document.createElement("a")
    a.className = "hmtc-rail" + (i === 0 ? " active" : "")
    a.href = "#" + it.id
    a.setAttribute("data-for", it.id)
    const num = document.createElement("span")
    num.className = "hmtc-rail-num"
    num.textContent = String(i + 1).padStart(2, "0")
    const lab = document.createElement("span")
    lab.className = "hmtc-rail-label"
    lab.textContent = it.text
    a.append(num, lab)
    nav.appendChild(a)
  })
  if (count) count.textContent = `${items.length} rail${items.length === 1 ? "" : "s"}`
}

document.addEventListener("nav", () => {
  buildAutoRail()

  const rails = Array.from(document.querySelectorAll<HTMLAnchorElement>(".hmtc-rail"))
  if (!rails.length) return
  const targets = rails
    .map((r) => document.getElementById(r.getAttribute("data-for") ?? ""))
    .filter((el): el is HTMLElement => !!el)
  if (!targets.length) return

  const visible = new Set<string>()
  const setActive = () => {
    let activeSlug: string | null = null
    // first section still visible wins; else the last one scrolled past
    for (const r of rails) {
      const slug = r.getAttribute("data-for")
      if (slug && visible.has(slug)) {
        activeSlug = slug
        break
      }
    }
    if (!activeSlug) {
      let best: { slug: string; top: number } | null = null
      for (const t of targets) {
        const top = t.getBoundingClientRect().top
        if (top < 120 && (!best || top > best.top)) best = { slug: t.id, top }
      }
      activeSlug = best?.slug ?? rails[0].getAttribute("data-for")
    }
    for (const r of rails) r.classList.toggle("active", r.getAttribute("data-for") === activeSlug)
  }

  const obs = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) visible.add(e.target.id)
        else visible.delete(e.target.id)
      }
      setActive()
    },
    { rootMargin: "-100px 0px -70% 0px", threshold: 0 },
  )
  for (const t of targets) obs.observe(t)
  setActive()
  window.addEventListener("scroll", setActive, { passive: true })
})
