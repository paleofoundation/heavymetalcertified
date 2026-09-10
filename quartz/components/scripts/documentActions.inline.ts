export {}
document.addEventListener("nav", () => {
  document.querySelectorAll<HTMLButtonElement>("[data-copy-feed]").forEach(button => {
    const copy = async () => {
      const status = button.parentElement?.querySelector('[role="status"]')
      try {
        await navigator.clipboard.writeText(new URL(button.dataset.copyFeed!, location.origin).href)
        if (status) status.textContent = "Feed link copied."
      } catch {
        if (status) status.textContent = "Use Open page feed to copy its address."
      }
    }
    button.addEventListener("click", copy)
    window.addCleanup(() => button.removeEventListener("click", copy))
  })
  document.querySelectorAll<HTMLDetailsElement>(".hmtc-follow").forEach(details => {
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape" && details.open) { details.open = false; details.querySelector('summary')?.focus() }
    }
    details.addEventListener("keydown", close)
    window.addCleanup(() => details.removeEventListener("keydown", close))
  })
})
