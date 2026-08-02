// Global TopNav behaviour: the mobile burger, and the mega-menu disclosure.
//
// The CSS in topNav.scss can already open panels on its own (`:hover` behind a
// pointer-media gate, `:focus-within` for keyboards), so the nav works with this
// script absent. What the script adds is hover intent and full keyboard
// handling. To avoid two systems fighting, its first act is to put
// `.hmi-nav--js` on the nav root, which switches the CSS-only rules off.
//
// Re-binds on every SPA `nav` event and cleans up via window.addCleanup.

const OPEN_DELAY = 120
const CLOSE_DELAY = 220

function setupTopNav() {
  const burger = document.querySelector<HTMLButtonElement>(".hmi-topnav-burger")
  const menu = document.getElementById("hmi-topnav-menu")
  if (!burger || !menu) return

  const closeBurger = () => {
    menu.classList.remove("open")
    burger.setAttribute("aria-expanded", "false")
  }

  const toggleBurger = (e: Event) => {
    e.stopPropagation()
    const isOpen = menu.classList.toggle("open")
    burger.setAttribute("aria-expanded", isOpen ? "true" : "false")
  }

  // ---- Mega-menu -------------------------------------------------------
  const items = Array.from(menu.querySelectorAll<HTMLLIElement>(".hmi-nav-item"))
  menu.classList.add("hmi-nav--js")

  let openTimer: number | undefined
  let closeTimer: number | undefined
  const clearTimers = () => {
    window.clearTimeout(openTimer)
    window.clearTimeout(closeTimer)
  }

  const setOpen = (item: HTMLLIElement, open: boolean) => {
    item.classList.toggle("is-open", open)
    item.querySelector(".hmi-nav-toggle")?.setAttribute("aria-expanded", open ? "true" : "false")
  }

  const closeAll = (except?: HTMLLIElement) => {
    for (const item of items) if (item !== except) setOpen(item, false)
  }

  const isOpen = (item: HTMLLIElement) => item.classList.contains("is-open")

  // Pointer: `pointerenter`/`pointerleave` rather than mouseover/mouseout, which
  // fire again for every descendant. The paired timers are what stop a pointer
  // travelling across the bar from flashing five panels on its way to the Ask
  // pill.
  const onEnter = (item: HTMLLIElement) => () => {
    clearTimers()
    openTimer = window.setTimeout(() => {
      closeAll(item)
      setOpen(item, true)
    }, OPEN_DELAY)
  }

  const onLeave = () => {
    clearTimers()
    closeTimer = window.setTimeout(() => closeAll(), CLOSE_DELAY)
  }

  const onToggleClick = (item: HTMLLIElement) => (e: Event) => {
    e.preventDefault()
    e.stopPropagation()
    clearTimers()
    const next = !isOpen(item)
    closeAll(item)
    setOpen(item, next)
  }

  const focusFirstLink = (item: HTMLLIElement) => {
    item.querySelector<HTMLAnchorElement>(".hmi-nav-panel a")?.focus()
  }

  const onItemKeydown = (item: HTMLLIElement, index: number) => (e: KeyboardEvent) => {
    const toggle = item.querySelector<HTMLButtonElement>(".hmi-nav-toggle")
    switch (e.key) {
      case "Escape":
        if (isOpen(item)) {
          e.preventDefault()
          setOpen(item, false)
          toggle?.focus()
        }
        break
      case "ArrowDown":
        e.preventDefault()
        if (!isOpen(item)) {
          closeAll(item)
          setOpen(item, true)
        }
        focusFirstLink(item)
        break
      case "ArrowUp":
        if (isOpen(item)) {
          e.preventDefault()
          setOpen(item, false)
          toggle?.focus()
        }
        break
      case "ArrowRight":
      case "ArrowLeft": {
        // Only move between top-level items when focus is on the bar itself,
        // so arrow keys inside a panel stay available for text navigation.
        const onBar = (e.target as HTMLElement).closest(".hmi-nav-top, .hmi-nav-toggle")
        if (!onBar) return
        e.preventDefault()
        const delta = e.key === "ArrowRight" ? 1 : -1
        const next = items[(index + delta + items.length) % items.length]
        next.querySelector<HTMLAnchorElement>(".hmi-nav-top")?.focus()
        break
      }
    }
  }

  const onItemFocusOut = (item: HTMLLIElement) => (e: FocusEvent) => {
    const to = e.relatedTarget as Node | null
    if (to && item.contains(to)) return
    setOpen(item, false)
  }

  const bound: Array<() => void> = []
  items.forEach((item, index) => {
    const enter = onEnter(item)
    const leave = onLeave
    const keydown = onItemKeydown(item, index)
    const focusout = onItemFocusOut(item)
    const toggle = item.querySelector<HTMLButtonElement>(".hmi-nav-toggle")
    const click = onToggleClick(item)

    item.addEventListener("pointerenter", enter)
    item.addEventListener("pointerleave", leave)
    item.addEventListener("keydown", keydown)
    item.addEventListener("focusout", focusout)
    toggle?.addEventListener("click", click)

    bound.push(() => {
      item.removeEventListener("pointerenter", enter)
      item.removeEventListener("pointerleave", leave)
      item.removeEventListener("keydown", keydown)
      item.removeEventListener("focusout", focusout)
      toggle?.removeEventListener("click", click)
    })
  })

  // ---- Shared close paths ---------------------------------------------
  const onMenuClick = (e: Event) => {
    const target = e.target as HTMLElement
    if (target.closest(".hmi-nav-toggle")) return
    if (target.closest("a")) {
      closeBurger()
      closeAll()
    }
  }

  const onDocClick = (e: Event) => {
    const target = e.target as HTMLElement
    if (!target.closest(".hmi-topnav-menu") && !target.closest(".hmi-topnav-burger")) {
      closeBurger()
      closeAll()
    }
  }

  const onDocKeydown = (e: KeyboardEvent) => {
    if (e.key === "Escape") closeAll()
  }

  burger.addEventListener("click", toggleBurger)
  menu.addEventListener("click", onMenuClick)
  document.addEventListener("click", onDocClick)
  document.addEventListener("keydown", onDocKeydown)

  window.addCleanup(() => {
    clearTimers()
    burger.removeEventListener("click", toggleBurger)
    menu.removeEventListener("click", onMenuClick)
    document.removeEventListener("click", onDocClick)
    document.removeEventListener("keydown", onDocKeydown)
    for (const off of bound) off()
    // A panel left open across an SPA navigation would reappear over the new
    // page with the pointer already "inside" it.
    closeAll()
    menu.classList.remove("hmi-nav--js")
  })
}

document.addEventListener("nav", setupTopNav)
