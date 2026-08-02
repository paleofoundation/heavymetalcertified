// Active-rail tracking for the v3 "On this page" left rail. Marks the rail whose
// section is currently in view with .active (red border + red text), matching the
// design's behaviour. Pure IntersectionObserver, no dependencies.
document.addEventListener("nav", () => {
  const rails = Array.from(document.querySelectorAll<HTMLAnchorElement>(".hmtc-rail"))
  if (!rails.length) return
  const bySlug = new Map<string, HTMLAnchorElement>()
  for (const r of rails) {
    const slug = r.getAttribute("data-for")
    if (slug) bySlug.set(slug, r)
  }
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
      // pick the last section above the top of the viewport
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
