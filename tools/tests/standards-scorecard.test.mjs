import test from "node:test"
import assert from "node:assert/strict"
import { evaluateClaimSurface, loadCompiledRecords, numericCeiling } from "../lib/claim-surface.mjs"
import {
  classifyEmpty, leftoverNumerics, productionDoi, runScorecard,
} from "../standards-scorecard.mjs"

const REPO = process.cwd()

test("living SCORECARD: no empty claim-surface cell still carries a disclosed numeric", () => {
  const compiled = loadCompiledRecords(`${REPO}/data/standards`)
  const leftovers = []
  for (const row of compiled) {
    const ev = evaluateClaimSurface(row)
    for (const analyte of ev.claim_empty) {
      const cell = row.cells[analyte]
      assert.equal(numericCeiling(cell), null, `${row.slug} ${analyte} still has numericCeiling`)
      const hits = leftoverNumerics(cell)
      if (hits.length) leftovers.push(`${row.slug}:${analyte} ${hits.join(";")}`)
      assert.equal(classifyEmpty(cell).bucket, "hard-blocker", `${row.slug} ${analyte} classified convertible`)
    }
  }
  assert.deepEqual(leftovers, [])
})

test("chocolate DOI HOLD: Sn/Al/Cr empty, cert_doi null, mint stays HOLD", () => {
  const compiled = loadCompiledRecords(`${REPO}/data/standards`)
  const choc = compiled.find((r) => r.slug === "chocolate")
  assert.ok(choc, "chocolate compiled record exists")
  const ev = evaluateClaimSurface(choc)
  assert.equal(ev.complete, false)
  assert.deepEqual(ev.claim_empty, ["Sn", "Al", "Cr"])
  assert.equal(productionDoi("chocolate", `${REPO}/content/standards`), null)
  assert.equal(ev.species_parent_hits.length, 0)
})

test("scorecard writer: 0 convertibles, 0 incomplete minted, live DOI on COMPLETE, mint=HOLD", () => {
  const { stats, scorecard, blockers } = runScorecard({ repo: REPO, quiet: true, write: false })
  assert.equal(stats.convertible, 0)
  assert.equal(stats.incompleteMinted, 0)
  assert.equal(stats.complete, 265)
  assert.equal(stats.incomplete, 58)
  assert.equal(stats.claimEmpty, 174)
  assert.equal(stats.hard, 174)
  assert.equal(stats.ready, 255)
  assert.equal(stats.registered, 255)
  assert.deepEqual(stats.chocolate.claim_empty, ["Sn", "Al", "Cr"])
  assert.equal(stats.chocolate.doi, null)
  assert.match(scorecard, /mint=HOLD/)
  assert.match(scorecard, /Chocolate DOI HOLD/)
  assert.match(scorecard, /USER-RUN only/)
  assert.match(scorecard, /Convertible leftovers \(disclosed number still unpublished\) \| 0/)
  assert.match(scorecard, /what would unlock the next convertible batch/)
  assert.match(blockers, /What unlocks the next convertible batch/)
  assert.match(blockers, /Convertible leftovers: \*\*0\*\*/)
})
