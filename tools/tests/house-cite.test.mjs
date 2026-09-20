import test from "node:test"
import assert from "node:assert/strict"
import { houseApaCite, houseFooterCite, houseDoiUrl, normalizeHouseDoi, HOUSE_COPYRIGHT } from "../lib/house-cite.mjs"

const DOI = "10.83138/hmtc.manual.infant-and-child-foods"
const TITLE = "Infant and Child Foods: HMTc Program Manual"

test("house APA cite emits Standard No. + doi.org when cert_doi is set", () => {
  assert.equal(
    houseApaCite({ title: TITLE, year: "2026", doi: DOI }),
    `Pendergrass, K. (2026). ${TITLE} (Standard No. ${DOI}). Institute of Contaminant Standards. https://doi.org/${DOI}`,
  )
  assert.doesNotMatch(houseApaCite({ title: TITLE, doi: DOI }), /heavymetalcertified\.com|registration pending|CC BY/i)
})

test("house APA cite never invents a DOI or page URL", () => {
  const bare = houseApaCite({ title: TITLE, year: "2026", doi: null })
  assert.equal(bare, `Pendergrass, K. (2026). ${TITLE}. Institute of Contaminant Standards.`)
  assert.equal(normalizeHouseDoi(null), null)
  assert.equal(normalizeHouseDoi("null"), null)
  assert.equal(houseDoiUrl(""), null)
})

test("house footer cite uses Standard No. + doi.org, never the page URL", () => {
  const line = houseFooterCite({
    label: "Heavy Metal Certified  ·  Infant and Child Foods Program Manual",
    edition: "Manual v3",
    doi: DOI,
  })
  assert.match(line, new RegExp(`Standard No\\. ${DOI}`))
  assert.match(line, new RegExp(`https://doi.org/${DOI}`))
  assert.match(line, /All rights reserved/)
  assert.doesNotMatch(line, /heavymetalcertified\.com|CC BY/i)
  assert.match(HOUSE_COPYRIGHT, /All rights reserved/)
})
