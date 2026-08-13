import { QuartzTransformerPlugin } from "../types"
import { Root, Element, ElementContent, Text } from "hast"

// Build-time: folds the "## Frequently asked questions" section's question
// headings into collapsed `<details class="qa">` accordions — the canonical v3
// FAQ pattern (a burgundy "+" that becomes "−" on open; the glyph is a CSS
// ::before on an empty .mk span, styled in proof-design.scss).
//
// Ported from the Heavy Metal Index (quartz/plugins/transformers/
// collapsibleQuestions.ts). ONE deliberate change for the cert: the index folds
// EVERY question-style <h3> site-wide, because on the index question headings
// only ever appear under an FAQ section. On the cert, the synthesis articles use
// question-phrased <h3> headings as ordinary narrative section headings, so a
// blanket fold would silently collapse 20-plus articles. This version instead
// folds ONLY the <h3> questions that live inside a "## Frequently asked
// questions" (<h2>) section — matching both the authored FAQ convention and the
// task's intent ("fold the FAQ section into the canonical accordion").
//
// Why build-time and not a client script: the collapsible AND its answer must be
// in the static HTML so (1) crawlers/LLM bots see the answer without clicking,
// and (2) postbuild-cert-faq-jsonld.mjs can read the `data-hmi-faq` markup and
// emit FAQPage structured data. Native <details> needs no JavaScript, so nothing
// has to ship through the layout (avoiding the layout-un-ships-scripts trap).
//
// The emitted markup reproduces the exact contract the postbuild parses:
//   <details class="qa" data-hmi-faq="1" data-anchor=ID data-question=TEXT>
//     <summary><span class="mk"></span>QUESTION</summary>
//     <div class="ans" data-hmi-faq-answer="1"> …section body… </div>
//   </details>
// The .mk span is intentionally empty: its "+"/"−" glyph is a CSS ::before, so
// the collapsed/open state is a style concern, not markup the extractor reads.
//
// Registered after GitHubFlavoredMarkdown (rehype-slug) and CrawlLinks so the
// question <h3> already carries its slug id and any inline links are resolved.

const HEADINGS = new Set(["h1", "h2", "h3"])
const FAQ_HEADING = /^frequently asked questions$/i

function textOf(node: ElementContent | Root): string {
  if (node.type === "text") return (node as Text).value
  if ("children" in node && node.children) {
    return (node.children as ElementContent[]).map(textOf).join("")
  }
  return ""
}

function isFaqSectionHeading(node: ElementContent): node is Element {
  return (
    node.type === "element" &&
    node.tagName === "h2" &&
    FAQ_HEADING.test(textOf(node).trim())
  )
}

function isQuestionHeading(node: ElementContent): node is Element {
  return (
    node.type === "element" &&
    node.tagName === "h3" &&
    textOf(node).trim().endsWith("?")
  )
}

// Fold each question-h3 (plus the flow content that follows it, up to the next
// heading) in `children` into a `<details class="qa">`. `children` is the slice
// of nodes that make up the FAQ section body — never the whole document.
function foldQuestions(children: ElementContent[]): ElementContent[] {
  const out: ElementContent[] = []
  for (let i = 0; i < children.length; i++) {
    const node = children[i]
    if (!isQuestionHeading(node)) {
      out.push(node)
      continue
    }
    const h3 = node as Element
    const questionText = textOf(h3).trim()
    const anchor =
      typeof h3.properties?.id === "string" ? (h3.properties.id as string) : undefined

    // Gather the answer body: siblings until the next heading.
    const body: ElementContent[] = []
    let j = i + 1
    while (j < children.length) {
      const sib = children[j]
      if (sib.type === "element" && HEADINGS.has((sib as Element).tagName)) break
      body.push(sib)
      j++
    }
    i = j - 1

    // The summary keeps the h3's own inline children (so the heading's autolink
    // anchor and any inline formatting survive), preceded by the marker.
    const summary: Element = {
      type: "element",
      tagName: "summary",
      properties: {},
      children: [
        // Empty marker; the "+"/"−" glyph is drawn by CSS (.qa summary .mk::before).
        { type: "element", tagName: "span", properties: { className: ["mk"], "aria-hidden": "true" }, children: [] },
        ...(h3.children as ElementContent[]),
      ],
    }
    const ans: Element = {
      type: "element",
      tagName: "div",
      properties: { className: ["ans"], "data-hmi-faq-answer": "1" },
      children: body,
    }
    const details: Element = {
      type: "element",
      tagName: "details",
      properties: {
        className: ["qa"],
        "data-hmi-faq": "1",
        ...(anchor ? { "data-question": questionText, "data-anchor": anchor, id: anchor } : { "data-question": questionText }),
      },
      children: [summary, ans],
    }
    out.push(details)
  }
  return out
}

// Locate the "Frequently asked questions" <h2> among a container's children and
// fold the question-h3 items in its section (the run of siblings up to the next
// <h2>). Recurses first so a nested container is handled, though in practice the
// FAQ heading sits at the content root's top level.
function transform(node: Root | Element): void {
  if (!("children" in node) || !node.children) return
  const children = node.children as ElementContent[]
  for (const child of children) {
    if (child.type === "element") transform(child as Element)
  }

  const faqIdx = children.findIndex(isFaqSectionHeading)
  if (faqIdx === -1) return

  // Section body: everything after the FAQ <h2> up to (but not including) the
  // next <h2>. The <h2> heading itself is left in place.
  let end = faqIdx + 1
  while (end < children.length) {
    const n = children[end]
    if (n.type === "element" && (n as Element).tagName === "h2") break
    end++
  }
  const section = children.slice(faqIdx + 1, end)
  if (!section.some(isQuestionHeading)) return

  const folded = foldQuestions(section)
  children.splice(faqIdx + 1, end - (faqIdx + 1), ...(folded as typeof children))
}

export const CollapsibleQuestions: QuartzTransformerPlugin = () => {
  return {
    name: "CollapsibleQuestions",
    htmlPlugins() {
      return [
        () => (tree: Root) => {
          transform(tree)
        },
      ]
    },
  }
}
