// every-lot-claim.mjs — routine "every lot is tested" claims are false for this program.
//
// Licensees retest on the program retest schedule. They are not required to test
// every lot, and public copy must not say that they do or that a record exists
// for every lot. A Remediation row may still require every lot to be tested
// after a failure until the product is cleared. That sentence or table row is
// the only allowed context.

const PHRASES = [
  /tested on every lot/giu,
  /(?<![\p{L}\p{N}_-])tested every lot/giu,
  /every lot is tested/giu,
  /each lot is tested/giu,
]

function contextWindow(text, index) {
  const lineStart = text.lastIndexOf("\n", index - 1) + 1
  const lineEndIdx = text.indexOf("\n", index)
  const lineEnd = lineEndIdx === -1 ? text.length : lineEndIdx
  const line = text.slice(lineStart, lineEnd)
  if (line.trim().startsWith("|")) return line
  const before = text.slice(0, index)
  const cuts = [before.lastIndexOf(". "), before.lastIndexOf("\n"), before.lastIndexOf("! ")]
  const sentStart = Math.max(...cuts) + 1
  let sentEnd = text.length
  for (const sep of [". ", ".\n", "\n"]) {
    const at = text.indexOf(sep, index)
    if (at !== -1) sentEnd = Math.min(sentEnd, at + 1)
  }
  return text.slice(sentStart, sentEnd)
}

export function routineEveryLotHits(text) {
  const hits = []
  if (!text) return hits
  for (const source of PHRASES) {
    const rx = new RegExp(source.source, source.flags)
    let m
    while ((m = rx.exec(text))) {
      if (!m[0]) break
      const window = contextWindow(text, m.index)
      if (/\bremediation\b/i.test(window)) continue
      const line = text.slice(0, m.index).split("\n").length
      hits.push({
        phrase: m[0],
        line,
        window: window.replace(/\s+/g, " ").trim().slice(0, 200),
      })
    }
  }
  return hits
}
