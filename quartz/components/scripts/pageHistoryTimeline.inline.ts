// Transforms the generated "Update history" table (Commit | Date | Change |
// Description) into a burgundy vertical timeline with All / Major / Minor /
// Corrections filter tabs. Render-time only: the build/content is untouched and
// the generator (build-page-changelogs.mjs) keeps emitting the table, which stays
// the crawlable and no-JS fallback; this rebuilds it as <ol class="hist-timeline">
// styled by proof-design.scss.

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

const CLASSES = ["major", "minor", "correction"]

const TABS: { key: string; label: string }[] = [
  { key: "all", label: "All updates" },
  { key: "major", label: "Major" },
  { key: "minor", label: "Minor" },
  { key: "correction", label: "Corrections" },
]

function fmtDate(iso: string): string {
  const m = iso.trim().match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return iso.trim()
  const y = +m[1], mo = +m[2], d = +m[3]
  if (mo < 1 || mo > 12) return iso.trim()
  return `${MONTHS[mo - 1]} ${d}, ${y}`
}

// Pre-classification history blocks rendered the raw commit subject in the third
// column ("fix(scope): subject"). Kept so older builds degrade to a labelled
// entry rather than an unlabelled one.
function splitLegacy(desc: string): { type: string; title: string } {
  const m = desc.match(/^([a-z]+)(?:\([^)]*\))?:\s*(.*)$/i)
  if (m && m[2]) return { type: m[1].toLowerCase(), title: m[2] }
  return { type: "", title: desc }
}

function buildPageHistoryTimeline() {
  const h = document.getElementById("update-history") ?? document.getElementById("page-history")
  if (!h) return

  // find the table after the heading (skip the intro paragraph)
  let el: Element | null = h.nextElementSibling
  let container: Element | null = null
  while (el) {
    if (el.tagName === "TABLE" || el.classList?.contains("table-container")) {
      container = el
      break
    }
    if (el.tagName === "H1" || el.tagName === "H2") break
    el = el.nextElementSibling
  }
  if (!container) return
  const table = container.tagName === "TABLE" ? container : container.querySelector("table")
  if (!table) return
  const rows = Array.from(table.querySelectorAll("tbody tr"))
  if (!rows.length) return

  const ol = document.createElement("ol")
  ol.className = "hist-timeline"
  const present = new Set<string>()

  rows.forEach((tr, i) => {
    const cells = Array.from(tr.querySelectorAll("td"))
    if (cells.length < 3) return
    const commitA = cells[0].querySelector("a")
    const date = (cells[1].textContent || "").trim()

    let type: string
    let title: string
    if (cells.length >= 4) {
      type = (cells[2].textContent || "").trim().toLowerCase()
      title = (cells[3].textContent || "").trim()
    } else {
      const legacy = splitLegacy((cells[2].textContent || "").trim())
      type = legacy.type
      title = legacy.title
    }
    if (!CLASSES.includes(type)) type = ""

    const li = document.createElement("li")
    li.className = i === 0 ? "hist-item hist-item-latest" : "hist-item"
    if (type) {
      li.dataset.change = type
      present.add(type)
    }

    const meta = document.createElement("div")
    meta.className = "hist-meta"
    const dateEl = document.createElement("span")
    dateEl.className = "hist-date"
    dateEl.textContent = fmtDate(date)
    meta.appendChild(dateEl)
    if (type) {
      const badge = document.createElement("span")
      badge.className = `hist-badge hist-badge-${type}`
      badge.textContent = type
      meta.appendChild(badge)
    }

    const titleEl = document.createElement("div")
    titleEl.className = "hist-title"
    titleEl.textContent = title

    li.appendChild(meta)
    li.appendChild(titleEl)

    if (commitA) {
      const link = document.createElement("a")
      link.className = "hist-commit"
      link.href = commitA.getAttribute("href") || "#"
      link.target = "_blank"
      link.rel = "noopener"
      link.textContent = (commitA.textContent || "commit").trim()
      li.appendChild(link)
    }
    ol.appendChild(li)
  })

  if (!ol.children.length) return

  const wrap = document.createElement("div")
  wrap.className = "hist-wrap"

  // Tabs appear only when there is more than one class to filter between —
  // a single-class history does not need a chooser.
  if (present.size > 1) {
    const tabs = document.createElement("div")
    tabs.className = "hist-tabs"
    tabs.setAttribute("role", "tablist")
    TABS.filter((t) => t.key === "all" || present.has(t.key)).forEach((t, idx) => {
      const b = document.createElement("button")
      b.type = "button"
      b.className = idx === 0 ? "hist-tab hist-tab-on" : "hist-tab"
      b.textContent = t.label
      b.dataset.filter = t.key
      b.setAttribute("role", "tab")
      b.setAttribute("aria-selected", idx === 0 ? "true" : "false")
      b.addEventListener("click", () => {
        tabs.querySelectorAll(".hist-tab").forEach((other) => {
          const on = other === b
          other.classList.toggle("hist-tab-on", on)
          other.setAttribute("aria-selected", on ? "true" : "false")
        })
        Array.from(ol.children).forEach((item) => {
          const li = item as HTMLElement
          const show = t.key === "all" || li.dataset.change === t.key
          li.hidden = !show
        })
      })
      tabs.appendChild(b)
    })
    wrap.appendChild(tabs)
  }

  wrap.appendChild(ol)
  container.replaceWith(wrap)
}

document.addEventListener("nav", buildPageHistoryTimeline)
