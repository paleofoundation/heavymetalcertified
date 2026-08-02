// Converts in-article source-page citation links (a[data-slug^="sources/"]) into
// superscript bracketed numbers ([1]) with a hover card, and strips the
// parentheses the prose wraps them in — "...claim (cite)." → "...claim.[1]",
// "(cite, cite)" → "[1], [2]". Render-time only; the build/content is untouched.
//
// Numbering is read off the generated "## References" list rather than assigned
// here (build-page-references.mjs emits it in first-appearance order). Deriving
// both from the same list is what keeps superscript [7] and reference 7 the same
// work: a link the reference list does not carry — a corpus table cell, a
// citation inside apparatus — is left as an ordinary link rather than being
// numbered into a sequence the reference list cannot resolve.

type Ref = { num: number; href: string; label: string; title: string; publication: string }

// Index the References list: assign each entry an anchor id and read back the
// citation parts the hover card shows.
function indexReferences(content: Element): Map<string, Ref> {
  const bySlug = new Map<string, Ref>()
  const heading = content.querySelector("#references")
  if (!heading) return bySlug

  let el: Element | null = heading.nextElementSibling
  let list: HTMLOListElement | null = null
  while (el) {
    if (el.tagName === "OL") {
      list = el as HTMLOListElement
      break
    }
    if (el.tagName === "H1" || el.tagName === "H2") break
    el = el.nextElementSibling
  }
  if (!list) return bySlug
  list.classList.add("ref-list")

  Array.from(list.children).forEach((li, i) => {
    const num = i + 1
    li.id = `ref-${num}`
    const a = li.querySelector('a[data-slug^="sources/"]') as HTMLAnchorElement | null
    const slug = a?.getAttribute("data-slug")
    if (!slug) return
    const em = li.querySelector("em")
    const text = (li.textContent || "").trim()
    const title = (em?.textContent || "").trim()
    const label = title ? text.split(title)[0].replace(/[*.\s]+$/, "").trim() : text.slice(0, 80)
    const afterTitle = title ? text.split(title)[1] || "" : ""
    const publication = afterTitle.replace(/^[.\s]+/, "").split(/https?:\/\//)[0].trim().replace(/[.\s]+$/, "")
    bySlug.set(slug, {
      num,
      href: a?.getAttribute("href") || "#",
      label,
      title,
      publication,
    })
  })
  return bySlug
}

function applyCiteSuperscripts() {
  const content = document.querySelector(".wiki-content")
  if (!content) return

  // Landing surfaces carry no citation apparatus, and their links to corpus hubs
  // are navigation rather than citations. Without this, the homepage's six
  // `href="sources/"` links match `a[data-slug^="sources/"]` and get replaced by
  // bare "[1]" superscripts — which is what ate the "Sources" card heading
  // before the References list existed. The empty-refs check below is not a
  // guard for that case; it only happens to bail today because the homepage has
  // no reference list yet.
  if ((document.body.dataset.slug ?? "") === "index") return

  const refs = indexReferences(content)
  if (refs.size === 0) return

  // 1) Convert each source link to a superscript citation.
  const links = content.querySelectorAll('a[data-slug^="sources/"]')
  links.forEach((el) => {
    const a = el as HTMLAnchorElement
    if (a.closest("sup.cite")) return
    if (a.closest("#references, .ref-list")) return
    if (a.closest("table")) return
    // Generated navigation/landing blocks opt out explicitly, so the guard
    // travels with the markup if one is ever reused on a non-index slug.
    if (a.closest("[data-no-cite]")) return
    const slug = a.getAttribute("data-slug") || ""
    const ref = refs.get(slug)
    if (!ref) return

    const sup = document.createElement("sup")
    sup.className = "cite"
    const link = document.createElement("a")
    link.href = `#ref-${ref.num}`
    link.textContent = String(ref.num)
    const card = document.createElement("span")
    card.className = "cite-card"
    const au = document.createElement("span")
    au.className = "au"
    au.textContent = ref.label || (a.textContent || "").trim()
    const ti = document.createElement("span")
    ti.className = "ti"
    ti.textContent = ref.title
    const pub = document.createElement("span")
    pub.className = "pub"
    pub.textContent = ref.publication
    const go = document.createElement("a")
    go.className = "go"
    go.href = ref.href
    go.textContent = "Read source →"
    card.appendChild(au)
    if (ref.title) card.appendChild(ti)
    if (ref.publication) card.appendChild(pub)
    card.appendChild(go)
    sup.appendChild(link)
    sup.appendChild(card)
    a.replaceWith(sup)
  })

  // 2) Strip parentheses that wrap ONLY a citation (or comma-separated run).
  const sups = Array.from(content.querySelectorAll("sup.cite"))
  const seen = new Set<Node>()
  sups.forEach((sup) => {
    if (seen.has(sup)) return
    // Extend the run over ", " / " " separators followed by another cite.
    let end: Element = sup
    let node = sup.nextSibling
    while (node) {
      if (node.nodeType === 3 && /^[\s,]+$/.test(node.textContent || "")) {
        const nxt = node.nextSibling as Element | null
        if (nxt && nxt.nodeType === 1 && (nxt as Element).matches?.("sup.cite")) {
          seen.add(nxt)
          end = nxt
          node = nxt.nextSibling
          continue
        }
      }
      break
    }
    const before = sup.previousSibling
    const after = end.nextSibling
    if (
      before &&
      before.nodeType === 3 &&
      after &&
      after.nodeType === 3 &&
      /\(\s*$/.test(before.textContent || "") &&
      /^\s*\)/.test(after.textContent || "")
    ) {
      before.textContent = (before.textContent || "").replace(/\s*\(\s*$/, "")
      let rest = (after.textContent || "").replace(/^\s*\)/, "")
      const punct = rest.match(/^\s*([.,;:!?])/)
      if (punct) {
        // sentence/clause punctuation: glue it before the citation → "claim.[1]"
        before.textContent = (before.textContent || "") + punct[1]
        rest = rest.slice(punct[0].length)
      } else {
        // mid-sentence: keep a space before the citation → "claim [1] word"
        before.textContent = (before.textContent || "") + " "
      }
      after.textContent = rest
    }
  })
}

document.addEventListener("nav", applyCiteSuperscripts)
