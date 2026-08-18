// Scroll-reactive chrome: a scroll-to-top button (with a scroll-progress ring)
// and a subtle elevation on the sticky top nav once the page has moved.
//
// Self-contained: the script CREATES its own button and appends it to <body>,
// so it needs no layout slot or renderPage mount. It ships globally from
// componentResources.ts (addGlobalPageResources), exactly like the popover
// behaviour. Being a body-level sibling (outside #quartz-root) it survives SPA
// swaps and its position:fixed can never be trapped by a display:none ancestor.
//
// The button is ported from microbiomemedicine.com (a fixed bottom-right circle
// whose ring fills as the reader descends). Its ring stroke binds to the site's
// own --secondary token, so it renders burgundy on the Index and HMTc-red on
// Certified with no per-site code.
//
// The header elevation is the "very subtle" depth cue: on scroll, <body> gets a
// `.scrolled` class and the sticky header lifts with a faint shadow (a restrained
// take on refinedesign.ai's darker-band-behind-the-header). It shares this one
// scroll handler so the whole site adds exactly one scroll listener.

const RING_LENGTH = 150 // ring path dasharray; offset 150 = empty, 0 = full
const SHOW_AFTER = 300 // px scrolled before the button fades in
const ELEVATE_AFTER = 8 // px scrolled before the header lifts
const RING_PATH = "M25 1a24 24 0 110 48 24 24 0 010-48" // r=24, from 12 o'clock, clockwise

function ensureButton(): HTMLElement {
  const existing = document.querySelector<HTMLElement>(".js-scroll-to-top")
  if (existing) return existing
  const btn = document.createElement("button")
  btn.className = "scroll-to-top js-scroll-to-top"
  btn.setAttribute("aria-label", "Scroll to top")
  btn.setAttribute("title", "Scroll to top")
  btn.innerHTML = `<svg viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path class="stt-track" d="${RING_PATH}" stroke-width="2.5"></path><path class="stt-progress" d="${RING_PATH}" stroke-width="2.5"></path><path class="stt-arrow" d="M18 28l7-7 7 7" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"></path></svg>`
  document.body.appendChild(btn)
  return btn
}

document.addEventListener("nav", () => {
  const btn = ensureButton()
  const ring = btn.querySelector<SVGPathElement>(".stt-progress")

  const update = () => {
    const y = window.scrollY

    // Header elevation — always, independent of the button's visibility.
    document.body.classList.toggle("scrolled", y > ELEVATE_AFTER)

    const doc = document.documentElement
    const max = (doc.scrollHeight || document.body.scrollHeight) - window.innerHeight
    const pct = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0
    if (ring) ring.style.strokeDashoffset = String(RING_LENGTH - RING_LENGTH * pct)
    btn.classList.toggle("visible", y > SHOW_AFTER)
  }

  const toTop = () => window.scrollTo({ top: 0, behavior: "smooth" })

  btn.addEventListener("click", toTop)
  window.addEventListener("scroll", update, { passive: true })
  window.addEventListener("resize", update)
  window.addCleanup(() => {
    btn.removeEventListener("click", toTop)
    window.removeEventListener("scroll", update)
    window.removeEventListener("resize", update)
  })

  update()
})
