import { QuartzTransformerPlugin } from "../types"
import { Root, Element, ElementContent, Text } from "hast"

// Build-time: folds a questions-and-answers section's question headings into
// collapsed `<details class="qa">` accordions — the canonical v3 FAQ pattern (a
// burgundy "+" that becomes "−" on open; the glyph is a CSS ::before on an empty
// .mk span, styled in proof-design.scss).
//
// Ported from the Heavy Metal Index. ONE deliberate difference from the index:
// the index folds EVERY question-style <h3> site-wide, because on the index
// question headings only ever appear under an FAQ section. On the cert, the
// synthesis articles use question-phrased <h3> headings as ordinary narrative
// section headings, so a blanket fold would silently collapse 20-plus articles.
//
// This version therefore folds a section's question-<h3>s only when the section's
// own <h2> NAMES itself a questions section, so the fold tracks authorial intent
// rather than heading punctuation:
//
//   - Literal FAQ heading ("## Frequently asked questions"): folded whenever the
//     section contains at least one question-<h3>. This is the original, exact
//     behaviour and the ~34 briefing/article/why-we-limit FAQs rely on it.
//   - Broad questions heading (an <h2> whose text carries the word "questions" or
//     "FAQ" — e.g. "Questions brands ask before entering", "Common questions"):
//     folded only when the section is PREDOMINANTLY questions (at least two
//     question-<h3>s, and questions are at least half of the section's <h3>s).
//     The majority guard means a narrative section that merely mentions questions
//     ("Why heavy metals are a retailer question") is never folded — such a
//     section has no question-<h3>s, so the guard fails and the section is left
//     verbatim. It also leaves alone a "Common questions" section authored as
//     raw-HTML .hmtc-faq accordions (no markdown question-<h3>s to fold).
//
// The name gate is what keeps this safe on the cert: a synthesis article's
// narrative "## How exposure happens" section keeps its question-phrased <h3>s
// as headings, because its <h2> does not name a questions section.
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
// Exact legacy trigger — unconditional fold, preserved byte-for-byte.
const FAQ_LITERAL = /^frequently asked questions$/i
// Broad trigger — any <h2> that names itself a questions/FAQ section. Requires
// the plural "questions" (or "FAQ"/"FAQs") as a whole word, so a narrative
// heading using the singular "question" does not match; the section is then also
// held to the majority-questions structural guard below.
const FAQ_BROAD = /\b(questions|faqs?)\b/i

function textOf(node: ElementContent | Root): string {
  if (node.type === "text") return (node as Text).value
  if ("children" in node && node.children) {
    return (node.children as ElementContent[]).map(textOf).join("")
  }
  return ""
}

// Classify an <h2> as a questions-section heading: "literal" for the exact FAQ
// heading (legacy behaviour), "broad" for any other questions/FAQ heading, or
// null for anything that is not an <h2> questions heading.
function faqHeadingMode(node: ElementContent): "literal" | "broad" | null {
  if (node.type !== "element" || (node as Element).tagName !== "h2") return null
  const t = textOf(node).trim()
  if (FAQ_LITERAL.test(t)) return "literal"
  if (FAQ_BROAD.test(t)) return "broad"
  return null
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
// of nodes that make up the questions-section body — never the whole document.
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

// Decide whether a questions-section should be folded, given its mode and the
// question/h3 makeup of its body. Literal FAQ sections fold on a single question
// (legacy). Broad sections fold only when predominantly questions.
function shouldFold(mode: "literal" | "broad", section: ElementContent[]): boolean {
  const h3Count = section.filter(
    (n) => n.type === "element" && (n as Element).tagName === "h3",
  ).length
  const qCount = section.filter(isQuestionHeading).length
  if (mode === "literal") return qCount >= 1
  return qCount >= 2 && qCount * 2 >= h3Count
}

// Walk a container's children, folding the question-h3 items inside every
// questions-section (each headed by an <h2> that faqHeadingMode recognises, up to
// the next <h2>). Recurses first so nested containers are handled, though in
// practice the FAQ heading sits at the content root's top level. Handles any
// number of questions-sections in one container; the <h2> headings stay in place.
function transform(node: Root | Element): void {
  if (!("children" in node) || !node.children) return
  const children = node.children as ElementContent[]
  for (const child of children) {
    if (child.type === "element") transform(child as Element)
  }

  const out: ElementContent[] = []
  for (let i = 0; i < children.length; i++) {
    const heading = children[i]
    const mode = faqHeadingMode(heading)
    if (!mode) {
      out.push(heading)
      continue
    }

    // Section body: everything after this <h2> up to (but not including) the
    // next <h2>. The <h2> heading itself is left in place.
    let end = i + 1
    while (end < children.length) {
      const n = children[end]
      if (n.type === "element" && (n as Element).tagName === "h2") break
      end++
    }
    const section = children.slice(i + 1, end)

    out.push(heading)
    out.push(...(shouldFold(mode, section) ? foldQuestions(section) : section))
    i = end - 1
  }

  children.splice(0, children.length, ...out)
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
