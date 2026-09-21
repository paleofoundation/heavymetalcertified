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
  HERO_DEK,
  LEAD,
  SCHOLAR_ABSTRACT,
} from "../lib/cat1-manual-v3.mjs"
import { renderManualV3Body, renderManualV3Page } from "../lib/manual-v3-page.mjs"
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

test("register counts stay available for the register and PDF, not the hero snapshot", () => {
  const snap = snapshotFromRegister()
  assert.equal(snap.live_pages, 9)
  assert.ok(snap.cert_ready <= snap.live_pages)
  const joined = snap.snapshot.map((r) => `${r.k}:${r.v}`).join(" | ")
  assert.match(joined, /Live standard pages/)
  assert.match(joined, /v2\.0 gov_floor/)
  assert.doesNotMatch(joined, /9 analytes|Strictest government ML|2026-08-06/)
})

test("Cat-1 Manual v3 frontmatter omits the hero page snapshot", () => {
  const page = renderManualV3Page({
    title: "Infant and Child Foods: HMTc Program Manual",
    category: 1,
    manualSlug: "infant-and-child-foods",
    categoryName: "Infant and Child Foods",
    description: HERO_DEK,
    heroSnapshot: false,
    snapshot: [{ k: "Live standard pages", v: "9" }],
    connections: [{ label: "The standards register", href: "/standards" }],
    railBody: "Manual v3 current.",
    effectiveDate: "2026-09-19",
    updated: "2026-09-19",
    certDoi: "10.83138/hmtc.manual.infant-and-child-foods",
  })
  const fm = page.slice(0, page.indexOf("\n---", 3) + 4)
  assert.match(fm, /^hero_snapshot: false$/m)
  assert.doesNotMatch(fm, /^snapshot:/m)
  assert.doesNotMatch(fm, /Live standard pages/)
  assert.doesNotMatch(fm, /Cert-ready/)
  assert.match(page, /10\.83138\/hmtc\.manual\.infant-and-child-foods/)
})

test("house suffix is descriptive; APA cite uses Standard No. + doi.org when cert_doi is set", () => {
  assert.equal(DOI_SUFFIX, "hmtc.manual.infant-and-child-foods")
  const bare = apaCite(null)
  assert.match(bare, new RegExp(CITATION_TITLE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")))
  assert.doesNotMatch(bare, /doi\.org|Standard No\.|heavymetalcertified\.com/)
  const doi = `${HOUSE_PREFIX}/${DOI_SUFFIX}`
  const withDoi = apaCite(doi)
  assert.equal(
    withDoi,
    `Pendergrass, K. (2026). ${CITATION_TITLE} (Standard No. ${doi}). Institute of Contaminant Standards. https://doi.org/${doi}`,
  )
  assert.doesNotMatch(withDoi, /heavymetalcertified\.com|registration pending|CC BY/i)
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
  assert.ok(wordCount(HERO_DEK) <= HERO_DEK_MAX_WORDS)
  assert.equal(sentenceCount(HERO_DEK), 1)
  assert.doesNotMatch(HERO_DEK, /Method v2 governing instrument/i)
  assert.match(html, /Infant and Child Foods|Category 1/)
  assert.doesNotMatch(html, /Method v2 governing instrument/i)
  assert.match(LEAD, /Category 1 infant and child foods/)
  assert.doesNotMatch(LEAD, /Method v2 governing instrument/i)
})

test("Scholar abstract is 150–250 words and does not name MaxPoL", () => {
  const words = wordCount(SCHOLAR_ABSTRACT)
  assert.ok(words >= 150, `scholar abstract ${words} words < 150`)
  assert.ok(words <= 250, `scholar abstract ${words} words > 250`)
  assert.match(SCHOLAR_ABSTRACT, /^The Infant and Child Foods Program Manual/)
  assert.doesNotMatch(SCHOLAR_ABSTRACT, /Method v2 governing instrument/i)
  assert.match(SCHOLAR_ABSTRACT, /Manual v3/)
  assert.match(SCHOLAR_ABSTRACT, /Method v2/)
  assert.match(SCHOLAR_ABSTRACT, /heavymetalcertified\.com\/program\/method/)
  assert.match(SCHOLAR_ABSTRACT, /Category 1/)
  assert.match(SCHOLAR_ABSTRACT, /Institute of Contaminant Standards/)
  assert.match(SCHOLAR_ABSTRACT, /10\.83138\/hmtc\.manual\.infant-and-child-foods/)
  assert.match(SCHOLAR_ABSTRACT, /100 percent/)
  assert.match(SCHOLAR_ABSTRACT, /government floor/)
  assert.match(SCHOLAR_ABSTRACT, /read-across/)
  assert.match(SCHOLAR_ABSTRACT, /Lot Testing Schedule/)
  assert.match(SCHOLAR_ABSTRACT, /90 percent/)
  assert.match(SCHOLAR_ABSTRACT, /Standards Register/)
  assert.doesNotMatch(SCHOLAR_ABSTRACT, /MaxPoL|CC BY/i)
})

test("house write-back cite is APA Standard No. with doi.org and All rights reserved", () => {
  const doi = `${HOUSE_PREFIX}/${DOI_SUFFIX}`
  const html = renderManualV3Body({ certDoi: doi })
  assert.match(html, new RegExp(`Standard No\\. ${doi.replace(/\//g, "\\/")}`))
  assert.match(html, new RegExp(`https://doi.org/${doi.replace(/\//g, "\\/")}`))
  assert.match(html, /All rights reserved/)
  assert.doesNotMatch(html, /CC BY|registration pending|does not invent that DOI|after CEO PASS/i)
  assert.doesNotMatch(html, /heavymetalcertified\.com\/manuals\//)
})
