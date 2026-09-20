import test from "node:test"
import assert from "node:assert/strict"
import {
  buildRegister,
  snapshotFromRegister,
  apaCite,
  DOI_SUFFIX,
  HOUSE_PREFIX,
  ZENODO_VERSION_DOI,
  readExistingHouseDoi,
  CITATION_TITLE,
} from "../lib/cat1-manual-v3.mjs"
import { renderManualV3Body } from "../lib/manual-v3-page.mjs"
import { wordCount, sentenceCount, HERO_DEK_MAX_WORDS } from "../lib/design-tokens.mjs"

test("Cat-1 register enumerates every live page and compiled orphan", () => {
  const reg = buildRegister()
  assert.equal(reg.pages.length, 9)
  assert.ok(reg.orphans.some((o) => o.slug === "mixed-meals-rice-containing"))
  for (const o of reg.orphans) {
    assert.equal(o.cert_ready, false)
    assert.match(o.hold_reason, /not joined/)
    assert.equal(o.cert_doi, null)
  }
  for (const p of reg.pages) {
    assert.match(p.href, /^\/standards\//)
    assert.ok(p.cert_doi === null || p.cert_doi.startsWith(`${HOUSE_PREFIX}/`))
    if (!p.cert_ready) assert.ok(p.hold_reason)
  }
})

test("snapshot is Method v2 / live pages, not the stale 9-analyte Strictest-ML card", () => {
  const snap = snapshotFromRegister()
  const joined = snap.snapshot.map((r) => `${r.k}:${r.v}`).join(" | ")
  assert.match(joined, /Live standard pages/)
  assert.match(joined, /v2\.0 gov_floor/)
  assert.doesNotMatch(joined, /9 analytes|Strictest government ML|2026-08-06/)
})

test("house suffix is descriptive; APA cite does not invent a DOI", () => {
  assert.equal(DOI_SUFFIX, "hmtc.manual.infant-and-child-foods")
  const bare = apaCite(null)
  assert.match(bare, new RegExp(CITATION_TITLE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")))
  assert.doesNotMatch(bare, /doi\.org/)
  const withDoi = apaCite(`${HOUSE_PREFIX}/${DOI_SUFFIX}`)
  assert.match(withDoi, new RegExp(`https://doi.org/${HOUSE_PREFIX}/${DOI_SUFFIX}`))
  assert.equal(ZENODO_VERSION_DOI.startsWith("10.83138"), false)
  const existing = readExistingHouseDoi()
  if (existing) assert.match(existing, /^10\.83138\//)
})

test("Cat-1 body is lead + airy principles; no invented DOI; no MaxPoL ladder", () => {
  const html = renderManualV3Body()
  assert.match(html, /class="hmtc-manual-lead"/)
  assert.match(html, /class="hmtc-principle-card"/)
  assert.match(html, /class="hmtc-section"/)
  assert.doesNotMatch(html, /10\.83138\/hmtc\.manual/)
  assert.doesNotMatch(html, /MaxPoL|A–E ladder|A-E ladder/)
  const dek = "The Method v2 governing instrument for Category 1."
  assert.ok(wordCount(dek) <= HERO_DEK_MAX_WORDS)
  assert.equal(sentenceCount(dek), 1)
})
