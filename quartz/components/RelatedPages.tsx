import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import style from "./styles/relatedPages.scss"
import { resolveRelative, simplifySlug } from "../util/path"

// "See also" — the bidirectional concept graph for a page.
//
// Audit finding: the corpus links "upward" richly (a page cites its sources
// and names its metal/regulation) but barely "laterally/downward" — only 10%
// of metal pages linked to any ingredient and 5% to any product, even though
// dozens of ingredient/product pages point AT each metal. Metal pages, the
// most-referenced hubs, were navigational dead-ends.
//
// This surfaces BOTH directions of the graph (pages this one links to, AND
// pages that link to this one), grouped by concept type, so every page
// becomes traversable in both directions. It is computed from the build's
// link graph — no hand-maintained "related" lists — which keeps it correct as
// the corpus grows (the routing/linking layer is a system responsibility,
// CLAUDE.md Part 5b). Sources are excluded: they are the evidence (surfaced
// via inline citations + the citation card), not lateral navigation.

// Concept categories that belong in lateral navigation, in display order.
const GROUPS: { key: string; label: string }[] = [
  { key: "metals", label: "Metals" },
  { key: "ingredients", label: "Ingredients" },
  { key: "products", label: "Products" },
  { key: "regulations", label: "Regulations" },
  { key: "synthesis", label: "Synthesis" },
  { key: "mitigation", label: "Mitigation" },
]
const GROUP_KEYS = new Set(GROUPS.map((g) => g.key))
const PER_GROUP_CAP = 18

function categoryOf(slug: string): string {
  return (slug ?? "").split("/")[0]
}

// Inbound-link index, built once per build from allFiles (the same array
// reference is shared across every page render in a build), so this is O(N)
// overall rather than O(N^2). Re-keyed if allFiles changes (dev watch).
let cachedFiles: unknown = null
let cachedIndex: Map<string, Set<string>> | null = null
function inboundIndex(allFiles: QuartzComponentProps["allFiles"]): Map<string, Set<string>> {
  if (cachedIndex && cachedFiles === allFiles) return cachedIndex
  const map = new Map<string, Set<string>>()
  for (const f of allFiles) {
    const from = f.slug
    if (!from) continue
    for (const l of f.links ?? []) {
      const target = simplifySlug(l as never)
      if (!map.has(target)) map.set(target, new Set())
      map.get(target)!.add(from)
    }
  }
  cachedFiles = allFiles
  cachedIndex = map
  return map
}

export default (() => {
  const RelatedPages: QuartzComponent = ({ fileData, allFiles }: QuartzComponentProps) => {
    const mySlug = fileData.slug
    if (!mySlug) return null
    const simple = simplifySlug(mySlug)

    const titleBySlug = new Map<string, string>()
    const slugBySimple = new Map<string, string>()
    for (const f of allFiles) {
      if (!f.slug) continue
      slugBySimple.set(simplifySlug(f.slug), f.slug)
      const t = f.frontmatter?.title
      if (t) titleBySlug.set(f.slug, String(t))
    }

    // Candidate related slugs: outbound (this page's links) + inbound (pages
    // that link here). Both are simplified slugs.
    const candidates = new Set<string>()
    for (const l of fileData.links ?? []) candidates.add(simplifySlug(l as never))
    for (const from of inboundIndex(allFiles).get(simple) ?? [])
      candidates.add(simplifySlug(from as never))
    // Curated frontmatter cross-references (rich on synthesis pages, where the
    // related ingredients/products are declared but may not be reciprocated in
    // the rendered link graph). Metal symbols like "Pb" carry no [[...]] and
    // are skipped.
    for (const key of GROUP_KEYS) {
      const v = fileData.frontmatter?.[key]
      const arr = Array.isArray(v) ? v : v != null ? [v] : []
      for (const item of arr) {
        const m = String(item).match(/\[\[([^\]\|#]+)/)
        if (m) candidates.add(simplifySlug(m[1].trim().replace(/^\/+/, "") as never))
      }
    }

    // Bucket by concept category, resolving to a real slug + title.
    const buckets = new Map<string, { href: string; label: string }[]>()
    for (const cand of candidates) {
      if (cand === simple) continue
      const cat = categoryOf(cand)
      if (!GROUP_KEYS.has(cat)) continue // drops sources/, tags/, self-index, etc.
      const realSlug = slugBySimple.get(cand) ?? (cand as string)
      const label = (titleBySlug.get(realSlug) ?? cand.split("/").pop() ?? cand).toString()
      if (!buckets.has(cat)) buckets.set(cat, [])
      buckets.get(cat)!.push({ href: resolveRelative(mySlug, realSlug as never), label })
    }

    const groups = GROUPS.map((g) => {
      const items = (buckets.get(g.key) ?? [])
        .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }))
      const shown = items.slice(0, PER_GROUP_CAP)
      return { ...g, shown, overflow: items.length - shown.length, indexHref: `/${g.key}` }
    }).filter((g) => g.shown.length > 0)

    if (groups.length === 0) return null

    return (
      <nav class="hmi-related" aria-label="See also">
        <h2 class="hmi-related-title">See also</h2>
        <div class="hmi-related-grid">
          {groups.map((g) => (
            <div class="hmi-related-group">
              <span class="hmi-related-group-label">{g.label}</span>
              <ul>
                {g.shown.map((l) => (
                  <li>
                    <a href={l.href}>{l.label}</a>
                  </li>
                ))}
              </ul>
              {g.overflow > 0 ? (
                <a class="hmi-related-more" href={resolveRelative(mySlug, g.indexHref as never)}>
                  + {g.overflow} more {g.label.toLowerCase()} →
                </a>
              ) : null}
            </div>
          ))}
        </div>
      </nav>
    )
  }

  RelatedPages.css = style
  return RelatedPages
}) satisfies QuartzComponentConstructor
