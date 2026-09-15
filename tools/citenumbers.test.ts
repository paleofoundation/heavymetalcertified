import test from "node:test"
import assert from "node:assert/strict"
import { unified } from "unified"
import remarkParse from "remark-parse"
import remarkRehype from "remark-rehype"
import rehypeRaw from "rehype-raw"
import { visit } from "unist-util-visit"
import type { Element } from "hast"
import type { BuildCtx } from "../quartz/util/ctx"
import { SuperscriptCitations } from "../quartz/plugins/transformers/citenumbers"

test("grouped citations become individual controls while protected text and ranges remain untouched", () => {
  const processor = unified().use(remarkParse).use(remarkRehype, { allowDangerousHtml: true }).use(rehypeRaw)
    .use(SuperscriptCitations().htmlPlugins!({} as BuildCtx))
  const input = 'Claims [4, 5] and [3,7], with ordinary [2].\n\n`Code [8, 9]` and [link [10, 11]](https://example.org).\n\n<div data-no-cite>Opt out [12, 13].</div>\n\n<span>[14]</span>\n\nRanges [15–17] and words [18, unknown] are not groups.'
  const tree = processor.runSync(processor.parse(input))
  const markers: string[] = []
  visit(tree, "element", (node: Element) => {
    if (node.tagName === "sup" && node.properties.className?.toString().includes("hmtc-cite")) {
      markers.push(node.children.map(child => child.type === "text" ? child.value : "").join(""))
    }
  })
  assert.deepEqual(markers, ["[4]", "[5]", "[3]", "[7]", "[2]"])
})
