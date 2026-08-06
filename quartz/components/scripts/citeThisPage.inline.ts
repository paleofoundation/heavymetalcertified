export {} // module scope — keeps locals out of the global namespace

// Wires the "Cite this page" footer block on every public Heavy Metal Index
// page. The block reveals (a) the canonical citation, (b) a download link to
// /api/evidence-packet?slug=<slug>&download=1 (brand-legal / regulatory
// exhibit), and (c) a "Copy citation" button.
//
// Markup is rendered server-side by Quartz.CiteThisPage (TSX); this script
// only handles the toggle + clipboard interaction.

const READY_ATTR = "data-hmi-cite-ready"

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }
    const textarea = document.createElement("textarea")
    textarea.value = text
    textarea.setAttribute("readonly", "")
    textarea.style.position = "fixed"
    textarea.style.left = "-9999px"
    document.body.appendChild(textarea)
    textarea.select()
    const ok = document.execCommand("copy")
    textarea.remove()
    return ok
  } catch {
    return false
  }
}

function bind(root: HTMLElement) {
  if (root.dataset.hmiCiteReady === "true") return
  root.dataset.hmiCiteReady = "true"

  const toggle = root.querySelector("[data-hmi-cite-toggle]") as HTMLButtonElement | null
  const detail = root.querySelector("[data-hmi-cite-detail]") as HTMLElement | null
  const copyButton = root.querySelector("[data-hmi-cite-copy]") as HTMLButtonElement | null
  const citationText = root.querySelector("[data-hmi-cite-text]") as HTMLElement | null
  const copyStatus = root.querySelector("[data-hmi-cite-copy-status]") as HTMLElement | null

  if (toggle && detail) {
    toggle.addEventListener("click", () => {
      const expanded = toggle.getAttribute("aria-expanded") === "true"
      toggle.setAttribute("aria-expanded", String(!expanded))
      detail.hidden = expanded
      toggle.textContent = expanded ? "Show citation" : "Hide citation"
    })
  }

  if (copyButton && citationText) {
    copyButton.addEventListener("click", async () => {
      const text = citationText.innerText.trim()
      const ok = await copyText(text)
      if (copyStatus) {
        copyStatus.textContent = ok ? "Copied." : "Copy failed — select and copy manually."
        copyStatus.dataset.state = ok ? "ok" : "error"
        setTimeout(() => {
          copyStatus.textContent = ""
          delete copyStatus.dataset.state
        }, 3000)
      }
    })
  }

  const flash = (msg: string, ok = true) => {
    if (!copyStatus) return
    copyStatus.textContent = msg
    copyStatus.dataset.state = ok ? "ok" : "error"
    setTimeout(() => {
      copyStatus.textContent = ""
      delete copyStatus.dataset.state
    }, 3000)
  }

  const d = root.dataset
  const title = d.citeTitle ?? ""
  const url = d.citeUrl ?? ""
  const year = d.citeYear ?? ""
  const doi = d.citeDoi ?? ""
  const today = d.citeToday ?? ""
  const slug = d.citeSlug ?? "page"
  const key = `heavymetalindex-${slug.replace(/[^a-z0-9]+/gi, "-").replace(/(^-|-$)/g, "")}`

  const download = (filename: string, text: string, mime: string) => {
    const blob = new Blob([text], { type: mime })
    const href = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = href
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(href), 1000)
  }

  const bibtexButton = root.querySelector("[data-hmi-cite-bibtex]")
  if (bibtexButton) {
    bibtexButton.addEventListener("click", () => {
      const lines = [
        `@misc{${key},`,
        `  title        = {${title}},`,
        `  author       = {{Heavy Metal Index}},`,
        `  organization = {Institute of Contaminant Standards (ICS)},`,
        `  year         = {${year}},`,
        ...(doi ? [`  doi          = {${doi}},`] : []),
        `  howpublished = {\\url{${url}}},`,
        `  note         = {Retrieved ${today}. CC BY 4.0.},`,
        `  url          = {${url}}`,
        `}`,
      ]
      download(`${key}.bib`, lines.join("\n") + "\n", "application/x-bibtex")
      flash("BibTeX downloaded.")
    })
  }

  const risButton = root.querySelector("[data-hmi-cite-ris]")
  if (risButton) {
    risButton.addEventListener("click", () => {
      const lines = [
        "TY  - ELEC",
        `TI  - ${title}`,
        "AU  - Heavy Metal Index",
        "PB  - Institute of Contaminant Standards (ICS)",
        `PY  - ${year}`,
        ...(doi ? [`DO  - ${doi}`] : []),
        `UR  - ${url}`,
        `Y2  - ${today}`,
        "N1  - CC BY 4.0",
        "ER  - ",
      ]
      download(`${key}.ris`, lines.join("\n") + "\n", "application/x-research-info-systems")
      flash("RIS downloaded.")
    })
  }

  const copyLink = root.querySelector("[data-hmi-cite-copylink]")
  if (copyLink) {
    copyLink.addEventListener("click", async () => {
      const ok = await copyText(url)
      flash(ok ? "Link copied." : "Copy failed.", ok)
    })
  }
}

function setupAll() {
  document.querySelectorAll<HTMLElement>(`.hmi-cite-page:not([${READY_ATTR}=true])`).forEach(bind)
}

document.addEventListener("nav", setupAll)
queueMicrotask(setupAll)
