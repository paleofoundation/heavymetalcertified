import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import style from "./styles/dedicatedPages.scss"
import { resolveRelative, simplifySlug } from "../util/path"

// Left-rail "dedicated pages" group (DECISIONS: under the lower nav group,
// after References, a template-driven group linking THIS page's related
// Products / Ingredients / Regulations — extensible, minimal, no clutter).
//
// This is the left-rail, compact sibling of RelatedPages (the rich in-body
// "See also"). It is template-driven: the GROUPS array below is the single
// place to add a category. It reuses the same dual-source derivation as
// RelatedPages — outbound links + inbound backlinks + frontmatter
// cross-references — so it stays correct as the corpus grows without any
// hand-maintained lists (CLAUDE.md Part 5b: linking is a system
// responsibility). Sources are deliberately excluded: they are evidence,
// surfaced via inline citations and the citation panel, not lateral nav.
//
// Authority/anti-competition (DECISIONS): this is NAVIGATION, not content. It
// points at the page that owns each intent (ingredient owns commodity-by-metal,
// product owns consumer-category, regulation owns the numeric limit) without
// duplicating their content here. No information is created or moved.

// Template — edit this array to add/reorder dedicated-page categories.
const GROUPS: { key: string; label: string }[] = [
  { key: "products", label: "Products" },
  { key: "ingredients", label: "Ingredients" },
  { key: "regulations", label: "Regulations" },
]
const GROUP_KEYS = new Set(GROUPS.map((g) => g.key))
const PER_GROUP_CAP = 8

function categoryOf(slug: string): string {
  return (slug ?? "").split("/")[0]
}

// Inbound-link index, built once per build and memoized on the allFiles
// reference (same pattern + rationale as RelatedPages: O(N) not O(N^2)).
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
  const DedicatedPages: QuartzComponent = ({ fileData, allFiles, displayClass }: QuartzComponentProps) => {
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

    const candidates = new Set<string>()
    for (const l of fileData.links ?? []) candidates.add(simplifySlug(l as never))
    for (const from of inboundIndex(allFiles).get(simple) ?? [])
      candidates.add(simplifySlug(from as never))
    for (const key of GROUP_KEYS) {
      const v = fileData.frontmatter?.[key]
      const arr = Array.isArray(v) ? v : v != null ? [v] : []
      for (const item of arr) {
        const m = String(item).match(/\[\[([^\]\|#]+)/)
        if (m) candidates.add(simplifySlug(m[1].trim().replace(/^\/+/, "") as never))
      }
    }

    const buckets = new Map<string, { href: string; label: string }[]>()
    for (const cand of candidates) {
      if (cand === simple) continue
      const cat = categoryOf(cand)
      if (!GROUP_KEYS.has(cat)) continue
      const realSlug = slugBySimple.get(cand) ?? (cand as string)
      const label = (titleBySlug.get(realSlug) ?? cand.split("/").pop() ?? cand).toString()
      if (!buckets.has(cat)) buckets.set(cat, [])
      buckets.get(cat)!.push({ href: resolveRelative(mySlug, realSlug as never), label })
    }

    const groups = GROUPS.map((g) => {
      const items = buckets.get(g.key) ?? []
      return {
        ...g,
        total: items.length,
        indexHref: resolveRelative(mySlug, `${g.key}` as never),
      }
    }).filter((g) => g.total > 0)

    if (groups.length === 0) return null

    // Compact cross-reference counts (the "In this …" group): one row
    // per category with a count badge, linking to that category index. The full
    // per-page link list lives in the in-body RelatedPages "See also".
    const groupLabel = String(mySlug).startsWith("metals/") ? "In this metal" : "Cross-references"
    return (
      <nav class="snav-counts" aria-label="Cross-references">
        <div class="navgrouplabel">{groupLabel}</div>
        {groups.map((g) => (
          <a class="icon" href={g.indexHref}>
            <span>{g.label}</span>
            <span class="navcount">{g.total}</span>
          </a>
        ))}
      </nav>
    )
  }

  DedicatedPages.css = style
  return DedicatedPages
}) satisfies QuartzComponentConstructor
