import test from "node:test"
import assert from "node:assert/strict"
import {
  houseApaCite,
  houseFooterCite,
  houseDoiUrl,
  normalizeHouseDoi,
  isManualCite,
  HOUSE_COPYRIGHT,
} from "../lib/house-cite.mjs"

const MANUAL_DOI = "10.83138/hmtc.manual.infant-and-child-foods"
const MANUAL_TITLE = "Infant and Child Foods: HMTc Program Manual"
const STD_DOI = "10.83138/hmtc.std.30.olive-oil"
const STD_TITLE = "Olive oil: HMTc standard"

test("manual APA cite is title + publisher + doi.org when cert_doi is set; never Standard No.", () => {
  const locked =
    `Pendergrass, K. (2026). ${MANUAL_TITLE}. Institute of Contaminant Standards. https://doi.org/${MANUAL_DOI}`
  assert.equal(houseApaCite({ title: MANUAL_TITLE, year: "2026", doi: MANUAL_DOI, kind: "manual" }), locked)
  assert.equal(houseApaCite({ title: MANUAL_TITLE, year: "2026", doi: MANUAL_DOI }), locked)
  const inferred = houseApaCite({ title: MANUAL_TITLE, doi: MANUAL_DOI })
  assert.doesNotMatch(inferred, /Standard No\.|Manual No\./)
  assert.doesNotMatch(inferred, /heavymetalcertified\.com|registration pending|CC BY/i)
  assert.ok(isManualCite({ kind: "manual", doi: MANUAL_DOI, title: MANUAL_TITLE }))
})

test("standards APA cite still emits Standard No. + doi.org when cert_doi is set", () => {
  assert.equal(
    houseApaCite({ title: STD_TITLE, year: "2026", doi: STD_DOI, kind: "standard" }),
    `Pendergrass, K. (2026). ${STD_TITLE} (Standard No. ${STD_DOI}). Institute of Contaminant Standards. https://doi.org/${STD_DOI}`,
  )
  assert.equal(isManualCite({ kind: "standard", doi: STD_DOI, title: STD_TITLE }), false)
})

test("house APA cite never invents a DOI or page URL", () => {
  const bare = houseApaCite({ title: MANUAL_TITLE, year: "2026", doi: null, kind: "manual" })
  assert.equal(bare, `Pendergrass, K. (2026). ${MANUAL_TITLE}. Institute of Contaminant Standards.`)
  assert.equal(normalizeHouseDoi(null), null)
  assert.equal(normalizeHouseDoi("null"), null)
  assert.equal(houseDoiUrl(""), null)
})

test("manual footer cite uses doi.org only; never Standard No. or the page URL", () => {
  const line = houseFooterCite({
    label: "Heavy Metal Certified  ·  Infant and Child Foods Program Manual",
    edition: "Manual v3",
    doi: MANUAL_DOI,
    kind: "manual",
  })
  assert.doesNotMatch(line, /Standard No\.|Manual No\./)
  assert.match(line, new RegExp(`https://doi.org/${MANUAL_DOI}`))
  assert.match(line, /All rights reserved/)
  assert.doesNotMatch(line, /heavymetalcertified\.com|CC BY/i)
  assert.match(HOUSE_COPYRIGHT, /All rights reserved/)
})

test("standards footer cite still uses Standard No. + doi.org", () => {
  const line = houseFooterCite({
    label: "Heavy Metal Certified",
    edition: STD_TITLE,
    doi: STD_DOI,
    kind: "standard",
  })
  assert.match(line, new RegExp(`Standard No\\. ${STD_DOI}`))
  assert.match(line, new RegExp(`https://doi.org/${STD_DOI}`))
})
