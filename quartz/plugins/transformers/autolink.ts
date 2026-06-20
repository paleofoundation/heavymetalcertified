import { QuartzTransformerPlugin } from "../types"
import { Root, Text, ElementContent } from "hast"

// Auto-link the first prose mention of a metal to its profile page, so the
// corpus gains the high-weight *in-content contextual* links that a "See also"
// nav block can't provide (audit finding: pages linked "up" to sources but not
// "laterally/down" to concepts). Runs before CrawlLinks so inserted links are
// resolved and counted into the link graph like any other internal link.
//
// PRECISION FIRST — this is a defensibility-critical reference, so a wrong link
// is worse than a missing one:
//   - Curated, UNAMBIGUOUS vocabulary only. Bare ambiguous words (lead, tin,
//     iron, mercury, nickel, copper, gold, silver, zinc, cobalt, titanium) are
//     deliberately excluded — "lead to", "tin can", "iron-rich" must not link.
//     They are already the most explicitly-linked terms and lose nothing.
//     "methylmercury" and "inorganic arsenic" recover the high-value Hg/As
//     links unambiguously.
//   - First mention per target page only (no over-linking).
//   - Skips headings, existing links, and code; respects explicit links.
//   - Targets validated against the real corpus (never links a missing page).
const TERMS: Record<string, string> = {
  "inorganic arsenic": "metals/arsenic-inorganic",
  "hexavalent chromium": "metals/chromium-hexavalent",
  methylmercury: "metals/mercury-methyl",
  molybdenum: "metals/molybdenum",
  manganese: "metals/manganese",
  aluminium: "metals/aluminum",
  aluminum: "metals/aluminum",
  tellurium: "metals/tellurium",
  palladium: "metals/palladium",
  beryllium: "metals/beryllium",
  vanadium: "metals/vanadium",
  chromium: "metals/chromium",
  antimony: "metals/antimony",
  thallium: "metals/thallium",
  cadmium: "metals/cadmium",
  arsenic: "metals/arsenic",
  uranium: "metals/uranium",
  barium: "metals/barium",
  cesium: "metals/cesium",
}

const SKIP_TAGS = new Set([
  "a",
  "code",
  "pre",
  "kbd",
  "script",
  "style",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
])

function normalize(slug: string): string {
  return slug
    .replace(/^\/+/, "")
    .replace(/[?#].*$/, "")
    .replace(/\/$/, "")
    .replace(/\/index$/, "")
}

function collectLinkedSlugs(node: any, into: Set<string>): void {
  if (node?.type === "element") {
    if (node.tagName === "a" && typeof node.properties?.href === "string") {
      const href = node.properties.href as string
      if (!/^(https?:|#|mailto:|tel:)/.test(href)) into.add(normalize(href))
    }
    for (const c of node.children ?? []) collectLinkedSlugs(c, into)
  }
}

function walk(node: any, blocked: boolean, repl: (t: Text) => ElementContent[] | null): void {
  if (!node.children) return
  const out: ElementContent[] = []
  for (const child of node.children) {
    if (child.type === "text" && !blocked) {
      const replaced = repl(child)
      out.push(...(replaced ?? [child]))
    } else {
      if (child.type === "element") {
        walk(child, blocked || SKIP_TAGS.has(child.tagName), repl)
      }
      out.push(child)
    }
  }
  node.children = out
}

export const AutoLink: QuartzTransformerPlugin = () => {
  return {
    name: "AutoLink",
    htmlPlugins(ctx) {
      const allSlugs = new Set((ctx.allSlugs ?? []) as string[])
      const terms = Object.keys(TERMS).filter((t) => allSlugs.has(TERMS[t]))
      // Longest term first so "inorganic arsenic" wins over "arsenic".
      terms.sort((a, b) => b.length - a.length)
      const pattern =
        terms.length > 0
          ? new RegExp(
              `\\b(${terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\b`,
              "gi",
            )
          : null

      return [
        () => (tree: Root, file: any) => {
          if (!pattern) return
          const curSlug = (file.data.slug ?? "") as string
          if (curSlug === "index" || curSlug.startsWith("tags/")) return

          const linkedSlugs = new Set<string>([normalize(curSlug)]) // never self-link
          collectLinkedSlugs(tree, linkedSlugs) // respect existing explicit links

          walk(tree, false, (textNode: Text): ElementContent[] | null => {
            const value = textNode.value
            pattern.lastIndex = 0
            const parts: ElementContent[] = []
            let last = 0
            let any = false
            let m: RegExpExecArray | null
            while ((m = pattern.exec(value)) !== null) {
              const slug = TERMS[m[1].toLowerCase()]
              if (!slug) continue
              const norm = normalize(slug)
              if (linkedSlugs.has(norm)) continue // self or already linked
              if (m.index > last) parts.push({ type: "text", value: value.slice(last, m.index) })
              parts.push({
                type: "element",
                tagName: "a",
                properties: { href: `/${slug}`, className: ["hmi-autolink"] },
                children: [{ type: "text", value: m[0] }],
              })
              linkedSlugs.add(norm)
              last = m.index + m[0].length
              any = true
            }
            if (!any) return null
            if (last < value.length) parts.push({ type: "text", value: value.slice(last) })
            return parts
          })
        },
      ]
    },
  }
}
