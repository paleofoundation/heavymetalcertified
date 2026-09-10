import test from "node:test"
import assert from "node:assert/strict"
import {
  cellState, numericCeiling, isRiceInfantCereal, isRiceCerealCanary, requiredClaimSurface,
  evaluateClaimSurface, isBannedLimitText, classifyPanelHeader,
  analyteKeyFromLabel, parseMasterLimitRows, claimSurfaceFailReason,
} from "../lib/claim-surface.mjs"

test("subsumed + value:null is EMPTY, not COMPLETE", () => {
  assert.equal(cellState({ type: "subsumed", value: null, provenance: "subsumed", subsumed_by: "tAs" }), "EMPTY")
  assert.equal(cellState({ type: "monitored", value: null }), "EMPTY")
  assert.equal(cellState({ type: "control", value: null }), "EMPTY")
  assert.equal(cellState({ type: "not_material", value: null }), "EMPTY")
  assert.equal(cellState(null), "EMPTY")
})

test("firm numeric value is COMPLETE; parent-only inheritance is not", () => {
  assert.equal(cellState({ type: "gov", value: 20 }), "firm")
  assert.equal(cellState({ type: "read_across", value: 20 }), "firm")
  assert.equal(cellState({ type: "subsumed", value: null, binding_total: 50 }), "firm")
  assert.equal(numericCeiling({ type: "subsumed", value: null, subsumed_by: "tAs" }), null)
})

test("rice / baby-cereal detection excludes non-rice and non-cereal infant goods", () => {
  assert.equal(isRiceInfantCereal("rice-bulk-grain"), true)
  assert.equal(isRiceInfantCereal("baby-cereals-dry-rice-based"), true)
  assert.equal(isRiceInfantCereal("baby-cereals-dry"), true)
  assert.equal(isRiceInfantCereal("breakfast-cereal-rice-based"), true)
  assert.equal(isRiceInfantCereal("flour-non-rice"), false)
  assert.equal(isRiceInfantCereal("breakfast-cereal-non-rice"), false)
  assert.equal(isRiceInfantCereal("infant-clothing"), false)
  assert.equal(isRiceInfantCereal("dentifrices"), false)
  assert.equal(isRiceInfantCereal("vinegar"), false)
  assert.equal(isRiceInfantCereal("vinegar", "Vinegar (distilled, wine, balsamic, cider, rice)"), false)
  assert.equal(isRiceCerealCanary("plant-milks-rice-based"), false)
  assert.equal(isRiceCerealCanary("rice-bulk-grain"), true)
  assert.equal(isRiceCerealCanary("baby-cereals-dry-rice-based"), true)
})

test("rice/infant cereal requires numeric iAs on the claim surface", () => {
  const rice = requiredClaimSurface("rice-bulk-grain", { iAs: { type: "subsumed", value: null } })
  assert.ok(rice.includes("iAs"))
  const ev = evaluateClaimSurface({
    slug: "rice-bulk-grain",
    cells: { Pb: { value: 200 }, tAs: { value: 300 }, Cd: { value: 100 }, tHg: { value: 20 }, Ni: { value: 1500 }, Sn: { value: 250000 }, Al: { value: 100000 }, Cr: { value: 1000 }, iAs: { type: "subsumed", value: null } },
  })
  assert.equal(ev.complete, false)
  assert.equal(ev.rice_missing_ias, true)
  assert.equal(claimSurfaceFailReason(ev), "rice/infant cereal missing numeric iAs")
})

test("rice with numeric iAs and eight totals is COMPLETE even if MeHg is subsumed-null", () => {
  const ev = evaluateClaimSurface({
    slug: "rice-bulk-grain",
    cells: {
      Pb: { value: 200 }, tAs: { value: 300 }, Cd: { value: 100 }, tHg: { value: 20 },
      Ni: { value: 1500 }, Sn: { value: 250000 }, Al: { value: 100000 }, Cr: { value: 1000 },
      iAs: { type: "gov", value: 150 }, MeHg: { type: "subsumed", value: null },
    },
    panel: ["Pb", "iAs", "tAs", "tHg", "MeHg", "Cd", "Cr", "Ni", "Sn", "Al"],
  })
  assert.equal(ev.complete, true)
  assert.equal(ev.rice_missing_ias, false)
  assert.ok(ev.empty_cells.includes("MeHg"))
  assert.deepEqual(ev.claim_empty, [])
})

test("banned LIMIT tokens include monitored, subsumed, dashes, n/a, empty", () => {
  assert.equal(isBannedLimitText("monitored"), "monitored")
  assert.equal(isBannedLimitText("subsumed"), "subsumed")
  assert.equal(isBannedLimitText("bounded"), "bounded")
  assert.equal(isBannedLimitText("n/a"), "n/a")
  assert.equal(isBannedLimitText("n/m"), "n/m")
  assert.equal(isBannedLimitText("—"), "dashes")
  assert.equal(isBannedLimitText("&mdash;"), "dashes")
  assert.equal(isBannedLimitText(""), "empty")
  assert.equal(isBannedLimitText("  "), "empty")
  assert.equal(isBannedLimitText("≤ parent total"), "subsumed")
  assert.equal(isBannedLimitText("150"), null)
  assert.equal(isBannedLimitText("≤ 150"), null)
})

test("incomplete panel headers: 7/8 and N/M published-limit fail; rice N-of-M below required fails", () => {
  const a = classifyPanelHeader("7/8 analytes with a published limit", { slug: "rice-bulk-grain" })
  assert.ok(a.some((h) => h.kind === "fail"))
  const b = classifyPanelHeader("7 of 8 analytes with a published limit", { slug: "x" })
  assert.ok(b.some((h) => h.kind === "fail" && h.pattern === "published-limit"))
  const c = classifyPanelHeader("9 of 11 analytes carry a firm ceiling", { slug: "rice-bulk-grain" })
  assert.equal(c.filter((h) => h.kind === "fail").length, 0)
  const d = classifyPanelHeader("7 of 11 analytes carry a firm ceiling", { slug: "rice-bulk-grain" })
  assert.ok(d.some((h) => h.kind === "fail"))
  const e = classifyPanelHeader("5 of 11 analytes carry a firm ceiling", { slug: "salt" })
  assert.ok(e.some((h) => h.kind === "warn"))
  const f = classifyPanelHeader("5 of 11 analytes carry a firm ceiling", { slug: "plant-milks-rice-based" })
  assert.ok(f.every((h) => h.kind === "warn"))
})

test("Master Limit Table parser reads the HMTc limit column", () => {
  const html = `<section id="limits"><p>9 of 11 analytes carry a firm ceiling</p>
    <table><tr><td>Lead (Pb)</td><td>Tier 1</td><td>200</td><td>gov</td></tr>
    <tr><td>Inorganic arsenic (iAs)</td><td>Tier 1</td><td>bounded</td><td>subsumed</td></tr></table></section>`
  const { header, rows } = parseMasterLimitRows(html)
  assert.match(header, /9 of 11/)
  assert.equal(analyteKeyFromLabel("Lead (Pb)"), "Pb")
  const iAs = rows.find((r) => r.key === "iAs")
  assert.equal(iAs.limit, "bounded")
  assert.equal(isBannedLimitText(iAs.limit), "bounded")
})
