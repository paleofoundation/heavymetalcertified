export {} // module scope — keeps locals out of the global namespace

// Wires the discreet "Share" control in the right rail (Rail.tsx). The button is
// a popup-menu trigger (aria-haspopup="menu") offering Copy link, X, LinkedIn,
// Reddit, and Email — a discreet share affordance placed in the rail, not a loud
// social bar. Markup is rendered server-side by Quartz.Rail; this only handles
// the toggle, clipboard, and social hrefs (built at runtime from the live URL so
// the target is always correct, canonical or not).
//
// Ported from the Heavy Metal Index rail Share popup (railShare.inline.ts,
// commit 2e5b81c0e). Selectors use the cert `data-hmtc-share*` convention so the
// two sites' markup stays legible on its own.

async function hmtcShareCopy(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }
    const ta = document.createElement("textarea")
    ta.value = text
    ta.setAttribute("readonly", "")
    ta.style.position = "fixed"
    ta.style.left = "-9999px"
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand("copy")
    ta.remove()
    return ok
  } catch {
    return false
  }
}

function hmtcShareCloseMenu(root: HTMLElement) {
  const toggle = root.querySelector("[data-hmtc-share-toggle]") as HTMLButtonElement | null
  const menu = root.querySelector("[data-hmtc-share-menu]") as HTMLElement | null
  if (menu) menu.hidden = true
  if (toggle) toggle.setAttribute("aria-expanded", "false")
}

function hmtcShareCloseAll(except?: HTMLElement) {
  document.querySelectorAll<HTMLElement>("[data-hmtc-share]").forEach((root) => {
    if (root !== except) hmtcShareCloseMenu(root)
  })
}

function hmtcShareSetup(root: HTMLElement) {
  if (root.dataset.hmtcShareReady === "true") return
  root.dataset.hmtcShareReady = "true"

  const toggle = root.querySelector("[data-hmtc-share-toggle]") as HTMLButtonElement | null
  const menu = root.querySelector("[data-hmtc-share-menu]") as HTMLElement | null
  if (!toggle || !menu) return
  const status = root.querySelector("[data-hmtc-share-status]") as HTMLElement | null

  const url = location.href
  const title = document.title
  const enc = encodeURIComponent

  const x = root.querySelector("[data-hmtc-share-x]") as HTMLAnchorElement | null
  const li = root.querySelector("[data-hmtc-share-linkedin]") as HTMLAnchorElement | null
  const reddit = root.querySelector("[data-hmtc-share-reddit]") as HTMLAnchorElement | null
  const email = root.querySelector("[data-hmtc-share-email]") as HTMLAnchorElement | null
  if (x) x.href = `https://twitter.com/intent/tweet?url=${enc(url)}&text=${enc(title)}`
  if (li) li.href = `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`
  if (reddit) reddit.href = `https://www.reddit.com/submit?url=${enc(url)}&title=${enc(title)}`
  if (email) email.href = `mailto:?subject=${enc(title)}&body=${enc(url + "\n\n")}`

  toggle.addEventListener("click", (e) => {
    e.preventDefault()
    e.stopPropagation()
    const willOpen = menu.hidden
    hmtcShareCloseAll(root)
    menu.hidden = !willOpen
    toggle.setAttribute("aria-expanded", String(willOpen))
  })

  const copy = root.querySelector("[data-hmtc-share-copy]") as HTMLButtonElement | null
  copy?.addEventListener("click", async () => {
    const ok = await hmtcShareCopy(url)
    if (status) {
      status.textContent = ok ? "Link copied." : "Copy failed — copy from the address bar."
      window.setTimeout(() => {
        if (status) status.textContent = ""
      }, 2500)
    }
    if (ok) window.setTimeout(() => hmtcShareCloseMenu(root), 600)
  })

  menu
    .querySelectorAll("a.share-item")
    .forEach((a) => a.addEventListener("click", () => hmtcShareCloseMenu(root)))
}

function hmtcShareSetupAll() {
  document.querySelectorAll<HTMLElement>("[data-hmtc-share]").forEach(hmtcShareSetup)
}

// Document-level dismissers are registered once (module scope), not per rail, so
// they do not accumulate across Quartz SPA navigations.
document.addEventListener("click", (e) => {
  const t = e.target as Node
  document.querySelectorAll<HTMLElement>("[data-hmtc-share]").forEach((root) => {
    if (!root.contains(t)) hmtcShareCloseMenu(root)
  })
})
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") hmtcShareCloseAll()
})
document.addEventListener("nav", hmtcShareSetupAll)
queueMicrotask(hmtcShareSetupAll)
