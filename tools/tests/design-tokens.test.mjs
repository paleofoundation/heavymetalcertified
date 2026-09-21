import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import {
  SPACE,
  SPACE_SCALE,
  SECTION_GAP,
  MANUAL_SECTION_GAP,
  TABLE_CELL_PAD_Y,
  TABLE_CELL_PAD_MIN,
  HERO_DEK_MAX_WORDS,
  HERO_DEK_MAX_SENTENCES,
  LEAD_MAX_SENTENCES,
  wordCount,
  sentenceCount,
} from "../lib/design-tokens.mjs"
import {
  lintHeroDek,
  lintManualLead,
  lintManualSections,
  lintTokenCss,
  lintStandardsHaveNoManualCover,
} from "../lib/manual-density-lint.mjs"

test("spacing scale is locked 8/16/24/48/72", () => {
  assert.deepEqual(SPACE_SCALE, [8, 16, 24, 48, 72])
  assert.equal(SPACE[1], 8)
  assert.equal(SECTION_GAP, 48)
  assert.equal(MANUAL_SECTION_GAP, 72)
  assert.ok(TABLE_CELL_PAD_Y >= TABLE_CELL_PAD_MIN)
})

test("tokens.scss matches the JS scale", () => {
  const css = fs.readFileSync(new URL("../../quartz/styles/tokens.scss", import.meta.url), "utf8")
  assert.equal(lintTokenCss(css).length, 0)
})

test("hero kill-gate: current Cat-1 dek passes; a pile fails", () => {
  const ok = "The Infant and Child Foods Program Manual for Category 1: published limits, lot testing, and the Cat-1 register."
  assert.ok(wordCount(ok) <= HERO_DEK_MAX_WORDS)
  assert.ok(sentenceCount(ok) <= HERO_DEK_MAX_SENTENCES)
  assert.equal(lintHeroDek(ok, "ok.md").length, 0)
  const methodFirst = "The Method v2 governing instrument for Category 1."
  assert.ok(lintHeroDek(methodFirst, "method.md").length >= 1)
  const pile = "Manual v3: the Method v2 governing instrument for Category 1, Infant and Child Foods (ages 0–5). Standards register, lot-testing schedule, and the five Governing Principles. Also a third sentence of contents."
  assert.ok(lintHeroDek(pile, "pile.md").length >= 1)
})

test("lead kill-gate: two sentences pass; three fail", () => {
  const ok = "This Manual states how Category 1 infant and child foods are certified: published limits, lot testing, and the stay-in-program gate. It binds the live subcategory pages; they remain the derivation of each cell."
  const html = `<p class="hmtc-manual-lead">${ok}</p>`
  assert.equal(lintManualLead(html, "ok.md", { required: true }).length, 0)
  const pile = `<p class="hmtc-manual-lead">One. Two. Three extra.</p>`
  assert.ok(lintManualLead(pile, "pile.md").length >= 1)
})

test("manuals sections fail below the token floor", () => {
  const tight = `<section style="margin-bottom:12px"><h2 id="x">X</h2></section>`
  const hits = lintManualSections(tight, "tight.md")
  assert.ok(hits.some((h) => /token floor/.test(h) || /missing class/.test(h)))
  const ok = `<section class="hmtc-section"><h2 id="x">X</h2></section>`
  assert.equal(lintManualSections(ok, "ok.md").length, 0)
})

test("standards pages may not carry a PDF cover", () => {
  const dirty = `<div class="hmtc-manual-cover"><img alt="x"></div>`
  assert.ok(lintStandardsHaveNoManualCover(dirty, "content/standards/x.md").length >= 1)
  assert.equal(lintStandardsHaveNoManualCover("<section class=\"hmtc-section\">", "content/standards/x.md").length, 0)
})
