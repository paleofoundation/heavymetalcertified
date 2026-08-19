// dedash.mjs — the shared em-dash → colon/comma transform.
//
// The sitewide language rule (docs/design-canon/CONTENT-RULES.md §7, "Avoid em
// dashes"; the Index docs/writing-style agreement, which holds for ALL projects):
// use commas, semicolons, colons, periods, or parentheticals instead. Em dashes
// are permitted only inside direct quotes and citation text.
//
// This module is the single source of the transform so every emission path shares
// it: the content-layer sweep (tools/dedash-content.mjs, over content/**/*.md) and
// the JSON-LD metadata sweep (tools/postbuild-cert-dedash-jsonld.mjs, over the
// schema.org graphs injected into built HTML). Callers own their own masking of
// exempt spans (citation rows, code, citation subtrees); this module only rewrites
// the em dashes it is handed.

// A spaced em dash: the em dash char (or &mdash;) with any surrounding spaces/&nbsp;.
export const DASH = /(?:\s|&nbsp;)*(?:—|&mdash;)(?:\s|&nbsp;)*/g
// After a single em dash, these openings read as a continuation → a comma, not a
// colon (the dominant "term — expansion" case).
const CONT = /^(and|but|so|or|nor|yet|including|with|because|though|although)\b/i

// Rewrite every em dash in `text` to context-appropriate punctuation:
//   • paired em dashes in one clause (a parenthetical aside) → commas
//   • a single em dash → a colon by default, or a comma before a coordinating
//     conjunction / continuation
//   • a standalone ">—<" (a "no value" cell placeholder) is left exactly as is
export function dedashText(text) {
  const ms = [...text.matchAll(DASH)]
  if (!ms.length) return text
  const skip = ms.map((m) => text[m.index - 1] === ">" && text[m.index + m[0].length] === "<")
  const paired = new Array(ms.length).fill(false)
  for (let i = 0; i + 1 < ms.length; i++) {
    if (paired[i] || skip[i]) continue
    let j = i + 1
    while (j < ms.length && skip[j]) j++ // pair against the next NON-placeholder dash
    if (j >= ms.length) break
    const endA = ms[i].index + ms[i][0].length
    const startB = ms[j].index
    const between = text.slice(endA, startB)
    // Two dashes in one clause (no sentence break or tag between) read as a
    // parenthetical aside → set it off with commas. Window is wide enough to catch
    // a long regulator-list parenthetical.
    if (startB - endA < 200 && !/[.;:!?<>]/.test(between)) {
      paired[i] = true
      paired[j] = true
    }
  }
  let out = ""
  let last = 0
  ms.forEach((m, i) => {
    let rep
    if (skip[i]) rep = m[0] // placeholder — unchanged
    else {
      const after = text.slice(m.index + m[0].length)
      rep = paired[i] ? ", " : CONT.test(after) ? ", " : ": "
    }
    out += text.slice(last, m.index) + rep
    last = m.index + m[0].length
  })
  return out + text.slice(last)
}
