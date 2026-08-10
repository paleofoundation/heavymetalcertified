import { QuartzTransformerPlugin } from "../types"
import { Root, Text, ElementContent } from "hast"

// Auto-link the first prose mention of a SIBLING PROPERTY to that property, so the
// certification corpus emits the high-weight *in-content contextual* cross-property
// links that a footer or a "Related references" block can't provide. This is the
// cross-property complement to AutoLink (which handles internal cert concepts):
// AutoLink keeps a term inside heavymetalcertified.com; this plugin sends the
// authority OUT to the owned sibling it names, which is the SEO/answer-engine
// signal that fuses the ICS network into one authority cluster.
//
// FIREWALL DIRECTIONS (CLAUDE.md Part 2 / project_ics_multivertical_architecture):
// every direction this plugin emits is an ALLOWED one —
//   cert -> index (heavymetalindex.com)      : the literature baseline, cited one way
//   cert -> ICS   (contaminantstandards.com) : the parent institution / operator
// The one forbidden direction in the network (index -> cert) does not originate
// here and is guarded on the index side. This plugin therefore has no forbidden
// target; the cert site is free to point at its evidence base and its parent.
//
// Kept as a SEPARATE transformer from autolink.ts on purpose: external sibling
// links are a different concern from internal concept links, they need different
// anchor attributes (absolute href, target, rel), and keeping them apart lets the
// internal autolink vocabulary evolve without touching cross-property policy.
//
// PRECISION FIRST (this is a defensibility-critical corpus):
//   - Only fully-unambiguous property names. "Heavy Metal Index" and "Institute
//     of Contaminant Standards" have exactly one referent in food-safety prose.
//     The cert site's OWN names ("Heavy Metal Tested", "Heavy Metal Certified")
//     are deliberately absent — they must never link out.
//   - First mention per target per page only (no over-linking).
//   - Never double-links: if the page already links that URL (a Related block, a
//     frontmatter reference, an inline link), the term is left as text.
//   - Skips headings, existing links, and code.
const TERMS: Record<string, string> = {
  "heavy metal index": "https://heavymetalindex.com",
  "institute of contaminant standards": "https://contaminantstandards.com",
}

const SKIP_TAGS = new Set(["a", "code", "pre", "kbd", "script", "style", "h1", "h2", "h3", "h4", "h5", "h6"])

// Collect every external URL the page already links, so we never add a second
// link to a property a Related block or inline link already points at.
function collectLinkedUrls(node: any, into: Set<string>): void {
  if (node?.type === "element") {
    if (node.tagName === "a" && typeof node.properties?.href === "string") {
      const href = node.properties.href as string
      if (/^https?:/.test(href)) into.add(canonicalHost(href))
    }
    for (const c of node.children ?? []) collectLinkedUrls(c, into)
  }
}

// Reduce a URL to its registrable host so heavymetalindex.com and
// heavymetalindex.com/metals/lead count as the same already-linked property.
function canonicalHost(url: string): string {
  const m = url.match(/^https?:\/\/([^/?#]+)/i)
  return m ? m[1].toLowerCase().replace(/^www\./, "") : url.toLowerCase()
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

export const CrossPropertyLink: QuartzTransformerPlugin = () => {
  return {
    name: "CrossPropertyLink",
    htmlPlugins() {
      const terms = Object.keys(TERMS)
      // Longest term first so the more specific name wins if two ever overlap.
      terms.sort((a, b) => b.length - a.length)
      const pattern = new RegExp(
        `\\b(${terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\b`,
        "gi",
      )

      return [
        () => (tree: Root, file: any) => {
          const curSlug = (file.data.slug ?? "") as string
          if (curSlug.startsWith("tags/")) return

          const alreadyLinked = new Set<string>()
          collectLinkedUrls(tree, alreadyLinked) // respect existing links (Related blocks, inline)

          walk(tree, false, (textNode: Text): ElementContent[] | null => {
            const value = textNode.value
            pattern.lastIndex = 0
            const parts: ElementContent[] = []
            let last = 0
            let any = false
            let m: RegExpExecArray | null
            while ((m = pattern.exec(value)) !== null) {
              const url = TERMS[m[1].toLowerCase()]
              if (!url) continue
              const host = canonicalHost(url)
              if (alreadyLinked.has(host)) continue // page already links this property
              if (m.index > last) parts.push({ type: "text", value: value.slice(last, m.index) })
              parts.push({
                type: "element",
                tagName: "a",
                properties: {
                  href: url,
                  target: "_blank",
                  // dofollow (never nofollow) so link equity flows to the sibling;
                  // noopener WITHOUT noreferrer so the cross-property referral
                  // signal reaches the destination — these are owned properties.
                  rel: "noopener",
                  className: ["crosslink-external"],
                },
                children: [{ type: "text", value: m[0] }],
              })
              alreadyLinked.add(host) // first mention per property per page
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
