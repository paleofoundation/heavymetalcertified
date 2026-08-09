import { QuartzTransformerPlugin } from "../types"
import { visit } from "unist-util-visit"
import { Root, Element, Text, Parent } from "hast"

// Inline numeric citations across the site are authored as plain text markers
// like `[1]`, `[12]`, `[140]`. This transformer wraps each *embedded* marker in
// `<sup class="hmtc-cite">` so citations render superscripted sitewide, while
// leaving reference-list markers, links, code, and opted-out regions untouched.

// Elements whose text must never be treated as a citation marker.
const SKIP_TAGS = new Set([
  "code",
  "pre",
  "a",
  "sup",
  "sub",
  "script",
  "style",
  "kbd",
  "samp",
  "time",
])

// A bracketed 1–3 digit number embedded in prose: the citation marker.
const CITE_RE = /\[(\d{1,3})\]/g
// A text node that is ONLY a bracketed number (e.g. the "[1]" cell of a
// hand-authored reference list) — a marker, not an inline citation. Left alone.
const STANDALONE_RE = /^\s*\[\d{1,3}\]\s*$/

export const SuperscriptCitations: QuartzTransformerPlugin = () => {
  return {
    name: "SuperscriptCitations",
    htmlPlugins() {
      return [
        () => {
          return (tree: Root) => {
            // Pass 1 — collect every text node inside a skip-tag or a
            // `data-no-cite` subtree (bibliography blocks, tool chrome, any
            // section that opts out). These are never rewritten.
            const skip = new WeakSet<Text>()
            visit(tree, "element", (el: Element) => {
              const tag = (el.tagName ?? "").toLowerCase()
              const optedOut = (el.properties ?? {}).dataNoCite !== undefined
              if (SKIP_TAGS.has(tag) || optedOut) {
                visit(el, "text", (t: Text) => skip.add(t))
              }
            })

            // Pass 2 — rewrite embedded [n] markers into superscripts.
            visit(tree, "text", (node: Text, index, parent) => {
              if (index == null || parent == null) return
              if (skip.has(node)) return
              const value = node.value
              if (!value.includes("[")) return
              if (STANDALONE_RE.test(value)) return
              CITE_RE.lastIndex = 0
              if (!CITE_RE.test(value)) return

              const parts: Array<Text | Element> = []
              let last = 0
              CITE_RE.lastIndex = 0
              let m: RegExpExecArray | null
              while ((m = CITE_RE.exec(value)) !== null) {
                if (m.index > last) {
                  parts.push({ type: "text", value: value.slice(last, m.index) })
                }
                parts.push({
                  type: "element",
                  tagName: "sup",
                  properties: { className: ["hmtc-cite"] },
                  children: [{ type: "text", value: `[${m[1]}]` }],
                })
                last = m.index + m[0].length
              }
              if (last < value.length) {
                parts.push({ type: "text", value: value.slice(last) })
              }
              if (parts.length <= 1) return

              const p = parent as Parent
              p.children.splice(index, 1, ...parts)
              return index + parts.length
            })
          }
        },
      ]
    },
  }
}
