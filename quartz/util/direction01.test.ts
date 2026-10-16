import { test } from "node:test"
import assert from "node:assert/strict"
import { applyDirection01 } from "./direction01"
import type { Root } from "hast"

test("recolor inline presentation without changing words, DOI, SEO or identity marks", () => {
  const tree: Root = { type: "root", children: [
    { type: "element", tagName: "a", properties: { style: "color:#9f2727;background:#fffdfb", href: "https://doi.org/10.5281/zenodo.20771543", id: "source" }, children: [{type:"text",value:"Limit 20 ppb; #9f2727 stays literal in prose"}] },
    { type: "element", tagName: "meta", properties: { name: "description", content: "Published limits #9f2727" }, children: [] },
    { type: "element", tagName: "path", properties: { fill: "#A6CE39" }, children: [] },
  ] }
  const before=structuredClone(tree)
  applyDirection01(tree)
  assert.equal((tree.children[0] as any).properties.style, "color:var(--hmtc-navy);background:var(--hmtc-paper)")
  ;(before.children[0] as any).properties.style=(tree.children[0] as any).properties.style
  assert.deepEqual(tree,before)
  applyDirection01(tree)
  assert.deepEqual(tree,before)
})
